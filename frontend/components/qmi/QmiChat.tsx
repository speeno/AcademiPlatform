'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetchWithAuth, apiFetch, parseJsonSafe } from '@/lib/api-client';
import { isLoggedIn } from '@/lib/auth';
import {
  QMI_AVATAR,
  qmiPoseSrc,
  QMI_WALK_FRAMES,
  QMI_CLIMB_FRAMES,
  QMI_DESCEND_FRAMES,
  QMI_SWING_FRAMES,
} from './poses';

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

const PERSONAL_STARTERS = [
  '내 시험 점수 확인',
  '다음 시험 일정',
  '수강 중인 강의 진도',
  '시험 신청 방법',
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

/** 걷기/오르내리기(닫힘 런처) 이동 파라미터 */
const LAUNCHER_SIZE = 70; // 런처 버튼 한 변(px)
const EDGE_MARGIN = 20; // 화면 가장자리 여백(px)
const WALK_SPEED = 70; // 좌우 걷기 속도(px/s)
const VERT_SPEED = 58; // 위/아래 이동 속도(px/s)
const WALK_MIN_DIST = 60; // 이보다 가까우면 다시 목적지 선택
const TOP_MARGIN = 96; // 위로 올라갈 때 상단(내비 영역) 여백
const CLIMB_MIN = 120; // 최소 이 정도는 올라가야 눈에 띔
const BOTTOM_OFFSET = 20; // 런처 래퍼의 bottom-5(=1.25rem)
const DRAG_THRESHOLD = 4; // 이보다 움직이면 클릭이 아니라 드래그
const SWING_MS = 85; // 드래그 중 스윙 프레임 교체 간격
/** 좌→우로 달랑거리는 핑퐁 순서(1=좌, 6=우) */
const SWING_SEQ = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];

/** 이동 모드별 프레임셋과 프레임 교체 간격(ms) */
type MoveMode = 'idle' | 'walk' | 'climb' | 'descend';
const MOVE_FRAMES: Record<Exclude<MoveMode, 'idle'>, { frames: string[]; ms: number }> = {
  walk: { frames: QMI_WALK_FRAMES, ms: 140 },
  climb: { frames: QMI_CLIMB_FRAMES, ms: 110 },
  descend: { frames: QMI_DESCEND_FRAMES, ms: 130 },
};

const maxWalkX = () =>
  Math.max(EDGE_MARGIN, window.innerWidth - LAUNCHER_SIZE - EDGE_MARGIN);
const maxClimbY = () =>
  Math.max(
    CLIMB_MIN,
    Math.min(window.innerHeight * 0.55, window.innerHeight - LAUNCHER_SIZE - TOP_MARGIN),
  );

