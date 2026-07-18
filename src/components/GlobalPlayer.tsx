"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import styles from "./GlobalPlayer.module.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalPlayer() {
  const { currentSong, isPlaying, pause, resume, stop } = usePlayerStore();
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);
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
    // Small delay to ensure iframe is loaded
    const timer = setTimeout(() => {
      if (isPlaying) {
        sendCommand("playVideo");
      } else {
        sendCommand("pauseVideo");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isPlaying, sendCommand, currentSong]);

  // Sync mute state with the iframe
  useEffect(() => {
    if (!currentSong) return;
    const timer = setTimeout(() => {
      sendCommand(muted ? "mute" : "unMute");
    }, 300);
    return () => clearTimeout(timer);
  }, [muted, sendCommand, currentSong]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handleClose = useCallback(() => {
    stop();
  }, [stop]);

  if (!mounted) return null;

  // YouTube embed URL with enablejsapi for postMessage control
  const embedUrl = currentSong
    ? `https://www.youtube.com/embed/${currentSong.id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0`
    : null;

  return (
    <>
      {/* Hidden YouTube iframe — audio only, no visible video */}
      {currentSong && embedUrl && (
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
      )}

      {/* Beautiful bottom music bar */}
      <AnimatePresence>
        {currentSong && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={styles.playerBar}
          >
            <div className={styles.playerInner}>
              {/* Song info */}
              <div className={styles.songInfo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentSong.thumbnail} alt="" className={styles.thumbnail} />
                <div className={styles.textInfo}>
                  <span className={styles.title}>{currentSong.title}</span>
                  <span className={styles.channel}>{currentSong.channel}</span>
                </div>
              </div>

              {/* Center controls */}
              <div className={styles.controls}>
                <button className={styles.iconBtn} onClick={() => {}}>
                  <SkipBack size={20} />
                </button>
                <button className={styles.playBtn} onClick={handlePlayPause}>
                  {isPlaying ? (
                    <Pause size={22} fill="var(--color-bg-accent, #1a1a1a)" color="var(--color-bg-accent, #1a1a1a)" />
                  ) : (
                    <Play size={22} fill="var(--color-bg-accent, #1a1a1a)" color="var(--color-bg-accent, #1a1a1a)" className={styles.playIcon} />
                  )}
                </button>
                <button className={styles.iconBtn} onClick={() => {}}>
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Right controls */}
              <div className={styles.rightControls}>
                <button className={styles.iconBtn} onClick={() => setMuted((m) => !m)}>
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button className={styles.closeBtn} onClick={handleClose}>
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
