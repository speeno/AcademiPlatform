import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AcademiQ',
    default: 'AcademiQ — Learn. Certify. Succeed.',
  },
  description:
    'ISO/IEC 17024 기반 AI 자격 교육 플랫폼. 교육 신청부터 시험 접수까지 한 곳에서.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://academiq.co.kr'),
  openGraph: {
    type: 'website',
    siteName: 'AcademiQ',
    title: 'AcademiQ — Learn. Certify. Succeed.',
    description: 'ISO/IEC 17024 기반 AI 자격 교육 + 시험접수 통합 플랫폼',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AcademiQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AcademiQ',
    description: 'ISO/IEC 17024 기반 AI 자격 교육 + 시험접수 통합 플랫폼',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.className} min-h-screen flex flex-col antialiased`}>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
