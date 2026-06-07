import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  CmsContentType,
  LessonType,
  PrismaClient,
  CourseStatus,
} from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE = (process.env.API_BASE ?? 'https://academiplatform.onrender.com/api').replace(
  /\/+$/,
  '',
);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@academiq.kr';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const EXPORT_PATH =
  process.env.EXPORT_PATH ??
  resolve(process.cwd(), 'debug/harness-courses-export.json');
const SLUG_PREFIX = process.env.HARNESS_SLUG_PREFIX ?? 'harness-';

type ExportedLessonContent = {
  contentType: CmsContentType;
  schemaJson: Record<string, unknown>;
  changeNote?: string | null;
};

type ExportedLesson = {
  title: string;
  lessonType: LessonType;
  description: string | null;
  sortOrder: number;
  isPreview: boolean;
  content: ExportedLessonContent | null;
};

type ExportedModule = {
  title: string;
  sortOrder: number;
  lessons: ExportedLesson[];
};

type ExportedAssignment = {
  title: string;
  description: string | null;
  dueAt: string | null;
  allowResubmit: boolean;
  allowLateSubmit: boolean;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
};

type ExportedCourse = {
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  status: CourseStatus;
  price: number;
  basePrice: number;
  modules: ExportedModule[];
  assignments: ExportedAssignment[];
};

type HarnessCoursesBundle = {
  version: 1;
  exportedAt: string;
  courses: ExportedCourse[];
};

type RemoteLesson = {
  id: string;
  title: string;
  lessonType: LessonType;
  description: string | null;
  sortOrder: number;
  isPreview: boolean;
};

type RemoteModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: RemoteLesson[];
};

type RemoteCourse = {
  id: string;
  slug: string;
  title: string;
  modules: RemoteModule[];
};

type RemoteAssignment = {
  id: string;
  title: string;
};

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function login(): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`login failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { accessToken: string };
  const profile = await api<{ id: string }>('/auth/me', data.accessToken);
  return { token: data.accessToken, userId: profile.id };
}

function createLocalPrisma() {
  const url = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('SOURCE_DATABASE_URL 또는 DATABASE_URL이 필요합니다.');
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

async function exportLocalHarnessCourses(): Promise<HarnessCoursesBundle> {
  const prisma = createLocalPrisma();
  try {
    const courses = await prisma.course.findMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
      orderBy: { slug: 'asc' },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              include: {
                contentItem: {
                  include: {
                    versions: {
                      orderBy: { versionNo: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        assignments: { orderBy: { createdAt: 'asc' } },
      },
    });

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      courses: courses.map((course) => ({
        title: course.title,
        slug: course.slug,
        description: course.description,
        summary: course.summary,
        thumbnailUrl: course.thumbnailUrl,
        category: course.category,
        tags: course.tags,
        status: course.status,
        price: course.price,
        basePrice: course.basePrice,
        modules: course.modules.map((module) => ({
          title: module.title,
          sortOrder: module.sortOrder,
          lessons: module.lessons.map((lesson) => {
            const latest = lesson.contentItem?.versions[0];
            return {
              title: lesson.title,
              lessonType: lesson.lessonType,
              description: lesson.description,
              sortOrder: lesson.sortOrder,
              isPreview: lesson.isPreview,
              content: latest
                ? {
                    contentType: lesson.contentItem!.contentType,
                    schemaJson:
                      latest.schemaJson && typeof latest.schemaJson === 'object'
                        ? (latest.schemaJson as Record<string, unknown>)
                        : { html: '' },
                    changeNote: latest.changeNote,
                  }
                : null,
            };
          }),
        })),
        assignments: course.assignments.map((assignment) => ({
          title: assignment.title,
          description: assignment.description,
          dueAt: assignment.dueAt?.toISOString() ?? null,
          allowResubmit: assignment.allowResubmit,
          allowLateSubmit: assignment.allowLateSubmit,
          maxFileSizeMb: assignment.maxFileSizeMb,
          allowedFileTypes: assignment.allowedFileTypes,
        })),
      })),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function findRemoteCourseBySlug(
  token: string,
  slug: string,
): Promise<{ id: string } | null> {
  const list = await api<{ courses: Array<{ id: string; slug: string }> }>(
    `/courses/admin/list?search=${encodeURIComponent(slug)}&limit=50`,
    token,
  );
  return list.courses.find((course) => course.slug === slug) ?? null;
}

async function ensureRemoteCourse(
  token: string,
  instructorId: string,
  course: ExportedCourse,
): Promise<string> {
  const existing = await findRemoteCourseBySlug(token, course.slug);
  const payload = {
    title: course.title,
    slug: course.slug,
    description: course.description ?? undefined,
    summary: course.summary ?? undefined,
    thumbnailUrl: course.thumbnailUrl ?? undefined,
    category: course.category ?? undefined,
    tags: course.tags,
    price: course.price,
    status: course.status,
    instructorId,
  };

  if (existing) {
    await api(`/courses/admin/${existing.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return existing.id;
  }

  const created = await api<{ id: string }>('/courses/admin', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return created.id;
}

