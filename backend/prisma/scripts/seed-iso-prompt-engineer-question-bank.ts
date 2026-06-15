import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, QuestionDifficulty, QuestionType } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const BANK_TITLE = 'AI Prompt Engineer ISO/IEC 17024 모의고사 문제은행';
const BANK_DESCRIPTION =
  'AI Prompt Engineer (ISO/IEC 17024) 자격 대비 모의고사 문항 — 1차 필기(강22, 40문항) + 2차 실기·주관식(강30, 7문항)';

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

/* ─── 1차 필기 모의고사 (강 22) ─── 40문항 4지선다 */
const WRITTEN_EXAM_QUESTIONS: SeedQuestion[] = [
  // ── 1교시: 개념·이론 (1~20) ──────────────────────────────────────
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] 다음 중 포함 관계가 옳은 것은?',
    explanation: 'AI가 가장 넓고, 그 안에 머신러닝, 다시 그 안에 딥러닝이 포함된다.',
    points: 2,
    tags: ['이해', 'AI기초', '1차필기'],
    options: [
      { label: 'A', text: '딥러닝 ⊃ 머신러닝 ⊃ AI' },
      { label: 'B', text: 'AI ⊃ 머신러닝 ⊃ 딥러닝' },
      { label: 'C', text: '머신러닝 ⊃ AI ⊃ 딥러닝' },
      { label: 'D', text: 'AI = 머신러닝 = 딥러닝' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] 기계학습의 3가지 유형이 아닌 것은?',
    explanation: '기계학습의 3대 유형은 지도학습·비지도학습·강화학습이다. 암기학습은 없는 개념이다.',
    points: 2,
    tags: ['이해', '머신러닝', '1차필기'],
    options: [
      { label: 'A', text: '지도학습' },
      { label: 'B', text: '비지도학습' },
      { label: 'C', text: '강화학습' },
      { label: 'D', text: '암기학습' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이론] 라벨(정답)이 있는 데이터로 학습하는 방식은?',
    explanation: '지도학습은 입력-정답 쌍으로 모델을 학습시키는 방식이다.',
    points: 2,
    tags: ['이론', '머신러닝', '1차필기'],
    options: [
      { label: 'A', text: '지도학습' },
      { label: 'B', text: '비지도학습' },
      { label: 'C', text: '강화학습' },
      { label: 'D', text: '전이학습' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이론] 군집화(clustering)가 속하는 학습 유형은?',
    explanation: '군집화는 라벨 없이 데이터의 패턴·군집을 찾는 비지도학습의 대표 과제다.',
    points: 2,
    tags: ['이론', '머신러닝', '1차필기'],
    options: [
      { label: 'A', text: '지도학습' },
      { label: 'B', text: '비지도학습' },
      { label: 'C', text: '강화학습' },
      { label: 'D', text: '지도+강화 혼합' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] 현재 우리가 사용하는 AI에 해당하는 것은?',
    explanation: '현재 상용화된 AI는 특정 작업에 특화된 약한 AI(Narrow AI)다. 강한 AI·AGI·초지능은 아직 미실현이다.',
    points: 2,
    tags: ['이해', 'AI분류', '1차필기'],
    options: [
      { label: 'A', text: '약한 AI(Narrow AI)' },
      { label: 'B', text: '강한 AI(Strong AI)' },
      { label: 'C', text: 'AGI(범용 인공지능)' },
      { label: 'D', text: '초지능(Super AI)' },
    ],
    correctOptionLabels: ['A'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] AGI에 대한 설명으로 옳은 것은?',
    explanation: 'AGI(인공 일반 지능)는 인간 수준의 범용 지능을 목표로 하며, 아직 실현되지 않았다.',
    points: 2,
    tags: ['이해', 'AGI', '1차필기'],
    options: [
      { label: 'A', text: '이미 상용화되어 널리 사용되고 있다' },
      { label: 'B', text: '인간 수준의 범용 지능을 목표로 한다' },
      { label: 'C', text: '특정 작업만 수행하는 협소 AI다' },
      { label: 'D', text: '머신러닝의 한 알고리즘 이름이다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이론] 딥러닝이 전통 머신러닝보다 강한 핵심 이유는?',
    explanation: '딥러닝은 수작업 특징공학 없이 신경망이 특징(feature)을 자동으로 추출한다는 것이 핵심 강점이다.',
    points: 2,
    tags: ['이론', '딥러닝', '1차필기'],
    options: [
      { label: 'A', text: '데이터가 전혀 필요 없다' },
      { label: 'B', text: '특징(feature)을 자동으로 추출한다' },
      { label: 'C', text: '항상 100% 정확하다' },
      { label: 'D', text: '학습 속도가 항상 빠르다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] 1956년 AI라는 용어가 처음 등장한 회의는?',
    explanation: '1956년 다트머스 회의(Dartmouth Conference)에서 존 매카시가 AI 용어를 처음 사용했다.',
    points: 2,
    tags: ['이해', 'AI역사', '1차필기'],
    options: [
      { label: 'A', text: 'CES(소비자 가전 전시회)' },
      { label: 'B', text: '다트머스 회의(Dartmouth Conference)' },
      { label: 'C', text: '제네바 협약' },
      { label: 'D', text: '튜링 회의' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] 2017년 발표되어 현대 LLM의 토대가 된 구조는?',
    explanation: '"Attention Is All You Need"(2017) 논문으로 소개된 트랜스포머(Transformer) 구조가 현대 LLM의 기반이다.',
    points: 3,
    tags: ['이론', '트랜스포머', 'LLM', '1차필기'],
    options: [
      { label: 'A', text: 'RNN(순환 신경망)' },
      { label: 'B', text: 'CNN(합성곱 신경망)' },
      { label: 'C', text: '트랜스포머(Transformer)' },
      { label: 'D', text: 'GAN(생성적 적대 신경망)' },
    ],
    correctOptionLabels: ['C'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] RNN의 대표적 한계는?',
    explanation: 'RNN은 긴 시퀀스에서 앞쪽 정보가 사라지는 장기 의존성(long-term dependency) 문제가 있다.',
    points: 3,
    tags: ['이론', 'RNN', '1차필기'],
    options: [
      { label: 'A', text: '과적합이 전혀 발생하지 않는다' },
      { label: 'B', text: '장기 의존성(long-term dependency) 문제가 있다' },
      { label: 'C', text: '병렬화가 매우 쉽다' },
      { label: 'D', text: '메모리 사용량이 0이다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] 문장 내부 단어들끼리 관련도를 계산하는 메커니즘은?',
    explanation: '셀프어텐션(Self-Attention)이 트랜스포머의 핵심으로, 같은 시퀀스 내 단어 간 관계를 계산한다.',
    points: 3,
    tags: ['이론', '트랜스포머', '어텐션', '1차필기'],
    options: [
      { label: 'A', text: '풀링(Pooling)' },
      { label: 'B', text: '셀프어텐션(Self-Attention)' },
      { label: 'C', text: '드롭아웃(Dropout)' },
      { label: 'D', text: '정규화(Normalization)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이론] 이미지 특징 추출에 특화된 신경망은?',
    explanation: 'CNN(합성곱 신경망)은 지역적 패턴 추출에 특화되어 이미지·영상 처리에 주로 사용된다.',
    points: 2,
    tags: ['이론', 'CNN', '컴퓨터비전', '1차필기'],
    options: [
      { label: 'A', text: 'RNN(순환 신경망)' },
      { label: 'B', text: 'CNN(합성곱 신경망)' },
      { label: 'C', text: 'GAN(생성적 적대 신경망)' },
      { label: 'D', text: '트랜스포머(Transformer)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] 컴퓨터 비전의 과제가 아닌 것은?',
    explanation: '번역(Translation)은 자연어처리(NLP) 영역의 과제다. 분류·탐지·분할은 컴퓨터 비전의 대표 과제다.',
    points: 2,
    tags: ['활용', '컴퓨터비전', 'NLP', '1차필기'],
    options: [
      { label: 'A', text: '이미지 분류(Classification)' },
      { label: 'B', text: '객체 탐지(Object Detection)' },
      { label: 'C', text: '이미지 분할(Segmentation)' },
      { label: 'D', text: '기계 번역(Machine Translation)' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] 다음 중 NLP 응용이 아닌 것은?',
    explanation: '얼굴 인식(Face Recognition)은 컴퓨터 비전 분야다. 기계번역·감정분석·NER은 NLP 응용이다.',
    points: 2,
    tags: ['활용', 'NLP', '컴퓨터비전', '1차필기'],
    options: [
      { label: 'A', text: '기계번역(Machine Translation)' },
      { label: 'B', text: '감정 분석(Sentiment Analysis)' },
      { label: 'C', text: '개체명 인식(NER)' },
      { label: 'D', text: '얼굴 인식(Face Recognition)' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] 텍스트에서 인명·장소·날짜를 식별하는 기술은?',
    explanation: 'NER(Named Entity Recognition, 개체명 인식)은 텍스트에서 인명·장소·날짜 등을 식별하는 NLP 과제다.',
    points: 2,
    tags: ['활용', 'NLP', 'NER', '1차필기'],
    options: [
      { label: 'A', text: '토픽 모델링(Topic Modeling)' },
      { label: 'B', text: '개체명 인식(NER)' },
      { label: 'C', text: '문서 요약(Summarization)' },
      { label: 'D', text: '기계 번역(Machine Translation)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] 멀티모달 AI에 대한 설명으로 옳은 것은?',
    explanation: '멀티모달 AI는 텍스트·이미지·음성 등 여러 모달리티(양식)를 함께 처리하는 AI다.',
    points: 2,
    tags: ['활용', '멀티모달', '1차필기'],
    options: [
      { label: 'A', text: '텍스트만 처리한다' },
      { label: 'B', text: '텍스트·이미지·음성 등을 함께 처리한다' },
      { label: 'C', text: '음성만 처리한다' },
      { label: 'D', text: '이미지만 처리한다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] 현실 위에 디지털 정보를 겹쳐 보여주는 기술은?',
    explanation: 'AR(증강현실, Augmented Reality)은 현실 위에 디지털 정보를 겹쳐 표시하는 기술이다.',
    points: 2,
    tags: ['활용', 'AR', '멀티모달', '1차필기'],
    options: [
      { label: 'A', text: 'VR(가상현실)' },
      { label: 'B', text: 'AR(증강현실)' },
      { label: 'C', text: 'CNN(합성곱 신경망)' },
      { label: 'D', text: 'RNN(순환 신경망)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] 강화학습의 구성요소가 아닌 것은?',
    explanation: '강화학습의 구성요소는 에이전트·환경·보상·정책이다. 라벨은 지도학습의 개념이다.',
    points: 3,
    tags: ['이론', '강화학습', '1차필기'],
    options: [
      { label: 'A', text: '에이전트(Agent)' },
      { label: 'B', text: '보상(Reward)' },
      { label: 'C', text: '정책(Policy)' },
      { label: 'D', text: '라벨(Label)' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] 강화학습의 목표로 옳은 것은?',
    explanation: '강화학습의 목표는 즉시 보상이 아닌 장기 누적 보상의 최대화다.',
    points: 3,
    tags: ['이론', '강화학습', '1차필기'],
    options: [
      { label: 'A', text: '즉시 보상(immediate reward)만 최대화한다' },
      { label: 'B', text: '장기 누적 보상(cumulative reward)을 최대화한다' },
      { label: 'C', text: '손실 함수 값을 0으로 고정한다' },
      { label: 'D', text: '라벨 정확도를 100%로 만든다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] GPT(생성형 LLM)와 전통 검색의 차이로 옳은 것은?',
    explanation: 'GPT는 문맥을 이해해 답변을 생성하고, 전통 검색은 키워드로 페이지 목록을 제공한다.',
    points: 2,
    tags: ['활용', 'LLM', 'GPT', '1차필기'],
    options: [
      { label: 'A', text: 'GPT는 키워드로 페이지 목록을 반환한다' },
      { label: 'B', text: '전통 검색은 문맥을 이해해 답을 생성한다' },
      { label: 'C', text: 'GPT는 문맥을 이해해 답변을 생성한다' },
      { label: 'D', text: '둘 다 항상 최신 정보를 제공한다' },
    ],
    correctOptionLabels: ['C'],
  },
  // ── 2교시: 활용·윤리·프롬프팅 (21~40) ───────────────────────────
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용] GPT(생성형 LLM)의 대표적 한계는?',
    explanation: '할루시네이션(Hallucination)은 모델이 근거 없이 그럴듯한 거짓 정보를 생성하는 LLM의 대표 한계다.',
    points: 2,
    tags: ['활용', 'LLM', '할루시네이션', '1차필기'],
    options: [
      { label: 'A', text: '키워드 검색만 가능하다' },
      { label: 'B', text: '할루시네이션(없는 사실을 그럴듯하게 생성)' },
      { label: 'C', text: '링크 목록만 제공한다' },
      { label: 'D', text: '색인(index)을 만들 수 없다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용실제] 페르소나 프롬프팅의 핵심 요소는?',
    explanation: '페르소나 프롬프팅의 핵심은 AI에게 특정 역할(Role)을 부여해 답변 방식과 관점을 조정하는 것이다.',
    points: 2,
    tags: ['활용실제', '프롬프팅', '페르소나', '1차필기'],
    options: [
      { label: 'A', text: '질문의 길이' },
      { label: 'B', text: '역할(Role) 부여' },
      { label: 'C', text: '모델 크기(파라미터 수)' },
      { label: 'D', text: '무작위성(Temperature) 값' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[활용실제] 롤플레잉(Role-playing)이 페르소나에 추가로 포함하는 요소는?',
    explanation: '롤플레잉은 역할 외에 구체적인 상황(Context)·목표·대화 상대 등을 함께 설정한다.',
    points: 3,
    tags: ['활용실제', '프롬프팅', '롤플레잉', '1차필기'],
    options: [
      { label: 'A', text: '모델의 파라미터 수' },
      { label: 'B', text: '구체적 상황·목표' },
      { label: 'C', text: '최대 토큰 수' },
      { label: 'D', text: '무작위성(Temperature) 값' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[활용실제] 좋은 프롬프트의 특징으로 옳은 것은?',
    explanation: '좋은 프롬프트는 역할·맥락·형식·제약이 구체적으로 기술되어야 높은 품질의 답변을 얻을 수 있다.',
    points: 2,
    tags: ['활용실제', '프롬프팅', '1차필기'],
    options: [
      { label: 'A', text: '짧을수록 무조건 좋다' },
      { label: 'B', text: '역할·맥락·형식이 구체적이다' },
      { label: 'C', text: '모호할수록 창의적인 답이 나온다' },
      { label: 'D', text: '한 단어가 가장 효과적이다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] RLHF의 단계 순서로 옳은 것은?',
    explanation: 'RLHF는 ①SFT(지도 미세조정) → ②보상 모델 학습 → ③강화학습 순서로 진행된다.',
    points: 3,
    tags: ['이론', 'RLHF', 'LLM', '1차필기'],
    options: [
      { label: 'A', text: '보상 모델 → SFT → 강화학습' },
      { label: 'B', text: 'SFT → 보상 모델 → 강화학습' },
      { label: 'C', text: '강화학습 → SFT → 보상 모델' },
      { label: 'D', text: 'SFT → 강화학습 → 보상 모델' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] RLHF에서 사람이 답변에 순위를 매겨 학습시키는 단계는?',
    explanation: 'RLHF 2단계에서 사람의 선호(순위) 데이터를 사용해 보상 모델(Reward Model)을 학습시킨다.',
    points: 3,
    tags: ['이론', 'RLHF', '1차필기'],
    options: [
      { label: 'A', text: 'SFT(지도 미세조정)' },
      { label: 'B', text: '보상 모델(Reward Model) 학습' },
      { label: 'C', text: '모델 배포(Deployment)' },
      { label: 'D', text: '토큰화(Tokenization)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] RLHF의 목적으로 옳은 것은?',
    explanation: 'RLHF(인간 피드백 기반 강화학습)의 핵심 목적은 모델의 출력을 인간의 선호와 가치에 정렬(align)하는 것이다.',
    points: 3,
    tags: ['이론', 'RLHF', '정렬', '1차필기'],
    options: [
      { label: 'A', text: '모델의 지식량(파라미터 수)을 증가시킨다' },
      { label: 'B', text: '인간의 선호에 맞게 모델을 정렬(align)한다' },
      { label: 'C', text: '파라미터 수를 축소한다' },
      { label: 'D', text: '학습 속도를 향상시킨다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[윤리] 딥페이크의 핵심 생성 기술은?',
    explanation: '딥페이크는 GAN(생성적 적대 신경망)의 생성자-판별자 경쟁 구조를 이용해 실제 같은 가짜 콘텐츠를 만든다.',
    points: 3,
    tags: ['윤리', '딥페이크', 'GAN', '1차필기'],
    options: [
      { label: 'A', text: 'RNN(순환 신경망)' },
      { label: 'B', text: 'CNN(합성곱 신경망)' },
      { label: 'C', text: 'GAN(생성적 적대 신경망)' },
      { label: 'D', text: '트랜스포머(Transformer)' },
    ],
    correctOptionLabels: ['C'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[윤리] 딥페이크에 대한 설명으로 옳은 것은?',
    explanation: '딥페이크는 악용 위험과 함께 교육·영화 등 긍정적 활용 사례도 있는 양면성을 가진 기술이다.',
    points: 2,
    tags: ['윤리', '딥페이크', '1차필기'],
    options: [
      { label: 'A', text: '모든 경우에서 불법이다' },
      { label: 'B', text: '교육·영화 등 긍정적 활용도 존재한다' },
      { label: 'C', text: '현재 기술로 탐지가 불가능하다' },
      { label: 'D', text: '음성 합성은 딥페이크에 포함되지 않는다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[윤리] 딥페이크 악용 방지 대책이 아닌 것은?',
    explanation: '탐지 기술·워터마크·법제도가 현실적 방지 대책이며, 기술 자체를 무조건 금지하는 것은 적절한 대책이 아니다.',
    points: 2,
    tags: ['윤리', '딥페이크', '1차필기'],
    options: [
      { label: 'A', text: '딥페이크 탐지 기술 개발' },
      { label: 'B', text: '워터마크·출처 표시 의무화' },
      { label: 'C', text: '관련 법·제도 정비' },
      { label: 'D', text: '딥페이크 기술 자체를 무조건 금지' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[윤리] AI 채용 시스템의 가장 큰 윤리 이슈는?',
    explanation: '편향된 학습 데이터가 채용 AI에 반영될 경우 특정 집단에 대한 차별이 자동화·강화될 수 있다.',
    points: 2,
    tags: ['윤리', 'AI채용', '편향', '1차필기'],
    options: [
      { label: 'A', text: '데이터 처리 속도' },
      { label: 'B', text: '데이터 편향(Bias)으로 인한 차별' },
      { label: 'C', text: '서버 운영 비용' },
      { label: 'D', text: '화면 UI 디자인' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[윤리] AI 채용을 공정하게 운영하는 원칙으로 옳은 것은?',
    explanation: 'AI 채용의 공정성 확보를 위해 인간 감독(Human-in-the-loop)이 필수이며, AI가 단독으로 최종 결정해서는 안 된다.',
    points: 3,
    tags: ['윤리', 'AI채용', '공정성', '1차필기'],
    options: [
      { label: 'A', text: 'AI가 사람의 개입 없이 최종 결정한다' },
      { label: 'B', text: '인간 감독(Human-in-the-loop)을 반드시 포함한다' },
      { label: 'C', text: '채용 기준을 외부에 공개하지 않는다' },
      { label: 'D', text: '학습 데이터 검증을 생략한다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[윤리] AI 윤리의 핵심 가치로 보기 어려운 것은?',
    explanation: '투명성·공정성·설명 가능성은 AI 윤리의 핵심 가치다. 동의 없는 무제한 데이터 수집은 비윤리적이다.',
    points: 2,
    tags: ['윤리', 'AI윤리', '1차필기'],
    options: [
      { label: 'A', text: '투명성(Transparency)' },
      { label: 'B', text: '공정성(Fairness)' },
      { label: 'C', text: '설명 가능성(Explainability)' },
      { label: 'D', text: '무제한 데이터 수집(Unlimited Collection)' },
    ],
    correctOptionLabels: ['D'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[이해] 생성형 AI에 대한 설명으로 옳은 것은?',
    explanation: '생성형 AI(Generative AI)는 학습 데이터를 기반으로 새로운 텍스트·이미지·음악 등의 콘텐츠를 만들어낸다.',
    points: 2,
    tags: ['이해', '생성형AI', '1차필기'],
    options: [
      { label: 'A', text: '입력 데이터를 분류하는 작업만 수행한다' },
      { label: 'B', text: '새로운 텍스트·이미지 등의 콘텐츠를 생성한다' },
      { label: 'C', text: '기능이 전통 검색 엔진과 완전히 동일하다' },
      { label: 'D', text: '학습 과정이 전혀 필요 없다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.EASY,
    prompt: '[도구] 프롬프트에서 출력 형식을 지정하는 이유로 옳은 것은?',
    explanation: '출력 형식(표·목록·JSON 등)을 명시하면 원하는 구조로 결과를 받아 활용성을 높일 수 있다.',
    points: 2,
    tags: ['도구', '프롬프팅', '출력형식', '1차필기'],
    options: [
      { label: 'A', text: '토큰 수를 늘리기 위해서' },
      { label: 'B', text: '원하는 구조(표·목록 등)로 결과를 받기 위해서' },
      { label: 'C', text: '모델 처리 속도를 낮추기 위해서' },
      { label: 'D', text: '출력의 무작위성을 높이기 위해서' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[도구] 복잡한 작업을 여러 프롬프트로 나눠 순서대로 연결하는 기법은?',
    explanation: '프롬프트 체이닝(Prompt Chaining)은 복잡한 작업을 단계로 나눠 각 단계의 출력을 다음 입력으로 연결해 품질을 높인다.',
    points: 3,
    tags: ['도구', '프롬프팅', '체이닝', '1차필기'],
    options: [
      { label: 'A', text: '토큰화(Tokenization)' },
      { label: 'B', text: '프롬프트 체이닝(Prompt Chaining)' },
      { label: 'C', text: '정규화(Normalization)' },
      { label: 'D', text: '드롭아웃(Dropout)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[활용] 검색 결과(외부 지식)를 LLM에 결합해 근거 기반 답을 만드는 방식은?',
    explanation: 'RAG(Retrieval-Augmented Generation)는 관련 문서를 검색해 LLM 입력에 함께 제공함으로써 근거 기반 답변을 생성한다.',
    points: 3,
    tags: ['활용', 'RAG', 'LLM', '1차필기'],
    options: [
      { label: 'A', text: 'GAN(생성적 적대 신경망)' },
      { label: 'B', text: 'RAG(검색 증강 생성)' },
      { label: 'C', text: 'CNN(합성곱 신경망)' },
      { label: 'D', text: 'SFT(지도 미세조정)' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이론] 트랜스포머가 RNN 대비 가진 대표적 장점은?',
    explanation: '트랜스포머는 셀프어텐션 기반으로 병렬 처리가 가능해 학습이 빠르고, 장기 의존성 문제도 해결한다.',
    points: 3,
    tags: ['이론', '트랜스포머', 'RNN', '1차필기'],
    options: [
      { label: 'A', text: '순차 처리만 가능하다' },
      { label: 'B', text: '병렬 처리로 학습 속도가 빠르다' },
      { label: 'C', text: '긴 문장에 약하다' },
      { label: 'D', text: '어텐션 메커니즘을 사용하지 않는다' },
    ],
    correctOptionLabels: ['B'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[활용실제] 다음 중 가장 좋은 프롬프트는?',
    explanation: '역할·대상·제약·출력형식을 모두 포함한 ③번이 4요소를 갖춘 최적의 프롬프트다.',
    points: 3,
    tags: ['활용실제', '프롬프팅', '1차필기'],
    options: [
      { label: 'A', text: '"식단 알려줘"' },
      { label: 'B', text: '"건강"' },
      { label: 'C', text: '"너는 영양사다. 고혈압 환자를 위한 저염 한식 7일 식단을 표로 알려줘"' },
      { label: 'D', text: '"음식?"' },
    ],
    correctOptionLabels: ['C'],
  },
  {
    type: QuestionType.SINGLE_CHOICE,
    difficulty: QuestionDifficulty.NORMAL,
    prompt: '[이해] 다음 중 강한 AI(Strong AI)의 특징으로 옳은 것은?',
    explanation: '강한 AI(Strong AI)는 인간처럼 스스로 이해·사고·추론하는 범용 지능을 의미하며, 아직 이론적 개념이다.',
    points: 3,
    tags: ['이해', 'AI분류', 'AGI', '1차필기'],
    options: [
      { label: 'A', text: '특정 작업만 수행할 수 있다' },
      { label: 'B', text: '인간처럼 스스로 이해·사고하는 범용 지능(이론적 개념)' },
      { label: 'C', text: '이미 상용화되어 사용 중이다' },
      { label: 'D', text: '머신러닝의 한 알고리즘 이름이다' },
    ],
    correctOptionLabels: ['B'],
  },
];

/* ─── 2차 실기·주관식 모의고사 (강 30) ─── 5 주관식 + 2 실기 */
const PRACTICAL_EXAM_QUESTIONS: SeedQuestion[] = [
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      '[이론/주관식] 트랜스포머(Transformer)가 RNN의 한계를 어떻게 극복했는지 2가지 이상 서술하시오.',
    explanation:
      '① 셀프어텐션으로 거리와 무관하게 단어를 직접 연결해 장기 의존성 문제를 해결. ② 순차 처리 대신 병렬 처리가 가능해 대규모·고속 학습이 가능. (장기 의존성 해결 5점 + 병렬 처리 5점)',
    points: 10,
    tags: ['이론', '트랜스포머', 'RNN', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      '[이론/주관식] RLHF(인간 피드백 기반 강화학습)의 3단계를 순서대로 쓰고, 각 단계를 한 줄로 설명하시오.',
    explanation:
      '① SFT(지도 미세조정): 사람이 쓴 모범 답변으로 학습. ② 보상 모델 학습: 답변 순위로 인간 선호 학습. ③ 강화학습: 보상 모델 점수를 높이도록 최적화. (순서 정확 4점 + 각 설명 2점×3)',
    points: 10,
    tags: ['이론', 'RLHF', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      '[활용실제/주관식] 좋은 프롬프트의 4대 요소를 쓰고, 각각 구체적인 예를 드시오.',
    explanation:
      '역할("너는 영양사다"), 맥락("고혈압 환자 대상"), 예시("이런 형식으로: …"), 제약("200자, 표로"). (4요소 명칭 4점 + 예시 6점)',
    points: 10,
    tags: ['활용실제', '프롬프팅', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      '[도구/주관식] 프롬프트 체이닝(Prompt Chaining)이 단일 프롬프트보다 유리한 경우와 그 이유를 서술하시오.',
    explanation:
      '복잡·다단계 작업에서 유리. 작업을 분할해 단계별 검증·수정이 가능하고, 앞 단계 출력을 다음 입력으로 써 품질과 통제력이 향상되며 오류 추적이 쉽다. (분할/검증 5점 + 통제·품질 5점)',
    points: 10,
    tags: ['도구', '프롬프팅', '체이닝', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.SHORT_TEXT,
    difficulty: QuestionDifficulty.NORMAL,
    prompt:
      '[윤리/주관식] RAG(검색 증강 생성)가 할루시네이션을 줄이는 원리와 한계를 서술하시오.',
    explanation:
      '원리: 질문 관련 문서를 검색해 근거로 함께 제공하므로 모델이 추측 대신 자료 기반으로 답함 → 할루시네이션 감소, 출처 검증 가능. 한계: 검색 자료가 부정확·부족하면 여전히 오류 가능, 할루시네이션을 0으로 만들지는 못함. (근거 제공 원리 6점 + 한계 4점)',
    points: 10,
    tags: ['윤리', 'RAG', '할루시네이션', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.FILE_SUBMISSION,
    difficulty: QuestionDifficulty.HARD,
    prompt:
      '[활용실제·도구/실기] 다음 요구로 "회의록 요약 봇"의 프롬프트를 작성하시오.\n' +
      '요구: 회의록 텍스트를 입력받아 ①핵심 요약 3줄 ②결정사항 ③담당자별 할 일 추출.\n' +
      '조건: 시스템 프롬프트 + 핵심 프롬프트(역할·맥락·예시·제약 4요소) + 출력 형식 지정 포함.',
    explanation:
      '채점 루브릭(25점): 시스템 프롬프트(5) · 4요소 포함(8) · 출력 형식 지정(7) · 누락 처리·안전(5).\n' +
      '모범답안 예시:\n[시스템] 너는 회의록 정리 비서다. 사실만 사용하고 추측하지 않는다.\n입력에 없는 내용은 "기재 없음"으로 표기한다.\n' +
      '[프롬프트] (역할) 회의록 분석가로서 (맥락) 아래 회의록을 (제약) 다음 형식의 표로 정리하라:\n## 요약(3줄) / ## 결정사항(목록) / ## 할 일(담당자 | 업무 | 기한)\n[회의록] """{내용}"""',
    points: 25,
    tags: ['활용실제', '도구', '프롬프팅', '2차실기'],
    textPattern: null,
  },
  {
    type: QuestionType.FILE_SUBMISSION,
    difficulty: QuestionDifficulty.HARD,
    prompt:
      '[도구·윤리/실기] "사내 규정 기반 Q&A(RAG)" 시스템의 프롬프트를 작성하시오.\n' +
      '조건: ①제공 문서만 근거로 답하고, ②자료에 없으면 "자료에 없음"이라 답하며, ③답변 끝에 출처(문서명·항목) 표기, ④개인정보 요구 금지.',
    explanation:
      '채점 루브릭(25점): 자료 한정(7) · 미존재 처리(6) · 출처 표기(6) · 윤리(개인정보 보호)(6).\n' +
      '모범답안 예시:\n[시스템] 너는 사내 규정 안내 도우미다. 아래 [자료]만 근거로 답하라.\n자료에 없으면 "자료에 없음"이라 답하고 추측하지 마라.\n답변 끝에 (출처: 문서명·항목)을 표기하라. 개인정보는 묻지 않는다.\n[자료] """{검색된 규정}"""\n[질문] {사용자 질문}',
    points: 25,
    tags: ['도구', '윤리', 'RAG', '프롬프팅', '2차실기'],
    textPattern: null,
  },
];

const ALL_QUESTIONS: SeedQuestion[] = [
  ...WRITTEN_EXAM_QUESTIONS,
  ...PRACTICAL_EXAM_QUESTIONS,
];

async function upsertQuestionBank() {
  const existing = await prisma.questionBank.findFirst({
    where: { title: BANK_TITLE },
    include: { _count: { select: { questions: true } } },
  });

  if (existing && existing._count.questions >= ALL_QUESTIONS.length) {
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
        qualificationName: 'AI Prompt Engineer',
        subject: 'ISO/IEC 17024',
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
  for (const item of ALL_QUESTIONS) {
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
              create: (item as Extract<SeedQuestion, { type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' }>).options.map(
                (option, index) => ({
                  label: option.label,
                  text: option.text,
                  order: index,
                }),
              ),
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
          explanation: item.explanation ?? null,
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

  console.log('Seeding ISO Prompt Engineer mock exam question bank...');
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
