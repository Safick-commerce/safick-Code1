/** Payload broadcast when a chat or live message is sent. */
export interface SocketChatMessagePayload {
  id: string;
  roomType: "conversation" | "live";
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
  /** Client-generated id for optimistic UI de-duplication. */
  clientId?: string;
}

export interface SocketTypingPayload {
  roomType: "conversation" | "live";
  roomId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}
