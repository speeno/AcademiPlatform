import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CmsContentStatus,
  CmsReviewStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CmsAccessService } from './cms-access.service';

/**
 * 콘텐츠 검수(Review) 워크플로우 책임.
 * - 강사 → 검수 요청, 운영자 → 승인/반려, 게시 상태 전이 및 감사 로그 작성.
 * - CmsContentService 의 콘텐츠 CRUD 와 분리하여 검수 SRP 를 유지한다.
 */
@Injectable()
export class CmsReviewService {
  constructor(
    private prisma: PrismaService,
    private access: CmsAccessService,
  ) {}

  async requestReview(lessonId: string, userId: string) {
    await this.access.ensureCanEditLesson(userId, lessonId);
    const item = await this.prisma.contentItem.findUnique({
      where: { lessonId },
    });
    if (!item) throw new NotFoundException('아직 저장된 콘텐츠가 없습니다.');
    if (item.latestVersionNo <= 0)
      throw new BadRequestException('검수 요청할 버전이 없습니다.');

    const version = await this.prisma.contentVersion.findUnique({
      where: {
        itemId_versionNo: { itemId: item.id, versionNo: item.latestVersionNo },
      },
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
    await this.access.assertOperator(userId);
    return this.prisma.contentReviewRequest.findMany({
      where: { status: CmsReviewStatus.REVIEW_REQUESTED },
      orderBy: { createdAt: 'asc' },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        version: {
          select: {
            id: true,
            versionNo: true,
            schemaJson: true,
            changeNote: true,
            createdAt: true,
          },
        },
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
    await this.access.assertOperator(operatorId);
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
        rejectReason:
          payload.status === CmsReviewStatus.REJECTED
            ? (payload.rejectReason ?? '반려')
            : null,
      },
    });

    if (payload.status === CmsReviewStatus.APPROVED) {
      const versionNo =
        request.version?.versionNo ?? request.item.latestVersionNo;
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
}
