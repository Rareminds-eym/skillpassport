/**
 * Migration Script: Create missing recruiter records for company_admin users
 * 
 * This script creates recruiter records for users who have company_admin role
 * in organization_members but don't have a corresponding record in the recruiters table.
 * 
 * Run this script once to fix existing data.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCompanyAdminRecruiters() {
    console.log('🔍 Starting migration: Create missing recruiter records for company_admin users...\n');

    try {
        // Step 1: Get all users from organization_members who should have recruiter records
        console.log('Step 1: Fetching organization members with recruitment roles...');

        const { data: orgMembers, error: membersError } = await supabase
            .from('organization_members')
            .select(`
        user_id,
        role,
        status,
        organization_id,
        users!inner(id, email, first_name, last_name, phone)
      `)
            .eq('status', 'active')
            .in('role', ['owner', 'admin']); // These roles may map to company_admin

        if (membersError) {
            console.error('❌ Error fetching organization members:', membersError);
            return;
        }

        console.log(`✓ Found ${orgMembers?.length || 0} active owner/admin members\n`);

        // Step 2: For each member, check if they have a recruitment role
        console.log('Step 2: Checking recruitment roles...');

        const membersWithRecruitmentRole: any[] = [];

        for (const member of orgMembers || []) {
            const { data: orgContext, error: contextError } = await supabase
                .rpc('get_user_org_context', {
                    p_user_id: member.user_id,
                });

            if (contextError) {
                console.error(`⚠️  Error getting org context for user ${member.user_id}:`, contextError);
                continue;
            }

            // Check if any of their org contexts has recruitment role
            const hasRecruitmentRole = orgContext?.some((ctx: any) =>
                ctx.recruitment_role === 'company_admin' || ctx.recruitment_role === 'recruiter'
            );

            if (hasRecruitmentRole) {
                membersWithRecruitmentRole.push(member);
            }
        }

        console.log(`✓ Found ${membersWithRecruitmentRole.length} members with recruitment roles\n`);

        // Step 3: Check which ones don't have recruiter records
        console.log('Step 3: Identifying missing recruiter records...');

        const missingRecruiters: any[] = [];

        for (const member of membersWithRecruitmentRole) {
            const userEmail = (member.users as any)?.email;
            if (!userEmail) continue;

            const { data: existingRecruiter, error: recruiterError } = await supabase
                .from('recruiters')
                .select('id, email')
                .eq('user_id', member.user_id)
                .maybeSingle();

            if (recruiterError && recruiterError.code !== 'PGRST116') {
                console.error(`⚠️  Error checking recruiter for ${userEmail}:`, recruiterError);
                continue;
            }

            if (!existingRecruiter) {
                missingRecruiters.push({
                    user_id: member.user_id,
                    email: userEmail,
                    first_name: (member.users as any)?.first_name,
                    last_name: (member.users as any)?.last_name,
                    phone: (member.users as any)?.phone,
                });
            }
        }

        console.log(`✓ Found ${missingRecruiters.length} users missing recruiter records\n`);

        if (missingRecruiters.length === 0) {
            console.log('✅ All company_admin users already have recruiter records. No migration needed.');
            return;
        }

        // Step 4: Create missing recruiter records
        console.log('Step 4: Creating missing recruiter records...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const user of missingRecruiters) {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

            console.log(`  Creating recruiter record for: ${user.email} (${fullName})`);

            const { error: insertError } = await supabase
                .from('recruiters')
                .insert({
                    user_id: user.user_id,
                    name: fullName,
                    email: user.email.toLowerCase(),
                    phone: user.phone || null,
                    verificationstatus: 'approved',
                    isactive: true,
                    createdat: new Date().toISOString(),
                    updatedat: new Date().toISOString(),
                });

            if (insertError) {
                console.error(`    ❌ Failed to create recruiter record:`, insertError.message);
                errorCount++;
            } else {
                console.log(`    ✓ Recruiter record created successfully`);
                successCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   Total users checked: ${orgMembers?.length || 0}`);
        console.log(`   Users with recruitment roles: ${membersWithRecruitmentRole.length}`);
        console.log(`   Missing recruiter records: ${missingRecruiters.length}`);
        console.log(`   Successfully created: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);

        if (successCount > 0) {
            console.log('\n✅ Migration completed successfully!');
        } else if (errorCount > 0) {
            console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message || error);
        process.exit(1);
    }
}

// Run the migration
fixCompanyAdminRecruiters()
    .then(() => {
        console.log('\n✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
