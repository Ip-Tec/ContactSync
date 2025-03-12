import React, { useEffect, useState } from "react";
import { Switch, TouchableOpacity, View, Alert, Text, Image } from "react-native";
import * as Contacts from "expo-contacts";
import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ParallaxScrollView from "@/components/ParallaxScrollView";

const ProfileScreen = () => {
  const { signOut, session } = useAuth();
  const [autoMerge, setAutoMerge] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

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
    <ParallaxScrollView
      headerImage={<Image source={require("@/assets/images/icon.png")} className="h-full w-full"/>}
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <ThemedView className="flex-1 mt-0 bg-white px-4">
        {/* Profile Header */}
        <ThemedView className="items-center mb-8">
        <IconSymbol size={80} name="person.circle.fill" color="#0a7ea4" />
        <ThemedText type="title" className="mt-0 text-sm">
          {session?.user?.email?.toUpperCase()}
        </ThemedText>
      </ThemedView>

      {/* Theme Switch */}
      <View className="flex-row items-center justify-between mb-4">
        <ThemedText className="text-lg">Dark Theme</ThemedText>
        <Switch
          value={isDarkTheme}
          onValueChange={() => setIsDarkTheme(previousState => !previousState)}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isDarkTheme ? "#000033" : "#f4f3f4"}
        />
      </View>

      {/* Account Information */}
      <ThemedView className="mb-8">
        <ThemedText type="subtitle" className="mb-2">
          Account Information
        </ThemedText>
        <ThemedText>Email: {session?.user?.email}</ThemedText>
        <ThemedText>User ID: {session?.user?.id.substring(0, 8)}...</ThemedText>
        <ThemedText>Phone: {session?.user?.phone}</ThemedText>
        {/* <ThemedText>Balance: {session?.user?.balance}</ThemedText> */}
      </ThemedView>

      {/* Auto Merge Duplicates Toggle with Description #000033 */}
      <View className="mb-8 bg-gray-200 rounded-lg">
        <View className="flex-row items-center justify-between border-b border-gray-300  px-4 py-3">
          <ThemedText className="text-lg text-gray-800">
            Auto Merge Duplicates
          </ThemedText>
          <Switch
            value={autoMerge}
            onValueChange={setAutoMerge}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={autoMerge ? "#000033" : "#f4f3f4"}
          />
        </View>
        <Text className="text-sm mt-1 p-2 mx-2 text-bold text-gray-500">
          When enabled, duplicate contacts will be merged automatically.
        </Text>
      </View>

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
    </ParallaxScrollView>
  );
};

export default ProfileScreen;
