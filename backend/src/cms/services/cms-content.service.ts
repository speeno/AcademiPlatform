import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CmsCollaboratorRole,
  CmsContentStatus,
  CmsContentType,
  EnrollmentStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CmsAccessService } from './cms-access.service';
import { CmsStorageService } from './cms-storage.service';

/**
 * CMS 콘텐츠 CRUD/공개/에셋 관리.
 * - 강좌 트리 조회, 협업자/오너 관리, 레슨 콘텐츠 저장/조회/롤백/이력.
 * - 게시본(Published) 레슨 조회 및 에셋 다운로드 책임도 함께 가진다.
 * - 검수 워크플로(`CmsReviewService`)·패키지 임포트(`CmsImportService`)와 분리.
 */
@Injectable()
export class CmsContentService {
  constructor(
    private prisma: PrismaService,
    private access: CmsAccessService,
    private storage: CmsStorageService,
  ) {}

  async getMyCourses(userId: string) {
    const role = await this.access.getUserRole(userId);
    const where =
      role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN
        ? {}
        : role === UserRole.INSTRUCTOR
          ? { cmsOwnerId: userId }
          : { id: '__no_access__' };

    return this.prisma.course.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        instructorId: true,
        cmsOwnerId: true,
        instructor: { select: { id: true, name: true, email: true } },
        cmsOwner: { select: { id: true, name: true, email: true } },
        _count: { select: { modules: true } },
      },
    });
  }

  async getCourseTree(courseId: string, userId: string) {
    await this.access.ensureCanEditCourse(userId, courseId);
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        instructorId: true,
        cmsOwnerId: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            sortOrder: true,
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                lessonType: true,
                sortOrder: true,
                contentItem: {
                  select: {
                    id: true,
                    contentType: true,
                    status: true,
                    latestVersionNo: true,
                    publishedVersionNo: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
        cmsCollaborators: {
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('강좌를 찾을 수 없습니다.');
    return course;
  }

  async upsertCollaborator(
    courseId: string,
    targetUserId: string,
    role: CmsCollaboratorRole,
    operatorId: string,
  ) {
    await this.access.assertOperator(operatorId);
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('강좌를 찾을 수 없습니다.');

    return this.prisma.courseCmsCollaborator.upsert({
      where: { courseId_userId: { courseId, userId: targetUserId } },
      create: {
        courseId,
        userId: targetUserId,
        role,
        grantedById: operatorId,
      },
      update: {
        role,
        grantedById: operatorId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async setCourseOwner(
    courseId: string,
    ownerUserId: string,
    operatorId: string,
  ) {
    await this.access.assertOperator(operatorId);
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true },
    });
    if (!user)
      throw new NotFoundException('지정한 담당 강사를 찾을 수 없습니다.');

    return this.prisma.course.update({
      where: { id: courseId },
      data: { cmsOwnerId: ownerUserId },
      select: {
        id: true,
        title: true,
        cmsOwnerId: true,
        cmsOwner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeCollaborator(
    courseId: string,
    targetUserId: string,
    operatorId: string,
  ) {
    await this.access.assertOperator(operatorId);
    await this.prisma.courseCmsCollaborator.delete({
      where: { courseId_userId: { courseId, userId: targetUserId } },
    });
    return { deleted: true };
  }

  async getLessonContent(lessonId: string, userId: string) {
    const { courseId } = await this.access.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 20,
          select: {
            id: true,
            versionNo: true,
            schemaJson: true,
            changeNote: true,
            createdAt: true,
          },
        },
        assets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            assetType: true,
            mimeType: true,
            storageKey: true,
            publicUrl: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
        reviewRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            requestedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return {
      courseId,
      lessonId,
      item,
    };
  }

  async getLessonHistory(lessonId: string, userId: string) {
    await this.access.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      select: { id: true },
    });
    if (!item) return [];

    return this.prisma.contentAuditLog.findMany({
      where: { itemId: item.id },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async saveLessonContent(
    lessonId: string,
    userId: string,
    payload: {
      contentType: CmsContentType;
      schemaJson: Record<string, any>;
      changeNote?: string;
    },
  ) {
    const { courseId } = await this.access.ensureCanEditLesson(userId, lessonId);
    const existing = await this.prisma.contentItem.findUnique({
      where: { lessonId },
    });
    const nextVersionNo = (existing?.latestVersionNo ?? 0) + 1;

    const sanitizedSchemaJson =
      payload.contentType === CmsContentType.HTML
        ? this.sanitizeHtmlSchema(payload.schemaJson)
        : (payload.schemaJson ?? {});

    const item = await this.prisma.contentItem.upsert({
      where: { lessonId },
      create: {
        courseId,
        lessonId,
        contentType: payload.contentType,
        status: CmsContentStatus.DRAFT,
        latestVersionNo: nextVersionNo,
        createdById: userId,
        updatedById: userId,
      },
      update: {
        contentType: payload.contentType,
        latestVersionNo: nextVersionNo,
        status: CmsContentStatus.DRAFT,
        updatedById: userId,
      },
    });

    const version = await this.prisma.contentVersion.create({
      data: {
        itemId: item.id,
        versionNo: nextVersionNo,
        schemaJson: sanitizedSchemaJson,
        changeNote: payload.changeNote,
        createdById: userId,
      },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'CONTENT_SAVED',
        payloadJson: {
          versionNo: nextVersionNo,
          contentType: payload.contentType,
        },
      },
    });

    return { item, version };
  }

  async rollbackLesson(
    lessonId: string,
    versionNo: number,
    operatorId: string,
  ) {
    await this.access.assertOperator(operatorId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      include: { versions: true },
    });
    if (!item) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');

    const target = item.versions.find((v) => v.versionNo === versionNo);
    if (!target) throw new NotFoundException('롤백할 버전을 찾을 수 없습니다.');

    await this.prisma.contentItem.update({
      where: { id: item.id },
      data: {
        publishedVersionNo: versionNo,
        status: CmsContentStatus.PUBLISHED,
        updatedById: operatorId,
      },
    });
    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: operatorId,
        action: 'ROLLED_BACK',
        payloadJson: { versionNo },
      },
    });
    return { rolledBackTo: versionNo };
  }

  async attachAsset(
    lessonId: string,
    userId: string,
    payload: {
      versionNo?: number;
      assetType: string;
      mimeType: string;
      storageKey?: string;
      publicUrl?: string;
      fileName?: string;
      fileSize?: number;
      metaJson?: Record<string, any>;
    },
  ) {
    await this.access.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
    });
    if (!item) throw new NotFoundException('콘텐츠를 먼저 저장해 주세요.');

    let versionId: string | undefined;
    if (payload.versionNo) {
      const version = await this.prisma.contentVersion.findUnique({
        where: {
          itemId_versionNo: { itemId: item.id, versionNo: payload.versionNo },
        },
        select: { id: true },
      });
      if (!version)
        throw new NotFoundException('지정된 버전을 찾을 수 없습니다.');
      versionId = version.id;
    }

    const asset = await this.prisma.contentAsset.create({
      data: {
        itemId: item.id,
        versionId,
        assetType: payload.assetType,
        mimeType: payload.mimeType,
        storageKey: payload.storageKey,
        publicUrl: payload.publicUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        metaJson: payload.metaJson,
        uploadedById: userId,
      },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'ASSET_ATTACHED',
        payloadJson: { assetId: asset.id, assetType: payload.assetType },
      },
    });
    return asset;
  }

  async getPublishedLessonContent(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, isPreview: true },
    });
    if (!lesson) throw new NotFoundException('레슨을 찾을 수 없습니다.');

    if (!lesson.isPreview) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.courseId } },
      });
      if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new ForbiddenException('수강 권한이 없습니다.');
      }
    }

    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      include: {
        versions: true,
        assets: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            assetType: true,
            mimeType: true,
            storageKey: true,
            publicUrl: true,
            fileName: true,
            fileSize: true,
            metaJson: true,
          },
        },
      },
    });
    if (
      !item ||
      item.status !== CmsContentStatus.PUBLISHED ||
      !item.publishedVersionNo
    ) {
      return null;
    }
    const version = item.versions.find(
      (v) => v.versionNo === item.publishedVersionNo,
    );
    if (!version) return null;

    const bucket = this.storage.getBucket();

    const assets = await Promise.all(
      item.assets.map(async (asset) => {
        let resolvedUrl = asset.publicUrl ?? null;
        if (!resolvedUrl && bucket && asset.storageKey) {
          resolvedUrl = await this.storage.getSignedDownloadUrl(asset.storageKey, 600);
        }
        return {
          ...asset,
          resolvedUrl,
        };
      }),
    );

    return {
      lessonId,
      contentType: item.contentType,
      status: item.status,
      versionNo: version.versionNo,
      schemaJson: version.schemaJson,
      assets,
    };
  }

  async getPublishedAssetFile(assetId: string, userId: string) {
    const asset = await this.prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: {
        item: {
          select: {
            status: true,
            lesson: {
              select: {
                id: true,
                title: true,
                courseId: true,
                isPreview: true,
              },
            },
          },
        },
      },
    });

    if (!asset || !asset.item?.lesson) {
      throw new NotFoundException('에셋을 찾을 수 없습니다.');
    }
    if (asset.item.status !== CmsContentStatus.PUBLISHED) {
      throw new ForbiddenException('게시되지 않은 콘텐츠 에셋입니다.');
    }

    const canRead = await this.access.canReadPublishedCourse(
      userId,
      asset.item.lesson.courseId,
      asset.item.lesson.isPreview,
    );
    if (!canRead) {
      throw new ForbiddenException('해당 에셋을 열람할 권한이 없습니다.');
    }

    let buffer: Buffer | null = null;
    if (asset.storageKey) {
      buffer = await this.storage.readBuffer(asset.storageKey);
    } else if (asset.publicUrl) {
      const response = await fetch(asset.publicUrl);
      if (!response.ok) {
        throw new NotFoundException('공개 URL 에셋을 불러오지 못했습니다.');
      }
      const data = await response.arrayBuffer();
      buffer = Buffer.from(data);
    }

    if (!buffer) {
      throw new NotFoundException('에셋 원본을 찾을 수 없습니다.');
    }

    return {
      buffer,
      fileName: asset.fileName || `${asset.item.lesson.title}.pdf`,
      mimeType: asset.mimeType || 'application/octet-stream',
    };
  }

  /**
   * HTML 콘텐츠 저장 시 XSS 위험 요소(스크립트/이벤트 핸들러/javascript: URL)를 제거.
   * - 단순 정규식 기반이므로 DOM 단계 정밀 sanitize 가 필요하면 별도 라이브러리 도입 검토.
   */
  private sanitizeHtmlSchema(
    schemaJson: Record<string, any>,
  ): Record<string, any> {
    const htmlValue =
      typeof schemaJson?.html === 'string' ? schemaJson.html : '';
    const sanitizedHtml = htmlValue
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/\shref="javascript:[^"]*"/gi, '')
      .replace(/\shref='javascript:[^']*'/gi, '')
      .replace(/\ssrc="javascript:[^"]*"/gi, '')
      .replace(/\ssrc='javascript:[^']*'/gi, '');

    return {
      ...schemaJson,
      html: sanitizedHtml,
    };
  }
}
