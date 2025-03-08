import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Optionally, you can show a loading indicator here
  }

  // Redirect to the appropriate route based on session status
  return session ? <Redirect href="/(tabs)/home" /> : <Redirect href="/auth/login" />;
}
