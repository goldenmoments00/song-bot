"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./OnboardingModal.module.css";
import { ArrowRight, Check } from "lucide-react";
import type { Selections } from "@/app/DashboardClient";

interface OnboardingModalProps {
  onComplete: (projectId: string, brideName: string, groomName: string, selections: Selections) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    const currentProjectId = otp.join('');
    if (currentProjectId.length !== 4) {
      setError("Please enter a valid 4-digit Order ID.");
      return;
    }
    
    const fullProjectId = "#" + currentProjectId;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/songs?projectId=${encodeURIComponent(fullProjectId)}`);
      if (res.ok) {
        const data = await res.json();
        
        // If data exists, it's an existing order
        if (data.brideName || data.groomName || (data.selections && Object.keys(data.selections).length > 0)) {
           // Skip step 2 and go straight to the dashboard with loaded data
           onComplete(fullProjectId, data.brideName || "", data.groomName || "", data.selections || {});
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

  const handleFinish = () => {
    if (!brideName.trim() || !groomName.trim()) {
      setError("Please enter both Bride and Groom names.");
      return;
    }
    // Pass empty selections since it's a new order
    const fullProjectId = "#" + otp.join("");
    onComplete(fullProjectId, brideName.trim(), groomName.trim(), {});
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
          <img src="/small.png" alt="Golden Moment" className={styles.logo} />
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
                <div className={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newOtp = [...otp];
                        newOtp[index] = val.slice(-1);
                        setOtp(newOtp);
                        if (val && index < 3) {
                          inputRefs.current[index + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                          inputRefs.current[index - 1]?.focus();
                        } else if (e.key === "Enter" && otp.every(d => d !== "")) {
                          handleNext();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, '').slice(0, 4);
                        if (pasted) {
                          const newOtp = [...otp];
                          for (let i = 0; i < pasted.length; i++) {
                            if (i < 4) newOtp[i] = pasted[i];
                          }
                          setOtp(newOtp);
                          const focusIndex = Math.min(pasted.length, 3);
                          inputRefs.current[focusIndex]?.focus();
                        }
                      }}
                      className={styles.otpInput}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className={styles.description}>
                  If you don't know your Client ID, ask your editor or call the team and ask for the ID (it is on your agreement and every bill).
                </p>
              </div>
              <button 
                className={styles.button} 
                onClick={handleNext}
                disabled={isLoading || otp.some(d => d === '')}
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
