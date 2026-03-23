'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Send, Save, Plus, RefreshCcw } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';

type ContentType = 'VIDEO_MP4' | 'VIDEO_YOUTUBE' | 'DOCUMENT' | 'HTML';
type CollaboratorRole = 'EDITOR' | 'ASSISTANT';

interface CmsCourse {
  id: string;
  title: string;
  slug: string;
}

interface CmsTreeLesson {
  id: string;
  title: string;
  lessonType: string;
  contentItem?: { status: string; contentType: string; latestVersionNo: number; publishedVersionNo?: number | null } | null;
}

interface CmsTreeModule {
  id: string;
  title: string;
  lessons: CmsTreeLesson[];
}

interface CmsTree {
  id: string;
  title: string;
  modules: CmsTreeModule[];
  cmsCollaborators: Array<{ id: string; role: CollaboratorRole; user: { id: string; name: string; email: string } }>;
}

interface CmsHistoryItem {
  id: string;
  action: string;
  createdAt: string;
  actor?: { id: string; name: string; email: string } | null;
}

interface InstructorOption {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface AdminUsersResponseItem {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
}

export default function CmsInstructorPage() {
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [tree, setTree] = useState<CmsTree | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [contentType, setContentType] = useState<ContentType>('VIDEO_YOUTUBE');
  const [changeNote, setChangeNote] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [documentNote, setDocumentNote] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CmsHistoryItem[]>([]);
  const [isOperator, setIsOperator] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState('');
  const [collaboratorUserId, setCollaboratorUserId] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<CollaboratorRole>('EDITOR');
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const ownerSelectRef = useRef<HTMLSelectElement | null>(null);

  const selectedLesson = useMemo(
    () => tree?.modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId) ?? null,
    [tree, selectedLessonId],
  );

