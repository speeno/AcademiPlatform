'use client';

import { createContext, useContext } from 'react';
import type { TrainingProgram } from '@/lib/training-types';

interface TrainingProgramContextValue {
  program: TrainingProgram;
  refresh: () => Promise<void>;
}

const TrainingProgramContext = createContext<TrainingProgramContextValue | null>(null);

export function TrainingProgramProvider({
  value,
  children,
}: {
  value: TrainingProgramContextValue;
  children: React.ReactNode;
}) {
  return (
    <TrainingProgramContext.Provider value={value}>
      {children}
    </TrainingProgramContext.Provider>
  );
}

/** 프로그램 상세([id]) 하위 페이지에서 사용 — 레이아웃이 1회 fetch 한 프로그램 공유 */
export function useTrainingProgram(): TrainingProgramContextValue {
  const ctx = useContext(TrainingProgramContext);
  if (!ctx) {
    throw new Error('useTrainingProgram 은 프로그램 상세 레이아웃 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
