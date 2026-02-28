# Blocking Error Handling - Visual Flow Diagram

## Answer Save Flow (BLOCKING)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SELECTS ANSWER                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Save to DB    │
                    │  (with retry)  │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │   SUCCESS    │          │    FAILED    │
        │      ✅      │          │      ❌      │
        └──────┬───────┘          └──────┬───────┘
               │                         │
               │                         ▼
               │              ┌──────────────────────┐
               │              │  Retry Attempt 1     │
               │              │  (after 1 second)    │
               │              └──────┬───────────────┘
               │                     │
               │          ┌──────────┴──────────┐
               │          │                     │
               │          ▼                     ▼
               │    ┌──────────┐         ┌──────────┐
               │    │ SUCCESS  │         │  FAILED  │
               │    │    ✅    │         │    ❌    │
               │    └────┬─────┘         └────┬─────┘
               │         │                    │
               │         │                    ▼
               │         │         ┌──────────────────────┐
               │         │         │  Retry Attempt 2     │
               │         │         │  (after 2 seconds)   │
               │         │         └──────┬───────────────┘
               │         │                │
               │         │     ┌──────────┴──────────┐
               │         │     │                     │
               │         │     ▼                     ▼
               │         │ ┌──────────┐       ┌──────────┐
               │         │ │ SUCCESS  │       │  FAILED  │
               │         │ │    ✅    │       │    ❌    │
               │         │ └────┬─────┘       └────┬─────┘
               │         │      │                  │
               │         │      │                  ▼
               │         │      │       ┌──────────────────────┐
               │         │      │       │  Retry Attempt 3     │
               │         │      │       │  (after 4 seconds)   │
               │         │      │       └──────┬───────────────┘
               │         │      │              │
               │         │      │   ┌──────────┴──────────┐
               │         │      │   │                     │
               │         │      │   ▼                     ▼
               │         │      │ ┌──────────┐     ┌──────────┐
               │         │      │ │ SUCCESS  │     │  FAILED  │
               │         │      │ │    ✅    │     │    ❌    │
               │         │      │ └────┬─────┘     └────┬─────┘
               │         │      │      │                │
               └─────────┴──────┴──────┘                │
                             │                          │
                             ▼                          ▼
                  ┌──────────────────┐      ┌──────────────────────┐
                  │  UI UPDATES      │      │  BLOCKING ALERT      │
                  │  Answer Saved    │      │  ❌ Save Failed      │
                  │  ✅ Success      │      │                      │
                  └────────┬─────────┘      │  "Your answer was    │
                           │                │   not saved..."      │
                           │                │                      │
                           │                │  [OK Button]         │
                           │                └──────────┬───────────┘
                           │                           │
                           │                           ▼
                           │                ┌──────────────────────┐
                           │                │  REVERT UI STATE     │
                           │                │  Answer Cleared      │
                           │                │  ❌ Blocked          │
                           │                └──────────┬───────────┘
                           │                           │
                           ▼                           ▼
                  ┌──────────────────┐      ┌──────────────────────┐
                  │  USER CAN        │      │  USER CANNOT         │
                  │  PROCEED         │      │  PROCEED             │
                  │  ✅ Next Q       │      │  ❌ Stuck            │
                  └──────────────────┘      └──────────────────────┘
                                                       │
                                                       │
                                            User must fix issue
                                            (check connection)
                                            and try again
