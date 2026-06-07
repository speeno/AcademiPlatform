export interface ExamResultOption {
  id: string;
  label: string;
  text: string;
  order?: number;
}

export interface ExamResultItem {
  order: number;
  questionId: string;
  prompt: string;
  type: string;
  points: number;
  options: ExamResultOption[];
  myAnswer: {
    selectedOptionIds: string[];
    textAnswer?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
  };
  correctAnswer?: {
    optionIds?: string[];
    textPattern?: string | null;
  } | null;
  explanation?: string | null;
  feedback?: string | null;
  score: number;
  isCorrect?: boolean | null;
}

export interface ExamResultDetail {
  attemptId: string;
  attemptStatus: string;
  submittedAt?: string | null;
  user?: { id: string; name: string; email: string };
  session: {
    id: string;
    qualificationName: string;
    roundName: string;
    passingScore: number;
  };
  result: {
    id: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    status: string;
    publishedAt?: string | null;
    emailSentAt?: string | null;
  } | null;
  items: ExamResultItem[];
}

export interface ExamResultListEntry {
  attemptId: string;
  user: { id: string; name: string; email: string };
  status: string;
  submittedAt?: string | null;
  result: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    status: string;
    publishedAt?: string | null;
  } | null;
}
