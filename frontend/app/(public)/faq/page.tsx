import type { Metadata } from 'next';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { getServerApiBase } from '@/lib/api-base';
import { PageShell } from '@/components/layout/PageShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '자주 묻는 질문 (FAQ)',
  description: 'AcademiQ 자주 묻는 질문과 답변을 확인하세요.',
};

async function getFaqs() {
  try {
    const res = await fetchWithTimeout(
      `${getServerApiBase()}/admin/faq`,
      { next: { revalidate: 600 } },
      8000,
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

const sampleFaqs = [
  { id: '1', category: '수강신청', question: '수강신청은 어떻게 하나요?', answer: '홈페이지에서 원하는 교육과정을 선택 후 [수강 및 전자책 구매] 버튼을 클릭하면 신청이 완료됩니다. 유료 과정의 경우 결제 후 수강이 시작됩니다.' },
  { id: '2', category: '수강신청', question: '수강 기간은 얼마나 되나요?', answer: '과정마다 수강 기간이 다릅니다. 각 과정 상세 페이지에서 수강 기간을 확인하실 수 있습니다. 일반적으로 60~90일입니다.' },
  { id: '3', category: '결제/환불', question: '결제 수단은 무엇이 있나요?', answer: '신용카드, 체크카드, 계좌이체, 가상계좌 등 다양한 결제 수단을 지원합니다.' },
  { id: '4', category: '결제/환불', question: '환불 정책이 어떻게 되나요?', answer: '수강 시작 후 7일 이내 미수강 시 전액 환불, 수강 시작 후 7일 경과 시 잔여 수강 기간에 따라 환불됩니다. 자세한 사항은 이용약관을 참고해 주세요.' },
  { id: '5', category: '시험접수', question: '시험 접수 후 취소가 가능한가요?', answer: '시험 접수 취소는 접수 마감일 7일 전까지 가능합니다. 취소 후 환불은 결제 방법에 따라 3~5 영업일 소요됩니다.' },
  { id: '6', category: '시험접수', question: '자격증 취득 후 유효기간이 있나요?', answer: 'AcademiQ AI 자격증은 취득일로부터 3년간 유효합니다. 갱신 교육 이수 후 자격증을 갱신할 수 있습니다.' },
  { id: '7', category: '교재', question: '온라인 교재를 다운로드할 수 있나요?', answer: '온라인 교재는 보안 정책에 따라 다운로드가 지원되지 않으며, 웹 브라우저를 통해서만 열람 가능합니다.' },
];

const paymentPolicyFaq = {
  id: 'policy-payment-content-access',
  category: '결제/환불',
  question: '온라인 결제는 어떤 방식으로 제공되나요?',
  answer: '모든 수강 등록과 함께 동영상 강의와 전자책이 제공됩니다. 전자책은 본 교육사이트 또는 북이오 전자책 플랫폼을 통해 이용할 수 있습니다. 온라인 결제는 기본적으로 자격증 교재 구매 비용 결제를 기준으로 진행되며, 결제 완료와 동시에 해당 도서(온라인 교재)에 즉시 접근 가능합니다. 또한 같은 결제 흐름에서 ISO 자격시험 등록까지 연계할 수 있어, 결제 즉시 온라인 콘텐츠를 바로 사용할 수 있는 상태로 제공됩니다.',
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  const baseList = faqs.length > 0 ? faqs : sampleFaqs;
  const list = [
    ...baseList.filter((f: any) => f.question !== paymentPolicyFaq.question),
    paymentPolicyFaq,
  ];

  const categories = [...new Set(list.map((f: any) => f.category))];

  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <PageShell size="content" flush>
          <h1 className="text-3xl font-extrabold mb-2 text-brand-blue">자주 묻는 질문</h1>
          <p className="text-muted-foreground">궁금한 사항을 빠르게 찾아보세요.</p>
        </PageShell>
      </section>

      <section className="py-10">
        <PageShell size="content" flush>
          <div className="space-y-10">
            {categories.map((cat) => (
              <div key={cat as string}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-brand-blue">
                  <HelpCircle className="w-5 h-5" /> {cat as string}
                </h2>
                <div className="space-y-2">
                  {list
                    .filter((f: any) => f.category === cat)
                    .map((faq: any) => (
                      <details key={faq.id} className="bg-white border rounded-xl group overflow-hidden">
                        <summary className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-muted/30">
                          <span className="font-medium text-foreground flex-1">{faq.question}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t bg-muted/30">
                          <div className="pt-4">{faq.answer}</div>
                        </div>
                      </details>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </section>
    </div>
  );
}
