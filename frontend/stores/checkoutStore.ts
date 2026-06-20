// =============================================================================
// Checkout Flow Store (Zustand, in-memory only)
// =============================================================================
// Carries the in-progress checkout selections between the address / payment /
// review screens. Reset on a fresh `start()` call so re-entering the flow
// after success does not surface stale state.
//
// We deliberately do NOT persist this store. If the user backgrounds the app
// mid-checkout we want them to start fresh — the cart is the persistent thing,
// not the half-made decisions.
// =============================================================================

import { create } from "zustand";
import type { PaymentMethod } from "../utils/checkoutApi";

interface CheckoutFlowState {
  addressId: string | null;
  paymentMethod: PaymentMethod | null;
  payerPhone: string | null;
  start: () => void;
  setAddress: (id: string | null) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPayerPhone: (phone: string | null) => void;
  reset: () => void;
}

export const useCheckoutFlowStore = create<CheckoutFlowState>((set) => ({
  addressId: null,
  paymentMethod: null,
  payerPhone: null,
  start: () => set({ addressId: null, paymentMethod: null, payerPhone: null }),
  setAddress: (id) => set({ addressId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPayerPhone: (phone) => set({ payerPhone: phone }),
  reset: () => set({ addressId: null, paymentMethod: null, payerPhone: null }),
}));
