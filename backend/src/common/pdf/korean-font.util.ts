import * as fs from 'fs';
import * as path from 'path';

// 한글 PDF 폰트 로더. dist/src 어느 쪽에서 실행돼도 assets/fonts 를 찾는다.
// (기존 exam-paper-pdf.renderer 의 로직을 공용으로 추출)
export function loadKoreanFontBytes(fileName: string): Buffer {
  const candidates = [
    path.join(__dirname, '../../assets/fonts', fileName),
    path.join(process.cwd(), 'dist/assets/fonts', fileName),
    path.join(process.cwd(), 'src/assets/fonts', fileName),
    path.join(__dirname, '../assets/fonts', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate);
  }
  throw new Error(`한글 PDF 폰트(${fileName})를 찾을 수 없습니다.`);
}
