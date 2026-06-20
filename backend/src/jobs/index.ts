// =============================================================================
// Job Scheduler — in-process cron for the escrow MVP
// =============================================================================
// Single-process scheduler. Good enough for MVP throughput; if the API ever
// horizontal-scales we either move to a dedicated worker process or guard
// each tick with a Redis lock so only one node fires.
//
// Currently scheduled:
//   - Auto-release (every hour): delivered → completed after the 7-day window
//   - Reconciliation (every 5 minutes): verify stalled checkouts + retry
//     failed payouts
//
// To DISABLE jobs (e.g. in unit tests or when running multiple API replicas
// behind a load balancer that already has a worker), set `JOBS_DISABLED=1`.
// =============================================================================

import { runAutoReleaseOnce } from "./auto-release.job";
import { runReconciliationOnce } from "./reconciliation.job";

const AUTO_RELEASE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RECONCILIATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let started = false;
const handles: Array<ReturnType<typeof setInterval>> = [];

function safeRun(name: string, fn: () => Promise<void>) {
  fn().catch((err) => {
    console.error(`[jobs.${name}] tick failed`, err);
  });
}

export function startBackgroundJobs(): void {
  if (started) return;
  if (process.env.JOBS_DISABLED === "1") {
    console.log("[jobs] background jobs disabled via JOBS_DISABLED=1");
    return;
  }
  started = true;
  console.log("[jobs] starting auto-release + reconciliation");

  // Kick off once on boot so a freshly deployed instance catches anything that
  // accumulated during the deploy window.
  safeRun("auto-release.boot", runAutoReleaseOnce);
  safeRun("reconciliation.boot", runReconciliationOnce);

  handles.push(
    setInterval(() => safeRun("auto-release", runAutoReleaseOnce), AUTO_RELEASE_INTERVAL_MS),
  );
  handles.push(
    setInterval(
      () => safeRun("reconciliation", runReconciliationOnce),
      RECONCILIATION_INTERVAL_MS,
    ),
  );
}

export function stopBackgroundJobs(): void {
  for (const handle of handles) clearInterval(handle);
  handles.length = 0;
  started = false;
}
