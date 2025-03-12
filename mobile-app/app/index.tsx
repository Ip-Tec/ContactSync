import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import RequestPermissions from "@/components/RequestPermissions"; // adjust the import path if needed
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Optionally, you can show a loading indicator here
  }

  return (
    <>
      {/* Request required permissions */}
      <RequestPermissions />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          {/* Redirect based on authentication status */}
          {session ? (
            <Redirect href="/(screens)/PreHomeScreen" />
          ) : (
            <Redirect href="/auth/login" />
          )}
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}
