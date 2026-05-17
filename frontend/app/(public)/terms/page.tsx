import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = { title: '이용약관', description: 'AcademiQ 서비스 이용약관입니다.' };

const sections = [
  { title: '제1조 (목적)', content: '이 약관은 맨도롱북스(이하 "회사")가 운영하는 AcademiQ 플랫폼(이하 "서비스")을 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.' },
  { title: '제2조 (정의)', content: '"서비스"란 회사가 제공하는 AI 자격 교육 플랫폼 및 관련 제반 서비스를 의미합니다.\n"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.\n"회원"이란 회사에 개인정보를 제공하여 회원 등록을 한 자로서 서비스를 지속적으로 이용할 수 있는 자를 말합니다.' },
  { title: '제3조 (약관의 효력 및 변경)', content: '이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 이 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이후부터 효력이 발생합니다.' },
  { title: '제4조 (서비스 이용)', content: '서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 원칙으로 합니다. 회사는 서비스 설비의 보수, 교체, 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.' },
  {
    title: '제5조 (결제 및 환불)',
    content:
      '유료 서비스 이용 시 결제는 신용카드, 체크카드, 계좌이체 등 회사가 제공하는 방법으로 합니다.\n\n' +
      '1. 강의 수강 환불\n' +
      '- 수강 시작 전: 전액 환불\n' +
      '- 수강 시작 후 7일 이내, 진도율 20% 미만: 전액 환불\n' +
      '- 수강 시작 후 7일 경과 또는 진도율 20% 이상: 잔여 기간에 비례하여 환불\n\n' +
      '2. 시험 접수 환불\n' +
      '- 북티켓 발급 전: 전액 환불\n' +
      '- 북티켓 발급 후: 접수비의 90% 환불\n' +
      '- 시험일 7일 전부터: 환불 불가\n\n' +
      '환불 처리는 신청일로부터 3~5 영업일이 소요됩니다.\n\n' +
      '사업자 정보:\n' +
      '- 상호: 맨도롱북스\n' +
      '- 사업자등록번호: 706-99-02056\n' +
      '- 대표자: 전미헌',
  },
  { title: '제6조 (저작권)', content: '서비스에서 제공되는 모든 콘텐츠(강의 영상, 교재, 자료 등)의 저작권은 회사 또는 원저작자에게 있습니다. 이용자는 서비스를 이용하여 얻은 정보를 회사의 사전 동의 없이 복제, 전송, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.' },
  { title: '제7조 (면책조항)', content: '회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.' },
  { title: '부칙', content: '이 약관은 2026년 1월 1일부터 시행합니다.' },
];

export default function TermsPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b border-border">
        <PageShell size="content" flush>
          <h1 className="text-heading mb-2 text-brand-blue">이용약관</h1>
          <p className="text-muted-foreground text-sm">최종 업데이트: 2026년 1월 1일</p>
        </PageShell>
      </section>

      <section className="py-10">
        <PageShell size="content" flush>
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 목차 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 bg-card rounded-xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">목차</p>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.title}>
                    <a
                      href={`#${s.title}`}
                      className="text-xs text-brand-blue hover:text-brand-blue-dark block py-0.5"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* 본문 */}
          <div className="lg:col-span-3 space-y-8">
            {sections.map((s) => (
              <section key={s.title} id={s.title}>
                <h2 className="text-subheading text-foreground mb-3">{s.title}</h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-card rounded-xl border border-border p-5">
                  {s.content}
                </div>
              </section>
            ))}
          </div>
        </div>
        </PageShell>
      </section>
    </div>
  );
}
