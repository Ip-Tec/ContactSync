import React, { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import { AuthProvider } from "@/context/AuthContext";
import { ContactsProvider } from "@/context/ContactsContext";
import { CartProvider } from "@/context/CartContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ToastProvider } from "react-native-toast-notifications";
import CartBadge from "@/components/cart/CartBadge"; // We'll create this component
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth check component to control navigation
function RootLayoutNav() {
  // Your auth logic here...
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}

// Main layout wrapper with providers
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (

    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <AuthProvider>
          <ContactsProvider>
            <CartProvider>
              <BottomSheetModalProvider>
                {/* <Toast /> */}
                <CartBadge />
                <RootLayoutNav />
              </BottomSheetModalProvider>
            </CartProvider>
          </ContactsProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
