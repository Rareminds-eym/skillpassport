# ⚠️ MUST CHANGE - Critical Content Updates

This file lists EXACTLY what you need to change in the files I created.

---

## 🔴 CRITICAL - Change These First (5 Minutes)

### 1. index.html

**Line 5:** Change the title
```html
<!-- CHANGE THIS -->
<title>Skill Ecosystem - Educational Management & Career Development Platform</title>

<!-- TO THIS -->
<title>Your Actual Product Name - What You Do</title>
```

**Line 8:** Change the description
```html
<!-- CHANGE THIS -->
<meta name="description" content="Comprehensive educational management platform with AI-powered career guidance..." />

<!-- TO THIS -->
<meta name="description" content="Your actual product description in 150-160 characters" />
```

**Line 9:** Change keywords
```html
<!-- CHANGE THIS -->
<meta name="keywords" content="educational management system, AI career guidance..." />

<!-- TO THIS -->
<meta name="keywords" content="your, actual, keywords, here" />
```

**Lines 13-17:** Change Open Graph tags
```html
<!-- CHANGE THESE -->
<meta property="og:url" content="https://skillpassport.com/" />
<meta property="og:title" content="Skill Ecosystem..." />
<meta property="og:description" content="Integrated platform..." />

<!-- TO THESE -->
<meta property="og:url" content="https://yourdomain.com/" />
<meta property="og:title" content="Your Product Name..." />
<meta property="og:description" content="Your description..." />
```

---

### 2. README.md

**Line 1:** Change product name
```markdown
<!-- CHANGE THIS -->
# Skill Ecosystem

<!-- TO THIS -->
# Your Product Name
```

**Line 3:** Change tagline
```markdown
<!-- CHANGE THIS -->
> Comprehensive educational management and AI-powered career development platform

<!-- TO THIS -->
> Your actual tagline or value proposition
```

**Lines 7-15:** Update overview
```markdown
<!-- CHANGE THIS ENTIRE SECTION -->
Skill Ecosystem is an integrated platform that connects students, educators, and employers...

<!-- TO THIS -->
Your actual product description and what it does
```

