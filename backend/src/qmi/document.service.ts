import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { QMI_KNOWLEDGE_BASE } from './data/knowledge-base';
import { QmiOpenAiService } from './openai.service';

export interface QmiRetrievedDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  pose: string;
  suggestions: string[];
  /** 0~1 (벡터 코사인 유사도 또는 정규화된 어휘 점수) */
  score: number;
  /** 'vector' | 'lexical' | 'memory' */
  via: string;
}

export interface QmiDocumentInput {
  title: string;
  category: string;
  content: string;
  url?: string;
  keywords?: string[];
  roles?: string[];
  pose?: string;
  suggestions?: string[];
  enabled?: boolean;
}

function compact(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^0-9a-z가-힣\s]/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

/** 역할별로 볼 수 있는 문서 태그 집합(상위 역할은 하위 태그를 포함). */
const ROLE_TAG_HIERARCHY: Record<string, string[]> = {
  USER: ['user'],
  INSTRUCTOR: ['user', 'instructor'],
  OPERATOR: ['user', 'instructor', 'operator'],
  SUPER_ADMIN: ['user', 'instructor', 'operator', 'super_admin'],
};

/**
 * 조회자(뷰어)가 접근 가능한 문서 role 태그 목록. 항상 'public' 을 포함하고,
 * 로그인 사용자는 자신의 역할 및 하위 역할 태그를 추가로 본다. 익명은 ['public'].
 */
export function resolveQmiViewerRoles(userRole?: string | null): string[] {
  const tags = new Set<string>(['public']);
  const extra = userRole ? ROLE_TAG_HIERARCHY[userRole] : undefined;
  if (extra) extra.forEach((t) => tags.add(t));
  return [...tags];
}

/** viewerRoles 를 안전한 Postgres text[] 배열 리터럴로 변환(태그는 [a-z_] 로 제한). */
function toRolesArrayLiteral(viewerRoles: string[]): string {
  const sanitized = viewerRoles
    .map((r) => r.toLowerCase().replace(/[^a-z_]/g, ''))
    .filter(Boolean);
  const list = sanitized.length > 0 ? sanitized : ['public'];
  return `ARRAY[${list.map((r) => `'${r}'`).join(',')}]::text[]`;
}

