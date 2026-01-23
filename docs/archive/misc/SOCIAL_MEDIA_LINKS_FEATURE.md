# Social Media & Professional Links Feature

## Overview
Added support for social media and professional links (GitHub, Portfolio, LinkedIn, Twitter, Instagram, Facebook) to the student profile system.

## Date Implemented
October 29, 2025

---

## What's New

### 1. **Database Schema Changes**
Added new columns to the `students` table:
- `github_link` (TEXT)
- `portfolio_link` (TEXT)
- `linkedin_link` (TEXT)
- `twitter_link` (TEXT)
- `instagram_link` (TEXT)
- `facebook_link` (TEXT)
- `other_social_links` (JSONB) - for additional/future social media platforms

**Migration File**: `database/migrations/add_social_media_links.sql`

### 2. **UI Components Updated**

#### **Personal Information Edit Modal** (`ProfileEditModals.jsx`)
- Added new section: "Social Media & Professional Links"
- 6 input fields for different social media platforms
- URL validation with placeholder examples
- Modern, user-friendly design

#### **Profile Hero Section** (`ProfileHeroEdit.jsx`)
- Displays social links as modern, colorful buttons below badges
- Only shows links that have been added by the user
- Each link opens in a new tab
- Hover effects with scale animations
- Platform-specific colors and icons:
  - GitHub: Gray
  - Portfolio: Blue
  - LinkedIn: Blue
  - Twitter/X: Sky blue
  - Instagram: Pink
  - Facebook: Dark blue

#### **Personal Info Summary** (`PersonalInfoSummary.jsx`)
- Dedicated section for social media links
- Responsive grid layout (2-4 columns depending on screen size)
- Clickable cards with hover effects
- Platform-specific icons and colors

### 3. **Features**

✅ **Smart URL Handling**
- Automatically adds `https://` if URL doesn't start with it
- Supports full URLs and shortened URLs

✅ **Conditional Display**
- Links only appear if they have been added
- Empty states handled gracefully

✅ **Modern Design**
- Platform-specific colors and icons
- Hover effects and animations
- Shadow effects for depth
- Responsive layout

✅ **Accessibility**
- `title` attributes for tooltips
- `rel="noopener noreferrer"` for security
- Opens in new tab (`target="_blank"`)

---

## How to Use

### For Students:

1. **Navigate to Profile Edit Section**
   - Go to your profile
   - Click "Edit Personal Information"

2. **Add Your Links**
   - Scroll to "Social Media & Professional Links" section
   - Enter your profile URLs in the respective fields
   - Examples:
     - `https://github.com/yourusername`
     - `https://yourportfolio.com`
     - `https://linkedin.com/in/yourusername`

3. **Save Changes**
   - Click "Save Personal Information"
   - Your links will appear on your profile hero section

### For Developers:

#### Running the Database Migration

```sql
-- Run this in Supabase SQL Editor
-- File: database/migrations/add_social_media_links.sql

-- The migration uses DO blocks to safely add columns
-- It checks if columns exist before adding them
-- Safe to run multiple times
```

#### Accessing Social Links in Components

```javascript
// From student data object
const { 
  github_link, 
  portfolio_link, 
  linkedin_link,
  twitter_link,
  instagram_link,
  facebook_link 
} = studentData.profile;

// Check if link exists before displaying
{github_link && (
  <a href={github_link} target="_blank" rel="noopener noreferrer">
    GitHub
  </a>
)}
```

#### Update Student Profile with Social Links

```javascript
import { updateStudentProfile } from '@/services/studentService';

await updateStudentProfile(studentId, {
  github_link: 'https://github.com/username',
  portfolio_link: 'https://myportfolio.com',
  linkedin_link: 'https://linkedin.com/in/username',
  // ... other fields
});
```

---

## Files Modified

### 1. Database
- ✅ `database/migrations/add_social_media_links.sql` (NEW)

### 2. Components
- ✅ `src/components/Students/components/ProfileEditModals.jsx`
- ✅ `src/components/Students/components/ProfileHeroEdit.jsx`
- ✅ `src/components/Students/components/PersonalInfoSummary.jsx`

### 3. Icons
Added Lucide React icons:
- `Github`
- `Globe`
- `Linkedin`
- `Twitter`
- `Instagram`
- `Facebook`
- `Link` (for generic links)

---

## Design Specifications

### Color Scheme by Platform

| Platform | Background | Text Color | Icon Color |
|----------|-----------|-----------|-----------|
| GitHub | `bg-gray-100` | `text-gray-700` | Gray |
| Portfolio | `bg-blue-100` | `text-blue-700` | Blue |
| LinkedIn | `bg-blue-100` | `text-blue-600` | Blue |
| Twitter/X | `bg-sky-100` | `text-sky-600` | Sky Blue |
| Instagram | `bg-pink-100` | `text-pink-600` | Pink |
| Facebook | `bg-blue-100` | `text-blue-800` | Dark Blue |

### Button States

- **Normal**: White background with subtle shadow
- **Hover**: Full white background, larger shadow, scale up (105%)
- **Active**: Icon scales up (110%)

### Responsive Breakpoints

- **Mobile** (< 768px): 2 columns
- **Tablet** (768px - 1024px): 3 columns  
- **Desktop** (> 1024px): 4 columns (summary), Flex wrap (hero)

---

## Testing Checklist

- [x] Database migration runs successfully
- [x] Edit modal displays all social link fields
- [x] Links save correctly to database
- [x] Links display on profile hero section
- [x] Links display in personal info summary
- [x] URLs open in new tab
- [x] Missing `https://` is handled correctly
- [x] Empty links don't show broken UI
- [x] Icons render correctly
- [x] Hover effects work smoothly
- [x] Responsive design works on all screen sizes
- [x] Links update when profile data changes

---

## Future Enhancements

### Potential Additions:
1. **More Platforms**
   - YouTube
   - Medium
   - Behance
   - Dribbble
   - Stack Overflow
   - CodePen

2. **Validation**
   - URL format validation
   - Platform-specific URL validation
   - Check if profile exists (API integration)

3. **Analytics**
   - Track link clicks
   - Popular platforms statistics

4. **Social Sharing**
   - Share profile with social links embedded
   - Generate social media cards

5. **QR Codes**
   - Generate QR codes for individual social links
   - Add to digital business card

---

## Support & Issues

If you encounter any issues:

1. **Database Issues**: Ensure migration ran successfully
2. **UI Issues**: Clear browser cache and reload
3. **Data Not Saving**: Check console for errors
4. **Icons Not Showing**: Verify Lucide React is installed

---

## Example Data Structure

```json
{
  "name": "P.DURKADEVID",
  "email": "durkadevidurkadevi43@gmail.com",
  "university": "Botany Bharathidasan University",
  "github_link": "https://github.com/durkadevid",
  "portfolio_link": "https://durkadevid.dev",
  "linkedin_link": "https://linkedin.com/in/durkadevid",
  "twitter_link": "https://twitter.com/durkadevid",
  "instagram_link": "https://instagram.com/durkadevid",
  "facebook_link": "https://facebook.com/durkadevid"
}
```

---

## Conclusion

This feature enhances student profiles by allowing them to showcase their professional and social media presence. The modern, colorful design makes it easy for viewers to connect with students across multiple platforms.

**Ready to use!** 🚀
