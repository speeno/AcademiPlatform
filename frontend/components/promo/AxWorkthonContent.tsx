import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Code2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';
import {
  PromoPosterGallery,
  type PromoPoster,
} from '@/components/promo/PromoPosterGallery';

/** 프로그램 체계 — 기간별 3단계 */
const tiers = [
  {
    icon: Calendar,
    badge: '1일',
    accent: 'blue' as const,
    iconBg: 'bg-brand-blue-subtle',
    iconColor: 'text-brand-blue',
    name: 'AX 워크톤 데이',
    sub: '도입 워크숍',
    desc: '우리 팀 업무 1건을 AI 워크플로로 전환하고, 공통 언어를 맞춥니다.',
  },
  {
    icon: Rocket,
    badge: '3일',
    accent: 'sky' as const,
    iconBg: 'bg-brand-sky-subtle',
    iconColor: 'text-brand-sky',
    name: 'AX 워크톤 스프린트',
    sub: '팀 파일럿 스프린트',
    desc: '팀 표준 스킬 설계부터 파일럿 설계 패키지까지 완성합니다.',
  },
  {
    icon: Building2,
    badge: '1주',
    accent: 'green' as const,
    iconBg: 'bg-brand-green/10',
    iconColor: 'text-brand-green',
    name: 'AX 워크톤 부트캠프',
    sub: '조직 표준 부트캠프',
    desc: '거버넌스·검증·운영까지 조직 표준을 세우고, ISO 국제표준 기반 AI 자격 응시까지 연계합니다.',
  },
];

/** 대상별 트랙 */
const tracks = [
  {
    icon: Users,
    accent: 'orange' as const,
    iconBg: 'bg-brand-orange-subtle',
    iconColor: 'text-brand-orange',
    name: '비개발자 트랙',
    question: '어떤 업무를 어떤 절차와 규칙으로 자동화할 것인가',
    deliverables: [
      '업무 시나리오 (트리거·입력·출력·리스크)',
      '스킬 초안 (목적·절차·금지 사항)',
      '워크플로 (승인·검토 흐름)',
      '_workspace 폴더 규약',
    ],
  },
  {
    icon: Code2,
    accent: 'blue' as const,
    iconBg: 'bg-brand-blue-subtle',
    iconColor: 'text-brand-blue',
    name: '개발자 트랙',
    question:
      '에이전트가 안전하게 도구를 쓰고 재사용되려면 무엇을 정의해야 하는가',
    deliverables: [
      'SKILL.md · 오케스트레이터',
      'Task 설계 · 서브에이전트',
      'AGENTS.md 포인터',
      '검증(스모크) 스크립트',
    ],
  },
];

/** 왜 필요한가 */
const whyPoints = [
  '개인별 프롬프트 의존을 팀 표준 스킬과 워크플로로 전환',
  '승인·검토·보안·산출물 보존 위치를 명확히 해 운영 리스크 축소',
  '업무 요구사항과 개발 구현 사이의 전달 손실 감소',
  '파일럿 성공 기준·중단 조건·검증 절차를 교육 단계에서 미리 정의',
];

/** 추천 운영 방식 */
const recommendations = [
  { icon: Sparkles, when: 'AI 도입 초기', plan: '비개발자 1일 + 개발자 1일' },
  { icon: Rocket, when: '특정 팀 파일럿 준비', plan: '비개발자 3일 + 개발자 3일' },
  { icon: ShieldCheck, when: '전사 표준·거버넌스 준비', plan: '비개발자 1주 + 개발자 1주' },
];

/** 교육 후 기대 효과 */
const expectedEffects = [
  '반복 가능한 사내 AI 자동화 로드맵 도출',
  '요구사항 정렬과 구현 표준화',
  '운영·검증·보안 체계 준비',
  '부트캠프 연계 시 ISO 국제표준 기반 AI 자격 취득 기회 확보',
];

/** 도입 전 준비 */
const prepChecklist = [
  '교육 대상 부서와 파일럿 후보 업무 1~3건 선정',
  '비식별 샘플 문서 또는 샘플 데이터 준비',
  'IDE·Git·사내 레포 접근 권한 확인',
  '정책상 허용 모델·금지 데이터·보안 리뷰 기준 확인',
];

