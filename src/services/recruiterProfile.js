import { supabase } from "../lib/supabaseClient";

// ✅ Get recruiter by email
export async function getRecruiterByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("email", email.trim().toLowerCase())
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

// ✅ Get recruiter by user_id (auth user id)
export async function getRecruiterByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return { success: false, error: error.message };    
    }

    if (!data) {
      return { success: false, error: "No recruiter profile found." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// ✅ Login recruiter with Supabase Auth
export async function loginRecruiter(email, password) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (authError) {
      console.error("❌ Auth error:", authError);
      return { 
        success: false, 
        error: authError.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : authError.message 
      };
    }

    if (!authData.user) {
      return { success: false, error: "Authentication failed. Please try again." };
    }

    // Step 2: Fetch recruiter profile
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (recruiterError) {
      console.error("❌ Database error:", recruiterError);
      await supabase.auth.signOut();
      return { success: false, error: "Error fetching recruiter profile." };
    }

    if (!recruiter) {
      // User exists in auth but not in recruiters table - might be wrong role
      await supabase.auth.signOut();
      return { success: false, error: "No recruiter account found. Please check if you are using the correct login portal." };
    }

    return {
      success: true,
      data: {
        id: recruiter.id,
        user_id: authData.user.id,
        name: recruiter.name,
        email: recruiter.email,
        state: recruiter.state,
        website: recruiter.website,
        verificationStatus: recruiter.verificationstatus,
        isActive: recruiter.isactive,
      },
      session: authData.session
    };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err.message };
  }
}
