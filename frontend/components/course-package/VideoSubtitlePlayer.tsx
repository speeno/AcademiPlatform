'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Subtitles, EyeOff } from 'lucide-react';

interface VideoSubtitlePlayerProps {
  videoUrl: string;
  subtitleVttUrl?: string | null;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  className?: string;
}

export function VideoSubtitlePlayer({
  videoUrl,
  subtitleVttUrl,
  onTimeUpdate,
  onEnded,
  className = '',
}: VideoSubtitlePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;
    onTimeUpdate(video.currentTime);
  }, [onTimeUpdate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = subtitlesEnabled ? 'showing' : 'hidden';
    }
  }, [subtitlesEnabled, subtitleVttUrl]);

  const toggleSubtitles = () => setSubtitlesEnabled((prev) => !prev);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black"
        controls
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
      >
        <source src={videoUrl} type="video/mp4" />
        {subtitleVttUrl && (
          <track
            kind="subtitles"
            src={subtitleVttUrl}
            srcLang="ko"
            label="한국어"
            default
          />
        )}
      </video>

      {subtitleVttUrl && (
        <button
          type="button"
          onClick={toggleSubtitles}
          className="absolute bottom-14 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition"
          title={subtitlesEnabled ? '자막 끄기' : '자막 켜기'}
        >
          {subtitlesEnabled ? (
            <Subtitles className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

export type { VideoSubtitlePlayerProps };
export { VideoSubtitlePlayer as default };
