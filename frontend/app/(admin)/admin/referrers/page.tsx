'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Save, Trash2, UserPlus, X, BarChart3, Settings2, ChevronRight, ChevronDown } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader } from '@/components/ui/page-loader';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import type { ReferrerGroup, ReferrerMember } from '@/lib/referrer';
import { toast } from 'sonner';

type Member = ReferrerMember;

interface ExamSubStat {
  examName: string;
  examSessionId: string;
  total: number;
  byStatus: Record<string, number>;
}

interface ReferrerStat {
  code: string;
  memberName: string;
  groupName: string;
  total: number;
  byStatus: Record<string, number>;
  byExam?: ExamSubStat[];
}

const STATUS_COLS: { key: string; label: string; color: string }[] = [
  { key: 'APPLIED',          label: '접수완료', color: '#16a34a' },
  { key: 'TEMP_SAVED',       label: '임시저장', color: '#6b7280' },
  { key: 'PAYMENT_PENDING',  label: '결제대기', color: '#f59e0b' },
  { key: 'CANCELLED',        label: '취소',     color: '#ef4444' },
  { key: 'REFUND_REQUESTED', label: '환불요청', color: '#f97316' },
  { key: 'REFUNDED',         label: '환불완료', color: '#9ca3af' },
];

type TabType = 'manage' | 'stats';

export default function AdminReferrersPage() {
  const [tab, setTab] = useState<TabType>('manage');
  const [groups, setGroups] = useState<ReferrerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState<ReferrerStat[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalByStatus, setTotalByStatus] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

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

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/referrer-stats`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats ?? []);
        setTotalCount(data.totalCount ?? 0);
        setTotalByStatus(data.totalByStatus ?? {});
      }
    } catch {
      toast.error('통계를 불러오지 못했습니다.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
  }, [tab, loadStats]);

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

  const updateGroup = <K extends keyof ReferrerGroup>(idx: number, field: K, value: ReferrerGroup[K]) => {
    const next = [...groups];
    next[idx] = { ...next[idx], [field]: value };
    setGroups(next);
  };

  const addMember = (groupIdx: number) => {
    const next = [...groups];
    const group = next[groupIdx];
    const num = group.members.length + 1;
    group.members = [
      ...group.members,
      {
        code: `${group.groupName}-${String(num).padStart(3, '0')}`,
        label: `${group.groupName} ${num}`,
        depositBank: '',
        depositAccount: '',
        depositHolder: '',
      },
    ];
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="권유자 관리" description="시험 접수 시 선택 가능한 권유자 그룹 및 멤버를 관리합니다." />

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab('manage')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'manage'
              ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings2 className="w-4 h-4" /> 관리
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'stats'
              ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> 통계
        </button>
      </div>

      {tab === 'manage' && (
        <>
          <div className="flex justify-end">
            <BrandButton variant="primary" size="sm" onClick={addGroup}>
              <Plus className="w-4 h-4 mr-1" />
              그룹 추가
            </BrandButton>
          </div>

          {groups.map((group, gIdx) => (
            <div key={group.id} className="bg-white rounded-xl border p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">그룹 이름</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={group.groupName}
                    onChange={(e) => updateGroup(gIdx, 'groupName', e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="text-sm text-foreground flex items-center gap-2">
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
                  <label className="text-xs font-medium text-muted-foreground">멤버 목록</label>
                  <button
                    type="button"
                    onClick={() => addMember(gIdx)}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors text-brand-blue"
                    
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 멤버 추가
                  </button>
                </div>
                {group.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">멤버가 없습니다. &quot;멤버 추가&quot;를 클릭하세요.</p>
                ) : (
                  <div className="space-y-3">
                    {group.members.map((member, mIdx) => (
                      <div key={mIdx} className="rounded-lg border bg-muted/30 p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white"
                            placeholder="코드 (예: GTC-001)"
                            value={member.code}
                            onChange={(e) => updateMember(gIdx, mIdx, 'code', e.target.value)}
                          />
                          <input
                            className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white"
                            placeholder="표시명 (예: GTC Team 1)"
                            value={member.label}
                            onChange={(e) => updateMember(gIdx, mIdx, 'label', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeMember(gIdx, mIdx)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                            멤버별 입금 계좌 정보 <span className="font-normal">(선택사항)</span>
                          </p>
                          <div className="grid md:grid-cols-3 gap-2">
                            <input
                              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
                              placeholder="입금은행 (예: 농협은행)"
                              value={member.depositBank ?? ''}
                              onChange={(e) => updateMember(gIdx, mIdx, 'depositBank', e.target.value)}
                            />
                            <input
                              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
                              placeholder="입금계좌"
                              value={member.depositAccount ?? ''}
                              onChange={(e) => updateMember(gIdx, mIdx, 'depositAccount', e.target.value)}
                            />
                            <input
                              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
                              placeholder="예금주"
                              value={member.depositHolder ?? ''}
                              onChange={(e) => updateMember(gIdx, mIdx, 'depositHolder', e.target.value)}
                            />
                          </div>
                        </div>
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
            <div className="text-center text-muted-foreground py-10 bg-white rounded-xl border">
              등록된 권유자 그룹이 없습니다. 위 &quot;그룹 추가&quot; 버튼을 눌러 추가하세요.
            </div>
          )}
        </>
      )}

      {tab === 'stats' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {statsLoading ? (
            <PageLoader height="h-40" />
          ) : stats.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              권유자별 접수 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    {['그룹명', '멤버명', '코드', '시험'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-blue" >전체</th>
                    {STATUS_COLS.map((sc) => (
                      <th key={sc.key} className="px-3 py-3 text-right text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.map((s) => {
                    const isExpanded = expandedCodes.has(s.code);
                    const hasExams = (s.byExam?.length ?? 0) > 0;
                    return (
                      <React.Fragment key={s.code}>
                        <tr
                          className={`hover:bg-muted/30 ${hasExams ? 'cursor-pointer' : ''}`}
                          onClick={() => hasExams && toggleExpand(s.code)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">{s.groupName}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{s.memberName}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.code}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {hasExams && (
                              <span className="inline-flex items-center gap-1">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                (전체)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-brand-blue" >{s.total.toLocaleString()}</td>
                          {STATUS_COLS.map((sc) => (
                            <td key={sc.key} className="px-3 py-3 text-right tabular-nums" style={{ color: (s.byStatus[sc.key] ?? 0) > 0 ? sc.color : '#d1d5db' }}>
                              {(s.byStatus[sc.key] ?? 0).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        {isExpanded && s.byExam?.map((ex) => (
                          <tr key={`${s.code}-${ex.examSessionId}`} className="bg-blue-50/30">
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2 text-xs text-muted-foreground pl-8">{ex.examName}</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-brand-blue" >{ex.total.toLocaleString()}</td>
                            {STATUS_COLS.map((sc) => (
                              <td key={sc.key} className="px-3 py-2 text-right text-xs tabular-nums" style={{ color: (ex.byStatus[sc.key] ?? 0) > 0 ? sc.color : '#d1d5db' }}>
                                {(ex.byStatus[sc.key] ?? 0).toLocaleString()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-muted/30 font-semibold border-t-2">
                    <td className="px-4 py-3 text-foreground" colSpan={4}>합계</td>
                    <td className="px-4 py-3 text-right text-brand-blue" >{totalCount.toLocaleString()}</td>
                    {STATUS_COLS.map((sc) => (
                      <td key={sc.key} className="px-3 py-3 text-right" style={{ color: (totalByStatus[sc.key] ?? 0) > 0 ? sc.color : '#d1d5db' }}>
                        {(totalByStatus[sc.key] ?? 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
