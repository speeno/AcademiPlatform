'use client';

import { useState } from 'react';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

const CATEGORIES = [
  'ISO/IEC 17024 AI국제자격증: 단체 교육수강 및 시험',
  'AI 채봇: 24시간 고객 문의 응대, FAQ 자동화 채봇',
  '외국어 번역: 해외 고객을 위한 자동 번역 및 상담',
  '노코드 기반 자동화: 재고 관리, 회계 입력 자동화',
  '제품개발: 신제품 콘셉트, 디자인 시안 생성',
  '직원 교육 콘텐츠 제작: 맞춤형 학습 자료, 퀴즈, 시뮬레이션 제공',
  'AI 활용 교육: 프롬프트 작성. 데이터분석 등 직원 역량 강화',
  '기타 기술 도입 문의',
];

export default function ContactPage() {
  const [form, setForm] = useState({ category: '', title: '', content: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('문의 접수는 로그인 후 이용 가능합니다.');
        window.location.href = '/login?next=%2Fcontact';
        return;
      }

      const res = await fetch(`${API_BASE}/inquiries`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? '문의 접수에 실패했습니다.');

      setSent(true);
      toast.success('문의가 접수되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '문의 접수에 실패했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--brand-blue)' }}>1:1 문의</h1>
          <p className="text-gray-600">궁금하신 사항을 남겨주시면 빠르게 답변드리겠습니다.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4">
          {sent ? (
            <div className="text-center py-20">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">문의가 접수되었습니다</h2>
              <p className="text-gray-500 text-sm">빠른 시일 내에 답변드리겠습니다. 감사합니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border p-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5" style={{ color: 'var(--brand-blue)' }} />
                <h2 className="font-bold text-gray-800">문의 내용 작성</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">문의 유형 *</label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
                    required
                  >
                    <option value="">선택해 주세요</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">제목 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="문의 제목을 입력해 주세요"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">내용 *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => set('content', e.target.value)}
                    placeholder="문의 내용을 상세히 작성해 주세요."
                    rows={8}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    required
                    minLength={10}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.content.length}자</p>
                </div>

                <BrandButton type="submit" variant="primary" loading={loading} size="lg">
                  <Send className="w-4 h-4 mr-2" /> 문의 접수하기
                </BrandButton>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
