import DOMPurify from 'isomorphic-dompurify';

/**
 * CMS/게시판 WYSIWYG(HTML) 콘텐츠 살균.
 *
 * 서버 컴포넌트(예: 공지 상세)와 클라이언트 컴포넌트 양쪽에서 동일하게 동작해야 하므로
 * isomorphic-dompurify 를 사용한다(브라우저=네이티브 DOMPurify, 서버=jsdom 백엔드).
 * 손수 만든 정규식/부분 DOM 살균은 우회가 쉬워 검증된 살균기로 대체했다.
 */
// <script>, on* 이벤트 핸들러, javascript: URL, <iframe>/<object>/<embed> 등은
// DOMPurify 기본 정책으로 차단된다. Quill 서식 태그(p, strong, em, ul, ol, li, a,
// img, h1~6, blockquote, pre, code, table …)와 img 의 data:image URL 은 기본 허용된다.
// <style> 요소만 추가로 금지하고, 외부 링크용 target 속성은 허용한다.
const SANITIZE_CONFIG = {
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['style'],
};

export function sanitizeCmsHtml(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, SANITIZE_CONFIG);
}
