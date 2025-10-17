# QR Code Copy & Share Feature

## Overview
Added copy and share functionality to the QR code in the student profile hero section.

## Changes Made

### File Modified
- `src/components/Students/components/ProfileHeroEdit.jsx`

### Features Added

#### 1. **Copy Button**
- Instantly copies the profile link to clipboard
- Visual feedback with checkmark icon when copied
- Auto-resets after 2 seconds

#### 2. **Share Button**
- Opens native share dialog on mobile devices
- Falls back to custom share modal on desktop
- Provides multiple sharing options

#### 3. **Share Modal**
The modal includes the following sharing options:
- **WhatsApp** - Share directly via WhatsApp
- **LinkedIn** - Share on LinkedIn
- **Twitter/X** - Tweet your profile
- **Email** - Send via email
- **Copy Link** - Manual copy with input field

### UI/UX Improvements
- Buttons styled with gradient background matching the card design
- Smooth hover effects and transitions
- Responsive design for mobile and desktop
- Accessible with proper ARIA labels
- Visual feedback for copy action

### Technical Implementation
- Uses `navigator.clipboard` API for copying
- Uses `navigator.share` API for native sharing (mobile)
- State management for copy feedback and modal visibility
- Memoized QR code value for performance
- Social media share URLs with proper encoding

## Usage

### For Students
1. View your dashboard profile
2. Locate the QR code card in the hero section
3. Click **Copy** to copy your profile link
4. Click **Share** to open sharing options
5. Choose your preferred sharing method

### Button Actions
- **Copy Button**: Copies link instantly, shows "Copied!" confirmation
- **Share Button**: 
  - Mobile: Opens native share sheet
  - Desktop: Opens custom share modal with social media options

## Browser Compatibility
- Copy feature: Works on all modern browsers
- Native share: Supported on mobile browsers and some desktop browsers
- Fallback modal: Ensures functionality on all devices

## Styling
- Buttons use white background with purple text (matching brand colors)
- Share button has yellow accent (matching employability score)
- Modal has backdrop blur and smooth animations
- Social media buttons color-coded for recognition

## Future Enhancements
- Add more social media platforms (Telegram, Facebook, etc.)
- Download QR code as image
- Share analytics tracking
- Custom message templates
