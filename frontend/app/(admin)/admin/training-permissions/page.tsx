'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface Grant {
  id: string;
  userId: string;
  grantedAt: string;
  note?: string | null;
  user: { id: string; name: string; email: string; role: string };
  grantedBy?: { id: string; name: string } | null;
}

interface UserResult {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** 교육 운영 권한 관리 — 개별 사용자에게 부여/회수 */
export default function TrainingPermissionsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);

  const fetchGrants = useCallback(async () => {
    const res = await apiFetchWithAuth('/training/admin/permissions');
    if (res.ok) {
      const data = await parseJsonSafe<{ grants: Grant[] }>(res, { grants: [] });
      setGrants(data.grants);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchGrants();
  }, [fetchGrants]);

  // 회원 검색(기존 admin users API 재사용)
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
          `/admin/users?search=${encodeURIComponent(q)}&limit=10`,
        );
        if (!res.ok) return;
        const data = await parseJsonSafe<{ users: UserResult[] }>(res, { users: [] });
        setResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const grantedUserIds = new Set(grants.map((g) => g.userId));

  const handleGrant = async (user: UserResult) => {
    setGrantingId(user.id);
    try {
      const res = await apiFetchWithAuth('/training/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '권한 부여에 실패했습니다.');
      }
      toast.success(`${user.name}님에게 교육 운영 권한을 부여했습니다.`);
      await fetchGrants();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGrantingId(null);
    }
  };

  const handleRevoke = async (grant: Grant) => {
    if (
      !confirm(
        `${grant.user.name}님의 교육 운영 권한을 회수할까요?\n해당 사용자가 만든 강의 계획은 유지되며 관리자는 계속 볼 수 있습니다.`,
      )
    ) {
      return;
    }
    const res = await apiFetchWithAuth(`/training/admin/permissions/${grant.userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      toast.error(data.message ?? '권한 회수에 실패했습니다.');
      return;
    }
    toast.success('권한이 회수되었습니다.');
    await fetchGrants();
  };

  const columns: DataTableColumn<Grant>[] = [
    {
      key: 'user',
      header: '사용자',
      cell: (g) => (
        <div>
          <p className="font-medium text-foreground">{g.user.name}</p>
          <p className="text-xs text-muted-foreground">{g.user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: '역할',
      cell: (g) => <BrandBadge variant="gray">{g.user.role}</BrandBadge>,
      className: 'w-32',
      hideOnMobile: true,
    },
    {
      key: 'grantedAt',
      header: '부여일',
      cell: (g) => new Date(g.grantedAt).toLocaleDateString('ko-KR'),
      className: 'w-32',
    },
    {
      key: 'grantedBy',
      header: '부여자',
      cell: (g) => g.grantedBy?.name ?? '—',
      className: 'w-28',
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (g) => (
        <BrandButton variant="ghost" size="sm" onClick={() => handleRevoke(g)}>
          <Trash2 className="h-3.5 w-3.5" /> 회수
        </BrandButton>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="회원"
        title="교육 운영 권한"
        description="권한이 부여된 사용자는 개인 메뉴의 '교육 운영'에서 강의 계획·수강생·수료증을 관리할 수 있습니다. 운영자(OPERATOR) 이상은 별도 부여 없이 사용 가능합니다."
        actions={
          <BrandButton variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <ShieldPlus className="h-4 w-4" /> 권한 부여
          </BrandButton>
        }
      />

      <DataTable
        columns={columns}
        rows={grants}
        rowKey={(g) => g.id}
        loading={loading}
        empty="권한이 부여된 사용자가 없습니다."
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">교육 운영 권한 부여</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 이메일 검색 (2자 이상)"
                className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
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
                  {results.map((user) => (
                    <li key={user.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.name}
                          <span className="ml-2 text-xs text-muted-foreground">{user.role}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      {grantedUserIds.has(user.id) ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          부여됨
                        </span>
                      ) : (
                        <BrandButton
                          size="sm"
                          variant="outline"
                          loading={grantingId === user.id}
                          onClick={() => handleGrant(user)}
                        >
                          부여
                        </BrandButton>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end border-t border-border pt-4">
              <BrandButton variant="ghost" onClick={() => setModalOpen(false)}>
                닫기
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
