// =============================================================================
// Server Entry Point
// =============================================================================
// HTTP (Express) + Socket.IO on the same port.
//
// To run in development:
//   npm run dev        → starts with tsx watch (auto-restarts on file changes)
//
// To run in production:
//   npm run build      → compiles TypeScript to dist/
//   npm start          → runs the compiled JavaScript
// =============================================================================

import { createServer } from "http";
import app from "./app";
import { prisma } from "./config/database";
import { initSocket, closeSocket } from "./socket";
import { startBackgroundJobs, stopBackgroundJobs } from "./jobs";

const PORT = process.env.PORT || 4000;

async function main() {
  const httpServer = createServer(app);
  initSocket(httpServer);
  startBackgroundJobs();

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n🚀 Safick backend running on http://localhost:${PORT}`);
    console.log(`   LAN: use http://<your-pc-ip>:${PORT} on physical phones`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Socket.IO: same origin (WebSocket upgrade)\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    stopBackgroundJobs();
    await closeSocket();

    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log("HTTP server closed.");
        resolve();
      });
    });

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
