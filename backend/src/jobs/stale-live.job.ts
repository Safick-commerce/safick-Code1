import { sweepStaleLiveSessions } from "../services/live.service";

export async function runStaleLiveSweepOnce(): Promise<void> {
  await sweepStaleLiveSessions();
}
