import type { Router } from "expo-router";
import { openConversation } from "./conversationApi";
import { primeConversationBootstrap } from "./conversationBootstrapCache";

export type ChatOrigin = "inbox" | "product" | "profile";

export async function startConversationChat(
  router: Router,
  productId: string,
  origin: ChatOrigin = "product",
): Promise<void> {
  const bootstrap = await openConversation(productId);
  primeConversationBootstrap(bootstrap.conversation.id, bootstrap);
  router.push({
    pathname: "/usermessage",
    params: { conversationId: bootstrap.conversation.id, origin },
  });
}
