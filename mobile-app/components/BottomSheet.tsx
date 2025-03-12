import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from "react-native";
import { Linking } from "react-native";

interface BottomSheetProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

export default function BottomSheet({
  visible,
  children,
  onClose,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={sheetStyles.container}>
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          {children}
          <TouchableOpacity className="bg-red-500 rounded-full p-2" onPress={onClose}>
            <Text className="text-white font-bold p-2 text-center">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    height: "50%",
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  detail: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 16,
    color: "#555",
  },
  proceedButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  proceedButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#333",
    fontSize: 16,
  },
});
