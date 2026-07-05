'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Image as ImageIcon, Code2, File as FileIcon } from 'lucide-react';
import { sanitizeCmsHtml } from '@/lib/html-sanitize';
import { useAuthedBlobUrl } from '@/lib/use-authed-blob-url';

const SecurePdfViewer = dynamic(
  () => import('@/components/pdf-viewer/SecurePdfViewer').then((m) => ({ default: m.SecurePdfViewer })),
  { ssr: false },
);

export interface FormatAsset {
  id: string;
  mimeType: string;
  fileName?: string | null;
  resolvedUrl?: string | null;
  publicUrl?: string | null;
}

interface Props {
  contentType: string;
  schemaJson: Record<string, unknown>;
  assets: FormatAsset[];
  /** 인증 스트리밍 엔드포인트 URL 생성기 (교실: /cms/assets/:id/file, 관리자: /cms/lessons/:lid/assets/:id/file) */
  assetFileUrl: (assetId: string) => string;
  authHeaders: Record<string, string>;
  heightClassName?: string;
}

type Fmt =
  | { key: 'html'; kind: 'html'; label: string; html: string }
  | { key: string; kind: 'pdf' | 'image' | 'file'; label: string; asset: FormatAsset };

function assetKind(mimeType: string): 'pdf' | 'image' | 'file' {
  if (mimeType?.includes('pdf')) return 'pdf';
  if (mimeType?.startsWith('image/')) return 'image';
  return 'file';
}

function FormatIcon({ kind }: { kind: Fmt['kind'] }) {
  if (kind === 'html') return <Code2 className="h-3.5 w-3.5" />;
  if (kind === 'pdf') return <FileText className="h-3.5 w-3.5" />;
  if (kind === 'image') return <ImageIcon className="h-3.5 w-3.5" />;
  return <FileIcon className="h-3.5 w-3.5" />;
}

/**
 * 한 레슨이 여러 형식(HTML 본문 + 첨부 PDF/이미지/문서)을 가질 때 탭으로 전환 렌더한다.
 * 가용 형식이 1개면 탭 없이 바로 표시한다. 영상/패키지 등은 상위에서 별도 처리.
 */
export function LessonFormatViewer({
  contentType, schemaJson, assets, assetFileUrl, authHeaders,
  heightClassName = 'h-[70vh]',
}: Props) {
  const formats: Fmt[] = useMemo(() => {
    const list: Fmt[] = [];
    const html = typeof schemaJson?.html === 'string' ? (schemaJson.html as string) : '';
    if (html.trim()) list.push({ key: 'html', kind: 'html', label: 'HTML', html });
    for (const a of assets ?? []) {
      const kind = assetKind(a.mimeType ?? '');
      const label = kind === 'pdf' ? 'PDF' : kind === 'image' ? '이미지' : (a.fileName ?? '파일');
      list.push({ key: a.id, kind, label, asset: a });
    }
    return list;
  }, [schemaJson, assets]);

  // 기본 선택: DOCUMENT 는 첨부 우선, 그 외는 HTML 우선
  const defaultKey = useMemo(() => {
    if (contentType === 'DOCUMENT') {
      return (formats.find((f) => f.kind !== 'html') ?? formats[0])?.key;
    }
    return formats[0]?.key;
  }, [contentType, formats]);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active =
    formats.find((f) => f.key === activeKey) ??
    formats.find((f) => f.key === defaultKey) ??
    formats[0];

  // 이미지/파일은 서명 URL 우선, 없으면 인증 blob 으로 스트리밍
  const activeAsset = active && active.kind !== 'html' ? active.asset : null;
  const directUrl = activeAsset?.resolvedUrl || activeAsset?.publicUrl || null;
  const needsBlob =
    !!activeAsset && (active?.kind === 'image' || active?.kind === 'file') && !directUrl;
  const { url: blobUrl, loading: blobLoading } = useAuthedBlobUrl(
    needsBlob && activeAsset ? assetFileUrl(activeAsset.id) : null,
    authHeaders,
  );
  const mediaUrl = directUrl || blobUrl;

  if (!active) {
    return (
      <div className={`flex ${heightClassName} items-center justify-center bg-white text-sm text-muted-foreground`}>
        표시할 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {formats.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b bg-white px-2 py-1.5">
          {formats.map((f) => {
            const isActive = f.key === active.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveKey(f.key)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                title={f.label}
              >
                <FormatIcon kind={f.kind} />
                <span className="max-w-[140px] truncate">{f.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {active.kind === 'html' ? (
          <iframe
            title="lesson-html-content"
            className={`w-full ${heightClassName} bg-white`}
            // sandbox(=allow-same-origin 없음): 살균기를 우회한 스크립트가 있더라도
            // 앱 오리진에 접근하지 못하도록 격리한다. 서식 콘텐츠 렌더에는 추가 권한이 필요 없다.
            sandbox=""
            srcDoc={sanitizeCmsHtml(active.html)}
          />
        ) : active.kind === 'pdf' ? (
          <SecurePdfViewer
            src={assetFileUrl(active.asset.id)}
            heightClassName={heightClassName}
            httpHeaders={authHeaders}
            withCredentials
          />
        ) : active.kind === 'image' ? (
          mediaUrl ? (
            <div className={`flex w-full ${heightClassName} items-center justify-center bg-white`}>
              {/* blob/서명 URL 혼용 → next/image 대신 일반 img */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt={active.asset.fileName ?? 'document'} className="max-h-full w-auto object-contain" />
            </div>
          ) : (
            <div className={`flex w-full ${heightClassName} items-center justify-center bg-white text-sm text-muted-foreground`}>
              {blobLoading ? '이미지를 불러오는 중…' : '이미지를 불러오지 못했습니다.'}
            </div>
          )
        ) : mediaUrl ? (
          <iframe title="lesson-document-content" src={mediaUrl} className={`w-full ${heightClassName} bg-white`} />
        ) : (
          <div className={`flex w-full ${heightClassName} items-center justify-center bg-white text-sm text-muted-foreground`}>
            {blobLoading ? '문서를 불러오는 중…' : '이 형식은 브라우저 미리보기를 지원하지 않습니다.'}
          </div>
        )}
      </div>
    </div>
  );
}
