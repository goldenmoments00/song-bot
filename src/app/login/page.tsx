"use client";

import { signIn } from "next-auth/react";
import styles from "./login.module.css";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import Image from "next/image";
import gmLogo from "../../../public/gm-logo.png";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      {/* Background decoration */}
      <div className={styles.bgDecoration1} />
      <div className={styles.bgDecoration2} />

      <motion.div
        className={styles.loginCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.logoWrapper}>
          <Image src={gmLogo} alt="Golden Moment Logo" className={styles.logoImage} />
        </div>
        <h1 className={styles.title}>GoldenMoment</h1>
        <p className={styles.subtitle}>
          Curate the soundtrack for your wedding film.
        </p>

        <div className={styles.buttonGroup}>


          <button
            className={styles.guestBtn}
            onClick={() => signIn("credentials", { callbackUrl: "/" })}
          >
            <User size={20} />
            Continue as Guest
          </button>

          <a href="/admin" className={styles.adminLink}>
            Editor Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