/** 비개발자 트랙 포스터 (1일 · 3일 · 1주) */
const nonDevTrackPosters: PromoPoster[] = [
  {
    src: '/promotion/track-nondev-1day.jpg',
    alt: 'AX 워크톤 데이(1일) 비개발자 트랙 소개 포스터',
    title: '데이 · 비개발자 트랙',
    tags: ['1일 집중 워크톤', '업무 자동화 초안'],
  },
  {
    src: '/promotion/track-nondev-3day.jpg',
    alt: 'AX 워크톤 스프린트(3일) 비개발자 트랙 소개 포스터',
    title: '스프린트 · 비개발자 트랙',
    tags: ['3일 실무형 스프린트', '파일럿 설계 패키지'],
  },
  {
    src: '/promotion/track-nondev-1week.jpg',
    alt: 'AX 워크톤 부트캠프(1주) 비개발자 트랙 소개 포스터',
    title: '부트캠프 · 비개발자 트랙',
    tags: ['1주 실행 부트캠프', 'ISO 자격 연계'],
  },
];

/** 개발자 트랙 포스터 (1일 · 3일 · 1주) */
const devTrackPosters: PromoPoster[] = [
  {
    src: '/promotion/track-dev-1day.jpg',
    alt: 'AX 워크톤 데이(1일) 개발자 트랙 소개 포스터',
    title: '데이 · 개발자 트랙',
    tags: ['1일 입문 과정', 'AI 에이전트 실습'],
  },
  {
    src: '/promotion/track-dev-3day.jpg',
    alt: 'AX 워크톤 스프린트(3일) 개발자 트랙 소개 포스터',
    title: '스프린트 · 개발자 트랙',
    tags: ['3일 심화 스프린트', '팀 표준 파일럿'],
  },
  {
    src: '/promotion/track-dev-1week.jpg',
    alt: 'AX 워크톤 부트캠프(1주) 개발자 트랙 소개 포스터',
    title: '부트캠프 · 개발자 트랙',
    tags: ['1주 리더 부트캠프', 'ISO 자격 연계'],
  },
];

/**
 * 현업·비개발자 실무 적용 사례(Use Case) — 포스터 인쇄 번호 01~12 순서(파일명 역순).
 */
