'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Operator = '+' | '-' | '×';

function generateQuestion(): { a: number; b: number; op: Operator; answer: number } {
  const ops: Operator[] = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
      break;
  }

  return { a, b, op, answer };
}

interface CaptchaProps {
  onVerified: (verified: boolean) => void;
}

export function Captcha({ onVerified }: CaptchaProps) {
  const [question, setQuestion] = useState(() => generateQuestion());
  const [userAnswer, setUserAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const refresh = useCallback(() => {
    setQuestion(generateQuestion());
    setUserAnswer('');
    setStatus('idle');
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    if (userAnswer === '') {
      setStatus('idle');
      return;
    }

    const num = Number(userAnswer);
    if (Number.isNaN(num)) return;

    if (num === question.answer) {
      setStatus('correct');
      onVerified(true);
    } else {
      setStatus('wrong');
      onVerified(false);
    }
  }, [userAnswer, question.answer, onVerified]);

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-700 mb-2">
        사람 인증 <span className="text-red-500">*</span>
      </p>
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-gray-800 whitespace-nowrap select-none">
          {question.a} {question.op} {question.b} =
        </span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="정답 입력"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className={`w-28 ${
            status === 'correct'
              ? 'border-green-500 focus-visible:ring-green-300'
              : status === 'wrong' && userAnswer !== ''
                ? 'border-red-400 focus-visible:ring-red-300'
                : ''
          }`}
        />
        <button
          type="button"
          onClick={refresh}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          title="다른 문제"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        {status === 'correct' && (
          <span className="text-green-600 text-sm font-medium">✓</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">위 산술 문제를 풀어주세요.</p>
    </div>
  );
}
