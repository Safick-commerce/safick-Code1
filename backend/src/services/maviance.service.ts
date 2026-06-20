// =============================================================================
// Maviance Smobilpay for Service Providers (S3P) Client
// =============================================================================
// Thin wrapper around the Maviance S3P REST API used by SAFICK's escrow checkout.
//
// IMPORTANT: This module contains the FUNCTION SIGNATURES and INTERNAL FLOW
// that other services depend on. The actual HTTP calls to S3P are stubbed
// behind an `isConfigured()` gate so the backend can boot and pass tests
// without Maviance credentials. Real wire calls land in Phase 4 of the
// checkout-cart-escrow-mvp plan, once sandbox credentials are issued and
// the request-signing scheme is confirmed with Maviance support.
//
// Why stub now?
//   - Lets us ship the order/state-machine + webhook + chat plumbing first.
//   - Keeps env vars optional at boot so the wider team isn't blocked.
//   - Forces every downstream service to call THIS module — when wire calls
//     land, we change one file, not ten.
//
// Idempotency: all collect/cashin calls accept a SAFICK-owned `trid` which
// also doubles as our payment_ref / disbursement_ref. Maviance must treat
// duplicate `trid` as the same transaction.
// =============================================================================

import crypto from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import type { PaymentMethod } from "../types";

const MOBILE_METHODS: ReadonlyArray<PaymentMethod> = ["mtn_momo", "orange_money", "express_union"];

export interface MavianceQuote {
  ptn: string;
  amount: number;
  serviceId: string;
}

export interface CollectResult {
  ptn: string;
  status: "AWAITING_PIN" | "PENDING" | "SUCCESS" | "FAILED";
  hostedCheckoutUrl?: string;
}

export interface VerifyResult {
  ptn: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | "ERRORED" | "EXPIRED" | "CANCELLED";
  amount?: number;
  message?: string;
  receiptNumber?: string;
}

export interface CashinResult {
  ptn: string;
  status: "QUEUED" | "PROCESSING" | "PAID" | "FAILED";
  message?: string;
}

interface QuoteInput {
  serviceId: string;
  amountXaf: number;
}

interface CollectInput {
  ptn: string;
  customerPhone: string;
  trid: string;
}

interface CashinInput {
  serviceId: string;
  payerPhoneOrAccount: string;
  amountXaf: number;
  trid: string;
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

export function isConfigured(): boolean {
  return Boolean(
    env.MAVIANCE_S3P_BASE_URL &&
      env.MAVIANCE_S3P_API_USER &&
      env.MAVIANCE_S3P_API_PASSWORD,
  );
}

export function ensureConfigured(): void {
  if (!isConfigured()) {
    throw new AppError(
      "Payments not configured: Maviance S3P credentials missing on the server.",
      503,
    );
  }
}

/** Returns the collect serviceId for a given payment method, or throws if missing. */
export function getCollectServiceId(method: PaymentMethod): string {
  const id = (() => {
    switch (method) {
      case "mtn_momo":
        return env.MAVIANCE_SERVICE_ID_MTN_COLLECT;
      case "orange_money":
        return env.MAVIANCE_SERVICE_ID_ORANGE_COLLECT;
      case "express_union":
        return env.MAVIANCE_SERVICE_ID_EXPRESS_UNION_COLLECT;
      case "card":
        return env.MAVIANCE_SERVICE_ID_CARD_COLLECT;
    }
  })();
  if (!id) {
    throw new AppError(
      `Payments not configured: missing Maviance service id for ${method}.`,
      503,
    );
  }
  return id;
}

/** Returns the cashin serviceId for a destination operator, or throws if missing. */
export function getCashinServiceId(operator: "mtn" | "orange"): string {
  const id =
    operator === "mtn"
      ? env.MAVIANCE_SERVICE_ID_MTN_CASHIN
      : env.MAVIANCE_SERVICE_ID_ORANGE_CASHIN;
  if (!id) {
    throw new AppError(
      `Payouts not configured: missing Maviance cashin service id for ${operator}.`,
      503,
    );
  }
  return id;
}

export function isMobilePaymentMethod(method: PaymentMethod): boolean {
  return MOBILE_METHODS.includes(method);
}

// ---------------------------------------------------------------------------
// Webhook signature verification (header-based HMAC).
// The exact header name + scheme is finalized with Maviance support in Phase 4.
// We use a constant-time comparison and reject anything that doesn't match.
// ---------------------------------------------------------------------------

const SIGNATURE_HEADER_CANDIDATES = [
  "x-maviance-signature",
  "x-smobilpay-signature",
  "x-signature",
];

export function extractSignatureHeader(headers: Record<string, string | string[] | undefined>): string | null {
  for (const name of SIGNATURE_HEADER_CANDIDATES) {
    const raw = headers[name];
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
  }
  return null;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!env.MAVIANCE_S3P_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.MAVIANCE_S3P_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");
  // Constant-time compare with safety against length mismatch.
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Collect flow (buyer pays SAFICK)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------
// S3P expects an HMAC + base64 of `userid:password` style header in production,
// but the standard sandbox accepts Basic auth. We use Basic for the first wave
// and add a hook for upgrading once the Maviance integrations team confirms
// the exact signature scheme for our merchant.

function basicAuthHeader(): string {
  const user = env.MAVIANCE_S3P_API_USER ?? "";
  const password = env.MAVIANCE_S3P_API_PASSWORD ?? "";
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

async function s3pFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown> | URLSearchParams,
): Promise<T> {
  ensureConfigured();
  const url = `${env.MAVIANCE_S3P_BASE_URL}${path}`;
  const isForm = body instanceof URLSearchParams;
  const headers: Record<string, string> = {
    Authorization: basicAuthHeader(),
    Accept: "application/json",
  };
  if (body && !isForm) headers["Content-Type"] = "application/json";
  if (body && isForm) headers["Content-Type"] = "application/x-www-form-urlencoded";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body
        ? isForm
          ? (body as URLSearchParams).toString()
          : JSON.stringify(body)
        : undefined,
    });
  } catch (err) {
    throw new AppError(
      `Maviance S3P unreachable: ${err instanceof Error ? err.message : String(err)}`,
      502,
    );
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === "object" && parsed && "message" in parsed && typeof (parsed as { message?: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `Maviance S3P ${path} failed (${res.status})`;
    throw new AppError(message, res.status >= 500 ? 502 : 400);
  }
  return parsed as T;
}

/**
 * Get a Maviance quote (Payment Token Number) for a fixed amount.
 *
 * In stub mode (no credentials) we return a deterministic test PTN so the rest
 * of the pipeline can be exercised. In configured mode we POST to S3P /quotestd.
 */
export async function quoteStandard(input: QuoteInput): Promise<MavianceQuote> {
  if (!isConfigured()) {
    return {
      ptn: `STUB-PTN-${input.serviceId}-${input.amountXaf}-${Date.now()}`,
      amount: input.amountXaf,
      serviceId: input.serviceId,
    };
  }
  const body = new URLSearchParams({
    serviceid: input.serviceId,
    amount: String(input.amountXaf),
  });
  const result = await s3pFetch<{ ptn: string; amount?: string | number; serviceid?: string }>(
    "POST",
    "/quotestd",
    body,
  );
  if (!result?.ptn) {
    throw new AppError("Maviance quoteStandard returned no PTN.", 502);
  }
  return {
    ptn: result.ptn,
    amount:
      typeof result.amount === "number"
        ? result.amount
        : Number(result.amount ?? input.amountXaf),
    serviceId: input.serviceId,
  };
}

/**
 * Trigger the collect transaction. For mobile money this causes the telco to
 * push a PIN prompt to the buyer's SIM; the final status arrives via webhook.
 * For card it returns a hostedCheckoutUrl we open in the browser.
 */
export async function collectStandard(input: CollectInput): Promise<CollectResult> {
  if (!isConfigured()) {
    return {
      ptn: input.ptn,
      status: "AWAITING_PIN",
    };
  }
  const body = new URLSearchParams({
    ptn: input.ptn,
    customerPhonenumber: input.customerPhone,
    trid: input.trid,
  });
  const result = await s3pFetch<{
    ptn?: string;
    status?: string;
    receiptNumber?: string;
    payItemDescr?: string;
    redirectUrl?: string;
  }>("POST", "/collectstd", body);

  const status = mapCollectStatus(result?.status);
  return {
    ptn: result?.ptn ?? input.ptn,
    status,
    hostedCheckoutUrl: result?.redirectUrl ?? undefined,
  };
}

function mapCollectStatus(raw?: string): CollectResult["status"] {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESS":
    case "COMPLETED":
      return "SUCCESS";
    case "FAILED":
    case "ERRORED":
    case "CANCELLED":
    case "EXPIRED":
      return "FAILED";
    case "PENDING":
      return "PENDING";
    default:
      return "AWAITING_PIN";
  }
}

