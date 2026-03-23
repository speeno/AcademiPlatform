'use client';

import { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  streamUrl: string;
  sessionToken?: string;
  userDisplayText?: string;
  lessonId: string;
  onProgress?: (seconds: number, completionRate?: number) => void;
  onComplete?: () => void;
}

const PING_INTERVAL = 25_000;
const WATERMARK_MOVE_INTERVAL = 12_000;

export function VideoPlayer({
  streamUrl,
  sessionToken,
  userDisplayText,
  lessonId,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watermarkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 워터마킹 오버레이
  const drawWatermark = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Pretendard, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(userDisplayText ?? '', x, y);
    ctx.restore();
  }, [userDisplayText]);

  const moveWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxX = canvas.width - 200;
    const maxY = canvas.height - 30;
    const x = Math.floor(Math.random() * maxX) + 10;
    const y = Math.floor(Math.random() * maxY) + 20;
    drawWatermark(x, y);
  }, [drawWatermark]);

  // 재생 세션 핑
  const ping = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/sessions/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ sessionToken }),
      });
    } catch {
      // 네트워크 오류 시 무시
    }
  }, [sessionToken]);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      html5: { vhs: { overrideNative: true } },
      controlBar: {
        // 다운로드 버튼 제거
        downloadButton: false,
      },
    });

    playerRef.current = player;

    // HLS 스트림 소스 설정
    player.src({ type: 'application/x-mpegURL', src: streamUrl });

    // 진도 추적
    player.on('timeupdate', () => {
      onProgress?.(Math.floor(player.currentTime() ?? 0));
    });

    player.on('ended', () => {
      onComplete?.();
    });

    // 우클릭 컨텍스트 메뉴 비활성화
    videoRef.current?.addEventListener('contextmenu', (e) => e.preventDefault());

    // 개발자도구 단축키 기본 차단 (F12, Ctrl+S)
    const keyHandler = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', keyHandler);

    // 세션 핑 인터벌
    pingRef.current = setInterval(ping, PING_INTERVAL);

    return () => {
      player.dispose();
      if (pingRef.current) clearInterval(pingRef.current);
      if (watermarkRef.current) clearInterval(watermarkRef.current);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [streamUrl, ping, onProgress, onComplete]);

  // 캔버스 크기 동기화 및 워터마크 초기화
  useEffect(() => {
    const resizeCanvas = () => {
      const wrapper = wrapperRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !canvas) return;
      canvas.width = wrapper.offsetWidth;
      canvas.height = wrapper.offsetHeight;
      moveWatermark();
    };

    const observer = new ResizeObserver(resizeCanvas);
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    watermarkRef.current = setInterval(moveWatermark, WATERMARK_MOVE_INTERVAL);
    moveWatermark();

    return () => {
      observer.disconnect();
      if (watermarkRef.current) clearInterval(watermarkRef.current);
    };
  }, [moveWatermark]);

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden select-none">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-theme-city w-full h-full"
          playsInline
        />
      </div>
      {/* 워터마킹 오버레이 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      />
    </div>
  );
}
