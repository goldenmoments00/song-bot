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
      <header className={styles.header}>
        <div className={styles.logo}>GoldenMoment</div>
        <div className={styles.userControls}>
          {session?.user ? (
            <>
              {session.user.image ? (
                <img src={session.user.image} alt="User avatar" className={styles.userAvatar} />
              ) : (
                <div className={styles.userAvatarFallback}>
                  {session.user.name?.[0] || session.user.email?.[0] || "U"}
                </div>
              )}
              <span className={styles.userEmail}>{session.user.name || session.user.email}</span>
              <button onClick={() => signOut()} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <span className={styles.userEmail}>Test Mode (Auth Skipped)</span>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.intro}
        >
          <h1>Welcome, {brideName || groomName ? `${brideName} & ${groomName}` : "Client"}</h1>
          <p>Please select the soundtrack for your wedding films below.</p>
        </motion.div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px 25px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
           <div>
             <span style={{ color: "#666", fontSize: "0.9rem" }}>Order ID: </span>
             <strong style={{ color: "var(--color-bg-accent)", fontSize: "1.1rem" }}>{projectId}</strong>
           </div>
           <button onClick={() => setIsModalOpen(true)} style={{ background: "none", border: "1px solid #ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
             Change Order
           </button>
        </div>

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
