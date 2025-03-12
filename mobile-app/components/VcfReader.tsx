import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

// Define an interface for parsed vCard contacts.
export interface VCardContact {
  name: string;
  phoneNumbers: string[];
  emails: string[];
}

/**
 * A basic parser for vCard (.vcf) content.
 * It splits the file into individual vCards and extracts:
 *  - FN (full name)
 *  - TEL (telephone numbers)
 *  - EMAIL (email addresses)
 *
 * @param content The full content of the .vcf file.
 * @returns An array of VCardContact objects.
 */
function parseVCard(content: string): VCardContact[] {
  const contacts: VCardContact[] = [];

  // Split the file into blocks per vCard.
  const cards = content.split(/BEGIN:VCARD/i);
  cards.forEach((card) => {
    // Ignore empty blocks.
    if (card.trim() === "") return;

    // Extract everything until the END:VCARD marker.
    const vcard = card.split(/END:VCARD/i)[0];
    const lines = vcard.split(/\r?\n/);
    let name = "";
    const emails: string[] = [];
    const phones: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith("FN:")) {
        name = line.substring(3).trim();
      } else if (line.startsWith("EMAIL:")) {
        const email = line.substring(6).trim();
        if (email) {
          emails.push(email);
        }
      } else if (line.startsWith("TEL:")) {
        const tel = line.substring(4).trim();
        if (tel) {
          phones.push(tel);
        }
      }
    });

    // Only add the contact if it has a valid name.
    if (name !== "") {
      contacts.push({
        name,
        emails,
        phoneNumbers: phones,
      });
    }
  });
  return contacts;
}

const VcfReader: React.FC = () => {
  const [contacts, setContacts] = useState<VCardContact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pickVcfFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/vcard", "text/x-vcard"],
        copyToCacheDirectory: true,
      });

      // Check if the user did not cancel the picker and at least one asset was returned.
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        // Read the file content as a string.
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        // Parse the vCard file content.
        const parsedContacts = parseVCard(fileContent);
        setContacts(parsedContacts);
      } else {
        console.log("Document picker was cancelled or no assets returned.");
      }
    } catch (e) {
      console.error("Error picking file:", e);
      setError("Error reading file: " + e);
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <TouchableOpacity
        onPress={pickVcfFile}
        className="bg-blue-500 p-4 rounded-lg mb-4"
      >
        <Text className="text-white text-center font-bold">Pick VCF File</Text>
      </TouchableOpacity>
      {error && <Text className="text-red-500 mb-4">{error}</Text>}
      {contacts.length === 0 ? (
        <Text className="text-center text-gray-600">No contacts loaded.</Text>
      ) : (
        contacts.map((contact, index) => (
          <View key={index} className="bg-gray-100 p-4 rounded-lg mb-4 shadow">
            <Text className="text-lg font-bold">{contact.name}</Text>
            {contact.emails.map((email, idx) => (
              <Text key={idx} className="text-sm text-gray-600">
                Email: {email}
              </Text>
            ))}
            {contact.phoneNumbers.map((phone, idx) => (
              <Text key={idx} className="text-sm text-gray-600">
                Phone: {phone}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default VcfReader;
