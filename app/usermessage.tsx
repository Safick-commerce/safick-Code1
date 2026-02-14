import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useState, useRef, useCallback } from "react";

const ROUTES = { USER_PROFILE: "/userprofile" } as const;

// Message types
type MessageType = 'text' | 'deal_offer' | 'status_update' | 'system';
type DealOfferStatus = 'pending' | 'accepted' | 'declined' | 'countered';
type ReadStatus = 'sent' | 'delivered' | 'read';

interface Message {
  id: string;
  type: MessageType;
  text: string;
  isSent: boolean;
  timestamp: string;
  readStatus?: ReadStatus;
  dealAmount?: number;
  dealStatus?: DealOfferStatus;
  statusIcon?: string;
}

// Sample messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    type: 'system',
    text: "You started a conversation about Women's workout set",
    isSent: false,
    timestamp: '10:00 AM',
  },
  {
    id: '1',
    type: 'text',
    text: 'Hi! Is this still available?',
    isSent: true,
    timestamp: '10:02 AM',
    readStatus: 'read',
  },
  {
    id: '2',
    type: 'text',
    text: 'Yes, it is! The pink set is very popular right now.',
    isSent: false,
    timestamp: '10:03 AM',
  },
  {
    id: '3',
    type: 'text',
    text: 'Can you do a better price? How about 14,000 XAF?',
    isSent: true,
    timestamp: '10:05 AM',
    readStatus: 'read',
  },
  {
    id: '4',
    type: 'deal_offer',
    text: 'Deal offer',
    isSent: false,
    timestamp: '10:06 AM',
    dealAmount: 14500,
    dealStatus: 'pending',
  },
  {
    id: '5',
    type: 'text',
    text: "I can do 14,500 XAF. That's my best price!",
    isSent: false,
    timestamp: '10:06 AM',
  },
];