const useCasePosters: PromoPoster[] = [
  {
    src: '/promotion/usecase-10.jpg',
    alt: 'Use Case 01 주간 업무 보고 자동화',
    title: '01 · 주간 업무 보고 자동화',
    tags: ['전 직군 공통', '입문', '데이'],
  },
  {
    src: '/promotion/usecase-9.jpg',
    alt: 'Use Case 02 회의록에서 액션 아이템 트래킹',
    title: '02 · 회의록 → 액션 아이템',
    tags: ['기획·PMO', '입문', '데이'],
  },
  {
    src: '/promotion/usecase-8.jpg',
    alt: 'Use Case 03 고객 문의 1차 분류와 답변 초안',
    title: '03 · 고객 문의 분류·답변 초안',
    tags: ['CS·영업지원', '입문', '데이~스프린트'],
  },
  {
    src: '/promotion/usecase-7.jpg',
    alt: 'Use Case 04 RFP·제안 요청 분석과 대응 체크리스트',
    title: '04 · RFP·제안 분석',
    tags: ['영업·사업개발', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-6.jpg',
    alt: 'Use Case 05 채용 서류 스크리닝 보조',
    title: '05 · 채용 서류 스크리닝 보조',
    tags: ['인사', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-5.jpg',
    alt: 'Use Case 06 사내 규정·정책 Q&A 스킬',
    title: '06 · 사내 규정·정책 Q&A',
    tags: ['총무·컴플라이언스', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-4.jpg',
    alt: 'Use Case 07 마케팅 콘텐츠 리퍼포징',
    title: '07 · 마케팅 콘텐츠 리퍼포징',
    tags: ['마케팅·홍보', '입문', '데이~스프린트'],
  },
  {
    src: '/promotion/usecase-3.jpg',
    alt: 'Use Case 08 경쟁사·시장 동향 주간 브리프',
    title: '08 · 경쟁사·시장 동향 브리프',
    tags: ['전략·기획', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-2.jpg',
    alt: 'Use Case 09 예산 집행 점검 브리프',
    title: '09 · 예산 집행 점검 브리프',
    tags: ['재무·운영', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-1.jpg',
    alt: 'Use Case 10 계약서 검토 준비 패키지',
    title: '10 · 계약서 검토 준비 패키지',
    tags: ['법무 협업', '심화', '스프린트~부트캠프'],
  },
  {
    src: '/promotion/usecase-12.jpg',
    alt: 'Use Case 11 온보딩 가이드 생성·업데이트',
    title: '11 · 온보딩 가이드 생성',
    tags: ['인사·팀리더', '입문', '데이~스프린트'],
  },
  {
    src: '/promotion/usecase-11.jpg',
    alt: 'Use Case 12 행사·웨비나 운영 워크플로',
    title: '12 · 행사·웨비나 운영 워크플로',
    tags: ['마케팅·운영', '심화', '부트캠프'],
  },
];

/**
 * 개발자 실무 적용 사례(Use Case) — 포스터 인쇄 번호 01~10 순서(파일명 역순).
 */
const devUseCasePosters: PromoPoster[] = [
  {
    src: '/promotion/usecase-dev-10.jpg',
    alt: 'Dev Use Case 01 PR 리뷰 보조 자동화',
    title: '01 · PR 리뷰 보조 자동화',
    tags: ['전 개발 직군', '입문', '데이'],
  },
  {
    src: '/promotion/usecase-dev-9.jpg',
    alt: 'Dev Use Case 02 레거시 모듈 문서화와 AGENTS.md 정비',
    title: '02 · 레거시 문서화·AGENTS.md',
    tags: ['전 개발 직군', '입문', '데이'],
  },
  {
    src: '/promotion/usecase-dev-8.jpg',
    alt: 'Dev Use Case 03 릴리스 노트·변경 요약 자동 생성',
    title: '03 · 릴리스 노트 자동 생성',
    tags: ['개발·플랫폼', '입문', '데이'],
  },
  {
    src: '/promotion/usecase-dev-7.jpg',
    alt: 'Dev Use Case 04 테스트 커버리지 보강 스킬',
    title: '04 · 테스트 커버리지 보강',
    tags: ['서비스개발·QA', '중급', '데이~스프린트'],
  },
  {
    src: '/promotion/usecase-dev-6.jpg',
    alt: 'Dev Use Case 05 로그·에러 트리아지 브리프',
    title: '05 · 로그·에러 트리아지',
    tags: ['개발·SRE', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-dev-5.jpg',
    alt: 'Dev Use Case 06 표준 스캐폴딩 스킬화',
    title: '06 · 표준 스캐폴딩 스킬화',
    tags: ['플랫폼·DevEx', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-dev-4.jpg',
    alt: 'Dev Use Case 07 의존성 업그레이드 브리프',
    title: '07 · 의존성 업그레이드 브리프',
    tags: ['플랫폼·보안', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-dev-3.jpg',
    alt: 'Dev Use Case 08 사내 API·코드베이스 Q&A 스킬',
    title: '08 · 사내 API·코드베이스 Q&A',
    tags: ['DevEx', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-dev-2.jpg',
    alt: 'Dev Use Case 09 데이터 파이프라인 검증 리포트',
    title: '09 · 데이터 파이프라인 검증',
    tags: ['데이터 엔지니어', '중급', '스프린트'],
  },
  {
    src: '/promotion/usecase-dev-1.jpg',
    alt: 'Dev Use Case 10 온콜 인시던트 초동 대응 보조',
    title: '10 · 온콜 인시던트 대응 보조',
    tags: ['SRE·운영', '심화', '스프린트~부트캠프'],
  },
];

export type AxWorkthonContentProps = {
  /** 독립 랜딩(이메일 마케팅)용: 사이트 내부로 이동하는 보조 링크를 감춘다. */
  standalone?: boolean;
  /** 주요 CTA(도입 문의) 링크. 기본값은 사내 문의 페이지. */
  ctaHref?: string;
};

/**
 * AX 워크톤 소개 본문(히어로~CTA). 사이트 통합 페이지와 독립 랜딩 페이지가 공유한다.
 * standalone=true 이면 사이트 내부로 이동하는 보조 링크를 숨겨 단일 CTA에 집중시킨다.
 */
export function AxWorkthonContent({
  standalone = false,
  ctaHref = '/contact',
}: AxWorkthonContentProps) {
  return (
    <div>
      {/* HERO */}
      <section className="bg-hero-gradient border-b py-16 md:py-20">
        <PageShell flush className="text-center">
          <p className="mb-3 text-sm font-semibold text-brand-orange">
            기업 AX 실전 교육 · Work-a-thon
          </p>
          <h1 className="text-4xl font-extrabold text-brand-blue md:text-5xl">
            AX 워크톤
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl font-bold text-brand-blue/90 md:text-2xl">
            이론은 짧게, 결과는 확실하게
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            내 업무를 가져와 AI 워크플로로 전환하고 결과물을 도출하는 실전
            프로그램입니다. 사내 AI 활용을 개인 역량이 아닌 팀의 재사용 가능한 업무
            자산과 개발 표준으로 정착시킵니다.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-brand-blue shadow-sm">
            <ShieldCheck className="h-4 w-4 text-brand-orange" />
            ISO 국제표준 기반 AI 자격 연계 과정
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={ctaHref}>
              <BrandButton variant="primary" size="lg">
                도입 문의하기 <ArrowRight className="h-4 w-4" />
              </BrandButton>
            </Link>
            {!standalone && (
              <Link href="/courses">
                <BrandButton variant="outline" size="lg">
                  교육과정 보기
                </BrandButton>
              </Link>
            )}
          </div>
        </PageShell>
      </section>

      {/* 프로그램 소개 + 전체 안내 포스터 */}
      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-orange">
                프로그램 소개
              </p>
              <h2 className="text-3xl font-extrabold text-brand-blue">
                AI 도구 사용법 교육이 아닙니다
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                AX 워크톤은 Harness와 Agent Skills 커리큘럼을 기반으로 한 기업 AX
                실전 교육 브랜드입니다. 참가자가 자기 업무를 가져와 AI 워크플로로
                전환하고 결과물을 도출하는 워크톤 방식으로 운영됩니다.
              </p>
              <div className="mt-6 rounded-2xl border border-brand-blue-subtle bg-brand-blue-subtle/60 p-5">
                <p className="text-base font-bold leading-relaxed text-brand-blue">
                  조직이 AI 자동화를 안전하게 반복하기 위한{' '}
                  <span className="text-brand-orange">업무 표준화</span>와{' '}
                  <span className="text-brand-orange">개발 하네스 구축</span>{' '}
                  교육입니다.
                </p>
              </div>
            </div>
            <figure className="mx-auto w-full max-w-md">
              <Image
                src="/promotion/ax-workthon-overview.jpg"
                alt="AX 워크톤 전체 안내 — 프로그램 소개·체계·트랙·기대 효과"
                width={1055}
                height={1491}
                sizes="(max-width: 1024px) 90vw, 40vw"
                priority
                className="h-auto w-full rounded-2xl border border-border shadow-lg"
              />
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                AX 워크톤 전체 안내 포스터
              </figcaption>
            </figure>
          </div>
        </PageShell>
      </Section>

      {/* 프로그램 체계 (3단계) */}
      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">
              프로그램 체계
            </h2>
            <p className="mt-3 text-muted-foreground">
              도입 워크숍부터 조직 표준 수립까지, 목표에 맞는 기간을 선택하세요
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <BrandCard
                  key={tier.name}
                  accent={tier.accent}
                  padding="lg"
                  className="flex h-full flex-col"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${tier.iconBg}`}
                    >
                      <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                    </div>
                    <span className="rounded-full bg-brand-blue px-3 py-1 text-sm font-bold text-white">
                      {tier.badge}
                    </span>
                  </div>
                  <BrandCardTitle className="text-lg">{tier.name}</BrandCardTitle>
                  <p className="mt-1 text-sm font-semibold text-brand-sky">
                    {tier.sub}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tier.desc}
                  </p>
                </BrandCard>
              );
            })}
          </div>
        </PageShell>
      </Section>

      {/* 대상별 트랙 */}
      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">대상별 트랙</h2>
            <p className="mt-3 text-muted-foreground">
              같은 프로그램을 비개발자·개발자 두 관점으로 나눠 진행합니다
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <BrandCard
                  key={track.name}
                  accent={track.accent}
                  padding="lg"
                  className="flex h-full flex-col"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${track.iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${track.iconColor}`} />
                  </div>
                  <BrandCardTitle className="text-lg">{track.name}</BrandCardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {track.question}
                  </p>
                  <p className="mt-5 text-xs font-bold uppercase tracking-wide text-brand-orange">
                    산출물
                  </p>
                  <ul className="mt-2 space-y-2">
                    {track.deliverables.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </BrandCard>
              );
            })}
          </div>
        </PageShell>
      </Section>

      {/* 왜 필요한가 */}
      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">왜 필요한가</h2>
            <p className="mt-3 text-muted-foreground">
              개인 역량에 기대던 AI 활용을 팀의 표준과 자산으로 바꿉니다
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {whyPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <p className="text-sm leading-relaxed text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </Section>

      {/* 트랙별 상세 안내 (포스터 갤러리) */}
      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">
              트랙별 상세 안내
            </h2>
            <p className="mt-3 text-muted-foreground">
              포스터를 눌러 트랙·기간별 커리큘럼과 준비물을 자세히 확인하세요
            </p>
          </div>

          <div className="mb-10">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-orange" />
              <h3 className="text-xl font-bold text-foreground">비개발자 트랙</h3>
            </div>
            <PromoPosterGallery posters={nonDevTrackPosters} columns={3} />
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-brand-blue" />
              <h3 className="text-xl font-bold text-foreground">개발자 트랙</h3>
            </div>
            <PromoPosterGallery posters={devTrackPosters} columns={3} />
          </div>
        </PageShell>
      </Section>

      {/* 실무 적용 사례 (Use Case) */}
      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">
              실무 적용 사례 (Use Case)
            </h2>
            <p className="mt-3 text-muted-foreground">
              직군별 반복 업무를 사람 검토가 포함된 안전한 워크플로로 바꾼
              사례입니다. 현업·개발 두 관점의 사례를 포스터로 확인하세요.
            </p>
          </div>

          <div className="mb-10">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-orange" />
              <h3 className="text-xl font-bold text-foreground">
                현업·비개발자 실무 사례
              </h3>
            </div>
            <PromoPosterGallery posters={useCasePosters} columns={4} />
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-brand-blue" />
              <h3 className="text-xl font-bold text-foreground">
                개발자 실무 사례
              </h3>
            </div>
            <PromoPosterGallery posters={devUseCasePosters} columns={4} />
          </div>
        </PageShell>
      </Section>

      {/* 추천 운영 방식 */}
      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-brand-blue">
              추천 운영 방식
            </h2>
            <p className="mt-3 text-muted-foreground">
              조직의 준비 단계에 맞춰 비개발자·개발자 과정을 함께 구성합니다
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <div
                  key={rec.when}
                  className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-subtle">
                    <Icon className="h-6 w-6 text-brand-blue" />
                  </div>
                  <p className="font-bold text-foreground">{rec.when}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-sky">
                    {rec.plan}
                  </p>
                </div>
              );
            })}
          </div>
        </PageShell>
      </Section>

      {/* 기대 효과 + 도입 전 준비 */}
      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="grid gap-6 md:grid-cols-2">
            <BrandCard accent="green" padding="lg">
              <BrandCardTitle className="text-lg">교육 후 기대 효과</BrandCardTitle>
              <ul className="mt-4 space-y-3">
                {expectedEffects.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </BrandCard>
            <BrandCard accent="blue" padding="lg">
              <BrandCardTitle className="text-lg">도입 전 준비</BrandCardTitle>
              <ul className="mt-4 space-y-3">
                {prepChecklist.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </BrandCard>
          </div>
        </PageShell>
      </Section>

      {/* CTA */}
      <section className="bg-banner-gradient py-16">
        <div className="mx-auto max-w-3xl px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold">
            리스크를 줄이는 협업형 AX 교육
          </h2>
          <p className="mt-3 text-white/80">
            AX 워크톤으로 팀의 AI 자동화를 안전하게 표준화하세요. 목표와 규모를
            알려주시면 맞춤 커리큘럼과 일정을 안내해 드립니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={ctaHref}>
              <BrandButton size="lg" className="min-h-11 shadow-lg">
                도입 문의하기 <ArrowRight className="h-4 w-4" />
              </BrandButton>
            </Link>
            {!standalone && (
              <Link href="/courses">
                <BrandButton
                  size="lg"
                  variant="outline"
                  className="min-h-11 border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:ring-white"
                >
                  교육과정 보기
                </BrandButton>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
