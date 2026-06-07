import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { NoticeNewsTickerShell } from '@/components/notices/NoticeNewsTickerShell';
import { AuthProvider } from '@/lib/auth-context';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PageViewTracker />
      <Navbar />
      <NoticeNewsTickerShell />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </AuthProvider>
  );
}
