// =============================================================================
// Server Entry Point
// =============================================================================
// Starts the Express HTTP server and handles graceful shutdown.
//
// This file is kept separate from app.ts so the Express app can be
// imported independently for testing (without starting the server).
//
// To run in development:
//   npm run dev        → starts with tsx watch (auto-restarts on file changes)
//
// To run in production:
//   npm run build      → compiles TypeScript to dist/
//   npm start          → runs the compiled JavaScript
// =============================================================================

import app from "./app";
import { prisma } from "./config/database";

// Port defaults to 4000 if not set in .env
const PORT = process.env.PORT || 4000;

async function main() {
  // Start the HTTP server
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Safick backend running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });

  // --- Graceful Shutdown ---
  // When the process is killed (Ctrl+C, Docker stop, etc.), clean up resources
  // before exiting so we don't leave dangling database connections.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log("HTTP server closed.");
    });

    // Disconnect from the database
    await prisma.$disconnect();
    console.log("Database disconnected.");

    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
