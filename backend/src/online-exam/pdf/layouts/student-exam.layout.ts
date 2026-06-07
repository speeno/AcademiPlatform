import { buildDocMeta } from '../exam-paper-pdf.content';
import { ExamPaperPdfRenderer } from '../exam-paper-pdf.renderer';
import type { ExamPaperPdfBuildInput } from '../exam-paper-pdf.types';

export async function renderStudentExamPdf(input: ExamPaperPdfBuildInput): Promise<Buffer> {
  const { session, paper, edition, variant } = input;
  const docMeta = buildDocMeta(variant, edition, session.qualificationName);
  const renderer = new ExamPaperPdfRenderer();
  await renderer.createDocument(edition, docMeta);

  renderer.drawStudentHeader('모의고사', session);
  renderer.drawExamInfoPanel(session, paper.totalPoints);
  renderer.drawExamineeTable();
  renderer.drawPrecautionsBox(paper);
  renderer.drawStudentQuestions(paper.items);

  return renderer.save();
}
