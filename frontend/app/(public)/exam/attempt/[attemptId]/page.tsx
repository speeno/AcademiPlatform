'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

interface ExamQuestion {
  answerId: string;
  questionId: string;
  question: {
    id: string;
    type: string;
    prompt: string;
    points: number;
    options: Array<{ id: string; label: string; text: string }>;
  };
  selectedOptionIds: string[];
  textAnswer?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  savedAt: string;
}

interface AttemptData {
  id: string;
  status: string;
  expiresAt: string;
  serverNow: string;
  session: { qualificationName: string; roundName: string; requireFullscreen: boolean; requireWebcam: boolean };
  questions: ExamQuestion[];
}

function formatRemaining(ms: number) {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function OnlineExamAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; textAnswer: string; fileUrl?: string; fileName?: string }>>({});
  const [remainingMs, setRemainingMs] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const load = async () => {
    const res = await apiFetchWithAuth(`/online-exam/attempts/${attemptId}`);
    if (!res.ok) {
      router.push('/mypage/applications');
      return;
    }
    const data: AttemptData = await res.json();
    setAttempt(data);
    setAnswers(Object.fromEntries(data.questions.map((q) => [
      q.questionId,
      { selectedOptionIds: q.selectedOptionIds ?? [], textAnswer: q.textAnswer ?? '', fileUrl: q.fileUrl ?? '', fileName: q.fileName ?? '' },
    ])));
    setRemainingMs(new Date(data.expiresAt).getTime() - new Date(data.serverNow).getTime());
  };

  useEffect(() => {
    load();
  }, [attemptId]);

  useEffect(() => {
    if (!attempt) return;
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(timer);
          submit(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt]);

  const recordEvent = useCallback(async (type: string, payload?: Record<string, unknown>) => {
    await apiFetchWithAuth(`/online-exam/attempts/${attemptId}/proctor-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    }).catch(() => {});
  }, [attemptId]);

  const uploadWebcamSnapshot = useCallback(async () => {
    const video = webcamVideoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    if (!context) return false;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.72);
    });
    if (!blob) return false;

    const form = new FormData();
    form.append('snapshot', blob, `proctor-${Date.now()}.jpg`);
    const res = await apiFetchWithAuth(`/online-exam/attempts/${attemptId}/snapshots`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) return false;
    await recordEvent('WEBCAM_SNAPSHOT');
    return true;
  }, [attemptId, recordEvent]);

  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    const onVisibility = () => {
      if (document.hidden) recordEvent('TAB_BLUR');
    };
    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      recordEvent('COPY_ATTEMPT');
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      recordEvent('PASTE_ATTEMPT');
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) recordEvent('FULLSCREEN_EXIT');
    };
    window.addEventListener('contextmenu', prevent);
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      window.removeEventListener('contextmenu', prevent);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [attemptId, recordEvent]);

  useEffect(() => {
    if (!attempt?.session.requireWebcam) return undefined;

    let cancelled = false;
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        webcamStreamRef.current = stream;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          await webcamVideoRef.current.play();
        }
        await uploadWebcamSnapshot();
      } catch {
        await recordEvent('WEBCAM_PERMISSION_DENIED');
      }
    };

    void setupWebcam();
    const timer = window.setInterval(() => {
      void uploadWebcamSnapshot();
    }, 3 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    };
  }, [attempt?.session.requireWebcam, uploadWebcamSnapshot, recordEvent]);

  const question = attempt?.questions[current];
  const answer = question ? answers[question.questionId] : undefined;

  const save = async (questionId: string, patch: { selectedOptionIds?: string[]; textAnswer?: string; fileUrl?: string; fileName?: string }) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOptionIds: patch.selectedOptionIds ?? prev[questionId]?.selectedOptionIds ?? [],
        textAnswer: patch.textAnswer ?? prev[questionId]?.textAnswer ?? '',
        fileUrl: patch.fileUrl ?? prev[questionId]?.fileUrl ?? '',
        fileName: patch.fileName ?? prev[questionId]?.fileName ?? '',
      },
    }));
    setSaving(true);
    const next = {
      questionId,
      selectedOptionIds: patch.selectedOptionIds ?? answers[questionId]?.selectedOptionIds ?? [],
      textAnswer: patch.textAnswer ?? answers[questionId]?.textAnswer ?? '',
      fileUrl: patch.fileUrl ?? answers[questionId]?.fileUrl ?? '',
      fileName: patch.fileName ?? answers[questionId]?.fileName ?? '',
    };
    await apiFetchWithAuth(`/online-exam/attempts/${attemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).finally(() => setSaving(false));
  };

  const submit = async (auto = false) => {
    if (!auto && !confirm('시험을 제출하면 답안을 수정할 수 없습니다. 제출할까요?')) return;
    setSubmitting(true);
    try {
      await apiFetchWithAuth(`/online-exam/attempts/${attemptId}/submit`, { method: 'POST' });
      alert(auto ? '시험 시간이 종료되어 자동 제출되었습니다.' : '시험이 제출되었습니다.');
      router.push('/mypage/applications');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.selectedOptionIds.length > 0 || a.textAnswer.trim() || a.fileUrl?.trim()).length;
  }, [answers]);

  if (!attempt || !question) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">응시 정보를 불러오는 중...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {attempt.session.requireWebcam && (
        <video
          ref={webcamVideoRef}
          autoPlay
          muted
          playsInline
          className="pointer-events-none fixed bottom-4 right-4 z-20 h-24 w-32 rounded-lg border border-white/20 object-cover opacity-80"
        />
      )}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/60">{attempt.session.roundName}</p>
            <h1 className="font-bold">{attempt.session.qualificationName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <BrandBadge variant={remainingMs < 5 * 60 * 1000 ? 'red' : 'blue'}>{formatRemaining(remainingMs)}</BrandBadge>
            <span className="text-xs text-white/60">{answeredCount}/{attempt.questions.length} 저장</span>
            <span className="text-xs text-white/60">{saving ? '저장 중...' : '저장됨'}</span>
            <BrandButton variant="danger" size="sm" loading={submitting} onClick={() => submit(false)}>제출</BrandButton>
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_240px]">
        <section className="rounded-2xl bg-white p-6 text-foreground">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <BrandBadge variant="default" className="mb-2">문항 {current + 1}</BrandBadge>
              <h2 className="whitespace-pre-line text-lg font-bold">{question.question.prompt}</h2>
            </div>
            <span className="text-sm text-muted-foreground">{question.question.points}점</span>
          </div>

          {question.question.type === 'SHORT_TEXT' ? (
            <textarea
              value={answer?.textAnswer ?? ''}
              onChange={(e) => save(question.questionId, { textAnswer: e.target.value })}
              rows={10}
              className="w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="답안을 입력하세요."
            />
          ) : question.question.type === 'FILE_SUBMISSION' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                실습 결과 파일을 스토리지/드라이브에 업로드한 뒤 접근 가능한 URL과 파일명을 제출하세요.
              </p>
              <input
                value={answer?.fileUrl ?? ''}
                onChange={(e) => save(question.questionId, { fileUrl: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="파일 URL"
              />
              <input
                value={answer?.fileName ?? ''}
                onChange={(e) => save(question.questionId, { fileName: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="파일명"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {question.question.options.map((option) => {
                const selected = answer?.selectedOptionIds.includes(option.id) ?? false;
                const multiple = question.question.type === 'MULTIPLE_CHOICE';
                return (
                  <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted/30">
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      name={question.questionId}
                      checked={selected}
                      onChange={() => {
                        const currentSelected = answer?.selectedOptionIds ?? [];
                        const next = multiple
                          ? selected
                            ? currentSelected.filter((id) => id !== option.id)
                            : [...currentSelected, option.id]
                          : [option.id];
                        save(question.questionId, { selectedOptionIds: next });
                      }}
                    />
                    <span><strong>{option.label}.</strong> {option.text}</span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-2xl bg-white p-4 text-foreground">
          <p className="mb-3 text-sm font-bold">문항 네비게이션</p>
          <div className="grid grid-cols-5 gap-2">
            {attempt.questions.map((q, index) => {
              const a = answers[q.questionId];
              const done = !!a && (a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0 || !!a.fileUrl?.trim());
              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrent(index)}
                  className={`rounded-lg border px-2 py-1.5 text-xs ${index === current ? 'border-brand-blue bg-brand-blue text-white' : done ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-border text-muted-foreground'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
