# Master Truth Page - Skill Ecosystem by Rareminds

## Core Identity
**Product Name:** Skill Ecosystem  
**Company:** Rareminds  
**Type:** AI-Powered Educational & Career Integration Platform  
**Business Model:** B2B (Institutional) + B2C (Individual) Hybrid  
**Primary Users:** Schools, Colleges, Universities, Students, Educators, Recruiters, Platform Admins  
**Core Purpose:** Verified credential system with AI-powered career guidance connecting educational institutions with career opportunities  
**Unique Value:** QR-based instant verification of pre-validated credentials eliminating fraud and manual verification

## What We Do
Skill Ecosystem by Rareminds is a comprehensive AI-powered platform that:

**For Institutions (B2B):**
- Enables universities to manage multiple colleges under one umbrella
- Empowers college admins to manage educators (lecturers/professors) and college students
- Allows school admins to manage teachers and K-12 students
- Provides complete academic operations (attendance, timetables, grades, examinations)
- Issues verified digital credentials with QR codes

**For Individuals (B2C):**
- Allows individual students and educators to register independently
- Provides direct verification by Rareminds Platform Admin
- Issues verified credentials for freelance educators and independent learners

**For Recruiters:**
- Provides access to pre-verified student and educator profiles
- Enables instant credential verification through QR code scanning
- Eliminates need for manual verification (all data verified by Rareminds)
- Offers AI-powered candidate matching and recruitment pipeline

**Verification Hierarchy:**
- **B2B:** Institution Admin verifies → Rareminds Platform Admin validates
- **B2C:** Rareminds Platform Admin directly verifies
- **Recruiters:** Access only pre-verified data (no verification needed)

**Key Innovation:** Three types of verified credential cards (Student, Educator, Recruiter) with QR codes containing complete verified profiles that can be instantly scanned and trusted.

## Key Features

### Platform Administration (Rareminds)
- **Master Verification Authority:** Final verification for all B2C users and oversight of B2B institutions
- **Institutional Onboarding:** Approve universities, colleges, schools as B2B clients
- **Data Integrity:** Quality control, fraud detection, audit trails
- **Platform Analytics:** Revenue, usage, AI performance across entire ecosystem
- **Credential Issuance:** Generate verified QR-based digital credentials

### For Universities (B2B)
- **Multi-College Management:** Oversee multiple affiliated colleges
- **Academic Oversight:** University-wide examinations, degree issuance, curriculum standards
- **Faculty & Student Analytics:** Cross-college performance metrics
- **Verification Powers:** Validate college-level data and credentials

### For Colleges (B2B)
- **Department Management:** Create and manage departments (Engineering, Commerce, Arts, etc.)
- **Educator Management:** Onboard lecturers/professors, assign teaching responsibilities, verify credentials
- **Student Management:** Admissions, enrollments, academic tracking for college students
- **Program Management:** Define degree programs (B.Tech, MBA, B.Sc, etc.) with semester structure
- **Placement Cell:** Campus recruitment coordination, company relationships, placement tracking
- **Credential Issuance:** Issue college-verified QR-based ID cards and certificates

### For Schools (B2B)
- **Teacher Management:** Onboard K-12 teachers, assign classes, verify qualifications
- **Student Management:** Admissions, class assignments, progress tracking for school students (K-12)
- **Academic Operations:** Timetables, daily attendance, assignments, examinations, report cards
- **Parent Communication:** Progress reports, attendance notifications, fee management
- **Credential Issuance:** Issue school-verified QR-based ID cards and certificates

### For Students (School & College)
- **Academic Tracking:** Real-time grade monitoring, attendance records, timetable management
- **AI Career Assessment:** RIASEC personality test with personalized career recommendations
- **Skill Development:** Course enrollment, certificate programs, skill tracking
- **Career Services:** AI-powered job matching, resume building, application tracking
- **Digital Credential:** Verified QR-based ID card containing complete academic profile
- **Learning Resources:** Course marketplace, digital library, project submissions

