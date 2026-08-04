import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState, DisconnectReason, RoomEvent } from "livekit-client";
import { useConnectionState, useLocalParticipant, useRoomContext } from "@livekit/react-native";

export type LiveConnectionUiState = "connected" | "reconnecting" | "lost";

type UseLiveConnectionOptions = {
  serverUrl: string;
  token: string;
  onIntentionalDisconnect?: () => void;
};

export function useLiveConnection({
  serverUrl,
  token,
  onIntentionalDisconnect,
}: UseLiveConnectionOptions) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const intentionalRef = useRef(false);
  const desiredMicEnabledRef = useRef(true);
  const [uiState, setUiState] = useState<LiveConnectionUiState>("connected");

  const markIntentionalDisconnect = useCallback(() => {
    intentionalRef.current = true;
  }, []);

  const setDesiredMicEnabled = useCallback((enabled: boolean) => {
    desiredMicEnabledRef.current = enabled;
  }, []);

  const retryConnection = useCallback(async () => {
    if (!room) return;
    setUiState("reconnecting");
    try {
      await room.connect(serverUrl, token);
      setUiState("connected");
    } catch {
      setUiState("lost");
    }
  }, [room, serverUrl, token]);

  useEffect(() => {
    if (!room) return;

    const onReconnecting = () => setUiState("reconnecting");
    const onReconnected = async () => {
      setUiState("connected");
      try {
        await localParticipant.setMicrophoneEnabled(desiredMicEnabledRef.current);
      } catch {
        // Mic restore is best-effort after reconnect.
      }
    };
    const onDisconnected = (reason?: DisconnectReason) => {
      if (intentionalRef.current) {
        onIntentionalDisconnect?.();
        return;
      }
      if (reason === DisconnectReason.CLIENT_INITIATED) {
        onIntentionalDisconnect?.();
        return;
      }
      setUiState("lost");
    };

    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.Disconnected, onDisconnected);

    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [localParticipant, onIntentionalDisconnect, room]);

  useEffect(() => {
    if (connectionState === ConnectionState.Reconnecting) {
      setUiState("reconnecting");
      return;
    }
    if (connectionState === ConnectionState.Connected) {
      setUiState("connected");
      return;
    }
    if (
      connectionState === ConnectionState.Disconnected &&
      !intentionalRef.current
    ) {
      setUiState("lost");
    }
  }, [connectionState]);

  return {
    uiState,
    markIntentionalDisconnect,
    setDesiredMicEnabled,
    retryConnection,
  };
}
