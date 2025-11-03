/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "../lib/supabaseClient";
import { NotificationType } from "../hooks/useNotifications"; // reuse the type

// ✅ helper to check UUID
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ✅ resolve recruiter by ID or email
export async function resolveRecruiterId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  const { data, error } = await supabase
    .from("recruiters")
    .select("id")
    .ilike("email", identifier)
    .maybeSingle();

  if (error) {
    console.error("resolveRecruiterId error:", error);
    return null;
  }
  return data?.id ?? null;
}

// ✅ reusable notification creator
export async function createNotification(
  recruiterIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    const recruiterId = await resolveRecruiterId(recruiterIdentifier);

    if (!recruiterId) {
      return { success: false, error: "Recruiter not found" };
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          recruiter_id: recruiterId,
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
