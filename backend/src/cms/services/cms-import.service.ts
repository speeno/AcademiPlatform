import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CmsContentStatus,
  CmsContentType,
} from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require('adm-zip');
import { PrismaService } from '../../common/prisma/prisma.service';
import { CmsAccessService } from './cms-access.service';
import { CmsStorageService } from './cms-storage.service';

interface ChapterManifest {
  chapter_id: string;
  title: string;
  chunk_ids?: string[];
  content_scope?: Record<string, unknown>;
}

/**
 * 강의 패키지(ZIP) 임포트와 패키지 에셋 스트리밍 책임.
 * - chapters.json 기반 파싱, S3 업로드, ContentItem/Version 동기화.
 * - 패키지 전용 storageKey(`cms/pkg/...`) 보호 및 권한 검증을 담당한다.
 */
@Injectable()
export class CmsImportService {
  constructor(
    private prisma: PrismaService,
    private access: CmsAccessService,
    private storage: CmsStorageService,
  ) {}

  async getPackageAssetFile(
    storageKey: string,
    lessonId: string,
    userId: string,
  ) {
    if (!storageKey || !lessonId) {
      throw new BadRequestException('storageKey와 lessonId가 필요합니다.');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, isPreview: true },
    });
    if (!lesson) throw new NotFoundException('레슨을 찾을 수 없습니다.');

    const canRead = await this.access.canReadPublishedCourse(
      userId,
      lesson.courseId,
      lesson.isPreview,
    );
    if (!canRead)
      throw new ForbiddenException('해당 에셋을 열람할 권한이 없습니다.');

    if (!storageKey.startsWith('cms/pkg/')) {
      throw new ForbiddenException('허용되지 않는 storageKey 접근입니다.');
    }

    const buffer = await this.storage.readBuffer(storageKey);

    let mimeType = 'application/octet-stream';
    if (storageKey.endsWith('.mp4')) mimeType = 'video/mp4';
    else if (storageKey.endsWith('.vtt')) mimeType = 'text/vtt';
    else if (storageKey.endsWith('.png')) mimeType = 'image/png';
    else if (storageKey.endsWith('.jpg') || storageKey.endsWith('.jpeg'))
      mimeType = 'image/jpeg';

    return { buffer, mimeType };
  }

  async processCoursePackageUpload(
    lessonId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string },
  ) {
    if (!file) throw new BadRequestException('ZIP 파일이 필요합니다.');
    const { courseId } = await this.access.ensureCanEditLesson(userId, lessonId);

    const zip = new AdmZip(file.buffer);
    const entries = zip.getEntries();

    const chaptersEntry = entries.find(
      (e: any) =>
        !e.isDirectory &&
        (e.entryName === 'chapters.json' ||
          e.entryName.endsWith('/chapters.json')),
    );
    if (!chaptersEntry)
      throw new BadRequestException(
        'ZIP 내 chapters.json 파일이 없습니다. 올바른 강의 패키지를 업로드하세요.',
      );

    let chapters: ChapterManifest[];
    try {
      chapters = JSON.parse(chaptersEntry.getData().toString('utf-8'));
    } catch {
      throw new BadRequestException('chapters.json 파싱에 실패했습니다.');
    }

    const basePath = chaptersEntry.entryName.replace('chapters.json', '');
    this.storage.ensureBucket('스토리지 버킷이 설정되지 않았습니다.');

    const pkgPrefix = `cms/pkg/${courseId}/${lessonId}/${Date.now()}`;

    const findEntry = (relativePath: string) =>
      entries.find(
        (e: any) =>
          !e.isDirectory &&
          (e.entryName === `${basePath}${relativePath}` ||
            e.entryName === relativePath),
      );

    const tocEntry = findEntry('toc_confirmed.txt');
    const tocText = tocEntry ? tocEntry.getData().toString('utf-8') : '';
    const lmsMetaEntry = findEntry('outputs/lms_metadata.json');
    let lmsMetadata: Record<string, unknown> = {};
    if (lmsMetaEntry) {
      try {
        lmsMetadata = JSON.parse(lmsMetaEntry.getData().toString('utf-8'));
      } catch {
        /* skip invalid */
      }
    }

    const chapterData: Array<Record<string, unknown>> = [];

    for (const ch of chapters) {
      const chId = ch.chapter_id;
      const chapterDir = `${chId}/`;

      const videoEntry = findEntry(`${chapterDir}chapter_loudnorm.mp4`);
      let videoStorageKey: string | null = null;
      if (videoEntry) {
        videoStorageKey = await this.storage.uploadBuffer(
          `${pkgPrefix}/${chId}/chapter_loudnorm.mp4`,
          videoEntry.getData(),
          'video/mp4',
        );
      }

      const vttEntry = findEntry(`${chapterDir}subtitle.vtt`);
      const subtitleVtt = vttEntry
        ? vttEntry.getData().toString('utf-8')
        : null;
      let subtitleStorageKey: string | null = null;
      if (vttEntry) {
        subtitleStorageKey = await this.storage.uploadBuffer(
          `${pkgPrefix}/${chId}/subtitle.vtt`,
          vttEntry.getData(),
          'text/vtt',
        );
      }

      const scriptEntry = findEntry(`${chapterDir}script.json`);
      let script: Record<string, unknown> = {};
      if (scriptEntry) {
        try {
          script = JSON.parse(scriptEntry.getData().toString('utf-8'));
        } catch {
          /* skip */
        }
      }

      const quizEntry = findEntry(`${chapterDir}quiz.json`);
      let quiz: Record<string, unknown> = {};
      if (quizEntry) {
        try {
          quiz = JSON.parse(quizEntry.getData().toString('utf-8'));
        } catch {
          /* skip */
        }
      }

      const slidesManifestEntry = findEntry(
        `${chapterDir}slides_manifest.json`,
      );
      let slidesManifest: Record<string, unknown> = {};
      const slideStorageKeys: Array<{
        fileName: string;
        storageKey: string;
      }> = [];
      if (slidesManifestEntry) {
        try {
          slidesManifest = JSON.parse(
            slidesManifestEntry.getData().toString('utf-8'),
          );
        } catch {
          /* skip */
        }

        const slideEntries = entries.filter(
          (e: any) =>
            !e.isDirectory &&
            (e.entryName.startsWith(`${basePath}${chapterDir}slides/`) ||
              e.entryName.startsWith(`${chapterDir}slides/`)) &&
            e.entryName.endsWith('.png'),
        );
        for (const se of slideEntries) {
          const fileName = se.entryName.split('/').pop() || 'slide.png';
          const key = await this.storage.uploadBuffer(
            `${pkgPrefix}/${chId}/slides/${fileName}`,
            se.getData(),
            'image/png',
          );
          slideStorageKeys.push({ fileName, storageKey: key });
        }
      }

      const briefEntry = findEntry(`chapter_briefs/${chId}.json`);
      let brief: Record<string, unknown> = {};
      if (briefEntry) {
        try {
          brief = JSON.parse(briefEntry.getData().toString('utf-8'));
        } catch {
          /* skip */
        }
      }

      chapterData.push({
        chapterId: chId,
        title: ch.title,
        videoStorageKey,
        subtitleStorageKey,
        subtitleVtt,
        script,
        quiz,
        slidesManifest,
        slideStorageKeys,
        brief,
      });
    }

    const schemaJson = {
      packageId: `pkg_${Date.now()}`,
      chapters: chapterData,
      toc: tocText,
      lmsMetadata,
    };

    const existing = await this.prisma.contentItem.findUnique({
      where: { lessonId },
    });
    const nextVersionNo = (existing?.latestVersionNo ?? 0) + 1;

    const item = await this.prisma.contentItem.upsert({
      where: { lessonId },
      create: {
        courseId,
        lessonId,
        contentType: CmsContentType.COURSE_PACKAGE,
        status: CmsContentStatus.DRAFT,
        latestVersionNo: nextVersionNo,
        createdById: userId,
        updatedById: userId,
      },
      update: {
        contentType: CmsContentType.COURSE_PACKAGE,
        latestVersionNo: nextVersionNo,
        status: CmsContentStatus.DRAFT,
        updatedById: userId,
      },
    });

    const version = await this.prisma.contentVersion.create({
      data: {
        itemId: item.id,
        versionNo: nextVersionNo,
        schemaJson: JSON.parse(JSON.stringify(schemaJson)),
        changeNote: `강의 패키지 업로드 (${chapters.length}개 챕터)`,
        createdById: userId,
      },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'COURSE_PACKAGE_UPLOADED',
        payloadJson: {
          versionNo: nextVersionNo,
          chapterCount: chapters.length,
          fileName: file.originalname ?? 'package.zip',
        },
      },
    });

    return {
      item,
      version: { id: version.id, versionNo: version.versionNo },
      chapters: chapterData.map((c) => ({
        chapterId: c.chapterId,
        title: c.title,
        hasVideo: !!c.videoStorageKey,
        hasSubtitle: !!c.subtitleStorageKey,
        hasScript: !!Object.keys(c.script as Record<string, unknown>).length,
        hasQuiz: !!Object.keys(c.quiz as Record<string, unknown>).length,
      })),
    };
  }
}
