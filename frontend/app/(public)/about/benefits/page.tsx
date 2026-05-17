import type { Metadata } from 'next';
import { TrendingUp, Globe, Award, Briefcase, Users, Star } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = { title: '자격 취득 이점', description: 'AcademiQ AI 자격증 취득 시 얻을 수 있는 이점을 안내합니다.' };

const benefits = [
  { icon: Globe, accent: 'blue' as const, title: '국제적 공신력', desc: 'ISO/IEC 17024 국제 표준에 따라 인증된 자격으로, 글로벌 무대에서 역량을 증명할 수 있습니다.' },
  { icon: TrendingUp, accent: 'orange' as const, title: '경력 차별화', desc: 'AI 분야 전문성을 공식적으로 인증받아 취업 및 승진에서 경쟁 우위를 확보하세요.' },
  { icon: Award, accent: 'sky' as const, title: '정부 인정 자격', desc: '국내 공인 자격 기관의 검증을 거친 자격으로 기업 및 기관에서 공식적으로 인정받습니다.' },
  { icon: Briefcase, accent: 'green' as const, title: '취업/이직 우대', desc: '주요 IT 기업 및 공공기관에서 AI 자격 보유자에게 가산점 및 우대 혜택을 제공합니다.' },
  { icon: Users, accent: 'blue' as const, title: '전문가 네트워크', desc: '자격 취득 후 전국 AI 전문가 네트워크에 참여하여 정보를 공유하고 협업 기회를 넓히세요.' },
  { icon: Star, accent: 'orange' as const, title: '지속적 역량 개발', desc: '자격 유지 및 갱신 과정을 통해 빠르게 변화하는 AI 트렌드에 지속적으로 대응할 수 있습니다.' },
];

export default function BenefitsPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <PageShell flush>
          <p className="text-sm font-semibold mb-2 text-brand-orange">자격 취득 이점</p>
          <h1 className="text-3xl font-extrabold mb-3 text-brand-blue">왜 AcademiQ 자격이어야 하나요?</h1>
          <p className="text-muted-foreground max-w-2xl">ISO/IEC 17024 기반 AI 자격은 단순한 수료증이 아닙니다. 국제적으로 통용되는 역량 증명입니다.</p>
        </PageShell>
      </section>

      <section className="py-14">
        <PageShell flush>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, accent, title, desc }) => (
              <BrandCard key={title} accent={accent} padding="lg" className="flex gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-blue-subtle">
                  <Icon className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <BrandCardTitle className="mb-2">{title}</BrandCardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </section>
    </div>
  );
}
