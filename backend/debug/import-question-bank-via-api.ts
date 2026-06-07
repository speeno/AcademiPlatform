import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

type ExportedOption = {
  id: string;
  label: string;
  text: string;
  order: number;
};

type ExportedAnswerKey = {
  optionId: string | null;
  textPattern: string | null;
};

type ExportedQuestion = {
  type: string;
  difficulty: string;
  prompt: string;
  explanation: string | null;
  points: number;
  tags: string[];
  options: ExportedOption[];
  answerKeys: ExportedAnswerKey[];
};

type ExportedQuestionBank = {
  title: string;
  description: string | null;
  qualificationName: string | null;
  subject: string | null;
  isActive: boolean;
  questions: ExportedQuestion[];
};

type ExamContentBundle = {
  questionBanks: ExportedQuestionBank[];
};

const API_BASE = (process.env.API_BASE ?? 'https://academiplatform.onrender.com/api').replace(
  /\/+$/,
  '',
);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@academiq.kr';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const IN_PATH =
  process.env.IMPORT_PATH ??
  resolve(process.cwd(), 'debug/exam-content-export.json');

async function api<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`login failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

function toCreateQuestionPayload(bankId: string, question: ExportedQuestion) {
  const optionIdToLabel = new Map(
    question.options.map((option) => [option.id, option.label]),
  );
  const correctOptionLabels = question.answerKeys
    .map((key) => (key.optionId ? optionIdToLabel.get(key.optionId) : null))
    .filter((label): label is string => Boolean(label));

  const payload: Record<string, unknown> = {
    bankId,
    type: question.type,
    difficulty: question.difficulty,
    prompt: question.prompt,
    explanation: question.explanation,
    points: question.points,
    tags: question.tags,
    options: question.options.map((option) => ({
      label: option.label,
      text: option.text,
      order: option.order,
    })),
  };

  if (question.type === 'SHORT_TEXT' || question.type === 'FILE_SUBMISSION') {
    payload.textPattern = question.answerKeys[0]?.textPattern ?? null;
  } else {
    payload.correctOptionLabels = correctOptionLabels;
  }

  return payload;
}

async function ensureBank(token: string, bank: ExportedQuestionBank): Promise<string> {
  const banks = await api<Array<{ id: string; title: string }>>(
    '/online-exam/admin/question-banks',
    token,
  );
  const existing = banks.find((item) => item.title === bank.title);
  if (existing) return existing.id;

  const created = await api<{ id: string }>('/online-exam/admin/question-banks', token, {
    method: 'POST',
    body: JSON.stringify({
      title: bank.title,
      description: bank.description,
      qualificationName: bank.qualificationName,
      subject: bank.subject,
      isActive: bank.isActive,
    }),
  });
  return created.id;
}

async function listExistingPrompts(token: string, bankId: string): Promise<Set<string>> {
  const data = await api<{ questions: Array<{ prompt: string }> }>(
    `/online-exam/admin/questions?bankId=${encodeURIComponent(bankId)}&limit=200`,
    token,
  );
  return new Set((data.questions ?? []).map((question) => question.prompt));
}

async function main() {
  if (!existsSync(IN_PATH)) {
    throw new Error(`import 파일 없음: ${IN_PATH}`);
  }

  const bundle = JSON.parse(readFileSync(IN_PATH, 'utf8')) as ExamContentBundle;
  const token = await login();
  console.log(`API: ${API_BASE}`);

  let created = 0;
  let skipped = 0;

  for (const bank of bundle.questionBanks) {
    const bankId = await ensureBank(token, bank);
    console.log(`문제은행 준비: ${bank.title} (${bankId})`);

    const existingPrompts = await listExistingPrompts(token, bankId);

    for (const question of bank.questions) {
      if (existingPrompts.has(question.prompt)) {
        skipped += 1;
        continue;
      }

      await api('/online-exam/admin/questions', token, {
        method: 'POST',
        body: JSON.stringify(toCreateQuestionPayload(bankId, question)),
      });
      existingPrompts.add(question.prompt);
      created += 1;
    }
  }

  console.log(`완료: 신규 ${created}건, 건너뜀 ${skipped}건`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
