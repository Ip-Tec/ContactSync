import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Contacts from "expo-contacts";
import { supabase } from "@/lib/supabase";
import { deduplicatePhoneNumbers } from '@/utils/phoneUtils';
import { compareContacts, generateContactHash } from "@/hooks/contactUtils";

const ContactSync = ({ userId }: { userId: string }) => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      syncContacts();
    }
    setAppState(nextAppState);
  };

  // Fetch all contacts from database
  const fetchDbContacts = async () => {
    const { data, error } = await supabase
      .from("Contact")
      .select("*")
      .eq("user_id", userId);

    return data || [];
  };

  // Main sync function
  const syncContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") return;

      // Get device contacts
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
        ],
      });

      // Get database contacts
      const dbContacts = await fetchDbContacts();

      // Process each device contact
      for (const deviceContact of deviceContacts) {
        // Find matching DB contact
        const existingContact = dbContacts.find(
          (c) =>
            c.phone_number === deviceContact.phoneNumbers?.[0]?.number ||
            c.email === deviceContact.emails?.[0]?.email
        );

        if (existingContact) {
          // Update existing contact if needed
          const needsUpdate = compareContacts(existingContact, deviceContact);
          if (needsUpdate) {
            await supabase
              .from("Contact")
              .update(enrichContactData(existingContact, deviceContact))
              .eq("id", existingContact.id);
          }
        } else {
          // Insert new contact
          await supabase.from("Contact").insert({
            user_id: userId,
            ...enrichContactData({}, deviceContact),
            contact_hash: generateContactHash(deviceContact),
          });
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  // Enrich contact data
  const enrichContactData = (
    dbContact: any,
    deviceContact: Contacts.Contact
  ) => {
    return {
      name: dbContact.name || deviceContact.name,
      email: dbContact.email || deviceContact.emails?.[0]?.email,
      phone_number:
        dbContact.phone_number || deviceContact.phoneNumbers?.[0]?.number,
      // Add other fields as needed
    };
  };

  // Sync when app comes to foreground
  useEffect(() => {
    if (appState === "active") {
      syncContacts();
    }
  }, [appState]);

  // Initial sync
  useEffect(() => {
    syncContacts();
  }, []);

  return null; // This is a background component
};

export default ContactSync;

// uploadContacts.ts



/**
 * uploadUserContacts
 *
 * Uploads an array of device contacts to your DB for the given user.
 * Phone numbers are normalized and deduplicated according to your rules.
 *
 * @param userId - The UUID of the user.
 * @param contacts - Array of contacts from the device.
 *
 * Each contact should have (at minimum):
 * {
 *   name: string;
 *   phoneNumbers: Array<{ number: string, type?: string }>;
 *   emails: Array<{ email: string, type?: string }>;
 *   country?: string;
 *   country_code?: string;
 *   date_of_birth?: string; // in YYYY-MM-DD format
 *   sex?: string;
 *   contact_type?: "personal" | "work" | "family" | "other";
 * }
 *
 * @returns A Promise that resolves when all contacts have been processed.
 */
export async function uploadUserContacts(userId: string, contacts: any[]): Promise<void> {
  for (const contact of contacts) {
    // Normalize and deduplicate phone numbers.
    const rawPhones: string[] = (contact.phoneNumbers || []).map((p: any) => p.number);
    const uniquePhones = deduplicatePhoneNumbers(rawPhones);

    // Extract emails (normalization of emails can be added if needed)
    const emails: string[] = (contact.emails || []).map((e: any) => e.email);

    // Insert the contact into the "contacts" table.
    const { data: insertedContact, error: contactError } = await supabase
      .from('contacts')
      .insert([
        {
          user_id: userId,
          name: contact.name,
          country: contact.country || 'NIGERIA',
          country_code: contact.country_code || '234',
          date_of_birth: contact.date_of_birth, // Expecting YYYY-MM-DD
          sex: contact.sex,
          contact_type: contact.contact_type || 'personal',
        },
      ])
      .select()
      .single();

    if (contactError) {
      console.error("Error inserting contact:", contactError);
      continue; // Skip to the next contact if there's an error.
    }

    const contactId = insertedContact.id;
    if (!contactId) continue;

    // Insert phone numbers into the "phone_numbers" table.
    if (uniquePhones.length > 0) {
      const phoneInserts = uniquePhones.map((number) => ({
        contact_id: contactId,
        number, // Already normalized by deduplicatePhoneNumbers.
        type: 'mobile', // Default type; adjust if necessary.
      }));

      const { error: phoneError } = await supabase.from('phone_numbers').insert(phoneInserts);
      if (phoneError) {
        console.error("Error inserting phone numbers for contact", contact.name, phoneError);
      }
    }

    // Insert emails into the "emails" table.
    if (emails.length > 0) {
      const emailInserts = emails.map((email) => ({
        contact_id: contactId,
        email,
        type: 'personal', // Default type; adjust if necessary.
      }));

      const { error: emailError } = await supabase.from('emails').insert(emailInserts);
      if (emailError) {
        console.error("Error inserting emails for contact", contact.name, emailError);
      }
    }
  }
}
