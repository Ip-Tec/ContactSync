import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import RequestPermissions from "@/components/RequestPermissions"; // adjust the import path if needed

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Optionally, you can show a loading indicator here
  }

  return (
    <>
      {/* Request required permissions */}
      <RequestPermissions />
      <BottomSheetModalProvider>
        {/* Redirect based on authentication status */}
        {session ? (
          <Redirect href="/(screens)/PreHomeScreen" />
        ) : (
          <Redirect href="/auth/login" />
        )}
      </BottomSheetModalProvider>
    </>
  );
}
