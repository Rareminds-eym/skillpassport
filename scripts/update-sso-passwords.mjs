#!/usr/bin/env node
/**
 * Update ALL SSO users' passwords to match their email addresses
 * This makes it easy to test login in the UI
 * 
 * IMPORTANT: This script updates the SSO worker database (port 54332)
 * 
 * Usage: npm run update-passwords
 *    or: node scripts/update-sso-passwords.mjs
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Client } = pg;

// SSO Database connection (not the main app database!)
const SSO_DB_URL = process.env.SSO_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54332/postgres';

async function updateAllPasswords() {
  const client = new Client({ connectionString: SSO_DB_URL });
  
  try {
    console.log('🔐 SSO Password Update Tool');
    console.log('='.repeat(60));
    console.log(`📡 Connecting to: ${SSO_DB_URL.replace(/:[^:@]+@/, ':****@')}\n`);
    
    await client.connect();
    console.log('✅ Connected to SSO database\n');

    // Get all users from SSO database
    const result = await client.query('SELECT id, email, is_blocked FROM users ORDER BY email');
    const users = result.rows;

    console.log(`Found ${users.length} users to update\n`);

    let updated = 0;
    let failed = 0;
    let blocked = 0;

    for (const user of users) {
      try {
        // Hash the email as the password
        const passwordHash = await bcrypt.hash(user.email, 12);
        
        // Update the user's password
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, user.id]
        );

        if (user.is_blocked) {
          console.log(`⚠️  ${user.email} (blocked)`);
          blocked++;
        } else {
          console.log(`✅ ${user.email}`);
        }
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${user.email}: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Blocked: ${blocked} users (updated but cannot login)`);
    console.log(`   Failed: ${failed} users`);
    console.log('='.repeat(60));
    console.log('\n📋 Login Instructions:');
    console.log('   Use the email address as both username AND password');
    console.log('\n   Example:');
    console.log('   Email:    seainfo@seaedu.ac.in');
    console.log('   Password: seainfo@seaedu.ac.in\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. SSO worker database is running on port 54332');
    console.error('   2. Connection details are correct');
    console.error('   3. You have bcryptjs and pg packages installed');
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateAllPasswords();