async function getRemoteCourseTree(token: string, courseId: string): Promise<RemoteCourse> {
  return api<RemoteCourse>(`/courses/admin/${courseId}`, token);
}

async function syncModulesAndLessons(
  token: string,
  courseId: string,
  localCourse: ExportedCourse,
): Promise<{ lessonsSynced: number; contentSynced: number }> {
  const remote = await getRemoteCourseTree(token, courseId);
  const remoteModulesByTitle = new Map(remote.modules.map((module) => [module.title, module]));
  const usedModuleIds = new Set<string>();
  let lessonsSynced = 0;
  let contentSynced = 0;

  for (const localModule of localCourse.modules) {
    let remoteModule = remoteModulesByTitle.get(localModule.title);
    if (!remoteModule) {
      const created = await api<{ id: string; title: string; sortOrder: number; lessons: [] }>(
        `/courses/admin/${courseId}/modules`,
        token,
        { method: 'POST', body: JSON.stringify({ title: localModule.title }) },
      );
      remoteModule = { ...created, lessons: [] };
      remoteModulesByTitle.set(localModule.title, remoteModule);
    }

    usedModuleIds.add(remoteModule.id);
    if (remoteModule.sortOrder !== localModule.sortOrder) {
      await api(`/courses/admin/${courseId}/modules/${remoteModule.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          title: localModule.title,
          sortOrder: localModule.sortOrder,
        }),
      });
    }

    const remoteLessonsByTitle = new Map(
      remoteModule.lessons.map((lesson) => [lesson.title, lesson]),
    );
    const usedLessonIds = new Set<string>();

    for (const localLesson of localModule.lessons) {
      let remoteLesson = remoteLessonsByTitle.get(localLesson.title);
      if (!remoteLesson) {
        remoteLesson = await api<RemoteLesson>(
          `/courses/admin/modules/${remoteModule.id}/lessons`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              title: localLesson.title,
              lessonType: localLesson.lessonType,
              description: localLesson.description ?? undefined,
              sortOrder: localLesson.sortOrder,
              isPreview: localLesson.isPreview,
            }),
          },
        );
        remoteLessonsByTitle.set(localLesson.title, remoteLesson);
      } else {
        await api(`/courses/admin/modules/${remoteModule.id}/lessons/${remoteLesson.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            title: localLesson.title,
            lessonType: localLesson.lessonType,
            description: localLesson.description ?? undefined,
            sortOrder: localLesson.sortOrder,
            isPreview: localLesson.isPreview,
          }),
        });
      }

      usedLessonIds.add(remoteLesson.id);
      lessonsSynced += 1;

      if (localLesson.content) {
        await api(`/cms/lessons/${remoteLesson.id}/content`, token, {
          method: 'POST',
          body: JSON.stringify({
            contentType: localLesson.content.contentType ?? CmsContentType.HTML,
            schemaJson: localLesson.content.schemaJson,
            changeNote:
              localLesson.content.changeNote ??
              `Harness 커리큘럼 API 동기화 (${localCourse.slug})`,
          }),
        });
        contentSynced += 1;
      }
    }

    for (const remoteLesson of remoteModule.lessons) {
      if (!usedLessonIds.has(remoteLesson.id)) {
        await api(`/courses/admin/modules/${remoteModule.id}/lessons/${remoteLesson.id}`, token, {
          method: 'DELETE',
        });
      }
    }
  }

  for (const remoteModule of remote.modules) {
    if (!usedModuleIds.has(remoteModule.id)) {
      await api(`/courses/admin/${courseId}/modules/${remoteModule.id}`, token, {
        method: 'DELETE',
      });
    }
  }

  return { lessonsSynced, contentSynced };
}

