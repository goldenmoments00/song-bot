"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Song } from "@/app/DashboardClient";
import { GripVertical, X, Play, Pause, Star } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import styles from "./SortableSongItem.module.css";
import Image from "next/image";

interface SortableSongItemProps {
  song: Song;
  onRemove: () => void;
  onTogglePriority?: () => void;
}

export function SortableSongItem({ song, onRemove, onTogglePriority }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const { currentSong, isPlaying, playSong, pause, resume } = usePlayerStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.item}>
      <div
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      <div className={styles.thumbnailContainer}>
        {/* We use standard img to avoid Next.js Image external host config issues for now, or next/image with config */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.thumbnail}
          alt={song.title}
          className={styles.thumbnail}
          loading="lazy"
        />
        <button 
          className={`${styles.playBtn} ${currentSong?.id === song.id && isPlaying ? styles.playingBtn : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (currentSong?.id === song.id) {
              isPlaying ? pause() : resume();
            } else {
              playSong(song);
            }
          }}
          title={currentSong?.id === song.id && isPlaying ? "Pause" : "Play Preview"}
        >
          {currentSong?.id === song.id && isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className={styles.playIcon} />
          )}
        </button>
      </div>

      <div className={styles.details}>
        <a href={song.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
          {song.title}
        </a>
        <span className={styles.channel}>{song.channel}</span>
      </div>

      <div className={styles.actions}>
        {onTogglePriority && (
          <button 
            onClick={onTogglePriority} 
            className={`${styles.priorityBtn} ${song.isPriority ? styles.isPriority : ""}`}
            title={song.isPriority ? "Remove Priority" : "Mark as Priority"}
          >
            <Star size={18} fill={song.isPriority ? "currentColor" : "none"} />
          </button>
        )}
        <button onClick={onRemove} className={styles.removeBtn} title="Remove song">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
