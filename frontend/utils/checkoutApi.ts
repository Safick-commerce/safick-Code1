// =============================================================================
// Checkout / Orders / Addresses API client
// =============================================================================
// Thin wrapper over apiFetch. Mirrors the backend endpoints in
// `backend/src/routes/address.routes.ts` and `order.routes.ts`. Response types
// match the camelCase shape returned by the controllers.
// =============================================================================

import { apiFetch } from "../lib/apiFetch";

export type Address = {
  id: string;
  buyerId: string;
  recipientName: string;
  phone: string;
  city: string;
  neighborhood: string;
  landmark: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressInput = {
  recipientName: string;
  phone: string;
  city: string;
  neighborhood: string;
  landmark?: string;
  notes?: string;
  isDefault?: boolean;
};

export type PaymentMethod =
  | "mtn_momo"
  | "orange_money"
  | "express_union"
  | "card";

export type CheckoutInput = {
  addressId: string;
  paymentMethod: PaymentMethod;
  payerPhone?: string;
  items: { productId: string; quantity: number }[];
};

export type CheckoutStatus =
  | "pending_payment"
  | "awaiting_pin"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type Checkout = {
  id: string;
  status: CheckoutStatus;
  paymentMethod: PaymentMethod;
  totalXaf: number;
  ptn: string | null;
  hostedCheckoutUrl: string | null;
  orderIds: string[];
  createdAt: string;
};

export type CheckoutStatusResponse = {
  id: string;
  status: CheckoutStatus;
  ptn: string | null;
  failureReason: string | null;
  orderIds: string[];
  paidAt: string | null;
};

export type OrderStatus =
  | "pending_payment"
  | "funds_held"
  | "seller_accepted"
  | "seller_rejected"
  | "in_transit"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type Order = {
  id: string;
  checkoutId: string;
  buyerId: string;
  sellerId: string;
  sellerDisplayName: string;
  status: OrderStatus;
  subtotalXaf: number;
  items: {
    id: string;
    productId: string;
    title: string;
    imageUrl: string | null;
    quantity: number;
    unitPriceXaf: number;
  }[];
  conversationId: string | null;
  autoReleaseAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ----- Addresses -----

export async function listAddresses(): Promise<Address[]> {
  const data = await apiFetch<{ addresses: Address[] }>("/api/addresses");
  return data.addresses;
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const data = await apiFetch<{ address: Address }>("/api/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.address;
}

export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
): Promise<Address> {
  const data = await apiFetch<{ address: Address }>(`/api/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.address;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<void>(`/api/addresses/${id}`, { method: "DELETE" });
}

// ----- Checkout -----

export async function createCheckout(input: CheckoutInput): Promise<Checkout> {
  const data = await apiFetch<{ checkout: Checkout }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.checkout;
}

export async function getCheckoutStatus(id: string): Promise<CheckoutStatusResponse> {
  const data = await apiFetch<{ checkout: CheckoutStatusResponse }>(
    `/api/checkout/${id}`,
  );
  return data.checkout;
}

// ----- Orders -----

export async function listMyOrders(): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>("/api/orders");
  return data.orders;
}

export async function getMyOrder(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}`);
  return data.order;
}

export async function confirmDelivery(orderId: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(
    `/api/orders/${orderId}/confirm-delivery`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return data.order;
}

// ----- Seller orders -----

export async function listSellerOrders(): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>("/api/seller/orders");
  return data.orders;
}

export async function getSellerOrder(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/seller/orders/${id}`);
  return data.order;
}

async function sellerAction(orderId: string, action: "accept" | "reject" | "ship" | "deliver", reason?: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(
    `/api/seller/orders/${orderId}/${action}`,
    { method: "POST", body: JSON.stringify(reason ? { reason } : {}) },
  );
  return data.order;
}

export const sellerAcceptOrder = (orderId: string, reason?: string) =>
  sellerAction(orderId, "accept", reason);
export const sellerRejectOrder = (orderId: string, reason?: string) =>
  sellerAction(orderId, "reject", reason);
export const sellerShipOrder = (orderId: string, reason?: string) =>
  sellerAction(orderId, "ship", reason);
export const sellerDeliverOrder = (orderId: string, reason?: string) =>
  sellerAction(orderId, "deliver", reason);

// ----- Seller payout settings -----

export type SellerPayout = {
  payoutMomoNumber: string | null;
  payoutMomoOperator: "mtn" | "orange" | null;
};

export type SellerPayoutInput = {
  payoutMomoNumber: string;
  payoutMomoOperator: "mtn" | "orange";
};

export async function getSellerPayout(): Promise<SellerPayout> {
  const data = await apiFetch<{ payout: SellerPayout }>("/api/users/me/payout");
  return data.payout;
}

export async function updateSellerPayout(input: SellerPayoutInput): Promise<SellerPayout> {
  const data = await apiFetch<{ payout: SellerPayout }>("/api/users/me/payout", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.payout;
}

export async function openDispute(
  orderId: string,
  category:
    | "item_not_received"
    | "wrong_item"
    | "damaged"
    | "seller_unresponsive"
    | "other",
  details: string,
): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${orderId}/dispute`, {
    method: "POST",
    body: JSON.stringify({ category, details }),
  });
  return data.order;
}
