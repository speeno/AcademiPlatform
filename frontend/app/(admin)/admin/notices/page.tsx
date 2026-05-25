'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Pin } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { HtmlWysiwygEditor } from '@/components/cms/HtmlWysiwygEditor';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
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
  attachments?: NoticeAttachment[];
}

interface NoticeAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  createdAt: string;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: Notice;
}

export default function AdminNoticesPage() {
  const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
  const allowedExtensions = new Set([
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'hwp',
    'txt',
  ]);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, isPublished: true });
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>([]);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

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
    setPendingFiles([]);
    setExistingAttachments([]);
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = async (n: Notice) => {
    let content = n.content ?? '';
    let attachments = n.attachments ?? [];
    if (!content) {
      try {
        const res = await fetch(`${API_BASE}/admin/notices`, { headers: buildAuthHeader(false) });
        if (res.ok) {
          const d = await res.json();
          const list: Notice[] = d.notices ?? d;
          const found = list.find((item) => item.id === n.id);
          if (found) content = found.content ?? '';
          if (found) attachments = found.attachments ?? [];
        }
      } catch { /* ignore */ }
    }
    setPendingFiles([]);
    setExistingAttachments(attachments);
    setForm({ title: n.title, content, isPinned: n.isPinned, isPublished: n.isPublished });
    setModal({ open: true, mode: 'edit', data: n });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowedExtensions.has(extension)) {
        toast.error(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name}: 첨부파일은 5MB 이하만 업로드할 수 있습니다.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }
    event.currentTarget.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!modal.data?.id || deletingAttachmentId) return;
    setDeletingAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `${API_BASE}/admin/notices/${modal.data.id}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: buildAuthHeader(false),
        },
      );
      if (res.ok) {
        setExistingAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
        setNotices((prev) =>
          prev.map((notice) =>
            notice.id === modal.data?.id
              ? {
                  ...notice,
                  attachments: (notice.attachments ?? []).filter(
                    (item) => item.id !== attachmentId,
                  ),
                }
              : notice,
          ),
        );
        toast.success('첨부파일이 삭제되었습니다.');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? '첨부파일 삭제에 실패했습니다.');
      }
    } catch {
      toast.error('첨부파일 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const url = modal.mode === 'create' ? `${API_BASE}/admin/notices` : `${API_BASE}/admin/notices/${modal.data?.id}`;
      const method = modal.mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: buildAuthHeader(), body: JSON.stringify(form) });
      if (res.ok) {
        const savedNotice: Notice = await res.json().catch(() => ({ id: modal.data?.id ?? '' } as Notice));
        const noticeId = savedNotice.id || modal.data?.id;
        if (!noticeId) {
          toast.error('공지 식별자를 찾을 수 없습니다.');
          return;
        }

        for (const file of pendingFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch(`${API_BASE}/admin/notices/${noticeId}/attachments`, {
            method: 'POST',
            headers: buildAuthHeader(false),
            body: formData,
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}));
            throw new Error(err.message ?? `${file.name} 업로드에 실패했습니다.`);
          }
        }

        toast.success(modal.mode === 'create' ? '공지가 등록되었습니다.' : '공지가 수정되었습니다.');
        setPendingFiles([]);
        setExistingAttachments([]);
        setModal({ open: false, mode: 'create' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? '저장에 실패했습니다.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    }
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

  const columns: DataTableColumn<Notice>[] = [
    { key: 'title', header: '제목', cell: (n) => <span className="font-medium line-clamp-1">{n.title}</span> },
    { key: 'pinned', header: '고정', cell: (n) => n.isPinned ? <Pin className="w-4 h-4 text-brand-orange" /> : null, className: 'w-12' },
    { key: 'published', header: '게시', cell: (n) => <BrandBadge variant={n.isPublished ? 'green' : 'default'} className="text-xs">{n.isPublished ? '게시 중' : '비공개'}</BrandBadge>, className: 'w-24' },
    { key: 'createdAt', header: '등록일', cell: (n) => <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</span>, className: 'w-28', hideOnMobile: true },
    {
      key: 'actions', header: '관리', cell: (n) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      ), className: 'w-20',
    },
  ];

  return (
    <div>
      <PageHeader
        title="공지사항 관리"
        description={`총 ${notices.length}건`}
        actions={
          <BrandButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 공지 등록
          </BrandButton>
        }
      />

      <DataTable
        columns={columns}
        rows={notices}
        rowKey={(n) => n.id}
        loading={loading}
        empty={<p>공지사항이 없습니다.</p>}
      />

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
              <div>
                <label className="block text-sm font-medium mb-1">첨부 문서</label>
                <p className="text-xs text-muted-foreground mb-2">
                  파일당 5MB 이하, PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/HWP/TXT
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt"
                  onChange={handleFileSelect}
                  className="block w-full border rounded-lg px-3 py-2 text-sm"
                  disabled={saving}
                />
                {existingAttachments.length > 0 && (
                  <ul className="mt-3 space-y-2 border rounded-lg p-3 bg-muted/20">
                    {existingAttachments.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">
                          {item.fileName} ({formatFileSize(item.fileSize)})
                        </span>
                        <button
                          type="button"
                          className="text-red-500 text-xs"
                          disabled={deletingAttachmentId === item.id || saving}
                          onClick={() => handleDeleteAttachment(item.id)}
                        >
                          {deletingAttachmentId === item.id ? '삭제 중...' : '삭제'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {pendingFiles.length > 0 && (
                  <ul className="mt-3 space-y-2 border rounded-lg p-3">
                    {pendingFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate">
                          {file.name} ({formatFileSize(file.size)})
                        </span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground"
                          onClick={() => removePendingFile(index)}
                          disabled={saving}
                        >
                          제외
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
              <BrandButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingFiles([]);
                  setExistingAttachments([]);
                  setModal({ open: false, mode: 'create' });
                }}
              >
                취소
              </BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>저장</BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
