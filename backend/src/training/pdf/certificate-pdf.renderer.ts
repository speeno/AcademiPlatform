import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import { loadKoreanFontBytes } from '../../common/pdf/korean-font.util';

// A4 세로 (시험지 렌더러와 동일 규격)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const FRAME_OUTER = 28;
const FRAME_INNER = 34;

const COLORS = {
  brandBlue: rgb(0.027, 0.231, 0.471),
  text: rgb(0.063, 0.094, 0.125),
  textMuted: rgb(0.35, 0.42, 0.5),
  border: rgb(0.78, 0.86, 0.92),
};

export interface TrainingCertificatePdfData {
  certificateNo: string;
  participantName: string;
  affiliation?: string | null;
  programTitle: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  totalSessions: number;
  attendanceRate?: number | null;
  issuedAt: Date;
  issuerName: string; // 발급기관명
}

function formatKoreanDate(ymdOrDate: string | Date): string {
  const ymd =
    typeof ymdOrDate === 'string'
      ? ymdOrDate
      : ymdOrDate.toISOString().slice(0, 10);
  const [y, m, d] = ymd.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export async function renderTrainingCertificatePdf(
  data: TrainingCertificatePdfData,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  // subset: true 는 NotoSansKR(OTF/CFF)에서 한글 글리프가 유실되므로 사용 금지.
  // 시험지 PDF 와 동일하게 전체 임베드한다(파일이 커지지만 렌더링이 안전하다).
  const font = await pdfDoc.embedFont(loadKoreanFontBytes('NotoSansKR-Regular.otf'));
  const fontBold = await pdfDoc.embedFont(loadKoreanFontBytes('NotoSansKR-Bold.otf'));
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawDoubleFrame(page);

  const centerX = PAGE_WIDTH / 2;

  // 발급 번호(좌상단)
  page.drawText(`제 ${data.certificateNo} 호`, {
    x: FRAME_INNER + 24,
    y: PAGE_HEIGHT - FRAME_INNER - 48,
    size: 11,
    font,
    color: COLORS.textMuted,
  });

  // 제목
  drawCentered(page, '수  료  증', fontBold, 40, centerX, PAGE_HEIGHT - 190, COLORS.brandBlue);

  // 수료자 정보 블록
  let y = PAGE_HEIGHT - 300;
  const labelX = centerX - 160;
  const drawField = (label: string, value: string) => {
    page.drawText(label, {
      x: labelX,
      y,
      size: 13,
      font: fontBold,
      color: COLORS.text,
    });
    page.drawText(value, {
      x: labelX + 90,
      y,
      size: 13,
      font,
      color: COLORS.text,
    });
    y -= 30;
  };

  drawField('성    명', data.participantName);
  if (data.affiliation) drawField('소    속', data.affiliation);
  drawField('과 정 명', data.programTitle);
  drawField(
    '교육 기간',
    `${formatKoreanDate(data.periodStart)} ~ ${formatKoreanDate(data.periodEnd)} (총 ${data.totalSessions}회)`,
  );
  if (data.attendanceRate != null) {
    drawField('출 석 률', `${data.attendanceRate}%`);
  }

  // 본문
  const bodyY = y - 60;
  drawCentered(
    page,
    '위 사람은 상기 교육 과정을 성실히 이수하였으므로',
    font,
    14,
    centerX,
    bodyY,
    COLORS.text,
  );
  drawCentered(page, '이 증서를 수여합니다.', font, 14, centerX, bodyY - 26, COLORS.text);

  // 발급일 + 발급기관
  drawCentered(
    page,
    formatKoreanDate(data.issuedAt),
    font,
    14,
    centerX,
    170,
    COLORS.text,
  );
  drawCentered(page, data.issuerName, fontBold, 22, centerX, 120, COLORS.brandBlue);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  centerX: number,
  y: number,
  color: ReturnType<typeof rgb>,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

// 이중 장식 테두리
function drawDoubleFrame(page: PDFPage) {
  page.drawRectangle({
    x: FRAME_OUTER,
    y: FRAME_OUTER,
    width: PAGE_WIDTH - FRAME_OUTER * 2,
    height: PAGE_HEIGHT - FRAME_OUTER * 2,
    borderColor: COLORS.brandBlue,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: FRAME_INNER,
    y: FRAME_INNER,
    width: PAGE_WIDTH - FRAME_INNER * 2,
    height: PAGE_HEIGHT - FRAME_INNER * 2,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
}
