//A regression guard so conversation and live chat always use consistent Socket.IO room IDs.
// if the room IDs are not consistent, the chat will not work.
// Test Socket.IO room IDs are consistent and predictable.
// =============================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { conversationRoom, liveRoom } from "../src/utils/socketRooms";

describe("socketRooms", () => {
  it("builds conversation room names", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    assert.equal(conversationRoom(id), `conversation:${id}`);
  });

  it("builds live room names", () => {
    const id = "550e8400-e29b-41d4-a716-446655440001";
    assert.equal(liveRoom(id), `live:${id}`);
  });
});
