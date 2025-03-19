// useUniqueContacts.ts
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useContacts } from "@/context/ContactsContext";
import {
  normalizePhone,
  matchPhoneNumbers,
  deduplicatePhoneNumbers,
} from "@/utils/phoneUtils";

export interface DBContact {
  id: string | number;
  name: string;
  email?: string | null;
  country?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
  date_of_birth?: string | null;
  // other columns if needed
}

export function useUniqueContacts(limit: number, defaultCountryCode?: string) {
  const [dbContacts, setDbContacts] = useState<DBContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const { contacts: deviceContacts } = useContacts();

  useEffect(() => {
    async function fetchDBContacts() {
      setLoading(true);
      const { data, error } = await supabase.from("contacts").select("*");
      if (error) {
        console.error("Error fetching DB contacts:", error.message);
        setError(error.message);
      } else if (data) {
        setDbContacts(data as DBContact[]);
      }
      setLoading(false);
    }
    fetchDBContacts();
  }, []);

  // Build an array of normalized device phone numbers.
  const devicePhoneNumbers = useMemo(() => {
    const phoneNumbers: string[] = [];
    deviceContacts.forEach((contact) => {
      // Assume each device contact has an array "phoneNumbers"
      if (contact.phoneNumbers) {
        contact.phoneNumbers.forEach((p) => {
          if (p.number) {
            // Normalize using the phoneUtils normalizePhone
            phoneNumbers.push(normalizePhone(p.number));
          }
        });
      }
    });
    // Deduplicate using your utility.
    return deduplicatePhoneNumbers(phoneNumbers);
  }, [deviceContacts]);

  // Build a set of device emails (already lowercased).
  const deviceEmails = useMemo(() => {
    const emails: string[] = [];
    deviceContacts.forEach((contact) => {
      // Assume each device contact has an array "emails"
      if (contact.emails) {
        contact.emails.forEach((e) => {
          if (e.email) {
            emails.push(e.email.trim().toLowerCase());
          }
        });
      }
    });
    return Array.from(new Set(emails));
  }, [deviceContacts]);

  // Filter DB contacts to those that are "unique" compared to device contacts.
  const uniqueContacts = useMemo(() => {
    return dbContacts.filter((dbContact) => {
      // Normalize the DB phone number.
      const dbPhone = dbContact.phone_number
        ? normalizePhone(dbContact.phone_number)
        : "";
      const dbEmail = dbContact.email
        ? dbContact.email.trim().toLowerCase()
        : "";

      // If a DB phone exists, check if it matches any device phone.
      if (dbPhone) {
        const isPhoneDuplicate = devicePhoneNumbers.some((devicePhone) => {
          return matchPhoneNumbers(dbPhone, devicePhone).match;
        });
        if (isPhoneDuplicate) return false;
      }

      // If a DB email exists, check if it exists in the device emails.
      if (dbEmail && deviceEmails.includes(dbEmail)) {
        return false;
      }

      return true;
    });
  }, [dbContacts, devicePhoneNumbers, deviceEmails]);

  // Limit the number of unique contacts returned.
  const limitedUniqueContacts = useMemo(
    () => uniqueContacts.slice(0, limit),
    [uniqueContacts, limit]
  );

  return { uniqueContacts: limitedUniqueContacts, loading, error };
}

