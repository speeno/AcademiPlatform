import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { AuthProvider } from '@/lib/auth-context';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PageViewTracker />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </AuthProvider>
  );
}
