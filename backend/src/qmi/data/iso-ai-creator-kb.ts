import type { QmiKbEntry } from './knowledge-base';

/**
 * AI Creator 과정(ISO/IEC 17024) 30강 학습도우미 지식베이스.
 * 각 강의의 핵심 개념·시험 포인트를 chatbot RAG 엔트리로 제공한다.
 */
export const ISO_AI_CREATOR_KB: QmiKbEntry[] = [
  {
    id: 'iso-ac-01',
    title: 'AI Creator 강01 — OT & 생성형 AI 큰 그림',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 1강', 'AI Creator OT', '생성형 AI 큰 그림', 'AI Creator 과정 안내',
      'Pre-test', '프리테스트 대비', '생성형 AI란', 'AI Creator 소개',
    ],
    answer:
      '📚 AI Creator 강 01 — OT & 생성형 콘텐츠 AI 큰 그림\n\n' +
      '• 이 과정은 ISO/IEC 17024 AI Creator 자격증 대비 30강입니다.\n' +
      '• 생성형 AI(Generative AI)는 텍스트·이미지·음악·영상·3D 콘텐츠를 스스로 생성하는 AI입니다.\n' +
      '• 핵심 모델: GAN(이미지 생성), Diffusion(이미지/영상), Transformer(텍스트·음악).\n' +
      '• Pre-test(O/X): 10문항 중 6문항(60점) 이상 통과 필수 — 시간 제한 없음.\n' +
      '• 학습 로드맵: 기본 과정(강1-22) 딥러닝·GAN·NST·음악·VR → 심화 과정(강23-30) 실습·윤리·캡스톤.',
    pose: 'presenting',
    suggestions: ['딥러닝이 뭐예요?', '시험 구조가 어떻게 되나요?', 'GANs가 뭐예요?'],
  },
  {
    id: 'iso-ac-02',
    title: 'AI Creator 강02 — 딥러닝의 이해',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 2강', '딥러닝이란', '딥러닝 이해', '머신러닝 딥러닝 차이',
      '자동 특징 추출', '딥러닝 정의', 'AlexNet', '딥러닝이 강한 이유',
    ],
    answer:
      '📚 AI Creator 강 02 — 딥러닝의 이해\n\n' +
      '• 딥러닝은 머신러닝의 한 분야로, 사람이 특징을 설계하지 않아도 데이터에서 자동으로 학습합니다.\n' +
      '• 계층적 특징 추출: 픽셀 → 선 → 면 → 형태 순으로 추상화.\n' +
      '• 머신러닝 vs 딥러닝: 머신러닝은 사람이 특징 설계 / 딥러닝은 자동 특징 추출.\n' +
      '• AlexNet(2012)이 딥러닝 부흥의 출발점 — 대규모 데이터·GPU가 핵심.\n' +
      '• 시험 포인트: "딥러닝 = 머신러닝의 부분집합", "자동 특징 추출"이 핵심 차별점.',
    pose: 'explaining',
    suggestions: ['신경망 구조가 궁금해요', '딥러닝 학습 원리는?', 'CNN이 뭔가요?'],
  },
  {
    id: 'iso-ac-03',
    title: 'AI Creator 강03 — 인공 신경망의 기본 구조',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 3강', '인공 신경망', '퍼셉트론', '가중치', '바이어스', '활성화 함수',
      '뉴런', '신경망 구조', '입력층 은닉층 출력층',
    ],
    answer:
      '📚 AI Creator 강 03 — 인공 신경망의 기본 구조\n\n' +
      '• 뉴런(퍼셉트론): 입력값 × 가중치(w) + 바이어스(b) → 활성화 함수 → 출력.\n' +
      '• 층(Layer) 구성: 입력층 → 은닉층(1개 이상) → 출력층.\n' +
      '• 활성화 함수: ReLU(주로 은닉층), Sigmoid(이진 분류), Softmax(다중 분류).\n' +
      '• 가중치(w)와 바이어스(b)는 학습을 통해 조정되는 파라미터.\n' +
      '• 시험 포인트: 활성화 함수의 역할 = 비선형성 부여 → 복잡한 패턴 학습 가능.',
    pose: 'explaining',
    suggestions: ['딥러닝 학습 원리가 궁금해요', 'ReLU가 뭐예요?', 'CNN은 어떻게 구성되나요?'],
  },
  {
    id: 'iso-ac-04',
    title: 'AI Creator 강04 — 딥러닝의 학습 원리',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 4강', '손실함수', '경사하강법', '오차역전파', '학습률',
      '딥러닝 학습', '역전파', 'Backpropagation', 'Gradient Descent',
    ],
    answer:
      '📚 AI Creator 강 04 — 딥러닝의 학습 원리\n\n' +
      '• 손실함수(Loss Function): 예측값과 실제값의 차이를 수치화 (예: MSE, Cross-Entropy).\n' +
      '• 경사하강법(Gradient Descent): 손실이 가장 작아지는 방향으로 가중치를 조금씩 업데이트.\n' +
      '• 오차역전파(Backpropagation): 출력에서 입력 방향으로 오류를 전파해 각 가중치 갱신.\n' +
      '• 학습률(Learning Rate): 한 번에 얼마나 크게 업데이트할지 결정하는 하이퍼파라미터.\n' +
      '• 시험 포인트: 학습 = "손실 최소화" 과정 / 역전파 = 미분의 연쇄법칙(Chain Rule) 적용.',
    pose: 'explaining',
    suggestions: ['CNN이 뭔가요?', 'RNN과 LSTM의 차이는?', 'GAN이 궁금해요'],
  },
  {
    id: 'iso-ac-05',
    title: 'AI Creator 강05 — CNN (합성곱 신경망)',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 5강', 'CNN', '합성곱 신경망', '합성곱', '풀링', '특징맵',
      'Convolutional Neural Network', '필터', '컨볼루션',
    ],
    answer:
      '📚 AI Creator 강 05 — CNN (합성곱 신경망)\n\n' +
      '• CNN은 이미지 처리에 특화된 딥러닝 구조 — 시각 패턴 인식의 핵심.\n' +
      '• 합성곱(Convolution): 필터(커널)가 이미지를 슬라이딩하며 특징맵(Feature Map) 생성.\n' +
      '• 활성화(ReLU): 비선형성 도입.\n' +
      '• 풀링(Pooling): 특징맵 크기를 줄여 연산량 감소 + 위치 불변성 확보 (Max Pooling이 일반적).\n' +
      '• 구조: [Conv → ReLU → Pooling] × N → Fully Connected Layer → 출력.\n' +
      '• 시험 포인트: CNN = 이미지 분류·객체 탐지에 필수, 필터가 특징을 자동 학습.',
    pose: 'explaining',
    suggestions: ['RNN과 LSTM은 어떻게 달라요?', 'GANs가 뭐예요?', '딥러닝 윤리 문제는?'],
  },
  {
    id: 'iso-ac-06',
    title: 'AI Creator 강06 — RNN·LSTM (순차 데이터)',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 6강', 'RNN', 'LSTM', '순차 데이터', '은닉 상태', '장기 의존성',
      'Recurrent Neural Network', '시계열', '기울기 소실',
    ],
    answer:
      '📚 AI Creator 강 06 — RNN·LSTM (순차 데이터)\n\n' +
      '• RNN(Recurrent Neural Network): 순서가 있는 데이터(텍스트·음성·시계열) 처리에 특화.\n' +
      '• 은닉 상태(Hidden State): 이전 시점의 정보를 현재로 전달 — 메모리 역할.\n' +
      '• RNN의 한계: 긴 시퀀스에서 기울기 소실(Vanishing Gradient) 문제 발생.\n' +
      '• LSTM(Long Short-Term Memory): 게이트(입력·망각·출력)로 장기 의존성 문제 해결.\n' +
      '• 시험 포인트: RNN = 순차적 처리 / LSTM = 장기 기억 유지 / 둘 다 AI 음악·텍스트 생성에 활용.',
    pose: 'explaining',
    suggestions: ['딥러닝 윤리 문제는 무엇인가요?', 'GANs가 뭐예요?', 'AI 음악은 어떻게 만드나요?'],
  },
  {
    id: 'iso-ac-07',
    title: 'AI Creator 강07 — 딥러닝의 응용과 윤리',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 7강', '딥러닝 응용', '딥러닝 윤리', '블랙박스', '편향', '프라이버시',
      'AI 윤리', '딥러닝 문제점', 'AI 투명성',
    ],
    answer:
      '📚 AI Creator 강 07 — 딥러닝의 응용과 윤리\n\n' +
      '• 주요 응용: 이미지 인식·자율주행·의료 진단·자연어 처리·생성형 콘텐츠 제작.\n' +
      '• 블랙박스(Black Box) 문제: 딥러닝의 의사결정 과정이 불투명해 설명하기 어려움.\n' +
      '• 편향(Bias) 문제: 훈련 데이터의 편향이 모델 출력에 그대로 반영됨.\n' +
      '• 프라이버시: 학습 데이터에 개인정보가 포함될 수 있는 문제.\n' +
      '• 시험 포인트: 딥러닝 3대 윤리 이슈 = "투명성(블랙박스)·공정성(편향)·프라이버시".',
    pose: 'expert-pointing',
    suggestions: ['GANs란 무엇인가요?', 'NST가 뭐예요?', 'AI 생성물 저작권은 어떻게 되나요?'],
  },
  {
    id: 'iso-ac-08',
    title: 'AI Creator 강08 — GANs 핵심 개념 ①',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 8강', 'GAN', 'GANs', '생성적 적대 신경망', '생성자', '판별자',
      'Generator', 'Discriminator', '굿펠로우', '이안 굿펠로우',
    ],
    answer:
      '📚 AI Creator 강 08 — GANs 핵심 개념 ①\n\n' +
      '• GAN(Generative Adversarial Network): 2014년 이안 굿펠로우(Ian Goodfellow)가 제안.\n' +
      '• 구성: 생성자(Generator) + 판별자(Discriminator) 두 신경망이 서로 경쟁.\n' +
      '• 생성자(G): 가짜 데이터를 만들어 판별자를 속이려 함.\n' +
      '• 판별자(D): 진짜 데이터와 가짜 데이터를 구분하려 함.\n' +
      '• 두 모델이 경쟁하며 생성자의 출력 품질이 점점 향상됨.\n' +
      '• 시험 포인트: GAN = "생성자 vs 판별자의 적대적 학습", 2014 굿펠로우 제안.',
    pose: 'explaining',
    suggestions: ['GAN이 어떻게 작동하나요?', 'GAN의 한계는 무엇인가요?', 'GAN은 어디에 쓰이나요?'],
  },
  {
    id: 'iso-ac-09',
    title: 'AI Creator 강09 — GANs 작동 방식 ②',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 9강', 'GAN 작동 원리', '미니맥스 게임', '내쉬 균형', 'GAN 학습 과정',
      'minimax', 'Nash Equilibrium', 'GAN 훈련',
    ],
    answer:
      '📚 AI Creator 강 09 — GANs 작동 방식 ②\n\n' +
      '• 미니맥스 게임(Minimax Game): G는 D의 오류를 최대화, D는 오류를 최소화 — 서로 상반된 목표.\n' +
      '• 학습 과정: ① D를 고정하고 G 업데이트 → ② G를 고정하고 D 업데이트 → 반복.\n' +
      '• 내쉬 균형(Nash Equilibrium): D가 진짜/가짜를 50:50으로만 구분할 수 있는 지점 = 이상적 수렴.\n' +
      '• 훈련 안정성 문제: G와 D의 학습 속도 균형이 중요 — 한쪽이 너무 강해지면 학습 붕괴.\n' +
      '• 시험 포인트: GAN 목표 = "G가 D를 완벽히 속이는 수준까지 학습".',
    pose: 'explaining',
    suggestions: ['GAN의 한계가 뭐예요?', 'StyleGAN이 뭔가요?', 'GAN은 어떤 데 쓰이나요?'],
  },
  {
    id: 'iso-ac-10',
    title: 'AI Creator 강10 — GANs 한계와 발전',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 10강', 'GAN 한계', '모드 붕괴', 'DCGAN', 'WGAN', 'StyleGAN',
      '모델 붕괴', 'mode collapse', 'GAN 발전',
    ],
    answer:
      '📚 AI Creator 강 10 — GANs 한계와 발전\n\n' +
      '• 모드 붕괴(Mode Collapse): G가 다양성 없이 비슷한 샘플만 생성하는 현상.\n' +
      '• 훈련 불안정: G와 D의 균형 유지가 어렵고 학습이 발산하기 쉬움.\n' +
      '• DCGAN: 합성곱 신경망을 GAN에 도입 → 고품질 이미지 생성 가능.\n' +
      '• WGAN: Wasserstein 거리를 사용해 학습 안정성 크게 개선.\n' +
      '• StyleGAN: 스타일 벡터로 얼굴 특징(나이·표정·헤어스타일)을 세밀하게 제어 가능.\n' +
      '• 시험 포인트: 모드 붕괴 = GAN 대표적 문제 / StyleGAN = 고품질 얼굴 생성 모델.',
    pose: 'explaining',
    suggestions: ['GAN은 어떤 곳에 응용되나요?', 'GAN의 윤리 문제는?', 'NST가 뭔가요?'],
  },
  {
    id: 'iso-ac-11',
    title: 'AI Creator 강11 — GANs의 응용',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 11강', 'GAN 응용', '합성 데이터', '가상 인물', '신소재 개발',
      'GAN 활용', '이미지 생성 응용', 'DeepFake 기술',
    ],
    answer:
      '📚 AI Creator 강 11 — GANs의 응용\n\n' +
      '• 합성 데이터 생성: 의료·자율주행 분야에서 실제 데이터 부족 문제 해결.\n' +
      '• 가상 인물·버추얼 인플루언서: StyleGAN으로 존재하지 않는 사람의 얼굴 생성.\n' +
      '• 이미지 변환(pix2pix): 스케치 → 실제 이미지, 흑백 → 컬러화.\n' +
      '• 신소재·신약 개발: 분자 구조 생성·예측에 GAN 활용.\n' +
      '• 게임·엔터테인먼트: 배경·캐릭터·텍스처 자동 생성.\n' +
      '• 시험 포인트: GAN 응용의 핵심은 "새로운 데이터(이미지·분자 등)를 학습 분포에서 생성".',
    pose: 'explaining',
    suggestions: ['GAN의 윤리 문제는 무엇인가요?', 'NST란 무엇인가요?', 'AI 이미지 저작권은?'],
  },
  {
    id: 'iso-ac-12',
    title: 'AI Creator 강12 — GANs의 윤리',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 12강', 'GAN 윤리', '딥페이크', '정보 조작', '데이터 편향',
      'deepfake 문제', 'AI 생성 이미지 윤리', '허위 정보', 'GAN 악용',
    ],
    answer:
      '📚 AI Creator 강 12 — GANs의 윤리\n\n' +
      '• 딥페이크(Deepfake): GAN으로 실존 인물의 얼굴·음성을 합성 — 허위 정보·사기에 악용 위험.\n' +
      '• 정보 조작: 가짜 뉴스 이미지·영상 생성으로 사회적 혼란 유발 가능.\n' +
      '• 데이터 편향: 편향된 학습 데이터 → 편향된 생성 결과 (특정 집단 고정관념 강화).\n' +
      '• 초상권·저작권: AI 생성물의 법적 귀속 문제가 아직 명확히 정립되지 않음.\n' +
      '• 대응: 딥페이크 탐지 기술·워터마크·AI 생성물 표시 의무화.\n' +
      '• 시험 포인트: GAN의 가장 심각한 윤리 문제 = "딥페이크를 통한 허위 정보 생산".',
    pose: 'expert-pointing',
    suggestions: ['NST가 뭔가요?', 'AI 음악 저작권은 어떻게 되나요?', '저작권 실무가 궁금해요'],
  },
  {
    id: 'iso-ac-13',
    title: 'AI Creator 강13 — 신경망 스타일 전이(NST) ①',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 13강', 'NST', '신경망 스타일 전이', '스타일 전이', '내용 이미지', '스타일 이미지',
      'Neural Style Transfer', '이미지 스타일 변환',
    ],
    answer:
      '📚 AI Creator 강 13 — 신경망 스타일 전이(NST) ①\n\n' +
      '• NST(Neural Style Transfer): 한 이미지의 내용(콘텐츠)에 다른 이미지의 화풍(스타일)을 합성.\n' +
      '• 내용 이미지(Content Image): 구조·물체 배치 등 "무엇을" 담을지 결정.\n' +
      '• 스타일 이미지(Style Image): 붓터치·색감·질감 등 "어떻게" 표현할지 결정.\n' +
      '• 2015년 Gatys et al.이 CNN을 이용해 최초로 구현 (VGG 네트워크 활용).\n' +
      '• 결과: 사진 + 반 고흐 그림 → 반 고흐 화풍의 사진 생성.\n' +
      '• 시험 포인트: NST = "내용 보존 + 스타일 이전"의 최적화 문제.',
    pose: 'explaining',
    suggestions: ['NST가 CNN과 어떤 관계인가요?', 'NST의 손실 함수는?', 'NST는 어디에 활용되나요?'],
  },
  {
    id: 'iso-ac-14',
    title: 'AI Creator 강14 — NST ② CNN과 그람 행렬',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 14강', 'NST CNN', '그람 행렬', 'Gram Matrix', '특징맵 스타일',
      'NST 원리', '스타일 표현', 'VGG 특징',
    ],
    answer:
      '📚 AI Creator 강 14 — NST ② CNN과 그람 행렬\n\n' +
      '• CNN의 계층적 특징: 얕은 층 = 엣지·색상, 깊은 층 = 형태·의미.\n' +
      '• 내용 표현: 깊은 층의 특징맵으로 이미지의 "구조"를 캡처.\n' +
      '• 스타일 표현: 그람 행렬(Gram Matrix) = 특징맵 간의 상관관계 → 붓터치·질감 표현.\n' +
      '• 그람 행렬 계산: 특징맵 F를 펼쳐서 F × Fᵀ 계산 → 채널 간 상관 행렬.\n' +
      '• 시험 포인트: 스타일 = "그람 행렬"로 수치화 / 내용 = "깊은 층 활성화"로 수치화.',
    pose: 'explaining',
    suggestions: ['NST의 손실 함수가 궁금해요', 'NST 활용 사례는?', 'AI 이미지 생성 실습하고 싶어요'],
  },
  {
    id: 'iso-ac-15',
    title: 'AI Creator 강15 — NST ③ 3대 손실과 최적화',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 15강', 'NST 손실함수', '내용 손실', '스타일 손실', '총변동 손실',
      'Content Loss', 'Style Loss', 'Total Variation Loss', 'NST 최적화',
    ],
    answer:
      '📚 AI Creator 강 15 — NST ③ 3대 손실과 최적화\n\n' +
      '• 내용 손실(Content Loss): 생성 이미지의 특징맵 vs 내용 이미지의 특징맵 차이 (MSE).\n' +
      '• 스타일 손실(Style Loss): 생성 이미지의 그람 행렬 vs 스타일 이미지의 그람 행렬 차이.\n' +
      '• 총변동 손실(Total Variation Loss): 이웃 픽셀 차이 최소화 → 이미지 부드럽게 만들기.\n' +
      '• 전체 손실 = α × 내용 손실 + β × 스타일 손실 + γ × 총변동 손실 (가중치 조절).\n' +
      '• 최적화 대상: 가중치가 아닌 출력 이미지 픽셀값을 직접 최적화 (L-BFGS 등 사용).\n' +
      '• 시험 포인트: NST는 "모델 가중치"가 아닌 "이미지 픽셀"을 최적화.',
    pose: 'explaining',
    suggestions: ['NST 활용 사례는 어떤 것이 있나요?', 'AI 이미지 생성 실습이 궁금해요'],
  },
  {
    id: 'iso-ac-16',
    title: 'AI Creator 강16 — NST 활용 사례',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 16강', 'NST 활용', 'Prisma 앱', 'Text-to-Image', 'NST 상업 활용',
      '스타일 전이 사례', 'AI 아트', 'NST 예술',
    ],
    answer:
      '📚 AI Creator 강 16 — NST 활용 사례\n\n' +
      '• Prisma 앱: 사진에 유명 화가의 화풍을 즉시 적용하는 모바일 앱.\n' +
      '• AI 아트·예술 창작: 반 고흐·모네 화풍 재현, AI 갤러리 작품 제작.\n' +
      '• 광고·게임: 브랜드 비주얼 일관성 유지, 게임 캐릭터 텍스처 생성.\n' +
      '• Text-to-Image(Stable Diffusion·DALL-E): 텍스트 프롬프트로 특정 화풍 이미지 생성 (NST 개념 확장).\n' +
      '• 영상 스타일 전이: 영화·애니메이션 전체 프레임에 일관된 스타일 적용.\n' +
      '• 시험 포인트: NST의 상업적 한계 = "속도 느림(반복 최적화)" → 실시간 적용에 Fast NST 등장.',
    pose: 'guiding',
    suggestions: ['AI 음악을 어떻게 만드나요?', '이미지 생성 실습이 궁금해요', 'AI VR이 뭔가요?'],
  },
  {
    id: 'iso-ac-17',
    title: 'AI Creator 강17 — AI 음악 ① 작곡·멜로디 생성',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 17강', 'AI 음악', 'AI 작곡', '멜로디 생성', 'RNN 음악', 'LSTM 음악',
      'Transformer 음악', 'GAN 음악', 'VAE 음악', 'AI 작곡 원리',
    ],
    answer:
      '📚 AI Creator 강 17 — AI 음악 ① 작곡·멜로디 생성\n\n' +
      '• AI 음악 생성 모델: RNN/LSTM(순차 멜로디), Transformer(장거리 음악 구조), GAN(다양한 스타일), VAE(잠재 공간 탐색).\n' +
      '• 데이터 유형: MIDI 파일(음정·박자 기호) 또는 오디오 파형(Raw Waveform).\n' +
      '• 학습 방식: 대량의 기존 음악 데이터로 다음 음표를 예측하도록 학습.\n' +
      '• Google Magenta: 오픈소스 AI 음악 프로젝트 (RNN 기반 멜로디 생성).\n' +
      '• 시험 포인트: AI 음악 생성에는 RNN·Transformer·GAN이 모두 활용되며, 각각 장단점이 다름.',
    pose: 'explaining',
    suggestions: ['심볼릭 vs 오디오 방식이 뭔가요?', 'AI 음악 플랫폼은 어떤 게 있나요?', 'AI VR은 뭔가요?'],
  },
  {
    id: 'iso-ac-18',
    title: 'AI Creator 강18 — AI 음악 ② 심볼릭 vs 오디오',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 18강', '심볼릭 음악', '오디오 생성', 'MIDI', 'Waveform', '심볼릭 vs 오디오',
      'WaveNet', 'raw audio', 'AI 음악 방식',
    ],
    answer:
      '📚 AI Creator 강 18 — AI 음악 ② 심볼릭 vs 오디오\n\n' +
      '• 심볼릭(Symbolic) 방식: MIDI 형태의 음정·박자 기호를 학습 → 음악 이론 반영 용이, 용량 작음.\n' +
      '• 오디오(Audio) 방식: 실제 음파(Waveform)를 직접 학습 → 더 현실적 음색, 계산량 큼.\n' +
      '• WaveNet(Google): 오디오 방식의 대표 모델 — 샘플 단위로 파형 생성, TTS에 활용.\n' +
      '• Jukebox(OpenAI): 원시 오디오에서 특정 아티스트 스타일 음악 생성.\n' +
      '• 시험 포인트: 심볼릭 = MIDI(기호), 오디오 = Waveform(파형) — 둘의 장단점 비교 출제.',
    pose: 'explaining',
    suggestions: ['AI 음악 플랫폼은 어떤 게 있나요?', 'AI 음악 저작권 문제는?', 'AI VR은 뭔가요?'],
  },
  {
    id: 'iso-ac-19',
    title: 'AI Creator 강19 — AI 음악 플랫폼·윤리',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 19강', 'AIVA', 'Suno', 'Soundraw', 'AI 음악 플랫폼', 'AI 음악 저작권',
      'AI 음악 윤리', 'AI 작곡 서비스', 'Mubert', 'Udio',
    ],
    answer:
      '📚 AI Creator 강 19 — AI 음악 플랫폼·윤리\n\n' +
      '• AIVA: 클래식·영화음악 스타일 작곡 AI — 룩셈부르크 기반, 상업적 저작권 제공.\n' +
      '• Suno: 텍스트 프롬프트로 가사+멜로디 완성 음악 생성.\n' +
      '• Soundraw: 장르·분위기·BPM 설정으로 커스텀 배경음악 생성.\n' +
      '• AI 음악 저작권: AI 생성 음악의 저작권 귀속이 아직 법적으로 불명확 (학습 데이터 원저작자 문제).\n' +
      '• 윤리 이슈: 학습 데이터로 사용된 아티스트의 동의 없는 스타일 모방 문제.\n' +
      '• 시험 포인트: 주요 AI 음악 플랫폼 3개와 저작권·동의 없는 스타일 학습 윤리 이슈.',
    pose: 'expert-pointing',
    suggestions: ['AI VR이 뭔가요?', 'AI와 메타버스는 어떤 관계인가요?', '이미지 생성 실습하고 싶어요'],
  },
  {
    id: 'iso-ac-20',
    title: 'AI Creator 강20 — AI와 VR·미디어 혁신',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 20강', 'AI VR', '버추얼 프로덕션', 'Sora', 'AI 영상 생성', 'AI 미디어',
      'Virtual Production', 'AI 자동화 미디어', '텍스트 영상 변환',
    ],
    answer:
      '📚 AI Creator 강 20 — AI와 VR·미디어 혁신\n\n' +
      '• 버추얼 프로덕션(Virtual Production): LED 월 + 실시간 3D 엔진으로 촬영 현장 자체를 AI가 보조.\n' +
      '• AI 영상 생성(Sora·Runway): 텍스트 설명만으로 고품질 영상 클립 자동 생성.\n' +
      '• 콘텐츠 자동화: AI가 뉴스 브리핑·스포츠 하이라이트·제품 광고 영상을 자동 제작.\n' +
      '• 딥페이크 영상: GAN 기반 얼굴 합성이 영화·광고에서 악용 가능 → 표시 의무 논의.\n' +
      '• 시험 포인트: Sora = OpenAI의 텍스트→영상 모델 / 버추얼 프로덕션 = 영화·방송 산업 변화.',
    pose: 'presenting',
    suggestions: ['메타버스와 AI 3D는 어떤 관계인가요?', 'AI 영상 제작 실습하고 싶어요'],
  },
  {
    id: 'iso-ac-21',
    title: 'AI Creator 강21 — 메타버스·AI 3D 환경 생성',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 21강', '메타버스', 'AI 3D 생성', '메타버스 7요소', '3D 에셋 생성',
      '얼굴 생성', '음성 합성', '동작 생성', 'AI 아바타', '메타버스 AI',
    ],
    answer:
      '📚 AI Creator 강 21 — 메타버스·AI 3D 환경 생성\n\n' +
      '• 메타버스 7요소: 영속성·동시성·상호운용성·경제성·몰입감·공간성·자아 표현.\n' +
      '• AI 3D 에셋 생성: 텍스트/이미지 입력 → 3D 메쉬·텍스처 자동 생성 (Shap-E·DreamFusion).\n' +
      '• AI 얼굴 생성: GAN/Diffusion으로 아바타 얼굴·표정 자동 생성.\n' +
      '• AI 음성 합성: TTS로 아바타에 맞춤 음성 부여 (ElevenLabs 등).\n' +
      '• AI 동작 생성(Motion Capture 대체): 텍스트 설명 → 3D 캐릭터 애니메이션.\n' +
      '• 시험 포인트: AI가 메타버스 3대 생성 요소(3D·얼굴·음성·동작) 전반에 활용됨.',
    pose: 'presenting',
    suggestions: ['1차 모의고사 준비는 어떻게 하나요?', '이미지 생성 실습하고 싶어요', 'AI 영상 만들기'],
  },
  {
    id: 'iso-ac-22',
    title: 'AI Creator 강22 — 1차 모의고사 + 해설',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 22강', '1차 모의고사', '1차 필기 모의', 'AI Creator 시험 준비',
      '모의고사 해설', '1차 필기 대비', 'AI Creator 기출', '시험 유형',
    ],
    answer:
      '📚 AI Creator 강 22 — 1차 모의고사 + 해설\n\n' +
      '• 1차 필기: 40문항 / 60점(24문항) 이상 합격 / 온라인 40분·오프라인 50분.\n' +
      '• 주요 출제 영역: 딥러닝·CNN·RNN·GANs·NST·AI 음악·VR·메타버스·윤리.\n' +
      '• 모의고사 풀이 전략: 모르는 문항 표시 → 후반에 재검토 → 시간 분배 연습.\n' +
      '• 빈출 유형: O/X 판별, 빈칸 채우기(용어), 모델명-기능 매칭, 윤리 이슈 서술.\n' +
      '• 핵심 암기: GAN 제안자(굿펠로우·2014), NST 3대 손실, LSTM vs RNN, 메타버스 7요소.\n' +
      '• 해설 강의를 통해 오답 원인 분석 후 약점 단원 집중 복습 권장.',
    pose: 'expert-pointing',
    suggestions: ['이미지 생성 실습하고 싶어요', '심화 과정은 무엇인가요?', 'AI 음악 만들기 실습'],
  },
  {
    id: 'iso-ac-23',
    title: 'AI Creator 강23 — 이미지 생성 실습',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 23강', '이미지 생성 실습', 'Midjourney', 'Stable Diffusion', 'DALL-E',
      '텍스트 이미지 변환', '프롬프트 이미지', 'AI 이미지 만들기', '이미지 생성 도구',
    ],
    answer:
      '📚 AI Creator 강 23 — 이미지 생성 실습\n\n' +
      '• 주요 도구: Midjourney·Stable Diffusion·DALL-E 3·Adobe Firefly.\n' +
      '• 텍스트→이미지 흐름: 프롬프트 작성 → 모델 선택 → 파라미터 설정 → 생성·반복 개선.\n' +
      '• 좋은 프롬프트 구성: [주제] + [스타일] + [색감/분위기] + [기술 파라미터] (해상도·비율).\n' +
      '• 반복 개선(Iteration): 초기 결과물 → 프롬프트 수정 → 재생성 → 최적화.\n' +
      '• 시험 포인트(2차 실기): 프롬프트 설계 과정과 결과물 제출 — 의도와 완성도 평가.',
    pose: 'guiding',
    suggestions: ['스타일 전이 실습이 궁금해요', 'AI 영상 만들기는?', '이미지 저작권 문제는?'],
  },
  {
    id: 'iso-ac-24',
    title: 'AI Creator 강24 — 스타일 전이·이미지 편집 실습',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 24강', '스타일 전이 실습', '이미지 편집 실습', '인페인팅', '업스케일',
      'Inpainting', 'Upscaling', 'AI 이미지 편집', '배경 제거', '이미지 보정',
    ],
    answer:
      '📚 AI Creator 강 24 — 스타일 전이·이미지 편집 실습\n\n' +
      '• 스타일 전이 실습: 내 사진에 특정 화가 스타일 적용 (Prisma·DeepArt·Stable Diffusion img2img).\n' +
      '• 인페인팅(Inpainting): 이미지의 일부 영역만 AI로 새로 채우기 (배경 교체·객체 제거).\n' +
      '• 업스케일링(Upscaling): 저해상도 이미지를 AI로 고해상도로 확대 (Real-ESRGAN 등).\n' +
      '• 배경 제거: AI가 피사체와 배경을 자동 분리 (Remove.bg·Canva AI).\n' +
      '• 실습 포인트: 각 도구의 강점에 맞는 작업 선택 + 결과물 품질 평가 기준 이해.',
    pose: 'guiding',
    suggestions: ['AI 영상·애니메이션 제작하고 싶어요', 'AI 음악 만들기는?', '저작권 주의사항은?'],
  },
  {
    id: 'iso-ac-25',
    title: 'AI Creator 강25 — AI 영상·애니메이션 제작 실습',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 25강', 'AI 영상 제작', 'AI 애니메이션', '아바타', '립싱크', '텍스트 영상',
      'Runway', 'HeyGen', 'D-ID', 'AI 캐릭터 영상', '컷 편집',
    ],
    answer:
      '📚 AI Creator 강 25 — AI 영상·애니메이션 제작 실습\n\n' +
      '• 텍스트→영상: Runway Gen-3·Sora·Kling으로 짧은 영상 클립 자동 생성.\n' +
      '• AI 아바타·립싱크: HeyGen·D-ID로 실제 사람처럼 말하는 AI 아바타 영상 제작.\n' +
      '• 애니메이션: 정지 이미지에 모션 추가 (Adobe Firefly·Runway Motion).\n' +
      '• 컷 편집 보조: AI 자동 자막·하이라이트 추출·장면 전환 (Descript·CapCut AI).\n' +
      '• 실습 포인트: 스크립트(15초 이내) 작성 → 아바타 선택 → 음성 설정 → 영상 출력.',
    pose: 'guiding',
    suggestions: ['AI 음악·오디오 만들고 싶어요', '3D·메타버스 콘텐츠 제작은?', '영상 저작권 주의사항'],
  },
  {
    id: 'iso-ac-26',
    title: 'AI Creator 강26 — AI 음악·오디오 제작 실습',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 26강', 'AI 음악 실습', 'TTS', '음원 분리', 'Suno 실습', 'Soundraw 실습',
      'AI 보이스', '텍스트 음성 변환', '음악 생성 실습', 'AI 오디오',
    ],
    answer:
      '📚 AI Creator 강 26 — AI 음악·오디오 제작 실습\n\n' +
      '• 작곡 플랫폼 실습: Suno에서 장르+분위기 프롬프트 → 가사+멜로디 완성 음악 생성.\n' +
      '• 배경음악 생성: Soundraw·Mubert로 BPM·분위기 설정 → 영상용 BGM 제작.\n' +
      '• TTS(Text-to-Speech): ElevenLabs·VITS2로 내 목소리 클론 또는 맞춤 음성 생성.\n' +
      '• 음원 분리(Source Separation): Spleeter·Demucs로 곡에서 보컬·악기 분리.\n' +
      '• 실습 포인트: 제작 목적(광고BGM·팟캐스트·영상음악)에 맞는 도구 선택.',
    pose: 'guiding',
    suggestions: ['3D·메타버스 콘텐츠 만들기', '저작권·윤리 실무가 궁금해요', 'AI 음악 저작권 문제'],
  },
  {
    id: 'iso-ac-27',
    title: 'AI Creator 강27 — 3D·메타버스 콘텐츠 제작 실습',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 27강', '3D 에셋 생성', '메타버스 씬', 'Shap-E', 'TripoSR', '메타버스 제작 실습',
      'AI 3D 모델', '메타버스 환경 구성', 'Unity AI', 'Unreal AI',
    ],
    answer:
      '📚 AI Creator 강 27 — 3D·메타버스 콘텐츠 제작 실습\n\n' +
      '• 3D 에셋 생성: Shap-E·TripoSR·Meshy로 텍스트/이미지 → 3D 메쉬 자동 생성.\n' +
      '• 메타버스 씬 구성: Unity·Unreal Engine에 AI 생성 에셋 배치 → 인터랙티브 환경 제작.\n' +
      '• AI 텍스처 생성: 3D 오브젝트에 AI로 사실적 텍스처·재질 자동 적용.\n' +
      '• 아바타 설정: Ready Player Me 등으로 메타버스 아바타 생성·커스터마이즈.\n' +
      '• 실습 포인트: 간단한 메타버스 룸(전시관·교실) 씬 구성 → 스크린샷·영상 제출.',
    pose: 'guiding',
    suggestions: ['저작권·윤리 실무가 궁금해요', '캡스톤 프로젝트는 무엇인가요?', '2차 실기 준비법'],
  },
  {
    id: 'iso-ac-28',
    title: 'AI Creator 강28 — 저작권·생성물 윤리 실무',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 28강', 'AI 저작권', 'AI 생성물 저작권', '딥페이크 책임', '표시 의무',
      'AI 콘텐츠 윤리', 'AI 생성 이미지 저작권', 'AI 저작권 귀속', '생성 AI 법률',
    ],
    answer:
      '📚 AI Creator 강 28 — 저작권·생성물 윤리 실무\n\n' +
      '• 저작권 귀속: 현행법상 AI가 단독 창작한 결과물은 저작권 없음 — 인간의 창작적 기여가 필요.\n' +
      '• 학습 데이터 문제: AI 모델이 저작권 있는 데이터로 학습 → 원저작자 동의 논쟁 진행 중.\n' +
      '• 딥페이크 책임: 허위 콘텐츠 제작·유포 시 명예훼손·초상권 침해로 민·형사 책임 가능.\n' +
      '• 표시 의무: EU AI Act·국내 AI 관련법에서 AI 생성물 표시 요구 논의 중.\n' +
      '• 실무 수칙: ① 학습 출처 확인 ② AI 생성물임을 명시 ③ 딥페이크 제작 자제.\n' +
      '• 시험 포인트: AI 저작권 = "인간 창작 기여 필수" / 딥페이크 = 법적 책임 있음.',
    pose: 'expert-pointing',
    suggestions: ['캡스톤 프로젝트는 무엇인가요?', '2차 실기 시험 준비법', 'AI 윤리 원칙이 궁금해요'],
  },
  {
    id: 'iso-ac-29',
    title: 'AI Creator 강29 — 캡스톤: 멀티미디어 포트폴리오',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 29강', '캡스톤', '포트폴리오', '멀티미디어 포트폴리오', 'AI Creator 최종 프로젝트',
      '포트폴리오 제작', 'AI 작품 모음', '기획서 제출', '캡스톤 프로젝트',
    ],
    answer:
      '📚 AI Creator 강 29 — 캡스톤: 멀티미디어 포트폴리오\n\n' +
      '• 캡스톤 목표: 이미지·영상·음악·3D 등 2가지 이상 유형의 AI 생성 작품 제작 + 기획서 작성.\n' +
      '• 포트폴리오 구성: 작품 파일 + 제작 과정(프롬프트·도구·반복 개선 내역) + 저작권 고려 사항.\n' +
      '• 기획서 항목: 주제·대상·목적·사용 도구·기대 효과·윤리적 고려.\n' +
      '• 평가 기준: 창의성·완성도·AI 도구 활용 적합성·윤리 준수 여부.\n' +
      '• 제출 방법: 2차 실기 시험에서 감독관 지시에 따라 파일 제출.\n' +
      '• 팁: 포트폴리오는 "기획 의도 + 반복 개선 과정"을 함께 제출해 창작 주체성 강조.',
    pose: 'guiding',
    suggestions: ['2차 실기 모의 시험 준비가 궁금해요', '시험 합격 기준이 어떻게 되나요?'],
  },
  {
    id: 'iso-ac-30',
    title: 'AI Creator 강30 — 2차 실기 모의 + 리뷰',
    category: 'course-ai-creator',
    keywords: [
      'AI Creator 30강', '2차 실기', '2차 실기 모의', '주관식 시험', '실기 제출',
      'AI Creator 2차', '실기 준비', '시험 리뷰', '최종 정리',
    ],
    answer:
      '📚 AI Creator 강 30 — 2차 실기 모의 + 리뷰\n\n' +
      '• 2차 실기 구성: 주관식(온라인 20문항·40분) + 실기 제작물 제출(당일 감독관 파일 지정).\n' +
      '• 주관식 합격 기준: 60점(12문항) 이상 / 실기는 제출 완료 여부+완성도 평가.\n' +
      '• 1차 합격 유지: 2차 불합격 시 1차 합격일로부터 1년간 1회 필기 면제.\n' +
      '• 모의 후 리뷰 포인트: 주관식 오답 분석 → 강 02~22 약점 단원 재복습.\n' +
      '• 최종 점검 리스트: GAN·NST·AI 음악·VR·메타버스 핵심 용어 / 저작권 실무 / 프롬프트 설계 능력.\n' +
      '• 자격증 수령: 합격 후 15~30일 내 자격증 발급 — iqcsplus.com에서 자격 조회 가능.',
    pose: 'cheer',
    suggestions: ['자격증 발급은 어떻게 되나요?', '자격증 유효기간이 얼마나 되나요?', '다음 단계는 무엇인가요?'],
  },
];
