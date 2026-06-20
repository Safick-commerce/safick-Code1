// =============================================================================
// Wishlist Store (Zustand — Wave 1 of Context → Zustand migration)
// =============================================================================
// Mirrors the original WishlistContext API one-for-one so consumer sites
// (productDetails.tsx, wishlist.tsx) don't have to change anything other
// than the import path. The `useWishlist()` hook is kept as the public
// entry point — Provider tree is no longer required.
//
// No persistence in this wave. The original Context version wasn't
// persisted either, so behavior is identical from the user's perspective.
// Persistence + server-sync land in a later wave once we have a buyer-side
// /api/wishlist endpoint.
// =============================================================================

import { ImageSourcePropType } from "react-native";
import { create } from "zustand";

export interface WishlistItemData {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: ImageSourcePropType;
  sellerName?: string;
}

interface WishlistState {
  wishlistItems: WishlistItemData[];
  addToWishlist: (item: WishlistItemData) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItemData) => void;
  isSaved: (id: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistItems: [],

  addToWishlist: (item) =>
    set((state) => {
      if (state.wishlistItems.some((existing) => existing.id === item.id)) {
        return state;
      }
      return { wishlistItems: [...state.wishlistItems, item] };
    }),

  removeFromWishlist: (id) =>
    set((state) => ({
      wishlistItems: state.wishlistItems.filter((item) => item.id !== id),
    })),

  toggleWishlist: (item) =>
    set((state) => {
      const exists = state.wishlistItems.some((existing) => existing.id === item.id);
      return {
        wishlistItems: exists
          ? state.wishlistItems.filter((existing) => existing.id !== item.id)
          : [...state.wishlistItems, item],
      };
    }),

  isSaved: (id) => get().wishlistItems.some((item) => item.id === id),

  clearWishlist: () => set({ wishlistItems: [] }),

  getWishlistCount: () => get().wishlistItems.length,
}));

/**
 * Identical hook shape to the legacy Context version — every property
 * the old `useWishlist()` returned is still here, in the same order, with
 * the same types. Callers don't need to change anything except the import.
 */
export function useWishlist(): WishlistState {
  return useWishlistStore();
}

export { useWishlistStore };
