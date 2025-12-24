# Streak API Cloudflare Worker

Manages student learning streaks and daily activity tracking.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:studentId` | GET | Get student streak information |
| `/:studentId/complete` | POST | Mark activity complete (update streak) |
| `/:studentId/notifications` | GET | Get streak notification history |
| `/:studentId/process` | POST | Process streak check based on today's activity |
| `/reset-daily` | POST | Reset daily flags (cron job) |
| `/health` | GET | Health check endpoint |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Database operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations (RPC calls) |

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `RESEND_API_KEY` | Resend email API KEY | None | Send streak reminder emails (not currently implemented) |

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/streak-api
npm install
```

### 2. Configure Secrets
```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Optional email functionality
wrangler secret put RESEND_API_KEY
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Setup Cron Trigger (Optional)
Add to `wrangler.toml` for daily reset:
```toml
[triggers]
crons = ["0 0 * * *"]  # Midnight UTC daily
```

Update worker to handle cron:
```javascript
export default {
  async scheduled(event, env, ctx) {
    await handleResetDailyFlags(env);
  }
}
```

### 5. Update Frontend Environment
```env
VITE_STREAK_API_URL=https://streak-api.your-subdomain.workers.dev
```

## Features

### Get Streak (`GET /:studentId`)
- Returns current streak information
- Creates default record if none exists
- Shows:
  - Current streak count
  - Longest streak
  - Whether streak completed today
  - Last activity date
  - Total active days

### Complete Streak (`POST /:studentId/complete`)
- Marks today's activity as complete
- Calls `update_student_streak()` database function
- Automatically:
  - Increments streak if completed previous day
  - Resets streak to 1 if gap exists
  - Updates longest_streak if appropriate
  - Sets streak_completed_today flag

### Process Streak (`POST /:studentId/process`)
- Checks if student had activity today
- Looks in `student_course_progress` table
- If activity found:
  - Updates streak automatically
  - Returns activity status
- If no activity:
  - Returns status without updating

### Get Notifications (`GET /:studentId/notifications`)
- Returns notification history
- From `streak_notification_log` table
- Ordered by most recent
- Supports limit parameter (default: 10)

### Reset Daily Flags (`POST /reset-daily`)
- Resets `streak_completed_today` for all students
- Should be called daily via cron
- Calls `reset_daily_streak_flags()` database function
- Returns count of reset students

## Database Functions Required

The worker depends on these Supabase functions:

### `update_student_streak(p_student_id UUID, p_activity_date DATE)`
Updates student streak based on activity date.

### `reset_daily_streak_flags()`
Resets all daily completion flags.

## Database Tables Used

- `student_streaks` - Main streak data
- `student_course_progress` - Activity tracking
- `streak_notification_log` - Notification history

## Student ID Validation

All student IDs are validated as UUIDs:
```regex
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

Invalid format returns 400 error.

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail

# Test endpoints
curl http://localhost:8787/{student-id}
curl -X POST http://localhost:8787/{student-id}/complete
curl http://localhost:8787/{student-id}/notifications?limit=5
```

## Response Format

### Get Streak
```json
{
  "success": true,
  "data": {
    "student_id": "...",
    "current_streak": 5,
    "longest_streak": 12,
    "streak_completed_today": true,
    "last_activity_date": "2023-12-19",
    "total_active_days": 45
  }
}
```

### Complete Streak
```json
{
  "success": true,
  "data": {
    "current_streak": 6,
    "longest_streak": 12,
    "is_new_record": false
  },
  "message": "Streak updated successfully!"
}
```

### Process Streak
```json
{
  "success": true,
  "data": {
    "hasActivity": true,
    "streakUpdated": true,
    "current_streak": 6,
    "longest_streak": 12
  }
}
```

### Get Notifications
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "student_id": "...",
      "notification_type": "streak_reminder",
      "sent_at": "2023-12-19T10:00:00Z",
      "message": "Keep your 5-day streak going!"
    }
  ],
  "count": 1
}
```

### Reset Daily
```json
{
  "success": true,
  "message": "Reset daily flags for 1234 students",
  "count": 1234
}
```

## Activity Detection

The `/process` endpoint checks for today's activity by looking for:
- Course progress updates (`student_course_progress.last_accessed`)
- Within today's date range (00:00:00 - 23:59:59)

## Streak Rules

1. **Consecutive Days**: Activity on consecutive days extends streak
2. **Missed Day**: Missing a day resets streak to 0 or 1 (depending on implementation)
3. **Same Day**: Multiple activities on same day count as one
4. **Longest Streak**: Automatically tracked and updated
5. **Daily Reset**: Completion flag resets at midnight UTC

## Cron Job Setup

For automated daily resets:

1. **Option 1**: Cloudflare Cron Triggers
   ```toml
   [triggers]
   crons = ["0 0 * * *"]
   ```

2. **Option 2**: External Cron Service
   ```bash
   0 0 * * * curl -X POST https://streak-api.your-subdomain.workers.dev/reset-daily
   ```

3. **Option 3**: Supabase Edge Function
   Schedule daily function to call `/reset-daily`

## Notes

- Streak data persists in `student_streaks` table
- UUID validation prevents invalid requests
- Returns default values for new students
- Idempotent - safe to call multiple times per day
- Time zone handling: UTC (ensure frontend converts appropriately)
- Email reminders planned but not yet implemented
