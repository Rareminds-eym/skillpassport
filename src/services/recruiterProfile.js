import { supabase } from "../lib/supabaseClient";

// ✅ Get recruiter by email (simple, no JSONB confusion)
export async function getRecruiterByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return { success: false, error: error.message };    
    }

    if (!data) {
      return { success: false, error: "No recruiter account found with this email. Please check your email or contact support." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// ✅ Login recruiter (ignores password, only checks email)
export async function loginRecruiter(email) {
  const result = await getRecruiterByEmail(email);

  if (!result.success) {
    return result;
  }

  const recruiter = result.data;

  // ⚠️ Password ignored → accept any password
  return {
    success: true,
    data: {
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      state: recruiter.state,
      website: recruiter.website,
      verificationStatus: recruiter.verificationstatus,
      isActive: recruiter.isactive,
    },
  };
}
