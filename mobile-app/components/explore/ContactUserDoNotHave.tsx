import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useContacts } from "@/context/ContactsContext";
import { useNavigation } from "@react-navigation/native";
import { maskPhone, maskEmail } from "@/utils/maskUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { matchPhoneNumbers } from "@/utils/phoneUtils";

interface FileContact {
  id: string;
  name: string;
  phoneNumbers?: { number: string }[];
  emails?: { email: string }[];
}

const CACHE_KEY = "cached_unique_contacts";
const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour cache

const parseCSV = (content: string): FileContact[] => {
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const contact: FileContact = { id: Math.random().toString(), name: "" };
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (header === "name") contact.name = value;
      else if (header === "phone") contact.phoneNumbers = [{ number: value }];
      else if (header === "email") contact.emails = [{ email: value }];
    });
    return contact;
  });
};

const parseVCF = (content: string): FileContact[] => {
  const cards = content
    .split("END:VCARD")
    .filter((card) => card.includes("BEGIN:VCARD"));
  return cards.map((card) => {
    const contact: FileContact = { id: Math.random().toString(), name: "" };
    const lines = card.split("\n");
    lines.forEach((line) => {
      if (line.startsWith("FN:")) contact.name = line.replace("FN:", "").trim();
      else if (line.startsWith("TEL;"))
        contact.phoneNumbers = [{ number: line.split(":")[1]?.trim() }];
      else if (line.startsWith("EMAIL;"))
        contact.emails = [{ email: line.split(":")[1]?.trim() }];
    });
    return contact;
  });
};

const ContactUserDoNotHave = () => {
  const navigation = useNavigation();
  const { contacts: deviceContacts } = useContacts();
  const [uniqueContacts, setUniqueContacts] = useState<FileContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isContactOnDevice = (contact: FileContact) => {
    return deviceContacts.some((deviceContact) => {
      const phoneMatch = contact.phoneNumbers?.some((cPhone) =>
        deviceContact.phoneNumbers?.some(
          (dPhone) => matchPhoneNumbers(cPhone.number, dPhone.number).match
        )
      );
      const emailMatch = contact.emails?.some((cEmail) =>
        deviceContact.emails?.some(
          (dEmail) => cEmail.email.toLowerCase() === dEmail.email.toLowerCase()
        )
      );
      return phoneMatch || emailMatch;
    });
  };

  const fetchAndProcessContacts = async () => {
    try {
      setLoading(true);

      // Check cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIMEOUT) {
          setUniqueContacts(data);
          return;
        }
      }

      // Fetch file records from DB
      const { data: files, error } = await supabase
        .from("contact_file_urls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!files?.length) throw new Error("No contact files available");

      // Process files
      let processedContacts: FileContact[] = [];
      for (const file of files) {
        const response = await fetch(file.file_url);
        const content = await response.text();
        const contacts = file.file_url.endsWith(".csv")
          ? parseCSV(content)
          : parseVCF(content);
        processedContacts = [
          ...processedContacts,
          ...contacts.filter((c) => !isContactOnDevice(c)),
        ];
      }

      // Deduplicate and cache
      const unique = processedContacts.filter(
        (v, i, a) =>
          a.findIndex(
            (t) =>
              t.name === v.name &&
              t.phoneNumbers?.[0]?.number === v.phoneNumbers?.[0]?.number
          ) === i
      );

      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: unique,
          timestamp: Date.now(),
        })
      );

      setUniqueContacts(unique);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
      Alert.alert("Error", "Could not fetch unique contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessContacts();
  }, []);

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-4 text-center">
        {uniqueContacts.length} Unique Contacts Found
      </Text>

      {loading ? (
        <ActivityIndicator size="large" className="mt-8" />
      ) : error ? (
        <Text className="text-red-500 text-center">{error}</Text>
      ) : (
        <FlatList
          data={uniqueContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-gray-100 p-4 rounded-lg mb-2 mx-4">
              <Text className="font-bold text-lg mb-2">{item.name}</Text>

              {item.phoneNumbers?.map((phone, idx) => (
                <Text key={idx} className="text-gray-600">
                  Phone: {maskPhone(phone.number)}
                </Text>
              ))}

              {item.emails?.map((email, idx) => (
                <Text key={idx} className="text-gray-600">
                  Email: {maskEmail(email.email)}
                </Text>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-8">
              No unique contacts found
            </Text>
          }
        />
      )}

      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-full mx-4 mt-4"
        onPress={() => navigation.navigate("/(tabs)/home")}
      >
        <Text className="text-white text-center font-bold">Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ContactUserDoNotHave;
