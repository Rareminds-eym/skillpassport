import { supabase } from "../lib/supabaseClient";

// ✅ Get educator by email from school_educators table
export async function getEducatorByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("school_educators")
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
  const result = await getEducatorByEmail(email);

  if (!result.success) {
    return result;
  }

  const educator = result.data;

  return {
    success: true,
    data: {
      id: educator.id,
      name: educator.first_name && educator.last_name 
        ? `${educator.first_name} ${educator.last_name}`
        : educator.first_name || "Educator",
      email: educator.email,
      school_id: educator.school_id,
      specialization: educator.specialization,
      qualification: educator.qualification,
      experience_years: educator.experience_years,
      designation: educator.designation,
      department: educator.department,
      verification_status: educator.verification_status || "Pending",
      account_status: educator.account_status || "active",
    },
  };
}

// ✅ Create new educator profile (for signup)
export async function createEducatorProfile(educatorData) {
  try {
    const { data, error } = await supabase
      .from("school_educators")
      .insert([
        {
          first_name: educatorData.first_name,
          last_name: educatorData.last_name,
          email: educatorData.email,
          phone_number: educatorData.phone_number,
          specialization: educatorData.specialization,
          qualification: educatorData.qualification,
          experience_years: educatorData.experience_years,
          designation: educatorData.designation,
          department: educatorData.department,
          school_id: educatorData.school_id, // Required field
          user_id: educatorData.user_id, // Required field
          account_status: "active",
          verification_status: "Pending",
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
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        specialization: data.specialization,
        qualification: data.qualification,
        verification_status: data.verification_status,
        account_status: data.account_status,
      },
    };
  } catch (err) {
    console.error("❌ Unexpected error creating educator:", err);
    return { success: false, error: err.message };
  }
}