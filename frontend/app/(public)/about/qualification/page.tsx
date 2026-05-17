import Link from 'next/link';
import { Globe, Shield, Award, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ISO/IEC 17024 자격 개요',
  description: 'ISO/IEC 17024 국제 표준 기반 AI 개인 자격 인증 체계와 공신력을 확인하세요.',
};

const qualifications = [
  { name: 'AI 활용 전문가', level: '1급', desc: '생성형 AI를 업무 및 실생활에 효과적으로 활용' },
  { name: 'AI 활용 전문가', level: '2급', desc: '기초 AI 도구 활용 및 프롬프트 엔지니어링' },
  { name: 'AI 교육 지도사', level: '1급', desc: 'AI 교육 과정 설계 및 강의 역량 인증' },
  { name: 'AI 콘텐츠 전문가', level: '1급', desc: 'AI 기반 콘텐츠 기획·제작·운영' },
];

export default function QualificationPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <PageShell size="content" flush>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-brand-blue">소개</Link>
            <span>/</span>
            <span className="text-brand-blue" >ISO/IEC 17024 자격 개요</span>
          </div>
          <BrandBadge variant="blue" dot className="mb-3">국제 표준 인증</BrandBadge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-brand-blue" >
            ISO/IEC 17024<br />자격 개요
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            세계가 인정하는 국제 표준 ISO/IEC 17024 기반의 공신력 있는 AI 분야 개인 자격 인증입니다.
          </p>
        </PageShell>
      </section>

      <section className="py-14 bg-white">
        <PageShell size="content" flush>
        <div className="space-y-10">
          {/* 자격 개요 */}
          <div>
            <h2 className="text-2xl font-bold mb-5 text-brand-blue" >자격 개요</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Globe, title: '국제 표준', desc: 'ISO/IEC 17024는 개인 자격 인증 기관에 대한 국제 표준으로, 전 세계 170여 개국에서 통용됩니다.' },
                { icon: Shield, title: '공신력', desc: '국제인정기구의 심사와 승인을 받은 자격으로, 객관적인 역량 인증이 가능합니다.' },
                { icon: Award, title: '차별성', desc: '단순 교육 이수증이 아닌, 엄격한 평가를 통해 취득하는 개인 역량 자격증입니다.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <BrandCard key={item.title} accent="blue" padding="md">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-brand-blue-subtle">
                      <Icon className="w-5 h-5 text-brand-blue"  />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </BrandCard>
                );
              })}
            </div>
          </div>

          {/* 자격 종류 */}
          <div>
            <h2 className="text-2xl font-bold mb-5 text-brand-blue" >자격 종류</h2>
            <div className="space-y-3">
              {qualifications.map((q) => (
                <div key={q.name + q.level} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-brand-sky transition-colors">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-brand-orange"  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{q.name}</span>
                      <BrandBadge variant="orange">{q.level}</BrandBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </PageShell>
      </section>

      {/* CTA */}
      <section className="py-10 bg-muted/30 border-t">
        <PageShell size="narrow" flush className="text-center">
          <Link href="/courses">
            <BrandButton variant="primary" size="lg">
              교육과정 보기 <ArrowRight className="w-4 h-4" />
            </BrandButton>
          </Link>
        </PageShell>
      </section>
    </div>
  );
}
