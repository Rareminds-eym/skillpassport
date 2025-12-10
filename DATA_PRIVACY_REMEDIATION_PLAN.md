# Data Privacy Remediation Plan

## Executive Summary
This plan addresses 47 identified privacy/security issues across 5 categories.
Timeline: 6 weeks for critical items, 12 weeks for full remediation.

---

## PHASE 1: EMERGENCY (Week 1 - Do Immediately)

### 1.1 Rotate Exposed API Key
**Owner:** DevOps/Backend Lead
**Time:** 30 minutes

```bash
# 1. Go to OpenRouter dashboard: https://openrouter.ai/keys
# 2. Revoke the exposed key: sk-or-v1-da990abf...
# 3. Generate new key
# 4. Update in Supabase Edge Function secrets
# 5. Update in deployment environment variables
```

**Fix .env.example:**
```env
# Replace actual key with placeholder
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 1.2 Enable Row Level Security on Critical Tables
**Owner:** Database Admin
**Time:** 4 hours


Run this migration in Supabase SQL Editor:

```sql
-- CRITICAL: Enable RLS on all tables with sensitive data
-- Run in Supabase SQL Editor

-- 1. Students table (most critical - contains minors' data)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_own_data" ON public.students
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "educators_view_school_students" ON public.students
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_manage_school_students" ON public.students
  FOR ALL USING (
    school_id IN (
      SELECT id FROM schools WHERE created_by = auth.uid()
    )
  );

-- 2. Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- 3. Subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Messages and Conversations
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_participants" ON public.conversations
  FOR ALL USING (
    auth.uid() = student_id OR auth.uid() = recruiter_id
  );

CREATE POLICY "message_participants" ON public.messages
  FOR ALL USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 5. Apply to remaining tables (run for each)
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
```

### 1.3 Remove Plaintext Passwords from Edge Functions
**Owner:** Backend Developer
**Time:** 2 hours

**File:** `supabase/functions/create-student/index.ts`

Remove these lines:
```typescript
// DELETE these password storage lines:
// user_metadata: { password: studentPassword }
// metadata: { password: studentPassword }
```

Instead, implement secure password delivery:
```typescript
// Option 1: Send password via email (recommended)
// Option 2: Force password reset on first login
// Option 3: Generate magic link instead of password
```

### 1.4 Restrict CORS Origins
**Owner:** Backend Developer  
**Time:** 1 hour

Update ALL Edge Functions:
```typescript
// Before (INSECURE):
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

// After (SECURE):
const ALLOWED_ORIGINS = [
  'https://yourapp.com',
  'https://www.yourapp.com',
  'https://yourapp.netlify.app',
  // Add localhost only for development
  ...(Deno.env.get('ENVIRONMENT') === 'development' ? ['http://localhost:5173'] : [])
];

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
});
```

---

## PHASE 2: HIGH PRIORITY (Weeks 2-3)

### 2.1 Remove Console Logging of PII
**Owner:** Frontend Developer
**Time:** 4 hours

Create a sanitized logger utility:


**File:** `src/utils/secureLogger.ts`
```typescript
const SENSITIVE_PATTERNS = [
  /email/i, /password/i, /phone/i, /token/i, 
  /secret/i, /key/i, /aadhar/i, /passport/i
];

