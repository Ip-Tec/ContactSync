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
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/context/AuthContext";
import { ActivityIndicator, View, Image } from "react-native";
import { ContactsProvider } from "@/context/ContactsContext";
import { CartProvider } from "@/context/CartContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "react-native-toast-notifications";
import CartBadge from "@/components/cart/CartBadge"; // We'll create this component

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
    <ToastProvider>
      <AuthProvider>
        <ContactsProvider>
          <CartProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <BottomSheetModalProvider>
                {/* <Toast /> */}
                <CartBadge />
                <RootLayoutNav />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </CartProvider>
        </ContactsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
