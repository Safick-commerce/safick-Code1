// =============================================================================
// Message Store (Zustand — Wave 1 of Context → Zustand migration)
// =============================================================================
// Mirrors the original MessageContext API one-for-one so the wishlist screen
// (and any future caller) can swap imports with zero behavior change. This is
// the seller-conversation-shortcut store the Save flow drops items into when
// a buyer hits "Move to Reservation" from the wishlist — it predates the
// real /api/conversations layer and stays local-only for now.
// =============================================================================

import { create } from "zustand";

type UserStatus = "online" | "away" | "offline";

export interface MessageItemData {
  id: string;
  seller: {
    name: string;
    message: string;
    avatarUrl: string | null;
    status: UserStatus;
  };
  /** When true, conversation appears under the Reservation filter */
  isReservation?: boolean;
}

interface MessageState {
  messageItems: MessageItemData[];
  addToMessage: (item: MessageItemData) => void;
  removeFromMessage: (id: string) => void;
  toggleMessage: (item: MessageItemData) => void;
  isMessage: (id: string) => boolean;
  clearMessage: () => void;
  getMessageCount: () => number;
}

const useMessageStore = create<MessageState>((set, get) => ({
  messageItems: [],

  addToMessage: (item) =>
    set((state) => {
      if (state.messageItems.some((existing) => existing.id === item.id)) {
        return state;
      }
      return { messageItems: [...state.messageItems, item] };
    }),

  removeFromMessage: (id) =>
    set((state) => ({
      messageItems: state.messageItems.filter((item) => item.id !== id),
    })),

  toggleMessage: (item) =>
    set((state) => {
      const exists = state.messageItems.some((existing) => existing.id === item.id);
      return {
        messageItems: exists
          ? state.messageItems.filter((existing) => existing.id !== item.id)
          : [...state.messageItems, item],
      };
    }),

  isMessage: (id) => get().messageItems.some((item) => item.id === id),

  clearMessage: () => set({ messageItems: [] }),

  getMessageCount: () => get().messageItems.length,
}));

/**
 * Identical hook shape to the legacy Context version.
 */
export function useMessage(): MessageState {
  return useMessageStore();
}

export { useMessageStore };
