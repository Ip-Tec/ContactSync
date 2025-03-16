import React, { useRef, useState, useCallback } from "react";
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
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useToast } from "react-native-toast-notifications";
import AccountSettingsBottomSheet from "@/components/ui/AccountSettingsBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";

const ProfileScreen = () => {
  const toast = useToast();
  const {
    signOut,
    session,
    resetPassword,
    changeEmail,
    changePhoneNumber,
    deleteAccount,
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

  const mergeDuplicates = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      const msg = `Auto Merge:Automatically merged duplicates from ${data.length} contacts.`;
      toast.show(msg, {
        type: "info",
      });
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
    bottomSheetRef.current?.snapToIndex(1); // Opens the sheet at the 50% snap point
  }, []);

  const closeAccountSettings = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(-1); // Hides the sheet
  }, []);

  // Handlers for account settings actions
  const handleChangeEmail = () => {
    console.log("Change Email triggered");
    // Call your context changeEmail method here...
    closeAccountSettings();
  };

  const handleChangePhoneNumber = () => {
    console.log("Change Phone Number triggered");
    // Call your context changePhoneNumber method here...
    closeAccountSettings();
  };

  const handleChangePassword = () => {
    console.log("Change Password triggered");
    // For instance, you might show the reset password modal
    closeAccountSettings();
    // setIsResetPasswordModalVisible(true); // if you want to show the modal
  };

  const handleDeleteAccount = () => {
    console.log("Delete Account triggered");
    // Call your context deleteAccount method here...
    closeAccountSettings();
  };

  return (
    <ParallaxScrollView
      headerImage={
        <Image
          source={require("@/assets/images/icon.png")}
          className="h-full w-full"
        />
      }
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
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
            onValueChange={() =>
              setIsDarkTheme((previousState) => !previousState)
            }
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkTheme ? "#000033" : "#f4f3f4"}
          />
        </View>

        {/* Navigation Button to Form Screen */}
        <TouchableOpacity
          onPress={handleOpenSettingsForm}
          className="bg-blue-500 py-4 rounded-lg items-center mt-4"
        >
          <Text className="text-white font-bold text-lg">
            Open Settings Form
          </Text>
        </TouchableOpacity>

        {/* Account Information */}
        <ThemedView className="mb-8">
          <ThemedText type="subtitle" className="mb-2">
            Account Information
          </ThemedText>
          <ThemedText>Email: {session?.user?.email}</ThemedText>
          <ThemedText>
            User ID: {session?.user?.id.substring(0, 8)}...
          </ThemedText>
          <ThemedText>Phone: {session?.user?.phone}</ThemedText>
        </ThemedView>

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

        {/* Notifications Settings */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">
              Enable Notifications
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
            Enable notifications to receive updates and alerts.
          </Text>
        </View>

        {/* Account Settings Button */}
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
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-red-600">Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* In-App Help & Support */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <TouchableOpacity
            onPress={() => Linking.openURL("https://wa.me/2348084392327")}
            className="px-4 py-3 border-b border-gray-300"
          >
            <Text className="text-blue-600">In-App Help & Support</Text>
          </TouchableOpacity>
        </View>

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
        </View>

        {/* About Section */}
        <ThemedView className="mb-8">
          <ThemedText type="subtitle">About</ThemedText>
          <TouchableOpacity onPress={() => console.log("App Version")}>
            <Text>App Version</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Terms & Conditions")}>
            <Text>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Privacy Policy")}>
            <Text>Privacy Policy</Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Reset Password Button */}

        {/* Log Out Button */}
        <TouchableOpacity
          onPress={signOut}
          className="bg-red-500 py-4 rounded-lg items-center mt-4"
        >
          <Text className="text-white font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
      </ThemedView>

      {isAccountSettingsVisible && (
        <AccountSettingsBottomSheet
          ref={bottomSheetRef}
          onChangeEmail={handleChangeEmail}
          onChangePhoneNumber={handleChangePhoneNumber}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Reset Password Modal */}
      <Modal
        visible={isResetPasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsResetPasswordModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-gray-800 bg-opacity-50">
          <View className="bg-white rounded-lg p-6 w-80">
            <Text className="text-xl font-bold mb-4">Reset Password</Text>
            <TextInput
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              className="border-b border-gray-300 mb-4 p-2"
            />
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              className="border-b border-gray-300 mb-4 p-2"
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="border-b border-gray-300 mb-4 p-2"
            />
            <TouchableOpacity
              onPress={handlePasswordReset}
              className="bg-green-500 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold">Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsResetPasswordModalVisible(false)}
              className="mt-4"
            >
              <Text className="text-gray-500 text-sm text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
};

export default ProfileScreen;
