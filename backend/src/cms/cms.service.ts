import { Injectable } from '@nestjs/common';
import {
  CmsCollaboratorRole,
  CmsContentType,
  CmsReviewStatus,
} from '@prisma/client';
import { CmsContentService } from './services/cms-content.service';
import { CmsReviewService } from './services/cms-review.service';
import { CmsImportService } from './services/cms-import.service';
import { CmsStorageService } from './services/cms-storage.service';

/**
 * CMS 도메인의 외부 진입점(Facade).
 *
 * 책임 분리(P2-service-split):
 * - 콘텐츠 CRUD/공개/에셋 → {@link CmsContentService}
 * - 검수 워크플로우       → {@link CmsReviewService}
 * - 강의 패키지 임포트    → {@link CmsImportService}
 * - 스토리지(S3) I/O     → {@link CmsStorageService}
 * - 권한/접근 검사       → {@link CmsAccessService}(공통)
 *
 * Controller(`CmsController`) 와 다른 모듈(`LmsService.getLessonContent`)이
 * 본 클래스의 공개 API 에 의존하므로, 각 메서드는 적절한 협력자에게 위임만 한다.
 * 내부 구현 변경 시 본 파일은 위임 라인만 손대면 되도록 thin 으로 유지한다.
 */
@Injectable()
export class CmsService {
  constructor(
    private content: CmsContentService,
    private review: CmsReviewService,
    private importer: CmsImportService,
    private storage: CmsStorageService,
  ) {}

  /* ---- 강좌/협업자 ---- */
  getMyCourses(userId: string) {
    return this.content.getMyCourses(userId);
  }

  getCourseTree(courseId: string, userId: string) {
    return this.content.getCourseTree(courseId, userId);
  }

  upsertCollaborator(
    courseId: string,
    targetUserId: string,
    role: CmsCollaboratorRole,
    operatorId: string,
  ) {
    return this.content.upsertCollaborator(courseId, targetUserId, role, operatorId);
  }

  setCourseOwner(courseId: string, ownerUserId: string, operatorId: string) {
    return this.content.setCourseOwner(courseId, ownerUserId, operatorId);
  }

  removeCollaborator(
    courseId: string,
    targetUserId: string,
    operatorId: string,
  ) {
    return this.content.removeCollaborator(courseId, targetUserId, operatorId);
  }

  /* ---- 레슨 콘텐츠 ---- */
  getLessonContent(lessonId: string, userId: string) {
    return this.content.getLessonContent(lessonId, userId);
  }

  getLessonHistory(lessonId: string, userId: string) {
    return this.content.getLessonHistory(lessonId, userId);
  }

  saveLessonContent(
    lessonId: string,
    userId: string,
    payload: {
      contentType: CmsContentType;
      schemaJson: Record<string, any>;
      changeNote?: string;
    },
  ) {
    return this.content.saveLessonContent(lessonId, userId, payload);
  }

  rollbackLesson(lessonId: string, versionNo: number, operatorId: string) {
    return this.content.rollbackLesson(lessonId, versionNo, operatorId);
  }

  /* ---- 에셋 / 스토리지 ---- */
  getUploadUrl(
    userId: string,
    payload: {
      courseId: string;
      lessonId: string;
      fileName: string;
      contentType: string;
    },
  ) {
    return this.storage.getUploadUrl(userId, payload);
  }

  attachAsset(
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
    return this.content.attachAsset(lessonId, userId, payload);
  }

  /* ---- 검수 ---- */
  requestReview(lessonId: string, userId: string) {
    return this.review.requestReview(lessonId, userId);
  }

  getReviewQueue(userId: string) {
    return this.review.getReviewQueue(userId);
  }

  reviewDecision(
    requestId: string,
    operatorId: string,
    payload: { status: CmsReviewStatus; rejectReason?: string },
  ) {
    return this.review.reviewDecision(requestId, operatorId, payload);
  }

  /* ---- 게시본/패키지 ---- */
  getPublishedLessonContent(lessonId: string, userId: string) {
    return this.content.getPublishedLessonContent(lessonId, userId);
  }

  getPackageAssetFile(storageKey: string, lessonId: string, userId: string) {
    return this.importer.getPackageAssetFile(storageKey, lessonId, userId);
  }

  processCoursePackageUpload(
    lessonId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string },
  ) {
    return this.importer.processCoursePackageUpload(lessonId, userId, file);
  }

  getPublishedAssetFile(assetId: string, userId: string) {
    return this.content.getPublishedAssetFile(assetId, userId);
  }
}