### For Educators (Teachers & Lecturers)
- **Teaching Tools:** Lesson planning, curriculum management, assignment creation
- **Student Management:** Attendance tracking, grade entry, progress monitoring
- **Communication:** Direct messaging with students and administrators
- **Assessment:** Question bank management, automated grading, result analysis
- **Professional Profile:** Verified credentials, certifications, teaching performance metrics
- **Digital Credential:** Verified QR-based educator card with qualifications and experience

### For Recruiters
- **Pre-Verified Access:** All candidate data already verified by Rareminds (no manual verification needed)
- **QR Code Scanner:** Instant verification of student/educator credentials by scanning QR code
- **AI Candidate Matching:** Intelligent matching based on skills, qualifications, and job requirements
- **Pipeline Management:** Multi-stage recruitment (Applied → Screening → Interview → Offer → Hired)
- **Job Posting:** Create requisitions, define criteria, manage applications
- **Communication:** Direct messaging, bulk notifications, interview scheduling
- **Trust Guarantee:** Platform-verified data eliminates fake profiles and fraud

## Technology Stack
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Supabase (PostgreSQL), Edge Functions
- **AI Services:** OpenRouter, Claude, Gemini for assessments and recommendations
- **Storage:** Cloudflare R2 for documents and media
- **Payments:** Razorpay integration
- **Deployment:** Netlify

## Data Architecture

### Hierarchical Structure
```
RAREMINDS PLATFORM ADMIN (Master Authority)
    ├── Universities (B2B)
    │   └── Colleges (multiple per university)
    │       ├── Departments
    │       ├── Programs (B.Tech, MBA, etc.)
    │       ├── Educators (Lecturers/Professors)
    │       └── Students (College level)
    │
    ├── Schools (B2B)
    │   ├── Classes (K-12)
    │   ├── Teachers
    │   └── Students (School level)
    │
    ├── Individual Students (B2C)
    ├── Individual Educators (B2C)
    └── Recruiters (Access to verified data)
```

### Core Entities
- **Users:** Multi-role support with hierarchical permissions
  - Platform Admin (Rareminds super admin)
  - University Admin (manages colleges)
  - College Admin (manages educators & college students)
  - School Admin (manages teachers & school students)
  - Educators (Teachers in schools, Lecturers in colleges)
  - Students (School students K-12, College students)
  - Recruiters (access to verified profiles)

- **Institutions:** Hierarchical relationships
  - Universities → Colleges → Departments → Programs → Sections
  - Schools → Classes → Sections

- **Academic:** Courses, programs, subjects, curriculum, assessments

- **Opportunities:** Jobs, internships, training programs

- **Applications:** Student applications with pipeline tracking

- **Credentials:** Verified digital credentials with QR codes
  - Student cards (school & college)
  - Educator cards (teachers & lecturers)
  - Recruiter cards

### Key Relationships
- Universities have multiple Colleges (1:N)
- Colleges have multiple Departments and Programs (1:N)
- College Admins manage Educators (Lecturers) and College Students
- School Admins manage Teachers and School Students (K-12)
- Students belong to either Schools or Colleges
- Educators work in either Schools (Teachers) or Colleges (Lecturers)
- All institutional data verified by Institution Admin → Rareminds Admin
- All B2C data verified directly by Rareminds Admin
- Recruiters access only pre-verified data (no verification needed)

## AI Capabilities

### 1. Career Guidance & Assessment
- **RIASEC Personality Assessment:** AI-powered career path recommendations for students
- **Stream Selection:** Guidance for 10th/12th grade students (Science/Commerce/Arts)
- **Job Matching:** Vector-based semantic matching between student profiles and opportunities
- **Skill Gap Analysis:** Identify missing skills and recommend learning paths
- **Employability Scoring:** AI-calculated score based on skills, academics, and market demand

### 2. Credential Verification
- **QR Code Generation:** Encrypted, tamper-proof digital credentials
- **Instant Verification:** Recruiters scan QR to view complete verified profile
- **Multi-Level Validation:** Institution verification + Rareminds validation
- **Fraud Prevention:** Platform-level verification eliminates fake profiles
- **Trust Chain:** B2B (Institution → Rareminds) or B2C (Direct Rareminds verification)