export function QmiChat() {
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [suggestions, setSuggestions] = useState<string[]>(
    loggedIn ? PERSONAL_STARTERS : DEFAULT_STARTERS,
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 런처(닫힘 상태) 캐릭터 포즈 순환 + 능동 말풍선
  const [launcherPose, setLauncherPose] = useState('waving');
  const [bubble, setBubble] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const lastMsgRef = useRef(-1);

  // 런처가 화면을 걸어/올라/내려 다니게 하는 상태
  const [posX, setPosX] = useState<number | null>(null); // 좌측 기준 px, 마운트 전엔 null
  const [posY, setPosY] = useState(0); // 하단 기준 px (0 = 바닥)
  const [vw, setVw] = useState(0); // 뷰포트 너비(말풍선 클램프용)
  const [mode, setMode] = useState<MoveMode>('idle');
  const [facing, setFacing] = useState<'right' | 'left'>('left');
  const [frameIdx, setFrameIdx] = useState(0);
  const [moveDur, setMoveDur] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [swingIdx, setSwingIdx] = useState(0);
  const pressRef = useRef<{ id: number; sx: number; sy: number; moved: boolean } | null>(null);
  const posXRef = useRef<number | null>(null);
  const posYRef = useRef(0);
  useEffect(() => {
    posXRef.current = posX;
  }, [posX]);
  useEffect(() => {
    posYRef.current = posY;
  }, [posY]);

  // 마운트: 우하단 도킹 위치 초기화 + reduced-motion / resize 감지
  useEffect(() => {
    setVw(window.innerWidth);
    setPosX(maxWalkX());

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMq = () => setReduceMotion(mq.matches);
    applyMq();
    mq.addEventListener('change', applyMq);

    const onResize = () => {
      setVw(window.innerWidth);
      const max = maxWalkX();
      setPosX((x) => (x == null ? max : Math.min(Math.max(x, EDGE_MARGIN), max)));
      setPosY((y) => Math.min(y, maxClimbY()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener('change', applyMq);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // 이동 스케줄러: 닫힘 && 음소거 아님 && 모션 허용 && 드래그 아님 && 마운트됨
  const ready = posX !== null;
  useEffect(() => {
    if (open || muted || reduceMotion || dragging || !ready) return;
    let cancelled = false;
    let frameTimer: ReturnType<typeof setInterval> | undefined;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t);
          resolve();
        }, ms);
        timers.add(t);
      });

    // 한 구간 이동: 해당 모드 프레임을 재생하며 (x,y)로 활주, 도착까지 대기 후 멈춤
    const animateTo = async (
      targetX: number,
      targetY: number,
      m: Exclude<MoveMode, 'idle'>,
      dir?: 'right' | 'left',
    ) => {
      const curX = posXRef.current ?? 0;
      const curY = posYRef.current ?? 0;
      const dist = Math.hypot(targetX - curX, targetY - curY);
      const speed = m === 'walk' ? WALK_SPEED : VERT_SPEED;
      const dur = Math.min(7000, Math.max(500, (dist / speed) * 1000));
      const set = MOVE_FRAMES[m];
      if (dir) setFacing(dir);
      setMode(m);
      setMoveDur(dur);
      setFrameIdx(0);
      setPosX(targetX);
      setPosY(targetY);
      posXRef.current = targetX;
      posYRef.current = targetY;

      let f = 0;
      frameTimer = setInterval(() => {
        f = (f + 1) % set.frames.length;
        setFrameIdx(f);
      }, set.ms);

      await wait(dur);
      if (frameTimer) {
        clearInterval(frameTimer);
        frameTimer = undefined;
      }
      if (!cancelled) {
        setMode('idle');
        setFrameIdx(0);
      }
    };

    const loop = async () => {
      while (!cancelled) {
        await wait(15000 + Math.random() * 25000); // 15~40s 멈춰 있음
        if (cancelled) break;

        // 드래그로 공중에 놓였으면 먼저 바닥으로 내려옴
        if ((posYRef.current ?? 0) > 4) {
          await animateTo(posXRef.current ?? 0, 0, 'descend');
          if (cancelled) break;
        }

        if (Math.random() < 0.35) {
          // 세로 나들이: 제자리에서 위로 올라갔다가 잠시 후 바닥으로 내려옴
          const upY = CLIMB_MIN + Math.random() * (maxClimbY() - CLIMB_MIN);
          await animateTo(posXRef.current ?? 0, upY, 'climb');
          if (cancelled) break;
          await wait(1400 + Math.random() * 1800); // 위에서 잠깐 머무름
          if (cancelled) break;
          await animateTo(posXRef.current ?? 0, 0, 'descend');
        } else {
          // 하단을 따라 좌우로 걷기
          const curX = posXRef.current ?? 0;
          const targetX = EDGE_MARGIN + Math.random() * (maxWalkX() - EDGE_MARGIN);
          if (Math.abs(targetX - curX) < WALK_MIN_DIST) continue;
          await animateTo(targetX, 0, 'walk', targetX > curX ? 'right' : 'left');
        }
      }
    };
    loop();

    return () => {
      cancelled = true;
      if (frameTimer) clearInterval(frameTimer);
      timers.forEach(clearTimeout);
      setMode('idle');
      setFrameIdx(0);
    };
  }, [open, muted, reduceMotion, dragging, ready]);

  // 드래그 중: 스윙 프레임을 핑퐁으로 순환(좌우 달랑달랑)
  useEffect(() => {
    if (!dragging) return;
    let k = 0;
    const t = setInterval(() => {
      k = (k + 1) % SWING_SEQ.length;
      setSwingIdx(SWING_SEQ[k]);
    }, SWING_MS);
    return () => clearInterval(t);
  }, [dragging]);

  // 포인터로 런처를 원하는 위치로 드래그. 이동이 임계값 미만이면 클릭(채팅 열기)으로 처리.
  const dragTo = useCallback((clientX: number, clientY: number) => {
    const x = Math.min(Math.max(clientX - LAUNCHER_SIZE / 2, EDGE_MARGIN), maxWalkX());
    const maxY = Math.max(
      0,
      window.innerHeight - BOTTOM_OFFSET - LAUNCHER_SIZE - EDGE_MARGIN,
    );
    const y = Math.min(
      Math.max(window.innerHeight - clientY - BOTTOM_OFFSET - LAUNCHER_SIZE / 2, 0),
      maxY,
    );
    setPosX(x);
    setPosY(y);
    posXRef.current = x;
    posYRef.current = y;
  }, []);

  const onLauncherPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    pressRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onLauncherPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const p = pressRef.current;
      if (!p || p.id !== e.pointerId) return;
      if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > DRAG_THRESHOLD) {
        p.moved = true;
        setDragging(true);
      }
      if (p.moved) dragTo(e.clientX, e.clientY);
    },
    [dragTo],
  );

  const onLauncherPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const p = pressRef.current;
    if (!p || p.id !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const wasDrag = p.moved;
    pressRef.current = null;
    setDragging(false);
    setSwingIdx(0);
    if (!wasDrag) setOpen(true); // 이동 없이 놓으면 클릭 → 채팅 열기
  }, []);

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
        const fetchFn = loggedIn ? apiFetchWithAuth : apiFetch;
        const res = await fetchFn('/qmi/chat', {
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
      {/* 런처 (닫힘 상태): 화면을 걸어다니며 포즈 순환 + 능동 말풍선 */}
      {!open && (
        <>
          {/* 능동 말풍선: 바닥에 멈춰 있을 때만, 마스코트 위·뷰포트 안으로 클램프 */}
          {mode === 'idle' && posY === 0 && !dragging && bubble && posX != null && (
            <div
              className="fixed bottom-[6.25rem] z-50 max-w-[15rem] animate-in fade-in slide-in-from-bottom-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-xl ring-1 ring-black/5"
              style={{
                left: vw
                  ? Math.min(Math.max(posX + LAUNCHER_SIZE / 2, 128), vw - 128)
                  : posX + LAUNCHER_SIZE / 2,
                transform: 'translateX(-50%)',
              }}
            >
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
              <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
            </div>
          )}

          {/* 마스코트 런처: translate 로 화면을 활주(걷기·오르내리기)한다 */}
          <div
            className="fixed bottom-5 left-0 z-50 will-change-transform"
            style={{
              transform: `translate(${posX ?? 0}px, ${-posY}px)`,
              transition: mode !== 'idle' ? `transform ${moveDur}ms linear` : 'none',
              visibility: posX == null ? 'hidden' : 'visible',
            }}
          >
            <button
              type="button"
              onPointerDown={onLauncherPointerDown}
              onPointerMove={onLauncherPointerMove}
              onPointerUp={onLauncherPointerUp}
              onPointerCancel={() => {
                pressRef.current = null;
                setDragging(false);
                setSwingIdx(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
              aria-label="공부도우미 큐미 열기 (드래그해서 옮길 수 있어요)"
              className={`relative flex h-[70px] w-[70px] touch-none select-none items-center justify-center rounded-full transition ${
                dragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105'
              }`}
            >
              {dragging ? (
                <img
                  src={QMI_SWING_FRAMES[swingIdx]}
                  alt="큐미"
                  draggable={false}
                  className="h-[70px] w-[70px] object-contain drop-shadow-xl"
                  style={{ transformOrigin: '50% 0%' }}
                />
              ) : mode !== 'idle' ? (
                <img
                  src={
                    MOVE_FRAMES[mode].frames[frameIdx % MOVE_FRAMES[mode].frames.length]
                  }
                  alt="큐미"
                  draggable={false}
                  className="h-[66px] w-[66px] object-contain drop-shadow-lg"
                  style={
                    mode === 'walk'
                      ? { transform: `scaleX(${facing === 'left' ? -1 : 1})` }
                      : undefined
                  }
                />
              ) : (
                <img
                  key={launcherPose}
                  src={qmiPoseSrc(launcherPose)}
                  alt="큐미"
                  draggable={false}
                  className="h-[66px] w-[66px] animate-in fade-in zoom-in-95 object-contain drop-shadow-lg duration-500"
                />
              )}
              {!dragging && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
                </span>
              )}
            </button>
          </div>
        </>
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
