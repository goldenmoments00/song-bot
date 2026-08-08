"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronLeft, HelpCircle, Moon, CheckCircle } from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";
import CategorySection from "@/components/CategorySection";
import GlobalPlayer from "@/components/GlobalPlayer";
import * as JoyrideModule from "react-joyride";
const Joyride = (JoyrideModule as any).Joyride || (JoyrideModule as any).default || JoyrideModule;
const { STATUS } = JoyrideModule;
type Step = any;
import TourTooltip from "@/components/TourTooltip";
import styles from "./dashboard.module.css";

const WEDDING_CATEGORIES = [
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

const RICE_CEREMONY_CATEGORIES = [
  "Main Event",
  "Highlight",
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Bride Ashirbad": "/bride.png",
  "Groom Ashirbad": "/groom.png",
  "Engagement": "/engagement.png",
  "Haldi": "/haldi.png",
  "Bride Briddhi": "/Bride Briddhi.png",
  "Groom Entry": "/groomentry.png",
  "Wedding": "/wedding.png",
  "Reception": "/Reception.png",
  "Highlight": "/Highlight.png",
  "Reel": "/Reel.png",
  "Main Event": "/RC-MAINEVENT.png",
};

const getCatImage = (cat: string, eventType: string) => {
  if (eventType === "riceceremony" && cat === "Highlight") return "/RC-HIGHLIGHT.png";
  return CATEGORY_IMAGES[cat] || "/wedding.png";
};

export type Song = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
};

export type Selections = Record<string, Song[]>;

const TOUR_STEPS: Step[] = [
  {
    target: ".tour-step-1",
    title: "Welcome!",
    content: "Click here to view your wedding events and start selecting songs.",
    placement: "bottom",
  },
  {
    target: ".tour-step-2",
    title: "Event Cards",
    content: "Each card represents a wedding ceremony. Click on any card to choose songs for it.",
    placement: "bottom",
  },
  {
    target: ".tour-step-3",
    title: "Save & Lock",
    content: "Once done, click Submit to send your selections to the studio. The form will be locked afterward.",
    placement: "top",
  },
  {
    target: ".tour-step-4",
    title: "Pick Songs",
    content: "Tap + to add a song. Preview by clicking the thumbnail. Add up to 3 per event.",
    placement: "bottom",
  },
  {
    target: ".tour-step-5",
    title: "Add Your Own",
    content: "Paste a YouTube link or search YouTube directly to add a custom song.",
    placement: "top",
  }
];

export default function DashboardClient({ eventType = "wedding" }: { eventType?: "wedding" | "riceceremony" }) {
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

  // Tour State
  const [runTour, setRunTour] = useState(false);

  const categories = eventType === "wedding" ? WEDDING_CATEGORIES : RICE_CEREMONY_CATEGORIES;

  useEffect(() => {
    if (!isModalOpen && !localStorage.getItem("hasSeenTour")) {
      // Small delay to ensure UI is ready
      setTimeout(() => setRunTour(true), 500);
    }
  }, [isModalOpen]);



  const handleJoyrideCallback = (data: any) => {
    const { status, type, index, action } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      localStorage.setItem("hasSeenTour", "true");
    } else if (type === "step:after" && action === "next" && index === 2) {
      // The user clicked "Next" on Step 3. 
      // Joyride will automatically look for Step 4 (.tour-step-4) and wait up to 1000ms.
      // We just need to trigger the modal to open right now so it can find it.
      setActiveCategory(categories[0]);
      setIsCategoryModalOpen(true);
    }
  };

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
          eventType,
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
      {/* @ts-ignore */}
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        disableOverlayClose
        hideCloseButton
        tooltipComponent={TourTooltip}
        styles={{
          options: {
            zIndex: 10000,
          },
        } as any}
      />

      <AnimatePresence>
        {isModalOpen && (
          <OnboardingModal onComplete={handleOnboardingComplete} eventType={eventType} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveStatus === 'saved' && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={styles.autoSaveToast}
          >
            <CheckCircle size={20} className={styles.autoSaveIcon} />
            Auto-saved successfully
          </motion.div>
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
              {eventType === "wedding" 
                ? (brideName || groomName ? `${brideName} & ${groomName}` : "Client")
                : (brideName || "Client")}
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
          {categories.map((cat, index) => (
            <div
              key={cat}
              className={`${styles.categoryCard} ${index === 0 ? 'tour-step-1' : index === 1 ? 'tour-step-2' : ''}`}
              style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%), url('${getCatImage(cat, eventType)}')` }}
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
              backgroundImage={getCatImage(activeCategory, eventType)}
              eventType={eventType}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Footer */}
      <div className={`tour-step-3 ${styles.stickyFooter}`}>
        <div className={styles.submitWrapper}>
          <button 
            className={styles.submitBtn} 
            onClick={handleSave} 
            disabled={isSaving}
          >
            <CheckCircle size={20} />
            {saveStatus === 'saving' ? "Saving..." : saveStatus === 'saved' ? "Saved!" : `Submit All Selections (${Object.values(selections).flat().length} songs)`}
          </button>
          <p className={styles.submitSubtitle}>
            {Object.values(selections).flat().length} of {categories.length * 3} songs selected across {categories.length} events
          </p>
        </div>
      </div>

      <GlobalPlayer />
    </div>
  );
}
