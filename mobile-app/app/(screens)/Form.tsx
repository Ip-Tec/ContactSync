// FormScreen.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SettingsForm } from "@/components/form/SettingsForm";


const FormScreen = () => {
  // Retrieve the action parameter from the route
  const { action } = useLocalSearchParams<{ action?: string }>();

  return (
    <View className="flex-1 mx-auto w-full bg-gray-50 py-6">
      <SettingsForm initialAction={action} />
    </View>
  );
};


export default FormScreen;
