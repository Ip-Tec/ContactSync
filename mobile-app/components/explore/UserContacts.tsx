// UserContact.tsx
import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Contact } from "@/types/explore-types";
import { useContacts } from "@/context/ContactsContext";
import TradeContactItem from "./TradeContactItem";

/**
 * UserContact Component
 *
 * Renders an individual contact item.
 * Displays the contact's name, phone numbers, and a "Trade" button.
 *
 * @param {UserContactProps} props - Contains a contact and a callback when trading is initiated.
 * @returns A JSX element representing the contact.
 */
const UserContact = () => {
  const { contacts } = useContacts();
  return (
    <FlatList
      data={contacts}
      keyExtractor={(item: Contact) => item.id?.toString() || Date.now().toString()}
      renderItem={({ item }) => <TradeContactItem contact={item} />}
    />
  );
};

export default UserContact;
