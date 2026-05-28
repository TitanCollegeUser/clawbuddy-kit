import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface VideoPlayerHandle {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

interface Props {
  videoId: string;
}

let apiLoaded = false;
let apiReady = false;
const pendingCallbacks: (() => void)[] = [];

function loadYTApi(cb: () => void) {
  if (apiReady) { cb(); return; }
  pendingCallbacks.push(cb);
  if (apiLoaded) return;
  apiLoaded = true;

  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    pendingCallbacks.forEach((fn) => fn());
    pendingCallbacks.length = 0;
  };

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(({ videoId }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    seekTo: (s) => playerRef.current?.seekTo?.(s, true),
  }));

  useEffect(() => {
    let player: any;
    loadYTApi(() => {
      if (!containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { playerRef.current = player; },
        },
      });
    });
    return () => { player?.destroy?.(); playerRef.current = null; };
  }, [videoId]);

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});
VideoPlayer.displayName = "VideoPlayer";
