import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, QuestionDifficulty, QuestionType } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const BANK_TITLE = 'AI 자격증 샘플 문제은행';
const BANK_DESCRIPTION =
  'AI 프롬프트 엔지니어·AI 교육지도사·딥러닝 기초 등 자격 시험용 샘플 문항 모음';

type ChoiceOption = { label: string; text: string };
type SeedQuestion =
  | {
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      difficulty: QuestionDifficulty;
      prompt: string;
      explanation?: string;
      points: number;
      tags: string[];
      options: ChoiceOption[];
      correctOptionLabels: string[];
    }
  | {
      type: 'SHORT_TEXT' | 'FILE_SUBMISSION';
      difficulty: QuestionDifficulty;
      prompt: string;
      explanation?: string;
      points: number;
      tags: string[];
      textPattern?: string | null;
    };

const SAMPLE_QUESTIONS: SeedQuestion[] = [
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '지도 학습(Supervised Learning)에 대한 설명으로 가장 적절한 것은?',
    explanation: '지도 학습은 입력과 정답(레이블) 쌍으로 모델을 학습시키는 방식입니다.',
    points: 2,
    tags: ['머신러닝', '기초'],
    options: [
      { label: 'A', text: '레이블 없이 데이터의 패턴을 찾는 학습' },
      { label: 'B', text: '입력과 정답 레이블을 이용해 모델을 학습시키는 방식' },
      { label: 'C', text: '보상 신호만으로 정책을 학습하는 방식' },
      { label: 'D', text: '규칙 기반 전문가 시스템만을 의미하는 용어' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '과적합(Overfitting)을 완화하기 위한 방법이 아닌 것은?',
    explanation: '학습률을 크게 올리면 수렴이 불안정해질 수 있으나 과적합 완화의 대표적 기법은 아닙니다.',
    points: 3,
    tags: ['머신러닝', '모델평가'],
    options: [
      { label: 'A', text: '드롭아웃(Dropout) 적용' },
      { label: 'B', text: '데이터 증강(Data Augmentation)' },
      { label: 'C', text: '조기 종료(Early Stopping)' },
      { label: 'D', text: '학습률을 무조건 10배로 증가' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: 'Transformer 아키텍처의 핵심 메커니즘은?',
    explanation: 'Self-Attention은 시퀀스 내 토큰 간 관계를 가중합으로 모델링합니다.',
    points: 3,
    tags: ['딥러닝', 'NLP', 'Transformer'],
    options: [
      { label: 'A', text: 'Self-Attention' },
      { label: 'B', text: 'Max Pooling만 사용' },
      { label: 'C', text: '순환 신경망(RNN) 셀만 사용' },
      { label: 'D', text: '결정 트리 앙상블' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: 'LLM에서 "Temperature" 파라미터를 높이면 일반적으로 어떤 현상이 나타나는가?',
    explanation: 'Temperature가 높을수록 출력 분포가 평탄해져 다양하고 창의적인 응답이 증가합니다.',
    points: 2,
    tags: ['LLM', '프롬프트엔지니어링'],
    options: [
      { label: 'A', text: '응답이 더 결정적이고 반복적이 된다' },
      { label: 'B', text: '응답의 다양성과 무작위성이 증가한다' },
      { label: 'C', text: '컨텍스트 윈도우 길이가 자동으로 늘어난다' },
      { label: 'D', text: '모델 파라미터 수가 줄어든다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.HARD,
    prompt: 'RAG(Retrieval-Augmented Generation)의 주요 목적은?',
    explanation: 'RAG는 외부 지식 검색 결과를 생성 모델 입력에 결합해 환각을 줄이고 최신 정보를 반영합니다.',
    points: 4,
    tags: ['LLM', 'RAG'],
    options: [
      { label: 'A', text: '모델 가중치를 매번 처음부터 재학습' },
      { label: 'B', text: '외부 지식 검색 결과를 생성에 결합해 정확성과 최신성 향상' },
      { label: 'C', text: 'GPU 메모리 사용량을 0으로 만듦' },
      { label: 'D', text: '프롬프트 길이를 항상 1토큰으로 제한' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '프롬프트 엔지니어링에서 효과적인 프롬프트 작성 원칙으로 적절한 것을 모두 고르세요.',
    explanation: '역할·맥락·출력 형식·예시(Few-shot)를 명확히 하면 결과 품질이 향상됩니다.',
    points: 4,
    tags: ['프롬프트엔지니어링'],
    options: [
      { label: 'A', text: '역할(Role)과 목표를 명확히 기술한다' },
      { label: 'B', text: '원하는 출력 형식(JSON, 표 등)을 지정한다' },
      { label: 'C', text: '모든 지시를 한 단어로만 작성한다' },
      { label: 'D', text: '필요 시 예시(Few-shot)를 제공한다' },
    ],
    correctOptionLabels: ['A', 'B', 'D'],
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '생성형 AI 활용 시 개인정보·저작권·편향 관련 윤리적 고려사항으로 적절한 것을 모두 고르세요.',
    explanation: '민감정보 마스킹, 출처 표기, 편향 점검은 AI 윤리 실무의 기본 요건입니다.',
    points: 4,
    tags: ['AI윤리', '거버넌스'],
    options: [
      { label: 'A', text: '민감 개인정보를 프롬프트에 그대로 입력해도 무방하다' },
      { label: 'B', text: '출력물의 사실 관계와 저작권 출처를 검증한다' },
      { label: 'C', text: '모델 편향으로 인한 차별 가능성을 점검한다' },
      { label: 'D', text: '조직 정책에 맞는 데이터 보관·삭제 절차를 따른다' },
    ],
    correctOptionLabels: ['B', 'C', 'D'],
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: QuestionDifficulty.HARD,
    prompt: '딥러닝 학습에서 일반적으로 사용되는 손실 함수·활성화 함수 조합으로 적절한 것을 모두 고르세요.',
    explanation: '이진 분류는 BCE+Sigmoid, 다중 클래스는 CE+Softmax가 일반적입니다.',
    points: 5,
    tags: ['딥러닝', '손실함수'],
    options: [
      { label: 'A', text: '이진 분류: Binary Cross-Entropy + Sigmoid' },
      { label: 'B', text: '다중 클래스 분류: Cross-Entropy + Softmax' },
      { label: 'C', text: '회귀: MSE 손실' },
      { label: 'D', text: '모든 회귀 문제에 Cross-Entropy만 사용' },
    ],
    correctOptionLabels: ['A', 'B', 'C'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: 'CNN(Convolutional Neural Network)이 특히 강점을 보이는 데이터 유형은?',
    explanation: 'CNN은 지역적 패턴(엣지, 텍스처) 추출에 강해 이미지·영상 처리에 널리 쓰입니다.',
    points: 2,
    tags: ['딥러닝', 'CNN'],
    options: [
      { label: 'A', text: '이미지·영상' },
      { label: 'B', text: '관계형 DB 테이블만' },
      { label: 'C', text: '순수 텍스트만(Attention 없이)' },
      { label: 'D', text: '압축되지 않은 바이너리 로그만' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: 'Fine-tuning과 Prompt Engineering의 차이로 가장 적절한 설명은?',
    explanation: 'Fine-tuning은 모델 가중치를 업데이트하고, 프롬프트 엔지니어링은 추론 시 입력만 최적화합니다.',
    points: 3,
    tags: ['LLM', '파인튜닝'],
    options: [
      { label: 'A', text: '둘 다 항상 동일한 작업이다' },
      { label: 'B', text: 'Fine-tuning은 가중치를 조정하고, Prompt Engineering은 입력 설계로 행동을 유도한다' },
      { label: 'C', text: 'Prompt Engineering만 GPU가 필요하다' },
      { label: 'D', text: 'Fine-tuning은 추론 API에서 불가능하다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '임베딩(Embedding)의 역할로 가장 적절한 것은?',
    explanation: '임베딩은 이산 토큰·범주를 연속 벡터 공간에 매핑해 유사도 계산과 학습을 가능하게 합니다.',
    points: 3,
    tags: ['NLP', '임베딩'],
    options: [
      { label: 'A', text: '고차원 이산 데이터를 저차원 연속 벡터로 표현' },
      { label: 'B', text: '모든 데이터를 1비트로 압축' },
      { label: 'C', text: '학습 데이터를 물리적으로 삭제' },
      { label: 'D', text: '하이퍼파라미터 탐색을 자동으로 대체' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.HARD,
    prompt: 'Diffusion Model의 생성 과정을 한 줄로 설명하면?',
    explanation: 'Diffusion은 노이즈를 점진적으로 추가한 뒤 역과정으로 노이즈를 제거하며 데이터를 생성합니다.',
    points: 4,
    tags: ['생성형AI', 'Diffusion'],
    options: [
      { label: 'A', text: '노이즈를 추가·제거하는 역확산 과정으로 샘플 생성' },
      { label: 'B', text: '결정 트리만으로 픽셀 값을 예측' },
      { label: 'C', text: '규칙 기반 if-else로 이미지 합성' },
      { label: 'D', text: '압축 해제 없이 ZIP 파일만 생성' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      'Chain-of-Thought(CoT) 프롬프팅이 LLM 추론 성능 향상에 도움이 되는 이유를 한 문장으로 설명하세요.',
    explanation: '중간 추론 단계를 명시적으로 생성하게 하여 복잡한 문제의 논리적 오류를 줄입니다.',
    points: 5,
    tags: ['프롬프트엔지니어링', 'CoT'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.EASY,
    prompt: 'AI 교육 현장에서 학습자 데이터를 수집할 때 반드시 지켜야 할 원칙 2가지를 간단히 서술하세요.',
    explanation: '동의·목적 제한·최소 수집·보관 기간 등 개인정보보호 원칙이 핵심입니다.',
    points: 4,
    tags: ['AI교육', '개인정보'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.HARD,
    prompt:
      '벡터 DB를 RAG 파이프라인에 사용할 때, 검색 품질에 영향을 주는 요소 3가지(예: 청킹, 임베딩 모델, top-k)를 나열하세요.',
    explanation: '청크 크기·오버랩, 임베딩 모델 선택, 유사도 메트릭, reranker 등이 품질에 영향을 줍니다.',
    points: 6,
    tags: ['RAG', '벡터DB'],
    textPattern: null,
  },
  {
    type: QuestionType.FILE_SUBMISSION,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      'Python으로 간단한 선형 회귀(또는 로지스틱 회귀) 실습 코드(.py 또는 .ipynb)를 작성하고 제출하세요. 데이터셋은 sklearn 내장 데이터셋을 사용해도 됩니다.',
    explanation: '코드 가독성, 학습/평가 분리, 적절한 지표 출력 여부를 채점합니다.',
    points: 10,
    tags: ['Python', '실습', '머신러닝'],
    textPattern: null,
  },
  {
    type: QuestionType.FILE_SUBMISSION,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      'ChatGPT 또는 유사 LLM API를 활용한 간단한 프롬프트 템플릿(JSON 또는 Markdown) 파일을 제출하세요. 역할·입력·출력 형식을 포함해야 합니다.',
    explanation: '역할 정의, 입출력 스키마, 예시 유무를 기준으로 채점합니다.',
    points: 8,
    tags: ['프롬프트엔지니어링', '실습'],
    textPattern: null,
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: 'AI 리터러시 교육에서 "환각(Hallucination)"의 의미는?',
    explanation: '환각은 모델이 사실과 다른 내용을 그럴듯하게 생성하는 현상입니다.',
    points: 2,
    tags: ['AI리터러시', 'LLM'],
    options: [
      { label: 'A', text: '모델이 근거 없이 그럴듯한 거짓 정보를 생성하는 현상' },
      { label: 'B', text: 'GPU 과열로 인한 하드웨어 오류' },
      { label: 'C', text: '학습 데이터가 너무 적은 경우만을 의미' },
      { label: 'D', text: '사용자가 프롬프트를 입력하지 않은 상태' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: 'Batch Normalization의 주요 효과로 가장 적절한 것은?',
    explanation: 'BatchNorm은 활성화 분포를 안정화해 학습 속도와 수렴을 개선합니다.',
    points: 3,
    tags: ['딥러닝', 'BatchNorm'],
    options: [
      { label: 'A', text: '미니배치 통계로 활성화를 정규화해 학습 안정화' },
      { label: 'B', text: '모델 파라미터 수를 50% 감소' },
      { label: 'C', text: '추론 시 반드시 GPU 2대 이상 필요' },
      { label: 'D', text: '데이터 레이블을 자동 생성' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '생성형 AI 도구를 업무에 도입할 때 권장되는 보안 조치를 모두 고르세요.',
    explanation: '민감정보 마스킹, 접근 통제, 로그 감사는 조직 AI 거버넌스의 기본입니다.',
    points: 3,
    tags: ['AI거버넌스', '보안'],
    options: [
      { label: 'A', text: '사내 기밀 문서를 검증 없이 공개 API에 업로드' },
      { label: 'B', text: '민감정보 마스킹·익명화 후 입력' },
      { label: 'C', text: '접근 권한과 사용 로그를 관리' },
      { label: 'D', text: '승인된 도구·정책만 사용' },
    ],
    correctOptionLabels: ['B', 'C', 'D'],
  },
];

async function upsertQuestionBank() {
  const existing = await prisma.questionBank.findFirst({
    where: { title: BANK_TITLE },
    include: { _count: { select: { questions: true } } },
  });

  if (existing && existing._count.questions >= SAMPLE_QUESTIONS.length) {
    console.log(
      `Question bank "${BANK_TITLE}" already has ${existing._count.questions} questions — skipping seed.`,
    );
    return existing.id;
  }

  const bank =
    existing ??
    (await prisma.questionBank.create({
      data: {
        title: BANK_TITLE,
        description: BANK_DESCRIPTION,
        qualificationName: 'AI 자격증',
        subject: '인공지능 일반',
        isActive: true,
      },
    }));

  const existingPrompts = new Set(
    (
      await prisma.question.findMany({
        where: { bankId: bank.id },
        select: { prompt: true },
      })
    ).map((q) => q.prompt),
  );

  let created = 0;
  for (const item of SAMPLE_QUESTIONS) {
    if (existingPrompts.has(item.prompt)) continue;

    const isChoice =
      item.type === QuestionType.SINGLE_CHOICE ||
      item.type === QuestionType.MULTIPLE_CHOICE;

    const question = await prisma.question.create({
      data: {
        bankId: bank.id,
        type: item.type,
        difficulty: item.difficulty,
        prompt: item.prompt,
        explanation: item.explanation ?? null,
        points: item.points,
        tags: item.tags,
        options: isChoice
          ? {
              create: item.options.map((option, index) => ({
                label: option.label,
                text: option.text,
                order: index,
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    if (isChoice) {
      const choiceItem = item as Extract<
        SeedQuestion,
        { type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' }
      >;
      const correctLabels = new Set(choiceItem.correctOptionLabels);
      const answerCreates = question.options
        .filter((option) => correctLabels.has(option.label))
        .map((option) => ({
          questionId: question.id,
          optionId: option.id,
          points: question.points,
          explanation: item.explanation ?? null,
        }));

      if (answerCreates.length > 0) {
        await prisma.questionAnswerKey.createMany({ data: answerCreates });
      }
    } else {
      const subjectiveItem = item as Extract<
        SeedQuestion,
        { type: 'SHORT_TEXT' | 'FILE_SUBMISSION' }
      >;
      await prisma.questionAnswerKey.create({
        data: {
          questionId: question.id,
          textPattern: subjectiveItem.textPattern ?? null,
          points: subjectiveItem.points,
        },
      });
    }

    created += 1;
  }

  console.log(`Question bank "${BANK_TITLE}" ready (id=${bank.id}, +${created} new questions).`);
  return bank.id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  console.log('Seeding AI sample question bank...');
  await upsertQuestionBank();
  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
