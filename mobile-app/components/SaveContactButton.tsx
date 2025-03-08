import React, { useState } from "react";
import { Modal, View, TouchableOpacity, Text, Alert } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

export type SaveLocation = "device" | "sim" | "email";

interface SaveContactButtonProps {
  availableEmails?: string[];
  availableSIMs?: string[];
  onSave?: (location: SaveLocation, account?: string) => void;
}

const SaveContactButton: React.FC<SaveContactButtonProps> = ({
  availableEmails = [],
  availableSIMs = [],
  onSave,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SaveLocation | null>(null);

  const handleOptionPress = (location: SaveLocation) => {
    // If location is sim or email and there are multiple options, show account selection modal
    if (
      (location === "email" && availableEmails.length > 1) ||
      (location === "sim" && availableSIMs.length > 1)
    ) {
      setSelectedLocation(location);
      setAccountModalVisible(true);
    } else {
      // If only one account is available (or location is device), proceed directly
      setModalVisible(false);
      let account: string | undefined = undefined;
      if (location === "email" && availableEmails.length === 1) {
        account = availableEmails[0];
      }
      if (location === "sim" && availableSIMs.length === 1) {
        account = availableSIMs[0];
      }
      if (onSave) {
        onSave(location, account);
      } else {
        Alert.alert("Save Contact", `Contact saved to ${location}${account ? `: ${account}` : ""}.`);
      }
    }
  };

  const handleAccountSelect = (account: string) => {
    setAccountModalVisible(false);
    setModalVisible(false);
    if (onSave && selectedLocation) {
      onSave(selectedLocation, account);
    } else {
      Alert.alert("Save Contact", `Contact saved to ${selectedLocation}: ${account}`);
    }
  };

  return (
    <>
      {/* Reusable Floating Action Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-16 right-4 bg-blue-500 rounded-full p-4 shadow-lg"
      >
        <IconSymbol name="plus.message.fill" size={24} color="white" />
      </TouchableOpacity>

      {/* Primary Modal to Choose Location */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View
            className="bg-white rounded-xl p-6 mx-4"
            style={{
              position: "absolute",
              bottom: 100,
              left: 20,
              right: 20,
              elevation: 5,
            }}
          >
            <Text className="text-lg font-bold mb-4">Save Contact To</Text>
            <TouchableOpacity
              onPress={() => handleOptionPress("device")}
              className="py-3 border-b border-gray-200"
            >
              <Text className="text-base">Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOptionPress("sim")}
              className="py-3 border-b border-gray-200"
            >
              <Text className="text-base">SIM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOptionPress("email")}
              className="py-3"
            >
              <Text className="text-base">Email</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Secondary Modal for Account Selection if Multiple Options Available */}
      <Modal
        visible={accountModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPressOut={() => setAccountModalVisible(false)}
        >
          <View
            className="bg-white rounded-xl p-6 mx-4"
            style={{
              position: "absolute",
              bottom: 100,
              left: 20,
              right: 20,
              elevation: 5,
            }}
          >
            <Text className="text-lg font-bold mb-4">
              Select {selectedLocation === "email" ? "Email" : "SIM"}
            </Text>
            {(selectedLocation === "email" ? availableEmails : availableSIMs).map((account, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAccountSelect(account)}
                className="py-3 border-b border-gray-200"
              >
                <Text className="text-base">{account}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SaveContactButton;
