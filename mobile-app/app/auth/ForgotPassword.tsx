// ForgotPasswordScreen.tsx
import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  Image,
  View,
  Text,
  TextInput,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ForgotPasswordScreen() {
  // State for the forgot password form
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the reset password form
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const { forgotPassword, resetPassword } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";

  // Listen for deep links to capture the reset token
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path, queryParams } = Linking.parse(url);
      if (path === "reset-password" && queryParams?.token) {
        setResetToken(queryParams.token as string);
      }
    };

    // Listen for deep link events
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if the app was launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  // Handler for sending the reset email
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Ensure you pass the correct redirect URL so the email contains a deep link (e.g., "myapp://reset-password")
      const error = await forgotPassword(email);
      if (error) {
        setError(error.message);
      } else {
        Alert.alert(
          "Success",
          "Password reset email sent! Please check your inbox."
        );
        // Optionally clear the form or navigate elsewhere.
      }
    } catch (e) {
      setError("An unexpected error occurred");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handler for resetting the password using the token
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setResetError("Please fill in both password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      // Call your resetPassword function with the new password and token
      const error = await resetPassword(newPassword, resetToken!);
      if (error) {
        setResetError(error.message);
      } else {
        Alert.alert("Success", "Your password has been reset successfully!");
        router.replace("/auth/login");
      }
    } catch (e) {
      setResetError("An unexpected error occurred");
      console.error(e);
    } finally {
      setResetLoading(false);
    }
  };

  // If a reset token is detected, show the Reset Password UI
  if (resetToken) {
    return (
      <View className="flex-1 p-5 justify-center items-center">
        <Text className="mb-8 text-4xl font-bold">Reset Password</Text>
        <View className="w-full max-w-xl space-y-4">
          <TextInput
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            className={`p-4 rounded-lg text-base ${
              colorScheme === "dark"
                ? "text-white bg-gray-800"
                : "text-black bg-gray-200"
            }`}
            placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
          />
          <TextInput
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className={`p-4 rounded-lg text-base ${
              colorScheme === "dark"
                ? "text-white bg-gray-800"
                : "text-black bg-gray-200"
            }`}
            placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
          />
          {resetError && (
            <Text className="text-red-500 text-center">{resetError}</Text>
          )}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={resetLoading}
            className="bg-blue-500 p-4 rounded-lg items-center mt-2"
          >
            {resetLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Otherwise, show the Forgot Password UI
  return (
    <View className="flex-1 p-5 justify-center items-center">
      <View className="flex justify-center h-auto items-center">
        <Image
          source={require("@/assets/images/logo.png")}
          className="w-32 h-32 rounded-full"
          resizeMode="contain"
        />
      </View>

      <Text className="mb-8 text-4xl font-bold">Forgot Password</Text>

      <View className="w-full max-w-xl space-y-4">
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className={`p-4 rounded-lg text-base ${
            colorScheme === "dark"
              ? "text-white bg-gray-800"
              : "text-black bg-gray-200"
          }`}
          placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
        />
        {error && <Text className="text-red-500 text-center">{error}</Text>}
        <TouchableOpacity
          onPress={handleForgotPassword}
          disabled={loading}
          className="bg-blue-500 p-4 rounded-lg items-center mt-2"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Reset Password
            </Text>
          )}
        </TouchableOpacity>
        <View className="flex-row justify-center mt-5">
          <Text>Remembered your password? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500">Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