@Injectable()
export class QmiDocumentService implements OnModuleInit {
  private readonly logger = new Logger(QmiDocumentService.name);
  /** DB(chatbot_documents) 사용 가능 여부. 마이그레이션 전이면 false → 인메모리 폴백. */
  private dbReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: QmiOpenAiService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureSeedDocuments();
      this.dbReady = true;
    } catch (error) {
      this.dbReady = false;
      this.logger.warn(
        `chatbot_documents 사용 불가(마이그레이션 전?) — 인메모리 지식베이스로 폴백: ${String(error)}`,
      );
    }
  }

  /**
   * 정적 지식베이스(QMI_KNOWLEDGE_BASE)의 문서를 제목 기준으로 reconcile 한다.
   * - 누락된 문서는 추가한다.
   * - 이미 존재하는 시드 문서는 content·keywords·pose·suggestions 를 최신 정의로 동기화한다.
   */
  async ensureSeedDocuments(): Promise<void> {
    const existing = await this.prisma.chatbotDocument.findMany({
      select: { id: true, title: true, content: true, keywords: true },
    });
    const existingByTitle = new Map(existing.map((d) => [d.title, d]));

    let inserted = 0;
    let updated = 0;

    for (const e of QMI_KNOWLEDGE_BASE) {
      const title = e.title ?? e.keywords[0] ?? e.category;
      const current = existingByTitle.get(title);

      if (current) {
        const contentChanged = current.content !== e.answer;
        const keywordsChanged = JSON.stringify(current.keywords) !== JSON.stringify(e.keywords);
        if (contentChanged || keywordsChanged) {
          await this.prisma.chatbotDocument.update({
            where: { id: current.id },
            data: {
              content: e.answer,
              keywords: e.keywords,
              pose: e.pose,
              suggestions: e.suggestions ?? [],
            },
          });
          updated++;
        }
        continue;
      }

      await this.prisma.chatbotDocument.create({
        data: {
          title,
          category: e.category,
          content: e.answer,
          keywords: e.keywords,
          roles: ['public'],
          pose: e.pose,
          suggestions: e.suggestions ?? [],
          enabled: true,
        },
      });
      inserted++;
    }

    if (inserted + updated > 0) {
      this.logger.log(`지식 문서 ${inserted}건 시드, ${updated}건 동기화(reconcile) 완료`);
      if (this.openai.enabled) {
        try {
          const n = await this.reindex();
          this.logger.log(`임베딩 ${n}건 완료`);
        } catch (error) {
          this.logger.warn(`임베딩 실패(나중에 reindex 가능): ${String(error)}`);
        }
      }
    }
  }

  /**
   * 검색: 벡터(가능 시) → 어휘 → 인메모리 순으로 폴백.
   * viewerRoles 로 문서 접근을 제한한다(기본 익명=public). role 태그가 겹치는 문서만 반환된다.
   */
  async search(
    query: string,
    k = 4,
    viewerRoles: string[] = ['public'],
  ): Promise<QmiRetrievedDoc[]> {
    if (!this.dbReady) return this.memorySearch(query, k);

    try {
      // 1) 벡터 검색 (OpenAI 임베딩이 가능하고, 임베딩된 문서가 있을 때)
      if (this.openai.enabled) {
        const qv = await this.openai.embedOne(query);
        if (qv) {
          const rows = await this.vectorSearch(qv, k, viewerRoles);
          if (rows.length > 0) return rows;
        }
      }
      // 2) 어휘(lexical) 검색
      return await this.lexicalSearch(query, k, viewerRoles);
    } catch (error) {
      this.logger.warn(`검색 실패, 인메모리 폴백: ${String(error)}`);
      return this.memorySearch(query, k);
    }
  }

  private async vectorSearch(
    qv: number[],
    k: number,
    viewerRoles: string[],
  ): Promise<QmiRetrievedDoc[]> {
    const lit = toVectorLiteral(qv);
    // role 태그는 [a-z_] 로 살균 후 인라인하므로 주입 위험이 없다(파라미터 바인딩 배열 대체).
    const rolesLiteral = toRolesArrayLiteral(viewerRoles);
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, title, category, content, keywords, pose, suggestions,
              1 - (embedding <=> $1::vector) AS score
         FROM chatbot_documents
        WHERE enabled = true AND embedding IS NOT NULL
          AND roles && ${rolesLiteral}
        ORDER BY embedding <=> $1::vector
        LIMIT $2`,
      lit,
      k,
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      content: r.content,
      keywords: r.keywords ?? [],
      pose: r.pose ?? 'explaining',
      suggestions: r.suggestions ?? [],
      score: Number(r.score ?? 0),
      via: 'vector',
    }));
  }

  private async lexicalSearch(
    query: string,
    k: number,
    viewerRoles: string[],
  ): Promise<QmiRetrievedDoc[]> {
    const docs = await this.prisma.chatbotDocument.findMany({
      where: { enabled: true, roles: { hasSome: viewerRoles } },
    });
    const q = compact(query);
    const scored = docs
      .map((d) => ({ d, score: this.lexicalScore(q, d.keywords ?? [], d.content) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    return scored.map((s) => ({
      id: s.d.id,
      title: s.d.title,
      category: s.d.category,
      content: s.d.content,
      keywords: s.d.keywords ?? [],
      pose: s.d.pose ?? 'explaining',
      suggestions: s.d.suggestions ?? [],
      score: s.score,
      via: 'lexical',
    }));
  }

  /** DB 불가 시: 정적 지식베이스에서 어휘 검색 */
  private memorySearch(query: string, k: number): QmiRetrievedDoc[] {
    const q = compact(query);
    return QMI_KNOWLEDGE_BASE.map((e) => ({
      e,
      score: this.lexicalScore(q, e.keywords, e.answer),
    }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s) => ({
        id: s.e.id,
        title: s.e.keywords[0] ?? s.e.category,
        category: s.e.category,
        content: s.e.answer,
        keywords: s.e.keywords,
        pose: s.e.pose,
        suggestions: s.e.suggestions ?? [],
        score: s.score,
        via: 'memory',
      }));
  }

  private lexicalScore(compactQuery: string, keywords: string[], content: string): number {
    let score = 0;
    const counted = new Set<string>(); // 동일 토큰 중복 가점 방지

    for (const kw of keywords) {
      const compactKw = compact(kw);
      if (!compactKw || compactKw.length < 2) continue;

      // 1) 전체 키워드 매칭 (최고 가점)
      if (compactQuery.includes(compactKw) && !counted.has(compactKw)) {
        counted.add(compactKw);
        score += 2 + Math.min(compactKw.length, 8) / 8;
        continue;
      }

      // 2) 토큰 단위 매칭: 원본 키워드를 공백으로 분리해 각 토큰을 개별 검사
      for (const part of kw.split(/\s+/)) {
        const token = compact(part);
        if (token.length < 2 || counted.has(token)) continue;
        if (compactQuery.includes(token)) {
          counted.add(token);
          score += 0.7 + Math.min(token.length, 4) / 8;
        }
      }
    }

    return score;
  }

  // ── 관리자 CRUD ────────────────────────────────────────────────────────────

  async list() {
    const docs = await this.prisma.chatbotDocument.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    // 임베딩 컬럼은 Prisma 타입 클라이언트로 조회 불가 → raw 로 보유 여부만 확인
    let embeddedIds = new Set<string>();
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM chatbot_documents WHERE embedding IS NOT NULL`,
      );
      embeddedIds = new Set(rows.map((r) => r.id));
    } catch {
      /* 임베딩 미사용/마이그레이션 전 — 무시 */
    }
    return docs.map((d) => ({ ...d, hasEmbedding: embeddedIds.has(d.id) }));
  }

  async create(input: QmiDocumentInput) {
    const doc = await this.prisma.chatbotDocument.create({
      data: {
        title: input.title,
        category: input.category,
        content: input.content,
        url: input.url ?? '',
        keywords: input.keywords ?? [],
        roles: input.roles ?? ['public'],
        pose: input.pose ?? 'explaining',
        suggestions: input.suggestions ?? [],
        enabled: input.enabled ?? true,
      },
    });
    await this.embedDoc(doc.id, doc.title, doc.content);
    return doc;
  }

  async update(id: string, input: Partial<QmiDocumentInput>) {
    const doc = await this.prisma.chatbotDocument.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.keywords !== undefined && { keywords: input.keywords }),
        ...(input.roles !== undefined && { roles: input.roles }),
        ...(input.pose !== undefined && { pose: input.pose }),
        ...(input.suggestions !== undefined && { suggestions: input.suggestions }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
      },
    });
    if (input.content !== undefined || input.title !== undefined) {
      await this.embedDoc(doc.id, doc.title, doc.content);
    }
    return doc;
  }

  async remove(id: string) {
    await this.prisma.chatbotDocument.delete({ where: { id } });
    return { ok: true };
  }

  /** 임베딩이 없는(또는 전체) 문서를 임베딩해 저장. 관리자/시드용. */
  async reindex(): Promise<number> {
    if (!this.openai.enabled) {
      throw new Error('OPENAI_API_KEY 가 설정되어 있지 않습니다.');
    }
    const docs = await this.prisma.chatbotDocument.findMany({ where: { enabled: true } });
    if (docs.length === 0) return 0;

    const vectors = await this.openai.embed(docs.map((d) => `${d.title}\n${d.content}`));
    if (!vectors) throw new Error('임베딩 생성에 실패했습니다.');

    let updated = 0;
    for (let i = 0; i < docs.length; i++) {
      await this.storeEmbedding(docs[i].id, vectors[i]);
      updated++;
    }
    return updated;
  }

  private async embedDoc(id: string, title: string, content: string): Promise<void> {
    if (!this.openai.enabled) return;
    try {
      const vec = await this.openai.embedOne(`${title}\n${content}`);
      if (vec) await this.storeEmbedding(id, vec);
    } catch (error) {
      this.logger.warn(`문서 임베딩 실패(${id}): ${String(error)}`);
    }
  }

  private async storeEmbedding(id: string, vec: number[]): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE chatbot_documents SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
      toVectorLiteral(vec),
      id,
    );
  }
}
