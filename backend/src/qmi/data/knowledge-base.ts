/**
 * 큐미(Qmi) 공부도우미 지식베이스.
 *
 * 외부 LLM/검색 API 없이도 동작하는 "데이터 폴백(data fallback)"의 핵심 소스다.
 * chat() 은 사용자 메시지를 정규화해 각 엔트리의 keywords 와 매칭하고,
 * 매칭이 없으면 fallback 안내로 graceful 하게 응답한다.
 *
 * pose 값은 frontend/public/mascot/qmi 의 큐미 포즈 키와 1:1로 대응한다.
 */
export interface QmiKbEntry {
  id: string;
  /** 시드 시 문서 제목(없으면 keywords[0] 사용) */
  title?: string;
  category: string;
  /** 정규화된 사용자 입력에 substring 으로 등장하면 매칭되는 한국어 키워드/표현 */
  keywords: string[];
  answer: string;
  /** 마스코트 표정/포즈 키 (poses.ts / manifest 와 동일) */
  pose: string;
  /** 후속 추천 질문(칩) */
  suggestions?: string[];
}

import { QMI_SERVICE_GUIDE } from './service-guide';
import { ISO_AI_CREATOR_KB } from './iso-ai-creator-kb';
import { ISO_PROMPT_ENGINEER_KB } from './iso-prompt-engineer-kb';

