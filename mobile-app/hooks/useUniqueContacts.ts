// Updated useUniqueContacts.ts
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useContacts } from "@/context/ContactsContext";
import {
  normalizePhone,
  matchPhoneNumbers,
  deduplicatePhoneNumbers,
} from "@/utils/phoneUtils";
import * as FileSystem from 'expo-file-system';

export interface DBContact {
  id: string | number;
  name: string;
  email?: string | null;
  country?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
  date_of_birth?: string | null;
}

interface ContactFile {
  id: string;
  created_at: string;
  name: string;
}

export function useUniqueContacts(limit: number, defaultCountryCode?: string) {
  const [contactFiles, setContactFiles] = useState<ContactFile[]>([]);
  const [uniqueContacts, setUniqueContacts] = useState<DBContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const { contacts: deviceContacts } = useContacts();

  // Get normalized device identifiers
  const deviceIdentifiers = useMemo(() => {
    const identifiers = new Set<string>();
    deviceContacts.forEach(contact => {
      contact.phoneNumbers?.forEach(p => {
        if (p.number) identifiers.add(normalizePhone(p.number));
      });
      contact.emails?.forEach(e => {
        if (e.email) identifiers.add(e.email.toLowerCase().trim());
      });
    });
    return identifiers;
  }, [deviceContacts]);

  // Fetch contact files from storage
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('contact_files')
          .list('', {
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (error) throw error;
        setContactFiles(data as ContactFile[]);
      } catch (err) {
        setError('Failed to fetch contact files');
      }
    };

    fetchFiles();
  }, []);

  // Process files to find unique contacts
  useEffect(() => {
    const processFiles = async () => {
      if (!contactFiles.length) return;

      try {
        let collectedContacts: DBContact[] = [];
        
        for (const file of contactFiles) {
          if (collectedContacts.length >= limit) break;

          // Download file
          const { data, error } = await supabase.storage
            .from('contact_files')
            .download(file.name);

          if (error || !data) continue;

          // Read file content
          const content = await data.text();
          const contacts = parseFileContent(content, file.name);

          // Filter unique contacts
          const unique = contacts.filter(contact => {
            const phone = contact.phone_number ? normalizePhone(contact.phone_number) : '';
            const email = contact.email?.toLowerCase().trim() || '';
            
            return !(
              (phone && deviceIdentifiers.has(phone)) ||
              (email && deviceIdentifiers.has(email))
            );
          });

          collectedContacts = [...collectedContacts, ...unique];
        }

        // Trim to limit and set state
        setUniqueContacts(collectedContacts.slice(0, limit));
        setLoading(false);

      } catch (err) {
        setError('Failed to process contact files');
        setLoading(false);
      }
    };

    if (contactFiles.length) processFiles();
  }, [contactFiles, deviceIdentifiers, limit]);

  // File content parser
  const parseFileContent = (content: string, fileName: string): DBContact[] => {
    try {
      if (fileName.endsWith('.csv')) {
        return parseCSV(content);
      } else if (fileName.endsWith('.vcf')) {
        return parseVCF(content);
      }
      return [];
    } catch (err) {
      console.error('Error parsing file:', err);
      return [];
    }
  };

  // CSV parser
  const parseCSV = (content: string): DBContact[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const contact: DBContact = { id: Math.random(), name: '' };
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        switch(header.toLowerCase()) {
          case 'name': contact.name = value; break;
          case 'email': contact.email = value; break;
          case 'phone': contact.phone_number = value; break;
          case 'country': contact.country = value; break;
        }
      });
      
      return contact;
    });
  };

  // VCF parser
  const parseVCF = (content: string): DBContact[] => {
    const cards = content.split('BEGIN:VCARD').slice(1);
    return cards.map(card => {
      const contact: DBContact = { id: Math.random(), name: '' };
      const lines = card.split('\n');
      
      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          contact.name = line.split(':')[1]?.trim();
        } else if (line.startsWith('TEL;')) {
          contact.phone_number = line.split(':')[1]?.trim();
        } else if (line.startsWith('EMAIL;')) {
          contact.email = line.split(':')[1]?.trim();
        }
      });
      
      return contact;
    });
  };

  return { uniqueContacts, loading, error };
}