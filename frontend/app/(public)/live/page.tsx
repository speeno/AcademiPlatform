import Link from 'next/link';
import {
  Radio, Calendar, Clock, Video, Users, ArrowRight, ExternalLink,
  PlayCircle, Bell, MessageSquare,
} from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '라이브 & 설명회 | AcademiQ',
  description: 'AcademiQ 라이브 세션과 온라인 설명회 일정을 확인하고 참여하세요.',
};

interface LiveSession {
  id: string;
  type: 'live' | 'info';
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  status: 'upcoming' | 'live' | 'ended';
  participants?: number;
  youtubeUrl?: string;
  registerUrl?: string;
}

const sessions: LiveSession[] = [
  {
    id: '1',
    type: 'info',
    title: 'AI ISO 국제자격증 과정 온라인 설명회',
    description:
      'ISO/IEC 17024 기반 AI 국제자격증의 가치와 취득 방법, 교육 과정 커리큘럼을 상세히 안내합니다. 자격증 취득에 관심 있으신 분 누구나 참여 가능합니다.',
    date: '2026-03-25',
    time: '19:00',
    duration: '60분',
    instructor: 'AcademiQ 교육팀',
    status: 'upcoming',
    participants: 48,
    registerUrl: '/contact',
  },
  {
    id: '2',
    type: 'live',
    title: 'AI Creator 과정 — 딥러닝 핵심 개념 라이브 강의',
    description:
      '딥러닝의 기본 원리부터 CNN·RNN·LSTM까지 핵심 개념을 실시간으로 강의합니다. 수강생 대상 Q&A 세션 포함.',
    date: '2026-03-28',
    time: '19:30',
    duration: '90분',
    instructor: 'AI GTC 교수진',
    status: 'upcoming',
    participants: 32,
    registerUrl: '/contact',
  },
  {
    id: '3',
    type: 'info',
    title: '생성형 AI 비즈니스 활용 설명회',
    description:
      '실무에서 바로 활용할 수 있는 생성형 AI 도구와 비즈니스 도입 전략을 소개합니다. AI 입문 실습서 내용을 바탕으로 진행됩니다.',
    date: '2026-04-05',
    time: '14:00',
    duration: '60분',
    instructor: 'AcademiQ 교육팀',
    status: 'upcoming',
    participants: 65,
    registerUrl: '/contact',
  },
];

const pastSessions = [
  {
    id: 'p1',
    title: 'AI ISO 자격증 1기 설명회 다시보기',
    description: 'ISO/IEC 17024 AI 국제자격증 1기 설명회 녹화 영상입니다.',
    youtubeId: 'dQw4w9WgXcQ',
    date: '2026-02-15',
    views: 1240,
  },
  {
    id: 'p2',
    title: 'AI 프롬프트 엔지니어링 라이브 강의 다시보기',
    description: '효과적인 AI 프롬프트 설계 방법론을 실습과 함께 배웁니다.',
    youtubeId: 'dQw4w9WgXcQ',
    date: '2026-02-22',
    views: 872,
  },
];

const statusConfig = {
  upcoming: { label: '예정', variant: 'blue' as const, dot: true },
  live:     { label: '진행 중', variant: 'red' as const, dot: true },
  ended:    { label: '종료', variant: 'gray' as const, dot: false },
};

const typeLabel = { live: '라이브 강의', info: '설명회' };

