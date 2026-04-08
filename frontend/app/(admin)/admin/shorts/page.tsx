'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Settings } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

interface ShortsItem {
  id: string;
  type: 'youtube' | 'instagram';
  videoId: string;
  title: string;
  thumbnailUrl: string;
  linkUrl: string;
  isActive: boolean;
}

interface DisplaySettings {
  showOnMain: boolean;
  showOnCourseDetail: boolean;
  mainMaxItems: number;
}

const DEFAULT_DISPLAY: DisplaySettings = {
  showOnMain: true,
  showOnCourseDetail: true,
  mainMaxItems: 6,
};

export default function AdminShortsPage() {
  const [items, setItems] = useState<ShortsItem[]>([]);
  const [display, setDisplay] = useState<DisplaySettings>(DEFAULT_DISPLAY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDisplay, setSavingDisplay] = useState(false);

  const load = async () => {
    try {
      const [itemsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/shorts-gallery`, { headers: buildAuthHeader(false) }),
        fetch(`${API_BASE}/admin/settings`, { headers: buildAuthHeader(false) }),
      ]);
      if (itemsRes.ok) {
        const data = await itemsRes.json().catch(() => []);
        setItems(Array.isArray(data) ? data : []);
      }
      if (settingsRes.ok) {
        const all = await settingsRes.json().catch(() => ({}));
        if (all.shorts_display) {
          try { setDisplay({ ...DEFAULT_DISPLAY, ...JSON.parse(all.shorts_display) }); } catch {}
        }
      }
    } catch {
      toast.error('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/shorts-gallery`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify({ type: 'youtube', videoId: '', title: '', isActive: true }),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success('영상 항목을 추가했습니다.');
    } catch {
      toast.error('영상 추가에 실패했습니다.');
    }
  };

  const saveItem = async (item: ShortsItem) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shorts-gallery/${item.id}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success('저장했습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/shorts-gallery/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success('삭제했습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const saveDisplay = async () => {
    setSavingDisplay(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/shorts_display`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify({ value: JSON.stringify(display) }),
      });
      if (!res.ok) throw new Error();
      toast.success('노출 설정을 저장했습니다.');
    } catch {
      toast.error('노출 설정 저장에 실패했습니다.');
    } finally {
      setSavingDisplay(false);
    }
  };

  const updateField = (idx: number, field: string, value: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  if (loading) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>홍보영상 관리</h1>
          <p className="text-sm text-gray-500 mt-1">갤러리 페이지 및 메인/교육과정 페이지에 노출할 홍보 영상을 관리합니다.</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          영상 추가
        </BrandButton>
      </div>

      {items.map((item, idx) => (
        <div key={item.id} className="bg-white rounded-xl border p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">형태</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={item.type}
                onChange={(e) => updateField(idx, 'type', e.target.value)}
              >
                <option value="youtube">YouTube Shorts (세로형)</option>
                <option value="instagram">Instagram Feed (정사각형)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">영상 ID</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={item.type === 'youtube' ? '예: 5KU6PXCfLtI' : '예: reel ID'}
                value={item.videoId}
                onChange={(e) => updateField(idx, 'videoId', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">제목</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="영상 제목"
              value={item.title}
              onChange={(e) => updateField(idx, 'title', e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                썸네일 URL {item.type === 'youtube' && <span className="text-gray-400">(비워두면 자동)</span>}
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={item.type === 'youtube' ? '자동 생성됨' : 'https://...'}
                value={item.thumbnailUrl}
                onChange={(e) => updateField(idx, 'thumbnailUrl', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                링크 URL {item.type === 'youtube' && <span className="text-gray-400">(비워두면 자동)</span>}
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={item.type === 'youtube' ? '자동 생성됨' : 'https://www.instagram.com/reel/...'}
                value={item.linkUrl}
                onChange={(e) => updateField(idx, 'linkUrl', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.isActive !== false}
                onChange={(e) => updateField(idx, 'isActive', e.target.checked)}
              />
              활성화
            </label>
            <div className="flex gap-2">
              <BrandButton variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> 삭제
              </BrandButton>
              <BrandButton variant="secondary" size="sm" loading={saving} onClick={() => saveItem(item)}>
                <Save className="w-4 h-4 mr-1" /> 저장
              </BrandButton>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-10 bg-white rounded-xl border">
          등록된 홍보영상이 없습니다. 위 "영상 추가" 버튼을 눌러 추가하세요.
        </div>
      )}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
          <h2 className="text-lg font-bold text-gray-900">노출 위치 설정</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={display.showOnMain}
              onChange={(e) => setDisplay({ ...display, showOnMain: e.target.checked })}
            />
            메인 페이지에 노출
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={display.showOnCourseDetail}
              onChange={(e) => setDisplay({ ...display, showOnCourseDetail: e.target.checked })}
            />
            교육과정 상세 페이지에 노출
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">메인 페이지 최대 노출 수</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-20 border rounded-lg px-3 py-2 text-sm"
              value={display.mainMaxItems}
              onChange={(e) => setDisplay({ ...display, mainMaxItems: Number(e.target.value) || 6 })}
            />
          </div>
        </div>
        <BrandButton variant="primary" size="sm" loading={savingDisplay} onClick={saveDisplay}>
          <Save className="w-4 h-4 mr-1" /> 노출 설정 저장
        </BrandButton>
      </div>
    </div>
  );
}
