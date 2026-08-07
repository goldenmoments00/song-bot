import React from 'react';
import { TooltipRenderProps } from "react-joyride";
import { X } from "lucide-react";
import styles from "./TourTooltip.module.css";

export default function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
}: TooltipRenderProps) {
  return (
    <div className={styles.tooltipContainer} {...tooltipProps}>
      <button type="button" className={styles.closeBtn} {...closeProps} aria-label="Close">
        <X size={16} />
      </button>
      
      {step.title && <h3 className={styles.title}>{step.title}</h3>}
      <div className={styles.content}>{step.content}</div>
      
      <div className={styles.footer}>
        <span className={styles.stepCounter}>
          {index + 1} of {size}
        </span>
        <div className={styles.actions}>
          {index > 0 && (
            <button type="button" className={styles.backBtn} {...backProps}>
              &larr; Back
            </button>
          )}
          <button type="button" className={styles.nextBtn} {...primaryProps}>
            {continuous && index < size - 1 ? "Next \u2192" : "Done \u2713"}
          </button>
        </div>
      </div>
    </div>
  );
}
