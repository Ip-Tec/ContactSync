// useUniqueContacts.ts
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useContacts } from "@/context/ContactsContext";
import { removeCountryCode } from "@/hooks/PhoneNumberUtils";

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

  const deviceIdentifiers = useMemo(() => {
    const identifiers = new Set<string>();
    deviceContacts.forEach((contact) => {
      // Assume each device contact has arrays "phoneNumbers" and "emails"
      if (contact.phoneNumbers) {
        contact.phoneNumbers.forEach((p) => {
          if (p.number) {
            const normalized = defaultCountryCode
              ? removeCountryCode(p.number, defaultCountryCode)
              : p.number;
            identifiers.add(normalized);
          }
        });
      }
      if (contact.emails) {
        contact.emails.forEach((e) => {
          if (e.email) {
            identifiers.add(e.email.trim().toLowerCase());
          }
        });
      }
    });
    return identifiers;
  }, [deviceContacts, defaultCountryCode]);

  const uniqueContacts = useMemo(() => {
    return dbContacts.filter((dbContact) => {
      const dbPhone = dbContact.phone_number
        ? defaultCountryCode
          ? removeCountryCode(dbContact.phone_number, defaultCountryCode)
          : dbContact.phone_number
        : "";
      const dbEmail = dbContact.email
        ? dbContact.email.trim().toLowerCase()
        : "";
      if (dbPhone && deviceIdentifiers.has(dbPhone)) return false;
      if (dbEmail && deviceIdentifiers.has(dbEmail)) return false;
      return true;
    });
  }, [dbContacts, deviceIdentifiers, defaultCountryCode]);

  const limitedUniqueContacts = useMemo(
    () => uniqueContacts.slice(0, limit),
    [uniqueContacts, limit]
  );

  return { uniqueContacts: limitedUniqueContacts, loading, error };
}
