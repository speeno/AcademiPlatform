'use client';

import { BrandBadge } from '@/components/ui/brand-badge';
import { questionTypeLabels } from '@/components/exam/question-authoring-types';
import type { ExamResultDetail, ExamResultItem, ExamResultOption } from '@/components/exam/exam-result-types';

function formatOptionAnswer(
  optionIds: string[] | undefined,
  options: ExamResultOption[],
): string {
  if (!optionIds?.length) return '(미응답)';
  return optionIds
    .map((id) => {
      const option = options.find((o) => o.id === id);
      return option ? `${option.label}. ${option.text}` : id;
    })
    .join(', ');
}

function renderMyAnswer(item: ExamResultItem) {
  if (item.type === 'SINGLE_CHOICE' || item.type === 'MULTIPLE_CHOICE') {
    return formatOptionAnswer(item.myAnswer.selectedOptionIds, item.options);
  }
  if (item.myAnswer.fileUrl) {
    return (
      <a href={item.myAnswer.fileUrl} target="_blank" rel="noreferrer" className="text-brand-blue underline">
        {item.myAnswer.fileName || item.myAnswer.fileUrl}
      </a>
    );
  }
  return item.myAnswer.textAnswer || '(답안 없음)';
}

function renderCorrectAnswer(item: ExamResultItem) {
  if (!item.correctAnswer) return null;
  if (item.type === 'SINGLE_CHOICE' || item.type === 'MULTIPLE_CHOICE') {
    return formatOptionAnswer(item.correctAnswer.optionIds, item.options);
  }
  return item.correctAnswer.textPattern || '(채점 기준 없음)';
}

interface ExamResultDetailViewProps {
  detail: ExamResultDetail;
  showUser?: boolean;
}

export function ExamResultDetailView({ detail, showUser = false }: ExamResultDetailViewProps) {
  const { session, result, items } = detail;
  const passed = result?.status === 'PASSED';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {session.qualificationName} {session.roundName}
            </h2>
            {showUser && detail.user && (
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.user.name} · {detail.user.email}
              </p>
            )}
            {detail.submittedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                제출: {new Date(detail.submittedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
          {result && (
            <div className="text-right">
              <BrandBadge variant={passed ? 'green' : 'red'}>
                {passed ? '합격' : '불합격'}
              </BrandBadge>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {result.totalScore} / {result.maxScore}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.percentage.toFixed(1)}% · 합격 기준 {session.passingScore}%
              </p>
              {result.publishedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  공개: {new Date(result.publishedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.questionId} className="rounded-xl border bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <BrandBadge variant="default">문항 {item.order}</BrandBadge>
              <BrandBadge variant="blue">{questionTypeLabels[item.type] ?? item.type}</BrandBadge>
              <BrandBadge variant="default">배점 {item.points}</BrandBadge>
              {item.isCorrect !== null && item.isCorrect !== undefined && (
                <BrandBadge variant={item.isCorrect ? 'green' : 'red'}>
                  {item.isCorrect ? '정답' : '오답'}
                </BrandBadge>
              )}
              <span className="text-sm font-medium text-foreground">
                득점 {item.score} / {item.points}
              </span>
            </div>
            <p className="mb-4 whitespace-pre-line font-medium text-foreground">{item.prompt}</p>

            {(item.type === 'SINGLE_CHOICE' || item.type === 'MULTIPLE_CHOICE') && item.options.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
                {item.options.map((option) => (
                  <li key={option.id}>
                    {option.label}. {option.text}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">내 답안</p>
                <div className="whitespace-pre-line text-foreground">{renderMyAnswer(item)}</div>
              </div>
              {item.correctAnswer && (
                <div className="rounded-lg border border-brand-blue/20 bg-brand-blue-subtle p-3">
                  <p className="mb-1 text-xs font-semibold text-brand-blue">정답</p>
                  <div className="whitespace-pre-line text-foreground">{renderCorrectAnswer(item)}</div>
                </div>
              )}
              {item.explanation && (
                <div className="rounded-lg border p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">해설</p>
                  <p className="whitespace-pre-line text-foreground">{item.explanation}</p>
                </div>
              )}
              {item.feedback && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-orange-700">채점 피드백</p>
                  <p className="whitespace-pre-line text-foreground">{item.feedback}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
