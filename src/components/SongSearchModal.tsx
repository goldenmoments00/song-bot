"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, Play } from "lucide-react";
import { Song } from "@/app/DashboardClient";
import styles from "./SongSearchModal.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/playerStore";

interface SongSearchModalProps {
  onClose: () => void;
  onSelect: (song: Song) => void;
  categoryTitle: string;
  initialSearchQuery?: string;
}

export default function SongSearchModal({
  onClose,
  onSelect,
  categoryTitle,
  initialSearchQuery,
}: SongSearchModalProps) {
  const { playSong } = usePlayerStore();
  const [query, setQuery] = useState(initialSearchQuery || `${categoryTitle} wedding songs`);
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError("");
    
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch results");
      }
      
      setResults(data.items || []);
    } catch (err: any) {
      setError(err.message || "An error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Automatically search for relevant songs as soon as the modal opens!
    const queryToSearch = initialSearchQuery || `${categoryTitle} wedding songs`;
    performSearch(queryToSearch);
    
    // Auto-focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTitle, initialSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.header}>
          <h2>Add Song for {categoryTitle}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search YouTube for a song..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.searchBtn} disabled={isSearching}>
            {isSearching ? <Loader2 className={styles.spinner} size={20} /> : "Search"}
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.results}>
          {results.length === 0 && !isSearching && !error && query && (
             <div className={styles.emptyState}>No results found for &quot;{query}&quot;</div>
          )}
          
          {results.map((song) => (
            <div key={song.id} className={styles.resultItem}>
              <div className={styles.thumbnailContainer}>
                <div className={styles.thumbnailBtn}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={song.thumbnail} alt={song.title} className={styles.thumbnail} />
                </div>
              </div>
              <a href={song.url} target="_blank" rel="noopener noreferrer" className={styles.details} title="Listen on YouTube">
                <div className={styles.title}>{song.title}</div>
                <div className={styles.channel}>{song.channel}</div>
              </a>
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.playActionBtn}
                  onClick={() => playSong(song)}
                  title="Play Preview"
                >
                  <Play size={16} className={styles.playIcon} /> Play
                </button>
                <button
                  type="button"
                  className={styles.selectBtn}
                  onClick={() => onSelect(song)}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
