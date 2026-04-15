// hooks/useNotifications.ts
"use client";
// ============================================================
//  Shared hook used by both TopNav and SubPageTopNav.
//  - Fetches real notifications from /api/notifications
//  - Tracks which IDs have been "read" in localStorage
//  - Auto-refreshes every 2 minutes
// ============================================================

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id:      string;
  type:    "reminder" | "status_change" | "offer" | "rejected";
  text:    string;
  subtext: string;
  time:    string;
  color:   string;
  urgent:  boolean;
}

const STORAGE_KEY = "jt_read_notif_ids";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Keep only last 100 to avoid localStorage bloat
    const arr = Array.from(ids).slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch { /* silently ignore */ }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds,       setReadIds]       = useState<Set<string>>(new Set());
  const [loading,       setLoading]       = useState(true);

  // Load read IDs from localStorage on mount
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Initial fetch + poll every 2 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as read (called when panel opens)
  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  // Unread count = notifications whose IDs are not in readIds
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    refresh: fetchNotifications,
  };
}