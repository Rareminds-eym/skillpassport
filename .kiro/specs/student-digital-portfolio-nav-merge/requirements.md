# Requirements Document

## Introduction

This feature merges the nested `StudentDigitalPortfolioNav` floating menu into the main StudentLayout header as a dropdown submenu under the "Digital Portfolio" tab. This eliminates the redundant floating navigation overlay and provides a more consistent, unified navigation experience for students.

## Glossary

- **Student_Header**: The main navigation header component in StudentLayout (`src/components/Students/components/Header.jsx`)
- **Digital_Portfolio_Nav**: The current floating slide-out navigation for digital portfolio pages (`src/components/digital-pp/ui/StudentDigitalPortfolioNav.tsx`)
- **Dropdown_Submenu**: A collapsible menu that appears when hovering or clicking on a parent navigation item
- **Portfolio_Routes**: The set of routes under `/student/digital-portfolio/*`

## Requirements

### Requirement 1: Digital Portfolio Dropdown Menu

**User Story:** As a student, I want to access all Digital Portfolio sections from the main header dropdown, so that I can navigate without needing a separate floating menu.

#### Acceptance Criteria

1. WHEN a student hovers over or clicks the "Digital Portfolio" tab in the header, THE Student_Header SHALL display a dropdown submenu with all portfolio navigation options
2. THE Dropdown_Submenu SHALL include the following items: Home, Portfolio Mode, Passport Mode, Video Portfolio, and Settings
3. WHEN a student clicks a submenu item, THE System SHALL navigate to the corresponding route and close the dropdown
4. WHEN a student is on any Digital Portfolio page, THE Student_Header SHALL visually indicate the "Digital Portfolio" tab as active
5. WHEN a student clicks outside the dropdown, THE Student_Header SHALL close the dropdown menu

### Requirement 2: Remove Floating Navigation

**User Story:** As a student, I want a single navigation system, so that I don't see duplicate navigation elements on Digital Portfolio pages.

#### Acceptance Criteria

1. WHEN a student navigates to any Digital Portfolio page, THE System SHALL NOT display the floating StudentDigitalPortfolioNav component
2. THE System SHALL remove the StudentDigitalPortfolioNav component from all Digital Portfolio route definitions in AppRoutes
3. WHEN the floating navigation is removed, THE Digital Portfolio pages SHALL maintain full functionality

### Requirement 3: Mobile Responsive Dropdown

**User Story:** As a student using a mobile device, I want to access Digital Portfolio sections from the mobile menu, so that I have consistent navigation across devices.

#### Acceptance Criteria

1. WHEN a student opens the mobile hamburger menu, THE System SHALL display "Digital Portfolio" as an expandable section
2. WHEN a student taps "Digital Portfolio" in the mobile menu, THE System SHALL expand to show all submenu items
3. WHEN a student taps a submenu item in mobile view, THE System SHALL navigate to the route and close the mobile menu
4. THE mobile submenu items SHALL match the desktop dropdown items exactly

### Requirement 4: Settings Submenu Integration

**User Story:** As a student, I want to access Digital Portfolio settings from the dropdown, so that I can quickly configure my portfolio.

#### Acceptance Criteria

1. THE Dropdown_Submenu SHALL include a "Settings" item that expands to show settings sub-options
2. THE Settings sub-options SHALL include: Theme, Layout, Export, Sharing, and Profile Settings
3. WHEN a student hovers over or clicks "Settings" in the dropdown, THE System SHALL display the settings sub-options
4. WHEN a student selects a settings option, THE System SHALL navigate to the corresponding settings page

### Requirement 5: Visual Consistency

**User Story:** As a student, I want the dropdown to match the existing header design, so that the navigation feels cohesive.

#### Acceptance Criteria

1. THE Dropdown_Submenu SHALL use the same color scheme and styling as the existing header tabs
2. THE Dropdown_Submenu SHALL display icons next to each menu item matching the current StudentDigitalPortfolioNav icons
3. WHEN a submenu item is active (current route), THE System SHALL highlight it with the primary color indicator
4. THE Dropdown_Submenu SHALL have smooth open/close animations consistent with existing UI patterns

### Requirement 6: Theme Toggle Preservation

**User Story:** As a student, I want to toggle dark/light mode from the dropdown, so that I can customize my portfolio viewing experience without navigating to settings.

#### Acceptance Criteria

1. THE Dropdown_Submenu SHALL include the ThemeToggle component at the bottom of the menu
2. WHEN a student toggles the theme, THE System SHALL immediately apply the theme change to the Digital Portfolio pages
3. THE ThemeToggle SHALL be visually separated from the navigation items by a divider
4. THE ThemeToggle SHALL function identically to the current implementation in StudentDigitalPortfolioNav
