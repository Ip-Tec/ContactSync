import { useSearch } from "@/hooks/useSearch";

const useExploreSearch = (tradeableContacts: any[], query: string) => {
  return useSearch(
    tradeableContacts,
    (contact) =>
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      (contact.emails?.some((e: any) => e.email.includes(query))) ||
      (contact.phoneNumbers?.some((p: any) => p.number.includes(query)))
  );
};

export default useExploreSearch;