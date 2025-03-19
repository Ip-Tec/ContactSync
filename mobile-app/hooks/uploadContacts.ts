// uploadContacts.ts

import { supabase } from "@/lib/supabase";
import {
  normalizePhone,
  matchPhoneNumbers,
  deduplicatePhoneNumbers,
} from "@/utils/phoneUtils";
import { useContacts } from "@/context/ContactsContext";

// Type definition for a device contact. Adjust if your useContacts hook returns a different shape.
export type DeviceContact = {
  id: string;
  name: string;
  // Assume phoneNumbers is an array of objects with a `number` property.
  phoneNumbers?: { number: string }[];
  // Assume emails is an array of objects with an `email` property.
  emails?: { email: string }[];
  // You can include other fields if needed.
};

/**
 * uploadDeviceContacts
 *
 * This async function uploads device contacts to the DB for the current user.
 * For each device contact, it checks whether a matching contact already exists in the DB
 * by comparing normalized phone numbers and emails. If a matching contact exists, it updates
 * missing fields (e.g. adds missing emails or phone numbers). Otherwise, it inserts a new contact
 * along with its associated emails and phone numbers.
 *
 * @param currentUserId - The currently authenticated user’s id.
 * @param deviceContacts  - An array of contacts from the device, typically from the useContacts hook.
 */
