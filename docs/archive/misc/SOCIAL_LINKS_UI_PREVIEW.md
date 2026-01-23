# Social Media Links - UI Preview

## 🎨 Visual Design Reference

### Location: Profile Hero Section (Under Badges)

```
┌─────────────────────────────────────────────────────────────────┐
│  🎓 P.DURKADEVID                                                │
│  🏢 Botany Bharathidasan University                             │
│  💳 Student ID: SP-0000                                         │
│                                                                 │
│  [Computer Science]  [Class of 2025]                           │
│                                                                 │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐          │
│  │ 🐙 GitHub│ │ 🌐 Portfolio│ │💼LinkedIn│ │🐦 Twitter│         │
│  └──────────┘ └───────────┘ └──────────┘ └─────────┘          │
│  ┌──────────┐ ┌──────────┐                                     │
│  │📸Instagram│ │👥 Facebook│                                    │
│  └──────────┘ └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Button Design Specifications

### Individual Button (GitHub Example)
```
Normal State:
┌─────────────────┐
│  🐙  GitHub     │  ← White/90 background
└─────────────────┘     Gray text, shadow-md

Hover State:
┌─────────────────┐
│  🐙↗ GitHub    │  ← Full white background
└─────────────────┘     Larger shadow, scale-105
                        Icon scales to 110%
```

---

## Color Palette by Platform

### GitHub
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-gray-800`
- Icon: `Github` (Lucide React)
- Border Radius: `rounded-lg`
- Shadow: `shadow-md` → `shadow-lg` (hover)

### Portfolio
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-blue-700`
- Icon: `Globe` (Lucide React)
- Same styling as GitHub

### LinkedIn
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-blue-600`
- Icon: `Linkedin` (Lucide React)

### Twitter/X
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-sky-600`
- Icon: `Twitter` (Lucide React)

### Instagram
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-pink-600`
- Icon: `Instagram` (Lucide React)

### Facebook
- Background: `bg-white/90` → `bg-white` (hover)
- Text: `text-blue-800`
- Icon: `Facebook` (Lucide React)

---

## Responsive Behavior

### Mobile (< 768px)
```
[Computer Science]
[Class of 2025]

[GitHub]
[Portfolio]
[LinkedIn]
[Twitter]
[Instagram]
[Facebook]
```
*Stacks vertically on very small screens*

### Tablet/Desktop (> 768px)
```
[Computer Science] [Class of 2025]

[GitHub] [Portfolio] [LinkedIn] [Twitter] [Instagram] [Facebook]
```
*Horizontal flex-wrap layout*

---

## Edit Modal Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Personal Information                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ... (Basic Information) ...                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Social Media & Professional Links                          │
│                                                             │
│  GitHub Profile                Portfolio Website            │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │ https://github.com/..│      │ https://portfolio... │    │
│  └──────────────────────┘      └──────────────────────┘    │
│                                                             │
│  LinkedIn Profile              Twitter/X Profile            │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │ https://linkedin.com/│      │ https://twitter.com/ │    │
│  └──────────────────────┘      └──────────────────────┘    │
│                                                             │
│  Instagram Profile             Facebook Profile             │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │ https://instagram... │      │ https://facebook.com/│    │
│  └──────────────────────┘      └──────────────────────┘    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│                          [Cancel]  [Save Personal Info]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Personal Info Summary Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Current Information                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [📧 Email] [👤 Name] [🎂 Age] [📞 Phone] ...               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Social & Professional Links                                │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 🐙       │ │ 🌐       │ │ 💼       │ │ 🐦       │      │
│  │ GitHub   │ │ Portfolio│ │ LinkedIn │ │ Twitter  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ 📸       │ │ 👥       │                                 │
│  │ Instagram│ │ Facebook │                                 │
│  └──────────┘ └──────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Animation Details

### Hover Effects
1. **Button Scale**: `scale-105` (5% larger)
2. **Icon Scale**: `scale-110` (10% larger on icon)
3. **Shadow**: `shadow-md` → `shadow-lg`
4. **Background**: `bg-white/90` → `bg-white`
5. **Transition**: `transition-all duration-200`

### Click/Active State
- Links open in new tab
- Security: `rel="noopener noreferrer"`
- URL auto-correction: adds `https://` if missing

---

## Smart Features

### ✅ Conditional Rendering
- Only shows links that have been added
- Empty state handled gracefully
- No broken UI for missing links

### ✅ URL Handling
```javascript
// Automatically adds https:// if missing
href={link.startsWith('http') ? link : `https://${link}`}
```

### ✅ Accessibility
- `title` attribute for tooltips
- `aria-label` where needed
- Keyboard navigation support
- Screen reader friendly

---

## Example With Data

```javascript
// Student profile data
{
  name: "P.DURKADEVID",
  department: "Computer Science",
  classYear: "Class of 2025",
  github_link: "https://github.com/durkadevid",
  portfolio_link: "https://durkadevid.dev",
  linkedin_link: "https://linkedin.com/in/durkadevid",
  twitter_link: "https://twitter.com/durkadevid",
  instagram_link: "https://instagram.com/durkadevid",
  facebook_link: "https://facebook.com/durkadevid"
}
```

### Results In:
- 6 beautiful, clickable social media buttons
- Platform-specific colors and icons
- Smooth hover animations
- Opens in new tab when clicked
- Mobile responsive design

---

## 🎉 That's It!

Your social media links will appear in a modern, professional design right below your "Computer Science" and "Class of 2025" badges!
