# Entity API Reference

This document provides API reference for all migrated entities in the FSD architecture.

## User Entity

**Location**: `@/entities/user`

### Types

```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

type UserRole = 'student' | 'educator' | 'admin' | 'recruiter';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
}

interface UpdateUserData {
  email?: string;
  profile?: Partial<UserProfile>;
}
```

### Model Functions

```typescript
// Validation
isValidRole(role: string): boolean
isValidEmail(email: string): boolean
isValidPassword(password: string): boolean
validateUser(data: unknown): data is User

// Utilities
getUserDisplayName(user: User): string
getUserInitials(user: User): string
getRoleDisplayName(role: UserRole): string
filterUsersByRole(users: User[], role: UserRole): User[]
searchUsers(users: User[], query: string): User[]
```

### API Functions

```typescript
// Queries
getUsers(): Promise<User[]>
getUser(id: string): Promise<User>
getCurrentUser(): Promise<User>
getUserProfile(id: string): Promise<UserProfile>

// Mutations
createUser(data: CreateUserData): Promise<User>
updateUser(id: string, data: UpdateUserData): Promise<User>
deleteUser(id: string): Promise<void>
changeUserRole(id: string, role: UserRole): Promise<User>
updatePassword(id: string, newPassword: string): Promise<void>
```

### UI Components

```typescript
<UserCard entity={user} onClick={(user) => {}} />
<UserAvatar user={user} size="md" />
```

### Usage Example

```typescript
import { User, getUsers, UserCard } from '@/entities/user';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    getUsers().then(setUsers);
  }, []);
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} entity={user} />
      ))}
    </div>
  );
}
```

---

## Course Entity

**Location**: `@/entities/course`

### Types

```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

interface CourseModule {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
}

interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: string[];
  progress: number;
}
```

### Model Functions

```typescript
// Validation
isValidCourseStatus(status: string): boolean
validateCourse(data: unknown): data is Course
canEnrollInCourse(course: Course, user: User): boolean

// Utilities
getCourseDisplayTitle(course: Course): string
getCourseDuration(course: Course): number
calculateCourseProgress(course: Course, completedLessons: string[]): number
getTotalLessons(course: Course): number
filterCoursesByStatus(courses: Course[], status: string): Course[]
searchCourses(courses: Course[], query: string): Course[]
```

### API Functions

```typescript
// Queries
getCourses(): Promise<Course[]>
getCourse(id: string): Promise<Course>
getActiveCourses(): Promise<Course[]>
getUserEnrollments(userId: string): Promise<Course[]>
getCourseProgress(courseId: string, userId: string): Promise<CourseProgress>

// Mutations
createCourse(data: CreateCourseData): Promise<Course>
updateCourse(id: string, data: UpdateCourseData): Promise<Course>
deleteCourse(id: string): Promise<void>
enrollInCourse(courseId: string, userId: string): Promise<void>
markLessonComplete(courseId: string, lessonId: string, userId: string): Promise<void>
```

### UI Components

```typescript
<CourseCard entity={course} onClick={(course) => {}} />
<CourseProgress course={course} progress={75} />
```

### Usage Example

```typescript
import { Course, getCourses, CourseCard } from '@/entities/course';

function CourseList() {
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {courses?.map(course => (
        <CourseCard key={course.id} entity={course} />
      ))}
    </div>
  );
}
```

---

## Organization Entity

**Location**: `@/entities/organization`

### Types

```typescript
interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  email: string;
  phone?: string;
  website?: string;
  subscription?: OrganizationSubscription;
  createdAt: string;
  updatedAt: string;
}

type OrganizationType = 'school' | 'college' | 'university' | 'corporate';

interface OrganizationSubscription {
  id: string;
  planId: string;
  seats: number;
  usedSeats: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}
```

### Model Functions

```typescript
// Validation
isValidOrganizationType(type: string): boolean
validateOrganization(data: unknown): data is Organization
isValidEmail(email: string): boolean
validateSeatCount(seats: number): boolean

// Utilities
getOrganizationDisplayName(org: Organization): string
getOrganizationTypeLabel(type: OrganizationType): string
getAvailableSeats(org: Organization): number
calculateSeatUtilization(org: Organization): number
isSubscriptionActive(subscription: OrganizationSubscription): boolean
filterOrganizationsByType(orgs: Organization[], type: OrganizationType): Organization[]
```

### API Functions

