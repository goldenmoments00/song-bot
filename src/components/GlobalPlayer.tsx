"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import styles from "./GlobalPlayer.module.css";
import { useEffect, useRef } from "react";

export default function GlobalPlayer() {
  const { currentSong, isPlaying, pause, resume } = usePlayerStore();
  const playerRef = useRef<HTMLIFrameElement>(null);

  // We use postMessage to communicate with the YouTube iframe API
  // to play and pause without reloading the iframe.
  useEffect(() => {
    if (playerRef.current && playerRef.current.contentWindow) {
      if (isPlaying) {
        playerRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } else {
        playerRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    }
  }, [isPlaying, currentSong]);

  if (!currentSong) return null;

  return (
    <div className={styles.hiddenPlayer}>
      <iframe
        ref={playerRef}
        src={`https://www.youtube.com/embed/${currentSong.id}?autoplay=1&enablejsapi=1`}
        allow="autoplay"
      ></iframe>
    </div>
  );
}
