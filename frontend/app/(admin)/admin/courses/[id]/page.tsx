'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Save, GripVertical, PlayCircle, FileText } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';

import { API_BASE } from '@/lib/api-base';

const API = API_BASE;

const LESSON_TYPES = ['VIDEO_UPLOAD', 'VIDEO_YOUTUBE', 'DOCUMENT', 'TEXT', 'LIVE_LINK', 'QUIZ'];
const LESSON_TYPE_LABELS: Record<string, string> = {
  VIDEO_UPLOAD: '동영상 업로드', VIDEO_YOUTUBE: 'YouTube', DOCUMENT: '문서(PDF)',
  TEXT: '텍스트', LIVE_LINK: '라이브 링크', QUIZ: '퀴즈',
};

interface Lesson { id: string; title: string; lessonType: string; sortOrder: number; isFree: boolean; isPreview: boolean; }
interface Module { id: string; title: string; sortOrder: number; lessons: Lesson[]; }
interface CourseDetail {
  id: string; title: string; slug: string; category: string | null; status: string;
  price: number; summary: string | null; description: string | null;
  currency?: string; basePrice?: number; salePrice?: number | null;
  discountType?: 'NONE' | 'PERCENT' | 'FIXED'; discountValue?: number;
  priceValidFrom?: string | null; priceValidUntil?: string | null;
  instructor: { name: string }; modules: Module[];
}

