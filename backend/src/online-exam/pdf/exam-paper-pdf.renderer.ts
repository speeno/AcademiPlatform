import { QuestionType } from '@prisma/client';
import fontkit from '@pdf-lib/fontkit';
import { degrees, PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib';
import { loadKoreanFontBytes as loadFontBytes } from '../../common/pdf/korean-font.util';
import {
  buildDefaultPrecautions,
  buildGradingCriteria,
  formatExamDateShort,
  formatKoreanDateTime,
  getOptionDisplayLabel,
  parsePaperDescription,
  resolveAnswerLabel,
  resolveExplanation,
} from './exam-paper-pdf.content';
import {
  BODY_LINE_HEIGHT,
  COLORS,
  CONTENT_WIDTH,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  FONT_SIZE_SMALL,
  FONT_SIZE_SUBTITLE,
  FONT_SIZE_TITLE,
  FOOTER_Y,
  FRAME_INSET,
  HEADER_ROUND_BADGE_OFFSET,
  INFO_PANEL_VALUE_OFFSET,
  INFO_PANEL_VALUE_OFFSET_CH_LEFT,
  LINE_HEIGHT,
  MARGIN_BOTTOM,
  MARGIN_TOP,
  MARGIN_X,
  PAGE_HEIGHT,
  PAGE_WIDTH,
} from './exam-paper-pdf.tokens';
import type {
  ExamPaperPdfPaper,
  ExamPaperPdfSession,
  PaperPdfEdition,
  PaperQuestionItem,
  PdfDocMeta,
  PdfRenderContext,
} from './exam-paper-pdf.types';

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [''];
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = char.trimStart() ? char : '';
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function wrapBullets(
  bullets: string[],
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const bullet of bullets) {
    lines.push(...wrapText(`• ${bullet}`, font, size, maxWidth));
  }
  return lines.length > 0 ? lines : [''];
}

function wrapMultilineText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n').map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [''];
  return paragraphs.flatMap((paragraph) => wrapText(paragraph, font, size, maxWidth));
}

export class ExamPaperPdfRenderer {
  private ctx!: PdfRenderContext;
  private footerDeferred = true;

