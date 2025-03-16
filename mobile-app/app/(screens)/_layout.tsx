import React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Slot } from "expo-router";

export default function ScreenLayout() {
  return (
    <BottomSheetModalProvider>
      <Slot />
    </BottomSheetModalProvider>
  );
}
