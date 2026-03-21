import { CmsContentStatus, CmsContentType, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function mapContentType(lessonType: string): CmsContentType {
  if (lessonType === 'VIDEO_YOUTUBE') return CmsContentType.VIDEO_YOUTUBE;
  if (lessonType === 'VIDEO_UPLOAD') return CmsContentType.VIDEO_MP4;
  if (lessonType === 'DOCUMENT') return CmsContentType.DOCUMENT;
  return CmsContentType.HTML;
}

function mapStatus(contentStatus: string): CmsContentStatus {
  if (contentStatus === 'PUBLISHED') return CmsContentStatus.PUBLISHED;
  return CmsContentStatus.DRAFT;
}

async function run() {
  const lessons = await prisma.lesson.findMany({
    include: {
      videoAsset: true,
      documents: true,
      contentItem: true,
      module: {
        select: {
          course: {
            select: {
              instructorId: true,
            },
          },
        },
      },
    },
  });

  let migrated = 0;
  for (const lesson of lessons) {
    if (lesson.contentItem) continue;

    const hasLegacy =
      !!lesson.videoAsset ||
      lesson.documents.length > 0 ||
      !!lesson.description;
    if (!hasLegacy) continue;

    const actorId = lesson.module?.course?.instructorId;
    if (!actorId) continue;

    const contentType = mapContentType(String(lesson.lessonType));
    const status = mapStatus(String(lesson.contentStatus));

    const schemaJson: Record<string, unknown> = {};
    if (contentType === CmsContentType.VIDEO_YOUTUBE) {
      schemaJson.youtubeUrl = lesson.videoAsset?.youtubeUrl ?? '';
    } else if (contentType === CmsContentType.VIDEO_MP4) {
      schemaJson.videoUrl =
        lesson.videoAsset?.videoFileUrl ??
        lesson.videoAsset?.hlsPlaylistUrl ??
        '';
    } else if (contentType === CmsContentType.DOCUMENT) {
      schemaJson.note = lesson.description ?? '';
    } else {
      schemaJson.html = lesson.description ? `<p>${lesson.description}</p>` : '<p></p>';
    }

    const item = await prisma.contentItem.create({
      data: {
        courseId: lesson.courseId,
        lessonId: lesson.id,
        contentType,
        status,
        latestVersionNo: 1,
        publishedVersionNo: status === CmsContentStatus.PUBLISHED ? 1 : null,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    const version = await prisma.contentVersion.create({
      data: {
        itemId: item.id,
        versionNo: 1,
        schemaJson: schemaJson as Prisma.InputJsonValue,
        changeNote: 'Legacy lesson migration',
        createdById: actorId,
      },
    });

    if (lesson.videoAsset?.videoFileUrl || lesson.videoAsset?.hlsPlaylistUrl || lesson.videoAsset?.youtubeUrl) {
      const videoUrl = lesson.videoAsset.videoFileUrl || lesson.videoAsset.hlsPlaylistUrl || lesson.videoAsset.youtubeUrl;
      if (videoUrl) {
        await prisma.contentAsset.create({
          data: {
            itemId: item.id,
            versionId: version.id,
            assetType: 'VIDEO',
            mimeType: 'video/mp4',
            publicUrl: videoUrl,
            fileName: lesson.title,
            uploadedById: actorId,
          },
        });
      }
    }

    if (lesson.documents.length > 0) {
      for (const doc of lesson.documents) {
        await prisma.contentAsset.create({
          data: {
            itemId: item.id,
            versionId: version.id,
            assetType: 'DOCUMENT',
            mimeType: doc.fileType || 'application/octet-stream',
            publicUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize ?? undefined,
            uploadedById: actorId,
          },
        });
      }
    }

    await prisma.contentAuditLog.create({
      data: {
        itemId: item.id,
        actorId,
        action: 'MIGRATED_FROM_LEGACY',
        payloadJson: {
          lessonId: lesson.id,
          legacyLessonType: lesson.lessonType,
        },
      },
    });
    migrated += 1;
  }

  console.log(`CMS migration completed. migrated lessons: ${migrated}`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
