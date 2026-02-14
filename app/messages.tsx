import { Text, View, TouchableOpacity, StyleSheet, Image, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";

// Types
type DealStatus = 'none' | 'offered' | 'accepted' | 'payment_pending' | 'shipped' | 'delivered';
type UserStatus = 'online' | 'away' | 'offline';

interface Conversation {
  id: string;
  seller: {
    name: string;
    subName: string;
    avatar: any; // require() image
    status: UserStatus;
  };
  product: {
    name: string;
    price: number;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isSent: boolean;
  };
  unreadCount: number;
  dealStatus: DealStatus;
}

// Sample data
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    seller: {
      name: 'Helena Beauty',
      subName: 'Helena Hills',
      avatar: require('../assets/images/seller4.jpeg'),
      status: 'online',
    },
    product: { name: "Women's workout set", price: 15000 },
    lastMessage: {
      text: 'Yes, the dress is still available! Want me to hold it for you?',
      timestamp: '2m ago',
      isSent: false,
    },
    unreadCount: 2,
    dealStatus: 'none',
  },
];

const STATUS_COLORS: Record<UserStatus, string> = {
  online: '#22C55E',
  away: '#EAB308',
  offline: '#9CA3AF',
};

const DEAL_LABELS: Record<DealStatus, { text: string; color: string; bg: string; icon: string } | null> = {
  none: null,
  offered: { text: 'Offer Sent', color: '#D97706', bg: '#FEF3C7', icon: 'swap-horiz' },
  accepted: { text: 'Deal Accepted', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle' },
  payment_pending: { text: 'Payment Pending', color: '#D97706', bg: '#FEF3C7', icon: 'payment' },
  shipped: { text: 'Shipped', color: '#2563EB', bg: '#DBEAFE', icon: 'local-shipping' },
  delivered: { text: 'Delivered', color: '#16A34A', bg: '#DCFCE7', icon: 'verified' },
};

export default function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(
        c =>
          c.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      router.push('/usermessage');
    },
    [router]
  );

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => {
      const dealInfo = DEAL_LABELS[item.dealStatus];

      return (
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.7}
        >
          {/* Avatar with status dot */}
          <View style={styles.avatarContainer}>
            <Image source={item.seller.avatar} style={styles.avatar} resizeMode="cover" />
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.seller.status] }]} />
          </View>

          {/* Conversation details */}
          <View style={styles.conversationDetails}>
            {/* Name row */}
            <View style={styles.nameRow}>
              <Text style={styles.sellerName} numberOfLines={1}>
                {item.seller.name}
              </Text>
              <Text style={styles.timestamp}>{item.lastMessage.timestamp}</Text>
            </View>

            {/* Last message */}
            <Text
              style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessage.isSent ? 'You: ' : ''}
              {item.lastMessage.text}
            </Text>

            {/* Product tag and deal status */}
            <View style={styles.tagsRow}>
              <View style={styles.productTag}>
                <Ionicons name="cube-outline" size={12} color="#6B7280" />
                <Text style={styles.productTagText} numberOfLines={1}>
                  {item.product.name}
                </Text>
              </View>

              {dealInfo && (
                <View style={[styles.dealBadge, { backgroundColor: dealInfo.bg }]}>
                  <MaterialIcons name={dealInfo.icon as any} size={12} color={dealInfo.color} />
                  <Text style={[styles.dealBadgeText, { color: dealInfo.color }]}>{dealInfo.text}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Unread badge */}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleConversationPress]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-sharp" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start chatting with sellers by tapping "Ask" on a product
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  conversationDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lastMessageUnread: {
    color: '#000000',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productTagText: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 120,
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#FF2800',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
