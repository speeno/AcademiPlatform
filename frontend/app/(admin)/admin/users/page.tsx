'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

const roleLabel: Record<string, string> = { USER: '일반', INSTRUCTOR: '강사', OPERATOR: '운영자', SUPER_ADMIN: '최고관리자' };
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
  const [updating, setUpdating] = useState<string | null>(null);

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

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await apiFetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setUsers((p) => p.map((u) => u.id === id ? { ...u, status } : u));
    } catch { /* ignore */ } finally { setUpdating(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>회원 관리</h1>
        <p className="text-sm text-gray-500 mt-1">총 {total}명</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['이름', '이메일', '역할', '상태', '수강', '결제', '가입일', '관리'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">회원이 없습니다.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><BrandBadge variant="blue" className="text-xs">{roleLabel[u.role] ?? u.role}</BrandBadge></td>
                  <td className="px-4 py-3"><BrandBadge variant={statusVariant[u.status] ?? 'default'} className="text-xs">{statusLabel[u.status] ?? u.status}</BrandBadge></td>
                  <td className="px-4 py-3 text-center text-gray-600">{u._count?.enrollments ?? 0}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{u._count?.payments ?? 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.status}
                      disabled={updating === u.id}
                      onChange={(e) => handleStatusChange(u.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="ACTIVE">정상</option>
                      <option value="DORMANT">휴면</option>
                      <option value="SUSPENDED">정지</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <BrandButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</BrandButton>
          <span className="text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
          <BrandButton variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>다음</BrandButton>
        </div>
      )}
    </div>
  );
}
