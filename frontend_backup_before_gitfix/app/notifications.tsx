import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={30} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Activity</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="options-outline" size={30} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Filter Containers */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "All" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("All")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "All" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "Sellers" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("Sellers")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "Sellers" && styles.filterTextActive,
            ]}
          >
            Sellers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "Important" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("Important")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "Important" && styles.filterTextActive,
            ]}
          >
            Important
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text}>
          All notifications will appear here in this tab
        </Text>
      </View>
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
  },
  backButton: {
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 12,
  },
  menuButton: {
    marginRight: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#000000',
    marginTop: 2,
    textAlign: 'left',
    paddingHorizontal: 32,
    fontSize: 18,
    fontWeight: 'semibold',
    fontFamily: 'Inter',
  },
})