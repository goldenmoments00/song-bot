"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import styles from "./GlobalPlayer.module.css";
import ReactPlayer from "react-player";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalPlayer() {
  const { currentSong, isPlaying, pause, resume } = usePlayerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className={styles.hiddenPlayer}>
        <ReactPlayer
          url={currentSong ? `https://www.youtube.com/watch?v=${currentSong.id}` : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
          playing={currentSong ? isPlaying : false}
          controls={false}
          width="1px"
          height="1px"
          config={{
            youtube: {
              // @ts-ignore
              playerVars: {
                playsinline: 1, // Crucial for iOS mobile
                autoplay: 1,
              }
            }
          }}
        />
      </div>

      <AnimatePresence>
        {currentSong && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={styles.playerWrapper}
          >
            <div className={styles.playerContainer}>
              <div className={styles.songInfo}>
                <img src={currentSong.thumbnail} alt="Thumbnail" className={styles.thumbnail} />
                <div className={styles.textInfo}>
                  <span className={styles.title}>{currentSong.title}</span>
                  <span className={styles.channel}>{currentSong.channel}</span>
                </div>
              </div>
              
              <div className={styles.controls}>
                <button className={styles.iconBtn} onClick={() => {}}><SkipBack size={20} /></button>
                <button className={styles.playBtn} onClick={isPlaying ? pause : resume}>
                  {isPlaying ? <Pause size={24} color="var(--color-bg-accent)" /> : <Play size={24} color="var(--color-bg-accent)" className={styles.playIcon} />}
                </button>
                <button className={styles.iconBtn} onClick={() => {}}><SkipForward size={20} /></button>
              </div>

              <div className={styles.rightControls}>
                <button className={styles.iconBtn}><Volume2 size={20} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
