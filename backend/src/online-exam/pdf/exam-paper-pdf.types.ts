import { ExamPaperStatus, QuestionType } from '@prisma/client';
import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

export type PaperPdfEdition = 'draft' | 'final';
export type PaperPdfVariant = 'student' | 'answer' | 'combined';

export interface PaperPdfExportResult {
  buffer: Buffer;
  filename: string;
}

export interface PaperQuestionItem {
  order: number;
  points: number;
  question: {
    prompt: string;
    type: QuestionType;
    explanation: string | null;
    options: Array<{ id: string; label: string; text: string }>;
    answerKeys: Array<{
      optionId: string | null;
      textPattern: string | null;
      explanation: string | null;
    }>;
  };
}

export interface ExamPaperPdfSession {
  qualificationName: string;
  roundName: string;
  examAt: Date;
  place: string | null;
  durationMinutes: number | null;
  passingScore: number;
}

export interface ExamPaperPdfPaper {
  title: string;
  description: string | null;
  status: ExamPaperStatus;
  totalPoints: number;
  items: PaperQuestionItem[];
}

export interface ExamPaperPdfBuildInput {
  session: ExamPaperPdfSession;
  paper: ExamPaperPdfPaper;
  edition: PaperPdfEdition;
  variant: PaperPdfVariant;
}

export interface PdfDocMeta {
  docId: string;
  footerBadge: string;
  version: string;
}

export type PdfRenderContext = {
  pdfDoc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
  pageNumber: number;
  edition: PaperPdfEdition;
  docMeta: PdfDocMeta;
  showPageFrame: boolean;
};
