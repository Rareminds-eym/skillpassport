# Three-Dot Menu Added to Profile Card

## Summary
Added a three-dot menu (kebab menu) button in the top right corner of the "School Info" card that navigates to the student settings page.

## Changes Made

### File: `src/components/Students/components/ProfileHeroEdit.jsx`

#### 1. Added Imports
- `EllipsisVerticalIcon` from `@heroicons/react/24/outline` - For the three-dot icon
- `useNavigate` from `react-router-dom` - For navigation

#### 2. Added Navigation Hook
```jsx
const navigate = useNavigate();
```
Added at the component level to enable navigation functionality.

#### 3. Added Three-Dot Menu Button
Added a button in the top right corner of the School Info card:
```jsx
<button
  onClick={() => navigate('/student/settings')}
  className="absolute top-3 right-3 p-1.5 hover:bg-blue-100 rounded-lg transition-colors group"
  title="Edit Profile Settings"
>
  <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-700" />
</button>
```

## Features

### Button Styling
- **Position**: Absolute positioning in top-right corner (top-3, right-3)
- **Icon**: Three vertical dots (EllipsisVerticalIcon)
- **Hover Effect**: Background changes to light blue on hover
- **Color**: Gray by default, blue on hover
- **Tooltip**: Shows "Edit Profile Settings" on hover

### Functionality
- Clicking the button navigates to `/student/settings`
- Opens the settings page where students can edit their profile information including grade

## UI Location
The three-dot menu appears in:
```
Student Dashboard
└── Profile Card (Top section with QR code)
    └── School Info Card (Blue card showing Grade, Section, Roll, Adm)
        └── Three-dot menu (Top right corner) ⭐ NEW
```

## Visual Design
- Icon: Three vertical dots (⋮)
- Size: 20px (w-5 h-5)
- Color: Gray (#6B7280) → Blue (#1D4ED8) on hover
- Background: Transparent → Light blue on hover
- Padding: 6px (p-1.5)
- Border radius: 8px (rounded-lg)

## When It Appears
The three-dot menu only appears when:
1. Student has a `school_id` (is part of a school)
2. At least one of these fields has data:
   - Grade
   - Section
   - Roll Number
   - Admission Number

## Testing
1. Login as a student with school_id
2. Go to dashboard
3. Look at the profile card with "School Info"
4. You should see three vertical dots in the top right corner
5. Hover over it - should turn blue
6. Click it - should navigate to `/student/settings`

## Screenshot Reference
The button appears in the same card that shows:
- "School Info" header with graduation cap icon
- Grade: Grade 10
- Section, Roll Number, Admission Number (if available)
