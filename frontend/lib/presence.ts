// =============================================================================
// Presence — Supabase Realtime Presence (global channel) + last_seen_at
// =============================================================================
// MVP uses a single `presence:global` channel: every client receives all
// join/leave events. That is acceptable at current scale but should move to
// scoped/paginated channels once a follows table exists.
// =============================================================================

import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "./supabase";
import type { TranslationKey } from "../i18n/types";

export const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;

const PRESENCE_CHANNEL_NAME = "presence:global";

type PresencePayload = {
  user_id: string;
  online_at: string;
};

type PresenceStoreState = {
  onlineUserIds: Set<string>;
  lastSeenByUserId: Record<string, string>;
  setOnlineUserIds: (ids: Set<string>) => void;
  mergeLastSeen: (entries: Record<string, string>) => void;
};

export const usePresenceStore = create<PresenceStoreState>((set) => ({
  onlineUserIds: new Set(),
  lastSeenByUserId: {},
  setOnlineUserIds: (ids) => set({ onlineUserIds: new Set(ids) }),
  mergeLastSeen: (entries) =>
    set((state) => ({
      lastSeenByUserId: { ...state.lastSeenByUserId, ...entries },
    })),
}));

function parsePresenceUserIds(state: Record<string, PresencePayload[]>): Set<string> {
  const ids = new Set<string>();
  for (const [key, presences] of Object.entries(state)) {
    for (const presence of presences) {
      const id = presence.user_id?.trim() || key;
      if (id) ids.add(id);
    }
  }
  return ids;
}

async function writeOwnLastSeen(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").update({ last_seen_at: now }).eq("id", userId);
  if (error) {
    console.warn("[presence] failed to write last_seen_at:", error.message);
    return;
  }
  usePresenceStore.getState().mergeLastSeen({ [userId]: now });
}

/** Batch-load last_seen_at for conversation peers (public SELECT RLS). */
export async function fetchLastSeenForUsers(userIds: string[]): Promise<void> {
  const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, last_seen_at")
    .in("id", unique);

  if (error) {
    console.warn("[presence] failed to fetch last_seen_at:", error.message);
    return;
  }

  const entries: Record<string, string> = {};
  for (const row of data ?? []) {
    if (typeof row.id === "string" && typeof row.last_seen_at === "string") {
      entries[row.id] = row.last_seen_at;
    }
  }
  if (Object.keys(entries).length > 0) {
    usePresenceStore.getState().mergeLastSeen(entries);
  }
}

async function refreshLastSeenFromDb(userId: string): Promise<void> {
  await fetchLastSeenForUsers([userId]);
}

export function isOnline(userId: string): boolean {
  return usePresenceStore.getState().onlineUserIds.has(userId);
}

export function lastSeen(userId: string): Date | null {
  const iso = usePresenceStore.getState().lastSeenByUserId[userId];
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True when tracked online OR last_seen_at is within ACTIVE_THRESHOLD_MS. */
export function isUserActive(userId: string): boolean {
  if (!userId) return false;
  if (isOnline(userId)) return true;
  const seen = lastSeen(userId);
  if (!seen) return false;
  return Date.now() - seen.getTime() < ACTIVE_THRESHOLD_MS;
}

type PresenceT = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Returns null when the user should show as active (no "last seen" subtext). */
export function formatLastSeen(userId: string, t: PresenceT): string | null {
  if (!userId || isUserActive(userId)) return null;

  const seen = lastSeen(userId);
  if (!seen) return null;

  const elapsedMs = Date.now() - seen.getTime();
  if (elapsedMs < ACTIVE_THRESHOLD_MS) return null;

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 60) {
    return t("presence_last_seen_minutes", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("presence_last_seen_hours", { count: hours });
  }

  const days = Math.floor(hours / 24);
  return t("presence_last_seen_days", { count: days });
}

/** Subscribe selectors for UI — re-renders when presence state changes. */
export function usePresenceState() {
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const lastSeenByUserId = usePresenceStore((s) => s.lastSeenByUserId);

  return { onlineUserIds, lastSeenByUserId };
}

/**
 * Mount once at the authenticated app shell. Tracks the current user on
 * `presence:global`, untracks on background/unmount, and writes last_seen_at.
 */
export function usePresence(userId: string | null | undefined): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackedRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    const uid = userId?.trim();
    if (!uid) return;

    let cancelled = false;

    const syncOnlineFromChannel = (channel: RealtimeChannel) => {
      const state = channel.presenceState<PresencePayload>();
      usePresenceStore.getState().setOnlineUserIds(parsePresenceUserIds(state));
    };

    const untrackSelf = async () => {
      const channel = channelRef.current;
      const currentUid = userIdRef.current?.trim();
      if (!channel || !currentUid || !trackedRef.current) return;

      trackedRef.current = false;
      try {
        await channel.untrack();
      } catch {
        // Best-effort — channel may already be tearing down.
      }
      await writeOwnLastSeen(currentUid);
    };

    const trackSelf = async (channel: RealtimeChannel) => {
      const currentUid = userIdRef.current?.trim();
      if (!currentUid || cancelled) return;

      const payload: PresencePayload = {
        user_id: currentUid,
        online_at: new Date().toISOString(),
      };
      const status = await channel.track(payload);
      if (status === "ok") {
        trackedRef.current = true;
      }
    };

    const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: { presence: { key: uid } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        if (!cancelled) syncOnlineFromChannel(channel);
      })
      .on("presence", { event: "join" }, () => {
        if (!cancelled) syncOnlineFromChannel(channel);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        syncOnlineFromChannel(channel);
        for (const presence of leftPresences as PresencePayload[]) {
          const departedId = presence.user_id?.trim();
          if (departedId && departedId !== uid) {
            void refreshLastSeenFromDb(departedId);
          }
        }
      })
      .subscribe(async (status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          await trackSelf(channel);
          syncOnlineFromChannel(channel);
        }
      });

    channelRef.current = channel;

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void trackSelf(channel);
        return;
      }
      if (nextState === "background" || nextState === "inactive") {
        void untrackSelf();
      }
    };

    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      cancelled = true;
      appStateSub.remove();
      void untrackSelf().finally(() => {
        void supabase.removeChannel(channel);
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
      });
    };
  }, [userId]);
}
