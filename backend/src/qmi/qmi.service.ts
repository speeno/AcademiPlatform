import { Injectable } from '@nestjs/common';
import {
  QmiDocumentService,
  QmiRetrievedDoc,
  resolveQmiViewerRoles,
} from './document.service';
import { QmiOpenAiService } from './openai.service';
import { PersonalContextService, QmiUser } from './personal-context.service';

export type QmiReplySource = 'intent' | 'knowledge' | 'personal' | 'fallback';

/** 근거로 사용된 문서 출처(프론트 표시/추적용) */
export interface QmiSource {
  id: string;
  category: string;
}

export interface QmiChatResult {
  reply: string;
  /** intent: 인사/감사 등 / knowledge: 문서 근거 답변 / personal: 개인 DB 근거 / fallback: 데이터 폴백 안내 */
  source: QmiReplySource;
  /** 마스코트 포즈 키 */
  pose: string;
  /** 후속 추천 질문(칩) */
  suggestions: string[];
  /** 매칭된 최상위 문서 id (있을 때) */
  matchedId?: string;
  /** 답변 근거로 사용된 문서 출처 */
  sources?: QmiSource[];
  /** 검색 경로(vector|lexical|memory|personal) — 디버깅/관찰용 */
  retrieval?: string;
}

const GROUNDED_SYSTEM = `너는 AcademiPlatform의 공부도우미 "큐미"다. 학습자와 고객의 질문에 친절하게 답한다.

규칙:
1. 반드시 제공된 참고자료(context)에만 근거해 답한다.
2. context 에 없는 내용은 추측하지 않는다.
3. 정보가 부족하면 "확인 가능한 정보가 부족해요. 강의 Q&A나 고객센터로 문의해 주세요."라고 답한다.
4. 한국어로, 핵심을 먼저 말하고 필요하면 단계별로 짧게 안내한다.
5. 개인정보(연락처, 비밀번호 등)를 요구하지 않는다.
6. 친근하지만 과하지 않은 말투를 사용한다.
7. [개인 학습 데이터] 섹션이 있으면 그 데이터를 최우선으로 활용해 답한다.
8. 날짜·점수·진도율 등 수치 정보를 구체적으로 언급한다.`;

function compact(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^0-9a-z가-힣\s]/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

const GREETING_KEYWORDS = ['안녕', '하이', 'hello', 'hi', '큐미야', '반가', '안뇽'];
const THANKS_KEYWORDS = ['고마', '감사', 'thanks', 'thank you', '쌩큐', '땡큐'];
const BYE_KEYWORDS = ['잘가', '바이', 'bye', '종료', '끝', '다음에'];
const WHOIS_KEYWORDS = ['누구', '너는', '큐미가뭐', '뭐하는', '소개', '정체'];

const DEFAULT_SUGGESTIONS = [
  '공부 계획 세우기',
  '집중 잘 하는 법',
  '강의 수강 방법',
  '온라인 시험 응시 방법',
];

/** 벡터 검색 결과의 최소 코사인 유사도(이 미만이면 폴백) */
const VECTOR_MIN_SIMILARITY = 0.4;

/** LLM 컨텍스트에 포함할 문서당 최대 글자 수 */
const MAX_DOC_CONTENT_CHARS = 800;

const PERSONAL_SUGGESTIONS = [
  '내 시험 점수 확인',
  '다음 시험 일정',
  '수강 중인 강의 진도',
  '시험 신청 방법',
];

@Injectable()
export class QmiService {
  constructor(
    private readonly documents: QmiDocumentService,
    private readonly openai: QmiOpenAiService,
    private readonly personalContext: PersonalContextService,
  ) {}

  async chat(rawMessage: string, user?: QmiUser | null): Promise<QmiChatResult> {
    const message = (rawMessage ?? '').trim();
    if (!message) {
      return {
        reply: '무엇이 궁금한가요? 공부 방법이든 사이트 이용이든 편하게 물어보세요! 😊',
        source: 'fallback',
        pose: 'greeting',
        suggestions: user ? PERSONAL_SUGGESTIONS : DEFAULT_SUGGESTIONS,
      };
    }

    const compactMsg = compact(message);

    // 1) 인사/감사/작별 등 의도(intent) — 짧은 입력이면 우선 처리
    const intent = this.detectIntent(compactMsg, !!user);
    if (intent && compactMsg.length <= 12) return intent;

    // 2) 개인 데이터 컨텍스트 조회 (로그인한 경우)
    const personal = user
      ? await this.personalContext.build(message, user)
      : { contextText: '', summary: 'no-personal' };

    // 2-1) 개인 데이터만으로 답할 수 있으면 RAG 문서 없이 생성.
    //      개인정보를 외부 LLM 에 보낼지는 사용자 동의(qmiPersonalConsent)에 따른다.
    if (personal.contextText) {
      const allowLlmPii = user?.qmiPersonalConsent === true;
      const reply = await this.generateWithPersonal(
        message,
        personal.contextText,
        [],
        allowLlmPii,
      );
      const suggestions = user ? PERSONAL_SUGGESTIONS : DEFAULT_SUGGESTIONS;
      return {
        reply,
        source: 'personal',
        pose: 'explaining',
        suggestions,
        retrieval: personal.summary,
      };
    }

    // 3) 검색(retrieve) → grounded 생성. 조회자 역할로 접근 가능한 문서만 검색한다.
    const viewerRoles = resolveQmiViewerRoles(user?.role);
    const retrieved = await this.documents.search(message, 4, viewerRoles);
    const relevant = retrieved.filter((d) =>
      d.via === 'vector' ? d.score >= VECTOR_MIN_SIMILARITY : d.score > 0,
    );

    if (relevant.length > 0) {
      const top = relevant[0];
      const reply = await this.generate(message, relevant, top);
      return {
        reply,
        source: 'knowledge',
        pose: top.pose || 'explaining',
        suggestions: top.suggestions?.length ? top.suggestions : DEFAULT_SUGGESTIONS,
        matchedId: top.id,
        sources: relevant.map((d) => ({ id: d.id, category: d.category })),
        retrieval: top.via,
      };
    }

    // 3-1) intent 가 있었으나 길어서 건너뛴 경우
    if (intent) return intent;

    // 4) 데이터 폴백 — 매칭 실패 시 안내 + 추천
    const fallbackSuggestions = user ? PERSONAL_SUGGESTIONS : DEFAULT_SUGGESTIONS;
    return {
      reply:
        '아직 그 질문은 큐미가 정확히 답하기 어려워요. 🤔\n' +
        '아래 주제 중 하나를 골라주시면 바로 도와드릴게요. 또는 강의 상세의 Q&A나 고객센터로 문의해 주세요!',
      source: 'fallback',
      pose: 'surprised',
      suggestions: fallbackSuggestions,
    };
  }

