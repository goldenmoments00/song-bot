"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronLeft, HelpCircle, Moon, CheckCircle } from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";
import CategorySection from "@/components/CategorySection";
import GlobalPlayer from "@/components/GlobalPlayer";
import styles from "./dashboard.module.css";

const CATEGORIES = [
  "Bride Ashirbad",
  "Groom Ashirbad",
  "Engagement",
  "Haldi",
  "Bride Briddhi",
  "Groom Entry",
  "Wedding",
  "Reception",
  "Highlight",
  "Reel",
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Bride Ashirbad": "/bride.png",
  "Groom Ashirbad": "/groom.png",
  "Engagement": "https://images.unsplash.com/photo-1549416878-b9ca95e1bb34?auto=format&fit=crop&q=80",
  "Haldi": "https://images.unsplash.com/photo-1621841355461-89307775945c?auto=format&fit=crop&q=80",
  "Bride Briddhi": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80",
  "Groom Entry": "https://images.unsplash.com/photo-1614264669534-11e4056263f3?auto=format&fit=crop&q=80",
  "Wedding": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80",
  "Reception": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80",
  "Highlight": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80",
  "Reel": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80",
};

export type Song = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
};

export type Selections = Record<string, Song[]>;

export default function DashboardClient() {
  const { data: session } = useSession();
  const [projectId, setProjectId] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [selections, setSelections] = useState<Selections>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(true);

  // We no longer auto-fetch here because the OnboardingModal handles the initial fetch.

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          brideName,
          groomName,
          selections,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save: ${errorData.error || "Unknown error"}. Make sure you typed an Order ID!`);
        setSaveStatus("idle");
      }
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to connect to the server. Did you restart the server?");
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // Auto-save logic
  useEffect(() => {
    // Skip auto-save on initial mount when selections are empty or just loaded
    const timeoutId = setTimeout(() => {
       if (Object.keys(selections).length > 0 || projectId || brideName || groomName) {
          handleSave();
       }
    }, 5000); // 5 second debounce for auto-save

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, brideName, groomName, selections]);

  const handleOnboardingComplete = (id: string, bride: string, groom: string, loadedSelections: Selections) => {
    setProjectId(id);
    setBrideName(bride);
    setGroomName(groom);
    if (Object.keys(loadedSelections).length > 0) {
      setSelections(loadedSelections);
    }
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {isModalOpen && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <main className={styles.main}>
        {/* Top Bar for Dashboard matching the reference */}
        <div className={styles.dashboardTopBar}>
          <button onClick={() => signOut()} className={styles.backBtn} title="Logout">
            <ChevronLeft size={24} />
          </button>
          
          <div className={styles.topBarTitle}>
            <h3>Select an Event</h3>
            <p>
              {brideName || groomName ? `${brideName} & ${groomName}` : "Client"} 
              {projectId ? ` • Order #${projectId}` : ""}
            </p>
          </div>

          <div className={styles.topBarActions}>
            <button className={styles.circleActionBtn}>
              <HelpCircle size={18} />
            </button>
            <button className={styles.circleActionBtn}>
              <Moon size={18} />
            </button>
            <button 
              className={`${styles.circleActionBtn} ${saveStatus === 'saved' ? styles.savedBtn : ''}`}
              onClick={handleSave}
              disabled={isSaving}
              title="Save Changes"
            >
              <CheckCircle size={18} />
            </button>
          </div>
        </div>

        <div className={styles.categoryCardList}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={styles.categoryCard}
              style={{ backgroundImage: `url('${CATEGORY_IMAGES[cat]}')` }}
              onClick={() => {
                setActiveCategory(cat);
                setIsCategoryModalOpen(true);
              }}
            >
              <h2 className={styles.cardTitle}>{cat}</h2>
              <div className={styles.cardBadge}>
                🎵 {selections[cat]?.length || 0}/3 songs
              </div>
              <div className={styles.cardCircleHint}></div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isCategoryModalOpen && activeCategory && (
            <CategorySection
              key={activeCategory}
              title={activeCategory}
              songs={selections[activeCategory] || []}
              allSelections={selections}
              onChange={(newSongs) =>
                setSelections((prev) => ({ ...prev, [activeCategory]: newSongs }))
              }
              onClose={() => setIsCategoryModalOpen(false)}
              backgroundImage={CATEGORY_IMAGES[activeCategory]}
            />
          )}
        </AnimatePresence>
      </main>

      <GlobalPlayer />
    </div>
  );
}