/**
 * On-demand status check. Used by the polling endpoint while the buyer is
 * entering their PIN, AND by the reconciliation cron to self-heal missed webhooks.
 */
export async function verifyTx(ptn: string): Promise<VerifyResult> {
  if (!isConfigured()) {
    return { ptn, status: "PENDING" };
  }
  const result = await s3pFetch<{
    ptn?: string;
    status?: string;
    amount?: string | number;
    message?: string;
    receiptNumber?: string;
  }>("GET", `/verifytx?ptn=${encodeURIComponent(ptn)}`);

  return {
    ptn: result?.ptn ?? ptn,
    status: mapVerifyStatus(result?.status),
    amount:
      typeof result?.amount === "number"
        ? result.amount
        : result?.amount
          ? Number(result.amount)
          : undefined,
    message: result?.message,
    receiptNumber: result?.receiptNumber,
  };
}

function mapVerifyStatus(raw?: string): VerifyResult["status"] {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESS":
    case "COMPLETED":
      return "SUCCESS";
    case "FAILED":
      return "FAILED";
    case "ERRORED":
      return "ERRORED";
    case "EXPIRED":
      return "EXPIRED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

// ---------------------------------------------------------------------------
// Cashin flow (SAFICK pays seller, OR refunds buyer via reverse-cashin)
// ---------------------------------------------------------------------------

/**
 * Disburse from the SAFICK Maviance wallet to a MoMo / Orange account.
 * Idempotent on `trid` — Maviance must reject duplicates with the original result.
 */
export async function cashin(input: CashinInput): Promise<CashinResult> {
  if (!isConfigured()) {
    return {
      ptn: `STUB-CASHIN-${input.trid}`,
      status: "QUEUED",
    };
  }
  const body = new URLSearchParams({
    serviceid: input.serviceId,
    customerPhonenumber: input.payerPhoneOrAccount,
    amount: String(input.amountXaf),
    trid: input.trid,
  });
  const result = await s3pFetch<{
    ptn?: string;
    status?: string;
    message?: string;
  }>("POST", "/cashin", body);

  return {
    ptn: result?.ptn ?? "",
    status: mapCashinStatus(result?.status),
    message: result?.message,
  };
}

function mapCashinStatus(raw?: string): CashinResult["status"] {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESS":
    case "COMPLETED":
    case "PAID":
      return "PAID";
    case "FAILED":
    case "ERRORED":
    case "CANCELLED":
    case "EXPIRED":
      return "FAILED";
    case "PROCESSING":
    case "PENDING":
      return "PROCESSING";
    default:
      return "QUEUED";
  }
}
