import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export type NetworkProfile = {
  isConnected: boolean;
  /** HTTP timeout for feed/API calls. */
  apiTimeoutMs: number;
  /** Parallel cover resolve + prefetch jobs. */
  coverConcurrency: number;
  /** Max time to wait for covers before showing the grid anyway. */
  coverDeadlineMs: number;
};

function isOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

/** Tune timeouts/concurrency from connection type (better UX on slow links). */
export async function getNetworkProfile(): Promise<NetworkProfile> {
  const state = await NetInfo.fetch();
  if (!isOnline(state)) {
    return {
      isConnected: false,
      apiTimeoutMs: 8_000,
      coverConcurrency: 1,
      coverDeadlineMs: 0,
    };
  }

  if (state.type === "wifi" || state.type === "ethernet") {
    return {
      isConnected: true,
      apiTimeoutMs: 20_000,
      coverConcurrency: 6,
      coverDeadlineMs: 14_000,
    };
  }

  if (state.type === "cellular") {
    const gen = state.details && "cellularGeneration" in state.details
      ? state.details.cellularGeneration
      : undefined;
    if (gen === "2g" || gen === "3g") {
      return {
        isConnected: true,
        apiTimeoutMs: 28_000,
        coverConcurrency: 2,
        coverDeadlineMs: 22_000,
      };
    }
    return {
      isConnected: true,
      apiTimeoutMs: 18_000,
      coverConcurrency: 3,
      coverDeadlineMs: 16_000,
    };
  }

  return {
    isConnected: true,
    apiTimeoutMs: 15_000,
    coverConcurrency: 4,
    coverDeadlineMs: 12_000,
  };
}
