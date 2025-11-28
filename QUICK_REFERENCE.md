# 🚀 Quick Reference - Student & Teacher Creation

## ✅ Both Systems Deployed and Ready!

---

## 📊 Quick Comparison

| Feature | Student | Teacher |
|---------|---------|---------|
| **Edge Function** | ✅ create-student | ✅ create-teacher |
| **Status** | ✅ Deployed | ✅ Deployed |
| **Table 1** | auth.users | auth.users |
| **Table 2** | public.users | public.users |
| **Table 3** | public.students | public.school_educators |
| **UI** | Modal | Form |
| **Password** | ✅ Shown with copy | ✅ Shown in message |

---

## 🎯 How to Add Users

### Add Student:
```
1. Go to: /school-admin/students/admissions
2. Click: "Add Student" button
3. Fill: Name, Email, Phone, etc.
4. Submit
5. Copy: Email & Password
6. Share: Credentials with student
```

### Add Teacher:
```
1. Go to: /school-admin/teachers (Onboarding tab)
2. Fill: Personal info, subjects, documents
3. Submit
4. Copy: Email & Password from success message
5. Share: Credentials with teacher
```

---

## 🔑 What Gets Created

### For Each User (Student or Teacher):

```
✅ auth.users
   - Login credentials
   - Email + Password
   - Auto-confirmed

✅ public.users
   - Application user
   - Role: 'student' or 'educator'
   - Linked to school

✅ Role-specific table
   - Students → public.students
   - Teachers → public.school_educators
   - Full profile data
```

---

## 📝 API Endpoints

### Create Student:
```typescript
POST /functions/v1/create-student

Body: {
  student: {
    name: "John Doe",
    email: "john@example.com",
    contactNumber: "+919876543210",
    // ... other fields
  }
}

Response: {
  success: true,
  data: {
    email: "john@example.com",
    password: "Abc123XyZ!@#"
  }
}
```

### Create Teacher:
```typescript
POST /functions/v1/create-teacher

Body: {
  teacher: {
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
    phone_number: "+919876543210",
    role: "subject_teacher",
    subject_expertise: [...]
  }
}

Response: {
  success: true,
  data: {
    email: "jane@example.com",
    password: "Xyz789Abc!@#"
  }
}
```

---

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| Function not found | `supabase functions deploy create-student` |
| Unauthorized | Login as school admin |
| Email exists | Use different email |
| Password not showing | Check Edge Function logs |

---

## 📁 Key Files

```
Edge Functions:
├─ supabase/functions/create-student/index.ts
└─ supabase/functions/create-teacher/index.ts

Components:
├─ src/components/educator/modals/Addstudentmodal.tsx
├─ src/pages/admin/schoolAdmin/StudentAdmissions.tsx
└─ src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx

Deployment:
├─ deploy-create-student.bat
└─ deploy-create-teacher.bat
```

---

## ✅ Checklist

### Deployment:
- [x] create-student deployed
- [x] create-teacher deployed
- [x] Both functions active

### Testing:
- [ ] Add a student
- [ ] Add a teacher
- [ ] Test student login
- [ ] Test teacher login
- [ ] Verify database records

---

## 🎉 You're All Set!

Both systems are deployed and ready to use. Just:
1. Add users via the UI
2. Copy the generated passwords
3. Share credentials with users
4. Users can login immediately!

**Dashboard:** https://supabase.com/dashboard/project/dpooleduinyyzxgrcwko/functions
