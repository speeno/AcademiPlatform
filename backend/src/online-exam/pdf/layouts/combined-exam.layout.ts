import { buildDocMeta } from '../exam-paper-pdf.content';
import { ExamPaperPdfRenderer } from '../exam-paper-pdf.renderer';
import type { ExamPaperPdfBuildInput } from '../exam-paper-pdf.types';

export async function renderCombinedExamPdf(input: ExamPaperPdfBuildInput): Promise<Buffer> {
  const { session, paper, edition } = input;
  const docMeta = buildDocMeta('combined', edition, session.qualificationName);
  const renderer = new ExamPaperPdfRenderer();
  await renderer.createDocument(edition, docMeta);

  renderer.drawStudentHeader('모의고사', session);
  renderer.drawExamInfoPanel(session, paper.totalPoints);
  renderer.drawExamineeTable();
  renderer.drawPrecautionsBox(paper);
  renderer.drawStudentQuestions(paper.items);

  renderer.startNewPageWithFrame();
  renderer.drawSectionTitle('정답');
  renderer.drawAnswerSummaryTable(paper.items);

  renderer.drawSectionTitle('해설');
  renderer.drawAnswerQuestions(paper.items);

  if (edition === 'final') {
    renderer.drawEvaluationGuideBox(session.passingScore);
    renderer.drawReviewerSignatureLine();
  } else {
    renderer.drawReviewBox('draft');
  }

  return renderer.save();
}
