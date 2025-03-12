import { useMemo } from "react";

interface ContactFields {
  names?: string | string[];
  phones?: string | string[];
  emails?: string | string[];
}

interface MergedContact {
  mergedNames: string[];
  mergedPhones: string[];
  mergedEmails: string[];
}

export function useMergeContactFields({
  names,
  phones,
  emails,
}: ContactFields): MergedContact {
  // Helper function: Convert a string or an array of strings to an array.
  const normalizeInput = (input?: string | string[]): string[] => {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
  };

  // Process names: trim and deduplicate.
  const mergedNames = useMemo(() => {
    const arr = normalizeInput(names);
    const normalized = arr.map((name) => name.trim()).filter(Boolean);
    return Array.from(new Set(normalized));
  }, [names]);

  // Process phones: remove unwanted characters and deduplicate.
  const mergedPhones = useMemo(() => {
    const arr = normalizeInput(phones);
    const normalized = arr
      .map((phone) => phone.replace(/[^0-9+]/g, ""))
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }, [phones]);

  // Process emails: trim, lowercase, and deduplicate.
  const mergedEmails = useMemo(() => {
    const arr = normalizeInput(emails);
    const normalized = arr
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }, [emails]);

  return { mergedNames, mergedPhones, mergedEmails };
}