const sanitize = (data: any): any => {
  if (typeof data === 'string') {
    // Mask emails
    return data.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (SENSITIVE_PATTERNS.some(p => p.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

export const secureLog = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(msg, data ? sanitize(data) : '');
    }
  },
  error: (msg: string, error?: any) => {
    console.error(msg, error?.message || '[Error details hidden]');
  }
};
```

**Then run search-and-replace:**
```bash
# Find all console.log with user/email patterns
grep -r "console.log.*user\|console.log.*email" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

### 2.2 Implement AI Data Processing Consent
**Owner:** Frontend Developer + Legal
**Time:** 8 hours

**Step 1:** Create consent modal component

**File:** `src/components/Consent/AIDataConsentModal.tsx`
```tsx
export const AIDataConsentModal = ({ onAccept, onDecline }) => {
  return (
    <Modal>
      <h2>AI-Powered Assessment</h2>
      <p>To provide personalized career recommendations, your assessment 
         responses will be processed by AI services (Google Gemini).</p>
      
      <h3>Data Processed:</h3>
      <ul>
        <li>Your assessment answers (anonymized)</li>
        <li>Career interest responses</li>
        <li>Skill self-assessments</li>
      </ul>
      
      <h3>Your Rights:</h3>
      <ul>
        <li>You can request deletion of AI-processed data</li>
        <li>Results are stored only in your account</li>
        <li>Data is not sold to third parties</li>
      </ul>
      
      <Checkbox id="consent">
        I consent to AI processing of my assessment data
      </Checkbox>
      
      <Button onClick={onAccept}>Continue with AI Analysis</Button>
      <Button variant="secondary" onClick={onDecline}>
        Skip AI Features
      </Button>
    </Modal>
  );
};
```

**Step 2:** Store consent in database

```sql
-- Add consent tracking table
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  consent_type TEXT NOT NULL, -- 'ai_processing', 'marketing', 'analytics'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  version TEXT DEFAULT '1.0' -- Track consent version for legal
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_consents" ON public.user_consents
  FOR ALL USING (auth.uid() = user_id);
```

### 2.3 Implement Proper Client-Side Encryption
**Owner:** Frontend Developer
**Time:** 6 hours

Replace XOR obfuscation with Web Crypto API:

**File:** `src/lib/secureStorage.ts` (replacement)
```typescript
const ENCRYPTION_KEY_NAME = 'app-encryption-key';

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  if (stored) {
    const keyData = JSON.parse(stored);
    return crypto.subtle.importKey(
      'jwk', keyData, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));
  return key;
}

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const cryptoKey = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(value);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, cryptoKey, encoded
    );
    
    const payload = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
    localStorage.setItem(key, JSON.stringify(payload));
  },

  async getItem(key: string): Promise<string | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    try {
      const { iv, data } = JSON.parse(stored);
      const cryptoKey = await getOrCreateKey();
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        cryptoKey,
        new Uint8Array(data)
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      // Legacy unencrypted data - migrate it
      return stored;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
```

### 2.4 Add Export Audit Logging
**Owner:** Backend Developer
**Time:** 3 hours


**File:** `src/utils/studentExportUtils.ts` (modify)
```typescript
import { supabase } from '../lib/supabaseClient';

async function logExport(
  exportType: string, 
  recordCount: number, 
  includePII: boolean
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('export_activities').insert({
    shortlist_id: null,
    export_format: 'csv',
    export_type: exportType,
    exported_by: user?.email || 'unknown',
    include_pii: includePII,
    exported_at: new Date().toISOString()
  });
}

export function exportStudentsAsCSV(students: UICandidate[], filename: string): void {
  // Log before export
  logExport('students_csv', students.length, true);
  
  // ... existing export logic
}
```

---

## PHASE 3: MEDIUM PRIORITY (Weeks 4-6)

### 3.1 Implement Data Retention Policies
**Owner:** Database Admin + Backend
**Time:** 8 hours

**Step 1:** Create retention policy table
```sql
CREATE TABLE public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  deletion_type TEXT DEFAULT 'soft', -- 'soft' or 'hard'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO data_retention_policies (table_name, retention_days, deletion_type) VALUES
  ('audit_logs', 365, 'hard'),
  ('user_sessions', 90, 'hard'),
  ('user_login_history', 180, 'hard'),
  ('search_history', 90, 'hard'),
  ('streak_notification_log', 90, 'hard'),
  ('personal_assessment_responses', 730, 'soft'); -- 2 years for assessments
```

**Step 2:** Create cleanup Edge Function

**File:** `supabase/functions/data-retention-cleanup/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get active retention policies
  const { data: policies } = await supabase
    .from('data_retention_policies')
    .select('*')
    .eq('is_active', true);

  for (const policy of policies || []) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    if (policy.deletion_type === 'hard') {
      await supabase
        .from(policy.table_name)
        .delete()
        .lt('created_at', cutoffDate.toISOString());
    } else {
      await supabase
        .from(policy.table_name)
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .lt('created_at', cutoffDate.toISOString());
    }
    
    console.log(`Cleaned ${policy.table_name} older than ${policy.retention_days} days`);
  }

  return new Response(JSON.stringify({ success: true }));
});
```

**Step 3:** Schedule with Supabase cron (pg_cron)
```sql
SELECT cron.schedule(
  'data-retention-cleanup',
  '0 3 * * *', -- Run at 3 AM daily
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/data-retention-cleanup',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  )$$
);
```

### 3.2 Implement Right to Erasure (GDPR Article 17)
**Owner:** Full Stack Developer
**Time:** 12 hours

**File:** `src/services/dataPrivacyService.ts`
```typescript
export async function requestDataDeletion(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== userId) throw new Error('Unauthorized');

  // 1. Create deletion request record
  await supabase.from('deletion_requests').insert({
    user_id: userId,
    status: 'pending',
    requested_at: new Date().toISOString()
  });

  // 2. Anonymize data in related tables (don't delete - maintain referential integrity)
  const anonymizedData = {
    name: '[DELETED USER]',
    email: `deleted_${userId}@anonymized.local`,
    contact_number: null,
    address: null,
    date_of_birth: null,
    guardianName: null,
    guardianPhone: null,
    guardianEmail: null,
    profile: {},
    metadata: { deleted: true, deleted_at: new Date().toISOString() }
  };

  await supabase.from('students').update(anonymizedData).eq('user_id', userId);
  await supabase.from('users').update({
    email: anonymizedData.email,
    firstName: '[DELETED]',
    lastName: '[USER]',
    phone: null,
    isActive: false
  }).eq('id', userId);

  // 3. Delete from auth.users (requires service role)
  // This should be done via Edge Function with service role key
}

export async function exportUserData(userId: string): Promise<object> {
  // GDPR Article 20 - Data Portability
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== userId) throw new Error('Unauthorized');

  const [students, education, experience, skills, certificates, projects] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', userId),
    supabase.from('education').select('*').eq('student_id', userId),
    supabase.from('experience').select('*').eq('student_id', userId),
    supabase.from('skills').select('*').eq('student_id', userId),
    supabase.from('certificates').select('*').eq('student_id', userId),
    supabase.from('projects').select('*').eq('student_id', userId),
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile: students.data?.[0],
    education: education.data,
    experience: experience.data,
    skills: skills.data,
    certificates: certificates.data,
    projects: projects.data
  };
}
```

### 3.3 Add Security Headers
**Owner:** DevOps
**Time:** 2 hours

**File:** `netlify.toml` (add/update)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.razorpay.com https://generativelanguage.googleapis.com https://openrouter.ai; frame-src https://checkout.razorpay.com;"
```

### 3.4 Encrypt Sensitive Database Columns
**Owner:** Database Admin
**Time:** 6 hours


Using Supabase Vault for column encryption:

```sql
-- Enable pgsodium extension (if not already)
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create encryption key
SELECT pgsodium.create_key(name := 'student_pii_key');

-- Create encrypted columns view for sensitive data
CREATE VIEW students_decrypted AS
SELECT 
  id,
  user_id,
  email,
  name,
  -- Decrypt sensitive fields
  CASE 
    WHEN contact_number_encrypted IS NOT NULL 
    THEN pgsodium.crypto_aead_det_decrypt(
      contact_number_encrypted,
      '',
      (SELECT id FROM pgsodium.valid_key WHERE name = 'student_pii_key')
    )::text
    ELSE contact_number
  END as contact_number,
  -- Add other sensitive fields
  school_id,
  created_at
FROM students;

-- For new data, use encrypted insert
CREATE OR REPLACE FUNCTION encrypt_student_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_number IS NOT NULL THEN
    NEW.contact_number_encrypted := pgsodium.crypto_aead_det_encrypt(
      NEW.contact_number::bytea,
      ''::bytea,
      (SELECT id FROM pgsodium.valid_key WHERE name = 'student_pii_key')
    );
    NEW.contact_number := NULL; -- Clear plaintext
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## PHASE 4: COMPLIANCE (Weeks 7-10)

### 4.1 Privacy Policy Integration
**Owner:** Legal + Frontend
**Time:** 16 hours

Create privacy policy page and integrate into signup flows:

```typescript
// In all signup modals, add:
<Checkbox required id="privacy-policy">
  I have read and agree to the{' '}
  <Link to="/privacy-policy" target="_blank">Privacy Policy</Link>
  {' '}and{' '}
  <Link to="/terms" target="_blank">Terms of Service</Link>
</Checkbox>

// Track acceptance
await supabase.from('user_consents').insert({
  user_id: newUser.id,
  consent_type: 'privacy_policy',
  granted: true,
  version: '2024-12-09' // Update when policy changes
});
```

### 4.2 Cookie Consent Banner
**Owner:** Frontend Developer
**Time:** 4 hours

```typescript
// src/components/CookieConsent.tsx
export const CookieConsent = () => {
  const [shown, setShown] = useState(!localStorage.getItem('cookie_consent'));
  
  const handleAccept = (level: 'essential' | 'analytics' | 'all') => {
    localStorage.setItem('cookie_consent', level);
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShown(false);
    
    if (level === 'essential') {
      // Disable analytics, tracking
      window['ga-disable-GA_MEASUREMENT_ID'] = true;
    }
  };

  if (!shown) return null;

  return (
    <div className="fixed bottom-0 w-full bg-gray-900 text-white p-4">
      <p>We use cookies to improve your experience.</p>
      <div className="flex gap-2 mt-2">
        <Button onClick={() => handleAccept('essential')}>Essential Only</Button>
        <Button onClick={() => handleAccept('all')}>Accept All</Button>
        <Link to="/cookie-policy">Learn More</Link>
      </div>
    </div>
  );
};
```

### 4.3 Data Processing Records (GDPR Article 30)
**Owner:** Legal + Backend
**Time:** 8 hours

Create documentation table:

```sql
CREATE TABLE public.data_processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_activity TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  data_subjects TEXT[] NOT NULL, -- ['students', 'educators', 'recruiters']
  recipients TEXT[], -- Third parties receiving data
  retention_period TEXT,
  security_measures TEXT[],
  legal_basis TEXT, -- 'consent', 'contract', 'legitimate_interest'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document all processing activities
INSERT INTO data_processing_records VALUES
(gen_random_uuid(), 
 'AI Assessment Analysis',
 'Provide personalized career recommendations based on psychometric assessment',
 ARRAY['assessment_responses', 'personality_scores', 'aptitude_results'],
 ARRAY['students'],
 ARRAY['Google Gemini API', 'OpenRouter API'],
 '2 years after account deletion',
 ARRAY['encryption_in_transit', 'api_key_rotation', 'access_logging'],
 'consent'
);
```

---

## PHASE 5: MONITORING & MAINTENANCE (Ongoing)

### 5.1 Security Audit Logging
**Owner:** Backend Developer
**Time:** 4 hours

```sql
-- Enhanced audit logging
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'login', 'data_access', 'export', 'admin_action'
  user_id UUID,
  target_table TEXT,
  target_id TEXT,
  action TEXT, -- 'read', 'write', 'delete', 'export'
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  success BOOLEAN,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying
CREATE INDEX idx_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_audit_event ON security_audit_log(event_type);
CREATE INDEX idx_audit_date ON security_audit_log(created_at);

-- Auto-log sensitive table access
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (event_type, user_id, target_table, target_id, action)
  VALUES (
    'data_access',
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
```

### 5.2 Automated Security Scanning
**Owner:** DevOps
**Time:** 2 hours

Add to CI/CD pipeline:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=high
        
  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/security-audit
```

---

## CHECKLIST SUMMARY

### Week 1 (Emergency)
- [ ] Rotate OpenRouter API key
- [ ] Enable RLS on students, users, subscriptions tables
- [ ] Remove plaintext passwords from Edge Functions
- [ ] Restrict CORS to specific origins

### Weeks 2-3 (High Priority)
- [ ] Remove/sanitize console.log PII
- [ ] Implement AI data consent modal
- [ ] Replace XOR with Web Crypto encryption
- [ ] Add export audit logging

### Weeks 4-6 (Medium Priority)
- [ ] Implement data retention policies
- [ ] Create data deletion/export endpoints
- [ ] Add security headers
- [ ] Encrypt sensitive database columns

### Weeks 7-10 (Compliance)
- [ ] Integrate privacy policy into signup
- [ ] Add cookie consent banner
- [ ] Document all data processing activities
- [ ] Create DPIA (Data Protection Impact Assessment)

### Ongoing
- [ ] Weekly security log review
- [ ] Monthly dependency updates
- [ ] Quarterly penetration testing
- [ ] Annual privacy policy review

---

## CONTACTS & ESCALATION

| Role | Responsibility | Escalation |
|------|---------------|------------|
| Security Lead | Overall security posture | CTO |
| DPO (Data Protection Officer) | GDPR/DPDP compliance | Legal |
| DevOps | Infrastructure security | Security Lead |
| Backend Lead | API & database security | Security Lead |
| Frontend Lead | Client-side security | Security Lead |

---

## APPENDIX: Quick Reference Commands

```bash
# Check for exposed secrets
grep -r "sk-or-v1\|sk-live\|password.*=" --include="*.ts" --include="*.js" --include="*.env*" .

# Find console.log with PII
grep -rn "console.log.*email\|console.log.*user\|console.log.*password" src/

# List tables without RLS
# Run in Supabase SQL Editor:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE c.relrowsecurity = true
);
```
