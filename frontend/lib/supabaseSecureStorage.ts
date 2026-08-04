import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

/**
 * Chunked SecureStore adapter for Supabase auth sessions.
 * expo-secure-store values are limited to ~2048 bytes; sessions are larger.
 */
const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number): string {
  return `${key}_chunk_${index}`;
}

export const supabaseSecureStorage: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunk_count`);
    if (!chunkCountRaw) {
      return SecureStore.getItemAsync(key);
    }

    const chunkCount = Number(chunkCountRaw);
    if (!Number.isFinite(chunkCount) || chunkCount <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}_chunk_count`);
      await SecureStore.setItemAsync(key, value);
      return;
    }

    await SecureStore.deleteItemAsync(key);
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_chunk_count`, String(chunkCount));
    for (let i = 0; i < chunkCount; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunk_count`);
    if (chunkCountRaw) {
      const chunkCount = Number(chunkCountRaw);
      if (Number.isFinite(chunkCount) && chunkCount > 0) {
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i));
        }
      }
      await SecureStore.deleteItemAsync(`${key}_chunk_count`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};
