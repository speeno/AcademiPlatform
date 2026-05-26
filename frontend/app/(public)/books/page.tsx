import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '교재 구매',
  description: 'AcademiQ 교재 스토어로 이동합니다.',
};

/**
 * `/books`는 통합 교재 스토어로 흡수되어 외부 판매처 탭으로 리다이렉트한다.
 * - 기존 외부 링크 카드는 `/store/textbooks?tab=external`에 노출된다.
 * - Navbar/Footer/마이페이지 링크도 `/store/textbooks`를 가리킨다.
 */
export default function BooksRedirectPage(): never {
  redirect('/store/textbooks?tab=external');
}
