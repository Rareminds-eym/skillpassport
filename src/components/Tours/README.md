# Student Dashboard Tour System

A professional React Joyride-based tour system for guiding new students through the dashboard.

## Features

✅ **Auto-start for first-time users** - Tour automatically starts for new students
✅ **Manual trigger button** - "Take Tour" button for users to restart the tour
✅ **Database persistence** - Tracks completion status in Supabase database
✅ **Professional styling** - Matches the existing blue/indigo theme
✅ **Mobile responsive** - Works on all screen sizes
✅ **17-step comprehensive tour** - Covers all main dashboard cards and navigation
✅ **Floating AI button included** - Final step highlights the AI assistant

## Database Integration

### Tour Progress Storage
Tour progress is stored in the `students` table in a `tour_progress` JSONB column:

```sql
-- Column structure
tour_progress JSONB DEFAULT '{}' NOT NULL

-- Example data structure
{
  "student_dashboard_main": {
    "status": "completed",
    "completedAt": "2024-01-23T10:30:00.000Z",
    "lastStepIndex": 16
  }
}
```

### Requirements
- User must be authenticated (email in localStorage)
- Student record must exist in database
- Tour progress is tied to user email

## Usage

### Auto-start Tour
The tour automatically starts for first-time users when they visit `/student/dashboard`.

### Manual Tour Trigger
Users can manually start/restart the tour using the "Take Tour" button displayed below the welcome message.

### Tour Steps
1. **Assessment Center** - Career assessment introduction
2. **My Learning** - Training and courses section
3. **Opportunities Hub** - Job postings and internships
4. **Projects & Internships** - Portfolio showcase
5. **Certificates & Credentials** - Professional certifications
6. **Work Experience** - Employment history
7. **Education Background** - Academic records
8. **Technical Skills** - Programming and technical abilities
9. **Soft Skills** - Interpersonal competencies
10. **AI Career Assistant** - Floating AI button (final step)

## Implementation Details

### File Structure
```
src/components/Tours/
├── index.ts                           # Main exports
├── types.ts                          # TypeScript interfaces
├── TourProvider.tsx                  # Context provider
├── hooks/
│   └── useTourProgress.ts           # localStorage persistence
├── components/
│   ├── TourTriggerButton.tsx        # Manual trigger button
│   └── StudentDashboardTour.tsx     # Auto-start wrapper
└── configs/
    └── studentDashboardTour.ts      # Tour step definitions
```

### Integration Points
- **App.tsx**: TourProvider wrapper added
- **Dashboard.jsx**: Tour data attributes and components added
- **FloatingAIButton.tsx**: Tour data attribute added

### Data Attributes Used
- `data-tour="assessment-card"`
- `data-tour="training-card"`
- `data-tour="opportunities-card"`
- `data-tour="projects-card"`
- `data-tour="certificates-card"`
- `data-tour="experience-card"`
- `data-tour="education-card"`
- `data-tour="technical-skills-card"`
- `data-tour="soft-skills-card"`
- `data-tour="floating-ai-button"`

## Customization

### Adding New Tours
1. Create a new tour config in `configs/`
2. Add tour data attributes to target elements
3. Use `TourTriggerButton` or create auto-start wrapper
4. Import and use via `useTour()` hook

### Styling
Tour styling is configured in the tour config file and matches the existing blue/indigo theme. Modify the `styles` object in the tour configuration to customize appearance.

### Persistence
Tour completion is tracked in the Supabase database (`students.tour_progress` column). Each tour has its own completion status and can be reset/restarted. Requires user authentication and existing student record.

## Testing

The tour system is ready for testing. Visit `/student/dashboard` as a new user to see the auto-start behavior, or use the "Take Tour" button to manually trigger the tour.