export interface SocketChatMessagePayload {
  id: string;
  roomType: "conversation" | "live";
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
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
