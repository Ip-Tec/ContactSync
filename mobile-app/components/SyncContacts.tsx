import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Contacts from "expo-contacts";
import { supabase } from "@/lib/supabase"; // Ensure you have your Supabase client set up
// You may need to adjust the import above based on your project structure

const SyncContacts: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const syncContacts = async () => {
    setSyncing(true);
    setUploadedCount(0);
    try {
      // Request Contacts Permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Contacts permission is required.");
        setSyncing(false);
        return;
      }

      // Fetch device contacts (adjust fields as needed)
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      // Filter out contacts with no valid name
      const validContacts = (deviceContacts || []).filter(
        (contact) => contact.name && contact.name.trim() !== ""
      );

      // Fetch contacts from Supabase DB
      const { data: dbContacts, error: dbError } = await supabase
        .from("contacts")
        .select("name, phoneNumbers, emails");
      if (dbError) {
        Alert.alert("DB Error", dbError.message);
        setSyncing(false);
        return;
      }

      // Build a set of identifiers (phone numbers and emails) from DB contacts.
      const dbIdentifiers = new Set<string>();
      dbContacts?.forEach((dbContact) => {
        // Assume phoneNumbers and emails are stored as arrays of objects
        if (dbContact.phoneNumbers && Array.isArray(dbContact.phoneNumbers)) {
          dbContact.phoneNumbers.forEach((p: any) => {
            if (p.number) dbIdentifiers.add(p.number);
          });
        }
        if (dbContact.emails && Array.isArray(dbContact.emails)) {
          dbContact.emails.forEach((e: any) => {
            if (e.email) dbIdentifiers.add(e.email);
          });
        }
      });

      // Filter device contacts: only include those that have no phone or email in the DB.
      const newContacts = validContacts.filter((contact) => {
        let isNew = true;
        if (contact.phoneNumbers) {
          for (const p of contact.phoneNumbers) {
            if (p.number && dbIdentifiers.has(p.number)) {
              isNew = false;
              break;
            }
          }
        }
        if (isNew && contact.emails) {
          for (const e of contact.emails) {
            if (e.email && dbIdentifiers.has(e.email)) {
              isNew = false;
              break;
            }
          }
        }
        return isNew;
      });

      // Upload new contacts asynchronously (you can adjust batch size or use Promise.all)
      let count = 0;
      await Promise.all(
        newContacts.map(async (contact) => {
          const { error } = await supabase.from("contacts").insert([
            {
              name: contact.name,
              // Save emails and phoneNumbers as received (ensure your table schema matches)
              emails: contact.emails,
              phoneNumbers: contact.phoneNumbers,
            },
          ]);
          if (!error) {
            count++;
          }
        })
      );

      setUploadedCount(count);
      Alert.alert("Sync Complete", `Uploaded ${count} new contacts.`);
    } catch (err: any) {
      Alert.alert("Sync Error", err.message || "An error occurred.");
    }
    setSyncing(false);
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow">
      <TouchableOpacity
        onPress={syncContacts}
        disabled={syncing}
        className="bg-blue-500 p-4 rounded-lg items-center"
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Sync Contacts</Text>
        )}
      </TouchableOpacity>
      {uploadedCount > 0 && !syncing && (
        <Text className="text-center mt-2 text-green-500">
          {uploadedCount} new contacts uploaded.
        </Text>
      )}
    </View>
  );
};

export default SyncContacts;
