'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

const SECTION_TYPES = ['HERO', 'TEXT', 'IMAGE', 'VIDEO', 'CARDS', 'STATS', 'CTA', 'CUSTOM'];
const SECTION_TYPE_LABELS: Record<string, string> = {
  HERO: '히어로', TEXT: '텍스트', IMAGE: '이미지', VIDEO: '동영상',
  CARDS: '카드 그리드', STATS: '통계', CTA: 'CTA 버튼', CUSTOM: '커스텀',
};

interface Section {
  id: string; title: string; sectionType: string; sortOrder: number;
  isVisible: boolean; contentJson: Record<string, unknown>;
}

interface IntroPage {
  id: string; slug: string; title: string; status: string; sections: Section[];
}

export default function AdminIntroPage() {
  const [pages, setPages] = useState<IntroPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<IntroPage | null>(null);
  const [pageModal, setPageModal] = useState(false);
  const [pageForm, setPageForm] = useState({ slug: '', title: '', status: 'DRAFT' });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; editing: Section | null }>({ open: false, editing: null });
  const [sectionForm, setSectionForm] = useState({ title: '', sectionType: 'TEXT', sortOrder: 1, isVisible: true, contentJson: '{}' });
  const [saving, setSaving] = useState(false);

  const loadPages = async () => {
    try {
      const res = await apiFetchWithAuth('/intro/admin/pages');
      if (res.ok) {
        const data = await res.json();
        const list = (data.pages ?? data) as IntroPage[];
        const normalized = list.map((page) => ({ ...page, sections: page.sections ?? [] }));
        setPages(normalized);
        setSelectedPage((prev) => {
          if (!prev) return prev;
          return normalized.find((page) => page.id === prev.id) ?? prev;
        });
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadPages(); }, []);

  const handleSavePage = async () => {
    setSaving(true);
    try {
      const res = await apiFetchWithAuth('/intro/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageForm),
      });
      if (res.ok) { setPageModal(false); loadPages(); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handlePublishToggle = async (page: IntroPage) => {
    const res = await apiFetchWithAuth(`/intro/admin/pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
    });
    if (res.ok) loadPages();
  };

  const handleSaveSection = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      let contentJson: Record<string, unknown> = {};
      try { contentJson = JSON.parse(sectionForm.contentJson); } catch { /* invalid JSON, use empty */ }
      const body = { ...sectionForm, contentJson };
      const { editing } = sectionModal;
      const url = editing
        ? `/intro/admin/sections/${editing.id}`
        : `/intro/admin/pages/${selectedPage.id}/sections`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await apiFetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSectionModal({ open: false, editing: null });
        loadPages();
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedPage || !confirm('섹션을 삭제하시겠습니까?')) return;
    const res = await apiFetchWithAuth(`/intro/admin/sections/${sectionId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelectedPage((p) => (p ? { ...p, sections: p.sections.filter((s) => s.id !== sectionId) } : p));
      loadPages();
    }
  };

  const openAddSection = () => {
    setSectionForm({ title: '', sectionType: 'TEXT', sortOrder: (selectedPage?.sections.length ?? 0) + 1, isVisible: true, contentJson: '{}' });
    setSectionModal({ open: true, editing: null });
  };

  const openEditSection = (section: Section) => {
    setSectionForm({ title: section.title, sectionType: section.sectionType, sortOrder: section.sortOrder, isVisible: section.isVisible, contentJson: JSON.stringify(section.contentJson, null, 2) });
    setSectionModal({ open: true, editing: section });
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측 페이지 목록 */}
      <aside className="w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-bold text-gray-800 text-sm">소개 페이지</h2>
            <button onClick={() => { setPageForm({ slug: '', title: '', status: 'DRAFT' }); setPageModal(true); }} className="p-1 rounded hover:bg-gray-100">
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">페이지가 없습니다.</div>
          ) : (
            <ul className="divide-y">
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => setSelectedPage(page)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${selectedPage?.id === page.id ? 'text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                    style={selectedPage?.id === page.id ? { backgroundColor: 'var(--brand-blue)' } : {}}
                  >
                    <span className="flex-1 line-clamp-1">{page.title}</span>
                    {selectedPage?.id === page.id ? (
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* 우측 섹션 편집기 */}
      <div className="flex-1">
        {!selectedPage ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p>좌측에서 페이지를 선택하거나 새 페이지를 추가하세요.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{selectedPage.title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">페이지 키: {selectedPage.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <BrandBadge variant={selectedPage.status === 'PUBLISHED' ? 'green' : 'default'}>
                  {selectedPage.status === 'PUBLISHED' ? '게시 중' : '비공개'}
                </BrandBadge>
                <BrandButton variant="outline" size="sm" onClick={() => handlePublishToggle(selectedPage)}>
                  {selectedPage.status === 'PUBLISHED' ? '비공개 전환' : '게시하기'}
                </BrandButton>
                <BrandButton variant="primary" size="sm" onClick={openAddSection}>
                  <Plus className="w-4 h-4 mr-1" /> 섹션 추가
                </BrandButton>
              </div>
            </div>

            {selectedPage.sections.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <p>섹션이 없습니다. 섹션을 추가하세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPage.sections.sort((a, b) => a.sortOrder - b.sortOrder).map((section) => (
                  <div key={section.id} className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <BrandBadge variant="blue" className="text-xs">{SECTION_TYPE_LABELS[section.sectionType] ?? section.sectionType}</BrandBadge>
                          {!section.isVisible && <BrandBadge variant="default" className="text-xs">숨김</BrandBadge>}
                          <span className="text-xs text-gray-400">순서: {section.sortOrder}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        {Object.keys(section.contentJson).length > 0 && (
                          <pre className="text-xs text-gray-400 mt-2 bg-gray-50 rounded p-2 overflow-x-auto max-h-20">
                            {JSON.stringify(section.contentJson, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEditSection(section)} className="p-1.5 rounded hover:bg-gray-100">
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => handleDeleteSection(section.id)} className="p-1.5 rounded hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 페이지 생성 모달 */}
      {pageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-5">페이지 추가</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">페이지 키</label><input value={pageForm.slug} onChange={(e) => setPageForm((p) => ({ ...p, slug: e.target.value }))} placeholder="about, benefits 등" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">제목</label><input value={pageForm.title} onChange={(e) => setPageForm((p) => ({ ...p, title: e.target.value }))} placeholder="기관 소개" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={pageForm.status === 'PUBLISHED'} onChange={(e) => setPageForm((p) => ({ ...p, status: e.target.checked ? 'PUBLISHED' : 'DRAFT' }))} />즉시 게시</label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setPageModal(false)}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSavePage}>생성</BrandButton>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 편집 모달 */}
      {sectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">{sectionModal.editing ? '섹션 수정' : '섹션 추가'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">제목</label><input value={sectionForm.title} onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">섹션 유형</label><select value={sectionForm.sectionType} onChange={(e) => setSectionForm((p) => ({ ...p, sectionType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">{SECTION_TYPES.map((t) => <option key={t} value={t}>{SECTION_TYPE_LABELS[t]}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">표시 순서</label><input type="number" value={sectionForm.sortOrder} onChange={(e) => setSectionForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={sectionForm.isVisible} onChange={(e) => setSectionForm((p) => ({ ...p, isVisible: e.target.checked }))} />표시</label>
              <div>
                <label className="block text-sm font-medium mb-1">콘텐츠 JSON</label>
                <textarea value={sectionForm.contentJson} onChange={(e) => setSectionForm((p) => ({ ...p, contentJson: e.target.value }))} rows={8} className="w-full border rounded-lg px-3 py-2 text-sm font-mono resize-none" placeholder='{"heading": "제목", "text": "내용"}' />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setSectionModal({ open: false, editing: null })}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSaveSection}>
                <Save className="w-3.5 h-3.5 mr-1" /> 저장
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