async function syncAssignments(
  token: string,
  courseId: string,
  localAssignments: ExportedAssignment[],
): Promise<number> {
  const remote = await api<{ assignments: RemoteAssignment[] }>(
    `/courses/admin/${courseId}/assignments`,
    token,
  );
  const remoteByTitle = new Map(
    (remote.assignments ?? []).map((assignment) => [assignment.title, assignment]),
  );
  let synced = 0;

  for (const localAssignment of localAssignments) {
    const payload = {
      title: localAssignment.title,
      description: localAssignment.description ?? undefined,
      dueAt: localAssignment.dueAt ?? undefined,
      allowResubmit: localAssignment.allowResubmit,
      allowLateSubmit: localAssignment.allowLateSubmit,
      maxFileSizeMb: localAssignment.maxFileSizeMb,
      allowedFileTypes: localAssignment.allowedFileTypes,
    };

    const existing = remoteByTitle.get(localAssignment.title);
    if (existing) {
      await api(`/courses/admin/${courseId}/assignments/${existing.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await api(`/courses/admin/${courseId}/assignments`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    synced += 1;
  }

  return synced;
}

async function verifyRemote(token: string, slugs: string[]) {
  for (const slug of slugs) {
    const course = await findRemoteCourseBySlug(token, slug);
    if (!course) {
      console.log(`  [검증 실패] ${slug}: 없음`);
      continue;
    }
    const tree = await getRemoteCourseTree(token, course.id);
    const lessonCount = tree.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    console.log(`  [검증] ${slug}: modules=${tree.modules.length}, lessons=${lessonCount}`);
  }
}

async function main() {
  const bundle = await exportLocalHarnessCourses();
  if (bundle.courses.length === 0) {
    throw new Error(`로컬 DB에 ${SLUG_PREFIX}* 교육과정이 없습니다.`);
  }

  mkdirSync(dirname(EXPORT_PATH), { recursive: true });
  writeFileSync(EXPORT_PATH, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`로컬 export: ${bundle.courses.length}개 → ${EXPORT_PATH}`);

  const { token, userId } = await login();
  console.log(`API 동기화 대상: ${API_BASE} (admin=${ADMIN_EMAIL})`);

  for (const course of bundle.courses) {
    const courseId = await ensureRemoteCourse(token, userId, course);
    const { lessonsSynced, contentSynced } = await syncModulesAndLessons(
      token,
      courseId,
      course,
    );
    const assignmentsSynced = await syncAssignments(token, courseId, course.assignments);
    console.log(
      `✓ ${course.slug}: modules=${course.modules.length}, lessons=${lessonsSynced}, content=${contentSynced}, assignments=${assignmentsSynced}`,
    );
  }

  console.log('원격 검증:');
  await verifyRemote(
    token,
    bundle.courses.map((course) => course.slug),
  );
  console.log('Harness 교육과정 API 동기화 완료');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
