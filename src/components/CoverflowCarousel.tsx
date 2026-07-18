"use client";

import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { Play, Pause, Plus, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { Song } from '@/app/DashboardClient';
import { usePlayerStore } from '@/store/playerStore';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import styles from './CoverflowCarousel.module.css';

interface CoverflowCarouselProps {
  songs: Song[];
  onSelect: (song: Song) => void;
}

export default function CoverflowCarousel({ songs, onSelect }: CoverflowCarouselProps) {
  const { currentSong, isPlaying, playSong, pause, resume } = usePlayerStore();

  if (!songs || songs.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        initialSlide={Math.floor(songs.length / 2)}
        coverflowEffect={{
          rotate: 0,
          stretch: 50,
          depth: 200,
          modifier: 1.5,
          slideShadows: true,
        }}
        pagination={false}
        modules={[EffectCoverflow, Pagination, Navigation]}
        className={styles.swiperContainer}
      >
        {songs.map((song) => (
          <SwiperSlide key={song.id} className={styles.swiperSlide}>
            <div className={styles.playerCardContainer}>
              <div className={styles.cardWrapper}>
                <img src={song.thumbnail} alt={song.title} className={styles.albumArt} />
                <button 
                  className={styles.addBtn}
                  onClick={() => onSelect(song)}
                  title="Add to Category"
                >
                  <Plus size={24} color="white" />
                </button>
              </div>
              <div className={styles.songInfo}>
                <div className={styles.textContainer}>
                  <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: song.title }} />
                  <p className={styles.channel}>{song.channel}</p>
                </div>
              </div>
              
              <div className={styles.progressBar}>
                 <div className={styles.progressTrack}>
                    <div className={styles.progressFill}></div>
                    <div className={styles.progressThumb}></div>
                 </div>
                 <div className={styles.timeLabels}>
                    <span>0:00</span>
                    <span>3:45</span>
                 </div>
              </div>
              
              <div className={styles.controlsRow}>
                 <button className={styles.iconBtn}><Shuffle size={20} color="rgba(255,255,255,0.5)" /></button>
                 <button className={styles.iconBtn}><SkipBack size={28} color="white" /></button>
                 <button 
                   className={styles.mainPlayBtn}
                   onClick={() => {
                     if (currentSong?.id === song.id) {
                       isPlaying ? pause() : resume();
                     } else {
                       playSong(song);
                     }
                   }}
                 >
                   {currentSong?.id === song.id && isPlaying ? (
                     <Pause fill="currentColor" size={32} />
                   ) : (
                     <Play fill="currentColor" size={32} className={styles.playIcon} />
                   )}
                 </button>
                 <button className={styles.iconBtn}><SkipForward size={28} color="white" /></button>
                 <button className={styles.iconBtn}><Repeat size={20} color="rgba(255,255,255,0.5)" /></button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