### 3. Content Generation
- **Automated Question Generation:** AI creates assessment questions from curriculum
- **Course Content Suggestions:** Based on learning objectives and syllabus
- **Resume Parsing:** Extract structured data from uploaded resumes (90%+ accuracy)
- **Job Description Analysis:** Parse requirements for intelligent matching

### 4. Recruitment Intelligence
- **Candidate Matching:** AI ranks candidates by fit score for each job
- **Automatic Shortlisting:** Based on configurable criteria
- **Predictive Analytics:** Placement probability, success likelihood
- **Diversity Recommendations:** Ensure balanced candidate pools

### 5. Analytics & Insights
- **Predictive Performance:** Forecast student academic outcomes
- **Skill Demand Forecasting:** Market trends and in-demand skills
- **Institutional Benchmarking:** Compare performance across institutions
- **Placement Analytics:** Success rates, time-to-hire, source effectiveness

## Integration Points

### Authentication
- Email/password login with OTP support
- Role-based access control (RBAC)
- Multi-role user support
- Session management

### External Services
- Payment gateway (Razorpay) for subscriptions and fees
- Email notifications for important events
- Document storage and retrieval
- Resume parsing services

### APIs
- RESTful APIs via Supabase
- Edge functions for complex operations
- Cloudflare Workers for specialized tasks
- Webhook support for real-time updates

## User Journeys

### Student Journey
1. Registration → Profile completion → Assessment
2. Course enrollment → Learning → Certification
3. Skill development → Resume building → Job applications
4. Interview process → Placement → Alumni status

### Educator Journey
1. Onboarding → Profile setup → Class assignment
2. Lesson planning → Content delivery → Assessment creation
3. Grading → Feedback → Progress monitoring
4. Reporting → Analytics review → Continuous improvement

### Admin Journey
1. System setup → User management → Academic calendar
2. Program creation → Course allocation → Staff assignment
3. Monitoring operations → Generating reports → Decision making
4. Compliance tracking → Performance analysis → Strategic planning

## Business Model

### B2B (Institutional) Pricing
**Schools:**
- ₹50 per student per year (base academic management)
- Add-ons: AI career guidance (+₹20), Advanced analytics (+₹10)

**Colleges:**
- ₹100 per student per year (includes placement cell + marketplace)
- Add-ons: Premium AI features (+₹30), API access (+₹50)

**Universities:**
- Custom pricing based on total students across colleges
- Enterprise support and customization included

### B2C (Individual) Pricing
**Students:**
- Free: Basic profile + limited course access
- Premium: ₹999/year - Full AI career guidance + unlimited courses + verified credential

**Educators:**
- Free: Basic profile + teaching tools
- Professional: ₹1,499/year - Advanced analytics + content tools + verified credential

### Recruiter Pricing
**Startup:** ₹9,999/month - 5 job postings, 100 candidate views  
**Growth:** ₹24,999/month - 20 job postings, 500 views, AI matching  
**Enterprise:** Custom - Unlimited postings, API access, dedicated support

### Revenue Streams
- Institutional subscriptions (B2B primary revenue)
- Individual subscriptions (B2C supplementary)
- Recruiter subscriptions and per-hire fees
- Course marketplace commissions
- Premium feature add-ons
- API access for enterprise integrations

## Compliance & Security
- Data privacy compliant (GDPR considerations)
- Role-based access control
- Row-level security (RLS) in database
- Secure document storage
- Audit trails for critical operations

## Support & Documentation
- User guides for each role type
- Video tutorials for common tasks
- In-app help and tooltips
- Technical documentation for developers
- API documentation for integrations

## Roadmap & Vision
- Enhanced AI capabilities for personalized learning
- Mobile applications for iOS and Android
- Advanced analytics with predictive modeling
- Integration with more external learning platforms
- Blockchain-based credential verification
- Global expansion with multi-language support

---

**Last Updated:** January 2026  
**Version:** 2.0  
**Contact:** Available through platform support system
