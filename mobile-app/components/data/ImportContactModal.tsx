// ImportUniqueContactsModal.tsx
import React, { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  View,
  Text,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { removeCountryCode } from "@/hooks/PhoneNumberUtils";
import { useUniqueContacts } from "@/hooks/useUniqueContacts";

export interface DBContact {
  id?: string | number;
  name: string;
  email?: string | null;
  country?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
  date_of_birth?: string | null;
}

interface ImportUniqueContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  defaultCountryCode?: string;
}

const generateVCard = (contact: DBContact, countryCode?: string): string => {
  const normalizedPhone = contact.phone_number
    ? removeCountryCode(contact.phone_number, countryCode)
    : "";
  const normalizedEmail = contact.email ? contact.email.trim() : "";
  return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
${normalizedPhone ? `TEL;TYPE=CELL:${normalizedPhone}` : ""}
${normalizedEmail ? `EMAIL;TYPE=INTERNET:${normalizedEmail}` : ""}
END:VCARD`;
};

export default function ImportUniqueContactsModal({
  visible,
  onClose,
  onSaved,
  defaultCountryCode = "+234",
}: ImportUniqueContactsModalProps) {
  const {
    uniqueContacts: contacts,
    loading,
    error,
  } = useUniqueContacts(5, defaultCountryCode);
  const [saving, setSaving] = useState(false);

  const handleDownload = async (contact: DBContact) => {
    try {
      const vCard = generateVCard(contact, defaultCountryCode);
      const filename = `${contact.name.replace(/[^a-z0-9]/gi, "_")}.vcf`;

      if (Platform.OS === "android") {
        // Android: Save to Downloads folder
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert("Error", "Storage permission required");
          return;
        }

        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          "text/vcard"
        );
        await FileSystem.writeAsStringAsync(uri, vCard);
        Alert.alert("Success", `Saved to Downloads/${filename}`);
      } else {
        // iOS: Save to local storage
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, vCard);
        Alert.alert("Success", "Contact saved to local storage");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save contact file");
      console.error(err);
    }
  };

  const handleSaveToPhone = async (contact: DBContact) => {
    try {
      setSaving(true);
      const vCard = generateVCard(contact, defaultCountryCode);
      const filename = `${contact.name.replace(/[^a-z0-9]/gi, "_")}.vcf`;
      const fileUri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, vCard);

      if (Platform.OS === "android") {
        // Android: Open contact import screen
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: "text/vcard",
          flags: 1,
        });
      } else {
        // iOS: Open share sheet with contact add option
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/x-vcard",
          dialogTitle: "Add to Contacts",
          // UIActivityType: "com.apple.MobileAddressBook",
        });
      }

      onSaved?.();
    } catch (err) {
      Alert.alert("Error", "Failed to open contact importer");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-3/4 bg-white rounded-t-2xl p-4">
          <Text className="text-center mb-4 text-lg font-bold">
            Import Unique Contacts
          </Text>

          {loading ? (
            <Text className="text-center text-gray-600">
              Loading contacts...
            </Text>
          ) : error ? (
            <Text className="text-center text-red-500">{error}</Text>
          ) : contacts.length === 0 ? (
            <Text className="text-center text-gray-600">
              No unique contacts available.
            </Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <View className="bg-gray-100 p-4 rounded-xl shadow-md mb-4">
                  <Text className="text-lg font-bold">{item.name}</Text>
                  {item.email && (
                    <Text className="text-gray-600">{item.email}</Text>
                  )}
                  {item.phone_number && (
                    <Text className="text-gray-600">{item.phone_number}</Text>
                  )}
                  {item.country && (
                    <Text className="text-gray-600">{item.country}</Text>
                  )}
                  <View className="flex-row gap-2 justify-around items-center m-2">
                    <TouchableOpacity
                      onPress={() => handleDownload(item)}
                      className="bg-blue-500 rounded-full px-4 py-2 mr-2"
                      disabled={saving}
                    >
                      <Text className="text-white font-bold text-base">
                        Download
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSaveToPhone(item)}
                      className="bg-blue-500 rounded-full px-4 py-2 mr-4"
                      disabled={saving}
                    >
                      <Text className="text-white font-bold text-base">
                        Save to Contacts
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 bg-red-500 rounded-full px-6 py-3 items-center"
          >
            <Text className="text-white font-bold text-xl">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
