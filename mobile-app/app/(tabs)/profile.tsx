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

  const [allowContactAccess, setAllowContactAccess] = useState<boolean>(false);

  const handlePermissionToggle = async (value: boolean) => {
    const result = await toggleContactsPermission();
    setAllowContactAccess(result);

    // Add visual feedback
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
            Need assistance with your account or have questions about our app?
            We're here to help! Our dedicated support team is available to
            provide you with personalized support via WhatsApp.
          </Text>
          <Text className="text-sm mt-1 p-2 mx-2 text-gray-500">
            Tap the button above to start a chat with our support team. We'll
            respond promptly to assist you with any issues or questions you may
            have.
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

        {/* About Section */}
        <View className="mb-8 bg-gray-200 rounded-lg">
          <View className="flex-row items-center justify-between border-b border-gray-300 px-4 py-3">
            <ThemedText className="text-lg text-gray-800">About</ThemedText>
          </View>
          <Text className="text-sm mt-1 p-2 mx-2 text-bold text-gray-500">
            Learn more about our app and its features.
          </Text>
          <View className="px-4 py-3 border-y border-gray-300">
            <Text className="text-gray-800">
              App Version: {Constants.nativeAppVersion}
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
