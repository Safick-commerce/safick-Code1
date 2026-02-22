import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";

const AUTH_KEY = "user_logged_in";

// Route constants for security
const ROUTES = {
  USER_TAB: "/userTab",
} as const;

export default function ProfileScreen() {
  const router = useRouter();

  const handleProfilePress = useCallback(() => {
    try {
      router.push(ROUTES.USER_TAB);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    router.replace("/");
  }, [router]);

  const actionCards = [
    // Account Section
    { id: 1, icon: "pulse-outline", label: "Account Health", section: "account", badge: null },
    { id: 2, icon: "settings-outline", label: "Settings", section: "account", badge: null },
    { id: 3, icon: "notifications-outline", label: "Notification", section: "account", badge: 3 },
    { id: 4, icon: "mail-outline", label: "Change Email", section: "account", badge: null },
    { id: 5, icon: "check-decagram-outline", label: "Verified Seller", section: "account", badge: null, iconLibrary: "MaterialCommunityIcons" },
    
    // Shopping Section
    { id: 6, icon: "receipt-outline", label: "Orders", section: "shopping", badge: null },
    { id: 7, icon: "heart-outline", label: "Wishlist", section: "shopping", badge: 5 },
    { id: 8, icon: "cart-outline", label: "Cart", section: "shopping", badge: 2 },
    { id: 9, icon: "card-outline", label: "Payment", section: "shopping", badge: null },
    { id: 10, icon: "location-outline", label: "Addresses", section: "shopping", badge: null },
    
    // Support & Legal Section
    { id: 11, icon: "mail-outline", label: "Contact Us", section: "support", badge: null },
    { id: 12, icon: "flag-outline", label: "User Report", section: "support", badge: null },
    { id: 13, icon: "shield-checkmark-outline", label: "Privacy Policy", section: "legal", badge: null },
    { id: 14, icon: "document-text-outline", label: "Terms & Conditions", section: "legal", badge: null },
    { id: 15, icon: "help-circle-outline", label: "Help & Support", section: "support", badge: null },
  ];

  const sectionTitles: Record<string, string> = {
    account: "Account",
    shopping: "Shopping",
    support: "Support",
    legal: "Legal",
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Ionicons name="person" size={30} color="#000000" />
            </View>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.usernameContainer}>
              <Text style={styles.username}>Username</Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </View>
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={handleProfilePress}
              accessibilityLabel="View Profile"
              accessibilityRole="button"
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {actionCards.map((card, index) => {
          const previousCard = index > 0 ? actionCards[index - 1] : null;
          const showDivider = previousCard && previousCard.section !== card.section;
          const showSectionHeader = !previousCard || previousCard.section !== card.section;
          
          return (
            <View key={card.id}>
              {showSectionHeader && (
                <Text style={styles.sectionHeader}>{sectionTitles[card.section]}</Text>
              )}
              {showDivider && <View style={styles.sectionDivider} />}
              <TouchableOpacity 
                style={styles.cardItem}
                activeOpacity={0.2}
              >
                <View style={styles.cardLeftSection}>
                  <View style={styles.cardIconContainer}>
                    {card.iconLibrary === "MaterialCommunityIcons" ? (
                      <MaterialCommunityIcons 
                        name={card.icon as any} 
                        size={24} 
                        color="#000000" 
                      />
                    ) : (
                      <Ionicons 
                        name={card.icon as any} 
                        size={24} 
                        color="#000000" 
                      />
                    )}
                  </View>
                  <Text style={styles.cardText}>{card.label}</Text>
                  {card.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{card.badge}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          );
        })}
        
        {/* Sign Out Container */}
        <View style={styles.signOutSection}>
          <View style={styles.sectionDivider} />
          <TouchableOpacity 
            style={styles.signOutContainer}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <View style={styles.signOutContent}>
              <FontAwesome6 name="arrow-right-from-bracket" size={20} color="#FF2800" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 0.3,
    borderBottomColor: '#E5E7EB',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userInfoContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    borderWidth: 0.2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  viewProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 6.5,
    borderRadius: 15,
    backgroundColor: '#FF2800',
    alignSelf: 'flex-start',
  },
  viewProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  cardLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    fontFamily: 'Arial',
  },
  badge: {
    backgroundColor: '#FF2800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  signOutSection: {
    marginTop: 4,
  },
  signOutContainer: {
    marginTop: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: '#FFE5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF2800',
  },
});
