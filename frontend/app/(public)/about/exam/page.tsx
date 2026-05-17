import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ClipboardCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시험 안내',
  description: '시험 응시 절차, 준비물, 일정을 확인하고 온라인으로 접수하세요.',
};

const steps = [
  { num: 1, title: '수강 신청 및 학습', desc: '관련 교육과정을 수강하고 학습을 완료합니다.' },
  { num: 2, title: '시험 회차 선택', desc: '원하는 시험 일정과 자격 종류를 선택합니다.' },
  { num: 3, title: '응시 신청서 작성', desc: '개인정보 및 응시 정보를 입력합니다.' },
  { num: 4, title: '응시료 결제', desc: '온라인으로 응시료를 결제합니다.' },
  { num: 5, title: '접수 완료 확인', desc: '마이페이지에서 접수 내역을 확인합니다.' },
  { num: 6, title: '시험 응시', desc: '안내된 일시와 장소에서 시험을 응시합니다.' },
];

const prepItems = ['신분증 (주민등록증, 운전면허증, 여권 중 택 1)', '수험표 (접수 완료 후 마이페이지에서 출력)', '필기구'];

export default function ExamGuidePage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <PageShell size="content" flush>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-brand-blue">소개</Link>
            <span>/</span>
            <span className="text-brand-blue" >시험 안내</span>
          </div>
          <BrandBadge variant="orange" dot className="mb-3">시험 안내</BrandBadge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-brand-blue" >
            시험 안내
          </h1>
          <p className="text-lg text-muted-foreground">
            응시 절차와 준비물을 확인하고 시험을 준비하세요.
          </p>
        </PageShell>
      </section>

      <section className="py-14 bg-white">
        <PageShell size="content" flush>
        <div className="space-y-12">
          {/* 응시 절차 */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-brand-blue" >응시 절차</h2>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                      i % 2 === 0 ? 'bg-brand-blue' : 'bg-brand-orange',
                    )}
                  >
                    {step.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 준비물 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-brand-blue" >응시 준비물</h2>
            <BrandCard accent="orange" padding="lg">
              <ul className="space-y-3">
                {prepItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-brand-orange"  />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </BrandCard>
          </div>

          {/* 유의사항 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-brand-blue" >유의사항</h2>
            <BrandCard padding="lg" className="border-yellow-200 bg-yellow-50">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 space-y-2">
                  <p>• 접수 마감 이후에는 취소 및 환불이 제한될 수 있습니다.</p>
                  <p>• 시험 당일 신분증 미지참 시 응시가 불가합니다.</p>
                  <p>• 자세한 사항은 시험 공고문을 반드시 확인하세요.</p>
                </div>
              </div>
            </BrandCard>
          </div>
        </div>
        </PageShell>
      </section>

      <section className="py-10 bg-muted/30 border-t">
        <PageShell size="narrow" flush className="text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/exam">
              <BrandButton variant="primary" size="lg">
                시험 접수 바로가기 <ArrowRight className="w-4 h-4" />
              </BrandButton>
            </Link>
            <Link href="/contact">
              <BrandButton variant="outline">문의하기</BrandButton>
            </Link>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
