// PreHomeScreen.tsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { useContacts } from "@/context/ContactsContext";

const PreHomeScreen: React.FC = () => {
  const { loading } = useContacts();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Once contacts are loaded, navigate to the main HomeScreen.
      router.replace("/(tabs)/home");
    }
  }, [loading]);

  return (
    <View className="flex-1 bg-[#000033] items-center justify-center">
      <ActivityIndicator size="large" color="#0a7ea4" />
      <Image
        source={require("@/assets/images/logo.png")}
        className="w-72 h-72"
      />
    </View>
  );
};

export default PreHomeScreen;
