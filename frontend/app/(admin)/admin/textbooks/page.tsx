'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';

type TextbookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface TextbookItem {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  s3Key?: string | null;
  localPath?: string | null;
  totalPages?: number | null;
  price: number;
  isStandalone: boolean;
  status: TextbookStatus;
}

interface TextbookForm {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number;
  isStandalone: boolean;
  status: TextbookStatus;
  s3Key: string;
  localPath: string;
  totalPages: number | '';
}

type UploadMode = 'none' | 's3' | 'local';

const EMPTY_FORM: TextbookForm = {
  title: '',
  description: '',
  coverImageUrl: '',
  price: 0,
  isStandalone: false,
  status: 'DRAFT',
  s3Key: '',
  localPath: '',
  totalPages: '',
};

function toForm(book: TextbookItem): TextbookForm {
  return {
    title: book.title ?? '',
    description: book.description ?? '',
    coverImageUrl: book.coverImageUrl ?? '',
    price: book.price ?? 0,
    isStandalone: !!book.isStandalone,
    status: book.status ?? 'DRAFT',
    s3Key: book.s3Key ?? '',
    localPath: book.localPath ?? '',
    totalPages: book.totalPages ?? '',
  };
}

function detectUploadMode(form: TextbookForm): UploadMode {
  if (form.s3Key.trim()) return 's3';
  if (form.localPath.trim()) return 'local';
  return 'none';
}

