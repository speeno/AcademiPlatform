'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

interface Member {
  code: string;
  label: string;
}

interface ReferrerGroup {
  id: string;
  groupName: string;
  members: Member[];
  isActive: boolean;
}

export default function AdminReferrersPage() {
  const [groups, setGroups] = useState<ReferrerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/referrer-groups`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const data = await res.json().catch(() => []);
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addGroup = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/referrer-groups`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify({ groupName: '새 그룹', members: [], isActive: true }),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success('그룹을 추가했습니다.');
    } catch {
      toast.error('그룹 추가에 실패했습니다.');
    }
  };

  const saveGroup = async (group: ReferrerGroup) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/referrer-groups/${group.id}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify(group),
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

  const deleteGroup = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/referrer-groups/${id}`, {
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

  const updateGroup = (idx: number, field: string, value: any) => {
    const next = [...groups];
    next[idx] = { ...next[idx], [field]: value };
    setGroups(next);
  };

  const addMember = (groupIdx: number) => {
    const next = [...groups];
    const group = next[groupIdx];
    const num = group.members.length + 1;
    group.members = [...group.members, { code: `${group.groupName}-${String(num).padStart(3, '0')}`, label: `${group.groupName} ${num}` }];
    setGroups(next);
  };

  const updateMember = (groupIdx: number, memberIdx: number, field: keyof Member, value: string) => {
    const next = [...groups];
    next[groupIdx].members = next[groupIdx].members.map((m, i) =>
      i === memberIdx ? { ...m, [field]: value } : m,
    );
    setGroups(next);
  };

  const removeMember = (groupIdx: number, memberIdx: number) => {
    const next = [...groups];
    next[groupIdx].members = next[groupIdx].members.filter((_, i) => i !== memberIdx);
    setGroups(next);
  };

  if (loading) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>권유자 관리</h1>
          <p className="text-sm text-gray-500 mt-1">시험 접수 시 선택 가능한 권유자 그룹 및 멤버를 관리합니다.</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={addGroup}>
          <Plus className="w-4 h-4 mr-1" />
          그룹 추가
        </BrandButton>
      </div>

      {groups.map((group, gIdx) => (
        <div key={group.id} className="bg-white rounded-xl border p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">그룹 이름</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={group.groupName}
                onChange={(e) => updateGroup(gIdx, 'groupName', e.target.value)}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.isActive !== false}
                  onChange={(e) => updateGroup(gIdx, 'isActive', e.target.checked)}
                />
                활성화
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">멤버 목록</label>
              <button
                type="button"
                onClick={() => addMember(gIdx)}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--brand-blue)' }}
              >
                <UserPlus className="w-3.5 h-3.5" /> 멤버 추가
              </button>
            </div>
            {group.members.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">멤버가 없습니다. "멤버 추가"를 클릭하세요.</p>
            ) : (
              <div className="space-y-2">
                {group.members.map((member, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      placeholder="코드 (예: GTC-001)"
                      value={member.code}
                      onChange={(e) => updateMember(gIdx, mIdx, 'code', e.target.value)}
                    />
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      placeholder="표시명 (예: GTC Team 1)"
                      value={member.label}
                      onChange={(e) => updateMember(gIdx, mIdx, 'label', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMember(gIdx, mIdx)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <BrandButton variant="outline" size="sm" onClick={() => deleteGroup(group.id)}>
              <Trash2 className="w-4 h-4 mr-1" /> 삭제
            </BrandButton>
            <BrandButton variant="secondary" size="sm" loading={saving} onClick={() => saveGroup(group)}>
              <Save className="w-4 h-4 mr-1" /> 저장
            </BrandButton>
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <div className="text-center text-gray-400 py-10 bg-white rounded-xl border">
          등록된 권유자 그룹이 없습니다. 위 "그룹 추가" 버튼을 눌러 추가하세요.
        </div>
      )}
    </div>
  );
}
