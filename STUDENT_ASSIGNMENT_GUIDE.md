# Student Assignment Guide

## Overview
This guide explains how to assign assignments to individual students from the `students` table, rather than just assigning to class names.

## Current vs Enhanced System

### Current System
```
Assignment → Classes (strings)
  "Class 9A, Class 10B"
  
❌ Not linked to actual students
❌ No individual student tracking
❌ Manual process to know which students
```

### Enhanced System
```
Assignment → Students (database records)
  Via student_assignments table
  
✅ Direct link to students table
✅ Automatic tracking per student
✅ Individual progress monitoring
```

## Database Structure

### Tables Involved

1. **`students`** - Your student records
   ```sql
   - id (TEXT, primary key)
   - name (TEXT)
   - email (TEXT)
   - department (TEXT)
   - university (TEXT)
   ```

2. **`assignments`** - Assignment templates
   ```sql
   - assignment_id (UUID, primary key)
   - title (TEXT)
   - course_name (TEXT)
   - due_date (TIMESTAMP)
   ```

3. **`student_assignments`** - Junction table (already exists!)
   ```sql
   - student_assignment_id (UUID, primary key)
   - assignment_id (UUID, FK to assignments)
   - student_id (UUID, FK to students)
   - status (TEXT: todo, in-progress, submitted, graded)
   - grade_received (NUMERIC)
   ```

## Assignment Flow

### Step 1: Educator Creates Assignment
```javascript
// Create the assignment template
const assignment = await createAssignment({
    title: "React Hooks Project",
    course_name: "Web Development",
    due_date: "2025-02-01T23:59:00",
    // ... other fields
});
```

### Step 2: Fetch Students to Assign
```javascript
// Get students by class/department/criteria
const students = await supabase
    .from('students')
    .select('id, name, email, department')
    .eq('department', 'Computer Science')
    .eq('year_of_passing', '2025');
```

### Step 3: Assign to Students
```javascript
// Use the existing service function
import { assignToStudents } from './services/educator/assignmentsService';

await assignToStudents(
    assignment.assignment_id,
    students.map(s => s.id), // Array of student IDs
    {
        status: 'todo',
        priority: 'high'
    }
);
```

## Implementation Options

### Option 1: Assign by Class/Department (Recommended)

**UI Flow:**
1. Create assignment
2. Show "Assign to Students" modal
3. Display filters: Department, Year, Class
4. Show filtered student list with checkboxes
5. Bulk assign selected students

**Code Example:**
```javascript
// Fetch students by department
const { data: students } = await supabase
    .from('students')
    .select('id, name, email, department')
    .eq('department', 'Computer Science');

// Assign to all or selected students
await assignToStudents(
    assignmentId,
    students.map(s => s.id)
);
```

### Option 2: Manual Student Selection

**UI Flow:**
1. Create assignment
2. Show searchable student list
3. Select individual students (multi-select)
4. Assign to selected

**Code Example:**
```javascript
// Search students
const { data: students } = await supabase
    .from('students')
    .select('id, name, email')
    .ilike('name', `%${searchQuery}%`);

// Assign to selected IDs
await assignToStudents(assignmentId, selectedStudentIds);
```

### Option 3: Import from Class String

**Convert existing class assignments:**
```javascript
// Parse the assign_classes field
const classes = assignment.assign_classes.split(', ');
// Example: ["Class 9A", "Class 10B"]

// Map to students (you'll need a class field in students table)
const { data: students } = await supabase
    .from('students')
    .select('id')
    .in('class', classes);

await assignToStudents(assignmentId, students.map(s => s.id));
```

## Enhanced UI Component

### Student Selection Modal

Create `src/components/educator/StudentSelectionModal.tsx`:

