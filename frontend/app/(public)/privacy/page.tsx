import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침', description: 'AcademiQ 개인정보처리방침입니다.' };

const sections = [
  { title: '1. 수집하는 개인정보 항목', content: '회사는 다음과 같은 개인정보를 수집합니다.\n\n[필수 항목]\n- 회원가입 시: 이름, 이메일 주소, 비밀번호, 연락처\n- 결제 시: 결제 수단 정보 (카드번호는 PG사에서 처리, 회사 미보유)\n- 시험 접수 시: 성명, 생년월일, 연락처, 주소\n\n[자동 수집 항목]\n- 서비스 이용 기록, 접속 IP, 쿠키, 브라우저 정보' },
  { title: '2. 개인정보 수집 및 이용 목적', content: '회사는 수집한 개인정보를 다음의 목적으로 이용합니다.\n- 회원 관리: 회원 식별, 본인 확인, 서비스 제공\n- 교육 서비스 제공: 수강 이력 관리, 수료증 발급, 학습 진도 관리\n- 시험 서비스 제공: 접수 확인, 합격자 발표, 자격증 발급\n- 결제 처리: 유료 서비스 결제 및 환불 처리\n- 공지 및 마케팅: 서비스 관련 중요 안내, 이벤트 정보 제공 (동의 시)' },
  { title: '3. 개인정보 보유 및 이용 기간', content: '회사는 회원 탈퇴 시까지 개인정보를 보유합니다. 단, 관련 법령에 의해 보존 의무가 있는 경우:\n- 계약·청약철회 관련: 5년 (전자상거래법)\n- 대금결제·재화공급 관련: 5년 (전자상거래법)\n- 소비자 불만·분쟁처리 관련: 3년 (전자상거래법)\n- 접속 로그: 3개월 (통신비밀보호법)' },
  { title: '4. 개인정보의 제3자 제공', content: '회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다.\n- 이용자가 사전에 동의한 경우\n- 법령에 의하여 제공이 요구되는 경우\n- 시험 주관 기관에 시험 접수 정보 제공 (이용자 동의 후)' },
  { title: '5. 개인정보 처리 위탁', content: '회사는 서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁합니다.\n- AWS (서버 운영 및 데이터 저장)\n- 포트원 (결제 처리)\n- Solapi (SMS 발송)\n위탁 업체들은 위탁 목적 외 개인정보를 처리하지 않습니다.' },
  { title: '6. 이용자의 권리', content: '이용자는 언제든지 다음의 권리를 행사할 수 있습니다.\n- 개인정보 조회·수정: 마이페이지에서 직접 확인 및 수정\n- 회원 탈퇴: 마이페이지 → 회원 탈퇴\n- 개인정보 처리 정지 요청: 고객센터 문의\n- 개인정보 삭제 요청: 고객센터 문의 (단, 법령상 보존 의무 있는 정보 제외)' },
  { title: '7. 개인정보보호 책임자', content: '개인정보보호 책임자\n- 성명: 전미헌\n- 직책: 대표자\n- 이메일: academiq2026@gmail.com\n- 전화: 010-4710-2203' },
  { title: '부칙', content: '이 방침은 2026년 1월 1일부터 시행됩니다.' },
];

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--brand-blue)' }}>개인정보처리방침</h1>
          <p className="text-gray-500 text-sm">최종 업데이트: 2026년 1월 1일</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-xl border p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">목차</p>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.title}>
                    <a href={`#${s.title}`} className="text-xs block py-0.5 hover:underline" style={{ color: 'var(--brand-blue)' }}>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {sections.map((s) => (
              <section key={s.title} id={s.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-white rounded-xl border p-5">
                  {s.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
