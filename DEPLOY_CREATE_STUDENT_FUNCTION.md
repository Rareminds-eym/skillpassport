# Deploy create-student Edge Function

## 📋 What This Function Does

The `create-student` Edge Function creates a complete student account by inserting records into **ALL 3 tables**:

1. ✅ **`auth.users`** - Creates login credentials (email + auto-generated password)
2. ✅ **`public.users`** - Creates application user record (role='student', links to school)
3. ✅ **`public.students`** - Creates student profile with all details (guardian, enrollment, etc.)

## 🚀 Deployment Steps

### Step 1: Install Supabase CLI (if not already installed)

**Windows:**
```powershell
# Using Scoop
scoop install supabase

# Or using npm
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

### Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to your Supabase dashboard
- Look at the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`
- Or go to Settings > General > Reference ID

### Step 4: Deploy the Function

```bash
supabase functions deploy create-student
```

### Step 5: Verify Deployment

Check in your Supabase Dashboard:
1. Go to **Edge Functions** section
2. You should see `create-student` listed
3. Status should be "Active"

## 🔑 Required Environment Variables

The function needs these environment variables (automatically available in Supabase):

- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_ANON_KEY` - Public anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

These are automatically set by Supabase, no action needed!

## 🧪 Test the Function

After deployment, test it:

```bash
# Test from command line
supabase functions invoke create-student --data '{
  "student": {
    "name": "Test Student",
    "email": "test@example.com",
    "contactNumber": "+919876543210",
    "dateOfBirth": "2000-01-15",
    "gender": "Male",
    "enrollmentNumber": "TEST001"
  }
}'
```

Or test from your app by clicking "Add Student" button!

## ✅ What Happens After Deployment

1. **Modal works**: The AddStudentModal will now successfully create students
2. **3 tables populated**: Each student gets records in auth.users, public.users, and public.students
3. **Password generated**: A random 12-character password is created
4. **Password returned**: The admin sees the password to share with the student
5. **Student can login**: Student can immediately login with email + password

## 📊 Success Response

When successful, the function returns:

```json
{
  "success": true,
  "message": "Student John Doe created successfully",
  "data": {
    "authUserId": "uuid-here",
    "publicUserId": "uuid-here",
    "studentId": "uuid-here",
    "email": "student@example.com",
    "name": "John Doe",
    "password": "Abc123XyZ!@#",
    "loginUrl": "https://your-project.supabase.co/auth/login"
  }
}
```

## 🔒 Security Features

- ✅ **Authentication required**: Only logged-in users can create students
- ✅ **Email validation**: Checks for valid email format
- ✅ **Duplicate prevention**: Checks all 3 tables for existing email
- ✅ **Transaction rollback**: If any step fails, auth user is deleted
- ✅ **Organization linking**: Student is automatically linked to admin's school
- ✅ **Auto-confirmed email**: Student email is pre-confirmed

## 🐛 Troubleshooting

### Error: "Function not found"
- Make sure you deployed: `supabase functions deploy create-student`
- Check Edge Functions in Supabase dashboard

### Error: "Unauthorized"
- Make sure you're logged in when clicking Add Student
- Check that auth token is being sent

### Error: "Email already exists"
- The email is already in use in auth.users, public.users, or public.students
- Use a different email

### Error: "Failed to create user record"
- Check RLS policies on public.users table
- Service role key should bypass RLS

## 📝 Next Steps

After deployment:

1. ✅ Test adding a student via the modal
2. ✅ Verify student appears in admissions list
3. ✅ Check all 3 tables have records
4. ✅ Test student login with generated password
5. ✅ Update modal to show password to admin (see below)

## 🎨 Update Modal to Show Password

The modal should display the generated password so the admin can share it with the student. I'll update that next!

## 🔄 Update/Redeploy

If you make changes to the function:

```bash
supabase functions deploy create-student
```

Changes take effect immediately!
