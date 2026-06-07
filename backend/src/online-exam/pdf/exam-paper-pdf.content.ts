import { QuestionType } from '@prisma/client';
import type { ExamPaperPdfPaper, PaperPdfEdition, PaperPdfVariant, PaperQuestionItem } from './exam-paper-pdf.types';

type PaperDescriptionPayload = { notes?: string };

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function parsePaperDescription(raw?: string | null): string {
  if (!raw?.trim()) return '';
  try {
    const parsed = JSON.parse(raw) as PaperDescriptionPayload;
    if (typeof parsed?.notes === 'string') return parsed.notes;
  } catch {
    // plain text legacy
  }
  return raw;
}

export function formatKoreanDateTime(value: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

export function formatExamDateShort(value: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

export function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'exam';
}

export function resolveEdition(status: string): PaperPdfEdition {
  return status === 'PUBLISHED' ? 'final' : 'draft';
}

export function buildDocMeta(
  variant: PaperPdfVariant,
  edition: PaperPdfEdition,
  qualificationName: string,
): { docId: string; footerBadge: string; version: string } {
  const year = new Date().getFullYear();
  const slug = qualificationName.replace(/\s+/g, '').slice(0, 8).toUpperCase() || 'EXAM';
  const version = 'Ver. 1.0';

  if (variant === 'student') {
    return {
      docId: edition === 'draft' ? `DOC-CRE-${slug}-EXAM-${year}-DRAFT` : `DOC-CRE-${slug}-EXAM-${year}-01`,
      footerBadge: edition === 'draft' ? 'DRAFT 검토용 초안' : '본지',
      version,
    };
  }
  if (variant === 'answer') {
    return {
      docId: edition === 'draft' ? `DOC-ANS-${slug}-EXAM-${year}-DRAFT` : `DOC-KEY-${slug}-EXAM-${year}-01`,
      footerBadge: edition === 'draft' ? '검토용 초안' : '본지',
      version,
    };
  }
  return {
    docId: edition === 'draft' ? `DOC-CMB-${slug}-EXAM-${year}-DRAFT` : `DOC-CMB-${slug}-EXAM-${year}-01`,
    footerBadge: edition === 'draft' ? 'DRAFT' : '본지',
    version,
  };
}

export function buildExportFilename(
  qualificationName: string,
  roundName: string,
  variant: PaperPdfVariant,
  edition: PaperPdfEdition,
): string {
  const base = `${sanitizeFilename(qualificationName)}-${sanitizeFilename(roundName)}`;
  const draftSuffix = edition === 'draft' ? '-초안' : '';
  if (variant === 'answer') return `${base}-정답지${draftSuffix}.pdf`;
  if (variant === 'combined') return `${base}-시험-정답-통합본${draftSuffix}.pdf`;
  return `${base}-시험지${draftSuffix}.pdf`;
}

export function getOptionDisplayLabel(index: number, raw?: string): string {
  const trimmed = raw?.trim();
  if (trimmed && /^[A-H①-⑳]$/.test(trimmed)) {
    if (/^[①-⑳]$/.test(trimmed)) {
      const circleIndex = '①②③④⑤⑥⑦⑧'.indexOf(trimmed);
      if (circleIndex >= 0) return OPTION_LETTERS[circleIndex] ?? trimmed;
    }
    return trimmed.replace(/[①②③④⑤⑥⑦⑧]/g, (m) => {
      const i = '①②③④⑤⑥⑦⑧'.indexOf(m);
      return i >= 0 ? OPTION_LETTERS[i] : m;
    });
  }
  return OPTION_LETTERS[index] ?? String(index + 1);
}

export function resolveAnswerLabel(item: PaperQuestionItem): string {
  const q = item.question;
  if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) {
    const labels = q.answerKeys
      .map((key) => {
        const idx = q.options.findIndex((o) => o.id === key.optionId);
        if (idx >= 0) return getOptionDisplayLabel(idx, q.options[idx].label);
        return null;
      })
      .filter((v): v is string => Boolean(v));
    return labels.length > 0 ? labels.join(', ') : '미설정';
  }
  if (q.type === QuestionType.SHORT_TEXT) {
    const patterns = q.answerKeys.map((k) => k.textPattern?.trim()).filter(Boolean);
    return patterns.length > 0 ? patterns.join(' / ') : '미설정';
  }
  return '채점 기준에 따라 평가';
}

export function resolveExplanation(item: PaperQuestionItem): string {
  const fromKey = item.question.answerKeys.map((k) => k.explanation?.trim()).find(Boolean);
  return fromKey || item.question.explanation?.trim() || '';
}

export function buildDefaultPrecautions(paper: ExamPaperPdfPaper): string[] {
  const count = paper.items.length;
  const avgPoints =
    count > 0 ? Math.round((paper.totalPoints / count) * 10) / 10 : 0;
  return [
    `총 ${count}문항이며, 문항별 배점은 시험지에 표시된 점수를 따릅니다.`,
    `객관식 문항은 지정된 답란에 정확히 표기하세요.`,
    `서술형·파일 제출 문항은 안내된 형식과 제출 방법을 준수하세요.`,
    `부정행위가 확인되면 응시 결과가 무효 처리될 수 있습니다.`,
    avgPoints > 0 ? `문항당 평균 배점은 약 ${avgPoints}점입니다.` : '',
  ].filter(Boolean);
}

export function buildGradingCriteria(passingScore: number): string[] {
  return [
    '객관식 문항은 정답 일치 여부로 자동 채점합니다.',
    '복수 선택 문항은 안내된 채점 기준에 따라 평가합니다.',
    '서술형·파일 제출 문항은 채점자가 루브릭에 따라 수동 채점합니다.',
    `합격 기준은 총점 ${passingScore}점 이상입니다.`,
  ];
}
