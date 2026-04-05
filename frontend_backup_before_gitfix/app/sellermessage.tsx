import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useState, useRef, useCallback } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const ROUTES = {
    USER_PROFILE: "/userprofile",
} as const;

export default function SellerMessage() {
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<ScrollView>(null);

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

    const handleSend = useCallback(() => {
        const trimmed = inputText.trim();
        if (!trimmed) return;
        setInputText('');
    }, [inputText]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <MaterialIcons name="keyboard-arrow-left" size={36} color="#1a1a1a" />
                </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={require('../assets/images/seller4.jpeg')}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                </View>
                <Text style={styles.profileName}>Brendastyle</Text>
                <Text style={styles.profileSubname}>brendastyle</Text>
                <TouchableOpacity style={styles.viewProfileButton} onPress={handleViewProfilePress}>
                    <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Message Area */}
            <ScrollView
                ref={scrollRef}
                style={styles.messageArea}
                contentContainerStyle={styles.messageListContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
                <TouchableOpacity style={styles.offerButton}>
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
            <Animated.View style={animatedKeyboardStyle} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
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
    // Profile Section
    profileSection: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 16,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    profileSubname: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 12,
    },
    viewProfileButton: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 20,
    },
    viewProfileText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Message Area
    messageArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    messageListContent: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    // Input Bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 19,
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
        marginBottom: 1,
    },
    messageInput: {
        flex: 1,
        minHeight: 30,
        maxHeight: 90,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        paddingTop: 4,
        fontSize: 15,
        backgroundColor: '#f5f5f5',
        marginBottom: 1,
    },
    inputIconButton: {
        padding: 8,
        marginBottom: 1,
    },
    sendButton: {
        padding: 8,
        marginBottom: 1,
    },
    sendButtonActive: {},
});