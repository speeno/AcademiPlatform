'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';
import { SecurePdfViewer } from '@/components/pdf-viewer/SecurePdfViewer';
import { toast } from 'sonner';

export default function TextbookViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const textbookId = useMemo(() => String(params?.id ?? ''), [params?.id]);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('교재 열람');

  useEffect(() => {
    if (!textbookId) return;

    let disposed = false;
    let objectUrl = '';

    const loadPdf = async () => {
      setLoading(true);
      try {
        const detailRes = await fetch(`${API_BASE}/textbooks/${textbookId}`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          if (!disposed && detail?.title) setTitle(detail.title);
        }

        const tokenRes = await fetch(`${API_BASE}/textbooks/${textbookId}/token`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !tokenData?.viewerToken) {
          throw new Error(tokenData?.message ?? '열람 토큰 발급에 실패했습니다.');
        }

        const pdfRes = await fetch(
          `${API_BASE}/textbooks/${textbookId}/view?token=${encodeURIComponent(tokenData.viewerToken)}`,
          {
            headers: buildAuthHeader(false),
            credentials: 'include',
          },
        );
        if (!pdfRes.ok) {
          const err = await pdfRes.json().catch(() => ({}));
          throw new Error(err?.message ?? 'PDF 파일을 불러오지 못했습니다.');
        }

        const blob = await pdfRes.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!disposed) setPdfUrl(objectUrl);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '교재를 열람할 수 없습니다.';
        toast.error(message);
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [textbookId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-brand-blue" >{title}</h1>
          <p className="text-xs text-muted-foreground mt-1">워터마크 적용 + 복사/다운로드 차단 모드로 제공됩니다.</p>
        </div>
        <div className="flex gap-2">
          <BrandButton variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로가기
          </BrandButton>
          <Link href="/textbooks">
            <BrandButton variant="outline" size="sm">내 교재 목록</BrandButton>
          </Link>
        </div>
      </div>

      <div className="min-h-[70vh]">
        {loading ? (
          <PageLoader height="h-[70vh]" />
        ) : pdfUrl ? (
          <SecurePdfViewer src={pdfUrl} heightClassName="h-[70vh]" />
        ) : (
          <div className="h-[70vh] flex items-center justify-center text-sm text-muted-foreground">
            PDF를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}
      </div>
    </div>
  );
}
