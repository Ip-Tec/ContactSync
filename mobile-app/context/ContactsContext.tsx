// ContactsContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import * as Contacts from "expo-contacts";

export interface Contact {
  id: string;
  name: string;
  emails?: { email: string; label?: string }[];
  phoneNumbers?: { number: string }[];
  isInDb?: boolean;
  dob?: Date;
  country?: string;
  countryCode?: string;
  sex?: string;
}

interface ContactsContextProps {
  contacts: Contact[];
  loading: boolean;
  reloadContacts: () => void;
}

// Helper function to merge/normalize values.
// It accepts a string or an array of strings, applies a normalization function,
// filters out empty values, and returns a deduplicated array.
const mergeValues = (
  input: string | string[] | undefined,
  normalizeFn: (s: string) => string
): string[] => {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const normalized = arr.map(normalizeFn).filter(Boolean);
  return Array.from(new Set(normalized));
};

const ContactsContext = createContext<ContactsContextProps | undefined>(
  undefined
);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
        });

        // Filter out contacts without a valid name (ignore "", "null", or "unknown")
        const filteredData = (data || []).filter((contact) => {
          if (!contact.name) return false;
          const name = contact.name.trim().toLowerCase();
          return name !== "" && name !== "null" && name !== "unknown";
        });

        const uniqueContacts = filteredData.map((contact) => {
          // For name, we simply trim and take the first value.
          const mergedNameArray = mergeValues(contact.name, (s) => s.trim());
          const mergedName = mergedNameArray[0] || "";

          // For emails, map to string array then merge (trim, lowercase) and map back to objects.
          const mergedEmails =
            contact.emails &&
            mergeValues(
              contact.emails
                .map((e) => e.email)
                .filter((email): email is string => email !== undefined),
              (s) => s.trim().toLowerCase()
            ).map((email) => ({ email }));

          // For phone numbers, map to string array then merge (remove non-digits except +) and map back.
          const mergedPhones =
            contact.phoneNumbers &&
            mergeValues(
              contact.phoneNumbers
                .map((p) => p.number)
                .filter((number): number is string => number !== undefined),
              (s) => s.replace(/[^0-9+]/g, "").trim()
            ).map((number) => ({ number }));

          return {
            ...contact,
            name: mergedName,
            emails: mergedEmails || [],
            phoneNumbers: mergedPhones || [],
          };
        });

        setContacts(uniqueContacts as Contact[]);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <ContactsContext.Provider
      value={{ contacts, loading, reloadContacts: loadContacts }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error("useContacts must be used within a ContactsProvider");
  }
  return context;
};