export default function UserMessage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleBackPress = () => router.back();
  const handleViewProfilePress = () => router.push(ROUTES.USER_PROFILE);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      text: trimmed,
      isSent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      readStatus: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate read status update
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg => (msg.id === newMessage.id ? { ...msg, readStatus: 'delivered' as ReadStatus } : msg))
      );
    }, 1000);

    // Simulate typing indicator
    setTimeout(() => setIsTyping(true), 1500);
    setTimeout(() => setIsTyping(false), 3500);
  }, [inputText]);

  const handleMakeOffer = useCallback(() => {
    // TODO: Show offer modal with price input
    const offerMessage: Message = {
      id: Date.now().toString(),
      type: 'deal_offer',
      text: 'Deal offer',
      isSent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dealAmount: 14000,
      dealStatus: 'pending',
      readStatus: 'sent',
    };
    setMessages(prev => [...prev, offerMessage]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleDealAction = useCallback((messageId: string, action: 'accept' | 'counter' | 'decline') => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const statusMap: Record<string, DealOfferStatus> = {
            accept: 'accepted',
            counter: 'countered',
            decline: 'declined',
          };
          return { ...msg, dealStatus: statusMap[action] };
        }
        return msg;
      })
    );

    const statusText: Record<string, string> = {
      accept: 'Deal accepted! Proceed to payment.',
      counter: 'You countered the offer.',
      decline: 'Offer declined.',
    };

    const statusMessage: Message = {
      id: Date.now().toString(),
      type: 'status_update',
      text: statusText[action],
      isSent: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      statusIcon: action === 'accept' ? 'check-circle' : action === 'decline' ? 'cancel' : 'swap-horiz',
    };
    setMessages(prev => [...prev, statusMessage]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Read status icon
  const renderReadStatus = (status?: ReadStatus) => {
    if (!status) return null;
    switch (status) {
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.readIcon} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="#FFFFFF" style={styles.readIcon} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#90CAF9" style={styles.readIcon} />;
      default:
        return null;
    }
  };

  // Render different message types
  const renderMessage = (msg: Message) => {
    switch (msg.type) {
      case 'system':
        return (
          <View key={msg.id} style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{msg.text}</Text>
          </View>
        );

      case 'status_update':
        return (
          <View key={msg.id} style={styles.statusUpdateContainer}>
            <MaterialIcons name={msg.statusIcon as any} size={16} color="#16A34A" />
            <Text style={styles.statusUpdateText}>{msg.text}</Text>
          </View>
        );

      case 'deal_offer':
        return (
          <View key={msg.id} style={[styles.bubbleWrap, msg.isSent ? styles.bubbleWrapSent : styles.bubbleWrapReceived]}>
            <View style={styles.dealOfferCard}>
              <View style={styles.dealOfferHeader}>
                <MaterialIcons name="handshake" size={20} color="#D97706" />
                <Text style={styles.dealOfferTitle}>
                  {msg.isSent ? 'Your Offer' : "Seller's Offer"}
                </Text>
              </View>
              <Text style={styles.dealOfferAmount}>{msg.dealAmount?.toLocaleString()} XAF</Text>

              {msg.dealStatus === 'pending' && !msg.isSent && (
                <View style={styles.dealActions}>
                  <TouchableOpacity
                    style={styles.dealAcceptButton}
                    onPress={() => handleDealAction(msg.id, 'accept')}
                  >
                    <Text style={styles.dealAcceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dealCounterButton}
                    onPress={() => handleDealAction(msg.id, 'counter')}
                  >
                    <Text style={styles.dealCounterText}>Counter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dealDeclineButton}
                    onPress={() => handleDealAction(msg.id, 'decline')}
                  >
                    <Text style={styles.dealDeclineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}

              {msg.dealStatus === 'accepted' && (
                <View style={styles.dealStatusBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#16A34A" />
                  <Text style={[styles.dealStatusText, { color: '#16A34A' }]}>Accepted</Text>
                </View>
              )}
              {msg.dealStatus === 'declined' && (
                <View style={styles.dealStatusBadge}>
                  <MaterialIcons name="cancel" size={16} color="#DC2626" />
                  <Text style={[styles.dealStatusText, { color: '#DC2626' }]}>Declined</Text>
                </View>
              )}
              {msg.dealStatus === 'pending' && msg.isSent && (
                <View style={styles.dealStatusBadge}>
                  <MaterialIcons name="schedule" size={16} color="#D97706" />
                  <Text style={[styles.dealStatusText, { color: '#D97706' }]}>Waiting for response</Text>
                </View>
              )}

              <Text style={styles.dealTimestamp}>{msg.timestamp}</Text>
            </View>
          </View>
        );

      default: // text
        return (
          <View key={msg.id} style={[styles.bubbleWrap, msg.isSent ? styles.bubbleWrapSent : styles.bubbleWrapReceived]}>
            <View style={[styles.bubble, msg.isSent ? styles.bubbleSent : styles.bubbleReceived]}>
              <Text style={[styles.bubbleText, msg.isSent ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
                {msg.text}
              </Text>
              <View style={styles.bubbleFooter}>
                <Text style={[styles.bubbleTimestamp, msg.isSent ? styles.bubbleTimestampSent : styles.bubbleTimestampReceived]}>
                  {msg.timestamp}
                </Text>
                {msg.isSent && renderReadStatus(msg.readStatus)}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header with online status */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={36} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerProfile} onPress={handleViewProfilePress}>
            <View style={styles.headerAvatarContainer}>
              <Image
                source={require('../assets/images/seller4.jpeg')}
                style={styles.headerAvatar}
                resizeMode="cover"
              />
              <View style={styles.headerStatusDot} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>Helena Beauty</Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-vertical" size={22} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Product card (pinned) */}
        <View style={styles.productCard}>
          <Image
            source={require('../assets/images/seller4.jpeg')}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>Women's workout set</Text>
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
          <TouchableOpacity style={styles.offerButton} onPress={handleMakeOffer}>
            <MaterialIcons name="local-offer" size={20} color="#FF2800" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Message..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.inputIconButton}>
            <MaterialIcons name="photo-library" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIconButton}>
            <MaterialIcons name="emoji-emotions" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
            onPress={handleSend}
          >
            <MaterialIcons name="send" size={22} color={inputText.trim() ? '#FF2800' : '#999999'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  // System message
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  // Status update
  statusUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusUpdateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  // Deal offer card
  dealOfferCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    maxWidth: '85%',
    gap: 10,
  },
  dealOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealOfferTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  dealOfferAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dealActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dealAcceptButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  dealAcceptText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dealCounterButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  dealCounterText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '600',
  },
  dealDeclineButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  dealDeclineText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  dealStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dealTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
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
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  inputIconButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonActive: {},
});
