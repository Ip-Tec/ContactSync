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
  limit?: number;
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  defaultCountryCode?: string;
}

// Generate a vCard for a single contact.
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

// Combine multiple vCards into a single file.
const generateCombinedVCard = (
  contacts: DBContact[],
  countryCode?: string
): string => {
  return contacts
    .map((contact) => generateVCard(contact, countryCode))
    .join("\n");
};

export default function ImportUniqueContactsModal({
  limit,
  visible,
  onClose,
  onSaved,
  defaultCountryCode = "+234",
}: ImportUniqueContactsModalProps) {
  const {
    uniqueContacts: contacts,
    loading,
    error,
  } = useUniqueContacts(limit || 50, defaultCountryCode);
  const [saving, setSaving] = useState(false);

  // Download all contacts as one vCard file.
  const handleDownloadAll = async () => {
    try {
      const combinedVCard = generateCombinedVCard(contacts, defaultCountryCode);
      const filename = `unique_contacts.vcf`;

      if (Platform.OS === "android") {
        // Android: Save to Downloads folder.
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
        await FileSystem.writeAsStringAsync(uri, combinedVCard);
        Alert.alert("Success", `Saved to Downloads/${filename}`);
      } else {
        // iOS: Save to local storage.
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, combinedVCard);
        Alert.alert("Success", "Contacts saved to local storage");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save contacts file");
      console.error(err);
    }
  };

  // Open the system contact importer with the combined vCard file.
  const handleSaveToPhoneAll = async () => {
    try {
      setSaving(true);
      const combinedVCard = generateCombinedVCard(contacts, defaultCountryCode);
      const filename = `contact_sync.vcf`;
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, combinedVCard);

      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: "text/vcard",
          flags: 1,
        });
      } else {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/x-vcard",
          dialogTitle: "Add to Contacts",
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
            <>
              {/* Summary and collective actions */}
              <Text className="text-center text-gray-600 mb-4">
                {contacts.length} unique contacts loaded.
              </Text>
              <View className="flex-row gap-2 justify-around items-center m-2">
                <TouchableOpacity
                  onPress={handleDownloadAll}
                  className="bg-blue-500 rounded-full px-4 py-2"
                  disabled={saving}
                >
                  <Text className="text-white font-bold text-base">
                    Download All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveToPhoneAll}
                  className="bg-blue-500 rounded-full px-4 py-2"
                  disabled={saving}
                >
                  <Text className="text-white font-bold text-base">
                    Save All to Contacts
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Optionally, display the list of contacts */}
              <FlatList
                data={contacts}
                keyExtractor={(item) =>
                  item.id?.toString() || Math.random().toString()
                }
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
                  </View>
                )}
              />
            </>
          )}

          {/* <TouchableOpacity
            onPress={onClose}
            className="mt-4 bg-red-500 rounded-full px-6 py-3 items-center"
          >
            <Text className="text-white font-bold text-xl">Close</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </Modal>
  );
}
