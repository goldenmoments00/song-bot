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
import { Plus, Play, Pause, X, ChevronLeft, HelpCircle, Moon, CheckCircle } from "lucide-react";
import suggestionsData from "@/data/suggestions.json";
import { usePlayerStore } from "@/store/playerStore";

const CATEGORY_SUGGESTIONS: Record<string, Song[]> = suggestionsData as Record<string, Song[]>;

interface CategorySectionProps {
  title: string;
  songs: Song[];
  allSelections?: Record<string, Song[]>;
  onChange: (songs: Song[]) => void;
  onClose: () => void;
  backgroundImage: string;
}

export default function CategorySection({
  title,
  songs,
  allSelections,
  onChange,
  onClose,
  backgroundImage,
}: CategorySectionProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [customLink, setCustomLink] = useState("");
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
      if (!songs.find((s) => s.id === song.id)) {
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

  const handleCustomLinkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink.trim()) return;
    
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: "Custom Song Link",
      channel: "Custom Link",
      thumbnail: "/small.png",
      url: customLink,
    };
    
    handleAdd(newSong);
    setCustomLink("");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Top Navigation Bar exactly like reference */}
        <div className={styles.modalTopBar}>
          <button className={styles.backBtn} onClick={onClose}>
            <ChevronLeft size={24} />
          </button>
          
          <div className={styles.topBarTitle}>
            <h3>{title}</h3>
            <p>Manage songs for this event</p>
          </div>

          <div className={styles.topBarActions}>
            <button className={styles.circleActionBtn}>
              <HelpCircle size={18} />
            </button>
            <button className={styles.circleActionBtn}>
              <Moon size={18} />
            </button>
            <button className={styles.circleActionBtn} onClick={onClose}>
              <CheckCircle size={18} />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {/* Rounded Banner Image */}
          <div 
            className={styles.bannerImageCard}
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url('${backgroundImage}')` }}
          >
            <h2 className={styles.bannerTitleText}>{title}</h2>
          </div>

          <div className={styles.progressBanner}>
            🎵 {songs.length}/5 songs selected
          </div>

          {notification && (
            <div className={styles.notificationToast}>
              {notification}
            </div>
          )}

          <div className={styles.contentSection}>
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

            {songs.length < 5 && (
              <>
                {CATEGORY_SUGGESTIONS[title] && CATEGORY_SUGGESTIONS[title].length > 0 && (
                  <div className={styles.recommendationCard}>
                    <div className={styles.cardHeader}>
                      <h4>Studio Recommended</h4>
                      <p>Hand-picked songs from your studio</p>
                    </div>
                    
                    <div className={styles.mobileSuggestions}>
                      {CATEGORY_SUGGESTIONS[title].map((song) => (
                        <div key={song.id} className={styles.mobileSongCardContainer}>
                          <div className={styles.mobileSongRow}>
                            <div className={styles.thumbContainer}>
                              <img src={song.thumbnail} alt={song.title} className={styles.mobileThumb} />
                              
                              {/* Desktop Hover Actions */}
                              <div className={styles.overlayActions}>
                                <button 
                                  className={`${styles.overlayPlayBtn} ${currentSong?.id === song.id && isPlaying ? styles.overlayPlayingBtn : ""}`}
                                  onClick={() => {
                                    if (currentSong?.id === song.id) {
                                      isPlaying ? pause() : resume();
                                    } else {
                                      playSong(song);
                                    }
                                  }}
                                >
                                  {currentSong?.id === song.id && isPlaying ? (
                                    <Pause size={20} fill="currentColor" />
                                  ) : (
                                    <Play size={20} fill="currentColor" className={styles.playIcon} />
                                  )}
                                </button>
                                <button 
                                  className={styles.overlayAddBtn}
                                  onClick={() => handleAdd(song)}
                                  title="Add to selections"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {/* Mobile Play Overlay */}
                              <button 
                                className={styles.mobileOnlyPlayBtn}
                                onClick={() => {
                                  if (currentSong?.id === song.id) {
                                    isPlaying ? pause() : resume();
                                  } else {
                                    playSong(song);
                                  }
                                }}
                              >
                                {currentSong?.id === song.id && isPlaying ? (
                                  <Pause size={16} fill="currentColor" />
                                ) : (
                                  <Play size={16} fill="currentColor" className={styles.playIcon} />
                                )}
                              </button>
                            </div>
                            
                            <div className={styles.mobileSongInfo}>
                              <h4 dangerouslySetInnerHTML={{ __html: song.title }} title={song.title} />
                              <p className={styles.mobileSubtitle}>POPULAR CHOICE</p>
                            </div>

                            {/* Mobile Add Button */}
                            <button 
                              className={styles.mobileOnlyAddBtn}
                              onClick={() => handleAdd(song)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.customLinkCard}>
                  <div className={styles.cardHeader}>
                    <h4>Add Your Own Song</h4>
                    <p>Paste a YouTube link to add a custom song</p>
                  </div>
                  <form onSubmit={handleCustomLinkAdd} className={styles.customLinkForm}>
                    <input 
                      type="url" 
                      placeholder="Paste YouTube link here..." 
                      value={customLink} 
                      onChange={e => setCustomLink(e.target.value)} 
                      className={styles.customInput}
                      required
                    />
                    <button type="submit" className={styles.customAddBtn}>Add</button>
                  </form>
                </div>

                <div className={styles.searchAlternative}>
                  <button
                    className={styles.addBtn}
                    onClick={() => {
                      setInitialSearchQuery("");
                      setIsSearchOpen(true);
                    }}
                  >
                    <Plus size={18} />
                    Search YouTube directly
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
