'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth } from '@/lib/api-client';

const CATEGORIES = ['study', 'guide', 'course', 'payment', 'exam', 'etc'];
const POSES = [
  'explaining', 'idea', 'guiding', 'expert-pointing', 'presenting', 'thumbs-up',
  'greeting', 'cheer', 'graduate', 'surprised', 'pointing', 'welcome',
];

interface QmiDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  url: string;
  keywords: string[];
  roles: string[];
  pose: string;
  suggestions: string[];
  enabled: boolean;
  hasEmbedding?: boolean;
  updatedAt: string;
}

const emptyForm = {
  title: '',
  category: CATEGORIES[0],
  content: '',
  url: '',
  keywords: '',
  pose: 'explaining',
  suggestions: '',
  enabled: true,
};

export default function AdminQmiPage() {
  const [docs, setDocs] = useState<QmiDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<QmiDoc | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetchWithAuth('/qmi/admin/documents');
      if (res.ok) setDocs(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (d: QmiDoc) => {
    setEditing(d);
    setForm({
      title: d.title,
      category: d.category,
      content: d.content,
      url: d.url ?? '',
      keywords: (d.keywords ?? []).join(', '),
      pose: d.pose ?? 'explaining',
      suggestions: (d.suggestions ?? []).join(', '),
      enabled: d.enabled,
    });
    setModal(true);
  };

  const splitCsv = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/qmi/admin/documents/${editing.id}` : '/qmi/admin/documents';
      const method = editing ? 'PATCH' : 'POST';
      const body = {
        title: form.title,
        category: form.category,
        content: form.content,
        url: form.url,
        keywords: splitCsv(form.keywords),
        pose: form.pose,
        suggestions: splitCsv(form.suggestions),
        enabled: form.enabled,
      };
      const res = await apiFetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setModal(false);
        load();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;
    await apiFetchWithAuth(`/qmi/admin/documents/${id}`, { method: 'DELETE' });
    setDocs((p) => p.filter((d) => d.id !== id));
  };

  const handleReindex = async () => {
    if (!confirm('모든 문서의 임베딩을 재생성합니다. (OPENAI_API_KEY 필요)')) return;
    setReindexing(true);
    try {
      const res = await apiFetchWithAuth('/qmi/admin/reindex', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`임베딩 재생성 완료: ${data.reindexed}건`);
        load();
      } else {
        alert('재생성 실패 — OPENAI_API_KEY 설정과 마이그레이션을 확인하세요.');
      }
    } catch {
      alert('재생성 중 오류가 발생했습니다.');
    } finally {
      setReindexing(false);
    }
  };

  const columns: DataTableColumn<QmiDoc>[] = [
    {
      key: 'category',
      header: '분류',
      cell: (d) => <BrandBadge variant="blue" className="text-xs">{d.category}</BrandBadge>,
      className: 'w-24',
    },
    {
      key: 'title',
      header: '제목 / 내용',
      cell: (d) => (
        <div className="min-w-0">
          <p className="font-medium line-clamp-1">{d.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{d.content}</p>
        </div>
      ),
    },
    {
      key: 'keywords',
      header: '키워드',
      cell: (d) => (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {(d.keywords ?? []).slice(0, 4).join(', ')}
        </span>
      ),
      className: 'w-44',
    },
    {
      key: 'embedding',
      header: '임베딩',
      cell: (d) => (
        <BrandBadge variant={d.hasEmbedding ? 'green' : 'default'} className="text-xs">
          {d.hasEmbedding ? '완료' : '미생성'}
        </BrandBadge>
      ),
      className: 'w-20',
    },
    {
      key: 'enabled',
      header: '사용',
      cell: (d) => (
        <BrandBadge variant={d.enabled ? 'green' : 'default'} className="text-xs">
          {d.enabled ? '사용' : '중지'}
        </BrandBadge>
      ),
      className: 'w-16',
    },
    {
      key: 'actions',
      header: '관리',
      cell: (d) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-muted">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div>
      <PageHeader
        title="큐미 RAG 데이터"
        description={`공부도우미 큐미가 답변에 사용하는 지식 문서 · 총 ${docs.length}건`}
        actions={
          <div className="flex gap-2">
            <BrandButton variant="ghost" size="sm" loading={reindexing} onClick={handleReindex}>
              <RefreshCw className="w-4 h-4 mr-1" /> 임베딩 재생성
            </BrandButton>
            <BrandButton variant="primary" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> 문서 등록
            </BrandButton>
          </div>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-blue-subtle/60 px-4 py-3 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
        <p>
          여기에 등록한 문서가 큐미 답변의 근거(RAG)가 됩니다. 문서를 추가·수정하면 자동으로 임베딩되며,
          OpenAI 키가 설정되면 의미 기반 검색 + gpt-4o-mini 답변이 동작합니다. 키가 없어도 키워드 기반으로 답변합니다.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={docs}
        rowKey={(d) => d.id}
        loading={loading}
        empty={<p>등록된 문서가 없습니다.</p>}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">{editing ? '문서 수정' : '문서 등록'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">제목</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="예: 환불 규정 안내"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">분류</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">내용 (답변 근거)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={6}
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                  placeholder="큐미가 이 내용을 근거로 답변합니다."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  키워드 <span className="text-xs text-muted-foreground">(쉼표로 구분 · 검색 매칭에 사용)</span>
                </label>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="환불, 취소, 결제 취소, 돌려받기"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">큐미 포즈</label>
                  <select
                    value={form.pose}
                    onChange={(e) => setForm((p) => ({ ...p, pose: e.target.value }))}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {POSES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    링크 URL <span className="text-xs text-muted-foreground">(선택)</span>
                  </label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="/faq 등"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  추천 질문 <span className="text-xs text-muted-foreground">(쉼표로 구분 · 답변 후 칩으로 표시)</span>
                </label>
                <input
                  value={form.suggestions}
                  onChange={(e) => setForm((p) => ({ ...p, suggestions: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="결제 방법 알려줘, 강의 수강 방법"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                />
                사용(검색 대상에 포함)
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal(false)}>
                취소
              </BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>
                저장
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
