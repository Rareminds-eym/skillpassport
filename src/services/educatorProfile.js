import { supabase } from "../lib/supabaseClient";

// ✅ Get educator by email
export async function getEducatorByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("educators")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return { success: false, error: error.message };    
    }

    if (!data) {
      return { success: false, error: "No educator account found with this email. Please check your email or contact support." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// ✅ Login educator (ignores password, only checks email)
export async function loginEducator(email, password) {
  console.log("🔍 Searching for educator with email:", email);
  
  const result = await getEducatorByEmail(email);

  if (!result.success) {
    return result;
  }

  const educator = result.data;
  console.log("✅ Educator found:", educator);

  // ⚠️ Password ignored → accept any password
  return {
    success: true,
    data: {
      id: educator.id,
      name: educator.name || "Educator",
      email: educator.email,
      institution: educator.institution,
      department: educator.department,
      subjects: educator.subjects,
      verificationStatus: educator.verificationstatus || "pending",
      isActive: educator.isactive !== false, // default to true
    },
  };
}

// ✅ Create new educator profile (for signup)
export async function createEducatorProfile(educatorData) {
  try {
    const { data, error } = await supabase
      .from("educators")
      .insert([
        {
          name: educatorData.name,
          email: educatorData.email,
          institution: educatorData.institution,
          department: educatorData.department,
          subjects: educatorData.subjects,
          verificationstatus: "pending",
          isactive: true,
          joindate: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase error creating educator:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        institution: data.institution,
        department: data.department,
        subjects: data.subjects,
        verificationStatus: data.verificationstatus,
        isActive: data.isactive,
      },
    };
  } catch (err) {
    console.error("❌ Unexpected error creating educator:", err);
    return { success: false, error: err.message };
  }
}