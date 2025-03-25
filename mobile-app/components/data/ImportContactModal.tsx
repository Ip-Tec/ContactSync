// ImportUniqueContactsModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  View,
  Text,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { removeCountryCode } from "@/hooks/PhoneNumberUtils";
import { useUniqueContacts } from "@/hooks/useUniqueContacts";
import { supabase } from "@/lib/supabase";

// A sample interface for a contact record
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

/* 
  Helper function to generate a vCard from a contact.
  Adjust the formatting as needed.
*/
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

/* 
  Combine multiple vCards into one file.
*/
const generateCombinedVCard = (
  contacts: DBContact[],
  countryCode?: string
): string => {
  return contacts
    .map((contact) => generateVCard(contact, countryCode))
    .join("\n");
};

/* 
  Example CSV parser: split content by lines and commas.
  (For production, consider a robust CSV parser to handle quoted commas, etc.)
*/
const parseCSV = (content: string): DBContact[] => {
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const contacts: DBContact[] = lines.slice(1).map((line) => {
    const values = line.split(",");
    const contact: DBContact = { name: "" };
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (header === "name") contact.name = value;
      else if (header === "email") contact.email = value;
      else if (header === "phone") contact.phone_number = value;
      else if (header === "country") contact.country = value;
    });
    return contact;
  });
  return contacts;
};

/* 
  Example VCF parser: a very simple parser.
  This assumes that each vCard is separated by "END:VCARD" and contains
  lines starting with FN:, TEL; and EMAIL;.
*/
const parseVCF = (content: string): DBContact[] => {
  const cards = content
    .split("END:VCARD")
    .filter((card) => card.includes("BEGIN:VCARD"));
  return cards.map((card) => {
    const contact: DBContact = { name: "" };
    const lines = card.split("\n");
    lines.forEach((line) => {
      if (line.startsWith("FN:")) {
        contact.name = line.replace("FN:", "").trim();
      } else if (line.startsWith("TEL;")) {
        contact.phone_number = line.split(":")[1]?.trim();
      } else if (line.startsWith("EMAIL;")) {
        contact.email = line.split(":")[1]?.trim();
      }
    });
    return contact;
  });
};

/* 
  Function to check if a given contact already exists on the device.
  This function should use your device contacts data and your duplicate-checking logic.
  Here we assume you have a function or hook (e.g. from useUniqueContacts) that gives you the user's device contacts.
*/
const isContactUnique = (
  contact: DBContact,
  deviceContacts: DBContact[]
): boolean => {
  // Simple example: compare normalized phone numbers and emails
  const normPhone = contact.phone_number
    ? removeCountryCode(contact.phone_number)
    : "";
  const normEmail = contact.email ? contact.email.trim().toLowerCase() : "";
  return !deviceContacts.some((dev) => {
    const devPhone = dev.phone_number
      ? removeCountryCode(dev.phone_number)
      : "";
    const devEmail = dev.email ? dev.email.trim().toLowerCase() : "";
    return (
      (normPhone && normPhone === devPhone) ||
      (normEmail && normEmail === devEmail)
    );
  });
};

/* 
  The main processing function:
  1. Query the DB for file records (each having a public URL).
  2. For each file (newest first), download and parse it.
  3. Filter contacts to get only those that are not on the device.
  4. Continue until the desired limit is reached.
*/
const processUniqueContacts = async (
  limit: number,
  deviceContacts: DBContact[]
): Promise<DBContact[]> => {
  let uniqueContacts: DBContact[] = [];

  // Fetch file records from the DB table "contact_file_urls"
  const { data: files, error } = await supabase
    .from("contact_file_urls")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!files || files.length === 0) {
    throw new Error("No contact file info available in the database.");
  }

  // Process each file record in order until we have reached the limit
  for (const fileRecord of files) {
    if (uniqueContacts.length >= limit) break;
    const fileUrl: string = fileRecord.file_url;
    try {
      // Download file content
      const res = await fetch(fileUrl);
      if (!res.ok) continue;
      const content = await res.text();
      // Decide how to parse based on file extension
      let contacts: DBContact[] = [];
      if (fileUrl.endsWith(".csv")) {
        contacts = parseCSV(content);
      } else if (fileUrl.endsWith(".vcf")) {
        contacts = parseVCF(content);
      }
      // Filter the contacts: only keep those that are unique compared to device contacts
      const filtered = contacts.filter((contact) =>
        isContactUnique(contact, deviceContacts)
      );
      uniqueContacts = uniqueContacts.concat(filtered);
    } catch (err) {
      console.error("Error processing file:", err);
      // You might want to continue to the next file if one fails
      continue;
    }
  }

  // Return only up to the requested limit
  return uniqueContacts.slice(0, limit);
};

