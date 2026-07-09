import { redirect } from 'next/navigation';

// 강의 계획 목록은 기본 달력 인터페이스(/training)에 통합되었다.
export default function TrainingProgramsPage() {
  redirect('/training');
}
