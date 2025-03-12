import React, { useState, useEffect } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useContacts, Contact } from "@/context/ContactsContext";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { IconSymbol } from "./ui/IconSymbol";
import SellBottomSheet from "@/components/SellBottomSheet"; // Ensure this is imported from the correct path

// Extend your Contact type for tradeable contacts.
export interface TradeableContact extends Contact {}

// Helper: Determine if a contact is complete.
// Adjust the criteria as needed.
const isComplete = (contact: TradeableContact) => {
  return (
    contact.emails && contact.emails.length > 0 &&
    contact.phoneNumbers && contact.phoneNumbers.length > 0 &&
    (contact as any).sex && (contact as any).country
  );
};

interface TradeableContactsListProps {
  onTrade?: (contact: TradeableContact) => void;
}

const TradeableContactsList: React.FC<TradeableContactsListProps> = ({ onTrade }) => {
  const { contacts } = useContacts();
  const [dbIdentifiers, setDbIdentifiers] = useState<Set<string>>(new Set());
  const [filteredContacts, setFilteredContacts] = useState<TradeableContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingDb, setLoadingDb] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sellSheetVisible, setSellSheetVisible] = useState(false);
  const [contactToSell, setContactToSell] = useState<TradeableContact | null>(null);

  // Fetch DB contacts from Supabase and build a set of identifiers.
  useEffect(() => {
    const fetchDbContacts = async () => {
      setLoadingDb(true);
      const { data: dbContacts, error } = await supabase
        .from("Contact")
        .select("phone_number, email");
      if (error) {
        console.error("Error fetching DB contacts:", error.message);
      } else {
        const identifiers = new Set<string>();
        dbContacts?.forEach((dbContact: any) => {
          if (dbContact.phone_number) identifiers.add(dbContact.phone_number);
          if (dbContact.email) identifiers.add(dbContact.email);
        });
        setDbIdentifiers(identifiers);
      }
      setLoadingDb(false);
    };
    fetchDbContacts();
  }, []);

  // Filter local contacts to only include those that aren't in the DB.
  useEffect(() => {
    const filtered = contacts.filter((contact) => {
      let existsInDb = false;
      if (contact.phoneNumbers) {
        for (const p of contact.phoneNumbers) {
          if (p.number && dbIdentifiers.has(p.number)) {
            existsInDb = true;
            break;
          }
        }
      }
      if (!existsInDb && contact.emails) {
        for (const e of contact.emails) {
          if (e.email && dbIdentifiers.has(e.email)) {
            existsInDb = true;
            break;
          }
        }
      }
      return !existsInDb;
    }) as TradeableContact[];
    setFilteredContacts(filtered);
  }, [contacts, dbIdentifiers]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleTradeSingle = async (contact: TradeableContact) => {
    // If contact is incomplete, open the sell bottom sheet.
    if (!isComplete(contact)) {
      setContactToSell(contact);
      setSellSheetVisible(true);
      return;
    }
    setSyncing(true);
    const { error } = await supabase.from("Contact").insert([
      {
        name: contact.name,
        email:
          contact.emails && contact.emails.length > 0
            ? contact.emails[0].email
            : null,
        phone_number:
          contact.phoneNumbers && contact.phoneNumbers.length > 0
            ? contact.phoneNumbers[0].number
            : null,
      },
    ]);
    setSyncing(false);
    if (error) {
      Alert.alert("Trade Error", error.message);
    } else {
      Alert.alert("Trade Successful", `${contact.name} traded successfully.`);
      setFilteredContacts(filteredContacts.filter((c) => c.id !== contact.id));
      onTrade && onTrade(contact);
    }
  };

  const handleTradeSelected = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("No Contacts Selected", "Please select at least one contact to trade.");
      return;
    }
    setSyncing(true);
    let successCount = 0;
    await Promise.all(
      filteredContacts
        .filter((c) => selectedIds.has(c.id || ""))
        .map(async (contact) => {
          // For bulk trade, skip incomplete contacts.
          if (!isComplete(contact)) return;
          const { error } = await supabase.from("Contact").insert([
            {
              name: contact.name,
              email:
                contact.emails && contact.emails.length > 0
                  ? contact.emails[0].email
                  : null,
              phone_number:
                contact.phoneNumbers && contact.phoneNumbers.length > 0
                  ? contact.phoneNumbers[0].number
                  : null,
            },
          ]);
          if (!error) {
            successCount++;
          }
        })
    );
    setSyncing(false);
    Alert.alert("Trade Successful", `${successCount} contacts traded successfully.`);
    setFilteredContacts(filteredContacts.filter((c) => !selectedIds.has(c.id || "")));
    setSelectedIds(new Set());
  };

  const renderItem = ({ item }: { item: TradeableContact }) => {
    const initial = item.name ? item.name.charAt(0).toUpperCase() : "?";
    const isSelected = selectedIds.has(item.id || "");
    return (
      <View className="bg-white rounded-xl shadow p-4 mb-4 flex-row items-center">
        {/* Checkbox for selection */}
        <TouchableOpacity
          onPress={() => toggleSelect(item.id || "")}
          className="mr-4"
        >
          <View
            className={`w-6 h-6 border rounded ${
              isSelected
                ? "bg-green-500 border-green-500"
                : "bg-white border-gray-300"
            }`}
          />
        </TouchableOpacity>
        <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mr-4">
          <Text className="text-white text-xl p-2 font-bold">
            <IconSymbol name="person.fill" size={24} color="white" />
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-lg font-semibold">{item.name}</Text>
          {item.emails?.map((email, idx) => (
            <Text key={idx} className="text-sm text-gray-600">
              {email.email || "anonymous"}
            </Text>
          ))}
          {item.phoneNumbers?.map((phone, idx) => (
            <Text key={idx} className="text-sm text-gray-600">
              {phone.number || "anonymous"}
            </Text>
          ))}
        </View>
        {/* Conditionally render Trade or Sell button */}
        <TouchableOpacity
          onPress={() => handleTradeSingle(item)}
          className="bg-green-500 rounded-full px-4 py-2"
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold">
              {isComplete(item) ? "Trade" : "Sell"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loadingDb) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#000033" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredContacts}
        nestedScrollEnabled={true}
        keyExtractor={(item) => item.id || ""}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListFooterComponent={
          <View className="p-4">
            <TouchableOpacity
              onPress={handleTradeSelected}
              className="bg-green-600 rounded-full px-6 py-3"
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-center">
                  Trade Selected
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
      <SellBottomSheet
        visible={sellSheetVisible}
        contact={contactToSell}
        onClose={() => setSellSheetVisible(false)}
        onSubmit={(updatedContact) => {
          supabase
            .from("Contact")
            .insert([
              {
                name: updatedContact.name,
                email:
                  updatedContact.emails && updatedContact.emails.length > 0
                    ? updatedContact.emails[0].email
                    : null,
                phone_number:
                  updatedContact.phoneNumbers && updatedContact.phoneNumbers.length > 0
                    ? updatedContact.phoneNumbers[0].number
                    : null,
                country: updatedContact.country,
                sex: updatedContact.sex,
              },
            ])
            .then(({ error }) => {
              if (error) {
                Alert.alert("Sell Error", error.message);
              } else {
                Alert.alert("Sell Successful", `${updatedContact.name} sold successfully.`);
                setFilteredContacts(filteredContacts.filter((c) => c.id !== updatedContact.id));
              }
            });
        }}
      />
    </View>
  );
};

export default TradeableContactsList;