  starters(isLoggedIn = false): string[] {
    return isLoggedIn ? PERSONAL_SUGGESTIONS : DEFAULT_SUGGESTIONS;
  }

  /** OpenAI(gpt-4o-mini) grounded 생성. 비활성/실패 시 최상위 문서 본문으로 추출형 폴백. */
  private async generate(
    message: string,
    docs: QmiRetrievedDoc[],
    top: QmiRetrievedDoc,
  ): Promise<string> {
    if (!this.openai.enabled) {
      if (top.content.length <= 600) return top.content;
      return top.content.slice(0, 580) + '\n\n…\n더 자세한 내용은 강의 Q&A나 고객센터에 문의해 주세요.';
    }

    const context = docs
      .map((d, i) => {
        const body =
          d.content.length > MAX_DOC_CONTENT_CHARS
            ? d.content.slice(0, MAX_DOC_CONTENT_CHARS) + '…'
            : d.content;
        return `[문서 ${i + 1}] (${d.category}) ${body}`;
      })
      .join('\n\n');

    const userTurn =
      '다음은 참고자료(context)입니다. 이 내용에만 근거해 답하세요.\n\n' +
      `${context}\n\n---\n사용자 질문: ${message}`;

    const answer = await this.openai.chat(GROUNDED_SYSTEM, userTurn);
    return answer ?? (top.content.length <= 600 ? top.content : top.content.slice(0, 580) + '…');
  }

  /**
   * 개인 DB 데이터 + (선택적) RAG 문서를 결합해 생성.
   * allowLlmPii 가 false 이면(동의 전) 개인정보를 외부 LLM 으로 보내지 않고
   * 서버에서 결정적으로 포매팅해 반환한다.
   */
  private async generateWithPersonal(
    message: string,
    personalContextText: string,
    docs: QmiRetrievedDoc[],
    allowLlmPii: boolean,
  ): Promise<string> {
    // LLM 미설정이거나 개인정보 외부 전송 미동의 시 → 개인 데이터를 서버에서 직접 포매팅해 반환
    if (!this.openai.enabled || !allowLlmPii) {
      return personalContextText + '\n\n궁금한 점이 더 있으면 편하게 물어보세요!';
    }

    const docSection =
      docs.length > 0
        ? '\n\n[참고 문서]\n' +
          docs
            .map((d, i) => {
              const body =
                d.content.length > MAX_DOC_CONTENT_CHARS
                  ? d.content.slice(0, MAX_DOC_CONTENT_CHARS) + '…'
                  : d.content;
              return `[문서 ${i + 1}] (${d.category}) ${body}`;
            })
            .join('\n\n')
        : '';

    const userTurn =
      '아래 데이터를 참고해 사용자의 질문에 답하세요.\n\n' +
      personalContextText +
      docSection +
      `\n\n---\n사용자 질문: ${message}`;

    const answer = await this.openai.chat(GROUNDED_SYSTEM, userTurn);
    return answer ?? personalContextText + '\n\n궁금한 점이 더 있으면 편하게 물어보세요!';
  }

  private detectIntent(compactMsg: string, isLoggedIn = false): QmiChatResult | null {
    const suggestions = isLoggedIn ? PERSONAL_SUGGESTIONS : DEFAULT_SUGGESTIONS;
    const has = (list: string[]) => list.some((k) => compactMsg.includes(compact(k)));

    if (has(GREETING_KEYWORDS)) {
      return {
        reply: '안녕하세요! 저는 공부도우미 큐미예요. 🤖\n공부 방법, 강의·시험·결제 같은 사이트 이용까지 무엇이든 물어보세요!',
        source: 'intent',
        pose: 'greeting',
        suggestions,
      };
    }
    if (has(THANKS_KEYWORDS)) {
      return {
        reply: '천만에요! 도움이 됐다니 큐미도 기뻐요. 😊 또 궁금한 게 있으면 언제든 불러주세요!',
        source: 'intent',
        pose: 'thumbs-up',
        suggestions,
      };
    }
    if (has(BYE_KEYWORDS)) {
      return {
        reply: '오늘도 공부하느라 고생했어요! 👋 다음에 또 만나요. 큐미가 항상 응원할게요!',
        source: 'intent',
        pose: 'waving',
        suggestions: [],
      };
    }
    if (has(WHOIS_KEYWORDS)) {
      return {
        reply:
          '저는 AcademiPlatform의 공부도우미 큐미예요! 🤖\n학습 팁부터 강의 수강·시험 응시·결제·수료증 안내까지, 준비된 자료를 바탕으로 도와드려요.',
        source: 'intent',
        pose: 'presenting',
        suggestions,
      };
    }
    return null;
  }
}
