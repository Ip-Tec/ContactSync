// PhoneNumberUtils.ts
/**
 * Removes the specified country calling code from a phone number.
 * If a countryCode (including the leading "+") is provided and the phone
 * starts with that, it replaces it with a "0" (common in many locales).
 * Otherwise, if the phone starts with a "+", it simply removes it.
 *
 * @param phone - The original phone number.
 * @param countryCode - Optional. The country calling code to remove (e.g., "+234").
 * @returns The normalized phone number.
 */
export function removeCountryCode(phone: string, countryCode?: string): string {
    if (countryCode && phone.startsWith(countryCode)) {
      return "0" + phone.slice(countryCode.length);
    }
    if (phone.startsWith("+")) {
      return phone.slice(1);
    }
    return phone;
  }
  