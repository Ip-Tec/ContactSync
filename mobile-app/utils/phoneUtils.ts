// utils/phoneUtils.ts

export type PhoneMatchResult = {
  normalized: string;
  match: boolean;
};

/**
 * normalizePhone
 *
 * Helper function to remove hyphens, pluses, and spaces from a phone number and then
 * normalize it into an international format.
 *
 * If the number starts with "0", it assumes a local number and replaces it with "+234".
 * If it starts with "234" without the plus, it adds the plus.
 * Otherwise, it simply adds a plus in front.
 *
 * @param phone - The phone number string to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhone(phone: string): string {
  // Remove hyphens, pluses, and spaces.
  const stripped = phone.replace(/[-+\s]/g, "");
  // If the number starts with "0", assume it's a local number and replace with country code (+234)
  if (stripped.startsWith("0")) {
    return "+234" + stripped.slice(1);
  }
  // If it starts with the country code without the plus, add the plus.
  if (stripped.startsWith("234")) {
    return "+" + stripped;
  }
  // Fallback: add a plus in front.
  return "+" + stripped;
}

/**
 * matchPhoneNumbers
 *
 * Compares two phone numbers (as strings) after normalizing them.
 * It first checks for an exact normalized match, then checks if the last 6, 8, or 9 digits match.
 *
 * @param phone1 - The first phone number.
 * @param phone2 - The second phone number.
 * @returns An object with the normalized second phone number and a boolean indicating a match.
 */
export function matchPhoneNumbers(
  phone1: string,
  phone2: string
): PhoneMatchResult {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  // Remove non-digit characters (to focus on the numeric part)
  const digits1 = normalized1.replace(/\D/g, "");
  const digits2 = normalized2.replace(/\D/g, "");

  // If the fully normalized numbers are equal, it's an exact match.
  if (normalized1 === normalized2) {
    return { normalized: normalized2, match: true };
  }

  // Otherwise, check if any of the significant ending sequences match.
  // We check last 6, then 8, then 9 digits.
  if (
    digits1.slice(-6) === digits2.slice(-6) ||
    digits1.slice(-8) === digits2.slice(-8) ||
    digits1.slice(-9) === digits2.slice(-9)
  ) {
    return { normalized: normalized2, match: true };
  }

  return { normalized: normalized2, match: false };
}

/**
 * deduplicatePhoneNumbers
 *
 * Accepts a phone number or an array of phone numbers, normalizes them, and then
 * returns an array of unique phone numbers based on the matching rules.
 *
 * If any two numbers match (by exact normalized equality or by matching ending sequences),
 * only one instance is returned in the resulting array.
 *
 * @param phones - A single phone number string or an array of phone number strings.
 * @returns An array of unique normalized phone numbers.
 */
export function deduplicatePhoneNumbers(phones: string | string[]): string[] {
  // Ensure we work with an array.
  const phoneArray = typeof phones === "string" ? [phones] : phones;
  const uniqueNumbers: string[] = [];

  for (const phone of phoneArray) {
    // Normalize the current phone.
    const normalized = normalizePhone(phone);
    // Check against numbers already added.
    const duplicateFound = uniqueNumbers.some(
      (existing) => matchPhoneNumbers(normalized, existing).match
    );
    if (!duplicateFound) {
      uniqueNumbers.push(normalized);
    }
  }
  return uniqueNumbers;
}
