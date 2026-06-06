'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageShell } from '@/components/layout/PageShell';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth } from '@/lib/api-client';

const roleLabel: Record<string, string> = { USER: '일반', INSTRUCTOR: '강사', OPERATOR: '운영자', SUPER_ADMIN: '최고관리자' };
const roleOptions = Object.keys(roleLabel) as Array<keyof typeof roleLabel>;
const statusVariant: Record<string, 'green' | 'orange' | 'red'> = { ACTIVE: 'green', DORMANT: 'orange', SUSPENDED: 'red' };
const statusLabel: Record<string, string> = { ACTIVE: '정상', DORMANT: '휴면', SUSPENDED: '정지' };

interface User { id: string; name: string; email: string; phone: string | null; role: string; status: string; createdAt: string; _count: { enrollments: number; payments: number }; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [myId, setMyId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (q) params.set('search', q);
      if (roleFilter) params.set('role', roleFilter);
      const res = await apiFetchWithAuth(`/admin/users?${params}`);
      if (res.ok) { const d = await res.json(); setUsers(d.users ?? []); setTotal(d.total ?? 0); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, roleFilter]);

  useEffect(() => {
    apiFetchWithAuth('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.id) setMyId(String(me.id));
        if (me?.role) setMyRole(String(me.role));
      })
      .catch(() => { /* ignore */ });
  }, []);

  const assignableRoles = roleOptions.filter(
    (r) => r !== 'SUPER_ADMIN' || myRole === 'SUPER_ADMIN',
  );

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const res = await apiFetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setUsers((p) => p.map((u) => u.id === id ? { ...u, status } : u));
    } catch { /* ignore */ } finally { setUpdatingStatus(null); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    setUpdatingRole(id);
    try {
      const res = await apiFetchWithAuth(`/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err?.message === 'string'
          ? err.message
          : Array.isArray(err?.message)
            ? err.message.join(', ')
            : '역할 변경에 실패했습니다.';
        window.alert(msg);
        await load();
      }
    } catch { /* ignore */ } finally { setUpdatingRole(null); }
  };

  const handlePasswordReset = async (user: User) => {
    const passwordLocked =
      myId === user.id ||
      (user.role === 'SUPER_ADMIN' && myRole !== 'SUPER_ADMIN');
    if (passwordLocked) return;

    if (!window.confirm(`${user.name}(${user.email}) 회원의 비밀번호를 초기화할까요?`)) {
      return;
    }

    const customPassword = window.prompt(
      '새 비밀번호(8자 이상, 영문+숫자). 비우면 임시 비밀번호가 자동 생성됩니다.',
      '',
    );
    if (customPassword === null) return;

    setResettingPassword(user.id);
    try {
      const body = customPassword.trim()
        ? { password: customPassword.trim() }
        : {};
      const res = await apiFetchWithAuth(`/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err?.message === 'string'
          ? err.message
          : Array.isArray(err?.message)
            ? err.message.join(', ')
            : '비밀번호 초기화에 실패했습니다.';
        window.alert(msg);
        return;
      }
      const data = await res.json();
      window.alert(
        `비밀번호가 초기화되었습니다.\n\n회원: ${user.email}\n새 비밀번호: ${data.temporaryPassword}\n\n안전한 채널로 전달 후 로그인 시 변경을 안내해 주세요.`,
      );
    } catch {
      window.alert('비밀번호 초기화에 실패했습니다.');
    } finally {
      setResettingPassword(null);
    }
  };

  const columns: DataTableColumn<User>[] = [
    { key: 'name', header: '이름', cell: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: '이메일', cell: (u) => <span className="text-xs text-muted-foreground">{u.email}</span>, hideOnMobile: true },
    {
      key: 'role',
      header: '역할',
      cell: (u) => {
        const roleLocked =
          myId === u.id ||
          (u.role === 'SUPER_ADMIN' && myRole !== 'SUPER_ADMIN');
        if (roleLocked) {
          return (
            <BrandBadge variant="blue" className="text-xs">
              {roleLabel[u.role] ?? u.role}
            </BrandBadge>
          );
        }
        return (
          <select
            value={u.role}
            disabled={updatingRole === u.id}
            onChange={(e) => handleRoleChange(u.id, e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white min-w-[6.5rem]"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>{roleLabel[r]}</option>
            ))}
          </select>
        );
      },
    },
    { key: 'status', header: '상태', cell: (u) => <BrandBadge variant={statusVariant[u.status] ?? 'default'} className="text-xs">{statusLabel[u.status] ?? u.status}</BrandBadge> },
    { key: 'enrollments', header: '수강', cell: (u) => <span className="text-center block">{u._count?.enrollments ?? 0}</span>, className: 'w-16', hideOnMobile: true },
    { key: 'payments', header: '결제', cell: (u) => <span className="text-center block">{u._count?.payments ?? 0}</span>, className: 'w-16', hideOnMobile: true },
    { key: 'createdAt', header: '가입일', cell: (u) => <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</span>, hideOnMobile: true },
    {
      key: 'actions', header: '관리', cell: (u) => (
        <div className="flex flex-col gap-1.5 min-w-[7.5rem]">
          <select
            value={u.status}
            disabled={updatingStatus === u.id}
            onChange={(e) => handleStatusChange(u.id, e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="ACTIVE">정상</option>
            <option value="DORMANT">휴면</option>
            <option value="SUSPENDED">정지</option>
          </select>
          <BrandButton
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] whitespace-nowrap"
            disabled={
              resettingPassword === u.id ||
              myId === u.id ||
              (u.role === 'SUPER_ADMIN' && myRole !== 'SUPER_ADMIN')
            }
            loading={resettingPassword === u.id}
            onClick={() => handlePasswordReset(u)}
          >
            비밀번호 초기화
          </BrandButton>
        </div>
      ),
    },
  ];

  return (
    <PageShell size="full" flush>
      <PageHeader title="회원 관리" description={`총 ${total}명`} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="이름, 이메일 검색"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">전체 역할</option>
          {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <BrandButton variant="outline" size="sm" onClick={() => { setPage(1); load(); }}>검색</BrandButton>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        loading={loading}
        empty={<p>회원이 없습니다.</p>}
      />

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <BrandButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</BrandButton>
          <span className="text-sm text-muted-foreground">{page} / {Math.ceil(total / 20)}</span>
          <BrandButton variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>다음</BrandButton>
        </div>
      )}
    </PageShell>
  );
}
