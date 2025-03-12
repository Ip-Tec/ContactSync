import React, { useEffect, useState, useMemo } from "react";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useContacts } from "@/context/ContactsContext";
import { ThemedText } from "@/components/ThemedText";

interface DBContact {
  id: number | string;
  name: string;
  email?: string | string[] | null;
  phone_number?: string | string[] | null;
  // other columns...
}

export default function RandomBuyContact() {
  const { contacts: deviceContacts } = useContacts();
  const [dbContacts, setDbContacts] = useState<DBContact[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [randomContact, setRandomContact] = useState<DBContact | null>(null);

  // Fetch all contacts from Supabase DB.
  useEffect(() => {
    async function fetchDBContacts() {
      setLoadingDb(true);
      const { data, error } = await supabase.from("Contact").select("*");
      if (error) {
        console.error("Error fetching DB contacts:", error.message);
      } else if (data) {
        setDbContacts(data as DBContact[]);
      }
      setLoadingDb(false);
    }
    fetchDBContacts();
  }, []);

  // Build a set of identifiers (phone numbers and emails) from device contacts.
  const deviceIdentifiers = useMemo(() => {
    const identifiers = new Set<string>();
    deviceContacts.forEach((contact) => {
      if (contact.phoneNumbers) {
        contact.phoneNumbers.forEach((p) => {
          if (p.number) identifiers.add(p.number);
        });
      }
      if (contact.emails) {
        contact.emails.forEach((e) => {
          if (e.email) identifiers.add(e.email);
        });
      }
    });
    return identifiers;
  }, [deviceContacts]);

  // Filter DB contacts so that the user does not already have them.
  const filteredDBContacts = useMemo(() => {
    return dbContacts.filter((dbContact) => {
      const phone = dbContact.phone_number;
      const email = dbContact.email;
      if (phone && Array.isArray(phone) && phone.some(p => deviceIdentifiers.has(p))) return false;
      if (email && Array.isArray(email) && email.some(e => deviceIdentifiers.has(e))) return false;
      return true;
    });
  }, [dbContacts, deviceIdentifiers]);

  // Pick a random contact from filteredDBContacts.
  const pickRandomContact = () => {
    if (filteredDBContacts.length === 0) {
      setRandomContact(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredDBContacts.length);
    setRandomContact(filteredDBContacts[randomIndex]);
  };

  // Re-pick random contact whenever filteredDBContacts changes.
  useEffect(() => {
    pickRandomContact();
  }, [filteredDBContacts]);

  if (loadingDb) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText className="mt-4 text-gray-600">
          Loading contacts...
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      {randomContact ? (
        <>
          <View className="bg-white rounded-xl shadow p-6 mb-4">
            <ThemedText type="title" className="text-center mb-2">
              {randomContact.name}
            </ThemedText>
            {randomContact.email && (
              <ThemedText className="text-center text-gray-600 mb-1">
                Email: {randomContact.email}
              </ThemedText>
            )}
            {randomContact.phone_number && (
              <ThemedText className="text-center text-gray-600 mb-1">
                Phone: {randomContact.phone_number}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity
            onPress={pickRandomContact}
            className="bg-blue-500 rounded-full px-6 py-3 mb-4"
          >
            <Text className="text-white font-bold text-center">
              Get Another Contact
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // Here you can trigger your "buy" or "trade" action to upload the contact
              console.log("Buying contact:", randomContact);
            }}
            className="bg-green-500 rounded-full px-6 py-3"
          >
            <ThemedText className="text-white font-bold text-center">
              Buy Contact
            </ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <ThemedText className="text-center text-gray-600">
          No new contacts available.
        </ThemedText>
      )}
    </View>
  );
}