**Lines 17-24:** Update key features (REMOVE features you don't have!)
```markdown
<!-- KEEP ONLY FEATURES YOU ACTUALLY HAVE -->
- 🎓 **Academic Management** - (if you have this)
- 🤖 **AI Career Guidance** - (if you have this)
- 💼 **Job Matching** - (if you have this)
```

**Lines 150-160:** Update pricing
```markdown
<!-- CHANGE THIS -->
| **Basic** | ₹50/student/year | Core academic management |

<!-- TO THIS -->
| **Basic** | Your Price | Your features |
```

---

### 3. ai-master-truth.md

**Lines 3-7:** Change core identity
```markdown
<!-- CHANGE THESE -->
**Product Name:** Skill Ecosystem  
**Type:** Educational Management & Career Development Platform  
**Primary Users:** Students, Educators, College Admins, School Admins, Recruiters  

<!-- TO THESE -->
**Product Name:** Your Product Name  
**Type:** Your Product Type  
**Primary Users:** Your Actual Users  
```

**Lines 20-50:** Update features (REMOVE what you don't have!)
```markdown
<!-- ONLY KEEP FEATURES YOU ACTUALLY HAVE -->
### For Students
- **Academic Tracking:** (if you have this)
- **Skill Development:** (if you have this)
```

**Lines 180-190:** Update pricing
```markdown
<!-- CHANGE THIS -->
- **Subscription Plans:** Tiered pricing for institutions
- **Marketplace:** Commission on external course sales

<!-- TO THIS -->
Your actual business model and pricing
```

---

### 4. public/robots.txt

**Lines 1-30:** Change ALL domain URLs
```txt
<!-- CHANGE EVERY OCCURRENCE OF -->
skillpassport.com

<!-- TO -->
yourdomain.com
```

**Line 30:** Change sitemap URL
```txt
<!-- CHANGE THIS -->
Sitemap: https://skillpassport.com/sitemap.xml

<!-- TO THIS -->
Sitemap: https://yourdomain.com/sitemap.xml
```

---

### 5. public/sitemap.xml

**ALL URLs:** Change domain everywhere
```xml
<!-- CHANGE EVERY OCCURRENCE OF -->
<loc>https://skillpassport.com/</loc>

<!-- TO -->
<loc>https://yourdomain.com/</loc>
```

**REMOVE pages you don't have:**
```xml
<!-- IF YOU DON'T HAVE A FEATURES PAGE, DELETE THIS -->
<url>
  <loc>https://yourdomain.com/features</loc>
  ...
</url>
```

---

### 6. public/.well-known/ai-plugin.json

**Line 3:** Change product name
```json
"name_for_human": "Skill Ecosystem",
// CHANGE TO
"name_for_human": "Your Product Name",
```

**Line 5:** Change description
```json
"description_for_human": "Comprehensive educational management...",
// CHANGE TO
"description_for_human": "Your actual description",
```

**Line 15:** Change API URL
```json
"url": "https://skillpassport.com/openapi.json",
// CHANGE TO
"url": "https://yourdomain.com/openapi.json",
```

**Line 18:** Change logo URL
```json
"logo_url": "https://skillpassport.com/logo.png",
// CHANGE TO
"logo_url": "https://yourdomain.com/logo.png",
```

**Line 19:** Change contact email
```json
"contact_email": "support@skillpassport.com",
// CHANGE TO
"contact_email": "support@yourdomain.com",
```

**Lines 21-40:** Remove capabilities you don't have
```json
"capabilities": {
  "academic_management": {
    "attendance": true,  // CHANGE TO false IF YOU DON'T HAVE THIS
    "timetable": true,   // CHANGE TO false IF YOU DON'T HAVE THIS
  }
}
```

---

## 🟡 IMPORTANT - Change These Next (15 Minutes)

### 7. ai-content-blocks.md

**Lines 5-12:** Update product overview
```markdown
PRODUCT: Skill Ecosystem
CATEGORY: Educational Technology, Career Development Platform

<!-- CHANGE TO -->
PRODUCT: Your Product Name
CATEGORY: Your Category
```

**Lines 14-100:** Remove features you don't have
```markdown
<!-- IF YOU DON'T HAVE THIS FEATURE, DELETE THE ENTIRE BLOCK -->
### Academic Management
FEATURE: Academic Management System
...
```

**Lines 250-260:** Update keywords
```markdown
PRIMARY: educational management system, student career guidance

<!-- CHANGE TO -->
PRIMARY: your, actual, keywords
```

---

### 8. public/manifest.json

**Line 2:** Change app name
```json
"name": "Skill Ecosystem",
// CHANGE TO
"name": "Your Product Name",
```

**Line 3:** Change short name
```json
"short_name": "SkillPassport",
// CHANGE TO
"short_name": "YourProduct",
```

**Line 4:** Change description
```json
"description": "Educational management and AI-powered career development platform",
// CHANGE TO
"description": "Your actual description",
```

---

### 9. public/humans.txt

**Lines 5-7:** Change team info
```txt
# TEAM
    Product -- Rareminds Team
    Location -- India

<!-- CHANGE TO -->
# TEAM
    Product -- Your Team Name
    Location -- Your Location
```

---

## 🟢 OPTIONAL - Change If You Have API (Later)

### 10. docs/API_REFERENCE.md

**Lines 3-6:** Change API URLs
```markdown
Production: https://api.skillpassport.com/v1

<!-- CHANGE TO -->
Production: https://api.yourdomain.com/v1
```

**Remove endpoints you don't have:**
```markdown
<!-- IF YOU DON'T HAVE ASSESSMENTS API, DELETE THAT SECTION -->
### Assessments
...
```

---

### 11. public/openapi.json

**Lines 3-8:** Change API info
```json
"title": "Skill Ecosystem API",
"description": "API for educational management...",
"contact": {
  "email": "api@skillpassport.com"
}

// CHANGE TO
"title": "Your Product API",
"description": "Your API description",
"contact": {
  "email": "api@yourdomain.com"
}
```

**Line 13:** Change server URL
```json
"url": "https://api.skillpassport.com/v1",
// CHANGE TO
"url": "https://api.yourdomain.com/v1",
```

---

### 12. docs/INTEGRATION_GUIDE.md

**All code examples:** Change domain and product name
```javascript
// CHANGE THIS
const client = new skillpassport.Client({

// TO THIS
const client = new yourproduct.Client({
```

---

### 13. docs/FAQ.md

**Line 3:** Change product name
```markdown
### What is Skill Ecosystem?

<!-- CHANGE TO -->
### What is Your Product Name?
```

**Update all answers to match YOUR features:**
```markdown
<!-- IF YOU DON'T HAVE A FEATURE, DELETE THAT Q&A -->
### How do I take a career assessment?
...
```

---

## 🔵 OPTIONAL - Change Later

### 14. FEATURES_COMPARISON.md
- Update comparison tables with real data
- Remove if you don't have comparison data yet

### 15. CHANGELOG.md
- Keep only real versions
- Remove placeholder versions

### 16. AI_SYSTEM_README.md
- Update capabilities matrix
- Update metrics with real numbers

---

## 🚀 Quick Update Using Our Tool

Instead of manually changing everything, use the automated tool:

```bash
# 1. Replace domain everywhere
node update-content.js replace "skillpassport.com" "yourdomain.com"

# 2. Replace product name everywhere
node update-content.js replace "Skill Ecosystem" "Your Product Name"

# 3. Replace company name everywhere
node update-content.js replace "Rareminds" "Your Company Name"

# 4. Replace support email everywhere
node update-content.js replace "support@skillpassport.com" "support@yourdomain.com"

# 5. Replace API email everywhere
node update-content.js replace "api@skillpassport.com" "api@yourdomain.com"

# 6. Replace sales email everywhere
node update-content.js replace "sales@skillpassport.com" "sales@yourdomain.com"
```

---

## ✅ Verification Checklist

After making changes, verify:

- [ ] No "skillpassport.com" remains (except in examples)
- [ ] No "Skill Ecosystem" remains
- [ ] No "Rareminds" remains
- [ ] All contact emails are yours
- [ ] All features mentioned actually exist
- [ ] All pricing is accurate
- [ ] All URLs point to your domain

**Quick Check:**
```bash
# Find remaining placeholders
node update-content.js find "skillpassport.com"
node update-content.js find "Rareminds"
node update-content.js find "₹50"
```

---

## 📊 Priority Summary

### Must Change (Critical)
1. ✅ index.html - Title, description, meta tags
2. ✅ README.md - Product name, overview, features
3. ✅ ai-master-truth.md - Core identity, features
4. ✅ public/robots.txt - Domain URLs
5. ✅ public/sitemap.xml - All URLs
6. ✅ public/.well-known/ai-plugin.json - Product info, URLs

### Should Change (Important)
7. ✅ ai-content-blocks.md - Features, keywords
8. ✅ public/manifest.json - App name, description
9. ✅ public/humans.txt - Team info

### Can Change Later (Optional)
10. ⚪ docs/API_REFERENCE.md - If you have API
11. ⚪ public/openapi.json - If you have API
12. ⚪ docs/INTEGRATION_GUIDE.md - If you have integrations
13. ⚪ docs/FAQ.md - Update answers
14. ⚪ FEATURES_COMPARISON.md - Add real data
15. ⚪ CHANGELOG.md - Keep real versions only

---

## 💡 Pro Tips

1. **Use the automated tool** - Much faster than manual editing
2. **Remove features you don't have** - Better to have less accurate content
3. **Be honest about capabilities** - Don't claim features you don't have
4. **Update incrementally** - Start with critical files
5. **Test after changes** - Verify everything still works

---

## 🎯 Fastest Path to Deployment

**5-Minute Quick Update:**
```bash
# Run these 6 commands
node update-content.js replace "skillpassport.com" "yourdomain.com"
node update-content.js replace "Skill Ecosystem" "Your Product Name"
node update-content.js replace "Rareminds" "Your Company"
node update-content.js replace "support@skillpassport.com" "support@yourdomain.com"
node update-content.js replace "api@skillpassport.com" "api@yourdomain.com"
node update-content.js replace "sales@skillpassport.com" "sales@yourdomain.com"
```

**Then manually:**
1. Edit `index.html` - Update title and description (2 minutes)
2. Edit `README.md` - Update overview (2 minutes)
3. Edit `ai-master-truth.md` - Remove features you don't have (3 minutes)
4. Edit `public/sitemap.xml` - Remove pages you don't have (2 minutes)

**Total Time: ~15 minutes**

**Then you're ready to deploy!** 🚀

---

**Questions?** See [CONTENT_UPDATE_GUIDE.md](./CONTENT_UPDATE_GUIDE.md) for detailed explanations.
