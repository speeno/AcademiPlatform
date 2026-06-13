import { Injectable, Logger } from '@nestjs/common';

/**
 * 큐미 RAG - OpenAI 호출(임베딩 + 채팅 생성).
 *
 * - OPENAI_API_KEY 가 있으면 활성화. 임베딩(text-embedding-3-small)과
 *   채팅 생성(gpt-4o-mini)을 raw fetch 로 호출한다(외부 SDK 의존성 없음).
 * - 키가 없거나 호출 실패 시 null 을 반환 → 호출부가 데이터 폴백(어휘 검색/지식베이스)으로 처리.
 *
 * 환경변수:
 *   OPENAI_API_KEY     (필수, 백엔드 서버에 설정)
 *   QMI_CHAT_MODEL     (선택, 기본 gpt-4o-mini)
 *   QMI_EMBED_MODEL    (선택, 기본 text-embedding-3-small)
 *   OPENAI_BASE_URL    (선택, 기본 https://api.openai.com/v1)
 */
@Injectable()
export class QmiOpenAiService {
  private readonly logger = new Logger(QmiOpenAiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  private readonly chatModel = process.env.QMI_CHAT_MODEL || 'gpt-4o-mini';
  private readonly embedModel = process.env.QMI_EMBED_MODEL || 'text-embedding-3-small';

  /** text-embedding-3-small 차원 */
  static readonly EMBED_DIM = 1536;

  get enabled(): boolean {
    return !!this.apiKey;
  }

  /** 여러 텍스트를 임베딩. 실패/비활성 시 null. */
  async embed(texts: string[]): Promise<number[][] | null> {
    if (!this.apiKey || texts.length === 0) return null;
    try {
      const res = await this.post('/embeddings', {
        model: this.embedModel,
        input: texts,
      });
      if (!res) return null;
      const data: any = await res.json();
      const vectors: number[][] = (data?.data ?? [])
        .sort((a: any, b: any) => a.index - b.index)
        .map((d: any) => d.embedding as number[]);
      return vectors.length === texts.length ? vectors : null;
    } catch (error) {
      this.logger.warn(`임베딩 실패, 폴백 사용: ${String(error)}`);
      return null;
    }
  }

  /** 단일 텍스트 임베딩 편의 함수. */
  async embedOne(text: string): Promise<number[] | null> {
    const vectors = await this.embed([text]);
    return vectors?.[0] ?? null;
  }

  /** gpt-4o-mini grounded 생성. 실패/비활성/거부 시 null. */
  async chat(system: string, userTurn: string): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const res = await this.post('/chat/completions', {
        model: this.chatModel,
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userTurn },
        ],
      });
      if (!res) return null;
      const data: any = await res.json();
      const answer: string | undefined = data?.choices?.[0]?.message?.content?.trim();
      return answer && answer.length > 0 ? answer : null;
    } catch (error) {
      this.logger.warn(`채팅 생성 실패, 폴백 사용: ${String(error)}`);
      return null;
    }
  }

  private async post(path: string, body: unknown): Promise<Response | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`OpenAI ${path} 오류: ${res.status}`);
        return null;
      }
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }
}
