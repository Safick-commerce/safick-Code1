import { StyleSheet, Text, View, TouchableOpacity, TextInput } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

export default function SellerAnalytics() {
  const { t } = useLanguage();
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t("seller_analytics_title")}</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={filterQuery}
            onChangeText={setFilterQuery}
            placeholder={t("seller_analytics_search")}
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel={t("a11y_search_analytics")}
            accessibilityRole="search"
          />
        </View>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>{t("seller_analytics_period")}</Text>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color="#6B7280"
            style={styles.periodIcon}
          />
        </View>
        <View style={styles.kpiAndInsightRow}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>2.4K</Text>
              <Text style={styles.kpiLabel}>{t("profile_views")}</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>128</Text>
              <Text style={styles.kpiLabel}>{t("profile_leads")}</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>67</Text>
              <Text style={styles.kpiLabel}>{t("seller_analytics_kpi_clips")}</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>24</Text>
              <Text style={styles.kpiLabel}>{t("profile_sold")}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.insightButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t("a11y_open_insights")}
          >
            <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            <Text style={styles.insightButtonText}>{t("seller_analytics_insights")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.belowHeader}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t("seller_analytics_empty_title")}</Text>
          <Text style={styles.emptySubtitle}>{t("seller_analytics_empty_sub")}</Text>
          <TouchableOpacity
            style={styles.postButton}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("a11y_create_post")}
            onPress={() => router.push("/screens/products/create" as Href)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.postButtonText}>{t("common_post")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 18,
    borderBottomWidth: 6,
    borderBottomColor: "#D1D5DB",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  periodIcon: {
    marginTop: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000000",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#F9FAFB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    paddingVertical: 0,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6B7280",
  },
  kpiAndInsightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  kpiRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    minWidth: 0,
  },
  kpiItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.3,
  },
  kpiLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#374151",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  insightButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FF2800",
    gap: 6,
  },
  insightButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  belowHeader: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyState: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  postButton: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF2800",
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
});
