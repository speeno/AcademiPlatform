'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';

interface InstructorQuestion {
  id: string;
  title: string;
  content: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
  answers: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; role: string };
  }>;
}

export default function InstructorQuestionsPage() {
  const [questions, setQuestions] = useState<InstructorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'ANSWERED' | 'CLOSED'>('OPEN');

  const loadQuestions = useCallback(async () => {
    const res = await fetch(`${API_BASE}/qna/instructor/questions?status=${statusFilter}`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data?.message ?? '강사 질문함을 불러오지 못했습니다.');
    setQuestions(Array.isArray(data) ? data : []);
  }, [statusFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadQuestions();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '질문 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadQuestions]);

  const submitAnswer = async (questionId: string) => {
    const content = (replyDraft[questionId] ?? '').trim();
    if (!content) return toast.error('답변 내용을 입력하세요.');

    setSubmittingId(questionId);
    try {
      const res = await fetch(`${API_BASE}/qna/questions/${questionId}/answers`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '답변 등록에 실패했습니다.');
      toast.success('답변이 등록되었습니다. 학생에게 이메일 회신이 전송됩니다.');
      setReplyDraft((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '답변 등록에 실패했습니다.');
    } finally {
      setSubmittingId('');
    }
  };

  if (loading) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>강사 질문함</h1>
          <p className="text-sm text-gray-500 mt-1">본인에게 배정된 질문을 확인하고 답변합니다.</p>
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'OPEN' | 'ANSWERED' | 'CLOSED')}
        >
          <option value="OPEN">OPEN</option>
          <option value="ANSWERED">ANSWERED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">해당 상태의 질문이 없습니다.</p>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{question.title}</p>
                <span className="text-xs text-gray-500">{question.status}</span>
              </div>
              <p className="text-xs text-gray-500">
                {question.course.title} | 학생: {question.user.name} ({question.user.email}) | {new Date(question.createdAt).toLocaleString('ko-KR')}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.content}</p>

              <div className="space-y-1">
                {question.answers.map((answer) => (
                  <div key={answer.id} className="bg-gray-50 border rounded px-2 py-2 text-sm">
                    <p className="text-xs text-gray-500 mb-1">
                      {answer.user.name} ({answer.user.role}) | {new Date(answer.createdAt).toLocaleString('ko-KR')}
                    </p>
                    <p className="whitespace-pre-wrap">{answer.content}</p>
                  </div>
                ))}
              </div>

              <textarea
                className="border rounded-lg px-3 py-2 text-sm w-full min-h-24"
                placeholder="학생에게 전달할 답변을 작성하세요."
                value={replyDraft[question.id] ?? ''}
                onChange={(e) => setReplyDraft((prev) => ({ ...prev, [question.id]: e.target.value }))}
                disabled={question.status === 'CLOSED'}
              />
              <div className="flex justify-end">
                <BrandButton
                  size="sm"
                  onClick={() => submitAnswer(question.id)}
                  loading={submittingId === question.id}
                  disabled={question.status === 'CLOSED'}
                >
                  <Send className="w-4 h-4 mr-1" />
                  답변 등록
                </BrandButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

