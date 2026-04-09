'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Loader2, Pin } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { HtmlWysiwygEditor } from '@/components/cms/HtmlWysiwygEditor';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: Post;
}

export default function InstructorBoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');
  const [myRole, setMyRole] = useState('');
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });
  const [saving, setSaving] = useState(false);

  const loadMyInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: buildAuthHeader(false), credentials: 'include' });
      if (res.ok) {
        const me = await res.json();
        setMyId(me.id ?? '');
        setMyRole(me.role ?? '');
      }
    } catch { /* ignore */ }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/instructor-posts`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const d = await res.json();
        setPosts(d.posts ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadMyInfo();
    loadPosts();
  }, [loadMyInfo, loadPosts]);

  const canManage = (post: Post) =>
    post.author.id === myId || myRole === 'OPERATOR' || myRole === 'SUPER_ADMIN';

  const openCreate = () => {
    setForm({ title: '', content: '', isPinned: false });
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (post: Post) => {
    setForm({ title: post.title, content: post.content, isPinned: post.isPinned });
    setModal({ open: true, mode: 'edit', data: post });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const url = modal.mode === 'create'
        ? `${API_BASE}/instructor-posts`
        : `${API_BASE}/instructor-posts/${modal.data?.id}`;
      const method = modal.mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: buildAuthHeader(), body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(modal.mode === 'create' ? '게시글이 등록되었습니다.' : '게시글이 수정되었습니다.');
        setModal({ open: false, mode: 'create' });
        loadPosts();
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch { toast.error('저장 중 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/instructor-posts/${id}`, { method: 'DELETE', headers: buildAuthHeader(false) });
      if (res.ok) {
        toast.success('삭제되었습니다.');
        setPosts((p) => p.filter((post) => post.id !== id));
      }
    } catch { toast.error('삭제에 실패했습니다.'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>강사 게시판</h1>
          <p className="text-sm text-gray-500 mt-1">강사들의 소통 공간 · 총 {posts.length}건</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> 글쓰기
        </BrandButton>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['제목', '작성자', '고정', '작성일', '관리'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">게시글이 없습니다.</td></tr>
            ) : posts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/classroom/instructor/board/${p.id}`} className="font-medium text-gray-800 hover:underline line-clamp-1">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{p.author.name}</td>
                <td className="px-4 py-3">
                  {p.isPinned && <Pin className="w-4 h-4" style={{ color: 'var(--brand-orange)' }} />}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {canManage(p) && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">{modal.mode === 'create' ? '글쓰기' : '글 수정'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">내용</label>
                <HtmlWysiwygEditor
                  value={form.content}
                  onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                />
                상단 고정
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal({ open: false, mode: 'create' })}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>저장</BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
