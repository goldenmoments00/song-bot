"use client";

import { useState } from "react";
import { Song } from "@/app/DashboardClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSongItem } from "./SortableSongItem";
import SongSearchModal from "./SongSearchModal";
import CoverflowCarousel from "./CoverflowCarousel";
import styles from "./CategorySection.module.css";
import { Plus, Play, Pause } from "lucide-react";
import suggestionsData from "@/data/suggestions.json";
import { usePlayerStore } from "@/store/playerStore";

const CATEGORY_SUGGESTIONS: Record<string, Song[]> = suggestionsData as Record<string, Song[]>;

interface CategorySectionProps {
  title: string;
  songs: Song[];
  allSelections?: Record<string, Song[]>;
  onChange: (songs: Song[]) => void;
}

export default function CategorySection({
  title,
  songs,
  allSelections,
  onChange,
}: CategorySectionProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const { currentSong, isPlaying, playSong, pause, resume } = usePlayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = songs.findIndex((s) => s.id === active.id);
      const newIndex = songs.findIndex((s) => s.id === over.id);
      onChange(arrayMove(songs, oldIndex, newIndex));
    }
  };

  const handleRemove = (id: string) => {
    onChange(songs.filter((s) => s.id !== id));
  };

  const handleAdd = (song: Song) => {
    if (songs.length < 5) {
      // Ensure no duplicates in the current category
      if (!songs.find((s) => s.id === song.id)) {
        // Check if it's already in another category
        if (allSelections) {
          const otherCategories = Object.entries(allSelections).filter(([catTitle, catSongs]) => 
            catTitle !== title && catSongs.some(s => s.id === song.id)
          );
          
          if (otherCategories.length > 0) {
            const categoryNames = otherCategories.map(c => c[0]).join(', ');
            setNotification(`Note: "${song.title}" is already selected in ${categoryNames}.`);
            setTimeout(() => setNotification(null), 5000);
          }
        }
        
        onChange([...songs, song]);
      }
    }
    setIsSearchOpen(false);
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{songs.length}/5</span>
      </div>

      {notification && (
        <div className={styles.notificationToast}>
          {notification}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.songList}>
            {songs.map((song) => (
              <SortableSongItem
                key={song.id}
                song={song}
                onRemove={() => handleRemove(song.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {songs.length === 0 && (
        <div className={styles.emptyState}>
          No songs selected yet. Click below to add.
        </div>
      )}

      {songs.length < 5 && (
        <div className={styles.addSection}>
          <button
            className={styles.addBtn}
            onClick={() => {
              setInitialSearchQuery("");
              setIsSearchOpen(true);
            }}
          >
            <Plus size={18} />
            Add Song for {title}
          </button>
          {CATEGORY_SUGGESTIONS[title] && CATEGORY_SUGGESTIONS[title].length > 0 && (
            <div className={styles.suggestionsContainer}>
              <span className={styles.suggestionsLabel}>Popular Ideas:</span>
              <div className={styles.desktopSuggestions}>
                <CoverflowCarousel
                  songs={CATEGORY_SUGGESTIONS[title]}
                  onSelect={handleAdd}
                />
              </div>
              <div className={styles.mobileSuggestions}>
                {CATEGORY_SUGGESTIONS[title].map((song) => (
                  <div key={song.id} className={styles.mobileSongRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={song.thumbnail} alt={song.title} className={styles.mobileThumb} />
                    <div className={styles.mobileSongInfo}>
                      <h4 dangerouslySetInnerHTML={{ __html: song.title }} />
                      <p>{song.channel}</p>
                    </div>
                    <div className={styles.mobileActions}>
                      <button 
                        className={`${styles.mobilePlayTextBtn} ${currentSong?.id === song.id && isPlaying ? styles.mobilePlayingBtn : ""}`}
                        onClick={() => {
                          if (currentSong?.id === song.id) {
                            isPlaying ? pause() : resume();
                          } else {
                            playSong(song);
                          }
                        }}
                      >
                        {currentSong?.id === song.id && isPlaying ? (
                          <><Pause size={14} fill="currentColor" /> Pause</>
                        ) : (
                          <><Play size={14} fill="currentColor" className={styles.playIcon} /> Play</>
                        )}
                      </button>
                      <button 
                        className={styles.mobileSelectBtn}
                        onClick={() => handleAdd(song)}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isSearchOpen && (
        <SongSearchModal
          onClose={() => setIsSearchOpen(false)}
          onSelect={handleAdd}
          categoryTitle={title}
          initialSearchQuery={initialSearchQuery}
        />
      )}
    </div>
  );
}