export default function AdminCourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [basicForm, setBasicForm] = useState({
    title: '',
    category: '',
    status: 'DRAFT',
    price: '',
    summary: '',
    description: '',
    currency: 'KRW',
    basePrice: '',
    salePrice: '',
    discountType: 'NONE',
    discountValue: '0',
    priceValidFrom: '',
    priceValidUntil: '',
    reason: '',
  });
  const [savingBasic, setSavingBasic] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', lessonType: 'VIDEO_UPLOAD' });
  const basePriceNum = Number(basicForm.basePrice || basicForm.price || 0);
  const salePriceNum = basicForm.salePrice === '' ? basePriceNum : Number(basicForm.salePrice || 0);
  const discountValueNum = Number(basicForm.discountValue || 0);
  const discountAmount =
    basicForm.discountType === 'PERCENT'
      ? Math.floor((salePriceNum * discountValueNum) / 100)
      : basicForm.discountType === 'FIXED'
        ? discountValueNum
        : 0;
  const finalPreviewPrice = Math.max(0, salePriceNum - discountAmount);

  const authHeader = (): Record<string, string> => {
    const t = localStorage.getItem('accessToken');
    const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (t) h['Authorization'] = `Bearer ${t}`; return h;
  };

  const load = async () => {
    try {
      const res = await fetch(`${API}/courses/admin/${id}`, { headers: authHeader() });
      if (!res.ok) { router.push('/admin/courses'); return; }
      const d: CourseDetail = await res.json();
      setCourse(d);
      setBasicForm({
        title: d.title,
        category: d.category ?? '',
        status: d.status,
        price: String(d.price),
        summary: d.summary ?? '',
        description: d.description ?? '',
        currency: d.currency ?? 'KRW',
        basePrice: String(d.basePrice ?? d.price ?? 0),
        salePrice: d.salePrice == null ? '' : String(d.salePrice),
        discountType: d.discountType ?? 'NONE',
        discountValue: String(d.discountValue ?? 0),
        priceValidFrom: d.priceValidFrom ? d.priceValidFrom.slice(0, 16) : '',
        priceValidUntil: d.priceValidUntil ? d.priceValidUntil.slice(0, 16) : '',
        reason: '',
      });
    } catch { router.push('/admin/courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveBasic = async () => {
    setSavingBasic(true);
    try {
      const res = await fetch(`${API}/courses/admin/${id}`, {
        method: 'PATCH', headers: authHeader(),
        body: JSON.stringify({
          title: basicForm.title,
          category: basicForm.category,
          status: basicForm.status,
          price: Number(basicForm.price) || 0,
          summary: basicForm.summary,
          description: basicForm.description,
        }),
      });
      if (res.ok) {
        await fetch(`${API}/admin/pricing/COURSE/${id}`, {
          method: 'PATCH',
          headers: authHeader(),
          body: JSON.stringify({
            currency: basicForm.currency,
            basePrice: Number(basicForm.basePrice || basicForm.price || 0),
            salePrice: basicForm.salePrice === '' ? null : Number(basicForm.salePrice),
            discountType: basicForm.discountType,
            discountValue: Number(basicForm.discountValue || 0),
            priceValidFrom: basicForm.priceValidFrom || null,
            priceValidUntil: basicForm.priceValidUntil || null,
            reason: basicForm.reason || '관리자 가격 정책 변경',
          }),
        });
        load();
      }
    } catch { /* ignore */ } finally { setSavingBasic(false); }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    const res = await fetch(`${API}/courses/admin/${id}/modules`, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ title: newModuleTitle, sortOrder: (course?.modules.length ?? 0) + 1 }),
    });
    if (res.ok) { setNewModuleTitle(''); setAddingModule(false); load(); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('모듈을 삭제하시겠습니까?')) return;
    const res = await fetch(`${API}/courses/admin/${id}/modules/${moduleId}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) load();
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLesson.title.trim()) return;
    const module = course?.modules.find((m) => m.id === moduleId);
    const res = await fetch(`${API}/courses/admin/modules/${moduleId}/lessons`, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ ...newLesson, sortOrder: (module?.lessons.length ?? 0) + 1 }),
    });
    if (res.ok) { setAddingLesson(null); setNewLesson({ title: '', lessonType: 'VIDEO_UPLOAD' }); load(); }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('강의를 삭제하시겠습니까?')) return;
    const res = await fetch(`${API}/courses/admin/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) load();
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;
  if (!course) return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <BrandButton variant="ghost" size="sm" onClick={() => router.push('/admin/courses')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록
        </BrandButton>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>강좌 편집</h1>
          <p className="text-sm text-gray-500 mt-0.5">{course.title}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* 기본 정보 */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-5 text-gray-900">기본 정보</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">제목</label>
              <input value={basicForm.title} onChange={(e) => setBasicForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">카테고리</label>
              <input value={basicForm.category} onChange={(e) => setBasicForm((p) => ({ ...p, category: e.target.value }))} placeholder="AI활용" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">가격 (원)</label>
              <input type="number" value={basicForm.price} onChange={(e) => setBasicForm((p) => ({ ...p, price: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <select value={basicForm.status} onChange={(e) => setBasicForm((p) => ({ ...p, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">요약</label>
              <input value={basicForm.summary} onChange={(e) => setBasicForm((p) => ({ ...p, summary: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">상세 설명</label>
              <textarea value={basicForm.description} onChange={(e) => setBasicForm((p) => ({ ...p, description: e.target.value }))} rows={5} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="md:col-span-2 border-t pt-4 mt-1">
              <p className="text-sm font-semibold mb-3">가격 정책</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">통화</label>
                  <input value={basicForm.currency} onChange={(e) => setBasicForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">정가(basePrice)</label>
                  <input type="number" value={basicForm.basePrice} onChange={(e) => setBasicForm((p) => ({ ...p, basePrice: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">판매가(salePrice)</label>
                  <input type="number" value={basicForm.salePrice} onChange={(e) => setBasicForm((p) => ({ ...p, salePrice: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="미입력 시 정가 사용" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">할인 유형</label>
                  <select value={basicForm.discountType} onChange={(e) => setBasicForm((p) => ({ ...p, discountType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {['NONE', 'PERCENT', 'FIXED'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">할인 값</label>
                  <input type="number" value={basicForm.discountValue} onChange={(e) => setBasicForm((p) => ({ ...p, discountValue: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">변경 사유</label>
                  <input value={basicForm.reason} onChange={(e) => setBasicForm((p) => ({ ...p, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="프로모션/정책 변경 등" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">유효 시작</label>
                  <input type="datetime-local" value={basicForm.priceValidFrom} onChange={(e) => setBasicForm((p) => ({ ...p, priceValidFrom: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">유효 종료</label>
                  <input type="datetime-local" value={basicForm.priceValidUntil} onChange={(e) => setBasicForm((p) => ({ ...p, priceValidUntil: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-3 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                  최종 결제 예상가: <span className="font-semibold">{finalPreviewPrice.toLocaleString()}원</span>
                  <span className="ml-2 text-xs text-gray-500">
                    (정가 {basePriceNum.toLocaleString()} / 판매가 {salePriceNum.toLocaleString()} / 할인 {discountAmount.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <BrandButton variant="primary" size="sm" loading={savingBasic} onClick={handleSaveBasic}>
              <Save className="w-4 h-4 mr-1" /> 저장
            </BrandButton>
          </div>
        </section>

        {/* 커리큘럼 편집기 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">커리큘럼</h2>
            <BrandButton variant="outline" size="sm" onClick={() => setAddingModule(true)}>
              <Plus className="w-4 h-4 mr-1" /> 모듈 추가
            </BrandButton>
          </div>

          {addingModule && (
            <div className="mb-4 flex gap-3 items-center bg-blue-50 rounded-lg p-3">
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="모듈 제목"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
              <BrandButton variant="primary" size="sm" onClick={handleAddModule}>추가</BrandButton>
              <BrandButton variant="ghost" size="sm" onClick={() => { setAddingModule(false); setNewModuleTitle(''); }}>취소</BrandButton>
            </div>
          )}

          {course.modules.length === 0 ? (
            <p className="text-center py-8 text-gray-400">모듈이 없습니다. 모듈을 추가하세요.</p>
          ) : (
            <div className="space-y-4">
              {course.modules.map((module, mIdx) => (
                <div key={module.id} className="border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 flex-1">{mIdx + 1}. {module.title}</span>
                    <span className="text-xs text-gray-400">{module.lessons.length}강</span>
                    <button onClick={() => handleDeleteModule(module.id)} className="p-1 rounded hover:bg-red-100">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>

                  {/* 레슨 목록 */}
                  <ul className="divide-y">
                    {module.lessons.map((lesson, lIdx) => (
                      <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        {lesson.lessonType.startsWith('VIDEO') ? (
                          <PlayCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="flex-1 text-gray-700">{mIdx + 1}-{lIdx + 1}. {lesson.title}</span>
                        <BrandBadge variant="default" className="text-xs">{LESSON_TYPE_LABELS[lesson.lessonType] ?? lesson.lessonType}</BrandBadge>
                        {lesson.isPreview && <BrandBadge variant="orange" className="text-xs">미리보기</BrandBadge>}
                        <button onClick={() => handleDeleteLesson(module.id, lesson.id)} className="p-1 rounded hover:bg-red-100">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* 레슨 추가 */}
                  {addingLesson === module.id ? (
                    <div className="flex gap-2 p-3 bg-orange-50 border-t">
                      <input
                        value={newLesson.title}
                        onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                        placeholder="강의 제목"
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                        autoFocus
                      />
                      <select value={newLesson.lessonType} onChange={(e) => setNewLesson((p) => ({ ...p, lessonType: e.target.value }))} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
                        {LESSON_TYPES.map((t) => <option key={t} value={t}>{LESSON_TYPE_LABELS[t]}</option>)}
                      </select>
                      <BrandButton variant="secondary" size="sm" onClick={() => handleAddLesson(module.id)}>추가</BrandButton>
                      <BrandButton variant="ghost" size="sm" onClick={() => { setAddingLesson(null); setNewLesson({ title: '', lessonType: 'VIDEO_UPLOAD' }); }}>취소</BrandButton>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLesson(module.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50 border-t transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> 강의 추가
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
