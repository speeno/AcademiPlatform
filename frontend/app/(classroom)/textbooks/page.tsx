'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, BookOpen, ShoppingCart } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';

interface Textbook {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
  price: number;
}

const BASIC_PACKAGE_TOPICS = [
  '생성형 AI 이해하기',
  '프롬프트 작성의 기본',
  '텍스트 생성 활용법',
  '이미지 생성 체험하기',
  '문서·보고서 자동화',
  '데이터 요약과 분석',
  'AI와 협업하는 사고법',
  '윤리와 책임 있는 활용',
  '무료·쉬운 AI 도구 소개',
  '실습 중심 학습 프로젝트',
];

export default function TextbooksPage() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const ownedRes = await fetch(`${API_BASE}/textbooks`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        });
        if (ownedRes.ok) setTextbooks(await ownedRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-10">
      <PageHeader title="내 교재" description="접근 가능한 온라인 교재를 열람하세요." />

      <section className="rounded-2xl border bg-white p-6 sm:p-7">
        <h2 className="text-lg font-extrabold text-brand-blue">기본 교육 패키지</h2>
        <p className="text-sm text-muted-foreground mt-1">패키지 보기에 포함되는 기본 학습 항목입니다.</p>
        <ol className="mt-4 space-y-2 text-sm text-foreground list-decimal list-inside">
          {BASIC_PACKAGE_TOPICS.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ol>
      </section>

      {textbooks.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">접근 가능한 교재가 없습니다.</p>
          <p className="text-xs text-muted-foreground mb-4">
            강좌 수강 신청 시 교재가 자동으로 제공됩니다.
          </p>
          <Link href="/store/textbooks">
            <BrandButton variant="primary" size="sm">
              <ShoppingCart className="w-4 h-4 mr-1" />
              교재 더 구매하기
            </BrandButton>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {textbooks.map((book) => (
            <Link key={book.id} href={`/textbooks/${book.id}`}>
              <BrandCard hoverable accent="orange" padding="none" className="overflow-hidden h-full flex flex-col">
                <div className="h-44 flex items-center justify-center bg-logo-gradient">
                  {book.coverImageUrl ? (
                    <Image
                      src={book.coverImageUrl}
                      alt={book.title}
                      width={176}
                      height={176}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-white opacity-70" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <BrandCardTitle className="mb-1 line-clamp-2 text-sm">{book.title}</BrandCardTitle>
                  {book.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{book.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    {book.totalPages != null && book.totalPages > 0 && (
                      <span>{book.totalPages}페이지</span>
                    )}
                    <span className="font-semibold text-brand-orange">열람하기 →</span>
                  </div>
                </div>
              </BrandCard>
            </Link>
          ))}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-6 sm:p-7 text-center">
        <h2 className="text-lg font-extrabold text-brand-blue">단독 구매 교재</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          강좌와 별도로 교재만 구매하려면 교재 스토어를 이용하세요.
        </p>
        <Link href="/store/textbooks">
          <BrandButton variant="primary">
            <ShoppingCart className="w-4 h-4 mr-1" />
            교재 더 구매하기
          </BrandButton>
        </Link>
      </section>
    </div>
  );
}