export async function uploadDeviceContacts(
  currentUserId: string
): Promise<void> {
  // Fetch device contacts
  const { contacts: deviceContacts } = useContacts();
  // Fetch the existing contacts for the current user from your DB.
  // We also select the associated emails and phone_numbers.
  const { data: existingContacts, error: fetchError } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      emails ( email ),
      phone_numbers ( number )
    `
    )
    .eq("user_id", currentUserId);

  if (fetchError) {
    console.error("Error fetching existing contacts:", fetchError.message);
    return;
  }

  // For each device contact, check if it already exists.
  for (const deviceContact of deviceContacts) {
    // Normalize the device phone numbers.
    const normalizedDevicePhones = deviceContact.phoneNumbers
      ? deduplicatePhoneNumbers(
          deviceContact.phoneNumbers.map((p) => normalizePhone(p.number ?? ""))
        )
      : [];

    // Normalize the device emails (lowercase and trimmed).
    const normalizedDeviceEmails = deviceContact.emails
      ? Array.from(
          new Set(
            deviceContact.emails.map((e) =>
              (e.email ?? "").trim().toLowerCase()
            )
          )
        )
      : [];

    // Try to find a matching contact in the DB.
    // We consider a match if any phone or email is found in the existing record.
    let matchingContact = existingContacts?.find((dbContact: any) => {
      // Extract and normalize phone numbers from the DB contact.
      const dbPhones =
        dbContact.phone_numbers?.map((p: any) => normalizePhone(p.number)) ||
        [];
      // Extract and lowercase emails from the DB contact.
      const dbEmails =
        dbContact.emails?.map((e: any) => e.email.trim().toLowerCase()) || [];

      // Check if any phone from the device matches any DB phone.
      const phoneMatch = normalizedDevicePhones.some((devicePhone) =>
        dbPhones.some(
          (dbPhone: string) => matchPhoneNumbers(devicePhone, dbPhone).match
        )
      );

      // Check if any device email exists in the DB emails.
      const emailMatch = normalizedDeviceEmails.some((deviceEmail) =>
        dbEmails.includes(deviceEmail)
      );

      return phoneMatch || emailMatch;
    });

    if (matchingContact) {
      // If a matching contact exists, update missing fields if needed.
      // For example, update the name if the device's name is different and DB record is empty.
      const updatePayload: any = {};

      if (
        deviceContact.name &&
        (!matchingContact.name ||
          matchingContact.name.trim().length === 0 ||
          matchingContact.name !== deviceContact.name)
      ) {
        updatePayload.name = deviceContact.name;
      }
      // Update the main contact record only if there are changes.
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from("contacts")
          .update(updatePayload)
          .eq("id", matchingContact.id);
        if (updateError) {
          console.error("Error updating contact:", updateError.message);
        }
      }

      // Insert any new emails that are not already in the DB.
      for (const email of normalizedDeviceEmails) {
        const emailExists = matchingContact.emails?.some(
          (e: any) => e.email.trim().toLowerCase() === email
        );
        if (!emailExists) {
          const { error: emailInsertError } = await supabase
            .from("emails")
            .insert({
              contact_id: matchingContact.id,
              email,
              type: "personal",
            });
          if (emailInsertError) {
            console.error("Error inserting email:", emailInsertError.message);
          }
        }
      }

      // Insert any new phone numbers that are not already in the DB.
      for (const phone of normalizedDevicePhones) {
        const phoneExists = matchingContact.phone_numbers?.some(
          (p: any) => matchPhoneNumbers(phone, p.number).match
        );
        if (!phoneExists) {
          const { error: phoneInsertError } = await supabase
            .from("phone_numbers")
            .insert({
              contact_id: matchingContact.id,
              number: phone,
              type: "mobile",
            });
          if (phoneInsertError) {
            console.error(
              "Error inserting phone number:",
              phoneInsertError.message
            );
          }
        }
      }
    } else {
      // If no matching contact exists, insert a new contact.
      const { data: newContactData, error: insertError } = await supabase
        .from("contacts")
        .insert({
          user_id: currentUserId,
          name: deviceContact.name,
          // You can set defaults or extract other fields from deviceContact if available.
          country: "NIGERIA",
          country_code: "234",
        })
        .select(); // Use .select() to get back the inserted record

      if (insertError) {
        console.error("Error inserting new contact:", insertError.message);
      } else if (newContactData && newContactData.length > 0) {
        const newContactId = newContactData[0].id;
        // Insert emails for the new contact.
        for (const email of normalizedDeviceEmails) {
          const { error: emailInsertError } = await supabase
            .from("emails")
            .insert({ contact_id: newContactId, email, type: "personal" });
          if (emailInsertError) {
            console.error(
              "Error inserting new email:",
              emailInsertError.message
            );
          }
        }
        // Insert phone numbers for the new contact.
        for (const phone of normalizedDevicePhones) {
          const { error: phoneInsertError } = await supabase
            .from("phone_numbers")
            .insert({
              contact_id: newContactId,
              number: phone,
              type: "mobile",
            });
          if (phoneInsertError) {
            console.error(
              "Error inserting new phone number:",
              phoneInsertError.message
            );
          }
        }
      }
    }
  }
}

/**
 * checkReciprocalContact
 *
 * This helper function checks if User A has User B's contact and whether User B has User A's contact.
 * It returns an object indicating the reciprocity status.
 *
 * @param userAId - The user id of User A.
 * @param userBId - The user id of User B.
 * @returns An object with two booleans: { userAHasB: boolean, userBHasA: boolean }.
 */
export async function checkReciprocalContact(
  userAId: string,
  userBId: string
): Promise<{ userAHasB: boolean; userBHasA: boolean }> {
  // Fetch User A's contacts (with their phone numbers and emails)
  const { data: userAContactsData, error: errorA } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      emails ( email ),
      phone_numbers ( number )
    `
    )
    .eq("user_id", userAId);
  if (errorA) {
    console.error("Error fetching User A contacts:", errorA.message);
    return { userAHasB: false, userBHasA: false };
  }

  // Fetch User B's contacts (with their phone numbers and emails)
  const { data: userBContactsData, error: errorB } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      emails ( email ),
      phone_numbers ( number )
    `
    )
    .eq("user_id", userBId);
  if (errorB) {
    console.error("Error fetching User B contacts:", errorB.message);
    return { userAHasB: false, userBHasA: false };
  }

  // For simplicity, assume that we have a way to identify the “real” contact info of a user.
  // For example, assume that each user has a primary phone number and email stored elsewhere.
  // Here, we use dummy values. Replace these with the actual contact details for each user.
  const userAPrimaryPhone = "+1234567890";
  const userAPrimaryEmail = "usera@example.com";
  const userBPrimaryPhone = "+1987654321";
  const userBPrimaryEmail = "userb@example.com";

  // Check if User A has User B's contact (by phone or email)
  const userAHasB = userAContactsData?.some((contact: any) => {
    const dbPhones =
      contact.phone_numbers?.map((p: any) => normalizePhone(p.number)) || [];
    const dbEmails =
      contact.emails?.map((e: any) => e.email.trim().toLowerCase()) || [];
    const phoneMatch = matchPhoneNumbers(
      userBPrimaryPhone,
      dbPhones[0] || ""
    ).match;
    const emailMatch = dbEmails.includes(
      userBPrimaryEmail.trim().toLowerCase()
    );
    return phoneMatch || emailMatch;
  });

  // Check if User B has User A's contact (by phone or email)
  const userBHasA = userBContactsData?.some((contact: any) => {
    const dbPhones =
      contact.phone_numbers?.map((p: any) => normalizePhone(p.number)) || [];
    const dbEmails =
      contact.emails?.map((e: any) => e.email.trim().toLowerCase()) || [];
    const phoneMatch = matchPhoneNumbers(
      userAPrimaryPhone,
      dbPhones[0] || ""
    ).match;
    const emailMatch = dbEmails.includes(
      userAPrimaryEmail.trim().toLowerCase()
    );
    return phoneMatch || emailMatch;
  });

  return { userAHasB: !!userAHasB, userBHasA: !!userBHasA };
}
