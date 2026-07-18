import { create } from "zustand";
import { Song } from "@/app/DashboardClient";

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pause: () => void;
  resume: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  playSong: (song) => set({ currentSong: song, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set((state) => ({ isPlaying: state.currentSong ? true : false })),
}));
