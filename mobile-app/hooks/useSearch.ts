import { useState, useMemo } from "react";

export const useSearch = <T extends unknown>(
  data: T[],
  searchFn: (item: T, query: string) => boolean
) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) => searchFn(item, searchQuery));
  }, [data, searchQuery, searchFn]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
  };
};
