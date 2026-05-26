import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FeedProductCard from "../../../components/shared/FeedProductCard";
import { ProductGridSkeleton } from "../../../components/shared/ProductGridSkeleton";
import { useAuth } from "../../../context/AuthContext";
import { getMyProducts } from "../../../utils/productApi";
import type { StoreProduct } from "../../../types/storeProduct";

export default function MyProductsScreen() {
  const router = useRouter();
  const { isAuthenticated, isReady: authReady } = useAuth();
  const [items, setItems] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await getMyProducts();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!authReady || !isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void load();
    }, [authReady, isAuthenticated, load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <ProductGridSkeleton />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Sign in to see your products.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      {loading && items.length === 0 ? (
        <ProductGridSkeleton />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={items.length > 0 ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF2800" />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>You have not listed any products yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <FeedProductCard
                product={item}
                onPress={() =>
                  router.push({ pathname: "/productDetails", params: { id: item.id } })
                }
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    maxWidth: "50%",
    paddingHorizontal: 6,
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 48,
    fontSize: 15,
  },
  muted: {
    color: "#6B7280",
    fontSize: 15,
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "center",
  },
});
