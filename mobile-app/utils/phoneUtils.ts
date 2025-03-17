// utils/phoneUtils.ts

export type PhoneMatchResult = {
    normalized: string;
    match: boolean;
  };
  
  export function matchPhoneNumbers(
    phone1: string,
    phone2: string
  ): PhoneMatchResult {
    // Helper to remove '-', '+', and spaces, then normalize to international format
    const normalizePhone = (phone: string): string => {
      // Remove hyphens, pluses, and spaces
      const stripped = phone.replace(/[-+\s]/g, "");
      // If the number starts with "0", assume it's a local number and replace with country code (+234)
      if (stripped.startsWith("0")) {
        return "+234" + stripped.slice(1);
      }
      // If it starts with the country code without the plus, add the plus
      if (stripped.startsWith("234")) {
        return "+" + stripped;
      }
      // Fallback: add a plus in front
      return "+" + stripped;
    };
  
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
  