'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, parseJsonSafe } from '@/lib/api-client';
import { QMI_AVATAR, qmiPoseSrc } from './poses';

interface QmiChatResponse {
  reply: string;
  source: 'intent' | 'knowledge' | 'fallback';
  pose: string;
  suggestions: string[];
  matchedId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'qmi';
  text: string;
  pose?: string;
}

let msgSeq = 0;
const nextId = () => `m${Date.now()}-${msgSeq++}`;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'qmi',
  text: '안녕하세요! 저는 공부도우미 큐미예요. 🤖\n공부 방법이나 강의·시험·결제 같은 사이트 이용까지 무엇이든 물어보세요!',
  pose: 'greeting',
};

const DEFAULT_STARTERS = [
  '공부 계획 세우기',
  '집중 잘 하는 법',
  '강의 수강 방법',
  '온라인 시험 응시 방법',
];

/** 런처가 닫혀 있을 때 주기적으로 순환하는 큐미 포즈 */
const LAUNCHER_POSES = [
  'waving', 'idle', 'thumbs-up', 'idea', 'excited',
  'greeting', 'jumping', 'cheer', 'presenting', 'guiding',
];

/** 닫혀 있을 때 랜덤/상황으로 띄우는 능동 말풍선 (메시지 + 어울리는 포즈) */
const PROACTIVE_MESSAGES: { text: string; pose: string }[] = [
  { text: '궁금한 거 있으면 물어봐! 🤔', pose: 'idea' },
  { text: '오늘 기분은 어때요? 😊', pose: 'greeting' },
  { text: '공부하다 막히면 큐미를 불러줘!', pose: 'presenting' },
  { text: '오늘도 화이팅이에요! 💪', pose: 'cheer' },
  { text: '뭐든 편하게 질문해요 🙌', pose: 'welcome' },
  { text: '강의·시험·결제, 다 도와줄게요!', pose: 'guiding' },
  { text: '잠깐 쉬어가도 좋아요 ☕', pose: 'idle' },
  { text: '공부 계획 같이 세워볼까요? 📚', pose: 'expert-pointing' },
  { text: '오늘은 어떤 걸 배워볼까요?', pose: 'thumbs-up' },
  { text: '큐미가 여기서 기다리고 있어요!', pose: 'waving' },
];

export function QmiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_STARTERS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 런처(닫힘 상태) 캐릭터 포즈 순환 + 능동 말풍선
  const [launcherPose, setLauncherPose] = useState('waving');
  const [bubble, setBubble] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const lastMsgRef = useRef(-1);

  useEffect(() => {
    if (open || muted) {
      setBubble(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let poseIdx = 0;

    const pickMessage = () => {
      let i = Math.floor(Math.random() * PROACTIVE_MESSAGES.length);
      if (i === lastMsgRef.current) i = (i + 1) % PROACTIVE_MESSAGES.length;
      lastMsgRef.current = i;
      return PROACTIVE_MESSAGES[i];
    };

    const tick = () => {
      if (cancelled) return;
      // 70%는 말풍선 표시, 30%는 조용히 포즈만 변경
      if (Math.random() < 0.7) {
        const m = pickMessage();
        setLauncherPose(m.pose);
        setBubble(m.text);
        timer = setTimeout(() => {
          if (cancelled) return;
          setBubble(null);
          timer = setTimeout(tick, 16000 + Math.random() * 14000); // 16~30s 후 재등장
        }, 7000); // 말풍선 7s 노출
      } else {
        poseIdx = (poseIdx + 1) % LAUNCHER_POSES.length;
        setLauncherPose(LAUNCHER_POSES[poseIdx]);
        timer = setTimeout(tick, 9000);
      }
    };

    timer = setTimeout(tick, 3500); // 첫 인사까지 살짝 대기
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, muted]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, loading, scrollToBottom]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loading) return;

      setInput('');
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
      setLoading(true);

      try {
        const res = await apiFetch('/qmi/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await parseJsonSafe<QmiChatResponse | null>(res, null);

        if (data?.reply) {
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'qmi', text: data.reply, pose: data.pose },
          ]);
          setSuggestions(data.suggestions?.length ? data.suggestions : DEFAULT_STARTERS);
        } else {
          throw new Error('empty');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'qmi',
            text: '앗, 지금은 큐미가 응답하기 어려워요. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요. 🙏',
            pose: 'surprised',
          },
        ]);
        setSuggestions(DEFAULT_STARTERS);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <>
      {/* 런처 (닫힘 상태): 포즈 순환 + 능동 말풍선 */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          {bubble && (
            <div className="relative mr-1 max-w-[15rem] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-xl ring-1 ring-black/5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBubble(null);
                  setMuted(true);
                }}
                aria-label="알림 끄기"
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <button type="button" onClick={() => setOpen(true)} className="text-left">
                {bubble}
              </button>
              <span className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 bg-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="공부도우미 큐미 열기"
            className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full transition hover:scale-105"
          >
            <img
              key={launcherPose}
              src={qmiPoseSrc(launcherPose)}
              alt="큐미"
              className="h-[66px] w-[66px] animate-in fade-in zoom-in-95 object-contain drop-shadow-lg duration-500"
            />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
            </span>
          </button>
        </div>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[34rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          {/* 헤더 */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-white">
            <img src={QMI_AVATAR} alt="큐미" className="h-9 w-9 rounded-full bg-white/20 object-contain" />
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">공부도우미 큐미</p>
              <p className="text-[11px] text-white/80">학습·이용 가이드를 도와드려요</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="rounded-full p-1 text-white/90 transition hover:bg-white/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((m) =>
              m.role === 'qmi' ? (
                <div key={m.id} className="flex items-end gap-2">
                  <img src={qmiPoseSrc(m.pose)} alt="큐미" className="h-9 w-9 flex-shrink-0 object-contain" />
                  <div className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-br-sm bg-indigo-600 px-3 py-2 text-sm text-white shadow-sm">
                    {m.text}
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-end gap-2">
                <img src={qmiPoseSrc('idle')} alt="큐미" className="h-9 w-9 flex-shrink-0 object-contain" />
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                </div>
              </div>
            )}
          </div>

          {/* 추천 칩 */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => send(s)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[12px] text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* 입력 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 점을 입력하세요"
              maxLength={500}
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="보내기"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default QmiChat;
