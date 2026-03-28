# StudentProfileDrawer - Shared Component

A comprehensive, reusable student profile drawer component that works across different user roles (school admin, college admin, university admin, and educators) and student types (school students, college students, university students).

## Features

- **Role-based UI**: Different tabs and actions based on user role
- **Student type awareness**: Adapts to school vs college/university students
- **Modular architecture**: Split into reusable components, hooks, and tabs
- **Comprehensive data**: Shows overview, academic info, courses, projects, certificates, assessments, curriculum, and notes
- **Action support**: Approval/rejection, promotion, graduation, messaging, and export
- **Responsive design**: Works on mobile and desktop
- **QR code sharing**: Generate shareable profile links

## Usage

```tsx
import StudentProfileDrawer from '@/components/shared/StudentProfileDrawer';

<StudentProfileDrawer
  student={selectedStudent}
  isOpen={showDrawer}
  onClose={() => setShowDrawer(false)}
  userRole="school_admin" // or "college_admin", "university_admin", "educator"
  schoolId={schoolId} // optional
  collegeId={collegeId} // optional
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `student` | `Student \| null` | Yes | Student data object |
| `isOpen` | `boolean` | Yes | Whether drawer is open |
| `onClose` | `() => void` | Yes | Close handler |
| `userRole` | `'school_admin' \| 'college_admin' \| 'university_admin' \| 'educator'` | No | User role (default: 'school_admin') |
| `schoolId` | `string` | No | School ID for context |
| `collegeId` | `string` | No | College ID for context |

## Architecture

### Directory Structure

```
src/components/shared/StudentProfileDrawer/
├── components/           # Reusable UI components
│   ├── Badge.tsx
│   ├── StatusBadge.tsx
│   ├── TabButton.tsx
│   ├── LessonSection.tsx
│   ├── ProjectCard.tsx
│   ├── CertificateCard.tsx
│   └── index.ts
├── hooks/               # Custom hooks
│   ├── useStudentData.ts
│   ├── useStudentActions.ts
│   └── index.ts
├── modals/              # Modal components
│   ├── AdmissionNoteModal.tsx
│   ├── MessageModal.tsx
│   ├── ExportModal.tsx
│   ├── ApprovalModal.tsx
│   ├── PromotionModal.tsx
│   ├── GraduationModal.tsx
│   └── index.ts
├── tabs/                # Tab content components
│   ├── OverviewTab.tsx
│   ├── AcademicTab.tsx
│   ├── CoursesTab.tsx
│   ├── ProjectsTab.tsx
│   ├── CertificatesTab.tsx
│   ├── AssessmentsTab.tsx
│   ├── CurriculumTab.tsx
│   ├── NotesTab.tsx
│   └── index.ts
├── types/               # TypeScript types
│   └── index.ts
├── StudentProfileDrawer.tsx  # Main component
├── index.ts             # Exports
└── README.md           # Documentation
```

### Key Components

#### Main Component
- `StudentProfileDrawer.tsx`: Main drawer component with header, tabs, and content

#### Hooks
- `useStudentData`: Fetches and manages student-related data (assessments, curriculum, courses, notes)
- `useStudentActions`: Handles student actions (approval, promotion, graduation)

#### Tabs
- `OverviewTab`: Basic student information and timeline
- `AcademicTab`: Academic details and education history
- `CoursesTab`: Enrolled courses with progress
- `ProjectsTab`: Student projects (college/university only)
- `CertificatesTab`: Certificates and achievements (college/university only)
- `AssessmentsTab`: Assessment results and scores
- `CurriculumTab`: Curriculum and lesson plans (school students only)
- `NotesTab`: Admission notes (admin only)

#### Modals
- `AdmissionNoteModal`: Add admission notes
- `MessageModal`: Contact student via WhatsApp, SMS, or email
- `ExportModal`: Export student data as PDF or CSV
- `ApprovalModal`: Approve or reject student enrollment
- `PromotionModal`: Promote student to next semester
- `GraduationModal`: Mark student as graduated

## Role-based Features

### School Admin
- All tabs except projects and certificates
- Curriculum and lesson plans
- Student approval actions
- Admission notes

### College Admin
- All tabs including projects and certificates
- Student verification and promotion
- Graduation management
- Export and messaging

### University Admin
- Same as college admin
- Advanced academic progress tracking

### Educator
- Read-only access to most tabs
- Limited action buttons
- Focus on academic and course information

## Student Type Adaptations

### School Students
- Grade-based organization
- Guardian information
- Curriculum and lesson plans
- Subject-based learning

### College/University Students
- Semester-based progress
- CGPA tracking
- Projects and certificates
- Degree and specialization info

## Data Sources

The component fetches data from multiple Supabase tables:
- `students`: Main student information
- `personal_assessment_results`: Assessment scores
- `trainings` & `course_enrollments`: Course data
- `curriculums` & `lesson_plans`: Academic curriculum
- `school_classes`: Class and academic year info

## Customization

### Adding New Tabs
1. Create tab component in `tabs/` directory
2. Add tab configuration in `getTabsConfig()`
3. Add case in `renderTabContent()`
4. Export from `tabs/index.ts`

### Adding New Actions
1. Create modal component in `modals/` directory
2. Add action configuration in `getActionsConfig()`
3. Add button in action buttons section
4. Add modal state and handlers

### Extending Student Types
1. Update `Student` interface in `types/index.ts`
2. Add new fields to relevant tab components
3. Update role-based configurations

## Performance Considerations

- Data is fetched only when drawer is open
- Tabs are rendered on-demand
- Large lists use pagination where appropriate
- Images and files are lazy-loaded

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management

## Migration from Old Component

The old `StudentProfileDrawer` components have been replaced with this shared version. Key changes:

1. **Import path**: `@/components/shared/StudentProfileDrawer`
2. **New props**: `userRole` prop is now required
3. **Role-based features**: Different features based on user role
4. **Improved performance**: Better data fetching and caching
5. **Better types**: Comprehensive TypeScript support

## Future Enhancements

- Real-time updates via WebSocket
- Bulk actions for multiple students
- Advanced filtering and search
- Integration with external systems
- Mobile app support
- Offline capabilities