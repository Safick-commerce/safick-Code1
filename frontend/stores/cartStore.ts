// =============================================================================
// Cart Store (Zustand + AsyncStorage persistence) — Phase 2 of escrow MVP
// =============================================================================
// Local, offline-first shopping cart. Items are denormalized snapshots of the
// product at add-time so the cart UI never has to wait for the network.
//
// One cart per device (the buyer is implicit — auth gates checkout, not the cart).
// We persist to AsyncStorage so the cart survives app restarts, which is how
// every other commerce app on the planet behaves.
//
// Items are stored flat by productId. We expose a `getCartGroupedBySeller`
// selector for the cart screen so the UI renders one section per seller —
// reflecting how the backend will split the checkout into per-seller orders.
//
// Prices are XAF integers (no decimal currency in Cameroon). The cart trusts
// the snapshot during browse, but the backend re-prices everything from the
// authoritative `products` table at /api/checkout time — see order.service.ts.
// =============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  /** Server product UUID. Primary key of the cart line. */
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPriceXaf: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  /**
   * Seller avatar at add-time. Snapshot like the rest of the cart so the cart
   * screen can render seller rows without re-fetching the seller profile.
   * Null when the seller hasn't set an avatar.
   */
  sellerAvatarUrl: string | null;
  /** Product description snapshot at add-time (null if the seller left it blank). */
  description: string | null;
  /** When this snapshot was taken — useful if we ever want to re-fetch stale lines. */
  addedAt: string;
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  items: CartItem[];
  subtotalXaf: number;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  // Mutations
  addItem: (item: Omit<CartItem, "quantity" | "addedAt">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clearCart: () => void;
  clearSellerItems: (sellerId: string) => void;
  // Read selectors
  hasItem: (productId: string) => boolean;
  itemCount: () => number;
  totalXaf: () => number;
  groupedBySeller: () => CartSellerGroup[];
}

const MAX_QUANTITY = 50; // matches the backend Zod cap on checkoutItemSchema

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addItem: (input, quantity = 1) => {
        if (quantity <= 0) return;
        set((state) => {
          const existing = state.items.find((item) => item.productId === input.productId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === input.productId
                  ? { ...item, quantity: clamp(item.quantity + quantity, 1, MAX_QUANTITY) }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...input,
                quantity: clamp(quantity, 1, MAX_QUANTITY),
                addedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: clamp(quantity, 1, MAX_QUANTITY) }
                : item,
            ),
          };
        }),

      increment: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clamp(item.quantity + 1, 1, MAX_QUANTITY) }
              : item,
          ),
        })),

      decrement: (productId) =>
        set((state) => {
          const item = state.items.find((i) => i.productId === productId);
          if (!item) return state;
          if (item.quantity <= 1) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      clearSellerItems: (sellerId) =>
        set((state) => ({ items: state.items.filter((item) => item.sellerId !== sellerId) })),

      hasItem: (productId) => get().items.some((item) => item.productId === productId),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalXaf: () =>
        get().items.reduce((sum, item) => sum + item.unitPriceXaf * item.quantity, 0),

      groupedBySeller: () => {
        const grouped = new Map<string, CartSellerGroup>();
        for (const item of get().items) {
          const existing = grouped.get(item.sellerId);
          if (existing) {
            existing.items.push(item);
            existing.subtotalXaf += item.unitPriceXaf * item.quantity;
            // First non-null avatar wins — keeps the cart row consistent even if a
            // later snapshot stored null (e.g. the seller cleared their avatar).
            if (!existing.sellerAvatarUrl && item.sellerAvatarUrl) {
              existing.sellerAvatarUrl = item.sellerAvatarUrl;
            }
          } else {
            grouped.set(item.sellerId, {
              sellerId: item.sellerId,
              sellerName: item.sellerName,
              sellerAvatarUrl: item.sellerAvatarUrl,
              items: [item],
              subtotalXaf: item.unitPriceXaf * item.quantity,
            });
          }
        }
        return Array.from(grouped.values());
      },
    }),
    {
      name: "safick.cart.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[cartStore] hydration failed:", error);
        }
        useCartStore.setState({ hasHydrated: true });
      },
      // v2 added `sellerAvatarUrl`; v3 added `description`.
      version: 3,
      migrate: (persisted, fromVersion) => {
        if (persisted && typeof persisted === "object") {
          const state = persisted as { items?: CartItem[] };
          if (Array.isArray(state.items)) {
            state.items = state.items.map((item) => ({
              ...item,
              sellerAvatarUrl: item.sellerAvatarUrl ?? null,
              description: fromVersion < 3 ? (item.description ?? null) : item.description ?? null,
            }));
          }
        }
        return persisted as CartState;
      },
    },
  ),
);

/** Stable selector hooks — components only re-render when their slice changes. */
export const useCartItemCount = () => useCartStore((state) => state.itemCount());
export const useCartTotalXaf = () => useCartStore((state) => state.totalXaf());
export const useCartHasHydrated = () => useCartStore((state) => state.hasHydrated);
