import React, { useEffect, useState, memo } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  SectionList,
  TouchableOpacity,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import SaveContactButton, { SaveLocation } from "@/components/SaveContactButton";
import MergeContactsComponent, { Contact } from "@/components/MergeContactsComponent"; // adjust the import path as needed

// Define props for ContactItem
interface ContactItemProps {
  contact: Contact;
}

const ContactItem = memo(({ contact }: ContactItemProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/ContactDetail",
      params: { contact: JSON.stringify(contact) },
    });
  };

  const initial = contact.name ? contact.name.charAt(0).toUpperCase() : "";

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center p-3 border-b border-gray-200"
    >
      <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-4">
        <Text className="text-white text-lg font-semibold">{initial}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-medium">{contact.name}</Text>
        {contact.emails?.map((email) => (
          <Text key={email.email} className="text-sm text-gray-600">
            {email.email || "anonymous"}
          </Text>
        ))}
        {contact.phoneNumbers?.map((phone) => (
          <Text key={phone.number} className="text-sm text-gray-600">
            {phone.number || "anonymous"}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [showMergeDuplicates, setShowMergeDuplicates] = useState(false);

  useEffect(() => {
    const requestContactsPermission = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        loadContacts();
      } else {
        Alert.alert("Permission denied", "Unable to access contacts.");
      }
    };

    requestContactsPermission();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      // Format contacts and remove duplicate or null phone numbers/emails
      const uniqueContacts = data.map((contact) => ({
        ...contact,
        emails: contact.emails
          ? contact.emails
              .filter((email) => email.email != null)
              .map((email) => ({ email: email.email }))
          : [],
        phoneNumbers: contact.phoneNumbers
          ? Array.from(
              new Set(
                contact.phoneNumbers
                  .filter((phone) => phone.number != null)
                  .map((phone) => phone.number)
              )
            ).map((number) => ({ number }))
          : [],
      }));

      setContacts(uniqueContacts);
      setFilteredContacts(uniqueContacts);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      Alert.alert("Error", "Failed to load contacts.");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = contacts.filter((contact) =>
      contact.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleSaveContact = (location: SaveLocation) => {
    Alert.alert("Saving Contact", `Saving contact to ${location}`);
  };

  // A simple handler for merge results.
  // Here you might update your contacts state by replacing the duplicate group with the merged contact.
  const handleMerge = (mergedContact: Contact, mergedGroup: Contact[]) => {
    Alert.alert("Merged", `Merged ${mergedGroup.length} contacts into ${mergedContact.name}.`);
    // Example update: remove merged contacts and add the mergedContact
    const mergedIds = new Set(mergedGroup.map((c) => c.id));
    const updated = contacts.filter((c) => !mergedIds.has(c.id));
    updated.push(mergedContact);
    setContacts(updated);
    setFilteredContacts(updated);
  };

  // Group contacts by the first letter of their names for display in the list
  const validContacts = filteredContacts.filter((contact) => contact.name);
  const groupedContacts = validContacts.reduce((acc, contact) => {
    const firstLetter = contact.name ? contact.name[0].toUpperCase() : "#";
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sections = Object.keys(groupedContacts)
    .sort()
    .map((letter) => ({
      title: letter,
      data: groupedContacts[letter],
    }));

  return (
    <View className="flex-1 bg-white">
      {/* Toggle Header: Switch between Contact List and Merge Duplicates */}
      <View className="flex-row justify-around p-4 bg-gray-100">
        <TouchableOpacity onPress={() => setShowMergeDuplicates(false)}>
          <Text className={!showMergeDuplicates ? "text-blue-500 font-bold" : "text-gray-500"}>
            Contacts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMergeDuplicates(true)}>
          <Text className={showMergeDuplicates ? "text-blue-500 font-bold" : "text-gray-500"}>
            Merge Duplicates
          </Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 flex-1">
        {showMergeDuplicates ? (
          // Render the MergeContactsComponent with all loaded contacts
          <MergeContactsComponent contacts={contacts} onMerge={handleMerge} />
        ) : (
          <>
            {/* Search Bar */}
            <TextInput
              placeholder="Search Contacts"
              value={searchQuery}
              onChangeText={handleSearch}
              className="bg-gray-100 rounded-full py-2 px-4 mb-4 border border-gray-300"
            />

            {/* SectionList for displaying contacts */}
            <SectionList
              sections={sections}
              keyExtractor={(item, index) =>
                item.id ? item.id : index.toString()
              }
              renderItem={({ item }) => <ContactItem contact={item} />}
              renderSectionHeader={({ section: { title } }) => (
                <Text className="bg-gray-200 text-gray-700 font-bold px-4 py-1">
                  {title}
                </Text>
              )}
              getItemLayout={(data, index) => ({
                length: 72, // Approximate height including avatar and padding
                offset: 72 * index,
                index,
              })}
              initialNumToRender={30}
              maxToRenderPerBatch={30}
              windowSize={30}
            />
          </>
        )}
      </View>

      {/* Floating Action Button for saving contact */}
      <SaveContactButton onSave={handleSaveContact} />
    </View>
  );
}
