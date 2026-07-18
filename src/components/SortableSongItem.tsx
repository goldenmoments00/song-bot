"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Song } from "@/app/DashboardClient";
import { GripVertical, X } from "lucide-react";
import styles from "./SortableSongItem.module.css";
import Image from "next/image";

interface SortableSongItemProps {
  song: Song;
  onRemove: () => void;
}

export function SortableSongItem({ song, onRemove }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

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
      </div>

      <div className={styles.details}>
        <a href={song.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
          {song.title}
        </a>
        <span className={styles.channel}>{song.channel}</span>
      </div>

      <button onClick={onRemove} className={styles.removeBtn} title="Remove song">
        <X size={18} />
      </button>
    </div>
  );
}