```typescript
interface StudentSelectionModalProps {
    assignmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onAssign: (studentIds: string[]) => void;
}

const StudentSelectionModal = ({
    assignmentId,
    isOpen,
    onClose,
    onAssign
}: StudentSelectionModalProps) => {
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        department: 'all',
        year: 'all',
        search: ''
    });

    // Fetch students based on filters
    useEffect(() => {
        fetchStudents();
    }, [filters]);

    const fetchStudents = async () => {
        let query = supabase
            .from('students')
            .select('id, name, email, department, year_of_passing');

        if (filters.department !== 'all') {
            query = query.eq('department', filters.department);
        }
        if (filters.year !== 'all') {
            query = query.eq('year_of_passing', filters.year);
        }
        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        const { data } = await query;
        setStudents(data || []);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const handleAssign = async () => {
        await onAssign(selectedIds);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2>Assign to Students</h2>
                
                {/* Filters */}
                <div className="flex gap-3 mb-4">
                    <select
                        value={filters.department}
                        onChange={(e) => setFilters({...filters, department: e.target.value})}
                    >
                        <option value="all">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                    </select>

                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({...filters, year: e.target.value})}
                    >
                        <option value="all">All Years</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search students..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>

                {/* Select All */}
                <div className="mb-3">
                    <label>
                        <input
                            type="checkbox"
                            checked={selectedIds.length === students.length}
                            onChange={handleSelectAll}
                        />
                        <span>Select All ({students.length} students)</span>
                    </label>
                </div>

                {/* Student List */}
                <div className="max-h-96 overflow-y-auto">
                    {students.map(student => (
                        <label key={student.id} className="flex items-center p-2 hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(student.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedIds([...selectedIds, student.id]);
                                    } else {
                                        setSelectedIds(selectedIds.filter(id => id !== student.id));
                                    }
                                }}
                            />
                            <div className="ml-3">
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-gray-600">
                                    {student.department} • {student.year_of_passing}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onClose}>Cancel</button>
                    <button 
                        onClick={handleAssign}
                        disabled={selectedIds.length === 0}
                    >
                        Assign to {selectedIds.length} Students
                    </button>
                </div>
            </div>
        </Modal>
    );
};
```

## Updated Workflow

### In Your Assessments Page

```typescript
const Assessments = () => {
    const [showStudentSelection, setShowStudentSelection] = useState(false);
    const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

    const handleCreateTask = async () => {
        // ... existing creation code ...
        
        const createdAssignment = await createAssignment(assignmentData);
        
        // Show student selection modal
        setCurrentAssignmentId(createdAssignment.assignment_id);
        setShowStudentSelection(true);
    };

    const handleAssignStudents = async (studentIds: string[]) => {
        await assignToStudents(currentAssignmentId, studentIds, {
            status: 'todo',
            priority: 'medium'
        });
        
        alert(`Assigned to ${studentIds.length} students!`);
        
        // Refresh assignments list
        fetchEducatorAndTasks();
    };

    return (
        <>
            {/* Existing UI */}
            
            {/* Student Selection Modal */}
            {showStudentSelection && (
                <StudentSelectionModal
                    assignmentId={currentAssignmentId}
                    isOpen={showStudentSelection}
                    onClose={() => setShowStudentSelection(false)}
                    onAssign={handleAssignStudents}
                />
            )}
        </>
    );
};
```

## Query Examples

### Get Students by Department
```sql
SELECT id, name, email, department, year_of_passing
FROM students
WHERE department = 'Computer Science'
  AND year_of_passing = '2025'
ORDER BY name;
```

### Get Students Already Assigned
```sql
SELECT s.*, sa.status, sa.grade_received
FROM students s
INNER JOIN student_assignments sa ON s.id = sa.student_id
WHERE sa.assignment_id = 'assignment-uuid'
  AND sa.is_deleted = false;
```

### Get Students NOT Yet Assigned
```sql
SELECT s.*
FROM students s
WHERE s.id NOT IN (
    SELECT student_id
    FROM student_assignments
    WHERE assignment_id = 'assignment-uuid'
      AND is_deleted = false
)
AND s.department = 'Computer Science';
```

## Service Function Usage

The service already has the function you need:

```javascript
import { assignToStudents } from '../services/educator/assignmentsService';

// Assign to multiple students
await assignToStudents(
    'assignment-uuid',
    ['student-id-1', 'student-id-2', 'student-id-3'],
    {
        status: 'todo',      // Initial status
        priority: 'high'      // Priority level
    }
);
```

## Benefits of Student-Based Assignment

1. **Individual Tracking** - Track each student's progress separately
2. **Personalized Deadlines** - Can extend deadlines for individual students
3. **Targeted Reminders** - Send reminders to students who haven't started
4. **Better Analytics** - Know exactly which students are struggling
5. **Grade Management** - Direct link for grading each submission
6. **Flexible Assignment** - Add/remove students after creation

## Migration Strategy

If you have existing assignments with class strings:

1. **Keep the assign_classes field** for display purposes
2. **Add student assignments** via the junction table
3. **Query from student_assignments** for actual assignment logic
4. **Update UI** to show individual student progress

## Next Steps

1. **Add the StudentSelectionModal component**
2. **Update the assignment creation flow** to open the modal
3. **Fetch students from the database** based on filters
4. **Call assignToStudents** with selected IDs
5. **Display assigned students** in the assignment detail view
6. **Add "Manage Students" button** to add/remove students later

Would you like me to implement any of these components for you?