  const loadCourses = useCallback(async () => {
    const res = await fetch(`${API_BASE}/cms/courses/my`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error('CMS 강의 목록을 불러오지 못했습니다.');
    const list = Array.isArray(data) ? data : [];
    setCourses(list);
    if (list.length > 0) {
      const queryCourseId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('courseId') ?? ''
        : '';
      const matched = queryCourseId && list.some((course) => course.id === queryCourseId);
      const nextSelected = matched ? queryCourseId : list[0].id;
      setSelectedCourseId((prev) => prev || nextSelected);
    }
  }, []);

  const loadMe = async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: buildAuthHeader(false), credentials: 'include' });
    if (!res.ok) return;
    const me = await res.json();
    setIsOperator(me?.role === 'OPERATOR' || me?.role === 'SUPER_ADMIN');
  };

  const loadInstructors = useCallback(async () => {
    setInstructorsLoading(true);
    try {
      const params = new URLSearchParams({
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        limit: '200',
      });
      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '강사 목록을 불러오지 못했습니다.');
      const users: AdminUsersResponseItem[] = Array.isArray(data?.users) ? data.users : [];
      setInstructors(users.map((user: AdminUsersResponseItem) => ({
        id: user.id,
        name: user.name ?? '',
        email: user.email ?? '',
        status: user.status ?? '',
      })));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '강사 목록 조회 실패');
    } finally {
      setInstructorsLoading(false);
    }
  }, []);

  const loadTree = async (courseId: string) => {
    if (!courseId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${courseId}/tree`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message ?? '강의 트리를 불러오지 못했습니다.');
    setTree(data);
    const firstLesson = data?.modules?.[0]?.lessons?.[0];
    if (firstLesson) setSelectedLessonId((prev) => prev || firstLesson.id);
  };

  const loadLessonContent = async (lessonId: string) => {
    if (!lessonId) return;
    const res = await fetch(`${API_BASE}/cms/lessons/${lessonId}/content`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '레슨 콘텐츠를 불러오지 못했습니다.');
    const latest = data?.item?.versions?.[0];
    const schema = latest?.schemaJson ?? {};
    const nextType: ContentType = data?.item?.contentType ?? 'VIDEO_YOUTUBE';
    setContentType(nextType);
    setYoutubeUrl(schema?.youtubeUrl ?? '');
    setHtmlContent(schema?.html ?? '');
    setVideoUrl(schema?.videoUrl ?? '');
    setDocumentNote(schema?.note ?? '');

    const historyRes = await fetch(`${API_BASE}/cms/lessons/${lessonId}/history`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const historyData = await historyRes.json().catch(() => []);
    if (historyRes.ok && Array.isArray(historyData)) setHistory(historyData);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadCourses(), loadMe()]);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '초기화에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadCourses]);

  useEffect(() => {
    if (!isOperator) return;
    loadInstructors().catch(() => {
      // loadInstructors 내부에서 토스트 처리
    });
  }, [isOperator, loadInstructors]);

  useEffect(() => {
    if (!ownerUserId && instructors.length > 0) {
      setOwnerUserId(instructors[0].id);
    }
    if (!collaboratorUserId && instructors.length > 0) {
      setCollaboratorUserId(instructors[0].id);
    }
  }, [instructors, ownerUserId, collaboratorUserId]);

  useEffect(() => {
    if (instructors.length === 0) return;
    const availableCollaborators = instructors.filter(
      (instructor) => !tree?.cmsCollaborators.some((collab) => collab.user.id === instructor.id),
    );
    if (availableCollaborators.length === 0) {
      setCollaboratorUserId('');
      return;
    }
    if (!availableCollaborators.some((instructor) => instructor.id === collaboratorUserId)) {
      setCollaboratorUserId(availableCollaborators[0].id);
    }
  }, [instructors, tree, collaboratorUserId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    loadTree(selectedCourseId).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : '강의 트리 조회 실패');
    });
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    loadLessonContent(selectedLessonId).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : '콘텐츠 조회 실패');
    });
  }, [selectedLessonId]);

  const buildSchema = () => {
    if (contentType === 'VIDEO_YOUTUBE') return { youtubeUrl };
    if (contentType === 'VIDEO_MP4') return { videoUrl };
    if (contentType === 'HTML') return { html: htmlContent };
    return { note: documentNote };
  };

  const handleSave = async () => {
    if (!selectedLessonId) return toast.error('레슨을 선택하세요.');
    const res = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/content`, {
      method: 'POST',
      headers: buildAuthHeader(),
      credentials: 'include',
      body: JSON.stringify({
        contentType,
        schemaJson: buildSchema(),
        changeNote: changeNote || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '저장에 실패했습니다.');
    toast.success('콘텐츠가 저장되었습니다.');
    await loadTree(selectedCourseId);
    await loadLessonContent(selectedLessonId);
  };

  const handleUploadAsset = async (file: File | null) => {
    if (!file || !selectedCourseId || !selectedLessonId) return;
    try {
      const presignedRes = await fetch(`${API_BASE}/cms/assets/upload-url`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({
          courseId: selectedCourseId,
          lessonId: selectedLessonId,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
        }),
      });
      const presigned = await presignedRes.json().catch(() => ({}));
      if (!presignedRes.ok) throw new Error(presigned?.message ?? '업로드 URL 발급 실패');

      const uploadRes = await fetch(presigned.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('파일 업로드 실패');

      const attachRes = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/assets`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({
          assetType: contentType,
          mimeType: file.type || 'application/octet-stream',
          storageKey: presigned.storageKey,
          publicUrl: presigned.presignedUrl.split('?')[0],
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const attachData = await attachRes.json().catch(() => ({}));
      if (!attachRes.ok) throw new Error(attachData?.message ?? '에셋 연결 실패');
      if (contentType === 'VIDEO_MP4') setVideoUrl(attachData?.publicUrl ?? presigned.presignedUrl.split('?')[0]);
      toast.success('에셋 업로드 완료');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    }
  };

  const requestReview = async () => {
    if (!selectedLessonId) return;
    const res = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/review-request`, {
      method: 'POST',
      headers: buildAuthHeader(),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '검수 요청 실패');
    toast.success('검수 요청을 보냈습니다.');
    await loadTree(selectedCourseId);
  };

  const addCollaborator = async () => {
    if (!selectedCourseId || !collaboratorUserId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/collaborators`, {
      method: 'POST',
      headers: buildAuthHeader(),
      credentials: 'include',
      body: JSON.stringify({ userId: collaboratorUserId, role: collaboratorRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '공동편집자 추가 실패');
    toast.success('공동편집자를 추가했습니다.');
    setCollaboratorUserId('');
    await loadTree(selectedCourseId);
  };

  const setCourseOwner = async (ownerId?: string) => {
    const targetOwnerId = ownerId ?? ownerSelectRef.current?.value ?? ownerUserId;
    if (!selectedCourseId || !targetOwnerId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/owner`, {
      method: 'PATCH',
      headers: buildAuthHeader(),
      credentials: 'include',
      body: JSON.stringify({ ownerUserId: targetOwnerId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '담당 강사 지정 실패');
    toast.success('담당 강사를 지정했습니다.');
    setOwnerUserId(targetOwnerId);
    await loadTree(selectedCourseId);
  };

  const removeCollaborator = async (userId: string) => {
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/collaborators/${userId}`, {
      method: 'DELETE',
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('공동편집자 삭제 실패');
    toast.success('공동편집자를 삭제했습니다.');
    await loadTree(selectedCourseId);
  };

  if (loading) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>강사용 콘텐츠 CMS</h1>
          <p className="text-sm text-gray-500 mt-1">담당/협업 강의 콘텐츠 작성 및 검수 요청</p>
        </div>
        <BrandButton size="sm" variant="outline" onClick={() => selectedCourseId && loadTree(selectedCourseId)}>
          <RefreshCcw className="w-4 h-4 mr-1" />
          새로고침
        </BrandButton>
      </div>

      <div className="flex gap-2">
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-4">
        <div className="bg-white rounded-xl border p-3 space-y-3 max-h-[72vh] overflow-auto">
          {tree?.modules?.map((module) => (
            <div key={module.id}>
              <p className="text-xs font-semibold text-gray-500 mb-1">{module.title}</p>
              <div className="space-y-1">
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full text-left border rounded-lg px-3 py-2 text-sm ${
                      selectedLessonId === lesson.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lesson.contentItem?.contentType ?? '미작성'} | {lesson.contentItem?.status ?? 'DRAFT'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">{selectedLesson?.title ?? '레슨 선택'}</p>
          <div className="grid md:grid-cols-2 gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
            >
              <option value="VIDEO_MP4">VIDEO_MP4</option>
              <option value="VIDEO_YOUTUBE">VIDEO_YOUTUBE</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="HTML">HTML</option>
            </select>
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="변경 메모"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
          </div>

          {contentType === 'VIDEO_YOUTUBE' && (
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
          )}
          {contentType === 'VIDEO_MP4' && (
            <>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                placeholder="영상 URL(업로드 후 자동 입력 가능)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <label className="inline-flex items-center text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-1" />
                mp4 업로드
                <input
                  type="file"
                  accept="video/mp4,video/*"
                  className="hidden"
                  onChange={(e) => handleUploadAsset(e.target.files?.[0] ?? null)}
                />
              </label>
            </>
          )}
          {contentType === 'DOCUMENT' && (
            <>
              <textarea
                className="border rounded-lg px-3 py-2 text-sm w-full min-h-24"
                placeholder="문서 설명/노트"
                value={documentNote}
                onChange={(e) => setDocumentNote(e.target.value)}
              />
              <label className="inline-flex items-center text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-1" />
                문서 업로드(PDF/HTML/이미지)
                <input
                  type="file"
                  accept=".pdf,.html,.htm,image/*"
                  className="hidden"
                  onChange={(e) => handleUploadAsset(e.target.files?.[0] ?? null)}
                />
              </label>
            </>
          )}
          {contentType === 'HTML' && (
            <textarea
              className="border rounded-lg px-3 py-2 text-sm w-full min-h-56 font-mono"
              placeholder="<h1>콘텐츠 HTML</h1>"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2">
            <BrandButton size="sm" variant="secondary" onClick={() => handleSave().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '저장 실패'))}>
              <Save className="w-4 h-4 mr-1" />
              임시저장
            </BrandButton>
            <BrandButton size="sm" onClick={() => requestReview().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '검수요청 실패'))}>
              <Send className="w-4 h-4 mr-1" />
              검수요청
            </BrandButton>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">이력</p>
            <div className="max-h-40 overflow-auto space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-gray-400">이력이 없습니다.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="text-xs text-gray-600 border rounded px-2 py-1">
                    <p className="font-medium">{h.action}</p>
                    <p>{h.actor?.name ?? '시스템'} | {new Date(h.createdAt).toLocaleString('ko-KR')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isOperator && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">공동편집자 관리(운영자)</h2>
          <div className="flex gap-2">
            <select
              ref={ownerSelectRef}
              className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              disabled={instructorsLoading}
            >
              {instructors.length === 0 ? (
                <option value="">{instructorsLoading ? '강사 목록 로딩 중...' : '선택 가능한 강사가 없습니다.'}</option>
              ) : (
                instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.email})
                  </option>
                ))
              )}
            </select>
            <BrandButton
              size="sm"
              onClick={() => setCourseOwner(ownerSelectRef.current?.value).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '담당 강사 지정 실패'))}
            >
              담당 강사 지정
            </BrandButton>
          </div>
          <div className="flex gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
              value={collaboratorUserId}
              onChange={(e) => setCollaboratorUserId(e.target.value)}
              disabled={instructorsLoading}
            >
              {instructors.length === 0 ? (
                <option value="">{instructorsLoading ? '강사 목록 로딩 중...' : '선택 가능한 강사가 없습니다.'}</option>
              ) : (
                instructors
                  .filter((instructor) => !tree?.cmsCollaborators.some((collab) => collab.user.id === instructor.id))
                  .map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.email})
                    </option>
                  ))
              )}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={collaboratorRole}
              onChange={(e) => setCollaboratorRole(e.target.value as CollaboratorRole)}
            >
              <option value="EDITOR">EDITOR</option>
              <option value="ASSISTANT">ASSISTANT</option>
            </select>
            <BrandButton size="sm" onClick={() => addCollaborator().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '공동편집자 추가 실패'))}>
              <Plus className="w-4 h-4 mr-1" />
              추가
            </BrandButton>
          </div>
          <div className="space-y-2">
            {(tree?.cmsCollaborators ?? []).map((collab) => (
              <div key={collab.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                <span>{collab.user.name} ({collab.user.email}) - {collab.role}</span>
                <BrandButton size="sm" variant="outline" onClick={() => removeCollaborator(collab.user.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '삭제 실패'))}>
                  삭제
                </BrandButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
