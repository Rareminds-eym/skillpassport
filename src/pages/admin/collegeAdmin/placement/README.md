# Placement Management Module

This module contains the placement management system with separate components for each major functionality.

## Structure

```
placement/
├── index.tsx                 # Main placement management component with tabs
├── CompanyRegistration.tsx   # Company registration and management
├── JobPostings.tsx          # Job posting creation and management
├── ApplicationTracking.tsx   # Student application tracking
├── PlacementAnalytics.tsx   # Analytics and reporting
└── README.md               # This file
```

## Components

### 1. CompanyRegistration.tsx

- Manage company profiles and registrations
- MoU/JD document uploads
- Company status management (Active, Pending, Approved, etc.)
- Company search and filtering
- Static data with sample companies

### 2. JobPostings.tsx

- Create and manage job postings
- Job eligibility criteria setup
- Recruitment rounds scheduling
- Student auto-listing based on eligibility
- Export shortlists functionality

### 3. ApplicationTracking.tsx

- Track student applications across different stages
- Recruitment pipeline visualization
- Application status updates
- Student eligibility management
- Export application data

### 4. PlacementAnalytics.tsx

- Department-wise placement statistics
- CTC analysis (Average, Median, Highest)
- Placement rate calculations
- Export analytics reports
- Visual data representation

## Features

- **Modular Design**: Each component handles a specific aspect of placement management
- **Static Data**: All components use static data for demonstration
- **Responsive UI**: Mobile-friendly design with proper responsive layouts
- **Search & Filter**: Comprehensive search and filtering capabilities
- **Export Functionality**: Export data as CSV files
- **Status Management**: Dynamic status updates with visual feedback
- **Toast Notifications**: User feedback for all actions

## Usage

The main component (`index.tsx`) provides a tabbed interface to switch between different modules. Each tab renders the corresponding component with its own state management and functionality.

## Data Structure

All components use TypeScript interfaces for type safety:

- `Company`: Company registration data
- `JobPosting`: Job posting information with eligibility criteria
- `EligibleStudent`: Student application data
- `PlacementRecord`: Placement statistics
- `DepartmentAnalytics`: Department-wise analytics

## Future Enhancements

- Integration with backend APIs
- Real-time data updates
- Advanced analytics with charts
- Bulk operations
- Email notifications
- Document management system
