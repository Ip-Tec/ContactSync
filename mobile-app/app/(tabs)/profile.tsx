import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Switch,
  TouchableOpacity,
  View,
  Alert,
  Text,
  Image,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useAuth } from "@/context/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useToast } from "react-native-toast-notifications";
import AccountSettingsBottomSheet from "@/components/ui/AccountSettingsBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import Constants from "expo-constants";
import { toggleContactsPermission } from "@/components/RequestPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = () => {
  const toast = useToast();
  const {
    signOut,
    session,
    resetPassword,
    changeEmail,
    changePhoneNumber,
    deleteAccount,
    ads,
  } = useAuth();
  const [autoMerge, setAutoMerge] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] =
    useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useState<boolean>(false);

  const [allowContactAccess, setAllowContactAccess] = useState<boolean>(false);
  const [clearCacheSwitch, setClearCacheSwitch] = useState(false);
  const [cacheSize, setCacheSize] = useState("Calculating...");

  const adsList = ads || [];
  const profileAd = adsList.find((ad) => ad.pricing_type === "discover");

  // Helper function to format bytes into KB, MB or GB
  const formatCacheSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  // Calculate total cache size by summing all stored string lengths
  const calculateCacheSize = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      let totalBytes = 0;
      stores.forEach(([_, value]) => {
        if (value) {
          // Using string length as an approximation for bytes
          totalBytes += value.length;
        }
      });
      setCacheSize(formatCacheSize(totalBytes));
    } catch (error) {
      setCacheSize("Error");
    }
  };

  // Update cache size on mount and after clearing cache
  useEffect(() => {
    calculateCacheSize();
  }, []);

  const handlePermissionToggle = async (value: boolean) => {
    const result = await toggleContactsPermission();
    setAllowContactAccess(result);

    if (result) {
      toast.show("Contacts access enabled", { type: "success" });
    } else {
      toast.show("Contacts access disabled", { type: "warning" });
    }
  };

  useEffect(() => {
    const checkInitialPermission = async () => {
      const { status } = await Contacts.getPermissionsAsync();
      setAllowContactAccess(status === "granted");
    };
    checkInitialPermission();
  }, []);

  const mergeDuplicates = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      const msg = `Auto Merge: Automatically merged duplicates from ${data.length} contacts.`;
      toast.show(msg, { type: "info" });
    } catch (error) {
      toast.show("Error: Failed to merge duplicates.", { type: "error" });
    }
  };

  const handleOpenSettingsForm = () => {
    router.push("/Form");
  };

  const handlePasswordReset = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.show("Error: Please fill out all fields.", { type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.show("Error: New password and confirm password do not match.", {
        type: "error",
      });
      return;
    }

    try {
      await resetPassword(currentPassword, newPassword);
      toast.show("Success: Password reset successfully.", { type: "success" });
      setIsResetPasswordModalVisible(false);
    } catch (error) {
      toast.show("Error: Failed to reset password. Please try again.", {
        type: "error",
      });
    }
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);

  const openAccountSettings = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const closeAccountSettings = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(-1);
  }, []);

  const handleChangeEmail = () => {
    console.log("Change Email triggered");
    closeAccountSettings();
  };

  const handleChangePhoneNumber = () => {
    console.log("Change Phone Number triggered");
    closeAccountSettings();
  };

  const handleChangePassword = () => {
    console.log("Change Password triggered");
    closeAccountSettings();
  };

  const handleDeleteAccount = () => {
    console.log("Delete Account triggered");
    closeAccountSettings();
  };

  // Clear cache handler
  const handleClearCacheSwitch = async (value: boolean) => {
    setClearCacheSwitch(value);
    if (value) {
      try {
        await AsyncStorage.clear();
        toast.show("Cache cleared successfully", { type: "success" });
        // After clearing, update the cache size
        calculateCacheSize();
      } catch (error) {
        toast.show("Error clearing cache", { type: "error" });
      }
      // Reset the switch after action
      setClearCacheSwitch(false);
    }
  };

  return (
    <ParallaxScrollView
      headerImage={
        <TouchableOpacity
          onPress={() =>
            profileAd && Linking.openURL(profileAd.redirect_url || "")
          }
        >
          <Image
            source={
              profileAd
                ? { uri: profileAd.media_url }
                : require("@/assets/images/icon.png")
            }
            className="h-full w-full"
          />
        </TouchableOpacity>
      }
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
    >
      <View className="flex-1 mt-0 bg-white p-4">
        {/* Account Information */}
        <View className="mb-8 bg-gray-200 rounded-lg p-2">
          <View className="flex-col items-center justify-between border-b border-gray-300 px-4 py-3">
            <Text className="text-lg text-gray-800 text-justify w-full">
              Account Information
            </Text>
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-bold border-b border-gray-300 text-gray-500">
            Your personal account information is displayed below. This includes
            your email address, unique user ID, and phone number. You can use
            this information to manage your account settings and preferences.
          </Text>
          <Text className="px-4 py-3 border-b border-gray-300 text-gray-800">
            Email: {session?.user?.email}
          </Text>
          <Text className="px-4 py-3 border-b border-gray-300 text-gray-800">
            User ID: <Text className="text-gray-600">{session?.user?.id}</Text>
          </Text>
          <Text className="px-4 py-3 text-gray-800">
            Phone: {session?.user?.phone}
          </Text>
        </View>

        {/* Auto Merge Duplicates Toggle */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
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

        {/* In-App Help & Support */}
        <TouchableOpacity
          onPress={() => Linking.openURL("https://wa.me/2348084392327")}
          className="mb-8 bg-gray-200 rounded-lg border border-blue-600"
        >
          <View className="px-4 py-3">
            <Text className="text-lg text-blue-600">In-App Help & Support</Text>
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-gray-500">
            Need assistance? Tap the button above to start a chat with our
            support team.
          </Text>
        </TouchableOpacity>

        {/* Security Settings */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">
              Enable Two-Factor Authentication
            </ThemedText>
            <Switch
              value={isNotificationEnabled}
              onValueChange={() =>
                setIsNotificationEnabled((prevState) => !prevState)
              }
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isNotificationEnabled ? "#000033" : "#f4f3f4"}
            />
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-bold text-gray-500">
            Add an extra layer of security to your account with 2FA.
          </Text>
        </View>

        {/* Privacy Settings */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">
              Manage Privacy
            </ThemedText>
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-bold text-gray-500">
            Adjust your privacy settings to control data sharing and visibility.
          </Text>
          <View className="flex-row items-center justify-between px-4 py-3">
            <ThemedText className="text-sm text-gray-600">
              Allow access to contacts
            </ThemedText>
            <Switch
              value={allowContactAccess}
              onValueChange={async (value) => {
                handlePermissionToggle(value);
                if (!value) {
                  setAllowContactAccess(false);
                  Alert.alert(
                    "Warning",
                    "If you do not grant access to contacts, you will not be able to add contacts to your account and most features will be disabled.",
                    [
                      {
                        text: "Access Contacts",
                        style: "default",
                      },
                    ],
                    {
                      cancelable: true,
                      onDismiss: async () => {
                        setAllowContactAccess(value);
                      },
                    }
                  );
                }
              }}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Form",
                params: { action: "accountSettings" },
              })
            }
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-gray-800">Account Settings</Text>
          </TouchableOpacity>
          <Text className="text-sm mt-1 p-2 mx-2 text-bold text-gray-500">
            Update your email, phone number, password, or delete your account.
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Form",
                params: { action: "changeEmail" },
              })
            }
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-gray-800">Change Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Form",
                params: { action: "changePhoneNumber" },
              })
            }
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-gray-800">Change Phone Number</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Form",
                params: { action: "resetPassword" },
              })
            }
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-gray-800">Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Form",
                params: { action: "deleteAccount" },
              })
            }
            className="px-4 py-3 bg-red-50"
          >
            <Text className="text-red-600">Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Cache Management */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <Text className="text-lg text-gray-800">Cache Management</Text>
            <Switch
              value={clearCacheSwitch}
              onValueChange={handleClearCacheSwitch}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={clearCacheSwitch ? "#000033" : "#f4f3f4"}
            />
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-gray-500">
            Toggle the switch to clear cached data.
          </Text>
          <Text className="text-xs mt-1 p-2 mx-2 text-gray-500">
            Current cache size: {cacheSize}
          </Text>
        </View>

        {/* About Section */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">About</ThemedText>
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-gray-500">
            Learn more about our app and its features.
          </Text>
          <View className="px-4 py-3 border-y border-gray-300">
            <Text className="text-gray-800">
              App Version:{" "}
              {Constants.nativeAppVersion &&
              Constants.nativeAppVersion.trim().length > 0
                ? Constants.nativeAppVersion
                : "Not Available"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => console.log("Terms & Conditions")}
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-gray-800">Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log("Privacy Policy")}
            className="px-4 py-3"
          >
            <Text className="text-gray-800">Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Advertised with us */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">
              Advertised with us
            </ThemedText>
          </View>
          <Text className="text-base mt-1 p-2 mx-2 font-medium text-gray-500">
            Get your business in front of thousands of potential customers.
            Showcase your products or services with a custom ad that highlights
            what makes your business unique.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/AdSubmissionScreen")}
            className="px-4 py-3 bg-blue-500"
          >
            <Text className="text-gray-200 text-center w-full">
              Add Business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          onPress={signOut}
          className="bg-red-500 py-4 rounded-lg items-center mt-4"
        >
          <Text className="text-red-50 font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
      </View>

      {isAccountSettingsVisible && (
        <AccountSettingsBottomSheet
          ref={bottomSheetRef}
          onChangeEmail={handleChangeEmail}
          onChangePhoneNumber={handleChangePhoneNumber}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </ParallaxScrollView>
  );
};

export default ProfileScreen;
