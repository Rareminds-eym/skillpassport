# Content Update Guide

## 🎯 Priority Order for Content Updates

When your content is incomplete, update files in this order for maximum impact:

### 🔴 HIGH PRIORITY (Update First)

#### 1. **index.html** - Homepage Meta Tags
**Location:** `index.html` (lines 5-60)
**What to Update:**
- Title tag
- Meta description
- Keywords
- Open Graph title/description
- Company name and branding

**Example:**
```html
<title>Your Actual Product Name - What You Actually Do</title>
<meta name="description" content="Your real value proposition in 150-160 characters" />
```

#### 2. **ai-master-truth.md** - Master Reference
**Location:** `ai-master-truth.md`
**What to Update:**
- Product name and tagline (lines 3-7)
- Core features list (lines 20-50)
- Technology stack (lines 60-70)
- Pricing (lines 180-190)
- Contact information (bottom)

**Why Important:** This is the single source of truth for AI systems.

#### 3. **README.md** - Main Documentation
**Location:** `README.md`
**What to Update:**
- Overview section (lines 1-15)
- Key features (lines 17-25)
- Quick start guides (lines 27-60)
- Pricing table (lines 150-160)
- Contact details (bottom)

**Why Important:** First thing developers and users see.

#### 4. **public/robots.txt** - URLs
**Location:** `public/robots.txt`
**What to Update:**
- Replace `skillpassport.rareminds.in` with your actual domain
- Update sitemap URL (line 30)

#### 5. **public/sitemap.xml** - Site Structure
**Location:** `public/sitemap.xml`
**What to Update:**
- Replace all `https://skillpassport.rareminds.in/` URLs with your actual domain
- Remove pages that don't exist yet
- Add pages that do exist

**Example:**
```xml
<!-- Remove if page doesn't exist -->
<url>
  <loc>https://yoursite.com/features</loc>
  ...
</url>

<!-- Add if page exists -->
<url>
  <loc>https://yoursite.com/your-actual-page</loc>
  <lastmod>2026-01-23</lastmod>
  <priority>0.8</priority>
</url>
```

### 🟡 MEDIUM PRIORITY (Update Next)

#### 6. **ai-content-blocks.md** - Structured Content
**Location:** `ai-content-blocks.md`
**What to Update:**
- Product overview block (lines 5-12)
- Feature blocks (lines 14-100)
- Use case blocks (lines 102-180)
- Keywords (lines 250-260)

**Tip:** Update only the features you actually have. Remove or comment out incomplete features.

