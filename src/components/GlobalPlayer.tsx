"use client";

import { usePlayerStore } from "@/store/playerStore";
import { useEffect, useState } from "react";
import styles from "./GlobalPlayer.module.css";
import { X, Play } from "lucide-react";

export default function GlobalPlayer() {
  const { currentSong, isPlaying, stop } = usePlayerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentSong || !isPlaying) return null;

  return (
    <div className={styles.modalOverlay} onClick={stop}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle}>
              <Play size={16} fill="currentColor" />
            </div>
            <div className={styles.titleInfo}>
              <h3 dangerouslySetInnerHTML={{ __html: currentSong.title }} />
              <p>YOUTUBE PREVIEW</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={stop}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.playerWrapper}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentSong.id}?autoplay=1&controls=1&rel=0&modestbranding=1`}
            title={currentSong.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
