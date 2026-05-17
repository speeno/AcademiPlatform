'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';

interface ClassroomCourse {
  course: {
    id: string;
    title: string;
  };
}

interface InstructorItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface QuestionAnswer {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface MyQuestion {
  id: string;
  title: string;
  content: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  answeredAt?: string | null;
  course: { id: string; title: string };
  assignedInstructor: { id: string; name: string; email: string };
  answers: QuestionAnswer[];
}

export default function ClassroomQuestionsPage() {
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [assignedInstructorId, setAssignedInstructorId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<MyQuestion[]>([]);

  const selectedCourse = useMemo(
    () => courses.find((item) => item.course.id === selectedCourseId)?.course,
    [courses, selectedCourseId],
  );

  const loadQuestions = async () => {
    const res = await fetch(`${API_BASE}/qna/my-questions`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error('내 질문 목록을 불러오지 못했습니다.');
    setQuestions(Array.isArray(data) ? data : []);
  };

  const loadCourses = async () => {
    const res = await fetch(`${API_BASE}/lms/classroom`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error('수강 과목을 불러오지 못했습니다.');
    const next = Array.isArray(data) ? data : [];
    setCourses(next);
    if (next.length > 0) {
      setSelectedCourseId((prev) => prev || next[0].course.id);
    }
  };

  const loadInstructors = async (courseId: string) => {
    if (!courseId) {
      setInstructors([]);
      setAssignedInstructorId('');
      return;
    }
    const res = await fetch(`${API_BASE}/qna/courses/${courseId}/instructors`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '강사 목록을 불러오지 못했습니다.');
    const next = Array.isArray(data?.instructors) ? data.instructors : [];
    setInstructors(next);
    setAssignedInstructorId((prev) => prev || next[0]?.id || '');
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadCourses(), loadQuestions()]);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '질문 페이지 초기화에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    loadInstructors(selectedCourseId).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : '강사 목록 로드 실패');
    });
  }, [selectedCourseId]);

  const submitQuestion = async () => {
    if (!selectedCourseId) return toast.error('강좌를 선택하세요.');
    if (!assignedInstructorId) return toast.error('담당 강사를 선택하세요.');
    if (!title.trim()) return toast.error('질문 제목을 입력하세요.');
    if (!content.trim()) return toast.error('질문 내용을 입력하세요.');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/qna/questions`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({
          courseId: selectedCourseId,
          assignedInstructorId,
          title: title.trim(),
          content: content.trim(),
          isPrivate: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '질문 등록에 실패했습니다.');
      toast.success('질문을 등록했습니다.');
      setTitle('');
      setContent('');
      await loadQuestions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '질문 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-heading text-brand-blue">내 질문</h1>
        <p className="text-sm text-muted-foreground mt-1">수강 과목의 담당 강사에게 질문하고 답변을 확인하세요.</p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">강좌 선택</option>
            {courses.map((item) => (
              <option key={item.course.id} value={item.course.id}>
                {item.course.title}
              </option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={assignedInstructorId}
            onChange={(e) => setAssignedInstructorId(e.target.value)}
            disabled={!selectedCourseId}
          >
            <option value="">담당 강사 선택</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name} ({instructor.email})
              </option>
            ))}
          </select>
        </div>
        <input
          className="border rounded-lg px-3 py-2 text-sm w-full"
          placeholder="질문 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border rounded-lg px-3 py-2 text-sm w-full min-h-28"
          placeholder="질문 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <BrandButton size="sm" onClick={submitQuestion} loading={submitting}>
            <Send className="w-4 h-4 mr-1" />
            질문 등록
          </BrandButton>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-foreground">질문 내역</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 질문이 없습니다.</p>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="border rounded-lg px-3 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{question.title}</p>
                <span className="text-xs text-muted-foreground">{question.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {question.course.title} | 담당 강사: {question.assignedInstructor.name} | {new Date(question.createdAt).toLocaleString('ko-KR')}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{question.content}</p>
              <div className="space-y-1">
                {question.answers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">아직 답변이 없습니다.</p>
                ) : (
                  question.answers.map((answer) => (
                    <div key={answer.id} className="bg-muted/30 border rounded px-2 py-2 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">
                        {answer.user.name} ({answer.user.role}) | {new Date(answer.createdAt).toLocaleString('ko-KR')}
                      </p>
                      <p className="whitespace-pre-wrap">{answer.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCourse && instructors.length === 0 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {selectedCourse.title} 강좌에는 질문 대상 강사가 아직 배정되지 않았습니다.
        </p>
      )}
    </div>
  );
}

