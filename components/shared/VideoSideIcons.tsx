import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, FontAwesome, Fontisto, FontAwesome6 } from "@expo/vector-icons";

interface VideoSideIconsProps {
  containerStyle?: object;
  showProfileIcon?: boolean;
}

export default function VideoSideIcons({ containerStyle, showProfileIcon = false }: VideoSideIconsProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {showProfileIcon && (
        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={28} color="#000000" />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.iconButton}>
        <FontAwesome name="heart" size={28} color="#000000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="bookmark" size={28} color="#000000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Fontisto name="share-a" size={28} color="#000000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Fontisto name="applemusic" size={24} color="#000000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: '76%',
    transform: [{ translateY: -145 }],
    alignItems: 'center',
    gap: 55,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
