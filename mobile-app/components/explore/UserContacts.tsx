// UserContact.tsx
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Contact } from "@/types/explore-types";
import { useContacts } from "@/context/ContactsContext";
import TradeContactItem from "@/components/explore/TradeContactItem";
import { useSearch } from "@/hooks/useSearch";

/**
 * UserContact Component
 *
 * Renders an individual contact item.
 * Displays the contact's name, phone numbers, and a "Trade" button.
 *
 * @param {UserContactProps} props - Contains a contact and a callback when trading is initiated.
 * @returns A JSX element representing the contact.
 */

interface UserContactProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
}

const UserContact: React.FC<UserContactProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const { contacts } = useContacts();

  // State for the search query.
  // Filter contacts using the search query from the parent.

  // If no query is provided, all contacts are returned.
  const filteredData = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter((item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  return (
    <FlatList
      data={filteredData}
      keyExtractor={(item: Contact) =>
        item.id?.toString() || Date.now().toString()
      }
      renderItem={({ item }) => <TradeContactItem contact={item} />}
    />
  );
};

export default UserContact;
