"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Copy, X, Check, Trash2 } from "lucide-react";


type SongSelection = {
  id: string;
  category: string;
  songId: string;
  title: string;
  url: string;
  thumbnail: string;
};

type Order = {
  id: string;
  projectId: string;
  eventType: string;
  brideName: string;
  groomName: string;
  createdAt: string;
  selections: SongSelection[];
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders`);
      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      } else {
        alert("Failed to delete order");
      }
    } catch (err) {
      alert("Error deleting order");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard} style={{ margin: '0 auto', textAlign: 'center' }}>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard} style={{ margin: '0 auto', textAlign: 'center', color: 'red' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Client Selections</h1>
      </header>

      <div className={styles.dashboard}>
        {orders.length === 0 ? (
          <div className={styles.loginCard} style={{ margin: '0 auto' }}>
            <p>No client orders found yet.</p>
          </div>
        ) : (
          orders.map(order => {
            // Group songs by category
            const grouped = order.selections.reduce((acc, song) => {
              if (!acc[song.category]) acc[song.category] = [];
              acc[song.category].push(song);
              return acc;
            }, {} as Record<string, SongSelection[]>);

            return (
              <div key={order.id} className={styles.clientCard}>
                <div className={styles.clientHeader}>
                  <div className={styles.clientHeaderLeft}>
                    <span className={styles.clientId}>#{order.projectId}</span>
                    <span className={styles.clientName}>
                      {order.brideName && order.groomName 
                        ? `${order.brideName} & ${order.groomName}`
                        : (order.brideName || order.groomName || "Unknown Client")}
                      <span style={{ marginLeft: "10px", fontSize: "0.85em", color: "#666", padding: "4px 8px", backgroundColor: "#f0f0f0", borderRadius: "12px", border: "1px solid #ddd" }}>
                        {order.eventType === "riceceremony" ? "Rice Ceremony" : "Wedding"}
                      </span>
                    </span>
                  </div>
                  <button 
                    className={styles.deleteOrderBtn}
                    onClick={() => handleDeleteOrder(order.id)}
                    title="Delete Order"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className={styles.segmentsGrid}>
                  {Object.entries(grouped).map(([category, songs]) => (
                    <div key={category} className={styles.segmentTile}>
                      <h3 className={styles.segmentTitle}>
                        {category}
                        <span className={styles.segmentBadge}>{songs.length}</span>
                      </h3>
                      <div className={styles.songList}>
                        {songs.length > 0 ? (
                          songs.map(song => (
                            <div 
                              key={song.id} 
                              onClick={() => setPlayingVideo(song.songId)}
                              className={styles.songItem}
                            >
                              <div className={styles.thumbnailContainer}>
                                <img src={song.thumbnail} alt="" className={styles.songThumbnail} />
                                <div className={styles.playOverlay}>
                                  <Play size={16} fill="currentColor" />
                                </div>
                              </div>
                              <div className={styles.songInfo}>
                                <div className={styles.songTitle} title={song.title}>{song.title}</div>
                                <button 
                                  className={styles.copyBtn}
                                  onClick={(e) => handleCopy(e, song.url, song.id)}
                                >
                                  {copiedId === song.id ? <Check size={12} /> : <Copy size={12} />}
                                  {copiedId === song.id ? "Copied" : "Copy Link"}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={styles.noSongs}>No songs selected</div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(grouped).length === 0 && (
                    <div className={styles.noSongs}>No categories filled yet.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {playingVideo && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlayingVideo(null)}
          >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.closeModalBtn}
                onClick={() => setPlayingVideo(null)}
              >
                <X size={24} />
              </button>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
