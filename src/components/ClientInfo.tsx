"use client";

import styles from "./ClientInfo.module.css";
import { Save } from "lucide-react";

interface ClientInfoProps {
  projectId: string;
  setProjectId: (id: string) => void;
  brideName: string;
  setBrideName: (name: string) => void;
  groomName: string;
  setGroomName: (name: string) => void;
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved";
}

export default function ClientInfo({
  projectId,
  setProjectId,
  brideName,
  setBrideName,
  groomName,
  setGroomName,
  onSave,
  saveStatus,
}: ClientInfoProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Project Information</h2>
      
      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Order ID</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="e.g. #0147"
            className={styles.input}
          />
        </div>
        
        <div className={styles.field}>
          <label>Bride Name</label>
          <input
            type="text"
            value={brideName}
            onChange={(e) => setBrideName(e.target.value)}
            placeholder="e.g. Anjali"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Groom Name</label>
          <input
            type="text"
            value={groomName}
            onChange={(e) => setGroomName(e.target.value)}
            placeholder="e.g. Rahul"
            className={styles.input}
          />
        </div>

      </div>
    </div>
  );
}
