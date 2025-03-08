import React, { useEffect, useState } from "react";
import { Switch, TouchableOpacity, View, Alert, Text } from "react-native";
import * as Contacts from "expo-contacts";
import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function ProfileScreen() {
  const { signOut, session } = useAuth();
  const [autoMerge, setAutoMerge] = useState(false);

  // Dummy function for auto merging duplicates
  const mergeDuplicates = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      // Add your merge logic here. This is just a placeholder.
      Alert.alert(
        "Auto Merge",
        `Automatically merged duplicates from ${data.length} contacts.`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to merge duplicates.");
    }
  };

  useEffect(() => {
    if (autoMerge) {
      mergeDuplicates();
    }
  }, [autoMerge]);

  return (
    <ThemedView className="flex-1 bg-white p-4">
      {/* Profile Header */}
      <ThemedView className="items-center my-8">
        <IconSymbol size={80} name="person.circle.fill" color="#0a7ea4" />
        <ThemedText type="title" className="mt-4">
          {session?.user?.email}
        </ThemedText>
      </ThemedView>

      {/* Account Information */}
      <ThemedView className="mb-8">
        <ThemedText type="subtitle" className="mb-2">
          Account Information
        </ThemedText>
        <ThemedText>Email: {session?.user?.email}</ThemedText>
        <ThemedText>User ID: {session?.user?.id.substring(0, 8)}...</ThemedText>
      </ThemedView>

      {/* Auto Merge Duplicates Toggle with Description */}
      <ThemedView className="mb-8 bg-gray-500 rounded-lg">
        <View className="flex-row items-center justify-between  px-4 py-3">
          <ThemedText className="text-lg text-gray-800">
            Auto Merge Duplicates
          </ThemedText>
          <Switch
            value={autoMerge}
            onValueChange={setAutoMerge}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={autoMerge ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
        <Text className="text-sm mt-1">
          When enabled, duplicate contacts will be merged automatically.
        </Text>
      </ThemedView>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={signOut}
        className="bg-red-500 py-4 rounded-lg items-center mt-auto"
      >
        <Text className="text-white font-bold text-lg">
          Log Out
        </Text>
      </TouchableOpacity>
    </ThemedView>
  );
}
