// SettingsForm.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
} from "react-native";
import { FormComponent } from "./FormComponent";
import { useAuth } from "@/context/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

type SettingsAction =
  | "resetPassword"
  | "changeEmail"
  | "changePhoneNumber"
  | "deleteAccount"
  | "accountSettings";

interface SettingsFormProps {
  initialAction?: string;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialAction,
}) => {
  const { resetPassword, changeEmail, changePhoneNumber, deleteAccount } =
    useAuth();
  const [selectedAction, setSelectedAction] = useState<SettingsAction>(
    (initialAction as SettingsAction) || "resetPassword"
  );
  const router = useRouter();

  useEffect(() => {
    if (initialAction) {
      setSelectedAction(initialAction as SettingsAction);
    }
  }, [initialAction]);

  const renderForm = () => {
    switch (selectedAction) {
      case "resetPassword":
        return (
          <FormComponent
            title="Reset Password"
            description="Enter your current password and new password to reset your
              password."
            fields={[
              {
                name: "currentPassword",
                placeholder: "Current Password",
                secure: true,
              },
              {
                name: "newPassword",
                placeholder: "New Password",
                secure: true,
              },
              {
                name: "confirmPassword",
                placeholder: "Confirm New Password",
                secure: true,
              },
            ]}
            submitButtonText="Reset Password"
            onSubmit={(values) => {
              if (values.newPassword !== values.confirmPassword) {
                Alert.alert(
                  "Error",
                  "New password and confirm password do not match."
                );
                return;
              }
              resetPassword(values.currentPassword, values.newPassword);
            }}
          />
        );
      case "changeEmail":
        return (
          <FormComponent
            title="Change Email"
            description="Enter your new email address to change your email."
            fields={[{ name: "newEmail", placeholder: "New Email" }]}
            submitButtonText="Change Email"
            onSubmit={(values) => changeEmail(values.newEmail)}
          />
        );
      case "changePhoneNumber":
        return (
          <FormComponent
            title="Change Phone Number"
            description="Enter your new phone number to change your phone number."
            fields={[
              { name: "newPhoneNumber", placeholder: "New Phone Number" },
            ]}
            submitButtonText="Change Phone Number"
            onSubmit={(values) => changePhoneNumber(values.newPhoneNumber)}
          />
        );
      case "deleteAccount":
        return (
          <View className="w-full mx-auto bg-white p-4 rounded-lg shadow-md">
            <Text className="text-xl font-bold mb-4">Delete Account</Text>
            <Text className="text-sm text-gray-600 mb-4">
              This action will delete your account and all associated data.
            </Text>
            <TouchableOpacity
              className="bg-red-500 p-3 mt-6 rounded-lg w-full items-center"
              onPress={() => {
                Alert.alert(
                  "Confirm Deletion",
                  "Are you sure you want to delete your account? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteAccount(),
                    },
                  ]
                );
              }}
            >
              <Text className="text-white font-bold">Delete Account</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 p-4">
      {/* Back Header */}
      <View className="h-12 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-500 p-2 rounded-full"
        >
          <MaterialIcons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <Animated.View
        className="mx-auto w-full bg-gray-300 h-auto overflow-hidden rounded-full"
        style={{
          width: 180,
          height: 180,
          transform: [{ translateY: 0 }],
        }}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          className="w-full h-full mb-4"
        />
      </Animated.View>
      {/* Centered Form Card */}
      <View className="justify-center items-center p-2">
        {renderForm()}
      </View>
    </View>
  );
};
