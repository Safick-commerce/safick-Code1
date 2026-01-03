import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FollowingTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.contentText}>
        Following content will go here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontSize: 18,
    fontWeight: 'semibold',
    fontFamily: 'Inter',
  },
});

