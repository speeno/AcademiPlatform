'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, X, GripVertical } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

interface QualificationIntro {
  id: string;
  keywords: string[];
  subtitle: string;
  coreWork: string;
  roles: string[];
  isActive: boolean;
  order: number;
}

export default function AdminQualificationsPage() {
  const [items, setItems] = useState<QualificationIntro[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/qualification-intros`, {
        headers: buildAuthHeader(false),
      });
      if (res.ok) {
        const data = await res.json().catch(() => []);
        const arr: QualificationIntro[] = Array.isArray(data) ? data : [];
        arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(arr);
      }
    } catch {
      toast.error('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/qualification-intros`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify({
          keywords: [],
          subtitle: '새 자격',
          coreWork: '',
          roles: [],
          isActive: true,
          order: items.length,
        }),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success('자격 소개를 추가했습니다.');
    } catch {
      toast.error('추가에 실패했습니다.');
    }
  };

  const saveItem = async (item: QualificationIntro) => {
    setSavingId(item.id);
    try {
      const res = await fetch(
        `${API_BASE}/admin/qualification-intros/${item.id}`,
        {
          method: 'PATCH',
          headers: buildAuthHeader(),
          body: JSON.stringify(item),
        },
      );
      if (!res.ok) throw new Error();
      await load();
      toast.success('저장했습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('이 자격 소개를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(
        `${API_BASE}/admin/qualification-intros/${id}`,
        { method: 'DELETE', headers: buildAuthHeader(false) },
      );
      if (!res.ok) throw new Error();
      await load();
      toast.success('삭제했습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const updateField = (idx: number, field: string, value: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addRole = (idx: number) => {
    const next = [...items];
    next[idx] = { ...next[idx], roles: [...next[idx].roles, ''] };
    setItems(next);
  };

  const updateRole = (itemIdx: number, roleIdx: number, value: string) => {
    const next = [...items];
    next[itemIdx].roles = next[itemIdx].roles.map((r, i) =>
      i === roleIdx ? value : r,
    );
    setItems(next);
  };

  const removeRole = (itemIdx: number, roleIdx: number) => {
    const next = [...items];
    next[itemIdx].roles = next[itemIdx].roles.filter((_, i) => i !== roleIdx);
    setItems(next);
  };

  if (loading)
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-extrabold text-brand-blue"
            
          >
            자격 소개 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            시험 접수 페이지에 표시되는 자격 소개 항목을 관리합니다.
          </p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          항목 추가
        </BrandButton>
      </div>

      {items.map((item, idx) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">
              #{idx + 1}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                표시 이름
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="예: AI 프롬프트 엔지니어"
                value={item.subtitle}
                onChange={(e) => updateField(idx, 'subtitle', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                매칭 키워드 (쉼표로 구분)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="예: 프롬프트, 엔지니어"
                value={item.keywords.join(', ')}
                onChange={(e) =>
                  updateField(
                    idx,
                    'keywords',
                    e.target.value
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean),
                  )
                }
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                시험 세션의 자격명에 모든 키워드가 포함되어야 매칭됩니다.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              업무 핵심
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="예: 취업 및 AI 모델에 적합한 프롬프트 설계 및 최적화"
              value={item.coreWork}
              onChange={(e) => updateField(idx, 'coreWork', e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                가능한 역할
              </label>
              <button
                type="button"
                onClick={() => addRole(idx)}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors text-brand-blue"
                
              >
                <Plus className="w-3.5 h-3.5" /> 역할 추가
              </button>
            </div>
            {item.roles.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                역할이 없습니다. &quot;역할 추가&quot;를 클릭하세요.
              </p>
            ) : (
              <div className="space-y-2">
                {item.roles.map((role, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      placeholder="예: 기업/교육기관에서 AI 활용 가이드 제작"
                      value={role}
                      onChange={(e) => updateRole(idx, rIdx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeRole(idx, rIdx)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.isActive !== false}
                  onChange={(e) =>
                    updateField(idx, 'isActive', e.target.checked)
                  }
                />
                활성화
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                표시 순서
              </label>
              <input
                type="number"
                className="w-24 border rounded-lg px-3 py-2 text-sm"
                value={item.order}
                onChange={(e) =>
                  updateField(idx, 'order', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <BrandButton
              variant="outline"
              size="sm"
              onClick={() => deleteItem(item.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> 삭제
            </BrandButton>
            <BrandButton
              variant="secondary"
              size="sm"
              loading={savingId === item.id}
              onClick={() => saveItem(item)}
            >
              <Save className="w-4 h-4 mr-1" /> 저장
            </BrandButton>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-10 bg-white rounded-xl border">
          등록된 자격 소개가 없습니다. 위 &quot;항목 추가&quot; 버튼을 눌러
          추가하세요.
        </div>
      )}
    </div>
  );
}
