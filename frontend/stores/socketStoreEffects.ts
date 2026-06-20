// =============================================================================
// socketStoreEffects — connects / disconnects the Socket.IO client based on
// the current Supabase session, and mirrors the lifecycle into socketStore.
// =============================================================================
// Why this lives outside the store: long-lived network connections do not
// belong inside a state container (rule of thumb that survived the AuthContext
// migration and the SocketContext migration). The store stays pure state; this
// module owns the imperative effect.
//
// `bootSocket()` is called once on app boot from `SocketProvider`. It returns
// a teardown function for hot-reload safety.
// =============================================================================

import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuthStore } from "./authStore";
import { useSocketStore } from "./socketStore";

let booted = false;
let cleanup: (() => void) | null = null;

export function bootSocket(): () => void {
  if (booted && cleanup) {
    return cleanup;
  }
  booted = true;

  // Hook into auth state — connect once we have a token, disconnect on sign-out.
  const unsubscribe = useAuthStore.subscribe((state, prev) => {
    if (!state.isReady) return;
    const token = state.session?.access_token ?? null;
    const prevToken = prev.session?.access_token ?? null;
    if (token === prevToken) return;
    if (token) {
      mount(token);
    } else {
      teardownSocket();
    }
  });

  // Cover the case where auth was already ready when we booted (e.g. cold
  // start after a restored session). Otherwise we'd wait for the next change.
  const initial = useAuthStore.getState();
  if (initial.isReady && initial.session?.access_token) {
    mount(initial.session.access_token);
  }

  cleanup = () => {
    teardownSocket();
    unsubscribe();
    booted = false;
    cleanup = null;
  };
  return cleanup;
}

function mount(token: string) {
  const setStatus = useSocketStore.getState().setStatus;
  const setError = useSocketStore.getState().setConnectionError;

  setStatus("connecting");
  const s = connectSocket(token);

  const onConnect = () => setStatus("connected", s.id ?? null);
  const onDisconnect = () => setStatus("disconnected");
  const onConnectError = (err: Error) => {
    setError(err.message);
    setStatus("error");
  };

  s.on("connect", onConnect);
  s.on("disconnect", onDisconnect);
  s.on("connect_error", onConnectError);
  if (s.connected) onConnect();

  // Remember the listeners so a clean teardown can detach them — without this
  // every hot-reload would leak listeners on the singleton socket.
  currentDetach = () => {
    s.off("connect", onConnect);
    s.off("disconnect", onDisconnect);
    s.off("connect_error", onConnectError);
  };
}

let currentDetach: (() => void) | null = null;

function teardownSocket() {
  if (currentDetach) {
    currentDetach();
    currentDetach = null;
  }
  disconnectSocket();
  useSocketStore.getState().setStatus("disconnected");
}
