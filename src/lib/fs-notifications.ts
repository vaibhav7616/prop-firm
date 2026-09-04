import { useSyncExternalStore } from 'react';
import type { Notification } from '@/types';
import { DEFAULT_NOTIFICATIONS } from '@/lib/default-data';

/* Minimal reactive store for the authenticated notification feed.
   Falls back to seeded notifications (matching the rest of the demo data
   layer). Read-state is persisted so refreshes and the header badge stay
   consistent. If a real notifications API is connected later, swap the seed
   array for fetched records — nothing else changes.

   NOTE: snapshots returned from getSnapshot MUST be referentially stable
   between emits, otherwise useSyncExternalStore detects a "change" every
   render and loops infinitely (blank/frozen page). We cache `snapshot` and
   only replace it inside emit(). */

const STORAGE_KEY = 'fs_notif_read';

let notifications: Notification[] = DEFAULT_NOTIFICATIONS;
let readIds = new Set<string>();

interface Store {
  list: Notification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

let snapshot: Store;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]));
  } catch {
    /* restricted storage */
  }
}

function applyRead() {
  notifications = DEFAULT_NOTIFICATIONS.map((n) => ({ ...n, is_read: readIds.has(n.id) || !!n.is_read }));
}

function buildSnapshot(): Store {
  const list = notifications;
  const unread = notifications.filter((n) => !n.is_read).length;
  return {
    list,
    unread,
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
      applyRead();
      emit();
    },
  };
}

function loadSeed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as string[]) : [];
    readIds = new Set(saved);
  } catch {
    readIds = new Set();
  }
  applyRead();
}
loadSeed();
snapshot = buildSnapshot();

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  snapshot = buildSnapshot(); // replace reference ONLY on state change
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFsNotifications(): Store {
  return useSyncExternalStore(subscribe, () => snapshot);
}
