import type { QmiKbEntry } from './knowledge-base';

/**
 * AI Prompt Engineer 과정(ISO/IEC 17024) 30강 학습도우미 지식베이스.
 * 각 강의의 핵심 개념·시험 포인트를 chatbot RAG 엔트리로 제공한다.
 */
export const ISO_PROMPT_ENGINEER_KB: QmiKbEntry[] = [
  {
    id: 'iso-pe-01',
    title: 'Prompt Engineer 강01 — OT & AI 기본 소양',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 1강', 'AI Prompt Engineer OT', 'AI 기본 소양', 'Prompt Engineer 과정 안내',
      'Pre-test', '프리테스트', 'AI Prompt Engineer 소개', '프롬프트 엔지니어 과정',
    ],
    answer:
      '📚 AI Prompt Engineer 강 01 — OT & AI 기본 소양\n\n' +
      '• 이 과정은 ISO/IEC 17024 AI Prompt Engineer 자격증 대비 30강입니다.\n' +
      '• 학습 로드맵: 기본 과정(강1-22) AI 이론·NLP·어텐션·GPT·프롬프팅·윤리 → 심화(강23-30) 프롬프트 설계 실습.\n' +
      '• Pre-test(O/X): 10문항 중 6문항(60점) 이상 통과 필수 — 시간 제한 없음.\n' +
      '• AI 큰 그림: 좁은 AI(Narrow AI) → 강한 AI(AGI) 스펙트럼 / 생성형 AI(LLM·이미지 AI)가 현재 주류.\n' +
      '• 프롬프트 엔지니어란: AI 모델과 효과적으로 소통하기 위한 입력(프롬프트)을 설계·최적화하는 전문가.',
    pose: 'presenting',
    suggestions: ['AI란 무엇인가요?', '지도학습이 뭐예요?', 'GPT는 어떻게 작동하나요?'],
  },
  {
    id: 'iso-pe-02',
    title: 'Prompt Engineer 강02 — AI의 정의와 분류',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 2강', 'AI 정의', 'AI 분류', '인공지능 정의', '머신러닝이란',
      '지도학습 비지도학습 강화학습', 'AI 종류', '기계학습이란',
    ],
    answer:
      '📚 AI Prompt Engineer 강 02 — AI의 정의와 분류\n\n' +
      '• AI(인공지능): 인간의 지능적 행동(학습·추론·문제해결·언어이해·인식)을 기계가 수행하도록 하는 기술.\n' +
      '• AI > 머신러닝 > 딥러닝 순으로 부분집합 관계.\n' +
      '• 학습 방식 3가지: 지도학습(레이블 있음)·비지도학습(레이블 없음)·강화학습(보상 신호).\n' +
      '• 좁은 AI(Narrow AI): 특정 과제만 수행 (체스·번역·얼굴 인식 등) — 현재 대부분의 AI.\n' +
      '• 시험 포인트: "AI > ML > DL" 포함 관계와 3가지 학습 방식 구분이 핵심 출제 항목.',
    pose: 'explaining',
    suggestions: ['딥러닝 구성요소가 궁금해요', 'AGI가 뭔가요?', 'AI 역사는 어떻게 되나요?'],
  },
  {
    id: 'iso-pe-03',
    title: 'Prompt Engineer 강03 — AI 핵심 구성요소',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 3강', 'AI 핵심 구성요소', '신경망', '딥러닝 구성요소', 'AI 작동 원리',
      '인공 신경망', '딥러닝이 강한 이유', '빅데이터 GPU',
    ],
    answer:
      '📚 AI Prompt Engineer 강 03 — AI 핵심 구성요소\n\n' +
      '• 3대 핵심 요소: ① 알고리즘(모델 구조) ② 대규모 데이터 ③ 컴퓨팅 파워(GPU/TPU).\n' +
      '• 인공 신경망: 사람의 뇌 뉴런을 모방 — 퍼셉트론 → 다층 신경망 → 딥러닝.\n' +
      '• 딥러닝이 강한 이유: 자동 특징 추출 + 빅데이터 + GPU 병렬 연산의 조합.\n' +
      '• 표현 학습(Representation Learning): 데이터에서 스스로 유용한 특징을 찾아냄.\n' +
      '• 시험 포인트: "딥러닝 성능의 3요소 = 알고리즘·데이터·컴퓨팅" 암기.',
    pose: 'explaining',
    suggestions: ['AGI가 뭔가요?', 'AI 역사가 궁금해요', '지도학습이 뭔가요?'],
  },
  {
    id: 'iso-pe-04',
    title: 'Prompt Engineer 강04 — 약한 AI·강한 AI·AGI',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 4강', '약한 AI', '강한 AI', 'AGI', 'Narrow AI', 'Strong AI',
      '범용 인공지능', 'AGI란', 'AI 단계', 'ASI',
    ],
    answer:
      '📚 AI Prompt Engineer 강 04 — 약한 AI·강한 AI·AGI\n\n' +
      '• 약한 AI(Narrow AI): 특정 과제에만 특화된 AI — 현재 존재하는 거의 모든 AI (ChatGPT·AlphaGo 포함).\n' +
      '• 강한 AI(Strong AI): 어떤 지적 과제도 인간처럼 수행 가능한 AI — 현재 미실현.\n' +
      '• AGI(범용 인공지능): Strong AI와 유사, 인간 수준의 일반적 지능 — 연구 목표.\n' +
      '• ASI(초지능): AGI를 넘어선 인간 이상의 지능 — 현재 이론적 개념.\n' +
      '• 시험 포인트: "현재 AI = Narrow AI" / GPT-4도 Narrow AI의 범주 / AGI는 아직 미실현.',
    pose: 'explaining',
    suggestions: ['AI 역사는 어떻게 되나요?', '지도학습이 뭔가요?', 'NLP가 뭔가요?'],
  },
  {
    id: 'iso-pe-05',
    title: 'Prompt Engineer 강05 — AI 역사와 주요 이정표',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 5강', 'AI 역사', '다트머스 회의', '튜링 테스트', 'AI 이정표',
      'AlexNet', 'ChatGPT 역사', 'DeepSeek', 'Transformer 역사', 'AI 발전 역사',
    ],
    answer:
      '📚 AI Prompt Engineer 강 05 — AI 역사와 주요 이정표\n\n' +
      '• 1956 다트머스 회의: "AI"라는 용어 최초 사용 — AI 연구의 공식 출발.\n' +
      '• 1950 튜링 테스트: 앨런 튜링 제안 — 기계가 인간처럼 대화할 수 있는지 판별.\n' +
      '• 2012 AlexNet: 딥러닝이 이미지 인식에서 압도적 성능 증명 → 딥러닝 붐 시작.\n' +
      '• 2017 Transformer("Attention Is All You Need"): 현대 LLM의 기반 아키텍처 제안.\n' +
      '• 2022 ChatGPT: 대화형 AI의 대중화 / 2024 DeepSeek: 효율적 오픈소스 LLM 등장.\n' +
      '• 시험 포인트: 연도별 이정표 순서 / Transformer = LLM의 핵심 기반.',
    pose: 'explaining',
    suggestions: ['지도학습이 뭔가요?', '어텐션 메커니즘이 궁금해요', 'GPT가 어떻게 작동하나요?'],
  },
  {
    id: 'iso-pe-06',
    title: 'Prompt Engineer 강06 — AI 작동원리 ① 지도학습',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 6강', '지도학습', '지도 학습이란', '분류', '회귀', '레이블',
      'Supervised Learning', '훈련 데이터', '지도학습 예시',
    ],
    answer:
      '📚 AI Prompt Engineer 강 06 — AI 작동원리 ① 지도학습\n\n' +
      '• 지도학습(Supervised Learning): 입력(X)과 정답 레이블(Y)이 쌍으로 있는 데이터로 학습.\n' +
      '• 분류(Classification): 카테고리 예측 (스팸/정상, 고양이/개, 양성/음성).\n' +
      '• 회귀(Regression): 연속 값 예측 (주택 가격, 기온, 주가).\n' +
      '• 학습 과정: 훈련 데이터로 모델 학습 → 검증 데이터로 튜닝 → 테스트 데이터로 성능 평가.\n' +
      '• 주요 알고리즘: 선형 회귀·로지스틱 회귀·SVM·결정 트리·딥러닝.\n' +
      '• 시험 포인트: 지도학습 = "레이블 있는 데이터" / 분류 vs 회귀 차이.',
    pose: 'explaining',
    suggestions: ['비지도학습이 뭔가요?', '강화학습은 어떻게 다른가요?', 'NLP란?'],
  },
  {
    id: 'iso-pe-07',
    title: 'Prompt Engineer 강07 — AI 작동원리 ② 비지도학습·차이점',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 7강', '비지도학습', '클러스터링', '차원축소', '비지도 학습이란',
      'Unsupervised Learning', 'K-means', 'PCA', '지도 vs 비지도', '비지도학습 예시',
    ],
    answer:
      '📚 AI Prompt Engineer 강 07 — AI 작동원리 ② 비지도학습·차이점\n\n' +
      '• 비지도학습(Unsupervised Learning): 레이블 없이 데이터의 패턴·구조를 스스로 발견.\n' +
      '• 클러스터링(Clustering): 비슷한 데이터끼리 그룹화 (K-means·DBSCAN·계층적 클러스터링).\n' +
      '• 차원 축소(Dimensionality Reduction): 고차원 데이터를 저차원으로 압축 (PCA·t-SNE·오토인코더).\n' +
      '• 지도 vs 비지도 핵심 차이: 레이블(정답) 유무 / 지도 = 예측·분류 / 비지도 = 패턴 발견.\n' +
      '• 생성 모델(VAE·GAN)도 비지도학습의 일종 — 새로운 데이터 생성 가능.\n' +
      '• 시험 포인트: 비지도학습 = "레이블 없음" / K-means = 클러스터링 / PCA = 차원 축소.',
    pose: 'explaining',
    suggestions: ['강화학습은 어떻게 다른가요?', 'NLP가 뭔가요?', '어텐션 메커니즘이 궁금해요'],
  },
  {
    id: 'iso-pe-08',
    title: 'Prompt Engineer 강08 — 자연어처리(NLP) ①',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 8강', 'NLP', '자연어처리', '기계번역', '텍스트 요약', '감정분석',
      '개체명인식', 'NER', '자연어처리란', 'NLP 응용',
    ],
    answer:
      '📚 AI Prompt Engineer 강 08 — 자연어처리(NLP) ①\n\n' +
      '• NLP(Natural Language Processing): 컴퓨터가 인간의 언어(텍스트·음성)를 이해·생성하는 기술.\n' +
      '• 기계번역(MT): 한국어 → 영어 등 언어 간 자동 변환 (Google 번역·DeepL·Papago).\n' +
      '• 텍스트 요약(Summarization): 긴 문서를 핵심 내용으로 압축 (추출적·생성적 요약).\n' +
      '• 감정 분석(Sentiment Analysis): 텍스트의 긍정·중립·부정 감정 분류 (리뷰 분석 등).\n' +
      '• 개체명 인식(NER): 텍스트에서 인명·기관명·날짜·지명 등 추출.\n' +
      '• 시험 포인트: NLP 4대 응용(번역·요약·감정분석·NER)과 각각의 정의.',
    pose: 'explaining',
    suggestions: ['NLP 2편에서는 무엇을 배우나요?', '강화학습이 뭔가요?', '어텐션 메커니즘이 궁금해요'],
  },
  {
    id: 'iso-pe-09',
    title: 'Prompt Engineer 강09 — 자연어처리(NLP) ②',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 9강', 'NLP 2편', '질의응답', '토픽모델링', '음성인식', '음성합성',
      'QA 시스템', 'STT', 'TTS', 'NLP 심화', '텍스트 교정',
    ],
    answer:
      '📚 AI Prompt Engineer 강 09 — 자연어처리(NLP) ②\n\n' +
      '• 질의응답(QA): 자연어 질문에 자연어 답변 제공 — ChatGPT·Siri·Bixby의 핵심 기능.\n' +
      '• 토픽 모델링: 문서 집합에서 주제 자동 추출 (LDA·NMF).\n' +
      '• 음성↔텍스트 변환: STT(Speech-to-Text, 받아쓰기)·TTS(Text-to-Speech, 음성 출력).\n' +
      '• 철자·문법 교정: 문장의 오류를 자동 감지·수정 (Grammarly·맞춤법 검사기).\n' +
      '• 이 강의의 모든 NLP 과제가 LLM(GPT 등) 하나로 통합 처리 가능해짐 → 프롬프트의 중요성.\n' +
      '• 시험 포인트: STT vs TTS 방향 구분 / QA = AI 챗봇의 핵심 기술.',
    pose: 'explaining',
    suggestions: ['강화학습이 뭔가요?', '컴퓨터 비전이 궁금해요', '어텐션 메커니즘은 무엇인가요?'],
  },
  {
    id: 'iso-pe-10',
    title: 'Prompt Engineer 강10 — 강화학습과 응용',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 10강', '강화학습', '강화학습이란', '에이전트', '보상', '정책',
      'Reinforcement Learning', '자율주행 강화학습', 'Q-learning', 'AlphaGo',
    ],
    answer:
      '📚 AI Prompt Engineer 강 10 — 강화학습과 응용\n\n' +
      '• 강화학습(RL): 에이전트가 환경과 상호작용하며 보상을 최대화하는 행동을 학습.\n' +
      '• 핵심 요소: 에이전트(학습자)·환경·상태(State)·행동(Action)·보상(Reward)·정책(Policy).\n' +
      '• 지도학습과의 차이: 정답 레이블 대신 "보상 신호"로 학습 — 시행착오 기반.\n' +
      '• 주요 응용: 자율주행·게임 AI(AlphaGo·AlphaStar)·로봇 제어·광고 최적화·RLHF(GPT 정렬).\n' +
      '• AlphaGo: 강화학습으로 바둑에서 인간 세계 챔피언을 최초 이긴 AI (2016).\n' +
      '• 시험 포인트: RL = "보상 신호" 기반 / RLHF = 강화학습을 LLM 정렬에 적용.',
    pose: 'explaining',
    suggestions: ['컴퓨터 비전이 뭔가요?', 'RLHF가 궁금해요', '어텐션 메커니즘은 무엇인가요?'],
  },
  {
    id: 'iso-pe-11',
    title: 'Prompt Engineer 강11 — 컴퓨터 비전',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 11강', '컴퓨터 비전', 'Computer Vision', '이미지 분류', '객체 탐지',
      '의미 분할', '얼굴 인식', 'YOLO', 'CNN 응용', '이미지 인식',
    ],
    answer:
      '📚 AI Prompt Engineer 강 11 — 컴퓨터 비전\n\n' +
      '• 컴퓨터 비전(CV): 기계가 이미지·영상을 이해하고 해석하는 AI 분야.\n' +
      '• 이미지 분류(Classification): 이미지에 카테고리 레이블 부여 (고양이/개).\n' +
      '• 객체 탐지(Object Detection): 이미지 내 여러 물체의 위치와 종류 동시 검출 (YOLO·Faster R-CNN).\n' +
      '• 의미 분할(Semantic Segmentation): 픽셀 단위로 각 영역의 의미 분류 (자율주행 도로 인식).\n' +
      '• 얼굴 인식: 얼굴 탐지 → 특징 추출 → 신원 확인 (스마트폰 잠금 해제).\n' +
      '• 시험 포인트: CV 3대 과제(분류·탐지·분할) 정의와 차이.',
    pose: 'explaining',
    suggestions: ['멀티모달 AI가 뭔가요?', '어텐션 메커니즘이 궁금해요', 'NLP와 CV의 차이는?'],
  },
  {
    id: 'iso-pe-12',
    title: 'Prompt Engineer 강12 — 멀티모달·AR·VR',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 12강', '멀티모달', 'AR', 'VR', '멀티모달 AI', '증강현실', '가상현실',
      'Multimodal AI', 'GPT-4V', 'Gemini', 'XR', '확장현실',
    ],
    answer:
      '📚 AI Prompt Engineer 강 12 — 멀티모달·AR·VR\n\n' +
      '• 멀티모달 AI: 텍스트·이미지·음성·영상 등 여러 모달리티(형식)를 통합 처리하는 AI.\n' +
      '• 대표 모델: GPT-4V(텍스트+이미지), Gemini Ultra(텍스트+이미지+음성+영상), Sora(텍스트→영상).\n' +
      '• AR(Augmented Reality): 실제 환경에 디지털 정보를 겹쳐 보여줌 (포켓몬 GO·스마트 네비).\n' +
      '• VR(Virtual Reality): 완전히 가상의 환경에 사용자를 몰입시킴 (메타 퀘스트·PSVR).\n' +
      '• AI + XR: AI가 AR/VR 콘텐츠 자동 생성·개인화·공간 인식 향상에 활용.\n' +
      '• 시험 포인트: 멀티모달 = 여러 입력 형식 통합 / AR = 현실+가상 혼합 / VR = 완전 가상.',
    pose: 'explaining',
    suggestions: ['어텐션 메커니즘이 뭔가요?', 'GPT는 어떻게 작동하나요?', '프롬프트 엔지니어링이란?'],
  },
  {
    id: 'iso-pe-13',
    title: 'Prompt Engineer 강13 — 어텐션 메커니즘 ①',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 13강', '어텐션 메커니즘', 'Attention', 'RNN 한계', '어텐션 등장 배경',
      '어텐션이란', 'seq2seq', '번역 어텐션',
    ],
    answer:
      '📚 AI Prompt Engineer 강 13 — 어텐션 메커니즘 ①\n\n' +
      '• 어텐션 등장 배경: RNN/LSTM은 긴 문장에서 초반 정보가 희미해지는 한계(기울기 소실)가 있음.\n' +
      '• Seq2Seq + 어텐션: 인코더의 모든 은닉 상태를 디코더가 참조 → 중요한 부분에 집중.\n' +
      '• 어텐션 원리: 현재 디코더 상태와 모든 인코더 상태의 유사도를 계산 → 가중합으로 문맥 벡터 생성.\n' +
      '• 초기 적용: 기계번역(영어↔독일어)에서 성능 대폭 향상 증명 (Bahdanau, 2014).\n' +
      '• 의미: 어텐션 = "어디를 봐야 하는지"를 모델이 학습하는 메커니즘.\n' +
      '• 시험 포인트: 어텐션의 등장 배경 = RNN의 장거리 의존성 한계 극복.',
    pose: 'explaining',
    suggestions: ['어텐션 심화와 트랜스포머가 궁금해요', 'GPT가 어떻게 작동하나요?', '프롬프트 설계 원리는?'],
  },
  {
    id: 'iso-pe-14',
    title: 'Prompt Engineer 강14 — 어텐션 메커니즘 ②',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 14강', '셀프 어텐션', 'Self-Attention', '트랜스포머', 'Transformer',
      'Attention Is All You Need', '멀티헤드 어텐션', 'Query Key Value', 'BERT GPT 기반',
    ],
    answer:
      '📚 AI Prompt Engineer 강 14 — 어텐션 메커니즘 ②\n\n' +
      '• 셀프 어텐션(Self-Attention): 같은 시퀀스 내의 모든 위치 간 관계를 동시에 계산.\n' +
      '• Q·K·V 구조: Query(현재 토큰)·Key(참조 대상 토큰)·Value(실제 정보) → 유사도 가중 합산.\n' +
      '• 멀티헤드 어텐션(Multi-Head Attention): 여러 독립적 어텐션 헤드를 병렬 실행 → 다양한 관계 포착.\n' +
      '• 트랜스포머(2017): RNN 없이 순수 어텐션만으로 구성 — 병렬 처리 가능 → 대규모 학습 가능.\n' +
      '• BERT(인코더), GPT(디코더): 트랜스포머 기반의 대표적 Pre-trained 모델.\n' +
      '• 시험 포인트: Transformer = "어텐션만으로 구성" / Q·K·V의 역할 구분.',
    pose: 'explaining',
    suggestions: ['GPT vs 전통 검색의 차이는?', '프롬프트 엔지니어링 원리가 궁금해요', 'RLHF가 뭔가요?'],
  },
  {
    id: 'iso-pe-15',
    title: 'Prompt Engineer 강15 — GPT vs 전통 검색',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 15강', 'GPT vs 검색', 'ChatGPT vs 구글', '키워드 검색 vs AI',
      'GPT 문맥이해', '검색엔진 vs LLM', 'GPT 장단점', '검색 vs 생성',
    ],
    answer:
      '📚 AI Prompt Engineer 강 15 — GPT vs 전통 검색\n\n' +
      '• 전통 검색(키워드 기반): 단어 일치로 문서 목록 반환 → 사용자가 직접 정보 판단·종합.\n' +
      '• GPT(문맥 이해): 질문의 의미를 파악해 자연어로 직접 답변 생성 — 종합·추론 가능.\n' +
      '• GPT 장점: 복잡한 질문·요약·코드 생성·창작 등 다양한 과제 수행 가능.\n' +
      '• GPT 단점: 할루시네이션(사실과 다른 내용 생성)·최신 정보 부재·출처 불명확.\n' +
      '• 검색 장점: 최신 정보·출처 명확·정확한 URL 제공.\n' +
      '• 시험 포인트: GPT = "생성형 AI(추론·창작)" / 검색 = "정보 검색(링크 제공)"의 차이.',
    pose: 'explaining',
    suggestions: ['페르소나 프롬프팅이 뭔가요?', 'RLHF가 궁금해요', '할루시네이션을 어떻게 줄이나요?'],
  },
  {
    id: 'iso-pe-16',
    title: 'Prompt Engineer 강16 — 페르소나 기반 프롬프팅 ①',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 16강', '페르소나 프롬프팅', '역할 부여', '페르소나 프롬프트',
      'Persona Prompting', '역할 설정 프롬프트', 'AI 역할 부여', '시스템 프롬프트 기초',
    ],
    answer:
      '📚 AI Prompt Engineer 강 16 — 페르소나 기반 프롬프팅 ①\n\n' +
      '• 페르소나(Persona): AI에게 특정 역할·성격·전문성을 부여하는 프롬프팅 기법.\n' +
      '• 예시: "당신은 15년 경력의 마케팅 전문가입니다. 다음 제품의 홍보 문구를 작성해 주세요."\n' +
      '• 효과: AI가 해당 역할에 맞는 어조·지식·형식으로 응답 → 품질·일관성 향상.\n' +
      '• 시스템 프롬프트: 대화 전체에 걸쳐 AI의 역할·행동 규칙을 설정하는 프롬프트 (API 활용 시).\n' +
      '• 핵심 원리: AI는 역할 지시를 따르는 경향 → 명확한 페르소나 = 더 예측 가능한 응답.\n' +
      '• 시험 포인트: 페르소나 = "AI에게 역할 부여" / 시스템 프롬프트 vs 유저 프롬프트 차이.',
    pose: 'explaining',
    suggestions: ['페르소나 롤플레잉 심화가 궁금해요', 'RLHF가 뭔가요?', 'AI 윤리 문제는?'],
  },
  {
    id: 'iso-pe-17',
    title: 'Prompt Engineer 강17 — 페르소나·롤플레잉 ②',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 17강', '페르소나 롤플레잉', '롤플레잉 프롬프트', '역할극 AI',
      '페르소나 심화', '캐릭터 프롬프팅', '일관된 역할 유지', 'AI 롤플레이',
    ],
    answer:
      '📚 AI Prompt Engineer 강 17 — 페르소나·롤플레잉 ②\n\n' +
      '• 롤플레잉 패턴: "당신은 [역할]입니다. [상황]에서 [행동]해 주세요." 형식.\n' +
      '• 다중 페르소나 대화: 고객·상담원·전문가 등 여러 역할을 정의 → 시뮬레이션 시나리오 구현.\n' +
      '• 역할 일관성 유지: 대화가 길어질수록 역할 이탈 발생 → 주기적으로 시스템 프롬프트 재상기.\n' +
      '• 활용 사례: 고객 서비스 챗봇·인터뷰 연습·교육용 시뮬레이션·창작 스토리텔링.\n' +
      '• 주의사항: 역할에 과도히 몰입해 유해 콘텐츠 생성 유도는 AI 윤리 위반.\n' +
      '• 시험 포인트: 롤플레잉 프롬프트의 3요소 = 역할·상황·행동 지시.',
    pose: 'explaining',
    suggestions: ['RLHF가 뭔가요?', '딥페이크 윤리가 궁금해요', '프롬프트 설계 원리는?'],
  },
  {
    id: 'iso-pe-18',
    title: 'Prompt Engineer 강18 — RLHF',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 18강', 'RLHF', '인간 피드백 강화학습', 'SFT', '보상 모델', 'PPO',
      'InstructGPT', 'GPT 정렬', 'Human Feedback', 'AI 정렬',
    ],
    answer:
      '📚 AI Prompt Engineer 강 18 — RLHF\n\n' +
      '• RLHF(Reinforcement Learning from Human Feedback): 인간의 평가를 보상 신호로 LLM을 미세조정.\n' +
      '• 3단계 프로세스:\n' +
      '  ① SFT(지도 미세조정): 인간이 작성한 모범 답변으로 초기 학습.\n' +
      '  ② 보상 모델(RM) 훈련: 여러 응답 중 더 좋은 것을 사람이 선택 → 보상 모델 학습.\n' +
      '  ③ PPO(근위 정책 최적화): 보상 모델을 기준으로 LLM 강화학습.\n' +
      '• 의의: ChatGPT·Claude가 지시에 잘 따르고 유해 출력을 줄이는 핵심 기술.\n' +
      '• 시험 포인트: RLHF = "인간 피드백으로 LLM을 인간 의도에 정렬" / 3단계 순서 암기.',
    pose: 'explaining',
    suggestions: ['딥페이크와 AI 윤리가 궁금해요', 'AI 채용 시스템은 어떻게 활용되나요?', '프롬프트 설계 원리는?'],
  },
  {
    id: 'iso-pe-19',
    title: 'Prompt Engineer 강19 — 딥페이크와 AI 윤리',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 19강', '딥페이크', '딥페이크 원리', 'AI 윤리', '딥페이크 악용',
      '딥페이크 탐지', 'AI 윤리 문제', '허위 정보 AI', 'AI 규제',
    ],
    answer:
      '📚 AI Prompt Engineer 강 19 — 딥페이크와 AI 윤리\n\n' +
      '• 딥페이크 원리: GAN·Diffusion 모델로 실존 인물의 얼굴·음성·영상을 합성 — 구분이 어려울 수준.\n' +
      '• 장점: 영화 특수효과·VFX 비용 절감·가상 발표자 생성 등 긍정적 활용.\n' +
      '• 악용: 사기·포르노·허위 뉴스·정치적 조작 — 심각한 사회적 피해 발생.\n' +
      '• 탐지 기술: 눈 깜빡임 이상·픽셀 경계·메타데이터 분석으로 딥페이크 감별.\n' +
      '• AI 윤리 원칙: 공정성·투명성·책임성·프라이버시 보호·인간 감독.\n' +
      '• 시험 포인트: 딥페이크의 기술적 원리(GAN)와 법적·사회적 문제점 모두 출제 가능.',
    pose: 'expert-pointing',
    suggestions: ['AI 채용 시스템이 궁금해요', '프롬프트 설계 원리는?', 'AI 윤리·안전 실무가 궁금해요'],
  },
  {
    id: 'iso-pe-20',
    title: 'Prompt Engineer 강20 — AI 채용 시스템 활용',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 20강', 'AI 채용', 'AI 이력서 분석', 'ATS', '채용 AI', 'AI 채용 편향',
      'AI 면접', 'AI 채용 시스템', '알고리즘 채용',
    ],
    answer:
      '📚 AI Prompt Engineer 강 20 — AI 채용 시스템 활용\n\n' +
      '• ATS(Applicant Tracking System): AI로 이력서를 자동 분류·점수화 → 1차 스크리닝 자동화.\n' +
      '• AI 영상 면접: 표정·목소리·언어 패턴을 분석해 후보자 역량 평가 (HireVue 등).\n' +
      '• 올바른 훈련 방법: 다양한(편향 없는) 훈련 데이터 사용 + 주기적 공정성 감사 필수.\n' +
      '• 편향 문제: 과거 채용 데이터의 편향이 AI에 학습 → 특정 학교·성별·인종 차별 위험.\n' +
      '• 구직자 대응: ATS 친화적 키워드 포함 이력서 작성 / AI 영상 면접 환경 점검.\n' +
      '• 시험 포인트: AI 채용의 장점(효율성)과 위험(편향·불투명성) 모두 이해.',
    pose: 'explaining',
    suggestions: ['1차 필기 총정리가 궁금해요', '프롬프트 설계 원리는?', 'AI 윤리 문제는?'],
  },
  {
    id: 'iso-pe-21',
    title: 'Prompt Engineer 강21 — 1차 필기 총정리',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 21강', '1차 필기 총정리', 'AI Prompt Engineer 시험 총정리',
      '빈출 개념 정리', '시험 키워드', '필기 시험 준비', '총정리 강의',
    ],
    answer:
      '📚 AI Prompt Engineer 강 21 — 1차 필기 총정리\n\n' +
      '• 핵심 암기 항목:\n' +
      '  - AI 분류: AI > ML > DL / 지도·비지도·강화학습\n' +
      '  - 역사 이정표: 다트머스(1956)·튜링테스트·AlexNet(2012)·Transformer(2017)·ChatGPT(2022)\n' +
      '  - NLP: 기계번역·감정분석·NER·QA·STT·TTS\n' +
      '  - 어텐션: Q·K·V / 셀프어텐션 / 트랜스포머 구조\n' +
      '  - GPT 특징: 문맥 이해·할루시네이션·최신 정보 한계\n' +
      '  - RLHF: SFT → 보상 모델 → PPO 3단계\n' +
      '  - 딥페이크: GAN 기반·사회적 위험·탐지 방법\n' +
      '  - AGI: 아직 실현되지 않은 범용 AI\n' +
      '• 모의고사 전 최종 점검: 틀린 개념 빠르게 복습 후 강 22 모의고사 응시.',
    pose: 'expert-pointing',
    suggestions: ['1차 모의고사 응시는 어떻게 하나요?', '프롬프트 설계 원리는?', '심화 과정 내용이 궁금해요'],
  },
  {
    id: 'iso-pe-22',
    title: 'Prompt Engineer 강22 — 1차 모의고사 + 해설',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 22강', '1차 모의고사', '필기 모의고사', 'AI Prompt Engineer 시험 준비',
      '모의고사 해설', '1차 필기 대비', 'Prompt Engineer 기출',
    ],
    answer:
      '📚 AI Prompt Engineer 강 22 — 1차 모의고사 + 해설\n\n' +
      '• 1차 필기: 40문항 / 60점(24문항) 이상 합격 / 온라인 40분·오프라인 50분.\n' +
      '• 주요 출제 영역: AI 정의·분류·역사·NLP·강화학습·어텐션·GPT·프롬프팅·딥페이크·RLHF.\n' +
      '• 풀이 전략: 확실한 문항 먼저 → 불확실한 문항 표시 → 시간 남으면 재검토.\n' +
      '• 빈출 유형: 용어 정의·빈칸 채우기·짧은 서술 → 핵심 개념 암기 집중.\n' +
      '• 해설 활용법: 오답 원인을 강의 번호로 추적 → 해당 강의 재복습.\n' +
      '• 합격 후 2차 실기 준비: 프롬프트 설계 실습(강23~30) 집중.',
    pose: 'expert-pointing',
    suggestions: ['프롬프트 설계 원리가 궁금해요', '심화 과정에서 무엇을 배우나요?', '2차 실기 준비는?'],
  },
  {
    id: 'iso-pe-23',
    title: 'Prompt Engineer 강23 — 프롬프트 설계 원리',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 23강', '프롬프트 설계', '프롬프트 설계 원리', '프롬프트 4요소',
      '역할 맥락 예시 제약', '좋은 프롬프트', '프롬프트 작성법', '프롬프트 엔지니어링 기초',
    ],
    answer:
      '📚 AI Prompt Engineer 강 23 — 프롬프트 설계 원리\n\n' +
      '• 좋은 프롬프트 4요소: ① 역할(Role) ② 맥락(Context) ③ 예시(Examples) ④ 제약(Constraints).\n' +
      '• 역할(Role): AI에게 전문가 역할 부여 → "15년 경력 카피라이터로서…"\n' +
      '• 맥락(Context): 배경 정보 제공 → "제품은 친환경 운동화이고, 대상 고객은 MZ세대입니다."\n' +
      '• 예시(Examples): 원하는 출력 형식·스타일 샘플 제시 (Few-shot prompting).\n' +
      '• 제약(Constraints): 출력 형식·길이·제외 사항 명시 → "200자 이내로, 영어 단어 사용 금지."\n' +
      '• 나쁜 프롬프트 vs 좋은 프롬프트: "광고 써줘" vs "역할+맥락+예시+제약이 모두 포함된 프롬프트".\n' +
      '• 시험 포인트: 프롬프트 4요소 = 역할·맥락·예시·제약 / Few-shot 개념.',
    pose: 'explaining',
    suggestions: ['출력 제어와 체이닝이 궁금해요', '페르소나 심화가 뭔가요?', 'RAG가 뭔가요?'],
  },
  {
    id: 'iso-pe-24',
    title: 'Prompt Engineer 강24 — 구조화·출력 제어·체이닝',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 24강', '출력 제어', '프롬프트 체이닝', 'Chain-of-Thought', '단계적 사고',
      'JSON 출력', '구조화 출력', '프롬프트 연결', 'CoT', 'Step by Step',
    ],
    answer:
      '📚 AI Prompt Engineer 강 24 — 구조화·출력 제어·체이닝\n\n' +
      '• 출력 형식 지정: "JSON 형식으로 출력해 주세요" → 파싱 가능한 구조화 데이터 획득.\n' +
      '• Chain-of-Thought(CoT): "단계별로 생각해 보세요(Let\'s think step by step)" → 추론 품질 향상.\n' +
      '• 프롬프트 체이닝: 복잡한 과제를 여러 단계의 프롬프트로 분해 → 단계별 결과를 다음 프롬프트 입력으로 활용.\n' +
      '• 출력 길이 제어: "3줄 이내로" / "500토큰 이하로" 등 명시적 제약.\n' +
      '• Zero-shot vs Few-shot: 예시 없이 지시(Zero-shot) vs 예시 포함 지시(Few-shot).\n' +
      '• 시험 포인트: CoT = "단계별 사고" / 체이닝 = 복잡 과제 분해 / JSON 출력 = 구조화.',
    pose: 'explaining',
    suggestions: ['페르소나·시스템 프롬프트 심화가 궁금해요', 'RAG 개념이 궁금해요', '프롬프트 평가 방법은?'],
  },
  {
    id: 'iso-pe-25',
    title: 'Prompt Engineer 강25 — 페르소나·시스템 프롬프트 심화',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 25강', '시스템 프롬프트 심화', '페르소나 심화', '일관된 페르소나',
      'System Prompt', 'AI 챗봇 설계', '페르소나 운영', '프롬프트 구조 설계',
    ],
    answer:
      '📚 AI Prompt Engineer 강 25 — 페르소나·시스템 프롬프트 심화\n\n' +
      '• 시스템 프롬프트: API 호출 시 대화 전체에 적용되는 고정 지시문 — AI의 "기본 역할 규칙".\n' +
      '• 시스템 프롬프트 설계 원칙: ① 역할 명시 ② 행동 규칙 ③ 금지 사항 ④ 응답 형식 정의.\n' +
      '• 페르소나 일관성 유지: 긴 대화에서 "앞서 설정한 역할을 유지하세요" 재상기 필요.\n' +
      '• 다중 역할 페르소나: "당신은 법률가이자 비즈니스 컨설턴트입니다" → 두 관점 통합 응답.\n' +
      '• 실무 활용: 고객 서비스 봇·교육용 AI 튜터·코드 리뷰 어시스턴트 설계 시 필수.\n' +
      '• 시험 포인트: 시스템 프롬프트 = 대화 전체 규칙 설정 / 유저 프롬프트 = 개별 요청.',
    pose: 'explaining',
    suggestions: ['RAG 개념이 뭔가요?', '프롬프트 평가 방법은?', 'AI 윤리·안전이 궁금해요'],
  },
  {
    id: 'iso-pe-26',
    title: 'Prompt Engineer 강26 — 멀티모달·자료결합(RAG 개념)',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 26강', 'RAG', 'RAG 개념', 'Retrieval-Augmented Generation', '검색 증강 생성',
      '멀티모달 프롬프팅', '문서 결합 AI', '근거 기반 응답', 'RAG 원리', '할루시네이션 감소',
    ],
    answer:
      '📚 AI Prompt Engineer 강 26 — 멀티모달·자료결합(RAG 개념)\n\n' +
      '• RAG(Retrieval-Augmented Generation): 외부 문서를 검색(Retrieve)해 AI의 응답 생성(Generate)에 근거로 활용.\n' +
      '• 작동 원리: 질문 → 관련 문서 검색(벡터 DB 등) → 검색 결과를 컨텍스트로 LLM에 전달 → 근거 기반 답변.\n' +
      '• 장점: 할루시네이션 감소·최신 정보 반영·출처 명시 가능 — 순수 LLM의 한계 보완.\n' +
      '• 멀티모달 프롬프팅: 텍스트+이미지+문서를 함께 입력 → GPT-4V·Gemini 활용.\n' +
      '• 실무 적용: 사내 문서 기반 챗봇·법률 검토 AI·의료 참고 AI 등에 RAG 적용.\n' +
      '• 시험 포인트: RAG = "검색 + 생성" 결합 / 할루시네이션 감소 목적.',
    pose: 'explaining',
    suggestions: ['프롬프트 평가·개선 방법이 궁금해요', 'AI 윤리·안전이 뭔가요?', '캡스톤 프로젝트는?'],
  },
  {
    id: 'iso-pe-27',
    title: 'Prompt Engineer 강27 — 프롬프트 평가·반복 개선',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 27강', '프롬프트 평가', '프롬프트 개선', '반복 개선', '프롬프트 최적화',
      '프롬프트 품질 평가', 'Prompt Evaluation', '프롬프트 워크플로우',
    ],
    answer:
      '📚 AI Prompt Engineer 강 27 — 프롬프트 평가·반복 개선\n\n' +
      '• 평가 기준 정의: 정확성·완전성·형식 준수·간결성·유해성 부재 등 항목별 기준 명시.\n' +
      '• 평가 방법: 동일 프롬프트로 여러 번 실행 → 출력 일관성 체크 / 전문가 검토 / A/B 테스트.\n' +
      '• 반복 개선 워크플로우: ① 초기 프롬프트 작성 → ② 실행·평가 → ③ 문제 원인 분석 → ④ 프롬프트 수정 → 반복.\n' +
      '• 자동 평가 도구: LLM을 판사로 사용(GPT가 GPT 출력 평가) / evals 프레임워크.\n' +
      '• 문서화: 변경 이력·성능 변화·실패 사례 기록 → 체계적 프롬프트 관리.\n' +
      '• 시험 포인트: 프롬프트 개선 = 단순 시행착오가 아닌 "기준 정의 → 측정 → 개선" 체계.',
    pose: 'guiding',
    suggestions: ['AI 윤리·안전이 궁금해요', '캡스톤 프로젝트는 무엇인가요?', '2차 실기 준비법은?'],
  },
  {
    id: 'iso-pe-28',
    title: 'Prompt Engineer 강28 — AI 윤리·안전 실무',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 28강', 'AI 윤리 실무', '할루시네이션 대응', 'AI 편향', '개인정보 AI',
      'AI 안전', 'Prompt Injection', '딥페이크 대응', 'AI 리스크 관리',
    ],
    answer:
      '📚 AI Prompt Engineer 강 28 — AI 윤리·안전 실무\n\n' +
      '• 할루시네이션(Hallucination): AI가 사실이 아닌 내용을 자신 있게 생성 → RAG·검색 결합·사실 검증 필수.\n' +
      '• AI 편향: 훈련 데이터 편향 → 특정 그룹 차별적 출력 → 다양한 데이터·공정성 감사 필요.\n' +
      '• 개인정보 보호: 프롬프트에 실명·주민번호·의료 정보 입력 금지 → 비식별화 후 사용.\n' +
      '• 프롬프트 인젝션(Prompt Injection): 사용자 입력에 숨겨진 명령으로 AI 시스템 조작 → 입력 검증 필수.\n' +
      '• 딥페이크 대응: AI 생성물 표시·탐지 도구 사용·생성 AI 이용 약관 준수.\n' +
      '• 시험 포인트: 실무에서 마주치는 4대 AI 위험 = 할루시네이션·편향·개인정보·프롬프트 인젝션.',
    pose: 'expert-pointing',
    suggestions: ['캡스톤 프로젝트는 무엇인가요?', '2차 실기 준비법이 궁금해요', '자격증 취득 절차는?'],
  },
  {
    id: 'iso-pe-29',
    title: 'Prompt Engineer 강29 — 캡스톤: 업무용 프롬프트 설계',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 29강', '캡스톤', '업무용 프롬프트', '프롬프트 세트 설계', '캡스톤 프로젝트',
      'AI 봇 설계', '실무 프롬프트', '캡스톤 최종 과제', '프롬프트 포트폴리오',
    ],
    answer:
      '📚 AI Prompt Engineer 강 29 — 캡스톤: 업무용 프롬프트 설계\n\n' +
      '• 캡스톤 목표: 실제 업무 시나리오에 적용 가능한 프롬프트 세트 또는 AI 봇을 설계·제출.\n' +
      '• 시나리오 예시: 고객 상담 봇·코드 리뷰 어시스턴트·마케팅 문안 생성기·데이터 분석 프롬프트.\n' +
      '• 제출 구성: ① 시나리오 기획서 ② 시스템 프롬프트 ③ 사용자 프롬프트 예시 ④ 출력 평가 기준.\n' +
      '• 평가 기준: 실무 적용 가능성·창의성·4요소 활용(역할·맥락·예시·제약)·윤리 고려.\n' +
      '• 팁: 단순 "질문→답변"이 아닌 체이닝·RAG 개념을 활용한 멀티스텝 프롬프트 설계 권장.',
    pose: 'guiding',
    suggestions: ['2차 실기 모의 시험 준비가 궁금해요', '자격증 합격 기준이 어떻게 되나요?'],
  },
  {
    id: 'iso-pe-30',
    title: 'Prompt Engineer 강30 — 2차 실기 모의 + 리뷰',
    category: 'course-prompt-engineer',
    keywords: [
      'Prompt Engineer 30강', '2차 실기', '2차 실기 모의', '주관식 시험', '실기 제출',
      'AI Prompt Engineer 2차', '실기 준비', '최종 리뷰', '시험 합격',
    ],
    answer:
      '📚 AI Prompt Engineer 강 30 — 2차 실기 모의 + 리뷰\n\n' +
      '• 2차 실기 구성: 주관식(온라인 20문항·40분) + 실기 과제 제출(당일 감독관 지시).\n' +
      '• 주관식 합격 기준: 60점(12문항) 이상 / 실기는 완성도·의도 파악으로 평가.\n' +
      '• 1차 합격 유지: 2차 불합격 시 1차 합격일로부터 1년간 1회 필기 면제.\n' +
      '• 모의 후 리뷰 포인트: 주관식 오답 분석 → 강 13-18(어텐션·GPT·프롬프팅·RLHF) 집중 재복습.\n' +
      '• 최종 점검: 프롬프트 4요소·CoT·RAG·시스템 프롬프트·AI 윤리·RLHF 3단계 암기 확인.\n' +
      '• 자격증 수령: 합격 후 15~30일 내 발급 — iqcsplus.com에서 자격 조회 가능.',
    pose: 'cheer',
    suggestions: ['자격증 발급은 어떻게 되나요?', '자격증 유효기간이 얼마나 되나요?', '다음 과정은 무엇인가요?'],
  },
];
