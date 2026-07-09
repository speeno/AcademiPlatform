'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface MemberResult {
  id: string;
  name: string;
  email: string;
}

interface ParticipantAddModalProps {
  open: boolean;
  programId: string;
  /** 이미 등록된 회원 userId 목록 — 중복 버튼 비활성화 */
  registeredUserIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2 text-sm';

export function ParticipantAddModal({
  open,
  programId,
  registeredUserIds,
  onClose,
  onAdded,
}: ParticipantAddModalProps) {
  const [tab, setTab] = useState<'member' | 'external'>('member');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [external, setExternal] = useState({
    name: '',
    phone: '',
    email: '',
    affiliation: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTab('member');
      setQuery('');
      setResults([]);
      setExternal({ name: '', phone: '', email: '', affiliation: '' });
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetchWithAuth(
          `/training/users/search?q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return;
        const data = await parseJsonSafe<{ users: MemberResult[] }>(res, { users: [] });
        setResults(data.users);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const addParticipant = async (body: Record<string, string>) => {
    const res = await apiFetchWithAuth(`/training/programs/${programId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      throw new Error(data.message ?? '수강생 등록에 실패했습니다.');
    }
  };

  const handleAddMember = async (member: MemberResult) => {
    setAddingId(member.id);
    try {
      await addParticipant({ userId: member.id });
      toast.success(`${member.name}님이 등록되었습니다.`);
      onAdded();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingId(null);
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!external.phone.trim() && !external.email.trim()) {
      toast.error('연락처 또는 이메일을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await addParticipant({
        name: external.name.trim(),
        ...(external.phone.trim() && { phone: external.phone.trim() }),
        ...(external.email.trim() && { email: external.email.trim() }),
        ...(external.affiliation.trim() && { affiliation: external.affiliation.trim() }),
      });
      toast.success(`${external.name}님이 등록되었습니다.`);
      setExternal({ name: '', phone: '', email: '', affiliation: '' });
      onAdded();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-foreground">수강생 등록</h2>

        {/* 탭 */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: 'member', label: '회원 검색' },
              { key: 'external', label: '직접 등록 (비회원)' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'member' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 이메일 검색 (2자 이상)"
                className={`${inputClass} pl-9`}
                autoFocus
              />
            </div>
            <div className="min-h-[200px] flex-1 overflow-y-auto">
              {searching ? (
                <p className="py-8 text-center text-sm text-muted-foreground">검색 중…</p>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {query.trim().length < 2
                    ? '검색어를 입력하면 회원 목록이 표시됩니다.'
                    : '검색 결과가 없습니다.'}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((member) => {
                    const registered = registeredUserIds.has(member.id);
                    return (
                      <li key={member.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {registered ? (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            등록됨
                          </span>
                        ) : (
                          <BrandButton
                            size="sm"
                            variant="outline"
                            loading={addingId === member.id}
                            onClick={() => handleAddMember(member)}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            추가
                          </BrandButton>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddExternal} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={external.name}
                onChange={(e) => setExternal({ ...external, name: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">연락처</label>
                <input
                  type="tel"
                  value={external.phone}
                  onChange={(e) => setExternal({ ...external, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">이메일</label>
                <input
                  type="email"
                  value={external.email}
                  onChange={(e) => setExternal({ ...external, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">소속</label>
              <input
                type="text"
                value={external.affiliation}
                onChange={(e) => setExternal({ ...external, affiliation: e.target.value })}
                placeholder="예: OO기업 인사팀"
                className={inputClass}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              연락처와 이메일 중 최소 하나는 입력해야 합니다. 동일 연락처/이메일은 중복 등록되지
              않습니다.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <BrandButton type="submit" variant="primary" loading={saving}>
                등록
              </BrandButton>
            </div>
          </form>
        )}

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <BrandButton type="button" variant="ghost" onClick={onClose}>
            닫기
          </BrandButton>
        </div>
      </div>
    </div>
  );
}
