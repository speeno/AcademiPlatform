export interface QuestionBankOption {
  id: string;
  title: string;
  qualificationName?: string | null;
  subject?: string | null;
  _count?: { questions: number };
}

export interface ExamQuestionSummary {
  id: string;
  bankId?: string;
  prompt: string;
  type: string;
  difficulty?: string;
  points: number;
  isActive?: boolean;
  bank?: { id?: string; title: string };
}

export const questionTypeLabels: Record<string, string> = {
  SINGLE_CHOICE: '객관식(단일)',
  MULTIPLE_CHOICE: '객관식(복수)',
  SHORT_TEXT: '서술형',
  FILE_SUBMISSION: '실습 파일',
};

export const difficultyLabels: Record<string, string> = {
  EASY: '쉬움',
  NORMAL: '보통',
  HARD: '어려움',
};

export const questionTypeOptions = Object.entries(questionTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export const difficultyOptions = Object.entries(difficultyLabels).map(([value, label]) => ({
  value,
  label,
}));
