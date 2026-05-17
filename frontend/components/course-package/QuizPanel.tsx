'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question_id: string;
  question: string;
  type?: string;
  options: Array<{ label: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty?: string;
}

interface QuizPanelProps {
  questions: QuizQuestion[];
  chapterTitle?: string;
}

export function QuizPanel({ questions, chapterTitle }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return <p className="text-xs text-muted-foreground p-3">퀴즈 문항이 없습니다.</p>;
  }

  const correctCount = questions.filter(
    (q) => answers[q.question_id] === q.correct_answer,
  ).length;

  const handleSelect = (questionId: string, label: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.question_id]);
    if (unanswered.length > 0) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-4 p-3">
      {chapterTitle && (
        <h3 className="font-semibold text-foreground text-sm">{chapterTitle} 퀴즈</h3>
      )}

      {questions.map((q, qIdx) => {
        const selected = answers[q.question_id];
        const isCorrect = submitted && selected === q.correct_answer;
        const isWrong = submitted && selected && selected !== q.correct_answer;

        return (
          <div
            key={q.question_id}
            className={`border rounded-xl p-3 space-y-2 ${
              isCorrect ? 'border-green-300 bg-green-50' : isWrong ? 'border-red-300 bg-red-50' : ''
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              {qIdx + 1}. {q.question}
              {q.difficulty && (
                <span className="ml-2 text-xs text-muted-foreground">[{q.difficulty}]</span>
              )}
            </p>
            <div className="space-y-1">
              {q.options.map((opt) => {
                const isSelected = selected === opt.label;
                const isAnswer = submitted && opt.label === q.correct_answer;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelect(q.question_id, opt.label)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${
                      isSelected
                        ? submitted
                          ? isAnswer
                            ? 'bg-green-100 border-green-400 text-green-800'
                            : 'bg-red-100 border-red-400 text-red-800'
                          : 'bg-blue-50 border-blue-400 text-blue-800'
                        : isAnswer
                          ? 'bg-green-50 border-green-300'
                          : 'hover:bg-muted/30'
                    }`}
                    disabled={submitted}
                  >
                    <span className="font-medium mr-2">{opt.label}.</span>
                    {opt.text}
                    {submitted && isAnswer && (
                      <CheckCircle2 className="inline w-4 h-4 ml-1 text-green-600" />
                    )}
                    {submitted && isSelected && !isAnswer && (
                      <XCircle className="inline w-4 h-4 ml-1 text-red-600" />
                    )}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-2">
        {submitted ? (
          <>
            <p className="text-sm font-semibold text-foreground">
              결과: {correctCount}/{questions.length} 정답 (
              {Math.round((correctCount / questions.length) * 100)}%)
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RotateCcw className="w-4 h-4" /> 다시 풀기
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground"
          >
            제출하기
          </button>
        )}
      </div>
    </div>
  );
}
