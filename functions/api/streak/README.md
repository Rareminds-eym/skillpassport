# Streak API

User activity streak tracking and management service.

## Overview

This API provides endpoints for tracking user activity streaks, updating streak data, and retrieving streak statistics.

## Endpoints

### GET `/streak/:userId`
Get user's current streak information.

**Response:**
```json
{
  "userId": "uuid",
  "currentStreak": 7,
  "longestStreak": 15,
  "lastActivityDate": "2026-01-28",
  "streakStartDate": "2026-01-22",
  "totalActiveDays": 45
}
```

### POST `/update`
Update user's streak based on activity.

**Request Body:**
```json
{
  "userId": "uuid",
  "activityDate": "2026-01-28",
  "activityType": "assessment|course|login"
}
```

**Response:**
```json
{
  "success": true,
  "currentStreak": 8,
  "streakIncreased": true,
  "milestone": null
}
```

### GET `/leaderboard`
Get streak leaderboard.

**Query Parameters:**
- `limit` - Number of users to return (default: 10)
- `period` - Time period: `week|month|all` (default: all)

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": "uuid",
      "username": "user1",
      "currentStreak": 30,
      "rank": 1
    }
  ]
}
```

### POST `/reset`
Reset user's streak (admin only).

**Request Body:**
```json
{
  "userId": "uuid",
  "reason": "manual reset"
}
```

## Implementation Status

✅ **Fully Implemented** (270 lines)
- Streak calculation and tracking
- Automatic streak updates
- Leaderboard functionality
- Milestone detection
- Streak freeze feature

## Dependencies

- Supabase for data storage
- Shared utilities from `src/functions-lib/`

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Business Logic

### Streak Rules
- Activity must occur on consecutive days
- Streak breaks if no activity for 24+ hours
- Timezone-aware calculations
- Grace period: 2 hours past midnight

### Milestones
- 7 days - Week Warrior
- 30 days - Month Master
- 100 days - Century Champion
- 365 days - Year Legend

## Testing

Property tests available in:
- `src/__tests__/property/api-endpoint-parity.property.test.ts`
- `src/__tests__/property/file-based-routing.property.test.ts`
