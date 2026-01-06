# Implementation Plan: Student Digital Portfolio Navigation Merge

## Overview

This plan merges the floating `StudentDigitalPortfolioNav` into the main StudentLayout header. The implementation uses a side drawer approach - Digital Portfolio is a regular nav link, and on Digital Portfolio pages, a floating menu button opens a side drawer with navigation options.

## Tasks

- [x] 1. Create DigitalPortfolioSideDrawer component
  - [x] 1.1 Create the side drawer component file with menu item structure
    - Create `src/components/Students/components/DigitalPortfolioSideDrawer.tsx`
    - Define menu items array with icons, labels, and paths
    - Include nested settings submenu structure
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [x] 1.2 Implement side drawer UI and interactions
    - Add floating menu button (fixed position on right side)
    - Add slide-from-right drawer panel
    - Implement click to open/close functionality
    - Add backdrop overlay when open
    - Add smooth open/close animations with framer-motion
    - _Requirements: 1.1, 1.5, 5.4_

  - [x] 1.3 Implement active state highlighting
    - Detect current route and highlight active menu item
    - Use indigo color for main items, purple for settings
    - _Requirements: 1.4, 5.3_

  - [x] 1.4 Add ThemeToggle integration
    - Import and render ThemeToggle at bottom of drawer
    - Add divider separator above ThemeToggle
    - Wrap with ThemeProvider context
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 1.5 Write property tests for side drawer component
    - **Property 1: Side drawer displays on interaction**
    - **Property 7: Menu items have icons**
    - **Validates: Requirements 1.1, 1.2, 5.2**

- [x] 2. Integrate side drawer into Header component
  - [x] 2.1 Modify Header to show side drawer on Digital Portfolio routes
    - Import DigitalPortfolioSideDrawer component
    - Make Digital Portfolio tab a regular nav link (not dropdown)
    - Conditionally render side drawer only on digital-portfolio routes
    - Add state management for drawer open/close
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Update active tab detection for Digital Portfolio routes
    - Ensure Digital Portfolio tab shows as active for all sub-pages
    - _Requirements: 1.4_

- [x] 3. Update mobile menu
  - [x] 3.1 Make Digital Portfolio a regular link in mobile menu
    - Remove expandable submenu from mobile menu
    - Navigate directly to /student/digital-portfolio
    - Side drawer handles sub-navigation on those pages
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Remove old components
  - [x] 4.1 Remove StudentDigitalPortfolioNav from AppRoutes
    - Already removed in previous session
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Delete old DigitalPortfolioDropdown component
    - Deleted `src/components/Students/components/DigitalPortfolioDropdown.tsx`
    - Replaced with DigitalPortfolioSideDrawer
    - _Requirements: 2.2_

  - [x] 4.3 Update test files
    - Deleted old dropdown test file
    - Created new side drawer test file
    - _Requirements: 2.3_

- [x] 5. Final cleanup
  - [x] 5.1 Remove unused imports from Header.jsx
    - Removed ChevronDownIcon (no longer needed)
    - Removed useRef (no longer needed)
    - Removed old dropdown import
    - Added DigitalPortfolioSideDrawer import

  - [x] 5.2 Remove nested navbar from Digital Portfolio pages
    - Removed `<Navbar />` from HomePage.tsx
    - _Requirements: 2.1_

  - [x] 5.3 Remove fixed headers from all Digital Portfolio sub-pages
    - Removed fixed header from PortfolioPage.tsx
    - Removed fixed header from PassportPage.tsx
    - Removed fixed header from VideoPortfolioPage.tsx
    - Removed header from ThemeSettings.tsx
    - Removed header from LayoutSettings.tsx
    - Removed header from ExportSettings.tsx
    - Removed header from SharingSettings.tsx
    - Removed header from ProfileSettings.tsx
    - _Requirements: 2.1, 2.2_

## Summary

The implementation now uses a cleaner approach:
1. Digital Portfolio is a regular nav link in the header (desktop, tablet, mobile)
2. On Digital Portfolio pages, a floating menu button appears on the right side
3. Clicking the menu button opens a side drawer with all navigation options
4. The side drawer includes ThemeToggle wrapped in ThemeProvider to avoid context errors

## Files Changed

- `src/components/Students/components/Header.jsx` - Updated to use side drawer
- `src/components/Students/components/DigitalPortfolioSideDrawer.tsx` - New component
- `src/components/Students/components/__tests__/DigitalPortfolioSideDrawer.test.tsx` - New test file
- `src/pages/digital-pp/HomePage.tsx` - Removed nested Navbar
- `src/pages/digital-pp/PortfolioPage.tsx` - Removed fixed header
- `src/pages/digital-pp/PassportPage.tsx` - Removed fixed header
- `src/pages/digital-pp/VideoPortfolioPage.tsx` - Removed fixed header
- `src/pages/digital-pp/settings/ThemeSettings.tsx` - Removed header
- `src/pages/digital-pp/settings/LayoutSettings.tsx` - Removed header
- `src/pages/digital-pp/settings/ExportSettings.tsx` - Removed header
- `src/pages/digital-pp/settings/SharingSettings.tsx` - Removed header
- `src/pages/digital-pp/settings/ProfileSettings.tsx` - Removed header
- Deleted: `src/components/Students/components/DigitalPortfolioDropdown.tsx`
- Deleted: `src/components/Students/components/__tests__/DigitalPortfolioDropdown.test.tsx`
