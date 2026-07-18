"use client";

import { usePlayerStore } from "@/store/playerStore";
import { X, Minimize2, Maximize2 } from "lucide-react";
import styles from "./GlobalPlayer.module.css";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalPlayer() {
  const { currentSong, isPlaying, pause, stop } = usePlayerStore();
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When a new song is selected, expand the player
  useEffect(() => {
    if (currentSong) {
      setMinimized(false);
    }
  }, [currentSong?.id]);

  const handleClose = useCallback(() => {
    stop();
  }, [stop]);

  if (!mounted || !currentSong) return null;

  // Build the YouTube embed URL with autoplay
  const embedUrl = `https://www.youtube.com/embed/${currentSong.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`${styles.playerWrapper} ${minimized ? styles.minimized : ""}`}
        >
          {/* Top bar with song info and controls */}
          <div className={styles.topBar}>
            <div className={styles.songMeta}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentSong.thumbnail} alt="" className={styles.thumbSmall} />
              <div className={styles.songText}>
                <span className={styles.songTitle}>{currentSong.title}</span>
                <span className={styles.songChannel}>{currentSong.channel}</span>
              </div>
            </div>
            <div className={styles.topActions}>
              <button
                className={styles.actionBtn}
                onClick={() => setMinimized((m) => !m)}
                title={minimized ? "Expand" : "Minimize"}
              >
                {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                className={styles.actionBtn}
                onClick={handleClose}
                title="Close player"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* YouTube iframe - visible with native controls so it actually plays */}
          {!minimized && (
            <div className={styles.videoContainer}>
              <iframe
                key={currentSong.id}
                src={embedUrl}
                title={currentSong.title}
                className={styles.youtubeFrame}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
