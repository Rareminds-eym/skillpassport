# Message Button RLS Fix ✅

## Problem
When clicking the "Message" button, got error:
```
Failed to open messaging: new row violates row-level security policy for table "conversations"
```

## Root Cause
The `conversations` and `messages` tables only had RLS policies for **student-educator** conversations, but not for **student-recruiter** conversations.

## Solution Applied

### 1. Added Conversations Table Policies

#### For Students:
- ✅ **Create** conversations with recruiters
- ✅ **View** their recruiter conversations (excluding deleted)
- ✅ **Update** their recruiter conversations

#### For Recruiters:
- ✅ **Create** conversations with students
- ✅ **View** their student conversations (excluding deleted)
- ✅ **Update** their student conversations

### 2. Added Messages Table Policies

#### For Students:
- ✅ **Send** messages to recruiters
- ✅ **View** messages in recruiter conversations (sent and received)

#### For Recruiters:
- ✅ **Send** messages to students
- ✅ **View** messages in student conversations (sent and received)

## Policy Details

### Conversations Policies
```sql
-- Students can create recruiter conversations
CREATE POLICY "Students can create recruiter conversations"
ON conversations FOR INSERT
WITH CHECK (
  student_id = auth.uid() 
  AND recruiter_id IS NOT NULL
  AND (conversation_type IS NULL OR conversation_type = 'student_recruiter')
);

-- Students can view their recruiter conversations
CREATE POLICY "Students can view their recruiter conversations"
ON conversations FOR SELECT
USING (
  student_id = auth.uid() 
  AND recruiter_id IS NOT NULL
  AND (conversation_type IS NULL OR conversation_type = 'student_recruiter')
  AND (deleted_by_student IS NULL OR deleted_by_student = false)
);

-- And similar policies for recruiters...
```

### Messages Policies
```sql
-- Students can send messages to recruiters
CREATE POLICY "Students can send messages to recruiters"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() 
  AND sender_type = 'student'
  AND receiver_type = 'recruiter'
);

-- Students can view recruiter conversation messages
CREATE POLICY "Students can view recruiter conversation messages"
ON messages FOR SELECT
USING (
  (sender_id = auth.uid() AND sender_type = 'student' AND receiver_type = 'recruiter')
  OR
  (receiver_id = auth.uid() AND receiver_type = 'student' AND sender_type = 'recruiter')
);

-- And similar policies for recruiters...
```

## Security Features

### Conversation Type Handling
- Supports both `NULL` and `'student_recruiter'` conversation types
- Default conversation type is `'student_recruiter'`
- Maintains backward compatibility

### Soft Delete Support
- Respects `deleted_by_student` and `deleted_by_recruiter` flags
- Users only see conversations they haven't deleted
- Allows conversation restoration (WhatsApp-style)

### Authentication
- All policies require `auth.uid()` matching
- Students can only access their own conversations
- Recruiters can only access their own conversations

## Testing

### Test the Message Button:
1. ✅ Navigate to `/student/opportunities`
2. ✅ Click "My Applications" tab
3. ✅ Click "Message" button on any application
4. ✅ Should create conversation and navigate to Messages page
5. ✅ Should open conversation with recruiter

### Expected Behavior:
- **First time:** Creates new conversation
- **Subsequent times:** Opens existing conversation
- **After deletion:** Restores conversation with full history

### Console Logs:
When clicking Message button, you should see:
```
🔍 handleMessage called with: { appId: ..., recruiterId: ..., ... }
📞 Calling MessageService.getOrCreateConversation...
✅ Conversation created/found: { id: "conv_...", ... }
```

## Database Changes

### Tables Modified:
- `conversations` - Added 6 new RLS policies
- `messages` - Added 4 new RLS policies

### Migrations Applied:
1. `add_student_recruiter_conversation_policies`
2. `add_student_recruiter_message_policies`

## Conversation Types Supported

| Type | Student | Recruiter | Educator | Status |
|------|---------|-----------|----------|--------|
| `student_recruiter` | ✅ | ✅ | ❌ | **Active** |
| `student_educator` | ✅ | ❌ | ✅ | Active |

## Next Steps

If you still encounter issues:

1. **Check user authentication:**
   ```javascript
   console.log('Current user:', auth.uid());
   ```

2. **Verify recruiter ID exists:**
   ```sql
   SELECT id, email FROM users WHERE id = 'recruiter-uuid';
   ```

3. **Check conversation creation:**
   ```sql
   SELECT * FROM conversations 
   WHERE student_id = 'student-uuid' 
   AND recruiter_id = 'recruiter-uuid';
   ```

4. **Test RLS policies:**
   ```sql
   -- As student
   INSERT INTO conversations (id, student_id, recruiter_id, status)
   VALUES ('test_conv', auth.uid(), 'recruiter-uuid', 'active');
   ```

---

**Status:** ✅ RLS Policies Fixed - Message Button Should Work Now
**Date:** December 19, 2025
