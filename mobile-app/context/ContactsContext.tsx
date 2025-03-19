// ContactsContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import * as Contacts from "expo-contacts";
import { supabase } from "@/lib/supabase";
import { Contact as ContactType } from "@/types/exploreTypes";
import { Alert } from "react-native";

export interface Contact extends Contacts.Contact {
  // Expo's Contact already has required properties like `contactType`
  // Add your custom properties as optional:
  isInDb?: boolean;
  dob?: Date;
  country?: string;
  countryCode?: string;
  sex?: string;
}

// Helper function to merge/normalize values.
// It accepts a string or an array of strings, applies a normalization function,
// filters out empty values, and returns a deduplicated array.
function mergeValues(
  input: string | string[] | undefined,
  normalizeFn: (s: string) => string
): string[] {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const normalized = arr.map(normalizeFn).filter(Boolean);
  return Array.from(new Set(normalized));
}

interface ContactsContextProps {
  contacts: Contact[];
  loading: boolean;
  reloadContacts: () => void;
  getRandomContacts: (limit: number) => Promise<any[]>;
  addContact: (contactData: ContactType) => Promise<string | null>;
  deleteContact: (contactId: number) => Promise<boolean>;
  updateContact: (contactId: number, updates: ContactType) => Promise<boolean>;
  getContactById: (contactId: string) => Promise<ContactType | null>;
  getContactsByPhoneNumber: (phoneNumber: string) => Promise<ContactType[]>;
}

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

        const filteredData = (data || []).filter((contact) => {
          if (!contact.name) return false;
          const name = contact.name.trim().toLowerCase();
          return name !== "" && name !== "null" && name !== "unknown";
        });

        const uniqueContacts = filteredData.map((contact) => {
          const mergedNameArray = [contact.name.trim()];
          const mergedName = mergedNameArray[0] || "";

          // For emails, map each email object to its email string.
          const mergedEmails =
            contact.emails &&
            mergeValues(
              contact.emails
                .map((e) => e.email)
                .filter((email): email is string => email !== undefined),
              (s) => s.trim().toLowerCase()
            ).map((email) => ({ email }));

          // For phone numbers, map each phone object to its number.
          const mergedPhones =
            contact.phoneNumbers &&
            mergeValues(
              contact.phoneNumbers
                .map((p) => p.number)
                .filter((n): n is string => n !== undefined),
              (s) => s.replace(/[^0-9+]/g, "").trim()
            ).map((number) => ({ number }));

          return {
            ...contact,
            name: mergedName,
            emails: mergedEmails || [],
            phoneNumbers: mergedPhones || [],
          } as Contact;
        });

        setContacts(uniqueContacts);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const getRandomContacts = useCallback(
    async (limit: number = 20): Promise<any[]> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, phone_numbers(*), emails(*)")
        .limit(limit);

      if (error) {
        Alert.alert("Error fetching contacts:", error.message);
        return [];
      }
      return data?.sort(() => Math.random() - 0.5) || [];
    },
    []
  );

  const addContact = async (contactData: {
    name: string;
    country?: string;
    country_code?: string;
    date_of_birth?: string;
    sex?: string;
    contact_type?: "personal" | "work" | "family" | "other";
    phones: { number: string; type: "mobile" | "home" | "work" | "other" }[];
    emails: { email: string; type: "personal" | "work" | "other" }[];
  }) => {
    // Insert the main contact
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name: contactData.name,
          country: contactData.country,
          country_code: contactData.country_code,
          date_of_birth: contactData.date_of_birth,
          sex: contactData.sex,
          contact_type: contactData.contact_type || "personal",
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting contact:", error.message);
      return null;
    }

    const contactId = data[0]?.id;
    if (!contactId) return null;

    // Insert phone numbers
    if (contactData.phones.length > 0) {
      await supabase.from("phone_numbers").insert(
        contactData.phones.map((phone) => ({
          contact_id: contactId,
          number: phone.number,
          type: phone.type,
        }))
      );
    }

    // Insert emails
    if (contactData.emails.length > 0) {
      await supabase.from("emails").insert(
        contactData.emails.map((email) => ({
          contact_id: contactId,
          email: email.email,
          type: email.type,
        }))
      );
    }

    return contactId;
  };

  const updateContact = async (
    contactId: number,
    updates: {
      name?: string;
      country?: string;
      country_code?: string;
      date_of_birth?: string;
      sex?: string;
      contact_type?: "personal" | "work" | "family" | "other";
      phones?: {
        id?: number;
        number: string;
        type: "mobile" | "home" | "work" | "other";
      }[];
      emails?: {
        id?: number;
        email: string;
        type: "personal" | "work" | "other";
      }[];
    }
  ) => {
    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contactId);

    if (error) {
      console.error("Error updating contact:", error.message);
      return false;
    }

    // Update or insert phone numbers
    if (updates.phones) {
      for (let phone of updates.phones) {
        if (phone.id) {
          // Update existing phone
          await supabase.from("phone_numbers").update(phone).eq("id", phone.id);
        } else {
          // Insert new phone
          await supabase
            .from("phone_numbers")
            .insert([{ ...phone, contact_id: contactId }]);
        }
      }
    }

    // Update or insert emails
    if (updates.emails) {
      for (let email of updates.emails) {
        if (email.id) {
          // Update existing email
          await supabase.from("emails").update(email).eq("id", email.id);
        } else {
          // Insert new email
          await supabase
            .from("emails")
            .insert([{ ...email, contact_id: contactId }]);
        }
      }
    }

    return true;
  };

  const deleteContact = async (contactId: number) => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId);

    if (error) {
      console.error("Error deleting contact:", error.message);
      return false;
    }

    return true;
  };

  async function getContactsByPhoneNumber(userPhone: string) {
    // Make sure the userPhone is normalized as per your rules.
    const { data, error } = await supabase
      .rpc('get_contacts_by_phone', { p_phone: userPhone });
  
    if (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
    return data;
  }
  const getContactById = async (contactId: string) => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*, phone_numbers(*), emails(*)")
      .eq("id", contactId)
      .single();

    if (error) {
      console.error("Error fetching contact:", error.message);
      return null;
    }

    return data;
  };
  return (
    <ContactsContext.Provider
      value={{
        contacts,
        loading,
        reloadContacts: loadContacts,
        getRandomContacts,
        addContact,
        updateContact,
        deleteContact,
        getContactsByPhoneNumber,
        getContactById
      }}
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
