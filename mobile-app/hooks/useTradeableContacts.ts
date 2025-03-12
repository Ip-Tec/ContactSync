import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useContacts } from '@/context/ContactsContext';
import { Contact } from '@/types/explore-types';

const useTradeableContacts = (userId: string) => {
  const [existingContacts, setExistingContacts] = useState<string[]>([]);
  const { contacts } = useContacts();

  useEffect(() => {
    const fetchExistingContacts = async () => {
      const { data } = await supabase
        .from('Contact')
        .select('id')
        .eq('user_id', userId);
      setExistingContacts(data?.map(c => c.id) || []);
    };
    fetchExistingContacts();
  }, [userId]);

  const tradeableContacts = useMemo(() => 
    contacts.filter((c: Contact) => 
      c.id &&
      !existingContacts.includes(c.id) &&
      ((c.emails?.length ?? 0) > 0 || (c.phoneNumbers?.length ?? 0) > 0 || c.name)
    ),
    [contacts, existingContacts]
  );

  return { tradeableContacts };
};

export default useTradeableContacts;