```

## Navigation Flow (BLOCKING)

```
┌─────────────────────────────────────────────────────────────────┐
│              USER CLICKS "NEXT QUESTION"                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Check if DB   │
                    │  mode enabled  │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │  DB DISABLED │          │  DB ENABLED  │
        │  (Test Mode) │          │              │
        └──────┬───────┘          └──────┬───────┘
               │                         │
               │                         ▼
               │              ┌──────────────────────┐
               │              │  Save Progress       │
               │              │  (with retry)        │
               │              └──────┬───────────────┘
               │                     │
               │          ┌──────────┴──────────┐
               │          │                     │
               │          ▼                     ▼
               │    ┌──────────┐         ┌──────────┐
               │    │ SUCCESS  │         │  FAILED  │
               │    │    ✅    │         │    ❌    │
               │    └────┬─────┘         └────┬─────┘
               │         │                    │
               │         │                    ▼
               │         │         ┌──────────────────────┐
               │         │         │  BLOCKING ALERT      │
               │         │         │  ❌ Save Failed      │
               │         │         │                      │
               │         │         │  "Failed to save     │
               │         │         │   your progress..."  │
               │         │         │                      │
               │         │         │  [OK Button]         │
               │         │         └──────────┬───────────┘
               │         │                    │
               │         │                    ▼
               │         │         ┌──────────────────────┐
               │         │         │  NAVIGATION BLOCKED  │
               │         │         │  return; // STOP     │
               │         │         └──────────────────────┘
               │         │                    │
               │         │                    │
               │         │         User stays on current question
               │         │         Must fix issue and try again
               │         │
               └─────────┴──────────────────────┐
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │  NAVIGATE TO NEXT    │
                                    │  QUESTION            │
                                    │  ✅ Success          │
                                    └──────────────────────┘
```

## Section Completion Flow (BLOCKING)

```
┌─────────────────────────────────────────────────────────────────┐
│           USER COMPLETES LAST QUESTION IN SECTION               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Calculate Section │
                    │  Timing & Score    │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Save Section      │
                    │  Completion        │
                    │  (with retry)      │
                    └────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │   SUCCESS    │          │    FAILED    │
        │      ✅      │          │      ❌      │
        └──────┬───────┘          └──────┬───────┘
               │                         │
               │                         ▼
               │              ┌──────────────────────┐
               │              │  BLOCKING ALERT      │
               │              │  ❌ Save Failed      │
               │              │                      │
               │              │  "Your section       │
               │              │   completion was     │
               │              │   not saved..."      │
               │              │                      │
               │              │  [OK Button]         │
               │              └──────────┬───────────┘
               │                         │
               │                         ▼
               │              ┌──────────────────────┐
               │              │  SECTION TRANSITION  │
               │              │  BLOCKED             │
               │              │  throw Error()       │
               │              └──────────────────────┘
               │                         │
               │                         │
               │              User cannot move to next section
               │              Must fix issue and complete again
               │
               ▼
    ┌──────────────────────┐
    │  SHOW SECTION        │
    │  COMPLETE SCREEN     │
    │  ✅ Success          │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  USER CAN PROCEED    │
    │  TO NEXT SECTION     │
    │  ✅ Allowed          │
    └──────────────────────┘
```

## Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE OPERATION FAILS                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Classify Error    │
                    │  Type              │
                    └────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  NETWORK     │    │  VALIDATION  │    │  SESSION     │
│  ERROR       │    │  ERROR       │    │  ERROR       │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ "Network     │    │ "Invalid     │    │ "Session     │
│  connection  │    │  data..."    │    │  expired..." │
│  lost..."    │    │              │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  SHOW BLOCKING       │
                │  ALERT WITH          │
                │  SPECIFIC MESSAGE    │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  USER ACKNOWLEDGES   │
                │  (Clicks OK)         │
                └──────────┬───────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│  NETWORK ERROR   │              │  OTHER ERRORS    │
│  User checks     │              │  User refreshes  │
│  connection      │              │  page or         │
│  and retries     │              │  contacts        │
└────────┬─────────┘              │  support         │
         │                        └──────────────────┘
         │
         ▼
┌──────────────────┐
│  USER RETRIES    │
│  OPERATION       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SAVE SUCCEEDS   │
│  ✅ Can proceed  │
└──────────────────┘
```

## Key Takeaways

### 🔴 BLOCKING Points
1. **Answer Save** - User cannot proceed until saved
2. **Progress Update** - Navigation blocked until saved
3. **Section Completion** - Cannot move to next section until saved

### ✅ Success Path
- Instant UI feedback
- Automatic retries (3 attempts)
- Smooth navigation

### ❌ Failure Path
- Blocking alert dialog
- Clear error message
- UI state reverted
- User must fix issue
- Cannot proceed until resolved

### 🔄 Retry Strategy
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds (total 3s)
- Attempt 4: After 4 seconds (total 7s)
- Then: Show blocking alert

### 💾 Data Integrity
- **100% guaranteed** - No data loss possible
- All saves must succeed before proceeding
- UI state always matches database state