export default function AdminTextbooksPage() {
  const [items, setItems] = useState<TextbookItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<TextbookForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('none');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/textbooks/admin`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error('교재 목록을 불러오지 못했습니다.');
      const list = Array.isArray(data) ? data : [];
      setItems(list);

      if (list.length === 0) {
        setSelectedId('');
        setForm(EMPTY_FORM);
        setUploadMode('none');
        return;
      }
      const target = selectedId ? list.find((item) => item.id === selectedId) ?? list[0] : list[0];
      setSelectedId(target.id);
      const nextForm = toForm(target);
      setForm(nextForm);
      setUploadMode(detectUploadMode(nextForm));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 목록을 불러오지 못했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectItem = (item: TextbookItem) => {
    setSelectedId(item.id);
    const nextForm = toForm(item);
    setForm(nextForm);
    setUploadMode(detectUploadMode(nextForm));
  };

  const updateForm = <K extends keyof TextbookForm>(key: K, value: TextbookForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadPdf = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadServerForm = new FormData();
      uploadServerForm.append('file', file);

      const uploadViaServer = async () => {
        const serverRes = await fetch(`${API_BASE}/textbooks/admin/upload`, {
          method: 'POST',
          headers: buildAuthHeader(false),
          credentials: 'include',
          body: uploadServerForm,
        });
        const serverData = await serverRes.json().catch(() => ({}));
        if (!serverRes.ok || !serverData?.s3Key) {
          throw new Error(serverData?.message ?? '서버 업로드(S3/R2)에 실패했습니다.');
        }
        setForm((prev) => ({ ...prev, s3Key: serverData.s3Key, localPath: '' }));
        setUploadMode('s3');
        toast.success('PDF 업로드 완료(S3/R2): 저장 또는 신규 등록으로 반영하세요.');
      };

      const uploadViaLocal = async (fallbackMessage?: string) => {
        const uploadLocalForm = new FormData();
        uploadLocalForm.append('file', file);
        const localRes = await fetch(`${API_BASE}/textbooks/admin/upload-local`, {
          method: 'POST',
          headers: buildAuthHeader(false),
          credentials: 'include',
          body: uploadLocalForm,
        });
        const localData = await localRes.json().catch(() => ({}));
        if (!localRes.ok || !localData?.localPath) {
          throw new Error(localData?.message ?? fallbackMessage ?? 'PDF 업로드에 실패했습니다.');
        }
        setForm((prev) => ({ ...prev, localPath: localData.localPath, s3Key: '' }));
        setUploadMode('local');
        toast.success('PDF 업로드 완료(로컬 저장): 저장 또는 신규 등록으로 반영하세요.');
      };

      try {
        const presignRes = await fetch(`${API_BASE}/textbooks/admin/upload-url`, {
          method: 'POST',
          headers: buildAuthHeader(),
          credentials: 'include',
          body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/pdf' }),
        });
        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok || !presignData?.presignedUrl || !presignData?.s3Key) {
          throw new Error(presignData?.message ?? '업로드 URL 발급에 실패했습니다.');
        }

        const uploadRes = await fetch(presignData.presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/pdf' },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error('Presigned PUT 업로드에 실패했습니다.');
        }

        setForm((prev) => ({ ...prev, s3Key: presignData.s3Key, localPath: '' }));
        setUploadMode('s3');
        toast.success('PDF 업로드 완료(S3/R2): 저장 또는 신규 등록으로 반영하세요.');
      } catch {
        // CORS/네트워크 제한으로 브라우저 직접 PUT이 실패하면 서버 업로드로 우회한다.
        try {
          await uploadViaServer();
        } catch (serverErr: unknown) {
          const message = serverErr instanceof Error ? serverErr.message : '서버 업로드에 실패했습니다.';
          await uploadViaLocal(message);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF 업로드에 실패했습니다.';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const payload = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    price: Number(form.price || 0),
    isStandalone: form.isStandalone,
    status: form.status,
    s3Key: form.s3Key.trim() || undefined,
    localPath: form.localPath.trim() || undefined,
    totalPages: form.totalPages === '' ? undefined : Number(form.totalPages),
  };

  const saveItem = async () => {
    if (!selectedId) return;
    if (!payload.title) return toast.error('교재명을 입력하세요.');
    if (!payload.s3Key && !payload.localPath) {
      return toast.error('PDF 파일(s3Key/localPath)을 먼저 업로드하거나 입력하세요.');
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/textbooks/admin/${selectedId}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '교재 저장에 실패했습니다.');
      await load();
      toast.success('교재가 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const createItem = async () => {
    if (!payload.title) return toast.error('교재명을 입력하세요.');
    if (!payload.s3Key && !payload.localPath) {
      return toast.error('PDF 파일(s3Key/localPath)을 먼저 업로드하거나 입력하세요.');
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/textbooks/admin`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '교재 등록에 실패했습니다.');
      await load();
      if (data?.id) setSelectedId(data.id);
      toast.success('교재가 등록되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 등록에 실패했습니다.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const resetNew = () => {
    setSelectedId('');
    setForm(EMPTY_FORM);
    setUploadMode('none');
  };

  const deleteItem = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm(
      '선택한 교재를 영구 삭제합니다. 판매/배포 이력이 있는 교재는 삭제할 수 없습니다. 계속하시겠습니까?',
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/textbooks/admin/${selectedId}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? '교재 삭제에 실패했습니다.');
      }

      if (Array.isArray(data?.warnings) && data.warnings.length > 0) {
        toast.warning(`교재는 삭제되었지만 일부 파일 정리에 실패했습니다: ${data.warnings[0]}`);
      } else {
        toast.success('교재가 삭제되었습니다.');
      }
      setSelectedId('');
      setForm(EMPTY_FORM);
      setUploadMode('none');
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 삭제에 실패했습니다.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>교재 관리</h1>
          <p className="text-sm text-gray-500 mt-1">교재 등록, 메타데이터 수정, PDF 업로드를 처리합니다.</p>
        </div>
        <BrandButton size="sm" variant="outline" onClick={resetNew}>
          <Plus className="w-4 h-4 mr-1" />
          신규 교재 작성
        </BrandButton>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        <div className="bg-white rounded-xl border p-3 space-y-2 max-h-[70vh] overflow-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 px-2 py-3">등록된 교재가 없습니다.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item)}
                className={`w-full text-left border rounded-lg p-3 transition ${
                  selectedId === item.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.status} | {item.price.toLocaleString()}원</p>
              </button>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="교재명" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="표지 URL" value={form.coverImageUrl} onChange={(e) => updateForm('coverImageUrl', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="가격" value={form.price} onChange={(e) => updateForm('price', Number(e.target.value))} />
            <select className="border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => updateForm('status', e.target.value as TextbookStatus)}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="스토리지 키(s3Key)" value={form.s3Key} onChange={(e) => updateForm('s3Key', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="로컬 경로(localPath)" value={form.localPath} onChange={(e) => updateForm('localPath', e.target.value)} />
            <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="총 페이지 수" value={form.totalPages} onChange={(e) => updateForm('totalPages', e.target.value === '' ? '' : Number(e.target.value))} />
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input type="checkbox" checked={form.isStandalone} onChange={(e) => updateForm('isStandalone', e.target.checked)} />
              단독 판매 교재
            </label>
          </div>

          <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-24" placeholder="교재 설명" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center">
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUploadPdf(e.target.files?.[0] ?? null)} />
              <span className="inline-flex items-center px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-1" />
                PDF 업로드
              </span>
            </label>
            <span className="text-xs text-gray-500">
              {uploading ? '업로드 중...' : form.s3Key ? `업로드 키: ${form.s3Key}` : '업로드 후 s3Key가 자동 반영됩니다.'}
            </span>
            <span className="text-xs text-gray-500">
              모드: {uploadMode === 's3' ? 'S3/R2' : uploadMode === 'local' ? 'LOCAL_PATH' : '미지정'}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <BrandButton size="sm" onClick={createItem} loading={creating}>
              <Plus className="w-4 h-4 mr-1" />
              신규 등록
            </BrandButton>
            <BrandButton
              size="sm"
              variant="danger"
              onClick={deleteItem}
              loading={deleting}
              disabled={!selectedId}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </BrandButton>
            <BrandButton size="sm" variant="secondary" onClick={saveItem} loading={saving} disabled={!selectedId}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </BrandButton>
          </div>
        </div>
      </div>
    </div>
  );
}