export default function ImportUniqueContactsModal({
  limit,
  visible,
  onClose,
  onSaved,
  defaultCountryCode = "+234",
}: ImportUniqueContactsModalProps) {
  // You may already have a hook that fetches device contacts.
  // For demonstration, we assume that useUniqueContacts returns the device contacts as well.
  // In your real code, use the proper hook for device contacts.
  const {
    uniqueContacts: hookUniqueContacts,
    loading,
    error,
  } = useUniqueContacts(limit || 50, defaultCountryCode);
  // In this example, we assume hookUniqueContacts contains the device contacts.
  const deviceContacts: DBContact[] = hookUniqueContacts; // adjust accordingly

  const [processing, setProcessing] = useState(false);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [finalUniqueContacts, setFinalUniqueContacts] = useState<DBContact[]>(
    []
  );

  // Fetch the latest file info (for display purposes) from the DB
  const fetchLatestFileUrl = async () => {
    try {
      setFileLoading(true);
      const { data, error } = await supabase
        .from("contact_file_urls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        Alert.alert(
          "Info",
          "Upload your first contact file info in the DB table 'contact_file_urls'."
        );
        return;
      }
      const latestFileRecord = data[0];
      setOriginalFileUrl(latestFileRecord.file_url);
    } catch (err) {
      console.error("File fetch error:", err);
      Alert.alert(
        "Storage Error",
        err instanceof Error
          ? err.message
          : "Failed to access contact file info from DB"
      );
    } finally {
      setFileLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLatestFileUrl();
      // Trigger processing after payment success.
      // For example, call processUniqueContacts with the desired limit.
      // In production you might trigger this only once when payment is confirmed.
      const processFiles = async () => {
        try {
          setProcessing(true);
          const processedContacts = await processUniqueContacts(
            limit || 50,
            deviceContacts
          );
          setFinalUniqueContacts(processedContacts);
        } catch (err) {
          console.error("Error processing unique contacts:", err);
          Alert.alert(
            "Processing Error",
            err instanceof Error
              ? err.message
              : "Failed to process unique contacts"
          );
        } finally {
          setProcessing(false);
        }
      };
      processFiles();
    }
  }, [visible, limit, deviceContacts]);

  // Handler for downloading/opening the original file from the URL
  const handleDownloadOriginalFile = async () => {
    if (!originalFileUrl) return;
    try {
      const supported = await Linking.canOpenURL(originalFileUrl);
      if (!supported) throw new Error("URL scheme not supported");
      if (Platform.OS === "android") {
        const downloadPath = `${FileSystem.cacheDirectory}${originalFileUrl
          .split("/")
          .pop()}`;
        const { uri } = await FileSystem.downloadAsync(
          originalFileUrl,
          downloadPath
        );
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: uri,
          type: "text/vcard",
          flags: 1,
        });
      } else {
        await Sharing.shareAsync(originalFileUrl);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to open file: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  // Handler to generate VCF file from the final unique contacts and share/save it on device
  const handleSaveToDevice = async () => {
    try {
      setProcessing(true);
      const vcfContent = generateCombinedVCard(
        finalUniqueContacts,
        defaultCountryCode
      );
      const filename = `unique_contacts_${Date.now()}.vcf`;
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, vcfContent);
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
      Alert.alert("Error", "Failed to save contacts file");
      console.error(err);
    } finally {
      setProcessing(false);
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
        <SafeAreaView
          className="bg-white rounded-t-2xl p-4"
          style={{ flex: 0.75 }}
        >
          <FlatList
            data={finalUniqueContacts}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            ListHeaderComponent={
              <View className="pb-4">
                <Text className="text-center text-lg font-bold mb-4 bg-gray-300">
                  {finalUniqueContacts.length} Unique Contacts Found
                </Text>
                {fileLoading ? (
                  <ActivityIndicator size="large" color="#3b82f6" />
                ) : originalFileUrl ? (
                  <TouchableOpacity
                    onPress={handleDownloadOriginalFile}
                    className="bg-green-500 rounded-full p-4 items-center mb-4"
                  >
                    <Text className="text-white font-bold text-lg">
                      Download Original File
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-center text-gray-600">
                    No contact file info available.
                  </Text>
                )}
                {processing ? (
                  <ActivityIndicator size="large" color="#3b82f6" />
                ) : error ? (
                  <Text className="text-center text-red-500">{error}</Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleSaveToDevice}
                    className="bg-blue-500 rounded-full p-4 items-center"
                    disabled={processing || finalUniqueContacts.length === 0}
                  >
                    <Text className="text-white font-bold text-lg">
                      {processing
                        ? "Generating..."
                        : `Download ${finalUniqueContacts.length} Contacts`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-gray-100 p-4 rounded-lg mb-2">
                <Text className="font-bold">{item.name}</Text>
                {item.phone_number && <Text>Phone: {item.phone_number}</Text>}
                {item.email && <Text>Email: {item.email}</Text>}
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity
                onPress={onClose}
                className="mt-4 bg-red-500 rounded-full p-3 items-center"
              >
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
