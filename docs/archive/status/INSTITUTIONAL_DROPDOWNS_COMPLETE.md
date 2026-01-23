# Institutional Dropdowns with Add New Buttons - Complete

## Summary
Converted institutional ID fields from read-only text inputs to interactive dropdowns showing institution names, with "Add New" buttons for each field.

## Changes Made

### 1. New Hook: `src/hooks/useInstitutions.js`
Created a custom hook to fetch all institutions from the database:
- **Schools** - from `schools` table
- **Colleges** - from `colleges` table  
- **University Colleges** - from `university_colleges` table with university names
- **Programs** - from `programs` table with degree types
- **School Classes** - from `school_classes` table with grade and section

Features:
- Fetches all data on mount
- Provides `refreshInstitutions()` function to reload data
- Returns loading and error states

### 2. Updated Settings Page (`src/pages/student/Settings.jsx`)

#### Added Imports
- `Plus` icon from lucide-react
- `useInstitutions` hook

#### Replaced Text Inputs with Dropdowns
Each field now has:
- **Dropdown** showing institution names (not IDs)
- **Add New button** (+ icon) next to each dropdown
- Proper labels and formatting

#### Field Details

**School Dropdown:**
- Shows: School name + city
- Example: "ABC School - Bengaluru"
- Add button shows toast message

**School Class Dropdown:**
- Shows: Class name or "Grade X - Section Y"
- Disabled until school is selected
- Filtered based on selected school
- Helper text: "Select a school first"

**College Dropdown:**
- Shows: College name + city
- Example: "XYZ College - Mumbai"

**University College Dropdown:**
- Shows: College name (University name)
- Example: "Engineering College (ABC University)"

**Program Dropdown:**
- Shows: Program name (Degree type)
- Example: "Computer Science (B.Tech)"

### 3. Add New Button Behavior
When clicked, shows a toast notification:
```
Title: "Add New [Institution Type]"
Description: "Please contact your administrator to add a new [institution]."
```

This is a placeholder - in production, this could:
- Open a modal form
- Navigate to an admin page
- Send a request to administrators

## UI Features

### Dropdown Styling
- Full width with flex layout
- White background
- Blue border on focus
- Rounded corners (rounded-xl)
- Proper padding and spacing

### Add Button Styling
- Blue background (#2563eb)
- White plus icon
- Hover effect (darker blue)
- Fixed width to align properly
- Disabled state for dependent fields

### Responsive Design
- 2 columns on medium+ screens
- 1 column on mobile
- Buttons stack properly on small screens

## Data Flow

1. **On Page Load:**
   - `useInstitutions` hook fetches all institutions
   - Dropdowns populate with names
   - Current student's selections are pre-selected

2. **On Selection:**
   - User selects from dropdown
   - ID is stored in `profileData` state
   - Name is displayed in dropdown

3. **On Save:**
   - UUID is sent to backend
   - Stored in students table
   - Relationships maintained

## Database Relationships

```
students table:
├── school_id → schools.id
├── school_class_id → school_classes.id
├── college_id → colleges.id
├── university_college_id → university_colleges.id
└── program_id → programs.id
```

## Testing

1. **View Dropdowns:**
   - Go to `/student/settings`
   - Navigate to Profile tab
   - Scroll to "Institution Details" section
   - Verify dropdowns show institution names

2. **Select Institution:**
   - Choose a school from dropdown
   - Verify school class dropdown enables
   - Select other institutions
   - Click "Save Changes"

3. **Add New Button:**
   - Click any "+" button
   - Verify toast notification appears
   - Verify message is appropriate

4. **Dependent Fields:**
   - Clear school selection
   - Verify school class dropdown disables
   - Verify helper text appears

## Future Enhancements

### Add New Modal
Could implement a modal form for adding new institutions:
```jsx
const [showAddModal, setShowAddModal] = useState(false);
const [addType, setAddType] = useState('');

// In button onClick:
onClick={() => {
  setAddType('school');
  setShowAddModal(true);
}}
```

### Search/Filter
For large lists, add search functionality:
```jsx
<input 
  type="text" 
  placeholder="Search schools..."
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Validation
Add validation to ensure required fields are selected:
```jsx
if (!profileData.schoolId && !profileData.collegeId) {
  toast({
    title: "Error",
    description: "Please select either a school or college",
    variant: "destructive"
  });
  return;
}
```

## Benefits

1. **User-Friendly:** Shows names instead of UUIDs
2. **Searchable:** Dropdowns are searchable by default
3. **Extensible:** Easy to add new institutions
4. **Validated:** Ensures valid selections
5. **Discoverable:** Users can see all available options
6. **Professional:** Clean UI with proper spacing and styling
