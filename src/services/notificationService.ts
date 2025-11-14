/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "../lib/supabaseClient";
import { NotificationType } from "../hooks/useNotifications";

// ✅ helper to check UUID
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ✅ Resolve user ID from email or UUID
async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  // Try educators first
  const { data: educatorData } = await supabase
    .from("school_educators")
    .select("user_id")
    .ilike("email", identifier)
    .maybeSingle();

  if (educatorData?.user_id) return educatorData.user_id;

  // Try students
  const { data: studentData } = await supabase
    .from("students")
    .select("user_id")
    .ilike("email", identifier)
    .maybeSingle();

  if (studentData?.user_id) return studentData.user_id;

  // Try recruiters
 // Try recruiters
const { data: recruiterData } = await supabase
  .from("recruiters")
  .select("user_id")
  .ilike("email", identifier)
  .maybeSingle();

if (recruiterData?.user_id) return recruiterData.user_id;



  // Try users (admins)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .ilike("email", identifier)
    .maybeSingle();

  return userData?.id ?? null;
}

// ✅ Universal notification creator
export async function createNotification(
  recipientIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    const recipientId = await resolveUserId(recipientIdentifier);

    if (!recipientId) {
      return { success: false, error: "Recipient not found" };
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          recipient_id: recipientId,
          type,
          title,
          message,
          read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create notification",
    };
  }
}

// ✅ Batch notification creator (for multiple recipients)
export async function createBatchNotifications(
  recipientIdentifiers: string[],
  notificationType: NotificationType,
  title: string,
  message: string
) {
  try {
    const notifications = [];

    for (const identifier of recipientIdentifiers) {
      const recipientId = await resolveUserId(identifier);

      if (recipientId) {
        notifications.push({
          recipient_id: recipientId,
          type: notificationType,
          title,
          message,
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (notifications.length === 0) {
      return { success: false, error: "No valid recipients found" };
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) throw error;

    return { success: true, data, count: notifications.length };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create batch notifications",
    };
  }
}

// ✅ Legacy support aliases for backward compatibility
export async function createRecruiterNotification(
  recruiterIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(recruiterIdentifier, type, title, message);
}

export async function createEducatorNotification(
  educatorIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(educatorIdentifier, type, title, message);
}

export async function createStudentNotification(
  studentIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(studentIdentifier, type, title, message);
}

export async function createAdminNotification(
  adminIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(adminIdentifier, type, title, message);
}