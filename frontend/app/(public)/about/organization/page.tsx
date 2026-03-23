import type { Metadata } from 'next';
import { Building, Target, Eye, Heart } from 'lucide-react';

export const metadata: Metadata = { title: '기관 소개', description: '맨도롱북스 운영 기관을 소개합니다.' };

export default function OrganizationPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-orange)' }}>기관 소개</p>
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>AcademiQ 운영 기관</h1>
          <p className="text-gray-600">출판과 교육을 함께 운영하는 맨도롱북스의 전문 교육 브랜드입니다.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 space-y-10">
          {/* 기관 개요 */}
          <div className="bg-white rounded-2xl border p-8 flex gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-logo)' }}>
              <Building className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">맨도롱북스</h2>
              <p className="text-gray-600 leading-relaxed">
                맨도롱북스는 출판과 교육 사업을 함께 운영하는 출판 교육 업체로,
                실무에서 바로 활용 가능한 콘텐츠를 기획·제작하고 이를 교육과정으로 연결해 학습 성과를 높이고 있습니다.
                교재 출판부터 온라인 학습 콘텐츠, 자격시험 연계 프로그램까지 하나의 흐름으로 제공하여
                학습자가 결제 즉시 학습을 시작하고 자격 취득까지 이어갈 수 있도록 설계된 통합 교육 경험을 제공합니다.
              </p>
            </div>
          </div>

          {/* 미션/비전/가치 */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, color: 'var(--brand-blue)', bg: 'var(--brand-blue-subtle)', title: '미션', content: 'AI 기술 역량을 국제 표준으로 인증하여 개인과 조직의 성장을 지원합니다.' },
              { icon: Eye, color: 'var(--brand-orange)', bg: 'var(--brand-orange-subtle)', title: '비전', content: '아시아를 대표하는 AI 자격 인증 기관으로 성장하여 글로벌 AI 인재 허브를 구축합니다.' },
              { icon: Heart, color: 'var(--brand-sky)', bg: 'var(--brand-sky-subtle)', title: '핵심 가치', content: '공정성·신뢰성·혁신·포용성을 바탕으로 모든 이에게 AI 역량 개발 기회를 제공합니다.' },
            ].map(({ icon: Icon, color, bg, title, content }) => (
              <div key={title} className="bg-white rounded-2xl border p-6 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: bg }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>

          {/* 주요 현황 */}
          <div className="bg-white rounded-2xl border p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2026년 목표</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '2,400+', label: '목표 자격 취득자' },
                { value: '94%', label: '목표 취업/승진 만족도' },
                { value: '15+', label: '목표 협력 기업·기관' },
                { value: '4종', label: '목표 AI 자격 종류' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold mb-1" style={{ color: 'var(--brand-orange)' }}>{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 주소 */}
          <div className="bg-white rounded-2xl border p-6 text-sm text-gray-600 space-y-2">
            <h3 className="font-bold text-gray-900 mb-3">연락처</h3>
            <p>📍 성사동 롯데캐슬스카이엘 107-2301</p>
            <p>📞 010-4710-2203</p>
            <p>✉️ academiq2026@gmail.com</p>
            <p>🕒 운영시간: 평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
