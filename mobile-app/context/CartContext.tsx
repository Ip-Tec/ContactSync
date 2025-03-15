import React, { createContext, useContext, useState } from "react";
import { Contact as ExpoContact } from "expo-contacts";
import { useToast } from "react-native-toast-notifications";



// Define our own CartItem interface without extending expo's Contact
interface CartItem {
  id: string;
  contact: any; // The original contact object
  phoneNumbers: (string | undefined)[];
  emails: string[];
  dob?: string | Date;
  country?: string;
  countryCode?: string;
  sex?: string;
  contactType?: string;
}
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
}
const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();

  const addToCart = (item: CartItem) => {
    // Check if contact already exists in the cart
    const exists = cart.some((cartItem) => cartItem.id === item.id);

    if (exists) {
      toast.show("Info: This contact is already in your cart.", {
        type: "info",
      });
      return;
    }

    setCart((prev) => [...prev, item]);

    toast.show("Success: Contact Added successfully added to your cart.", {
      type: "success",
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