  async createDocument(edition: PaperPdfEdition, docMeta: PdfDocMeta): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(loadFontBytes('NotoSansKR-Regular.otf'));
    const fontBold = await pdfDoc.embedFont(loadFontBytes('NotoSansKR-Bold.otf'));
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.ctx = {
      pdfDoc,
      font,
      fontBold,
      page,
      y: PAGE_HEIGHT - MARGIN_TOP,
      pageNumber: 1,
      edition,
      docMeta,
      showPageFrame: true,
    };
    this.drawPageFrame();
    if (edition === 'draft') this.drawDraftWatermark(this.ctx.page);
  }

  async save(): Promise<Buffer> {
    this.finalizeFooters();
    const bytes = await this.ctx.pdfDoc.save();
    return Buffer.from(bytes);
  }

  getContext(): PdfRenderContext {
    return this.ctx;
  }

  setFooterDeferred(value: boolean) {
    this.footerDeferred = value;
  }

  drawStudentHeader(title: string, session: ExamPaperPdfSession, subtitle?: string) {
    const { page, font, fontBold } = this.ctx;
    this.ensureSpace(88);

    const titleY = this.ctx.y - FONT_SIZE_TITLE + 4;
    page.drawText(title, {
      x: MARGIN_X,
      y: titleY,
      size: FONT_SIZE_TITLE,
      font: fontBold,
      color: COLORS.brandBlue,
    });

    const subtitleText = subtitle ?? `${session.qualificationName} 과정`;
    const subtitleLineHeight = FONT_SIZE_SUBTITLE + 4;
    const subtitleMaxWidth = CONTENT_WIDTH - 140;
    const subtitleLines = wrapText(subtitleText, fontBold, FONT_SIZE_SUBTITLE, subtitleMaxWidth);
    const firstSubtitleY = titleY - FONT_SIZE_TITLE - 10;
    let lowestSubtitleY = firstSubtitleY;

    subtitleLines.forEach((line, index) => {
      const lineY = firstSubtitleY - index * subtitleLineHeight;
      page.drawText(line, {
        x: MARGIN_X,
        y: lineY,
        size: FONT_SIZE_SUBTITLE,
        font: fontBold,
        color: COLORS.brandBlue,
      });
      lowestSubtitleY = lineY;
    });

    const badgeText = session.roundName;
    const badgeFontSize = 8.5;
    const badgePaddingX = 8;
    const badgePaddingY = 3;
    const badgeTextWidth = fontBold.widthOfTextAtSize(badgeText, badgeFontSize);
    const badgeWidth = badgeTextWidth + badgePaddingX * 2;
    const badgeHeight = badgeFontSize + badgePaddingY * 2;
    const badgeGap = 14;
    const certReserve = 96;

    const lastSubtitleLine = subtitleLines[subtitleLines.length - 1] ?? subtitleText;
    const lastLineWidth = fontBold.widthOfTextAtSize(lastSubtitleLine, FONT_SIZE_SUBTITLE);
    let badgeBaseline = firstSubtitleY - (subtitleLines.length - 1) * subtitleLineHeight;
    let badgeX = MARGIN_X + lastLineWidth + badgeGap + HEADER_ROUND_BADGE_OFFSET;

    if (badgeX + badgeWidth > PAGE_WIDTH - MARGIN_X - certReserve) {
      badgeBaseline -= subtitleLineHeight + 4;
      badgeX = MARGIN_X + HEADER_ROUND_BADGE_OFFSET;
    }

    const badgeY = badgeBaseline - badgePaddingY;
    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeWidth,
      height: badgeHeight,
      color: COLORS.brandBlue,
    });
    page.drawText(badgeText, {
      x: badgeX + badgePaddingX,
      y: badgeBaseline,
      size: badgeFontSize,
      font: fontBold,
      color: COLORS.white,
    });

    const certText = 'ISO/IEC 17024 기반 AI 자격';
    page.drawText(certText, {
      x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(certText, FONT_SIZE_SMALL),
      y: titleY,
      size: FONT_SIZE_SMALL,
      font,
      color: COLORS.textMuted,
    });
    this.drawNetworkDecoration(PAGE_WIDTH - MARGIN_X - 70, this.ctx.y + 4);

    this.ctx.y = Math.min(badgeY, lowestSubtitleY - FONT_SIZE_SUBTITLE) - 16;
    this.drawHorizontalRule();
    this.ctx.y -= 10;
  }

  drawAnswerHeader(title: string, session: ExamPaperPdfSession) {
    this.drawStudentHeader(title, session);
  }

  drawSectionTitle(title: string) {
    this.ensureSpace(24);
    this.ctx.page.drawText(title, {
      x: MARGIN_X,
      y: this.ctx.y - FONT_SIZE_HEADING,
      size: FONT_SIZE_HEADING + 1,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });
    this.ctx.y -= LINE_HEIGHT + 4;
    this.drawHorizontalRule();
    this.ctx.y -= 6;
  }

  drawExamInfoPanel(session: ExamPaperPdfSession, totalPoints: number) {
    const left = MARGIN_X;
    const width = CONTENT_WIDTH;
    const colWidth = width / 3;
    const paddingX = 12;
    const paddingTop = 14;

    const examAt = formatKoreanDateTime(session.examAt);
    const place = session.place?.trim() || '미정 / 별도 안내';
    const duration =
      typeof session.durationMinutes === 'number' && session.durationMinutes > 0
        ? `${session.durationMinutes}분`
        : '별도 안내';

    const row1 = [
      { label: '시험 일시', value: examAt },
      { label: '시험 장소', value: place },
      { label: '총점', value: `${totalPoints}점` },
    ];
    const row2 = [
      { label: '시험 시간', value: duration },
      { label: '합격 기준', value: `${session.passingScore}점` },
    ];

    const valueOffset = this.resolveInfoPanelValueOffset();

    const row1Heights = row1.map((item, idx) =>
      this.measureInlineLabelValue(
        left + paddingX + colWidth * idx,
        colWidth - paddingX * 2,
        item.label,
        item.value,
        valueOffset,
      ),
    );
    const row2Heights = row2.map((item, idx) =>
      this.measureInlineLabelValue(
        left + paddingX + colWidth * idx,
        colWidth - paddingX * 2,
        item.label,
        item.value,
        valueOffset,
      ),
    );
    const row1Height = Math.max(...row1Heights, LINE_HEIGHT);
    const row2Height = Math.max(...row2Heights, LINE_HEIGHT);
    const panelHeight = paddingTop + row1Height + 10 + row2Height + 12;

    this.ensureSpace(panelHeight + 8);
    const top = this.ctx.y;

    this.ctx.page.drawRectangle({
      x: left,
      y: top - panelHeight,
      width,
      height: panelHeight,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.white,
    });

    const row1Baseline = top - paddingTop;
    row1.forEach((item, idx) => {
      this.drawInlineLabelValue(
        left + paddingX + colWidth * idx,
        row1Baseline,
        colWidth - paddingX * 2,
        item.label,
        item.value,
        valueOffset,
      );
    });

    const dividerY = top - paddingTop - row1Height - 6;
    this.ctx.page.drawLine({
      start: { x: left + 10, y: dividerY },
      end: { x: left + width - 10, y: dividerY },
      thickness: 0.5,
      color: COLORS.borderLight,
    });

    const row2Baseline = dividerY - row2Height - 4;
    row2.forEach((item, idx) => {
      this.drawInlineLabelValue(
        left + paddingX + colWidth * idx,
        row2Baseline,
        colWidth - paddingX * 2,
        item.label,
        item.value,
        valueOffset,
      );
    });

    this.ctx.y = top - panelHeight - 12;
  }

  drawExamineeTable() {
    const tableHeight = 42;
    this.ensureSpace(tableHeight + 6);
    const top = this.ctx.y;
    const left = MARGIN_X;
    const colWidth = CONTENT_WIDTH / 3;
    const headers = ['수험번호', '성명', '서명'];

    for (let i = 0; i < 3; i += 1) {
      this.ctx.page.drawRectangle({
        x: left + colWidth * i,
        y: top - 18,
        width: colWidth,
        height: 18,
        color: COLORS.brandBlue,
      });
      const text = headers[i];
      const tw = this.ctx.fontBold.widthOfTextAtSize(text, FONT_SIZE_SMALL);
      this.ctx.page.drawText(text, {
        x: left + colWidth * i + (colWidth - tw) / 2,
        y: top - 14,
        size: FONT_SIZE_SMALL,
        font: this.ctx.fontBold,
        color: COLORS.white,
      });
      this.ctx.page.drawRectangle({
        x: left + colWidth * i,
        y: top - tableHeight,
        width: colWidth,
        height: 24,
        borderColor: COLORS.border,
        borderWidth: 0.8,
        color: COLORS.white,
      });
    }
    this.ctx.y = top - tableHeight - 8;
  }

  drawPrecautionsBox(paper: ExamPaperPdfPaper) {
    const notes = parsePaperDescription(paper.description);
    const bullets = notes.trim()
      ? notes.split('\n').map((l) => l.trim()).filter(Boolean)
      : buildDefaultPrecautions(paper);
    const contentWidth = CONTENT_WIDTH - 24;
    const lines = wrapBullets(bullets, this.ctx.font, FONT_SIZE_BODY, contentWidth);
    const titleBlock = 24;
    const boxHeight = titleBlock + lines.length * BODY_LINE_HEIGHT + 20;
    this.ensureSpace(boxHeight + 12);

    const top = this.ctx.y;
    const left = MARGIN_X;
    this.ctx.page.drawRectangle({
      x: left,
      y: top - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.brandBlueSubtle,
    });
    this.ctx.page.drawText('유의사항', {
      x: left + 12,
      y: top - 16,
      size: FONT_SIZE_HEADING,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });

    let textBaseline = top - titleBlock - FONT_SIZE_BODY;
    for (const line of lines) {
      this.ctx.page.drawText(line, {
        x: left + 12,
        y: textBaseline,
        size: FONT_SIZE_BODY,
        font: this.ctx.font,
        color: COLORS.text,
      });
      textBaseline -= BODY_LINE_HEIGHT;
    }
    this.ctx.y = top - boxHeight - 16;
  }

  drawStudentQuestions(items: PaperQuestionItem[]) {
    for (let i = 0; i < items.length; i += 1) {
      this.drawStudentQuestion(items[i], i === items.length - 1);
    }
  }

  drawStudentQuestion(item: PaperQuestionItem, isLast: boolean) {
    const q = item.question;
    const number = item.order + 1;
    const promptX = MARGIN_X + 24;
    const promptWidth = CONTENT_WIDTH - 80;
    const promptLines = wrapText(q.prompt, this.ctx.fontBold, FONT_SIZE_BODY, promptWidth);
    const optionCount =
      q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE
        ? q.options.length
        : q.type === QuestionType.SHORT_TEXT
          ? 4
          : 2;
    const blockHeight = 20 + promptLines.length * LINE_HEIGHT + optionCount * (LINE_HEIGHT + 2) + 16;
    this.ensureSpace(blockHeight);

    const blockTop = this.ctx.y;
    const badgeSize = 16;
    const badgeY = blockTop - badgeSize + 2;
    this.ctx.page.drawRectangle({
      x: MARGIN_X,
      y: badgeY,
      width: badgeSize,
      height: badgeSize,
      color: COLORS.brandBlue,
    });
    const numStr = String(number);
    const numW = this.ctx.fontBold.widthOfTextAtSize(numStr, 9);
    this.ctx.page.drawText(numStr, {
      x: MARGIN_X + (badgeSize - numW) / 2,
      y: badgeY + 4,
      size: 9,
      font: this.ctx.fontBold,
      color: COLORS.white,
    });

    const pointsText = `(${item.points}점)`;
    this.ctx.page.drawText(pointsText, {
      x: PAGE_WIDTH - MARGIN_X - this.ctx.font.widthOfTextAtSize(pointsText, FONT_SIZE_BODY),
      y: blockTop - FONT_SIZE_BODY,
      size: FONT_SIZE_BODY,
      font: this.ctx.font,
      color: COLORS.brandBlue,
    });

    let promptY = blockTop - FONT_SIZE_BODY;
    for (const line of promptLines) {
      this.ctx.page.drawText(line, {
        x: promptX,
        y: promptY,
        size: FONT_SIZE_BODY,
        font: this.ctx.fontBold,
        color: COLORS.text,
      });
      promptY -= LINE_HEIGHT;
    }

    this.ctx.y = promptY - 6;

    if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) {
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        this.drawTextLine('(복수 선택)', FONT_SIZE_SMALL, COLORS.textMuted, promptX);
      }
      q.options.forEach((opt, idx) => {
        const label = getOptionDisplayLabel(idx, opt.label);
        this.drawOptionLine(label, opt.text, promptX);
      });
    } else if (q.type === QuestionType.SHORT_TEXT) {
      for (let i = 0; i < 4; i += 1) {
        this.drawTextLine('________________________________________________________', FONT_SIZE_BODY, COLORS.border, promptX);
      }
    } else {
      this.drawBoxedNote(
        '별도 파일 제출 문항입니다. 시험 종료 전 지정된 방식으로 결과물을 제출하세요.',
        promptX,
      );
    }

    if (!isLast) {
      this.ctx.y -= 4;
      this.drawDottedRule();
    }
    this.ctx.y -= 8;
  }

  drawAnswerSummaryTable(items: PaperQuestionItem[]) {
    const colCount = items.length;
    const labelColWidth = 44;
    const dataColWidth = (CONTENT_WIDTH - labelColWidth) / colCount;
    const tableHeight = 36;
    this.ensureSpace(tableHeight + 10);

    const top = this.ctx.y;
    const left = MARGIN_X;

    this.ctx.page.drawRectangle({
      x: left,
      y: top - 18,
      width: labelColWidth,
      height: 18,
      color: COLORS.brandBlue,
    });
    this.ctx.page.drawText('문항', {
      x: left + 10,
      y: top - 14,
      size: FONT_SIZE_SMALL,
      font: this.ctx.fontBold,
      color: COLORS.white,
    });

    for (let i = 0; i < colCount; i += 1) {
      const x = left + labelColWidth + dataColWidth * i;
      this.ctx.page.drawRectangle({
        x,
        y: top - 18,
        width: dataColWidth,
        height: 18,
        color: COLORS.brandBlue,
        borderColor: COLORS.brandBlueDark,
        borderWidth: 0.3,
      });
      const num = String(i + 1);
      const nw = this.ctx.fontBold.widthOfTextAtSize(num, FONT_SIZE_SMALL);
      this.ctx.page.drawText(num, {
        x: x + (dataColWidth - nw) / 2,
        y: top - 14,
        size: FONT_SIZE_SMALL,
        font: this.ctx.fontBold,
        color: COLORS.white,
      });
    }

    this.ctx.page.drawRectangle({
      x: left,
      y: top - tableHeight,
      width: labelColWidth,
      height: 18,
      borderColor: COLORS.border,
      borderWidth: 0.8,
      color: COLORS.white,
    });
    this.ctx.page.drawText('정답', {
      x: left + 10,
      y: top - 32,
      size: FONT_SIZE_SMALL,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });

    for (let i = 0; i < colCount; i += 1) {
      const x = left + labelColWidth + dataColWidth * i;
      const answer = resolveAnswerLabel(items[i]);
      this.ctx.page.drawRectangle({
        x,
        y: top - tableHeight,
        width: dataColWidth,
        height: 18,
        borderColor: COLORS.border,
        borderWidth: 0.8,
        color: COLORS.white,
      });
      const aw = this.ctx.fontBold.widthOfTextAtSize(answer, FONT_SIZE_SMALL);
      this.ctx.page.drawText(answer, {
        x: x + (dataColWidth - aw) / 2,
        y: top - 32,
        size: FONT_SIZE_SMALL,
        font: this.ctx.fontBold,
        color: COLORS.brandBlue,
      });
    }

    this.ctx.y = top - tableHeight - 12;
  }

  drawAnswerQuestions(items: PaperQuestionItem[]) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const number = item.order + 1;
      const promptX = MARGIN_X + 24;
      const promptWidth = CONTENT_WIDTH - 24;
      const explanation = resolveExplanation(item);
      const promptLines = wrapText(item.question.prompt, this.ctx.fontBold, FONT_SIZE_BODY, promptWidth);
      const explanationLines = explanation
        ? wrapText(`해설: ${explanation}`, this.ctx.font, FONT_SIZE_SMALL, promptWidth)
        : [];
      const blockHeight =
        20 + promptLines.length * LINE_HEIGHT + LINE_HEIGHT + explanationLines.length * LINE_HEIGHT + 12;
      this.ensureSpace(blockHeight);

      const blockTop = this.ctx.y;
      const badgeSize = 16;
      const badgeY = blockTop - badgeSize + 2;
      this.ctx.page.drawRectangle({
        x: MARGIN_X,
        y: badgeY,
        width: badgeSize,
        height: badgeSize,
        color: COLORS.brandBlue,
      });
      const numStr = String(number);
      const numW = this.ctx.fontBold.widthOfTextAtSize(numStr, 9);
      this.ctx.page.drawText(numStr, {
        x: MARGIN_X + (badgeSize - numW) / 2,
        y: badgeY + 4,
        size: 9,
        font: this.ctx.fontBold,
        color: COLORS.white,
      });

      let py = blockTop - FONT_SIZE_BODY;
      for (const line of promptLines) {
        this.ctx.page.drawText(line, {
          x: promptX,
          y: py,
          size: FONT_SIZE_BODY,
          font: this.ctx.fontBold,
          color: COLORS.text,
        });
        py -= LINE_HEIGHT;
      }

      this.ctx.y = py - 4;
      const answer = resolveAnswerLabel(item);
      this.drawTextLine(`정답: ${answer}`, FONT_SIZE_BODY, COLORS.answerAccent, promptX);

      if (explanationLines.length > 0) {
        for (const line of explanationLines) {
          this.drawTextLine(line, FONT_SIZE_SMALL, COLORS.textMuted, promptX);
        }
      }

      if (i < items.length - 1) {
        this.ctx.y -= 4;
        this.drawDottedRule();
      }
      this.ctx.y -= 10;
    }
  }

  drawScoringSummaryBox(paper: ExamPaperPdfPaper, session: ExamPaperPdfSession) {
    const boxHeight = 48;
    this.ensureSpace(boxHeight + 8);
    const top = this.ctx.y;
    this.ctx.page.drawRectangle({
      x: MARGIN_X,
      y: top - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.brandBlueSubtle,
    });
    this.ctx.page.drawText('요약 채점 결과', {
      x: MARGIN_X + 12,
      y: top - 14,
      size: FONT_SIZE_HEADING,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });

    const stats = [
      `총 문항 수: ${paper.items.length}문항`,
      `총 배점: ${paper.totalPoints}점`,
      `합격 기준: ${session.passingScore}점`,
    ];
    let sx = MARGIN_X + 130;
    for (const stat of stats) {
      this.ctx.page.drawText(stat, {
        x: sx,
        y: top - 30,
        size: FONT_SIZE_BODY,
        font: this.ctx.font,
        color: COLORS.text,
      });
      sx += 130;
    }
    this.ctx.y = top - boxHeight - 10;
  }

  drawGradingCriteriaBox(passingScore: number) {
    this.drawBulletInfoBox('채점 기준', buildGradingCriteria(passingScore));
  }

  drawReviewBox(kind: 'draft' | 'final') {
    if (kind === 'draft') {
      this.drawInfoBox('검토자 확인란', '검토자 성명 : ____________________    서명 : ____________________    검토일 : ____ / ____ / ______');
      return;
    }
    this.drawInfoBox(
      '검토 및 승인',
      '검토자 : ____________________    서명 : ____________________    일자 : ' + formatExamDateShort(new Date()),
    );
  }

  drawEvaluationGuideBox(passingScore: number) {
    this.drawBulletInfoBox('평가 안내', [
      `합격 기준은 총점 ${passingScore}점 이상입니다.`,
      '객관식 문항은 정답 일치 여부로 채점합니다.',
      '서술형·파일 제출 문항은 채점 기준에 따라 수동 평가합니다.',
      '문의: AcademiQ 시험 운영 담당자',
    ]);
  }

  drawReviewerSignatureLine() {
    this.ensureSpace(20);
    this.ctx.page.drawText('검토자 서명: ___________________________', {
      x: PAGE_WIDTH - MARGIN_X - 200,
      y: this.ctx.y - FONT_SIZE_BODY,
      size: FONT_SIZE_BODY,
      font: this.ctx.font,
      color: COLORS.textMuted,
    });
    this.ctx.y -= LINE_HEIGHT + 4;
  }

  startNewPageWithFrame() {
    this.ctx.pageNumber += 1;
    this.ctx.page = this.ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.ctx.y = PAGE_HEIGHT - MARGIN_TOP;
    this.drawPageFrame();
    if (this.ctx.edition === 'draft') this.drawDraftWatermark(this.ctx.page);
  }

  private drawBulletInfoBox(title: string, bullets: string[]) {
    const contentWidth = CONTENT_WIDTH - 24;
    const lines = wrapBullets(bullets, this.ctx.font, FONT_SIZE_BODY, contentWidth);
    const titleBlock = 24;
    const boxHeight = Math.max(44, titleBlock + lines.length * BODY_LINE_HEIGHT + 16);
    this.ensureSpace(boxHeight + 6);
    const top = this.ctx.y;
    this.ctx.page.drawRectangle({
      x: MARGIN_X,
      y: top - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.brandBlueSubtle,
    });
    this.ctx.page.drawText(title, {
      x: MARGIN_X + 12,
      y: top - 16,
      size: FONT_SIZE_HEADING,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });
    let textBaseline = top - titleBlock - FONT_SIZE_BODY;
    for (const line of lines) {
      this.ctx.page.drawText(line, {
        x: MARGIN_X + 12,
        y: textBaseline,
        size: FONT_SIZE_BODY,
        font: this.ctx.font,
        color: COLORS.text,
      });
      textBaseline -= BODY_LINE_HEIGHT;
    }
    this.ctx.y = top - boxHeight - 8;
  }

  private drawInfoBox(title: string, body: string) {
    const lines = wrapMultilineText(body, this.ctx.font, FONT_SIZE_BODY, CONTENT_WIDTH - 24);
    const titleBlock = 24;
    const boxHeight = Math.max(44, titleBlock + lines.length * BODY_LINE_HEIGHT + 16);
    this.ensureSpace(boxHeight + 6);
    const top = this.ctx.y;
    this.ctx.page.drawRectangle({
      x: MARGIN_X,
      y: top - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.brandBlueSubtle,
    });
    this.ctx.page.drawText(title, {
      x: MARGIN_X + 12,
      y: top - 16,
      size: FONT_SIZE_HEADING,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });
    let textBaseline = top - titleBlock - FONT_SIZE_BODY;
    for (const line of lines) {
      this.ctx.page.drawText(line, {
        x: MARGIN_X + 12,
        y: textBaseline,
        size: FONT_SIZE_BODY,
        font: this.ctx.font,
        color: COLORS.text,
      });
      textBaseline -= BODY_LINE_HEIGHT;
    }
    this.ctx.y = top - boxHeight - 8;
  }

  private resolveInfoPanelValueOffset(): number {
    const ch = this.ctx.font.widthOfTextAtSize('0', FONT_SIZE_BODY);
    return Math.max(
      6,
      INFO_PANEL_VALUE_OFFSET - ch * INFO_PANEL_VALUE_OFFSET_CH_LEFT,
    );
  }

  private measureInlineLabelValue(
    _x: number,
    maxWidth: number,
    label: string,
    value: string,
    valueOffset = 0,
  ): number {
    const labelPrefix = `${label} `;
    const labelWidth = this.ctx.fontBold.widthOfTextAtSize(labelPrefix, FONT_SIZE_SMALL);
    const valueMaxWidth = Math.max(20, maxWidth - labelWidth - valueOffset);
    const valueLines = wrapText(value, this.ctx.font, FONT_SIZE_BODY, valueMaxWidth);
    return Math.max(LINE_HEIGHT, valueLines.length * LINE_HEIGHT);
  }

  private drawInlineLabelValue(
    x: number,
    baselineY: number,
    maxWidth: number,
    label: string,
    value: string,
    valueOffset = 0,
  ): number {
    const labelPrefix = `${label} `;
    const labelWidth = this.ctx.fontBold.widthOfTextAtSize(labelPrefix, FONT_SIZE_SMALL);
    this.ctx.page.drawText(labelPrefix, {
      x,
      y: baselineY,
      size: FONT_SIZE_SMALL,
      font: this.ctx.fontBold,
      color: COLORS.textMuted,
    });

    const valueMaxWidth = Math.max(20, maxWidth - labelWidth - valueOffset);
    const valueLines = wrapText(value, this.ctx.font, FONT_SIZE_BODY, valueMaxWidth);
    const indentX = x + labelWidth + valueOffset;
    valueLines.forEach((line, index) => {
      this.ctx.page.drawText(line, {
        x: index === 0 ? indentX : indentX,
        y: baselineY - index * LINE_HEIGHT,
        size: FONT_SIZE_BODY,
        font: this.ctx.font,
        color: COLORS.text,
      });
    });
    return Math.max(LINE_HEIGHT, valueLines.length * LINE_HEIGHT);
  }

  private drawOptionLine(label: string, text: string, indentX: number) {
    this.ensureSpace(LINE_HEIGHT + 2);
    const circleX = indentX;
    const cy = this.ctx.y - 9;
    this.ctx.page.drawCircle({ x: circleX + 6, y: cy, size: 6, borderColor: COLORS.border, borderWidth: 0.8 });
    this.ctx.page.drawText(label, {
      x: circleX + 3.5,
      y: cy - 3,
      size: 7,
      font: this.ctx.fontBold,
      color: COLORS.brandBlue,
    });
    const line = wrapText(text, this.ctx.font, FONT_SIZE_BODY, CONTENT_WIDTH - (indentX - MARGIN_X) - 24)[0];
    this.ctx.page.drawText(line, {
      x: indentX + 18,
      y: this.ctx.y - FONT_SIZE_BODY,
      size: FONT_SIZE_BODY,
      font: this.ctx.font,
      color: COLORS.text,
    });
    this.ctx.y -= LINE_HEIGHT + 2;
  }

  private drawTextLine(text: string, size: number, color: ReturnType<typeof rgb>, x = MARGIN_X) {
    this.ensureSpace(LINE_HEIGHT);
    this.ctx.page.drawText(text, {
      x,
      y: this.ctx.y - size,
      size,
      font: this.ctx.font,
      color,
    });
    this.ctx.y -= LINE_HEIGHT;
  }

  private drawParagraph(text: string, indentX: number, size: number, color: ReturnType<typeof rgb>) {
    const lines = wrapText(text, this.ctx.font, size, CONTENT_WIDTH - (indentX - MARGIN_X));
    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT);
      this.ctx.page.drawText(line, {
        x: indentX,
        y: this.ctx.y - size,
        size,
        font: this.ctx.font,
        color,
      });
      this.ctx.y -= LINE_HEIGHT;
    }
  }

  private drawBoxedNote(text: string, indentX: number) {
    const lines = wrapText(text, this.ctx.font, FONT_SIZE_BODY, CONTENT_WIDTH - (indentX - MARGIN_X) - 12);
    const h = lines.length * LINE_HEIGHT + 12;
    this.ensureSpace(h);
    const top = this.ctx.y;
    this.ctx.page.drawRectangle({
      x: indentX,
      y: top - h,
      width: CONTENT_WIDTH - (indentX - MARGIN_X),
      height: h,
      borderColor: COLORS.border,
      borderWidth: 0.8,
      color: COLORS.brandBlueSubtle,
    });
    let ty = top - 10;
    for (const line of lines) {
      this.ctx.page.drawText(line, { x: indentX + 8, y: ty - FONT_SIZE_BODY, size: FONT_SIZE_BODY, font: this.ctx.font, color: COLORS.text });
      ty -= LINE_HEIGHT;
    }
    this.ctx.y = top - h - 4;
  }

  private drawPageFrame() {
    if (!this.ctx.showPageFrame) return;
    this.ctx.page.drawRectangle({
      x: FRAME_INSET,
      y: FRAME_INSET,
      width: PAGE_WIDTH - FRAME_INSET * 2,
      height: PAGE_HEIGHT - FRAME_INSET * 2,
      borderColor: COLORS.border,
      borderWidth: 1,
      color: COLORS.white,
    });
  }

  private drawNetworkDecoration(x: number, y: number) {
    const dots = [
      [0, 0],
      [12, 8],
      [24, -4],
      [36, 6],
      [18, 16],
    ];
    for (const [dx, dy] of dots) {
      this.ctx.page.drawCircle({
        x: x + dx,
        y: y + dy,
        size: 2,
        color: COLORS.border,
      });
    }
    for (let i = 0; i < dots.length - 1; i += 1) {
      this.ctx.page.drawLine({
        start: { x: x + dots[i][0], y: y + dots[i][1] },
        end: { x: x + dots[i + 1][0], y: y + dots[i + 1][1] },
        thickness: 0.5,
        color: COLORS.borderLight,
      });
    }
  }

  private drawHorizontalRule() {
    this.ctx.page.drawLine({
      start: { x: MARGIN_X, y: this.ctx.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.ctx.y },
      thickness: 1,
      color: COLORS.brandBlue,
    });
    this.ctx.y -= 4;
  }

  private drawDottedRule() {
    const y = this.ctx.y;
    for (let x = MARGIN_X; x < PAGE_WIDTH - MARGIN_X; x += 6) {
      this.ctx.page.drawLine({
        start: { x, y },
        end: { x: x + 3, y },
        thickness: 0.5,
        color: COLORS.borderLight,
      });
    }
    this.ctx.y -= 6;
  }

  private drawDraftWatermark(page: PDFPage) {
    page.drawText('초안', {
      x: PAGE_WIDTH / 2 - 60,
      y: PAGE_HEIGHT / 2,
      size: 72,
      font: this.ctx.fontBold,
      color: COLORS.draftWatermark,
      opacity: 0.18,
      rotate: degrees(-30),
    });
  }

  private ensureSpace(required: number) {
    if (this.ctx.y - required >= MARGIN_BOTTOM + 16) return;
    this.startNewPageWithFrame();
  }

  private finalizeFooters() {
    if (!this.footerDeferred) return;
    const pages = this.ctx.pdfDoc.getPages();
    const total = pages.length;
    const { docMeta, font, fontBold } = this.ctx;

    pages.forEach((page, index) => {
      const pageNum = index + 1;
      page.drawLine({
        start: { x: MARGIN_X, y: FOOTER_Y + 14 },
        end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_Y + 14 },
        thickness: 0.8,
        color: COLORS.brandBlue,
      });

      const docLine = `${docMeta.docId} | ${docMeta.version}`;
      page.drawText(docLine, {
        x: MARGIN_X,
        y: FOOTER_Y,
        size: FONT_SIZE_SMALL,
        font,
        color: COLORS.textSoft,
      });

      const pageText = `${pageNum} / ${total}`;
      const pw = font.widthOfTextAtSize(pageText, FONT_SIZE_SMALL);
      page.drawText(pageText, {
        x: PAGE_WIDTH / 2 - pw / 2,
        y: FOOTER_Y,
        size: FONT_SIZE_SMALL,
        font,
        color: COLORS.textSoft,
      });

      const badge = docMeta.footerBadge;
      const bw = fontBold.widthOfTextAtSize(badge, 7.5) + 12;
      const bx = PAGE_WIDTH - MARGIN_X - bw;
      page.drawRectangle({
        x: bx,
        y: FOOTER_Y - 2,
        width: bw,
        height: 14,
        color: COLORS.brandBlue,
      });
      page.drawText(badge, {
        x: bx + 6,
        y: FOOTER_Y + 1,
        size: 7.5,
        font: fontBold,
        color: COLORS.white,
      });

      if (this.ctx.edition === 'draft') {
        this.drawDraftWatermark(page);
      }
    });
  }
}