export default function LivePage() {
  const now = new Date();

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border border-brand-blue text-brand-blue bg-brand-blue-subtle">
            <Radio className="w-3.5 h-3.5" />
            <span>라이브 & 설명회</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            전문가와 함께하는<br />
            <span className="text-brand-blue" >라이브 세션 & 설명회</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            AI 자격증 취득 전략부터 최신 AI 트렌드까지, 실시간으로 전문가에게 직접 배우고 질문하세요.
            모든 세션은 참여 신청 후 무료로 참여 가능합니다.
          </p>
          <div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-brand-blue" >30+</p>
              <p className="mt-0.5">2026년 목표 세션</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-brand-orange" >2,000+</p>
              <p className="mt-0.5">2026년 목표 참여자</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-brand-blue" >100%</p>
              <p className="mt-0.5">무료 참여</p>
            </div>
          </div>
        </PageShell>
      </section>

      {/* 예정된 세션 */}
      <section className="py-14 bg-white">
        <PageShell flush>
          <div className="flex items-center gap-2 mb-8">
            <Calendar className="w-5 h-5 text-brand-blue"  />
            <h2 className="text-xl font-extrabold text-foreground">예정된 세션</h2>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => {
              const sc = statusConfig[session.status];
              return (
                <BrandCard key={session.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* 날짜 블록 */}
                    <div className="flex-shrink-0 text-center bg-muted/30 rounded-xl px-5 py-3 border min-w-[80px]">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {new Date(session.date).toLocaleDateString('ko-KR', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-extrabold text-foreground">
                        {new Date(session.date).getDate()}
                      </p>
                      <p className="text-xs text-muted-foreground">{session.time}</p>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <BrandBadge variant={session.type === 'live' ? 'red' : 'blue'} dot={false} className="text-xs">
                          {typeLabel[session.type]}
                        </BrandBadge>
                        <BrandBadge variant={sc.variant} dot={sc.dot} className="text-xs">
                          {sc.label}
                        </BrandBadge>
                      </div>
                      <h3 className="font-bold text-foreground text-base mb-1">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {session.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {session.participants}명 신청
                        </span>
                        <span>{session.instructor}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0 self-center sm:self-start">
                      {session.status === 'live' ? (
                        <Link href={session.registerUrl ?? '/contact'}>
                          <BrandButton variant="primary" size="sm">
                            <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
                            지금 참여
                          </BrandButton>
                        </Link>
                      ) : session.status === 'upcoming' ? (
                        <Link href={session.registerUrl ?? '/contact'}>
                          <BrandButton variant="outline" size="sm">
                            <Bell className="w-3.5 h-3.5 mr-1" />
                            신청하기
                          </BrandButton>
                        </Link>
                      ) : (
                        <BrandButton variant="ghost" size="sm" disabled>
                          종료됨
                        </BrandButton>
                      )}
                    </div>
                  </div>
                </BrandCard>
              );
            })}
          </div>
        </PageShell>
      </section>

      {/* 지난 세션 다시보기 */}
      <section className="py-14 bg-muted/30 border-t">
        <PageShell flush>
          <div className="flex items-center gap-2 mb-8">
            <PlayCircle className="w-5 h-5 text-brand-orange"  />
            <h2 className="text-xl font-extrabold text-foreground">지난 세션 다시보기</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {pastSessions.map((ps) => (
              <BrandCard key={ps.id} className="overflow-hidden p-0">
                {/* 썸네일 */}
                <div className="relative aspect-video bg-brand-blue-dark">
                  <img
                    src={`https://img.youtube.com/vi/${ps.youtubeId}/mqdefault.jpg`}
                    alt={ps.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={`https://www.youtube.com/watch?v=${ps.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <PlayCircle className="w-8 h-8 text-brand-blue"  />
                    </a>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <BrandBadge variant="gray" className="text-xs bg-black/60 text-white border-0">
                      <Video className="w-3 h-3 mr-1" />
                      다시보기
                    </BrandBadge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-sm mb-1">{ps.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ps.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(ps.date).toLocaleDateString('ko-KR')}</span>
                    <span>{ps.views.toLocaleString()}회 시청</span>
                  </div>
                </div>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </section>

      {/* 설명회 신청 CTA */}
      <section className="py-16 bg-white border-t">
        <PageShell size="content" flush className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow bg-brand-blue-subtle">
            <MessageSquare className="w-7 h-7 text-brand-blue" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-3">
            원하는 주제의 설명회를 요청하세요
          </h2>
          <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
            특정 주제에 대한 라이브 설명회나 Q&A 세션이 필요하시다면 1:1 문의를 통해 요청해 주세요.
            가능한 한 빠르게 일정을 안내해 드리겠습니다.
          </p>
          <Link href="/contact">
            <BrandButton variant="primary" size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              설명회 신청 / 문의하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </BrandButton>
          </Link>
        </PageShell>
      </section>
    </div>
  );
}
