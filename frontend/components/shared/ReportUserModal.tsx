import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ReportUserModalProps = {
  visible: boolean;
  onClose: () => void;
  reasons: readonly string[];
  subjectLabel?: string;
  onSubmit?: (reason: string) => void | Promise<void>;
};

export function ReportUserModal({
  visible,
  onClose,
  reasons,
  subjectLabel = "this user",
  onSubmit,
}: ReportUserModalProps) {
  const handleSelect = (reason: string) => {
    void (async () => {
      try {
        if (onSubmit) {
          await onSubmit(reason);
        }
        onClose();
        Alert.alert(
          "Report submitted",
          `Thanks — we received your report about ${subjectLabel}. Our team will review it.`,
        );
      } catch (error) {
        Alert.alert(
          "Could not submit report",
          error instanceof Error ? error.message : "Please try again later.",
        );
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Report user</Text>
          <Text style={styles.subtitle}>Select a reason for reporting {subjectLabel}</Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.row}
                onPress={() => handleSelect(reason)}
                accessibilityRole="button"
              >
                <Text style={styles.rowLabel}>{reason}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    paddingRight: 8,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});
