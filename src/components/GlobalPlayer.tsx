"use client";

import { usePlayerStore } from "@/store/playerStore";
import styles from "./GlobalPlayer.module.css";
import { useEffect, useState, useRef, useCallback } from "react";

/**
 * GlobalPlayer — Invisible audio-only YouTube player.
 * No UI — play/pause controls live on each song card.
 * This component only renders the hidden YouTube iframe.
 */
export default function GlobalPlayer() {
  const { currentSong, isPlaying, pause } = usePlayerStore();
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Send play/pause commands to YouTube iframe via postMessage API
  const sendCommand = useCallback((func: string) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args: "" }),
        "*"
      );
    }
  }, []);

  // Sync play/pause state with the iframe
  useEffect(() => {
    if (!currentSong) return;
    const timer = setTimeout(() => {
      if (isPlaying) {
        sendCommand("playVideo");
      } else {
        sendCommand("pauseVideo");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isPlaying, sendCommand, currentSong]);

  if (!mounted || !currentSong) return null;

  const embedUrl = `https://www.youtube.com/embed/${currentSong.id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0`;

  return (
    <div className={styles.hiddenIframe}>
      <iframe
        ref={iframeRef}
        key={currentSong.id}
        src={embedUrl}
        title="Music Player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        frameBorder="0"
        width="1"
        height="1"
      />
    </div>
  );
}
