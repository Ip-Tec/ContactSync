import React, { useState } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  Image,
  View,
  Text,
  TextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IconSymbol } from "@/components/ui/IconSymbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        console.error("Login error:", error);
      } else {
        router.replace("/(screens)/PreHomeScreen");
      }
    } catch (e) {
      setError("An unexpected error occurred");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 justify-center items-center">
      <View className="flex justify-center h-auto items-center">
        <Image
          source={require("@/assets/images/logo.png")}
          className="w-32 h-32 rounded-full"
          resizeMode="contain"
        />
      </View>

      <Text className="mb-8 text-4xl font-bold">Welcome Back</Text>

      <View className="w-full max-w-xl space-y-4">
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className={`p-4 rounded-lg text-base my-3 mb-4 ${
            colorScheme === "dark"
              ? "text-white bg-gray-800"
              : "text-black bg-gray-200"
          }`}
          placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
        />

        {/* Password input with eye toggle */}
        <View
          className={`flex-row items-center px-4 py-2 rounded-lg my-4 ${
            colorScheme === "dark" ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            className={`flex-1 p-0 ${
              colorScheme === "dark" ? "text-white" : "text-black"
            }`}
            placeholderTextColor={colorScheme === "dark" ? "#999" : "#666"}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
          >
            <MaterialIcons
              name={showPassword ? "password" : "remove-red-eye"}
              size={24}
              color="#0a7ea4"
            />
          </TouchableOpacity>
        </View>

        {error && <Text className="text-red-500 text-center">{error}</Text>}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-blue-500 p-4 rounded-lg items-center mt-2"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Log In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-5">
          <Text>Don't have an account? </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
