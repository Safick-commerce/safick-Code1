import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useState, useRef, useCallback, useEffect } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  joinConversation,
  sendConversationMessage,
  emitTyping,
  subscribeToMessages,
  subscribeToTyping,
  isConversationRoomJoined,
} from "../lib/socket";
import {
  getConversationChat,
  type ChatMessage,
  type ConversationSummary,
} from "../utils/conversationApi";
import { takeConversationBootstrap } from "../utils/conversationBootstrapCache";
import { apiFetch } from "../lib/apiFetch";
import { formatPriceXaf } from "../utils/searchApi";
import type { SocketChatMessagePayload, SocketTypingPayload } from "../types/socket";

const ROUTES = { USER_PROFILE: "/productDetails" } as const;
const OFFER_PREFIX = "Price offer: ";

function formatOfferMessage(amount: number): string {
  return `${OFFER_PREFIX}${formatPriceXaf(amount)}`;
}

function isOfferMessage(text: string): boolean {
  return text.startsWith(OFFER_PREFIX);
}

function parseOfferPriceInput(raw: string): number | null {
  const normalized = raw.replace(/,/g, "").trim();
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount);
}

function wireTextToMessage(
  text: string,
  base: Omit<Message, "type" | "text" | "dealAmount">,
): Message {
  if (isOfferMessage(text)) {
    return {
      ...base,
      type: "status_update",
      text,
      dealAmount: undefined,
    };
  }
  return { ...base, type: "text", text };
}

function formatMessageTime(isoOrDate?: string): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function payloadToMessage(payload: SocketChatMessagePayload, currentUserId: string | undefined): Message {
  return wireTextToMessage(payload.text, {
    id: payload.id,
    isSent: Boolean(currentUserId && payload.senderId === currentUserId),
    timestamp: formatMessageTime(payload.createdAt),
    readStatus: payload.senderId === currentUserId ? "delivered" : undefined,
  });
}

function chatRowToMessage(row: ChatMessage, currentUserId: string | undefined): Message {
  return wireTextToMessage(row.text, {
    id: row.id,
    isSent: Boolean(currentUserId && row.senderId === currentUserId),
    timestamp: formatMessageTime(row.createdAt),
    readStatus: row.senderId === currentUserId ? "delivered" : undefined,
  });
}

function buildMessageList(
  conv: ConversationSummary,
  history: ChatMessage[],
  currentUserId: string | undefined,
): Message[] {
  const systemLine: Message = {
    id: `system-${conv.id}`,
    type: "system",
    text: `Conversation about ${conv.productTitle}`,
    isSent: false,
    timestamp: formatMessageTime(conv.createdAt),
  };
  return [systemLine, ...history.map((row) => chatRowToMessage(row, currentUserId))];
}

// Message types
type MessageType = 'text' | 'status_update' | 'system';
type ReadStatus = 'sent' | 'delivered' | 'read';

interface Message {
  id: string;
  type: MessageType;
  text: string;
  isSent: boolean;
  timestamp: string;
  readStatus?: ReadStatus;
  dealAmount?: number;
  statusIcon?: string;
}

// Sample messages removed — loaded from GET /api/conversations/:id/messages

