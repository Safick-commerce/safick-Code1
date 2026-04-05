import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ImageSourcePropType } from "react-native";

// Wishlist item — a saved product the user is interested in
export interface WishlistItemData {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: ImageSourcePropType;
  sellerName?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItemData[];
  addToWishlist: (item: WishlistItemData) => void; // Add to wishlist  "void" just means that no data is returned from the function
  removeFromWishlist: (id: string) => void; // Remove from wishlist
  toggleWishlist: (item: WishlistItemData) => void;
  isSaved: (id: string) => boolean; // Check if item is saved
  clearWishlist: () => void; // Clear wishlist
  getWishlistCount: () => number; // Get wishlist count
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItemData[]>([]); // Initialize wishlist as an empty array

  const addToWishlist = useCallback((item: WishlistItemData) => {
    setWishlistItems((prev) => {
      // Don't add duplicates
      if (prev.some((existing) => existing.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleWishlist = useCallback((item: WishlistItemData) => {
    setWishlistItems((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) {
        return prev.filter((existing) => existing.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const isSaved = useCallback(
    (id: string) => wishlistItems.some((item) => item.id === id),
    [wishlistItems]
  );

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
  }, []);

  const getWishlistCount = useCallback(() => {
    return wishlistItems.length;
  }, [wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isSaved,
        clearWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// Custom hook for easy access
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
