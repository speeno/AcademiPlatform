import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: {
    template: '%s | AcademiQ',
    default: 'AcademiQ — Learn. Certify. Succeed.',
  },
  description:
    'ISO 17024 기반 AI 자격 교육 플랫폼. 교육 신청부터 시험 접수까지 한 곳에서.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://academiq.co.kr'),
  openGraph: {
    type: 'website',
    siteName: 'AcademiQ',
    title: 'AcademiQ — Learn. Certify. Succeed.',
    description: 'ISO 17024 기반 AI 자격 교육 + 시험접수 통합 플랫폼',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AcademiQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AcademiQ',
    description: 'ISO 17024 기반 AI 자격 교육 + 시험접수 통합 플랫폼',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard 가변 폰트 — CSS @import url()은 Turbopack에서 오류 발생, <link>로 대체 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script src="https://cdn.iamport.kr/v1/iamport.js" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
