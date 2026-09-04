import { useSyncExternalStore } from 'react';
import type { Notification } from '@/types';
import { DEFAULT_NOTIFICATIONS } from '@/lib/default-data';

/* Minimal reactive store for the authenticated notification feed.
   Falls back to seeded notifications (matching the rest of the demo data
   layer). Read-state is persisted so refreshes and the header badge stay
   consistent. If a real notifications API is connected later, swap the seed
   array for fetched records — nothing else changes. */

const STORAGE_KEY = 'fs_notif_read';

let notifications: Notification[] = DEFAULT_NOTIFICATIONS;
let readIds = new Set<string>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]));
  } catch {
    /* restricted storage */
  }
}

function loadSeed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as string[]) : [];
    readIds = new Set(saved);
    notifications = DEFAULT_NOTIFICATIONS.map((n) => ({ ...n, is_read: readIds.has(n.id) || !!n.is_read }));
  } catch {
    notifications = DEFAULT_NOTIFICATIONS;
  }
}
loadSeed();

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  listeners.forEach((l) => l());
}

export function fsNotificationsStore() {
  return {
    list: notifications,
    unread: notifications.filter((n) => !n.is_read).length,
    markRead(id: string) {
      notifications = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      readIds.add(id);
      persist();
      emit();
    },
    markAllRead() {
      notifications = notifications.map((n) => ({ ...n, is_read: true }));
      DEFAULT_NOTIFICATIONS.forEach((n) => readIds.add(n.id));
      persist();
      emit();
    },
    refresh() {
      notifications = DEFAULT_NOTIFICATIONS.map((n) => ({ ...n, is_read: readIds.has(n.id) || !!n.is_read }));
      emit();
    },
  };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFsNotifications() {
  const store = useSyncExternalStore(subscribe, () => fsNotificationsStore());
  return store;
}
