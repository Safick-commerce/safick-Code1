// =============================================================================
// Express Application Setup
// =============================================================================
// Configures the Express app with all middleware and routes.
// Separated from server.ts so the app can be imported for testing
// without starting the HTTP server.
//
// Middleware order matters:
//   1. Security (helmet, cors)
//   2. Parsing (json, urlencoded)
//   3. Rate limiting
//   4. Routes
//   5. Error handler (must be last)
// =============================================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getCorsOrigins } from "./config/cors";

// Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import conversationRoutes from "./routes/conversation.routes";
import addressRoutes from "./routes/address.routes";
import {
  checkoutRouter,
  ordersRouter,
  sellerOrdersRouter,
} from "./routes/order.routes";
import webhookRoutes from "./routes/webhook.routes";
import adminRoutes from "./routes/admin.routes";
import feedRoutes from "./routes/feed.routes";

// Error handler (must be registered last)
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// =============================================================================
// Security Middleware
// =============================================================================

// Helmet — sets various HTTP security headers (XSS protection, HSTS, etc.)
app.use(helmet());

// CORS — allows the mobile app (Expo) to make requests to this server
// In production, restrict this to your actual domain/app origin
app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
  }),
);

// =============================================================================
// Body Parsing
// =============================================================================
// Webhooks (notably Maviance) require the raw body so we can verify their
// HMAC signature against the exact bytes that came over the wire. We mount
// the webhook router BEFORE the JSON parser, and it brings its own express.raw()
// for the routes it owns. Every other route gets express.json() below.

app.use("/api/webhooks", webhookRoutes);

// Parse JSON request bodies (e.g., POST /api/auth/register with { email, password })
// Limit to 10MB to prevent abuse (large payloads)
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies (for form submissions, if any)
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// Rate Limiting
// =============================================================================

// Limits each IP to a fixed number of requests per time window.
// Prevents brute-force attacks on login and abuse of the API.
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

app.use("/api/", limiter);

// =============================================================================
// Root — browsers open http://localhost:PORT with no path; APIs return JSON here
// =============================================================================

app.get("/", (_req, res) => {
  res.json({
    name: "Safick backend API",
    hint: "JSON only — no web UI. Try /api/health or use the app / curl / Postman for POST routes.",
    links: {
      health: "/api/health",
      auth: "/api/auth (POST register | login | refresh | logout | google)",
      users: "/api/users/me (GET/PUT + auth header) … see user.routes.ts",
      forYouFeed: "GET /api/products/feed/for-you?limit=10&cursor=… (optional Bearer)",
      productView: "POST /api/products/:id/view (optional Bearer; guests send clientId)",
      socket: "Socket.IO on this host — auth: { token: supabase access_token }",
    },
  });
});

// =============================================================================
// Health Check
// =============================================================================

// Simple endpoint to verify the server is running.
// Used by load balancers, uptime monitors, and deployment checks.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// =============================================================================
// API Routes
// =============================================================================

// All routes are prefixed with /api/ to separate them from any future
// static file serving or web dashboard.
// (Webhooks are mounted earlier — before the JSON parser — so the raw body is preserved.)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", feedRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/seller/orders", sellerOrdersRouter);
app.use("/api/admin", adminRoutes);

// =============================================================================
// 404 Handler — for routes that don't match anything above
// =============================================================================

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// =============================================================================
// Global Error Handler — must be the LAST middleware registered
// =============================================================================

app.use(errorHandler);

export default app;
