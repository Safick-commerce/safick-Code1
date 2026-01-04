## UX Improvements Branch
Work in progress: improving user flow and app experience.
# clipCart 🛒

A modern, feature-rich e-commerce mobile application built with React Native and Expo. clipCart combines shopping, live streaming, and social features to create an engaging shopping experience.

## ✨ Features

### 🏠 Home Feed
- **Discover Tab**: Explore trending products and content
- **For You Tab**: Personalized product recommendations
- **Following Tab**: See products from sellers you follow

### 🛍️ Shopping Experience
- **Product Categories**: Browse by category (Shoes, Women, Men, Kids, Accessories, Beauty, Home)
- **Search Functionality**: Quick search with real-time results
- **Shopping Cart**: Add items to cart and manage quantities
- **Wishlist**: Save favorite products for later
- **Product Details**: View detailed product information with images and variants

### 📺 Live Features
- **Live Streaming**: Watch live product showcases and demonstrations
- **Interactive Shopping**: Shop directly from live streams

### 💬 Social & Communication
- **Messages**: Chat with sellers and other users
- **Notifications**: Stay updated with order status and promotions
- **User Profiles**: Manage your profile and preferences

### 🎯 Seller Features
- **Sell Tab**: List and manage your products
- **Product Management**: Create and edit product listings

## 🛠️ Tech Stack

### Core Technologies
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.30) - Development platform and tooling
- **TypeScript** (5.9.2) - Type-safe JavaScript
- **Expo Router** (~6.0.21) - File-based routing system

### UI & Styling
- **NativeWind** (4.2.1) - Tailwind CSS for React Native
- **React Native Safe Area Context** - Handle device safe areas
- **Expo Vector Icons** - Icon library (Ionicons, MaterialCommunityIcons, AntDesign)

### State Management & Data
- **Zustand** (5.0.9) - Lightweight state management
- **AsyncStorage** - Local data persistence
- **React Hook Form** (7.69.0) - Form handling
- **Zod** (4.2.1) - Schema validation

### Additional Libraries
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch gesture handling
- **Expo Haptics** - Haptic feedback
- **Expo Image** - Optimized image component

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo CLI** (installed globally or via npx)
- **iOS Simulator** (for macOS) or **Android Studio** (for Android development)
- **Expo Go** app (optional, for testing on physical devices)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clipCart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

### Running on Different Platforms

- **iOS Simulator**: `npm run ios` or press `i` in the Expo CLI
- **Android Emulator**: `npm run android` or press `a` in the Expo CLI
- **Web Browser**: `npm run web` or press `w` in the Expo CLI
- **Expo Go App**: Scan the QR code with the Expo Go app on your device

## 📁 Project Structure

```
clipCart/
├── app/                    # Main application directory (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home feed (Discover/For You/Following)
│   │   ├── categories.tsx # Category browsing
│   │   ├── live.tsx       # Live streaming
│   │   ├── sell.tsx       # Seller dashboard
│   │   └── profile.tsx     # User profile
│   ├── cart.tsx           # Shopping cart
│   ├── wishlist.tsx       # Wishlist
│   ├── messages.tsx       # Messages
│   ├── notifications.tsx # Notifications
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── tabs/             # Tab-specific components
│   └── ui/                # UI components
├── stores/               # Zustand state stores
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # App constants
├── hooks/                # Custom React hooks
├── assets/               # Images, fonts, and other assets
└── app.json              # Expo configuration
```

## 🎨 Design System

### Colors
- **Primary**: `#FF2800` (Red accent)
- **Background**: `#FFFFFF` (White)
- **Text**: `#000000` (Black)
- **Secondary Text**: `rgba(0, 0, 0, 0.62)` (Gray)
- **Border**: `#E5E7EB` (Light gray)
- **Active State**: `#000000` (Black)

### Typography
- **Font Family**: Inter (primary)
- **Font Sizes**: 
  - Search Input: 16px
  - Filter Buttons: 14px
  - Content Text: 16px

### Icon Sizes
- **Search Bar Icons**: 22-24px
- **Header Action Buttons**: 28px
- **Tab Bar Icons**: 24px
- **Back Buttons**: 24px

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint to check code quality

## 🔧 Configuration

### Expo Configuration
The app is configured in `app.json` with:
- **Name**: clipCart
- **Version**: 1.0.0
- **Orientation**: Portrait
- **New Architecture**: Enabled
- **Typed Routes**: Enabled
- **React Compiler**: Enabled

### Environment Setup
Create a `.env` file in the root directory for environment variables (if needed):
```
API_URL=your_api_url
API_KEY=your_api_key
```

## 🧪 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add accessibility labels for screen readers

### Component Structure
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement proper loading and error states
- Follow the existing file-based routing structure

## 📦 Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

*Note: Requires Expo Application Services (EAS) account setup*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- Your Name/Team

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Icons from [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- Styling with [NativeWind](https://www.nativewind.dev/)

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Made with ❤️ using React Native and Expo**
