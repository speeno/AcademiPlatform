'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  viewerToken: string;
  totalPages?: number;
}

export function PdfViewer({ pdfUrl, viewerToken, totalPages }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // PDF.js 동적 로드
  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      try {
        setLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        // CDN 대신 로컬 worker 파일 사용 (버전 불일치 404 방지)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

        const token = localStorage.getItem('accessToken');

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });

        const doc = await loadingTask.promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError('PDF를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl, viewerToken]);

  // 페이지 렌더링
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // 이전 렌더 작업 취소
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderTask = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') throw e;
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    renderPage(currentPage);
  }, [renderPage, currentPage]);

  // 보호 이벤트 처리
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventDrag = (e: DragEvent) => e.preventDefault();
    const preventKeyShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };

    container.addEventListener('contextmenu', preventContextMenu);
    container.addEventListener('dragstart', preventDrag);
    document.addEventListener('keydown', preventKeyShortcuts);

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      container.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keydown', preventKeyShortcuts);
    };
  }, []);

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(pdfDoc?.numPages ?? 1, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/30 rounded-xl border border-border">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-blue"  />
          <p className="text-sm text-muted-foreground">교재를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-xl border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 — 다운로드/인쇄 버튼 없음 */}
      <div className="flex items-center justify-between px-4 py-2 bg-brand-blue-dark rounded-t-xl text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40 transition-colors"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">
            {currentPage} / {pdfDoc?.numPages ?? totalPages ?? '-'}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage >= (pdfDoc?.numPages ?? 1)}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40 transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={zoomOut} className="p-1.5 rounded hover:bg-white/10 transition-colors" aria-label="축소">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 rounded hover:bg-white/10 transition-colors" aria-label="확대">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 뷰어 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-brand-blue-dark rounded-b-xl flex justify-center py-4 select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      >
        <canvas
          ref={canvasRef}
          className="shadow-xl rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* 인쇄 차단 CSS */}
      <style>{`
        @media print {
          .pdf-viewer-container { display: none !important; }
        }
      `}</style>
    </div>
  );
}
