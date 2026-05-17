'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
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
  updatedAt: string;
  author: { id: string; name: string };
}

export default function InstructorPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');
  const [myRole, setMyRole] = useState('');
  const [editing, setEditing] = useState(false);
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

  const loadPost = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/instructor-posts/${postId}`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [postId]);

  useEffect(() => {
    loadMyInfo();
    loadPost();
  }, [loadMyInfo, loadPost]);

  const canManage = post && (post.author.id === myId || myRole === 'OPERATOR' || myRole === 'SUPER_ADMIN');

  const startEdit = () => {
    if (!post) return;
    setForm({ title: post.title, content: post.content, isPinned: post.isPinned });
    setEditing(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/instructor-posts/${postId}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('수정되었습니다.');
        setEditing(false);
        loadPost();
      }
    } catch { toast.error('수정에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/instructor-posts/${postId}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
      });
      if (res.ok) {
        toast.success('삭제되었습니다.');
        router.push('/classroom/instructor/board');
      }
    } catch { toast.error('삭제에 실패했습니다.'); }
  };

  if (loading) return <PageLoader />;

  if (!post) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>게시글을 찾을 수 없습니다.</p>
        <BrandButton variant="ghost" size="sm" className="mt-4" onClick={() => router.push('/classroom/instructor/board')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </BrandButton>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <BrandButton variant="ghost" size="sm" className="mb-4" onClick={() => setEditing(false)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 돌아가기
        </BrandButton>
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-5">게시글 수정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">내용</label>
              <HtmlWysiwygEditor
                value={form.content}
                onChange={(html) => setForm((p) => ({ ...p, content: html }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))}
              />
              상단 고정
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <BrandButton variant="ghost" size="sm" onClick={() => setEditing(false)}>취소</BrandButton>
            <BrandButton variant="primary" size="sm" loading={saving} onClick={handleUpdate}>저장</BrandButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrandButton variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/classroom/instructor/board')}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
      </BrandButton>

      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground mb-3">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.author.name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <hr className="mb-6" />

        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {canManage && (
        <div className="flex gap-3 mt-4">
          <BrandButton variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="w-4 h-4 mr-1" /> 수정
          </BrandButton>
          <BrandButton variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-1" /> 삭제
          </BrandButton>
        </div>
      )}
    </div>
  );
}
