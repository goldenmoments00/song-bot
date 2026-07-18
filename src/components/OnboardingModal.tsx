"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./OnboardingModal.module.css";
import { ArrowRight, Check } from "lucide-react";
import type { Selections } from "@/app/DashboardClient";

interface OnboardingModalProps {
  onComplete: (projectId: string, brideName: string, groomName: string, selections: Selections) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [projectId, setProjectId] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    if (!projectId.trim()) {
      setError("Please enter your Order ID.");
      return;
    }
    
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/songs?projectId=${encodeURIComponent(projectId.trim())}`);
      if (res.ok) {
        const data = await res.json();
        
        // If data exists, it's an existing order
        if (data.brideName || data.groomName || (data.selections && Object.keys(data.selections).length > 0)) {
           // Skip step 2 and go straight to the dashboard with loaded data
           onComplete(projectId.trim(), data.brideName || "", data.groomName || "", data.selections || {});
           return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
      // If it fails, we just proceed to step 2 as a fallback
    } finally {
      setIsLoading(false);
    }

    // New order, ask for names
    setStep(2);
  };

  const handleProjectIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const truncated = rawValue.slice(0, 4);
    setProjectId(truncated ? '#' + truncated : '');
  };

  const handleFinish = () => {
    if (!brideName.trim() || !groomName.trim()) {
      setError("Please enter both Bride and Groom names.");
      return;
    }
    // Pass empty selections since it's a new order
    onComplete(projectId.trim(), brideName.trim(), groomName.trim(), {});
  };

  return (
    <div className={styles.overlay}>
      <motion.div 
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Golden Moment</h2>
          <p className={styles.subtitle}>
            {step === 1 ? "Enter your Order ID to continue" : "Tell us about the couple"}
          </p>
        </div>

        {error && <p style={{ color: "red", textAlign: "center", marginBottom: "15px" }}>{error}</p>}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>Order ID (Client ID)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={projectId}
                  onChange={handleProjectIdChange}
                  placeholder="#1020"
                  className={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  autoFocus
                />
              </div>
              <button 
                className={styles.button} 
                onClick={handleNext}
                disabled={isLoading || !projectId.trim()}
              >
                {isLoading ? <div className={styles.loader} /> : (
                  <>Continue <ArrowRight size={20} /></>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>Bride Name</label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Rebaka"
                  className={styles.input}
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Groom Name</label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Alex"
                  className={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                />
              </div>
              <button 
                className={styles.button} 
                onClick={handleFinish}
              >
                Start Selecting <Check size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
