'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Pin } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { HtmlWysiwygEditor } from '@/components/cms/HtmlWysiwygEditor';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: Notice;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, isPublished: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notices`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const d = await res.json();
        setNotices(d.notices ?? d);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ title: '', content: '', isPinned: false, isPublished: true });
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = async (n: Notice) => {
    let content = n.content ?? '';
    if (!content) {
      try {
        const res = await fetch(`${API_BASE}/admin/notices`, { headers: buildAuthHeader(false) });
        if (res.ok) {
          const d = await res.json();
          const list: Notice[] = d.notices ?? d;
          const found = list.find((item) => item.id === n.id);
          if (found) content = found.content ?? '';
        }
      } catch { /* ignore */ }
    }
    setForm({ title: n.title, content, isPinned: n.isPinned, isPublished: n.isPublished });
    setModal({ open: true, mode: 'edit', data: n });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const url = modal.mode === 'create' ? `${API_BASE}/admin/notices` : `${API_BASE}/admin/notices/${modal.data?.id}`;
      const method = modal.mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: buildAuthHeader(), body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(modal.mode === 'create' ? '공지가 등록되었습니다.' : '공지가 수정되었습니다.');
        setModal({ open: false, mode: 'create' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? '저장에 실패했습니다.');
      }
    } catch { toast.error('저장 중 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/notices/${id}`, { method: 'DELETE', headers: buildAuthHeader(false) });
      if (res.ok) {
        toast.success('삭제되었습니다.');
        setNotices((p) => p.filter((n) => n.id !== id));
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    } catch { toast.error('삭제 중 오류가 발생했습니다.'); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>공지사항 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {notices.length}건</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> 공지 등록
        </BrandButton>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['제목', '고정', '게시', '등록일', '관리'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {notices.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">공지사항이 없습니다.</td></tr>
            ) : notices.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800 line-clamp-1">{n.title}</span>
                </td>
                <td className="px-4 py-3">
                  {n.isPinned && <Pin className="w-4 h-4" style={{ color: 'var(--brand-orange)' }} />}
                </td>
                <td className="px-4 py-3">
                  <BrandBadge variant={n.isPublished ? 'green' : 'default'} className="text-xs">
                    {n.isPublished ? '게시 중' : '비공개'}
                  </BrandBadge>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-3.5 h-3.5 text-gray-500" /></button>
                    <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">{modal.mode === 'create' ? '공지 등록' : '공지 수정'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">내용</label>
                <HtmlWysiwygEditor
                  value={form.content}
                  onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))} />
                  상단 고정
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                  즉시 게시
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal({ open: false, mode: 'create' })}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>저장</BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