```typescript
// Queries
getOrganizations(): Promise<Organization[]>
getOrganizationById(id: string): Promise<Organization>
getOrganizationByAdminId(adminId: string): Promise<Organization>
getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>
getOrganizationSubscriptions(orgId: string): Promise<OrganizationSubscription[]>

// Mutations
createOrganization(data: CreateOrganizationData): Promise<Organization>
updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization>
deleteOrganization(id: string): Promise<void>
updateSeatCount(orgId: string, seats: number): Promise<Organization>
removeMember(orgId: string, userId: string): Promise<void>
```

### UI Components

```typescript
<OrganizationCard entity={organization} onClick={(org) => {}} />
```

### Usage Example

```typescript
import { Organization, getOrganizationByAdminId, OrganizationCard } from '@/entities/organization';

function OrganizationProfile({ adminId }: { adminId: string }) {
  const { data: org } = useQuery({
    queryKey: ['organization', adminId],
    queryFn: () => getOrganizationByAdminId(adminId),
  });
  
  if (!org) return <div>Loading...</div>;
  
  return <OrganizationCard entity={org} />;
}
```

---

## Assessment Entity

**Location**: `@/entities/assessment`

### Types

```typescript
interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'exam' | 'assignment';
  courseId: string;
  questions: Question[];
  duration: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
}
```

### Model Functions

```typescript
validateAssessment(data: unknown): data is Assessment
calculateScore(assessment: Assessment, answers: Record<string, string>): number
isPassingScore(score: number, passingScore: number): boolean
```

### API Functions

```typescript
getAssessments(courseId: string): Promise<Assessment[]>
getAssessment(id: string): Promise<Assessment>
createAssessment(data: CreateAssessmentData): Promise<Assessment>
updateAssessment(id: string, data: UpdateAssessmentData): Promise<Assessment>
deleteAssessment(id: string): Promise<void>
```

---

## Project Entity

**Location**: `@/entities/project`

### Types

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  userId: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Model Functions

```typescript
validateProject(data: unknown): data is Project
filterProjectsByStatus(projects: Project[], status: string): Project[]
searchProjects(projects: Project[], query: string): Project[]
```

### API Functions

```typescript
getProjects(userId: string): Promise<Project[]>
getProject(id: string): Promise<Project>
createProject(data: CreateProjectData): Promise<Project>
updateProject(id: string, data: UpdateProjectData): Promise<Project>
deleteProject(id: string): Promise<void>
```

---

## Certificate Entity

**Location**: `@/entities/certificate`

### Types

```typescript
interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
  verificationCode: string;
}
```

### Model Functions

```typescript
validateCertificate(data: unknown): data is Certificate
generateVerificationCode(): string
```

### API Functions

```typescript
getCertificates(userId: string): Promise<Certificate[]>
getCertificate(id: string): Promise<Certificate>
issueCertificate(userId: string, courseId: string): Promise<Certificate>
verifyCertificate(verificationCode: string): Promise<Certificate | null>
```

---

## Message Entity

**Location**: `@/entities/message`

### Types

```typescript
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}
```

### Model Functions

```typescript
validateMessage(data: unknown): data is Message
filterUnreadMessages(messages: Message[]): Message[]
sortMessagesByDate(messages: Message[]): Message[]
```

### API Functions

```typescript
getMessages(userId: string): Promise<Message[]>
getMessage(id: string): Promise<Message>
sendMessage(data: CreateMessageData): Promise<Message>
markAsRead(messageId: string): Promise<void>
deleteMessage(id: string): Promise<void>
```

---

## Subscription Entity

**Location**: `@/entities/subscription`

### Types

```typescript
interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}
```

### Model Functions

```typescript
validateSubscription(data: unknown): data is Subscription
isSubscriptionActive(subscription: Subscription): boolean
getDaysRemaining(subscription: Subscription): number
```

### API Functions

```typescript
getSubscriptions(userId: string): Promise<Subscription[]>
getSubscription(id: string): Promise<Subscription>
createSubscription(data: CreateSubscriptionData): Promise<Subscription>
cancelSubscription(id: string): Promise<void>
renewSubscription(id: string): Promise<Subscription>
```

---

## General Patterns

### Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  const user = await getUser(userId);
} catch (error) {
  console.error('Failed to fetch user:', error);
}
```

### With React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUsers, createUser } from '@/entities/user';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
}

function useCreateUser() {
  return useMutation({
    mutationFn: createUser,
  });
}
```

### Type Guards

Use validation functions as type guards:

```typescript
import { validateUser } from '@/entities/user';

function processData(data: unknown) {
  if (validateUser(data)) {
    // TypeScript knows data is User here
    console.log(data.email);
  }
}
```
