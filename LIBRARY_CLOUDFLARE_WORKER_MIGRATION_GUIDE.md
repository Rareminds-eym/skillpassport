# Library Module - Cloudflare Worker Migration Guide

## 🎯 Goal

Convert 2 SQL functions to Cloudflare Worker API:
1. `calculate_fine_college()` - College library fines
2. `calculate_fine_school()` - School library fines

---

## 📋 Current Implementation (SQL Functions)

### **SQL Function 1: calculate_fine_college**

```sql
CREATE FUNCTION calculate_fine_college(
  p_college_id UUID,
  issue_date DATE,
  return_date DATE
) RETURNS DECIMAL AS $$
BEGIN
  -- Get settings from library_settings_college
  SELECT setting_value INTO loan_period 
  FROM library_settings_college 
  WHERE college_id = p_college_id AND setting_key = 'default_loan_period_days';
  
  SELECT setting_value INTO fine_per_day 
  FROM library_settings_college 
  WHERE college_id = p_college_id AND setting_key = 'fine_per_day';
  
  -- Calculate
  due_date := issue_date + loan_period days;
  overdue_days := GREATEST(0, return_date - due_date);
  
  RETURN overdue_days * fine_per_day;
END;
$$;
```

### **Frontend Call (Current):**
```typescript
const { data: fine } = await supabase.rpc('calculate_fine_college', {
  p_college_id: collegeId,
  issue_date: '2024-01-01',
  return_date: '2024-01-20'
});
```

---

## 🚀 New Implementation (Cloudflare Worker)

### **Step-by-Step Migration Process**

---

## 📁 STEP 1: Create Worker Project Structure

```
cloudflare-workers/
└── library-api/
    ├── src/
    │   ├── index.ts                    # Main entry point
    │   ├── handlers/
    │   │   └── calculateFine.ts        # Fine calculation logic
    │   ├── services/
    │   │   └── libraryService.ts       # Business logic
    │   └── utils/
    │       ├── supabase.ts             # Supabase client
    │       └── cors.ts                 # CORS handling
    ├── wrangler.toml                   # Cloudflare config
    ├── package.json
    └── tsconfig.json
```

---

## 📝 STEP 2: Create Worker Files

### **File 1: wrangler.toml** (Configuration)

```toml
name = "library-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

# Add secrets via: wrangler secret put SUPABASE_URL
# wrangler secret put SUPABASE_SERVICE_KEY
```

**Purpose:** Configure worker name, entry point, and environment

---

### **File 2: package.json** (Dependencies)

```json
{
  "name": "library-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "typescript": "^5.3.3",
    "wrangler": "^3.22.1"
  }
}
```

**Purpose:** Define dependencies and scripts

---

### **File 3: src/utils/supabase.ts** (Database Client)

```typescript
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env: any) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
```

**Purpose:** Initialize Supabase client for database access

---

### **File 4: src/utils/cors.ts** (CORS Headers)

```typescript
export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function handleOptions(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') || undefined)
  });
}
```

**Purpose:** Handle CORS for frontend requests

---

