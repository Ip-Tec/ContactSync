import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useContacts } from "@/context/ContactsContext";
import { ThemedText } from "./ThemedText";
import { IconSymbol } from "./ui/IconSymbol";
import { useCart } from "@/context/CartContext";

interface DBContact {
  id: number | string;
  sex: string;
  name: string;
  email: string[];
  phone_number: string[];
}

// Cache layer to prevent unnecessary re-fetches
const contactCache = new Map<number, DBContact[]>();

const RandomBuyContact = ({ contactLimit = 20 }: { contactLimit?: number }) => {
  const { getRandomContacts, contacts: deviceContacts } = useContacts();

  const { addToCart } = useCart();
  const [dbContacts, setDbContacts] = useState<DBContact[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(contactLimit);
  const prevLimitRef = useRef<number>(contactLimit);

  // Stabilize the fetch function
  const stableGetRandomContacts = useCallback(
    async (limit: number) => {
      return getRandomContacts(limit);
    },
    [getRandomContacts] // Ensure this dependency is stable in your context
  );

  // Stabilized fetch function
  const fetchDBContacts = useCallback(async () => {
    setLoadingDb(true);

    // Check cache first
    if (contactCache.has(currentLimit)) {
      setDbContacts(contactCache.get(currentLimit)!);
      setLoadingDb(false);
      return;
    }

    try {
      const contacts = await getRandomContacts(currentLimit);
      const mappedContacts = contacts.map((c) => ({
        id: c.id,
        name: c.name,
        sex: c.sex,
        email: c.emails?.map((e: any) => e.email) || [],
        phone_number: c.phone_numbers?.map((p: any) => p.number) || [],
      }));

      contactCache.set(currentLimit, mappedContacts);
      setDbContacts(mappedContacts);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingDb(false);
    }
  }, [currentLimit, getRandomContacts]);

  useEffect(() => {
    if (prevLimitRef.current !== currentLimit) {
      fetchDBContacts();
      prevLimitRef.current = currentLimit;
    }
  }, [currentLimit, fetchDBContacts]);
  useEffect(() => {
    fetchDBContacts();
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    contactCache.delete(currentLimit); // Clear cache for current limit
    await fetchDBContacts();
    setRefreshing(false);
  }, [currentLimit, fetchDBContacts]);

  // Memoized device identifiers calculation
  const deviceIdentifiers = useMemo(() => {
    const identifiers = new Set<string>();
    deviceContacts.forEach((contact) => {
      contact.phoneNumbers?.forEach((p) => {
        if (p.number) identifiers.add(p.number);
      });
      contact.emails?.forEach((e) => {
        if (e.email) identifiers.add(e.email);
      });
    });
    return identifiers;
  }, [deviceContacts]);

  // Optimized contact filtering
  const filteredDBContacts = useMemo(() => {
    return dbContacts.filter((c) => {
      const hasPhoneMatch = c.phone_number.some((p) =>
        deviceIdentifiers.has(p)
      );
      const hasEmailMatch = c.email.some((e) => deviceIdentifiers.has(e));
      return !hasPhoneMatch && !hasEmailMatch;
    });
  }, [dbContacts, deviceIdentifiers]);

  const loadMoreContacts = useCallback(() => {
    setCurrentLimit((prev) => {
      const newLimit = prev + 20;
      contactCache.delete(newLimit); // Clear cache for new limit
      return newLimit;
    });
  }, []);

  // Stable cart handler with animation delay
  const handleAddToCart = useCallback(
    (contact: DBContact) => {
      addToCart({
        id: contact.id.toString(),
        contact,
        phoneNumbers: contact.phone_number,
        emails: contact.email,
        sex: contact.sex,
      });
    },
    [addToCart] // Make sure this dependency is stable
  );

  if (loadingDb) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="mt-4 text-gray-600">Loading contacts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white p-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {filteredDBContacts.map((contact) => (
        <View key={contact.id} className="bg-white rounded-xl shadow p-6 mb-4">
          <ThemedText type="title" className="text-center mb-2">
            {contact.name}
          </ThemedText>
          <Text className="text-center mb-2">{contact.sex}</Text>
          {contact.email.length > 0 && (
            <Text className="text-center text-2xl text-gray-600 mb-1">
              <IconSymbol name="envelope.fill" size={28} color="#000" />
              {(() => {
                const email = contact.email[0];
                if (!email) return null;
                const atIndex = email.indexOf("@");
                if (atIndex === -1) return email;
                return (
                  email.slice(0, 3) +
                  email.slice(3, atIndex).replace(/./g, "*") +
                  email.slice(atIndex)
                );
              })()}
            </Text>
          )}
          {contact.phone_number.length > 0 && (
            <Text className="text-center text-gray-600 mb-1">
              {(() => {
                const phone = contact.phone_number[0];
                if (typeof phone === "string" && phone.length > 5) {
                  return (
                    phone.slice(0, 4) +
                    "*".repeat(phone.length - 5) +
                    phone.slice(-3)
                  );
                }
                return phone;
              })()}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => handleAddToCart(contact)}
            className="bg-blue-500 rounded-full px-6 py-3 mt-2"
          >
            <Text className="text-white font-bold text-center">
              Add to Cart
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={loadMoreContacts}
        className="bg-blue-500 rounded-full px-6 py-3 mt-4 mb-4"
      >
        <Text className="text-white font-bold text-center">
          Load More Contacts
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default memo(RandomBuyContact);
