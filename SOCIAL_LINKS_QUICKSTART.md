# Quick Setup Guide: Social Media Links

## ⚡ Quick Start

### Step 1: Run Database Migration
Open Supabase SQL Editor and run:
```sql
-- File: database/migrations/add_social_media_links.sql
```
Copy and paste the entire migration file content and execute.

### Step 2: Add Your Links
1. Go to your student profile
2. Click "Edit Personal Information"
3. Scroll to "Social Media & Professional Links"
4. Add your links:
   - GitHub: `https://github.com/yourusername`
   - Portfolio: `https://yourportfolio.com`
   - LinkedIn: `https://linkedin.com/in/yourusername`
   - Twitter: `https://twitter.com/yourusername`
   - Instagram: `https://instagram.com/yourusername`
   - Facebook: `https://facebook.com/yourusername`
5. Click "Save Personal Information"

### Step 3: View Your Links
Your social media links will appear:
- ✅ **Below the badges** (Computer Science, Class of 2025) on the hero section
- ✅ **In the Personal Information section** when editing profile

---

## 🎨 Design Features

### Modern Button Design
- White background with colored text
- Platform-specific icons and colors
- Smooth hover animations (scale + shadow)
- Opens in new tab
- Mobile responsive

### Platform Colors
- 🐙 GitHub: Gray
- 🌐 Portfolio: Blue  
- 💼 LinkedIn: Blue
- 🐦 Twitter/X: Sky Blue
- 📸 Instagram: Pink
- 👥 Facebook: Dark Blue

---

## 📱 Where Links Appear

### 1. Profile Hero Section (Top of Profile)
```
[Computer Science] [Class of 2025]
[GitHub] [Portfolio] [LinkedIn] [Twitter] [Instagram] [Facebook]
```

### 2. Personal Info Summary (Edit Profile)
Grid layout with clickable cards showing all your social links

---

## ✅ What's Been Updated

### Files Modified:
1. ✅ `ProfileEditModals.jsx` - Added input fields for social links
2. ✅ `ProfileHeroEdit.jsx` - Displays links below badges with modern design
3. ✅ `PersonalInfoSummary.jsx` - Shows links in grid layout
4. ✅ `add_social_media_links.sql` - Database migration

### Database Columns Added:
- `github_link`
- `portfolio_link`
- `linkedin_link`
- `twitter_link`
- `instagram_link`
- `facebook_link`
- `other_social_links` (JSONB for future use)

---

## 🚀 Ready to Use!

The feature is fully implemented and ready to use. Just run the migration and start adding your links!

For detailed documentation, see: `SOCIAL_MEDIA_LINKS_FEATURE.md`
