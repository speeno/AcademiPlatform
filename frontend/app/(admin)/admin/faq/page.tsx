'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';
const CATEGORIES = ['수강신청', '결제/환불', '시험접수', '교재', '기술 문의', '기타'];

interface Faq { id: string; category: string; question: string; answer: string; isPublished: boolean; sortOrder: number; }

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ category: CATEGORIES[0], question: '', answer: '', isPublished: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetchWithAuth('/admin/faq');
      if (res.ok) setFaqs(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ category: CATEGORIES[0], question: '', answer: '', isPublished: true }); setModal(true); };
  const openEdit = (f: Faq) => { setEditing(f); setForm({ category: f.category, question: f.question, answer: f.answer, isPublished: f.isPublished }); setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/admin/faq/${editing.id}` : '/admin/faq';
      const method = editing ? 'PATCH' : 'POST';
      const res = await apiFetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setModal(false); load(); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await apiFetchWithAuth(`/admin/faq/${id}`, { method: 'DELETE' });
    setFaqs((p) => p.filter((f) => f.id !== id));
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>FAQ 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {faqs.length}건</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> FAQ 등록
        </BrandButton>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['카테고리', '질문', '게시', '관리'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {faqs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">FAQ가 없습니다.</td></tr>
            ) : faqs.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><BrandBadge variant="blue" className="text-xs">{f.category}</BrandBadge></td>
                <td className="px-4 py-3 text-gray-800 line-clamp-1 max-w-xs">{f.question}</td>
                <td className="px-4 py-3"><BrandBadge variant={f.isPublished ? 'green' : 'default'} className="text-xs">{f.isPublished ? '게시' : '비공개'}</BrandBadge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(f)} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-3.5 h-3.5 text-gray-500" /></button>
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-5">{editing ? 'FAQ 수정' : 'FAQ 등록'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">질문</label>
                <input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">답변</label>
                <textarea value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                즉시 게시
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal(false)}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>저장</BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
