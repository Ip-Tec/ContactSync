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
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View, Image } from "react-native";
import { ContactsProvider } from "@/context/ContactsContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth check component to control navigation
function RootLayoutNav() {
  const { loading, session } = useAuth();
  const colorScheme = useColorScheme();

  if (loading) {
    return (
      <View className="flex-1 bg-[#000033] items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Image
          source={require("@/assets/images/logo.png")}
          className="w-72 h-72"
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="auth" />
        )}
      </Stack>
    </ThemeProvider>
  );
}

// Main layout wrapper with auth provider
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
    <AuthProvider>
      <ContactsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <RootLayoutNav />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ContactsProvider>
    </AuthProvider>
  );
}