export const QMI_KNOWLEDGE_BASE: QmiKbEntry[] = [
  // ── 학습 도우미 (study help) ───────────────────────────────────────────────
  {
    id: 'study-plan',
    category: 'study',
    keywords: ['공부 계획', '학습 계획', '스터디 플랜', '계획 세우', '플래너', '시간표', '공부법', '공부 방법'],
    answer:
      '공부 계획은 이렇게 세워보세요! 📚\n\n1. 목표를 구체적으로 (예: "이번 달 1강~10강 완강")\n2. 하루 학습량을 작게 쪼개기 (강의 1개 + 복습 15분)\n3. 같은 시간대에 고정하기\n4. 주 1회 점검일 만들기\n\n내 강의 진도는 마이페이지 > 수강 중인 강의에서 확인할 수 있어요.',
    pose: 'expert-pointing',
    suggestions: ['집중 잘 하는 법', '복습은 어떻게 해?', '시험 준비 팁'],
  },
  {
    id: 'focus-tips',
    category: 'study',
    keywords: ['집중', '딴짓', '졸려', '졸림', '집중력', '산만'],
    answer:
      '집중이 안 될 땐 이 방법을 써보세요! 💡\n\n• 25분 공부 + 5분 휴식 (뽀모도로)\n• 휴대폰은 화면이 안 보이게 뒤집어 두기\n• "딱 5분만" 으로 시작하기 — 일단 시작하면 이어집니다\n• 물 한 잔 마시고 자세 고쳐 앉기\n\n작은 성공을 반복하는 게 핵심이에요!',
    pose: 'idea',
    suggestions: ['공부 계획 세우기', '복습 방법', '동기부여가 필요해'],
  },
  {
    id: 'review-method',
    category: 'study',
    keywords: ['복습', '암기', '외우', '기억', '망각', '반복 학습'],
    answer:
      '복습은 "간격 반복"이 가장 효과적이에요! 🔁\n\n• 1차: 배운 당일\n• 2차: 다음 날\n• 3차: 일주일 뒤\n• 4차: 한 달 뒤\n\n다시 볼 때 강의를 처음부터 보기보다, 핵심 노트를 먼저 떠올린 뒤 막힌 부분만 다시 보는 게 좋아요.',
    pose: 'explaining',
    suggestions: ['시험 준비 팁', '노트 정리법', '공부 계획 세우기'],
  },
  {
    id: 'exam-prep',
    category: 'study',
    keywords: ['시험 준비', '시험 공부', '시험 팁', '기출', '모의고사', '시험 대비'],
    answer:
      '시험 준비는 이 순서를 추천해요! 📝\n\n1. 시험 범위와 유형 먼저 확인\n2. 기출/모의고사로 약점 파악\n3. 약점 단원 집중 복습\n4. 시험 전날은 새로운 내용보다 정리 위주\n\n온라인 시험은 상단 메뉴 > 시험에서 응시할 수 있고, 응시 가이드도 제공돼요.',
    pose: 'expert-pointing',
    suggestions: ['온라인 시험 응시 방법', '복습 방법', '긴장될 때'],
  },
  {
    id: 'motivation',
    category: 'study',
    keywords: ['동기부여', '의욕', '하기 싫', '포기', '지쳐', '번아웃', '힘들어'],
    answer:
      '괜찮아요, 누구나 그런 날이 있어요. 🌱\n\n오늘은 "완벽한 하루"가 아니라 "0보다 나은 하루"를 목표로 해보세요. 강의 1개, 단어 10개, 단 10분이라도 좋아요. 작게라도 이어가면 큐미가 끝까지 응원할게요! 💪',
    pose: 'cheer',
    suggestions: ['공부 계획 세우기', '집중 잘 하는 법', '내 진도 확인'],
  },

  // ── 사이트 이용 가이드 (site guide) ────────────────────────────────────────
  {
    id: 'guide-courses',
    category: 'guide',
    keywords: ['강의 신청', '수강 신청', '강의 듣', '강의 어디', '강좌', '수강 방법', '강의 찾'],
    answer:
      '강의는 이렇게 수강해요! 🎬\n\n1. 상단 메뉴 > 강의에서 원하는 강좌 선택\n2. 강의 상세에서 "수강신청" 또는 결제\n3. 마이페이지 > 수강 중인 강의에서 바로 재생\n\n관심 분야로 필터링해서 찾을 수도 있어요.',
    pose: 'guiding',
    suggestions: ['결제 방법 알려줘', '환불 규정', '진도는 어디서 봐?'],
  },
  {
    id: 'guide-payment',
    category: 'guide',
    keywords: ['결제', '카드', '계좌', '구매', '돈', '가격', '수강료', '비용'],
    answer:
      '결제 안내예요! 💳\n\n• 강의/패키지 상세에서 "결제하기"\n• 신용/체크카드, 간편결제를 지원해요\n• 결제 내역은 마이페이지 > 결제/주문에서 확인\n\n결제가 안 되면 카드사 또는 브라우저(시크릿 모드 해제)를 확인해 주세요.',
    pose: 'suit-idle',
    suggestions: ['환불 규정', '강의 수강 방법', '영수증은 어디서 받아?'],
  },
  {
    id: 'guide-refund',
    category: 'guide',
    keywords: ['환불', '취소', '결제 취소', '돌려받', '반환'],
    answer:
      '환불 규정 안내예요. 🧾\n\n• 수강 시작 전: 전액 환불\n• 수강 시작 후: 진도율/기간에 따라 부분 환불\n• 신청: 마이페이지 > 결제/주문 > 환불 요청\n\n자세한 기준은 하단의 환불/이용약관 페이지에서 확인할 수 있어요.',
    pose: 'explaining',
    suggestions: ['결제 방법 알려줘', '고객센터 연결', '강의 수강 방법'],
  },
  {
    id: 'guide-exam',
    category: 'guide',
    keywords: ['온라인 시험', '시험 응시', '시험 보', '응시 방법', '시험장', '시험 어디'],
    answer:
      '온라인 시험 응시 방법이에요! 🖥️\n\n1. 상단 메뉴 > 시험에서 응시할 시험 선택\n2. 응시 전 유의사항/가이드 확인\n3. "응시하기" 클릭 후 진행\n4. 제출하면 결과를 확인할 수 있어요\n\n안정적인 인터넷과 최신 브라우저를 권장해요.',
    pose: 'expert-pointing',
    suggestions: ['시험 준비 팁', '결과는 어디서 봐?', '문제가 안 보여요'],
  },
  {
    id: 'guide-certificate',
    category: 'guide',
    keywords: ['수료증', '이수증', '자격증', '인증서', '수료', '졸업'],
    answer:
      '수료증/이수증 안내예요! 🎓\n\n• 강의 수료 기준(진도율·시험 등)을 충족하면 발급돼요\n• 마이페이지 > 수료증에서 발급/다운로드\n\n발급 조건은 강좌마다 다를 수 있으니 강의 상세를 확인해 주세요.',
    pose: 'graduate',
    suggestions: ['진도는 어디서 봐?', '시험 응시 방법', '고객센터 연결'],
  },
  {
    id: 'guide-login',
    category: 'guide',
    keywords: ['로그인', '회원가입', '비밀번호', '계정', '아이디', '가입', '로그아웃'],
    answer:
      '계정 관련 안내예요! 🔐\n\n• 회원가입/로그인은 우측 상단 버튼에서\n• 비밀번호를 잊었다면 로그인 화면의 "비밀번호 찾기"\n• 가입한 이메일이 기억나지 않으면 고객센터로 문의해 주세요.',
    pose: 'guiding',
    suggestions: ['고객센터 연결', '강의 수강 방법', '결제 방법'],
  },
  {
    id: 'guide-progress',
    category: 'guide',
    keywords: ['진도', '진도율', '내 강의', '수강 현황', '어디까지 들었', '이어보기'],
    answer:
      '학습 진도는 여기서 확인해요! 📈\n\n마이페이지 > 수강 중인 강의에서 강좌별 진도율과 마지막 시청 위치를 볼 수 있고, 바로 이어보기가 가능해요.',
    pose: 'pointing',
    suggestions: ['수료증 발급 조건', '공부 계획 세우기', '강의 수강 방법'],
  },
  {
    id: 'guide-support',
    category: 'guide',
    keywords: ['고객센터', '문의', '상담', '연락', '도움', '문제 생겨', '에러', '오류', '안 돼'],
    answer:
      '도움이 필요하시군요! 🙋\n\n• 사이트 하단 "문의하기/고객센터"에서 문의를 남길 수 있어요\n• 강의 관련 질문은 강의 상세의 Q&A를 이용해 보세요\n\n어떤 부분이 막히는지 한 줄로 알려주시면 큐미가 안내해 드릴게요!',
    pose: 'presenting',
    suggestions: ['결제가 안 돼요', '로그인이 안 돼요', '강의가 안 보여요'],
  },

  // ── ISO AI Creator 30강 학습도우미 ────────────────────────────────────────
  ...ISO_AI_CREATOR_KB,

  // ── ISO Prompt Engineer 30강 학습도우미 ───────────────────────────────────
  ...ISO_PROMPT_ENGINEER_KB,

  // ── 서비스 종합 안내 (관리자 등록 문서) ─────────────────────────────────────
  QMI_SERVICE_GUIDE,
];
