// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

// Cart types
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variantId?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  shippingAddress?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

// Live/Seller types
export interface LivePost {
  id: string;
  sellerName: string;
  imageUrl: string | number; // Supports both URI strings and local require() numbers
  description: string;
  isLive?: boolean;
  viewerCount?: number;
  category?: string;
}

export type CategoryFilter = "All" | "Shoes" | "Women" | "Men" | "Kids" | "Accessories" | "Beauty" | "Home";

