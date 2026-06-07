import { buildDocMeta } from '../exam-paper-pdf.content';
import { ExamPaperPdfRenderer } from '../exam-paper-pdf.renderer';
import type { ExamPaperPdfBuildInput } from '../exam-paper-pdf.types';

export async function renderAnswerKeyPdf(input: ExamPaperPdfBuildInput): Promise<Buffer> {
  const { session, paper, edition } = input;
  const docMeta = buildDocMeta('answer', edition, session.qualificationName);
  const renderer = new ExamPaperPdfRenderer();
  await renderer.createDocument(edition, docMeta);

  const title = edition === 'draft' ? '정답지' : '정답 및 해설';
  renderer.drawAnswerHeader(title, session);
  renderer.drawExamInfoPanel(session, paper.totalPoints);

  if (edition === 'final') {
    renderer.drawScoringSummaryBox(paper, session);
  }

  renderer.drawAnswerSummaryTable(paper.items);
  renderer.drawAnswerQuestions(paper.items);

  if (edition === 'final') {
    renderer.drawGradingCriteriaBox(session.passingScore);
    renderer.drawReviewBox('final');
  } else {
    renderer.drawReviewBox('draft');
  }

  return renderer.save();
}
