'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';

type PdfPageLike = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas: HTMLCanvasElement;
  }) => { promise: Promise<unknown> };
};

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  destroy: () => void;
};

type PdfJsModule = {
  GlobalWorkerOptions?: {
    workerSrc: string;
  };
  getDocument: (src: {
    url: string;
    httpHeaders?: Record<string, string>;
    withCredentials?: boolean;
  }) => {
    promise: Promise<PdfDocumentLike>;
  };
};

type Props = {
  src: string;
  heightClassName?: string;
  httpHeaders?: Record<string, string>;
  withCredentials?: boolean;
};

const BLOCKED_KEYS = new Set(['c', 's', 'p', 'u']);

export function SecurePdfViewer({
  src,
  heightClassName = 'h-[70vh]',
  httpHeaders,
  withCredentials = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [scale, setScale] = useState(1.25);
  const documentRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const preventClipboardAndDownload = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && BLOCKED_KEYS.has(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const preventCopyEvent = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', preventClipboardAndDownload);
    window.addEventListener('copy', preventCopyEvent);
    window.addEventListener('cut', preventCopyEvent);
    window.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('keydown', preventClipboardAndDownload);
      window.removeEventListener('copy', preventCopyEvent);
      window.removeEventListener('cut', preventCopyEvent);
      window.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  useEffect(() => {
    setPageNo(1);
  }, [src]);

  useEffect(() => {
    let disposed = false;

    const renderPdf = async () => {
      setLoading(true);
      setError('');
      try {
        const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PdfJsModule;
        if (pdfjs.GlobalWorkerOptions) {
          // Use local static worker to avoid CSP/network issues in production.
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';
        }
        const loaded = await pdfjs.getDocument({
          url: src,
          ...(httpHeaders ? { httpHeaders } : {}),
          ...(withCredentials ? { withCredentials: true } : {}),
        }).promise;
        if (disposed) {
          loaded.destroy();
          return;
        }
        if (documentRef.current) {
          documentRef.current.destroy();
        }
        documentRef.current = loaded;
        setNumPages(loaded.numPages);

        const safePageNo = Math.min(Math.max(pageNo, 1), loaded.numPages);
        const page = await loaded.getPage(safePageNo);
        if (disposed) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('캔버스 컨텍스트를 생성하지 못했습니다.');
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport, canvas }).promise;
      } catch (err: unknown) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'PDF를 렌더링하지 못했습니다.');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    renderPdf();

    return () => {
      disposed = true;
    };
  }, [src, pageNo, scale, httpHeaders, withCredentials]);

  useEffect(() => {
    return () => {
      if (documentRef.current) {
        documentRef.current.destroy();
        documentRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className="bg-white border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          AcademiQ 보안 PDF 뷰어
        </div>
        <div className="flex items-center gap-2">
          <BrandButton
            size="sm"
            variant="outline"
            onClick={() => setScale((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(2))))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </BrandButton>
          <span className="text-xs text-muted-foreground min-w-10 text-center">{Math.round(scale * 100)}%</span>
          <BrandButton
            size="sm"
            variant="outline"
            onClick={() => setScale((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </BrandButton>
          <BrandButton
            size="sm"
            variant="outline"
            disabled={pageNo <= 1}
            onClick={() => setPageNo((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </BrandButton>
          <span className="text-xs text-muted-foreground min-w-16 text-center">
            {numPages > 0 ? `${pageNo} / ${numPages}` : '- / -'}
          </span>
          <BrandButton
            size="sm"
            variant="outline"
            disabled={numPages === 0 || pageNo >= numPages}
            onClick={() => setPageNo((prev) => Math.min(numPages, prev + 1))}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </BrandButton>
        </div>
      </div>

      <div className={`${heightClassName} overflow-auto bg-muted flex items-start justify-center p-4 relative`}>
        <canvas
          ref={canvasRef}
          className={`shadow-md bg-white select-none ${loading || !!error ? 'opacity-0' : 'opacity-100'}`}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/80">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            PDF 렌더링 중...
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 bg-muted/80 px-4 text-center">
            PDF를 불러오지 못했습니다: {error}
          </div>
        )}
      </div>
    </div>
  );
}

