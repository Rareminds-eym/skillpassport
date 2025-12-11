import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEventUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  registrationId: string;
  metadata?: Record<string, unknown>;
}

// Generate a random password
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Send welcome email with login credentials using Brevo (Sendinblue)
async function sendWelcomeEmail(
  email: string,
  firstName: string,
  temporaryPassword: string,
  planName: string,
  loginUrl: string = 'https://skillpassport.rareminds.in/login'
): Promise<{ success: boolean; error?: string }> {
  const BREVO_API_KEY = Deno.env.get("BREVO_EMAIL");
  
  if (!BREVO_API_KEY) {
    console.log("BREVO_EMAIL API key not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Skill Passport</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Welcome to Skill Passport!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for your purchase! Your <strong>${planName}</strong> subscription is now active. Your account has been created successfully.
              </p>
              
              <!-- Credentials Box -->
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Email:</td>
                    <td style="padding: 8px 0; color: #1F2937; font-size: 14px; font-weight: 600;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Temporary Password:</td>
                    <td style="padding: 8px 0; color: #1F2937; font-size: 14px; font-weight: 600; font-family: monospace; background-color: #E5E7EB; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Warning -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Login to Your Account →
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    // Brevo (Sendinblue) API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Skill Passport",
          email: "dev@rareminds.in"
        },
        to: [{ email: email, name: firstName }],
        subject: `Welcome to Skill Passport - Your ${planName} is Active! 🎉`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Brevo API error:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log(`Welcome email sent successfully to ${email}, messageId: ${data.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse request body
    const { email, firstName, lastName, role, phone, registrationId, metadata }: CreateEventUserRequest = await req.json();

    // Validate required fields
    if (!email || !firstName || !role || !registrationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, firstName, role, registrationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating user for event registration: ${registrationId}, email: ${email}, role: ${role}`);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log(`Auth user already exists: ${email}`);
      
      // Check if user exists in public.users table
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', existingUser.id)
        .single();

      if (!publicUser) {
        // Create public.users record if missing
        const roleMapping: Record<string, string> = {
          'school-student': 'school_student',
          'college-student': 'college_student',
          'university-student': 'college_student',
          'educator': 'college_educator',
          'school-admin': 'school_admin',
          'college-admin': 'college_admin',
          'university-admin': 'university_admin',
          'recruiter': 'recruiter',
        };
        const dbRole = roleMapping[role] || 'college_student';

        const { error: usersError } = await supabase
          .from('users')
          .insert({
            id: existingUser.id,
            email: email,
            firstName: firstName,
            lastName: lastName || '',
            role: dbRole,
            phone: phone || null,
            isActive: true,
            metadata: {
              registration_id: registrationId,
              ...metadata
            }
          });

        if (usersError) {
          console.error(`Failed to create public.users record for existing auth user:`, usersError);
        } else {
          console.log(`Created public.users record for existing auth user ${existingUser.id}`);
        }
      }

      // Update registration with existing user ID
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({ user_id: existingUser.id })
        .eq('id', registrationId);

      if (updateError) {
        console.error(`Failed to update registration ${registrationId} with user_id:`, updateError);
      } else {
        console.log(`Successfully updated registration ${registrationId} with user_id: ${existingUser.id}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "User already exists",
          userId: existingUser.id,
          isExisting: true,
          registrationUpdated: !updateError
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const temporaryPassword = generatePassword();

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName || '',
        full_name: `${firstName} ${lastName || ''}`.trim(),
        role: role,
        phone: phone || '',
        registration_id: registrationId,
        ...metadata
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Auth user created successfully: ${newUser.user.id}`);

    // Map role from frontend format to database enum format
    const roleMapping: Record<string, string> = {
      'school-student': 'school_student',
      'college-student': 'college_student',
      'university-student': 'college_student', // Map to college_student as there's no university_student
      'educator': 'college_educator',
      'school-admin': 'school_admin',
      'college-admin': 'college_admin',
      'university-admin': 'university_admin',
      'recruiter': 'recruiter',
    };
    const dbRole = roleMapping[role] || 'college_student';

    // Create record in public.users table (required for foreign key)
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        firstName: firstName,
        lastName: lastName || '',
        role: dbRole,
        phone: phone || null,
        temporary_password: temporaryPassword,
        password_changed: false,
        isActive: true,
        metadata: {
          registration_id: registrationId,
          ...metadata
        }
      });

    if (usersError) {
      console.error(`Failed to create public.users record:`, usersError);
      // Don't fail the whole operation, user is created in auth
    } else {
      console.log(`Created public.users record for ${newUser.user.id}`);
    }

    // Update registration with new user ID
    const { data: updateData, error: updateError } = await supabase
      .from('event_registrations')
      .update({ user_id: newUser.user.id })
      .eq('id', registrationId)
      .select('id, user_id');

    if (updateError) {
      console.error(`Failed to update registration ${registrationId} with user_id:`, updateError);
    } else {
      console.log(`Successfully updated registration:`, updateData);
    }

    // Send welcome email with login credentials
    const planName = metadata?.plan as string || 'Skill Passport';
    const emailResult = await sendWelcomeEmail(
      email,
      firstName,
      temporaryPassword,
      planName
    );

    // Return success with temporary password
    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        userId: newUser.user.id,
        temporaryPassword: temporaryPassword,
        isExisting: false,
        publicUserCreated: !usersError,
        registrationUpdated: !updateError,
        updateResult: updateData,
        emailSent: emailResult.success
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-event-user:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to create user. Please try again later."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
