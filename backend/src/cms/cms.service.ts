import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CmsCollaboratorRole,
  CmsContentStatus,
  CmsContentType,
  CmsReviewStatus,
  EnrollmentStatus,
  UserRole,
} from '@prisma/client';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ResolvedStorageConfig, resolveStorageConfig } from '../common/storage/storage-config';

@Injectable()
export class CmsService {
  private s3: S3Client;
  private readonly storageConfig: ResolvedStorageConfig;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.storageConfig = resolveStorageConfig(this.config);

    this.s3 = new S3Client({
      region: this.storageConfig.region,
      endpoint: this.storageConfig.endpoint,
      forcePathStyle: !!this.storageConfig.endpoint,
      credentials:
        this.storageConfig.accessKeyId && this.storageConfig.secretAccessKey
          ? {
              accessKeyId: this.storageConfig.accessKeyId,
              secretAccessKey: this.storageConfig.secretAccessKey,
            }
          : undefined,
    });
  }

  private async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user.role;
  }

  private async assertOperator(userId: string) {
    const role = await this.getUserRole(userId);
    if (role !== UserRole.OPERATOR && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('운영자 권한이 필요합니다.');
    }
  }

  private async canEditCourse(userId: string, courseId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    if (role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN) return true;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, cmsOwnerId: true },
    });
    if (!course) throw new NotFoundException('강좌를 찾을 수 없습니다.');
    if (course.instructorId === userId || course.cmsOwnerId === userId) return true;

    const collaborator = await this.prisma.courseCmsCollaborator.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { id: true },
    });
    return !!collaborator;
  }

  private async ensureCanEditCourse(userId: string, courseId: string) {
    const allowed = await this.canEditCourse(userId, courseId);
    if (!allowed) throw new ForbiddenException('해당 강좌의 CMS 편집 권한이 없습니다.');
  }

  private async ensureCanEditLesson(userId: string, lessonId: string): Promise<{ courseId: string; lessonId: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson) throw new NotFoundException('레슨을 찾을 수 없습니다.');
    await this.ensureCanEditCourse(userId, lesson.courseId);
    return { courseId: lesson.courseId, lessonId: lesson.id };
  }

  async getMyCourses(userId: string) {
    const role = await this.getUserRole(userId);
    const where =
      role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN
        ? {}
        : {
            OR: [
              { instructorId: userId },
              { cmsOwnerId: userId },
              { cmsCollaborators: { some: { userId } } },
            ],
          };

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
    await this.ensureCanEditCourse(userId, courseId);
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

  async upsertCollaborator(courseId: string, targetUserId: string, role: CmsCollaboratorRole, operatorId: string) {
    await this.assertOperator(operatorId);
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
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

  async setCourseOwner(courseId: string, ownerUserId: string, operatorId: string) {
    await this.assertOperator(operatorId);
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('지정한 담당 강사를 찾을 수 없습니다.');

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

  async removeCollaborator(courseId: string, targetUserId: string, operatorId: string) {
    await this.assertOperator(operatorId);
    await this.prisma.courseCmsCollaborator.delete({
      where: { courseId_userId: { courseId, userId: targetUserId } },
    });
    return { deleted: true };
  }

  async getLessonContent(lessonId: string, userId: string) {
    const { courseId } = await this.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 20,
          select: { id: true, versionNo: true, schemaJson: true, changeNote: true, createdAt: true },
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
    await this.ensureCanEditLesson(userId, lessonId);
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
    payload: { contentType: CmsContentType; schemaJson: Record<string, any>; changeNote?: string },
  ) {
    const { courseId } = await this.ensureCanEditLesson(userId, lessonId);
    const existing = await this.prisma.contentItem.findUnique({ where: { lessonId } });
    const nextVersionNo = (existing?.latestVersionNo ?? 0) + 1;

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
        schemaJson: payload.schemaJson ?? {},
        changeNote: payload.changeNote,
        createdById: userId,
      },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'CONTENT_SAVED',
        payloadJson: { versionNo: nextVersionNo, contentType: payload.contentType },
      },
    });

    return { item, version };
  }

  async requestReview(lessonId: string, userId: string) {
    await this.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({ where: { lessonId } });
    if (!item) throw new NotFoundException('아직 저장된 콘텐츠가 없습니다.');
    if (item.latestVersionNo <= 0) throw new BadRequestException('검수 요청할 버전이 없습니다.');

    const version = await this.prisma.contentVersion.findUnique({
      where: { itemId_versionNo: { itemId: item.id, versionNo: item.latestVersionNo } },
    });
    if (!version) throw new NotFoundException('최신 버전을 찾을 수 없습니다.');

    const request = await this.prisma.contentReviewRequest.create({
      data: {
        itemId: item.id,
        versionId: version.id,
        requestedById: userId,
        status: CmsReviewStatus.REVIEW_REQUESTED,
      },
    });

    await this.prisma.contentItem.update({
      where: { id: item.id },
      data: { status: CmsContentStatus.REVIEW_REQUESTED },
    });

    await this.prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId: userId,
        action: 'REVIEW_REQUESTED',
        payloadJson: { versionNo: item.latestVersionNo, requestId: request.id },
      },
    });

    return request;
  }

  async getReviewQueue(userId: string) {
    await this.assertOperator(userId);
    return this.prisma.contentReviewRequest.findMany({
      where: { status: CmsReviewStatus.REVIEW_REQUESTED },
      orderBy: { createdAt: 'asc' },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        version: { select: { id: true, versionNo: true, schemaJson: true, changeNote: true, createdAt: true } },
        item: {
          select: {
            id: true,
            contentType: true,
            status: true,
            lesson: { select: { id: true, title: true, courseId: true } },
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });
  }

  async reviewDecision(
    requestId: string,
    operatorId: string,
    payload: { status: CmsReviewStatus; rejectReason?: string },
  ) {
    await this.assertOperator(operatorId);
    const request = await this.prisma.contentReviewRequest.findUnique({
      where: { id: requestId },
      include: { item: true, version: true },
    });
    if (!request) throw new NotFoundException('검수 요청을 찾을 수 없습니다.');
    if (request.status !== CmsReviewStatus.REVIEW_REQUESTED) {
      throw new BadRequestException('이미 처리된 검수 요청입니다.');
    }

    const updated = await this.prisma.contentReviewRequest.update({
      where: { id: requestId },
      data: {
        status: payload.status,
        reviewedById: operatorId,
        reviewedAt: new Date(),
        rejectReason: payload.status === CmsReviewStatus.REJECTED ? payload.rejectReason ?? '반려' : null,
      },
    });

    if (payload.status === CmsReviewStatus.APPROVED) {
      const versionNo = request.version?.versionNo ?? request.item.latestVersionNo;
      await this.prisma.contentItem.update({
        where: { id: request.itemId },
        data: {
          status: CmsContentStatus.PUBLISHED,
          publishedVersionNo: versionNo,
          updatedById: operatorId,
        },
      });
      await this.prisma.contentAuditLog.create({
        data: {
          itemId: request.itemId,
          actorId: operatorId,
          action: 'REVIEW_APPROVED',
          payloadJson: { requestId, versionNo },
        },
      });
    } else {
      await this.prisma.contentItem.update({
        where: { id: request.itemId },
        data: {
          status: CmsContentStatus.REJECTED,
          updatedById: operatorId,
        },
      });
      await this.prisma.contentAuditLog.create({
        data: {
          itemId: request.itemId,
          actorId: operatorId,
          action: 'REVIEW_REJECTED',
          payloadJson: { requestId, rejectReason: updated.rejectReason },
        },
      });
    }

    return updated;
  }

  async rollbackLesson(lessonId: string, versionNo: number, operatorId: string) {
    await this.assertOperator(operatorId);
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

  async getUploadUrl(
    userId: string,
    payload: { courseId: string; lessonId: string; fileName: string; contentType: string },
  ) {
    await this.ensureCanEditCourse(userId, payload.courseId);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: payload.lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson || lesson.courseId !== payload.courseId) {
      throw new BadRequestException('강좌와 레슨 매칭이 올바르지 않습니다.');
    }

    const bucket = this.storageConfig.bucket;
    if (!bucket) {
      throw new BadRequestException(
        '스토리지 버킷이 설정되지 않았습니다. S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE 환경변수를 설정하세요.',
      );
    }

    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `cms/${payload.courseId}/${payload.lessonId}/${Date.now()}_${safeFileName}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: payload.contentType });
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { presignedUrl, storageKey: key };
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
    await this.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({ where: { lessonId } });
    if (!item) throw new NotFoundException('콘텐츠를 먼저 저장해 주세요.');

    let versionId: string | undefined;
    if (payload.versionNo) {
      const version = await this.prisma.contentVersion.findUnique({
        where: { itemId_versionNo: { itemId: item.id, versionNo: payload.versionNo } },
        select: { id: true },
      });
      if (!version) throw new NotFoundException('지정된 버전을 찾을 수 없습니다.');
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
    if (!item || item.status !== CmsContentStatus.PUBLISHED || !item.publishedVersionNo) {
      return null;
    }
    const version = item.versions.find((v) => v.versionNo === item.publishedVersionNo);
    if (!version) return null;

    const bucket = this.storageConfig.bucket;

    const assets = await Promise.all(
      item.assets.map(async (asset) => {
        let resolvedUrl = asset.publicUrl ?? null;
        if (!resolvedUrl && bucket && asset.storageKey) {
          const command = new GetObjectCommand({ Bucket: bucket, Key: asset.storageKey });
          resolvedUrl = await getSignedUrl(this.s3, command, { expiresIn: 600 });
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
}
