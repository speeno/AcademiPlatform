import type { Metadata } from 'next';
import { Building2, GraduationCap, Hospital, Factory, ShoppingBag, Landmark, Cpu, Film } from 'lucide-react';

export const metadata: Metadata = { title: 'AI 활용 분야', description: 'AI 자격 취득 후 활동 가능한 분야를 안내합니다.' };

const fields = [
  { icon: Building2, title: 'IT/소프트웨어', desc: 'AI 개발, 데이터 분석, ML 엔지니어링 등 핵심 기술 분야에서 전문성을 발휘하세요.', examples: ['AI 개발자', '데이터 사이언티스트', 'ML 엔지니어'] },
  { icon: GraduationCap, title: '교육', desc: 'AI 교육 지도사 자격으로 학교·기업·평생교육기관에서 AI 교육을 진행하세요.', examples: ['AI 강사', '교육 컨설턴트', '기업 트레이너'] },
  { icon: Hospital, title: '헬스케어·바이오', desc: '의료 AI, 헬스케어 데이터 분석, 신약 개발 지원 등 혁신 분야에 참여하세요.', examples: ['의료 AI 분석가', '헬스케어 컨설턴트'] },
  { icon: Factory, title: '제조·스마트팩토리', desc: '스마트 제조, 품질 관리 자동화, 예지 정비 등 산업 현장에 AI를 접목하세요.', examples: ['스마트팩토리 전문가', 'AI 품질 관리자'] },
  { icon: ShoppingBag, title: '유통·마케팅', desc: '고객 분석, 개인화 추천, 수요 예측 등 비즈니스 성장을 이끄는 AI 전문가가 되세요.', examples: ['마케팅 AI 분석가', '이커머스 전문가'] },
  { icon: Landmark, title: '금융·핀테크', desc: '리스크 평가, 사기 탐지, 투자 분석 등 금융 AI 분야의 전문 인력을 목표로 하세요.', examples: ['금융 AI 분석가', '핀테크 컨설턴트'] },
  { icon: Cpu, title: '공공·정부', desc: '스마트시티, 공공 데이터 분석, 행정 자동화 등 사회 문제 해결에 AI를 활용하세요.', examples: ['공공 데이터 전문가', 'AI 정책 컨설턴트'] },
  { icon: Film, title: '콘텐츠·미디어', desc: 'AI 콘텐츠 생성, 영상 분석, 미디어 자동화 등 창의적 AI 활용 분야를 개척하세요.', examples: ['AI 콘텐츠 크리에이터', '미디어 분석가'] },
];

export default function FieldsPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-orange)' }}>활동 분야</p>
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>AI 자격으로 활동할 수 있는 분야</h1>
          <p className="text-gray-600">AcademiQ AI 자격은 다양한 산업 분야에서 폭넓게 활용됩니다.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {fields.map(({ icon: Icon, title, desc, examples }) => (
              <div key={title} className="bg-white rounded-2xl border p-6 flex gap-5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-logo)' }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.map((ex) => (
                      <span key={ex} className="text-xs px-2 py-0.5 rounded-full border" style={{ color: 'var(--brand-blue)', borderColor: 'var(--brand-blue-light)' }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
