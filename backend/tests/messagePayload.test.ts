import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toSocketMessagePayload } from "../src/services/message.service";

describe("toSocketMessagePayload", () => {
  it("maps a DB row to the socket wire format", () => {
    const created = new Date("2026-05-19T12:00:00.000Z");
    const payload = toSocketMessagePayload(
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        conversation_id: "550e8400-e29b-41d4-a716-446655440001",
        sender_id: "550e8400-e29b-41d4-a716-446655440002",
        body: "Hello",
        created_at: created,
      },
      "client-1",
    );

    assert.equal(payload.roomType, "conversation");
    assert.equal(payload.roomId, "550e8400-e29b-41d4-a716-446655440001");
    assert.equal(payload.text, "Hello");
    assert.equal(payload.clientId, "client-1");
    assert.equal(payload.createdAt, created.toISOString());
  });
});