### **File 5: src/services/libraryService.ts** (Business Logic)

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export class LibraryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Calculate fine for college library
   */
  async calculateFineCollege(
    collegeId: string,
    issueDate: string,
    returnDate: string
  ): Promise<number> {
    // Step 1: Get library settings
    const { data: settings, error: settingsError } = await this.supabase
      .from('library_settings_college')
      .select('setting_key, setting_value')
      .eq('college_id', collegeId)
      .in('setting_key', ['default_loan_period_days', 'fine_per_day']);

    if (settingsError) throw settingsError;

    // Step 2: Parse settings
    const loanPeriodSetting = settings?.find(s => s.setting_key === 'default_loan_period_days');
    const finePerDaySetting = settings?.find(s => s.setting_key === 'fine_per_day');

    const loanPeriod = parseInt(loanPeriodSetting?.setting_value || '14');
    const finePerDay = parseFloat(finePerDaySetting?.setting_value || '10');

    // Step 3: Calculate due date
    const issueDateObj = new Date(issueDate);
    const dueDateObj = new Date(issueDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + loanPeriod);

    // Step 4: Calculate overdue days
    const returnDateObj = new Date(returnDate);
    const overdueDays = Math.max(0, 
      Math.floor((returnDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Step 5: Calculate fine
    const fine = overdueDays * finePerDay;

    return fine;
  }

  /**
   * Calculate fine for school library
   */
  async calculateFineSchool(
    schoolId: string,
    issueDate: string,
    returnDate: string
  ): Promise<number> {
    // Step 1: Get library settings
    const { data: settings, error: settingsError } = await this.supabase
      .from('library_settings_school')
      .select('setting_key, setting_value')
      .eq('school_id', schoolId)
      .in('setting_key', ['default_loan_period_days', 'fine_per_day']);

    if (settingsError) throw settingsError;

    // Step 2: Parse settings (with defaults)
    const loanPeriodSetting = settings?.find(s => s.setting_key === 'default_loan_period_days');
    const finePerDaySetting = settings?.find(s => s.setting_key === 'fine_per_day');

    const loanPeriod = parseInt(loanPeriodSetting?.setting_value || '14');
    const finePerDay = parseFloat(finePerDaySetting?.setting_value || '10');

    // Step 3: Calculate due date
    const issueDateObj = new Date(issueDate);
    const dueDateObj = new Date(issueDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + loanPeriod);

    // Step 4: Calculate overdue days
    const returnDateObj = new Date(returnDate);
    const overdueDays = Math.max(0, 
      Math.floor((returnDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Step 5: Calculate fine
    const fine = overdueDays * finePerDay;

    return fine;
  }
}
```

**Purpose:** Core business logic - replaces SQL function logic

---

### **File 6: src/handlers/calculateFine.ts** (Request Handler)

```typescript
import { LibraryService } from '../services/libraryService';
import { SupabaseClient } from '@supabase/supabase-js';

export async function handleCalculateFine(
  request: Request,
  supabase: SupabaseClient
): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json();
    const { type, collegeId, schoolId, issueDate, returnDate } = body;

    // Validate input
    if (!type || !issueDate || !returnDate) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: type, issueDate, returnDate' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'college' && !collegeId) {
      return new Response(
        JSON.stringify({ error: 'collegeId required for college type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'school' && !schoolId) {
      return new Response(
        JSON.stringify({ error: 'schoolId required for school type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create service
    const libraryService = new LibraryService(supabase);

    // Calculate fine based on type
    let fine: number;
    if (type === 'college') {
      fine = await libraryService.calculateFineCollege(
        collegeId,
        issueDate,
        returnDate
      );
    } else if (type === 'school') {
      fine = await libraryService.calculateFineSchool(
        schoolId,
        issueDate,
        returnDate
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be "college" or "school"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return result
    return new Response(
      JSON.stringify({ 
        success: true,
        fine,
        details: {
          issueDate,
          returnDate,
          type
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error calculating fine:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate fine',
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Purpose:** Handle HTTP requests and validate input

---

### **File 7: src/index.ts** (Main Entry Point)

```typescript
import { createSupabaseClient } from './utils/supabase';
import { corsHeaders, handleOptions } from './utils/cors';
import { handleCalculateFine } from './handlers/calculateFine';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    // Route requests
    if (url.pathname === '/calculate-fine' && request.method === 'POST') {
      const response = await handleCalculateFine(request, supabase);
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(origin || undefined)).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'library-api' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin || undefined)
          } 
        }
      );
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(origin || undefined)
        } 
      }
    );
  },
};
```

**Purpose:** Main worker entry point - routes requests to handlers

---

## 🔧 STEP 3: Update Frontend Services

### **Before (SQL Function):**

```typescript
// libraryService.ts - OLD
async calculateFine(issueDate: string, returnDate?: string) {
  const collegeId = await this.getCurrentCollegeId();
  
  const { data, error } = await supabase
    .rpc('calculate_fine_college', {
      p_college_id: collegeId,
      issue_date: issueDate,
      return_date: returnDate || new Date().toISOString().split('T')[0]
    });

  if (error) throw error;
  return data as number;
}
```

### **After (Cloudflare Worker):**

```typescript
// libraryService.ts - NEW
async calculateFine(issueDate: string, returnDate?: string) {
  const collegeId = await this.getCurrentCollegeId();
  
  const response = await fetch('https://library-api.your-subdomain.workers.dev/calculate-fine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'college',
      collegeId: collegeId,
      issueDate: issueDate,
      returnDate: returnDate || new Date().toISOString().split('T')[0]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to calculate fine');
  }

  const { fine } = await response.json();
  return fine;
}
```

### **School Library Service Update:**

```typescript
// schoolLibraryService.ts - NEW
async calculateFine(issueDate: string, returnDate?: string) {
  const schoolId = await this.getCurrentSchoolId();
  
  const response = await fetch('https://library-api.your-subdomain.workers.dev/calculate-fine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'school',
      schoolId: schoolId,
      issueDate: issueDate,
      returnDate: returnDate || new Date().toISOString().split('T')[0]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to calculate fine');
  }

  const { fine } = await response.json();
  return fine;
}
```

---

## 🚀 STEP 4: Deploy Worker

### **Commands:**

```bash
# Navigate to worker directory
cd cloudflare-workers/library-api

# Install dependencies
npm install

# Set environment secrets
wrangler secret put SUPABASE_URL
# Paste: https://your-project.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Paste: your-service-role-key

# Test locally
npm run dev
# Worker runs at: http://localhost:8787

# Deploy to production
npm run deploy
# Worker deployed at: https://library-api.your-subdomain.workers.dev
```

---

## 🧪 STEP 5: Test the Worker

### **Test 1: Health Check**

```bash
curl https://library-api.your-subdomain.workers.dev/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "library-api"
}
```

### **Test 2: Calculate College Fine**

```bash
curl -X POST https://library-api.your-subdomain.workers.dev/calculate-fine \
  -H "Content-Type: application/json" \
  -d '{
    "type": "college",
    "collegeId": "your-college-uuid",
    "issueDate": "2024-01-01",
    "returnDate": "2024-01-20"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "fine": 60,
  "details": {
    "issueDate": "2024-01-01",
    "returnDate": "2024-01-20",
    "type": "college"
  }
}
```

### **Test 3: Calculate School Fine**

```bash
curl -X POST https://library-api.your-subdomain.workers.dev/calculate-fine \
  -H "Content-Type: application/json" \
  -d '{
    "type": "school",
    "schoolId": "your-school-uuid",
    "issueDate": "2024-01-01",
    "returnDate": "2024-01-15"
  }'
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  libraryService.calculateFine()                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP POST /calculate-fine
                         │ { type, collegeId, issueDate, returnDate }
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER (library-api)                 │
│                                                              │
│  1. Receive request                                         │
│  2. Validate input                                          │
│  3. Create Supabase client                                  │
│  4. Call LibraryService.calculateFineCollege()              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Query library_settings_college
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
│  library_settings_college table                             │
│  - default_loan_period_days: 14                             │
│  - fine_per_day: 10                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Return settings
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER (library-api)                 │
│                                                              │
│  5. Calculate due_date = issue_date + loan_period           │
│  6. Calculate overdue_days = return_date - due_date         │
│  7. Calculate fine = overdue_days × fine_per_day            │
│  8. Return { success: true, fine: 60 }                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ JSON Response
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  Display fine amount to user                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits of This Approach

1. ✅ **No SQL Functions** - All logic in TypeScript
2. ✅ **Easy to Debug** - Console logs in worker
3. ✅ **Easy to Test** - Can test with curl/Postman
4. ✅ **Easy to Modify** - Change logic without database migrations
5. ✅ **Better Error Handling** - Detailed error messages
6. ✅ **Reusable** - Same endpoint for college and school
7. ✅ **Scalable** - Cloudflare handles scaling automatically

---

## 🎯 Summary

**What you're converting:**
- ❌ `calculate_fine_college()` SQL function
- ❌ `calculate_fine_school()` SQL function

**To:**
- ✅ Single Cloudflare Worker API endpoint
- ✅ `/calculate-fine` endpoint handles both types
- ✅ All logic in TypeScript

**Files to create:** 7 files total
**Time to implement:** ~1-2 hours
**Deployment:** Single command (`wrangler deploy`)

This approach gives you full control over the fine calculation logic without needing SQL functions!
