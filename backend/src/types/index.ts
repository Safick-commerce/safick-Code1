// =============================================================================
// Shared Types & Validation Schemas
// =============================================================================
// Contains TypeScript types and Zod validation schemas used across the backend.
// These types mirror what the frontend expects in API responses.
//
// Zod schemas serve double duty:
//   1. Runtime validation (in the validate middleware)
//   2. TypeScript type inference (via z.infer<typeof schema>)
//
// When adding new endpoints, define the request/response schemas here
// so they're reusable across routes, controllers, and tests.
// =============================================================================

import { z } from "zod";

// =============================================================================
// Auth Schemas — request validation for auth endpoints
// =============================================================================

// POST /api/auth/google — mobile app sends the Google ID token
export const googleSignInSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

// POST /api/auth/register — new account with email + password
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

// POST /api/auth/login — existing account sign-in
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/refresh — token refresh
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// =============================================================================
// User Schemas — request validation for user endpoints
// =============================================================================

// Username format: lowercase, alphanumeric + dots/underscores, 3-30 chars
// Matches the frontend regex in OnboardingScreen: /[^a-z0-9._]/g
const usernameRegex = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

// PUT /api/users/me/onboarding — completes the onboarding flow
export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernameRegex, "Username can only contain lowercase letters, numbers, dots, and underscores"),
  displayName: z.string().min(2).max(100).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  city: z.string().min(1, "City is required"),
  interests: z
    .array(z.string())
    .min(2, "Select at least 2 interests"),
});

// Cameroon mobile number sanity check — accepts +237/237 prefix, returns the 9-digit body.
// Re-used by both buyer payerPhone validation (later in this file) and the seller payout schema.
//
// Numeric rule: a Cameroon mobile is 9 digits starting with 6.
// We deliberately keep the operator distinction in a separate enum field so we
// can add new ranges without touching this regex.
const cameroonPayoutMobileRegex = /^6[0-9]{8}$/;

// PUT /api/users/me/payout — sellers set MoMo destination for automated escrow release.
export const sellerPayoutSchema = z.object({
  payoutMomoNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-\(\)]/g, "").replace(/^\+?237/, ""))
    .refine(
      (v) => cameroonPayoutMobileRegex.test(v),
      "Phone must be a Cameroon mobile number starting with 6 (9 digits)",
    ),
  payoutMomoOperator: z.enum(["mtn", "orange"]),
});

export type SellerPayoutInput = z.infer<typeof sellerPayoutSchema>;

export interface SellerPayoutResponse {
  payoutMomoNumber: string | null;
  payoutMomoOperator: "mtn" | "orange" | null;
}

// PUT /api/users/me — profile updates (from settings screen)
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().max(32).optional(),
  city: z.string().min(1).optional(),
  languagePref: z.enum(["en", "fr"]).optional(),
  avatarUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

// =============================================================================
// Response Types — what the API returns to the frontend
// =============================================================================

// User object returned in API responses (private — GET /api/users/me)
export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  phone: string | null;
  gender: string | null;
  city: string | null;
  interests: string[];
  avatarUrl: string | null;
  coverImageUrl: string | null;
  role: string;
  languagePref: string;
  onboardingCompleted: boolean;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// Auth endpoint response shape
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

// Public user profile (seller pages — no email, phone, or gender)
export interface PublicUserResponse {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  city: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// =============================================================================
// Inferred Types — automatically derived from Zod schemas
// =============================================================================
// Use these when you need the TypeScript type for a validated request body.
// Example: const data: OnboardingInput = req.body;
// =============================================================================

export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// =============================================================================
// Conversation / message schemas
// =============================================================================

export const openConversationSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
});

