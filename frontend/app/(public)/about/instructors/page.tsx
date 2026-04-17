import type { Metadata } from 'next';
import { GraduationCap, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: '대표 강사 소개',
  description: 'AcademiQ 대표 강사 이현길, 남동선의 소개와 주요 약력입니다.',
};

const instructors = [
  {
    name: '이현길',
    summary: [
      '이현길은 네이버 블로그 「통마정(통합마케팅정보)」의 운영자로, 누적 방문자 1,200만 이상을 기록한 파워블로거이다.',
      '연세대학교 생물학과에서 수학했으며, 온라인과 오프라인을 아우르는 마케팅 및 국내외 유통 분야에서 풍부한 경험을 쌓아왔다.',
      '그는 특히 네이버 블로그 최적화, 검색엔진 로직 변화 대응 전략, AI 도구 활용을 중심으로 한 온라인 마케팅 콘텐츠를 제작해왔다.',
      '마케팅 실무 관점의 도서 집필과 강의 활동을 병행하며, “네이버 블로그 세팅을 AI로 활용하는 방법”과 같은 실용적인 주제를 다룬 글과 영상을 통해 변화하는 디지털 환경 속에서 독자들이 효과적으로 대응할 수 있도록 돕고 있다.',
    ],
    careers: [
      '네이버 블로그 「통마정(통합마케팅정보)」 운영 파워블로거',
      '서울시소상공인연합회 온라인교육 및 정보지원 컨설턴트 역임',
      'ISO/IEC, SCC, IQCS 국제 AI부문 자격증 Evaluator & Invigilator',
      'AI ISO17024 교육 및 자격증 발급 심사 전담 기업 GTC 대표',
      '마케팅 실무 도서 『네이버 블로그 마스터』 대표 저자',
    ],
  },
  {
    name: '남동선',
    summary: [
      '남동선은 음성인식, 전자문서, 그래픽스, 인공지능(AI) 관련 분야를 전공 및 전문영역으로 연구해 온 기술 전문가이다.',
      '서일대학교 전)겸임교수로서 음성인식과 인공지능(AI), 증강현실(AR)·가상현실(VR), 전자출판 등 다양한 분야를 아우르는 폭넓은 연구와 실무 경험을 보유하고 있다.',
      '특히 EPUB을 비롯한 전자출판 기술과 장애인 접근성 연구에 집중해왔으며, 국제 표준화 기구 ISO/IEC JTC1 SC34 및 TC171의 국내 대표위원으로 활동하며 국제 표준 제정에도 기여하고 있다.',
      '2000년대 초부터 10여 년간 아래한글 개발에 참여했으며, 이후 사물인터넷(IoT), 펌웨어, 모바일 애플리케이션 개발 등 다양한 영역에서 기술력을 축적해왔다.',
      '또한 AcademiQ 플랫폼을 포함해 에이전틱 코딩(Agentic Coding)과 바이브 코딩(Vibe Coding) 기반의 다수 플랫폼 개발 및 기술 컨설팅 프로젝트를 수행하며, AI 실무 도입과 서비스 고도화를 지원하고 있다.',
      '현재도 연구, 교육, 저술, 표준화 활동을 통해 학계와 산업계를 연결하는 가교로서, 미래 디지털 환경과 지식 생태계 발전에 힘쓰고 있다.',
    ],
    careers: [
      '한글과컴퓨터 팀장/실장 역임',
      '아래한글, 한컴오피스 10여 년 이상 개발',
      '인공지능 지도사 자격 보유',
      'AcademiQ 플랫폼 포함 에이전틱/바이브 코딩 기반 플랫폼 개발 및 컨설팅 수행',
      'ISO TC171 한국위원회 대표위원',
      'ISO TC46 SC11 표준화위원',
      'ISO/IEC JTC1 SC34 표준화위원',
      '전)서일대학교 미디어출판학과 겸임교수',
      'PDF Association DocRM LWG Co-Chair',
      '전)한국출판문화학회 홍보이사',
    ],
  },
];

interface BookOffer {
  id: string;
  title: string;
}

const INSTRUCTOR_BOOKS: Record<string, BookOffer[]> = {
  이현길: [
    { id: 'book-blog-master', title: '네이버 블로그 마스터 (마케팅 실무 도서)' },
    { id: 'book-prompt-engineer', title: 'IQCS AI PROMPT ENGINEER - ISO 자격증 과정' },
    { id: 'book-creator', title: 'IQCS AI Creator - ISO 국제표준 자격증 과정' },
  ],
  남동선: [
    { id: 'book-intro-2', title: 'IQCS 국제 AI 실습 입문 2 - AI, 낯설지만 필요한 이야기' },
    { id: 'book-intro-1', title: 'IQCS 국제 AI 실습 입문 1 - AI, 낯설지만 필요한 이야기' },
  ],
};

export default function InstructorsPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-orange)' }}>
            대표 강사 소개
          </p>
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>
            AcademiQ 대표 강사진
          </h1>
          <p className="text-gray-600">
            실무와 교육 현장을 연결하는 대표 강사의 전문성과 주요 이력을 소개합니다.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          {instructors.map((instructor) => (
            <article key={instructor.name} className="bg-white rounded-2xl border p-8">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--brand-blue-subtle)' }}
                >
                  <UserCheck className="w-6 h-6" style={{ color: 'var(--brand-blue)' }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{instructor.name}</h2>
              </div>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                {instructor.summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 rounded-xl border p-5" style={{ backgroundColor: 'var(--brand-blue-subtle)' }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" style={{ color: 'var(--brand-orange)' }} />
                  주요약력
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {instructor.careers.map((career) => (
                    <li key={career}>- {career}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-xl border p-5 bg-white">
                <h3 className="font-bold text-gray-900 mb-3">대표 교재 (저자)</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {(INSTRUCTOR_BOOKS[instructor.name] ?? []).map((book) => (
                    <li key={book.id}>- {book.title}</li>
                  ))}
                  {(INSTRUCTOR_BOOKS[instructor.name] ?? []).length === 0 && (
                    <li>- 등록된 대표 교재가 없습니다.</li>
                  )}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