#### 7. **docs/API_REFERENCE.md** - API Documentation
**Location:** `docs/API_REFERENCE.md`
**What to Update:**
- Base URL (lines 3-6)
- Available endpoints (remove ones you don't have)
- Request/response examples with real data
- Authentication details

**If API not ready:** Add note at top:
```markdown
> ⚠️ **Note:** API documentation is in progress. Contact api@yoursite.com for early access.
```

#### 8. **public/.well-known/ai-plugin.json** - AI Plugin
**Location:** `public/.well-known/ai-plugin.json`
**What to Update:**
- `name_for_human` (line 3)
- `description_for_human` (line 5)
- `description_for_model` (line 6)
- `api.url` (line 15)
- `logo_url` (line 18)
- `contact_email` (line 19)
- Capabilities (lines 21-40) - remove what you don't have

### 🟢 LOW PRIORITY (Update Later)

#### 9. **docs/FAQ.md** - Frequently Asked Questions
**Location:** `docs/FAQ.md`
**What to Update:**
- Answer questions based on your actual features
- Remove sections for features you don't have
- Add questions your users actually ask

**Tip:** Start with 10-15 real questions, expand later.

#### 10. **docs/INTEGRATION_GUIDE.md** - Integration Examples
**Location:** `docs/INTEGRATION_GUIDE.md`
**What to Update:**
- Code examples with your actual API
- Remove integration scenarios you don't support
- Update SDK installation commands

**If not ready:** Replace with:
```markdown
# Integration Guide - Coming Soon

Integration documentation is being prepared. For early access:
- Email: integrations@yoursite.com
- Documentation: Available Q2 2026
```

#### 11. **FEATURES_COMPARISON.md** - Competitive Analysis
**Location:** `FEATURES_COMPARISON.md`
**What to Update:**
- Comparison tables with real data
- Pricing comparisons
- ROI calculations

**Tip:** Use realistic numbers or remove this file until you have data.

#### 12. **CHANGELOG.md** - Version History
**Location:** `CHANGELOG.md`
**What to Update:**
- Keep only real versions
- Document actual changes
- Remove placeholder versions

---

## 📝 Quick Update Checklist

Use this checklist to track your updates:

### Phase 1: Essential Updates (Do Today)
- [ ] Update `index.html` title and meta tags
- [ ] Update `ai-master-truth.md` product overview
- [ ] Update `README.md` main sections
- [ ] Fix domain URLs in `robots.txt`
- [ ] Fix domain URLs in `sitemap.xml`

### Phase 2: Content Refinement (This Week)
- [ ] Update `ai-content-blocks.md` features
- [ ] Review and trim `docs/API_REFERENCE.md`
- [ ] Update `public/.well-known/ai-plugin.json`
- [ ] Customize `public/manifest.json`
- [ ] Update `AI_SYSTEM_README.md` capabilities

### Phase 3: Polish (This Month)
- [ ] Complete `docs/FAQ.md` with real questions
- [ ] Update `docs/INTEGRATION_GUIDE.md` if API ready
- [ ] Refine `FEATURES_COMPARISON.md` with data
- [ ] Update `CHANGELOG.md` with real history
- [ ] Add screenshots and images

---

## 🔍 Find & Replace Strategy

### Global Replacements Needed

1. **Domain Name**
   - Find: `skillpassport.rareminds.in`
   - Replace: `your-actual-domain.com`
   - Files: All `.md`, `.html`, `.json`, `.xml`, `.txt`

2. **Product Name**
   - Find: `Skill Ecosystem`
   - Replace: `Your Actual Product Name`
   - Files: All documentation files

3. **Company Name**
   - Find: `Rareminds`
   - Replace: `Your Company Name`
   - Files: All files

4. **Contact Emails**
   - Find: `support@skillpassport.rareminds.in`
   - Replace: `support@yourdomain.com`
   - Files: All documentation

5. **Pricing**
   - Find: `₹50`, `₹100`
   - Replace: Your actual pricing
   - Files: `README.md`, `ai-master-truth.md`, `FEATURES_COMPARISON.md`

### Using VS Code Find & Replace

```
1. Press Ctrl+Shift+H (Windows) or Cmd+Shift+H (Mac)
2. Enter search term
3. Enter replacement
4. Click "Replace All" or review each
```

---

## 🎨 Content Templates

### For Missing Features

If a feature isn't ready, use this template:

```markdown
### [Feature Name] - Coming Soon

**Status:** In Development  
**Expected:** Q2 2026  
**Early Access:** Contact sales@yourdomain.com

[Brief description of what it will do]
```

### For Incomplete Sections

```markdown
> ⚠️ **Documentation in Progress**  
> This section is being updated. For the latest information, contact support@yourdomain.com
```

### For Beta Features

```markdown
### [Feature Name] (Beta)

**Status:** Beta Testing  
**Availability:** Professional & Enterprise plans  
**Feedback:** beta@yourdomain.com

[Feature description]
```

---

## 📊 Content Completion Tracker

Track your progress:

| File | Status | Priority | Notes |
|------|--------|----------|-------|
| index.html | ⚪ Not Started | 🔴 High | Update meta tags |
| ai-master-truth.md | ⚪ Not Started | 🔴 High | Core reference |
| README.md | ⚪ Not Started | 🔴 High | Main docs |
| robots.txt | ⚪ Not Started | 🔴 High | Fix URLs |
| sitemap.xml | ⚪ Not Started | 🔴 High | Fix URLs |
| ai-content-blocks.md | ⚪ Not Started | 🟡 Medium | Trim features |
| API_REFERENCE.md | ⚪ Not Started | 🟡 Medium | If API ready |
| ai-plugin.json | ⚪ Not Started | 🟡 Medium | Update details |
| FAQ.md | ⚪ Not Started | 🟢 Low | Real questions |
| INTEGRATION_GUIDE.md | ⚪ Not Started | 🟢 Low | If needed |

**Legend:**
- ⚪ Not Started
- 🟡 In Progress  
- ✅ Complete

---

## 💡 Pro Tips

### 1. Start Small
Don't try to complete everything at once. Focus on:
- Homepage (index.html)
- Master truth page
- README

### 2. Be Honest
If features aren't ready:
- Mark as "Coming Soon"
- Remove from documentation
- Add to roadmap

### 3. Use Real Data
Replace placeholder data with:
- Actual user counts
- Real testimonials
- True pricing
- Honest timelines

### 4. Keep It Updated
Set reminders to update:
- Weekly: Homepage content
- Monthly: Feature documentation
- Quarterly: Comparison data

### 5. Version Control
Before major updates:
```bash
git add .
git commit -m "Update documentation - Phase 1"
```

---

## 🚀 Quick Start Commands

### Find all files with placeholder content:
```bash
# Windows (PowerShell)
Get-ChildItem -Recurse -Include *.md,*.html,*.json | Select-String "skillpassport.rareminds.in"

# Mac/Linux
grep -r "skillpassport.rareminds.in" --include="*.md" --include="*.html" --include="*.json"
```

### Count placeholder occurrences:
```bash
# Windows (PowerShell)
(Get-ChildItem -Recurse -Include *.md,*.html | Select-String "skillpassport.rareminds.in").Count

# Mac/Linux
grep -r "skillpassport.rareminds.in" --include="*.md" --include="*.html" | wc -l
```

---

## 📞 Need Help?

If you're unsure about what to update:

1. **Start with the essentials** (High Priority items)
2. **Remove what you don't have** (better to have less accurate content than more inaccurate)
3. **Add as you build** (update documentation as features are completed)

**Remember:** It's better to have 50% accurate content than 100% placeholder content!

---

**Last Updated:** January 23, 2026  
**Next Review:** Update this guide as you complete sections