export const sendMessageBodySchema = z.object({
  text: z.string().trim().min(1).max(4000),
  clientId: z.string().max(64).optional(),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export interface ConversationPeerResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationLastMessageResponse {
  body: string;
  createdAt: string;
  senderId: string;
}

export interface ConversationResponse {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  productPrice: number;
  buyerId: string;
  sellerId: string;
  peer: ConversationPeerResponse;
  lastMessage: ConversationLastMessageResponse | null;
  createdAt: string;
  lastMessageAt: string | null;
}

export type ConversationListItemResponse = ConversationResponse;

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  /** "text" | "order_card" | "system" — the frontend renders order_card specially. */
  messageType: string;
  /** Set for messageType === "order_card"; lets the frontend deep-link into the order. */
  orderId: string | null;
}

export type OpenConversationInput = z.infer<typeof openConversationSchema>;
export type SendMessageBodyInput = z.infer<typeof sendMessageBodySchema>;

// =============================================================================
// Checkout / Orders / Addresses — Phase 1 (escrow MVP)
// =============================================================================

// Cameroon phone formats:
//   MTN MoMo:     6(5|6|7|8|9)XXXXXXX   -> typically 65/66/67/68/69 (and 650 series)
//   Orange Money: 6(5|6|7|8|9)XXXXXXX   -> typically 69/68/65 ranges
// We accept a generic 9-digit Cameroon mobile number starting with 6 and let the operator
// field distinguish — this avoids brittle regex maintenance as telcos add ranges.
const cameroonMobileRegex = /^6[0-9]{8}$/;
const cameroonMobileTransform = (value: string) =>
  value.replace(/[\s\-\(\)]/g, "").replace(/^\+?237/, "");

const cameroonMobileSchema = z
  .string()
  .min(9, "Phone must be a 9-digit Cameroon mobile number")
  .max(20)
  .transform(cameroonMobileTransform)
  .refine(
    (value) => cameroonMobileRegex.test(value),
    "Phone must be a Cameroon mobile number starting with 6 (9 digits)",
  );

// Addresses
export const addressBodySchema = z.object({
  recipientName: z.string().min(2).max(120),
  phone: cameroonMobileSchema,
  city: z.string().min(2).max(120),
  neighborhood: z.string().min(2).max(120),
  landmark: z.string().max(240).optional(),
  notes: z.string().max(500).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const addressUpdateSchema = addressBodySchema.partial();

export type AddressInput = z.infer<typeof addressBodySchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

export interface AddressResponse {
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
}

// Checkout
export const paymentMethodSchema = z.enum([
  "mtn_momo",
  "orange_money",
  "express_union",
  "card",
]);

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const checkoutBodySchema = z
  .object({
    addressId: z.string().uuid(),
    paymentMethod: paymentMethodSchema,
    payerPhone: cameroonMobileSchema.optional(),
    items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty"),
  })
  .superRefine((data, ctx) => {
    // Mobile money flows require the buyer's MoMo phone to be provided.
    const needsPhone =
      data.paymentMethod === "mtn_momo" ||
      data.paymentMethod === "orange_money" ||
      data.paymentMethod === "express_union";
    if (needsPhone && !data.payerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payerPhone"],
        message: "payerPhone is required for mobile money payments",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutBodySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export interface CheckoutItemResponse {
  productId: string;
  title: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceXaf: number;
  sellerId: string;
}

export interface CheckoutResponse {
  id: string;
  status: "pending_payment" | "paid" | "failed" | "expired" | "refunded" | "awaiting_pin";
  paymentMethod: PaymentMethod;
  totalXaf: number;
  ptn: string | null;
  // For card flows, Maviance returns a hosted-checkout URL we open in a WebView.
  hostedCheckoutUrl: string | null;
  orderIds: string[];
  createdAt: string;
}

export interface CheckoutStatusResponse {
  id: string;
  status: CheckoutResponse["status"];
  ptn: string | null;
  failureReason: string | null;
  orderIds: string[];
  paidAt: string | null;
}

// Orders
export const orderActionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const disputeBodySchema = z.object({
  category: z.enum([
    "item_not_received",
    "wrong_item",
    "damaged",
    "seller_unresponsive",
    "other",
  ]),
  details: z.string().min(10, "Please describe the issue").max(2000),
});

export type DisputeInput = z.infer<typeof disputeBodySchema>;

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

export interface OrderItemResponse {
  id: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceXaf: number;
}

export interface OrderResponse {
  id: string;
  checkoutId: string;
  buyerId: string;
  sellerId: string;
  sellerDisplayName: string;
  status: OrderStatus;
  subtotalXaf: number;
  items: OrderItemResponse[];
  conversationId: string | null;
  autoReleaseAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Maviance webhook payload — minimum we trust from the wire.
// The actual S3P payload is signed via a header; verification happens BEFORE this schema runs.
// Field names mirror Maviance documentation conventions.
export const mavianceWebhookSchema = z.object({
  ptn: z.string().min(1),
  trid: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED", "ERRORED", "EXPIRED", "CANCELLED", "PENDING"]),
  amount: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
  receipt_number: z.string().optional(),
  timestamp: z.string().optional(),
});

export type MavianceWebhookInput = z.infer<typeof mavianceWebhookSchema>;
