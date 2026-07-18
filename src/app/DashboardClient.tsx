"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.intro}
        >
          <h1 className={styles.welcomeHeading}>
            Welcome,<br />
            <span className={styles.clientName}>
              {brideName || groomName ? `${brideName} & ${groomName}` : "Client"}
            </span>
          </h1>
          <p>Please select the soundtrack for your wedding films below.</p>
        </motion.div>

        <div className={styles.tabsContainer}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.tabBtn} ${activeCategory === cat ? styles.activeTab : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              {selections[cat]?.length > 0 && (
                <span className={styles.tabBadge}>{selections[cat].length}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.categoryContent}>
          <CategorySection
            key={activeCategory}
            title={activeCategory}
            songs={selections[activeCategory] || []}
            allSelections={selections}
            onChange={(newSongs) =>
              setSelections((prev) => ({ ...prev, [activeCategory]: newSongs }))
            }
          />
        </div>
      </main>

      <div className={styles.saveActionContainer}>
         <button onClick={handleSave} className={styles.mainSaveBtn} disabled={isSaving}>
            {isSaving ? "Saving..." : saveStatus === "saved" ? "Saved Successfully" : "Save Changes"}
         </button>
      </div>

      <GlobalPlayer />
    </div>
  );
}
