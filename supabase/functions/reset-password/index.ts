import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, email, otp, newPassword } = await req.json()

        if (action === 'send') {
            if (!email) throw new Error('Email is required')

            // Generate 6-digit OTP
            const token = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

            // Store in DB
            const { error: dbError } = await supabaseClient
                .from('reset_tokens')
                .insert({ email, token, expires_at: expiresAt })

            if (dbError) throw dbError

            // Send Email via Resend
            const resendApiKey = Deno.env.get('Emails')
            if (!resendApiKey) {
                console.error('Resend API key not found in secrets')
                throw new Error('Server configuration error')
            }

            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                    from: 'SkillPassport <onboarding@resend.dev>', // Update this to your verified sender
                    to: [email],
                    subject: 'Your Password Reset Code',
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #2563eb; letter-spacing: 5px;">${token}</h1>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `
                })
            })

            if (!emailResponse.ok) {
                const errorData = await emailResponse.text()
                console.error('Resend API Error:', errorData)
                throw new Error(`Failed to send email: ${errorData}`)
            }

            return new Response(
                JSON.stringify({ success: true, message: 'OTP sent successfully' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'verify') {
            if (!email || !otp || !newPassword) throw new Error('Email, OTP, and new password are required')

            // Verify OTP
            const { data: tokens, error: tokenError } = await supabaseClient
                .from('reset_tokens')
                .select('*')
                .eq('email', email)
                .eq('token', otp)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)

            if (tokenError) throw tokenError
            if (!tokens || tokens.length === 0) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Invalid or expired OTP' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Get User ID
            // Service role can query auth.users
            // Note: listUsers is paginated. We'll fetch up to 1000 to be safe, but for production with >1000 users,
            // you should implement pagination or use a direct lookup if available (e.g. via public.users table).
            const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
            if (userError) throw userError

            console.log(`Searching for user: ${email}`)
            console.log(`Total users found: ${users.length}`)

            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

            if (!user) {
                console.error('User not found in list. Available emails:', users.map(u => u.email).join(', '))
                return new Response(
                    JSON.stringify({ success: false, error: 'User not found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Update Password
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            )

            if (updateError) throw updateError

            // Delete used token (and potentially all tokens for this email)
            await supabaseClient
                .from('reset_tokens')
                .delete()
                .eq('email', email)

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error('Invalid action')

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
