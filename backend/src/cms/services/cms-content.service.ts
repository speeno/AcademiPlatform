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
  LessonType,
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
    const { courseId } = await this.access.ensureCanEditLesson(
      userId,
      lessonId,
    );
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
    const { courseId } = await this.access.ensureCanEditLesson(
      userId,
      lessonId,
    );
    const existing = await this.prisma.contentItem.findUnique({
      where: { lessonId },
    });
    const nextVersionNo = (existing?.latestVersionNo ?? 0) + 1;

    const sanitizedSchemaJson =
      payload.contentType === CmsContentType.HTML
        ? this.sanitizeHtmlSchema(payload.schemaJson)
        : (payload.schemaJson ?? {});

    const { item, version } = await this.prisma.$transaction(async (tx) => {
      const upserted = await tx.contentItem.upsert({
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

      const createdVersion = await tx.contentVersion.create({
        data: {
          itemId: upserted.id,
          versionNo: nextVersionNo,
          schemaJson: sanitizedSchemaJson,
          changeNote: payload.changeNote,
          createdById: userId,
        },
      });

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          contentStatus: 'DRAFT',
          // 단일 타입 기준: 레슨 타입을 CMS 콘텐츠 타입에서 자동 동기화
          lessonType: this.contentTypeToLessonType(payload.contentType),
        },
      });

      await tx.contentAuditLog.create({
        data: {
          itemId: upserted.id,
          actorId: userId,
          action: 'CONTENT_SAVED',
          payloadJson: {
            versionNo: nextVersionNo,
            contentType: payload.contentType,
            lessonStatus: 'DRAFT',
          },
        },
      });

      return { item: upserted, version: createdVersion };
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

    await this.prisma.$transaction(async (tx) => {
      await tx.contentItem.update({
        where: { id: item.id },
        data: {
          publishedVersionNo: versionNo,
          status: CmsContentStatus.PUBLISHED,
          updatedById: operatorId,
        },
      });
      await tx.lesson.update({
        where: { id: lessonId },
        data: { contentStatus: 'PUBLISHED' },
      });
      await tx.contentAuditLog.create({
        data: {
          itemId: item.id,
          actorId: operatorId,
          action: 'ROLLED_BACK',
          payloadJson: { versionNo, lessonStatus: 'PUBLISHED' },
        },
      });
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

  /**
   * CMS contentType → 레슨 lessonType 매핑(단일 타입 기준).
   * CMS 콘텐츠 저장 시 레슨 타입을 자동 동기화해 타입 이중입력을 제거한다.
   */
  private contentTypeToLessonType(ct: CmsContentType): LessonType {
    switch (ct) {
      case CmsContentType.VIDEO_YOUTUBE:
        return LessonType.VIDEO_YOUTUBE;
      case CmsContentType.DOCUMENT:
        return LessonType.DOCUMENT;
      case CmsContentType.HTML:
        return LessonType.TEXT;
      case CmsContentType.VIDEO_MP4:
      case CmsContentType.COURSE_PACKAGE:
      default:
        return LessonType.VIDEO_UPLOAD;
    }
  }

  private normalizeContentType(value?: string): CmsContentType | undefined {
    if (!value) return undefined;
    return (Object.values(CmsContentType) as string[]).includes(value)
      ? (value as CmsContentType)
      : undefined;
  }

  /**
   * 멀티파트 직접 업로드. presigned(S3 전용) 흐름과 달리 S3/로컬 폴백 모두에서 동작한다.
   * 콘텐츠 아이템이 없으면 에셋을 붙일 수 있도록 DRAFT 로 자동 생성한다.
   */
  async uploadLessonAssetFile(
    lessonId: string,
    userId: string,
    file:
      | {
          buffer?: Buffer;
          originalname?: string;
          mimetype?: string;
          size?: number;
        }
      | undefined,
    contentTypeHint?: string,
  ) {
    const { courseId } = await this.access.ensureCanEditLesson(
      userId,
      lessonId,
    );
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('업로드할 파일이 필요합니다.');
    }

    const requestedType = this.normalizeContentType(contentTypeHint);
    const item = await this.prisma.contentItem.upsert({
      where: { lessonId },
      create: {
        courseId,
        lessonId,
        contentType: requestedType ?? CmsContentType.DOCUMENT,
        status: CmsContentStatus.DRAFT,
        latestVersionNo: 0,
        createdById: userId,
        updatedById: userId,
      },
      update: { updatedById: userId },
    });

    // 단일 타입 기준: 레슨 타입을 콘텐츠 타입에서 동기화
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { lessonType: this.contentTypeToLessonType(item.contentType) },
    });

    const safeName = (file.originalname || 'asset')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 200);
    const mimeType = file.mimetype || 'application/octet-stream';
    const storageKey = `cms/${courseId}/${lessonId}/${Date.now()}_${safeName}`;
    await this.storage.uploadBuffer(storageKey, file.buffer, mimeType);

    const asset = await this.prisma.contentAsset.create({
      data: {
        itemId: item.id,
        assetType: requestedType ?? item.contentType,
        mimeType,
        storageKey,
        fileName: file.originalname || safeName,
        fileSize: file.size ?? file.buffer.length,
        uploadedById: userId,
      },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'ASSET_UPLOADED',
        payloadJson: {
          assetId: asset.id,
          fileName: asset.fileName,
          storageKey,
        },
      },
    });

    return asset;
  }

  /** 개별 에셋 삭제(스토리지 객체 + DB 행). 편집 권한자면 가능. */
  async deleteLessonAsset(lessonId: string, assetId: string, userId: string) {
    await this.access.ensureCanEditLesson(userId, lessonId);
    const asset = await this.prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: { item: { select: { id: true, lessonId: true } } },
    });
    if (!asset || asset.item.lessonId !== lessonId) {
      throw new NotFoundException('에셋을 찾을 수 없습니다.');
    }
    if (asset.storageKey) {
      await this.storage.deleteObject(asset.storageKey);
    }
    await this.prisma.contentAsset.delete({ where: { id: asset.id } });
    await this.prisma.contentAuditLog.create({
      data: {
        itemId: asset.item.id,
        actorId: userId,
        action: 'ASSET_DELETED',
        payloadJson: { assetId, fileName: asset.fileName },
      },
    });
    return { deleted: true };
  }

  /**
   * 레슨 콘텐츠 전체 삭제(되돌릴 수 없음). 운영자 전용.
   * ContentItem 삭제 시 versions/assets/reviewRequests/auditLogs 는 cascade 로 함께 제거되며,
   * 스토리지 객체는 베스트에포트로 정리하고 레슨 상태를 DRAFT 로 되돌린다.
   */
  async deleteLessonContent(lessonId: string, operatorId: string) {
    await this.access.assertOperator(operatorId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      include: { assets: { select: { storageKey: true } } },
    });
    if (!item) return { deleted: false };

    await Promise.all(
      item.assets
        .map((a) => a.storageKey)
        .filter((key): key is string => !!key)
        .map((key) => this.storage.deleteObject(key)),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: { id: lessonId },
        data: { contentStatus: 'DRAFT' },
      });
      await tx.contentItem.delete({ where: { id: item.id } });
    });

    return { deleted: true };
  }

  /**
   * 단일 콘텐츠 리졸버 — 교실(LMS)의 유일한 콘텐츠 진입점.
   * 1) CMS 발행본(ContentItem PUBLISHED)이 있으면 그것을 반환.
   * 2) 없으면 레거시 데이터(LessonVideoAsset/유튜브/라이브/텍스트)를 같은 형태로 어댑팅.
   * 응답에 `source`('cms'|'legacy')와 `secureVideo`(HLS 보안 스트리밍 가용) 플래그를 포함해
   * 프런트가 lessonType 분기 없이 단일 switch 로 렌더할 수 있게 한다.
   */
  async getPublishedLessonContent(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
        isPreview: true,
        lessonType: true,
        description: true,
        videoAsset: {
          select: {
            sourceType: true,
            encodingStatus: true,
            youtubeUrl: true,
            hlsPlaylistUrl: true,
          },
        },
      },
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

    const hasSecureStream =
      lesson.videoAsset?.encodingStatus === 'READY' ||
      !!lesson.videoAsset?.hlsPlaylistUrl;

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
    const version =
      item && item.status === CmsContentStatus.PUBLISHED && item.publishedVersionNo
        ? item.versions.find((v) => v.versionNo === item.publishedVersionNo)
        : undefined;

    if (item && version) {
      const bucket = this.storage.getBucket();
      const assets = await Promise.all(
        item.assets.map(async (asset) => {
          let resolvedUrl = asset.publicUrl ?? null;
          if (!resolvedUrl && bucket && asset.storageKey) {
            resolvedUrl = await this.storage.getSignedDownloadUrl(
              asset.storageKey,
              600,
            );
          }
          return { ...asset, resolvedUrl };
        }),
      );

      return {
        lessonId,
        source: 'cms' as const,
        contentType: item.contentType as string,
        status: item.status as string,
        versionNo: version.versionNo,
        schemaJson: version.schemaJson,
        assets,
        secureVideo:
          item.contentType === CmsContentType.VIDEO_MP4 && hasSecureStream,
      };
    }

    // CMS 발행본이 없으면 레거시 데이터를 동일 형태로 변환(단일 렌더 경로 유지).
    return this.buildLegacyLessonContent(lesson);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private buildLegacyLessonContent(lesson: {
    id: string;
    lessonType: string;
    description: string | null;
    videoAsset: {
      sourceType: string;
      youtubeUrl: string | null;
    } | null;
  }) {
    const base = {
      lessonId: lesson.id,
      source: 'legacy' as const,
      status: 'PUBLISHED' as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assets: [] as any[],
      versionNo: 0,
    };
    const va = lesson.videoAsset;

    if (va?.sourceType === 'YOUTUBE' || va?.youtubeUrl) {
      return {
        ...base,
        contentType: 'VIDEO_YOUTUBE' as string,
        schemaJson: { youtubeUrl: va?.youtubeUrl ?? '' } as Record<string, any>,
        secureVideo: false,
      };
    }
    if (va) {
      // 레거시 업로드 영상은 보안 스트리밍 경로 사용(준비 여부는 stream-token 이 게이트).
      return {
        ...base,
        contentType: 'VIDEO_MP4' as string,
        schemaJson: {} as Record<string, any>,
        secureVideo: true,
      };
    }
    if (lesson.lessonType === 'LIVE_LINK') {
      const liveUrl =
        (lesson.description ?? '').match(/https?:\/\/[^\s"'<]+/)?.[0] ?? '';
      return {
        ...base,
        contentType: 'LIVE_LINK' as string,
        schemaJson: { liveUrl } as Record<string, any>,
        secureVideo: false,
      };
    }
    if (lesson.lessonType === 'TEXT' && lesson.description) {
      return {
        ...base,
        contentType: 'HTML' as string,
        schemaJson: {
          html: `<div style="white-space:pre-wrap;padding:16px;line-height:1.7">${this.escapeHtml(lesson.description)}</div>`,
        } as Record<string, any>,
        secureVideo: false,
      };
    }
    return null;
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
   * 편집자(운영자/담당강사)용 에셋 스트리밍 — 게시 상태와 무관하게 편집 권한만 검사한다.
   * 관리자 CMS 편집기의 미리보기(DRAFT 포함)에서 사용한다.
   */
  async getEditableAssetFile(assetId: string, userId: string) {
    const asset = await this.prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: {
        item: {
          select: {
            lesson: { select: { id: true, title: true, courseId: true } },
          },
        },
      },
    });
    if (!asset || !asset.item?.lesson) {
      throw new NotFoundException('에셋을 찾을 수 없습니다.');
    }
    await this.access.ensureCanEditCourse(userId, asset.item.lesson.courseId);

    let buffer: Buffer | null = null;
    if (asset.storageKey) {
      buffer = await this.storage.readBuffer(asset.storageKey);
    } else if (asset.publicUrl) {
      const response = await fetch(asset.publicUrl);
      if (!response.ok) {
        throw new NotFoundException('공개 URL 에셋을 불러오지 못했습니다.');
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
    if (!buffer) {
      throw new NotFoundException('에셋 원본을 찾을 수 없습니다.');
    }

    return {
      buffer,
      fileName: asset.fileName || asset.item.lesson.title,
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
