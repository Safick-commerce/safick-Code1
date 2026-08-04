import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLiveHeartbeatTimeoutMs } from "../src/services/live.service";

describe("live.service heartbeat config", () => {
  it("defaults to 90 seconds when env is unset", () => {
    const prev = process.env.LIVE_HEARTBEAT_TIMEOUT_MS;
    delete process.env.LIVE_HEARTBEAT_TIMEOUT_MS;
    assert.equal(getLiveHeartbeatTimeoutMs(), 90_000);
    if (prev !== undefined) process.env.LIVE_HEARTBEAT_TIMEOUT_MS = prev;
  });

  it("parses LIVE_HEARTBEAT_TIMEOUT_MS when valid", () => {
    const prev = process.env.LIVE_HEARTBEAT_TIMEOUT_MS;
    process.env.LIVE_HEARTBEAT_TIMEOUT_MS = "60000";
    assert.equal(getLiveHeartbeatTimeoutMs(), 60_000);
    if (prev !== undefined) process.env.LIVE_HEARTBEAT_TIMEOUT_MS = prev;
    else delete process.env.LIVE_HEARTBEAT_TIMEOUT_MS;
  });
});

describe("liveLikes.store", async () => {
  const { getLiveLikeCount, incrementLiveLikeCount, clearLiveLikeCount } = await import(
    "../src/services/liveLikes.store"
  );

  it("increments and clears per live id", () => {
    const id = "00000000-0000-4000-8000-000000000099";
    clearLiveLikeCount(id);
    assert.equal(getLiveLikeCount(id), 0);
    assert.equal(incrementLiveLikeCount(id), 1);
    assert.equal(incrementLiveLikeCount(id), 2);
    clearLiveLikeCount(id);
    assert.equal(getLiveLikeCount(id), 0);
  });
});