export default function UserMessage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isConnected, connectionError } = useSocket();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId =
    typeof params.conversationId === "string"
      ? params.conversationId
      : params.conversationId?.[0];

  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPriceText, setOfferPriceText] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null);
  const [sendingOffer, setSendingOffer] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const userId = user?.id;
  const initialLoadDone = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setLoadError("No conversation selected.");
      return;
    }

    setLoadError(null);
    try {
      const { conversation: conv, messages: history } = await getConversationChat(conversationId);
      setConversation(conv);
      setMessages(buildMessageList(conv, history, userId));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load conversation");
    } finally {
      initialLoadDone.current = true;
    }
  }, [conversationId, userId]);

  useEffect(() => {
    initialLoadDone.current = false;
    setLoadError(null);
    if (!conversationId) return;

    const boot = takeConversationBootstrap(conversationId);
    if (boot) {
      setConversation(boot.conversation);
      setMessages(buildMessageList(boot.conversation, boot.messages, userId));
      if (boot.messages.length > 0) {
        initialLoadDone.current = true;
      }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    } else {
      setConversation(null);
      setMessages([]);
    }

    void loadConversation();
  }, [conversationId, loadConversation, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return;
      if (!initialLoadDone.current || !isConnected) {
        void loadConversation();
      }
    }, [conversationId, loadConversation, isConnected]),
  );

  useEffect(() => {
    if (!isConnected || !conversationId) return;

    let cancelled = false;
    (async () => {
      const result = await joinConversation(conversationId);
      if (!cancelled) {
        setRoomJoined(result.ok || isConversationRoomJoined(conversationId));
        if (!result.ok) {
          console.warn("[usermessage] join_conversation failed", result.error);
        } else if (result.conversation && result.messages) {
          setConversation((prev) => prev ?? result.conversation!);
          setMessages((prev) => {
            if (prev.length > 0) return prev;
            return buildMessageList(result.conversation!, result.messages!, userId);
          });
          initialLoadDone.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, conversationId, userId]);

  const appendIncoming = useCallback(
    (payload: SocketChatMessagePayload) => {
      if (payload.roomType !== "conversation" || payload.roomId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        if (payload.clientId && prev.some((m) => m.id === payload.clientId)) {
          return prev.map((m) =>
            m.id === payload.clientId ? payloadToMessage(payload, userId) : m,
          );
        }
        return [...prev, payloadToMessage(payload, userId)];
      });
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [conversationId, userId],
  );

  useEffect(() => {
    return subscribeToMessages(appendIncoming);
  }, [appendIncoming]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToTyping((payload: SocketTypingPayload) => {
      if (payload.roomType !== "conversation" || payload.roomId !== conversationId) return;
      if (payload.userId === userId) return;

      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      setIsTyping(Boolean(payload.isTyping));
      if (payload.isTyping) {
        typingClearTimer.current = setTimeout(() => setIsTyping(false), 4000);
      }
    });
  }, [conversationId, userId]);

  const keyboardHeight = useSharedValue(0);
  useKeyboardHandler({
    onMove: (event) => {
      'worklet';
      keyboardHeight.value = Math.max(event.height, 0);
    },
  }, []);

  const animatedKeyboardStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }));

  const handleBackPress = () => router.back();
  const handleViewProfilePress = () => router.push(ROUTES.USER_PROFILE);

  const sendChatText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !conversationId) return;

      const clientId = `client-${Date.now()}`;
      const optimistic = wireTextToMessage(trimmed, {
        id: clientId,
        isSent: true,
        timestamp: formatMessageTime(),
        readStatus: "sent",
      });

      setMessages((prev) => [...prev, optimistic]);
      emitTyping("conversation", conversationId, false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      if (isConnected) {
        let canSend = roomJoined;
        if (!canSend) {
          const joinResult = await joinConversation(conversationId);
          canSend = joinResult.ok;
          if (joinResult.ok) setRoomJoined(true);
        }
        if (canSend) {
          const result = await sendConversationMessage(conversationId, trimmed, clientId);
          if (result.ok && result.message) {
            setMessages((prev) =>
              prev.map((m) => (m.id === clientId ? payloadToMessage(result.message!, userId) : m)),
            );
          } else if (!result.ok) {
            console.warn("[usermessage] send_message failed", result.error);
          }
          return;
        }
      }

      try {
        const data = await apiFetch<{ message: SocketChatMessagePayload }>(
          `/api/conversations/${conversationId}/messages`,
          { method: "POST", body: JSON.stringify({ text: trimmed, clientId }) },
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === clientId ? payloadToMessage(data.message, userId) : m)),
        );
      } catch (error) {
        console.warn("[usermessage] REST send failed", error);
      }
    },
    [conversationId, isConnected, roomJoined, userId],
  );

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText("");
    await sendChatText(trimmed);
  }, [inputText, sendChatText]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (!isConnected || !conversationId) return;

      if (!isConversationRoomJoined(conversationId)) {
        void joinConversation(conversationId);
      }

      if (text.trim().length > 0) {
        emitTyping("conversation", conversationId, true);
        if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
        typingStopTimer.current = setTimeout(() => {
          emitTyping("conversation", conversationId, false);
        }, 1500);
      } else {
        emitTyping("conversation", conversationId, false);
      }
    },
    [isConnected, conversationId],
  );

  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
    };
  }, []);

  const handleMakeOffer = useCallback(() => {
    setOfferError(null);
    setOfferPriceText("");
    setOfferModalOpen(true);
  }, []);

  const handleCloseOfferModal = useCallback(() => {
    if (sendingOffer) return;
    setOfferModalOpen(false);
    setOfferError(null);
    setOfferPriceText("");
  }, [sendingOffer]);

  const handleSubmitOffer = useCallback(async () => {
    const amount = parseOfferPriceInput(offerPriceText);
    if (!amount) {
      setOfferError("Enter a valid price in XAF.");
      return;
    }

    setSendingOffer(true);
    setOfferError(null);
    try {
      await sendChatText(formatOfferMessage(amount));
      setOfferModalOpen(false);
      setOfferPriceText("");
    } finally {
      setSendingOffer(false);
    }
  }, [offerPriceText, sendChatText]);

  const getReadStatusIcon = (status?: ReadStatus) => {
    switch (status) {
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={styles.readIcon} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.5)" style={styles.readIcon} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.5)" style={styles.readIcon} />;
      default:
        return null;
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'system') {
      return (
        <View key={message.id} style={{ alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{message.text}</Text>
        </View>
      );
    }

    if (message.type === 'status_update' || isOfferMessage(message.text)) {
      const offerLabel = message.text.slice(OFFER_PREFIX.length);
      return (
        <View
          key={message.id}
          style={[
            styles.bubbleWrap,
            message.isSent ? styles.bubbleWrapSent : styles.bubbleWrapReceived,
          ]}
        >
          <View style={[styles.offerBubble, message.isSent ? styles.offerBubbleSent : styles.offerBubbleReceived]}>
            <View style={styles.offerBubbleHeader}>
              <MaterialIcons name="local-offer" size={18} color="#FF2800" />
              <Text style={styles.offerBubbleTitle}>Price offer</Text>
            </View>
            <Text style={styles.offerBubbleAmount}>{offerLabel}</Text>
            <View style={styles.bubbleFooter}>
              <Text
                style={[
                  styles.bubbleTimestamp,
                  message.isSent ? styles.bubbleTimestampSent : styles.bubbleTimestampReceived,
                ]}
              >
                {message.timestamp}
              </Text>
              {message.isSent && getReadStatusIcon(message.readStatus)}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.bubbleWrap,
          message.isSent ? styles.bubbleWrapSent : styles.bubbleWrapReceived,
        ]}
      >
        <View style={[styles.bubble, message.isSent ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={[styles.bubbleText, message.isSent ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
            {message.text}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text
              style={[
                styles.bubbleTimestamp,
                message.isSent ? styles.bubbleTimestampSent : styles.bubbleTimestampReceived,
              ]}
            >
              {message.timestamp}
            </Text>
            {message.isSent && getReadStatusIcon(message.readStatus)}
          </View>
        </View>
      </View>
    );
  };

  const peerName = conversation?.peer.displayName ?? "Chat";
  const peerAvatarSource = conversation?.peer.avatarUrl
    ? { uri: conversation.peer.avatarUrl }
    : require("../assets/images/seller4.jpeg");

  if ((loadError && !conversation) || !conversationId) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{loadError ?? "Conversation not found."}</Text>
        <TouchableOpacity onPress={handleBackPress} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header with online status */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={36} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerProfile} onPress={handleViewProfilePress}>
            <View style={styles.headerAvatarContainer}>
              <Image
                source={peerAvatarSource}
                style={styles.headerAvatar}
                resizeMode="cover"
              />
              <View style={styles.headerStatusDot} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{peerName}</Text>
              <Text style={styles.headerStatus}>
                {isConnected && roomJoined
                  ? "Connected"
                  : connectionError
                    ? "Chat offline"
                    : "Connecting…"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call-outline" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-vertical" size={22} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Product card (pinned) */}
        <View style={styles.productCard}>
          <Image
            source={
              conversation?.productImageUrl
                ? { uri: conversation.productImageUrl }
                : require('../assets/images/seller4.jpeg')
            }
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {conversation?.productTitle ?? "Listing"}
            </Text>
            <Text style={styles.productPrice}>15,000 XAF</Text>
          </View>
          <TouchableOpacity style={styles.productBuyButton}>
            <Text style={styles.productBuyText}>Buy</Text>
          </TouchableOpacity>
        </View>

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.bubbleWrap, styles.bubbleWrapReceived]}>
              <View style={[styles.bubble, styles.bubbleReceived, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.offerButton} onPress={handleMakeOffer} accessibilityRole="button" accessibilityLabel="Make a price offer">
            <MaterialIcons name="local-offer" size={20} color="#FF2800" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
          <TouchableOpacity style={styles.inputIconButton}>
            <MaterialIcons name="photo-library" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIconButton}>
            <MaterialIcons name="keyboard-voice" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
            onPress={handleSend}
          >
            <MaterialIcons name="send" size={22} color={inputText.trim() ? '#FF2800' : '#999999'} />
          </TouchableOpacity>
        </View>
        <Animated.View style={animatedKeyboardStyle} />

        <Modal visible={offerModalOpen} transparent animationType="fade" onRequestClose={handleCloseOfferModal}>
          <Pressable style={styles.offerModalBackdrop} onPress={handleCloseOfferModal}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.offerModalKeyboard}
            >
              <Pressable style={styles.offerModalCard} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.offerModalTitle}>Make a price offer</Text>
                <Text style={styles.offerModalSubtitle} numberOfLines={2}>
                  {conversation?.productTitle ?? "This listing"}
                </Text>
                <TextInput
                  style={styles.offerModalInput}
                  placeholder="Amount in XAF"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={offerPriceText}
                  onChangeText={(text) => {
                    setOfferPriceText(text);
                    if (offerError) setOfferError(null);
                  }}
                  editable={!sendingOffer}
                  autoFocus
                />
                {offerError ? <Text style={styles.offerModalError}>{offerError}</Text> : null}
                <View style={styles.offerModalActions}>
                  <TouchableOpacity
                    style={styles.offerModalCancel}
                    onPress={handleCloseOfferModal}
                    disabled={sendingOffer}
                  >
                    <Text style={styles.offerModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.offerModalSubmit, sendingOffer && styles.offerModalSubmitDisabled]}
                    onPress={() => void handleSubmitOffer()}
                    disabled={sendingOffer}
                  >
                    <Text style={styles.offerModalSubmitText}>
                      {sendingOffer ? "Sending…" : "Send offer"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  headerStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    gap: 2,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerStatus: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '500',
  },
  headerAction: {
    padding: 8,
  },
  // Product card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF2800',
  },
  productBuyButton: {
    backgroundColor: '#FF2800',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  productBuyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Messages
  messageArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubbleWrapSent: {
    justifyContent: 'flex-end',
  },
  bubbleWrapReceived: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: '#FF2800',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSent: {
    color: '#ffffff',
  },
  bubbleTextReceived: {
    color: '#1a1a1a',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  bubbleTimestamp: {
    fontSize: 11,
  },
  bubbleTimestampSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleTimestampReceived: {
    color: '#9CA3AF',
  },
  readIcon: {
    marginLeft: 2,
  },

  // Typing indicator
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 35,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  offerButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  offerBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  offerBubbleSent: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFD6D6',
  },
  offerBubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE5E5',
  },
  offerBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  offerBubbleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF2800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  offerBubbleAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  offerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  offerModalKeyboard: {
    width: '100%',
  },
  offerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  offerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  offerModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  offerModalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  offerModalError: {
    fontSize: 13,
    color: '#DC2626',
  },
  offerModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  offerModalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offerModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  offerModalSubmit: {
    backgroundColor: '#FF2800',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offerModalSubmitDisabled: {
    opacity: 0.6,
  },
  offerModalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    fontSize: 15,
    lineHeight: 20,
    backgroundColor: '#f5f5f5',
  },
  inputIconButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonActive: {},
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: { fontSize: 15, color: "#6B7280" },
  errorText: { fontSize: 15, color: "#B91C1C", textAlign: "center", marginBottom: 12 },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: { fontSize: 15, color: "#FF2800", fontWeight: "600" },
});
