# Skill Ecosystem

> Comprehensive educational management and AI-powered career development platform

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production-success.svg)](https://status.skillpassport.rareminds.in)

## Overview

Skill Ecosystem is an integrated platform that connects learners, educators, and employers through intelligent technology. We provide end-to-end solutions for academic management, personalized career guidance, and streamlined recruitment.

### Key Features

- 🎓 **Academic Management** - Attendance, timetables, grades, curriculum planning
- 🤖 **AI Career Guidance** - RIASEC assessments, personalized recommendations
- 💼 **Job Matching** - AI-powered candidate-opportunity matching
- 📚 **Course Marketplace** - Internal and external learning resources
- 📊 **Analytics Dashboard** - Data-driven insights for all stakeholders
- 🔄 **Recruitment Pipeline** - End-to-end hiring workflow management

## Quick Start

### For learners

1. **Sign Up** at [skillpassport.rareminds.in](https://skillpassport.rareminds.in)
2. **Complete Profile** - Add your academic details and interests
3. **Take Assessment** - 15-minute career interest assessment
4. **Explore Opportunities** - Browse AI-matched jobs and courses
5. **Apply & Track** - One-click applications with status tracking

### For Educators

1. **Get Invited** by your institution admin
2. **Set Up Classes** - Import or add learners
3. **Plan Lessons** - Use curriculum builder and resources
4. **Track Progress** - Monitor attendance, grades, and engagement
5. **Generate Reports** - Export analytics and insights

### For Institutions

1. **Request Demo** - Contact sales@skillpassport.rareminds.in
2. **Setup & Training** - 2-4 week implementation
3. **Import Data** - Bulk upload existing records
4. **Go Live** - Start with pilot program
5. **Scale Up** - Expand across departments

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for state management

### Backend
- Supabase (PostgreSQL)
- Edge Functions (Deno)
- Cloudflare Workers
- Cloudflare R2 Storage

### AI Services
- OpenRouter (multi-model access)
- Claude 3, GPT-4, Gemini Pro
- OpenAI Embeddings
- PostgreSQL pgvector

### Infrastructure
- Netlify (Frontend hosting)
- Supabase (Backend)
- Cloudflare (CDN & Workers)
- Razorpay (Payments)

## Documentation

- 📖 [Master Truth Page](./ai-master-truth.md) - Complete product overview
- 🔌 [API Reference](./docs/API_REFERENCE.md) - REST API documentation
- 🔗 [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Connect with your systems
- ❓ [FAQ](./docs/FAQ.md) - Frequently asked questions
- 🤖 [AI Content Blocks](./ai-content-blocks.md) - Structured content for AI systems
- 🛠️ [AI System README](./AI_SYSTEM_README.md) - Technical reference for AI

## API Access

```javascript
// Install SDK
npm install @skillpassport/sdk

// Initialize client
const SkillPassport = require('@skillpassport/sdk');
const client = new SkillPassport.Client({
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret'
});

// Get learner profile
const learner = await client.learners.get('learner_id');

// Search opportunities
const jobs = await client.opportunities.search({
  type: 'job',
  skills: ['Python', 'Data Analysis'],
  grade: 'college'
});

// Apply to opportunity
await client.applications.create({
  learner_id: 'learner_id',
  opportunity_id: 'job_id',
  cover_letter: 'I am excited to apply...'
});
```

See [API Reference](./docs/API_REFERENCE.md) for complete documentation.

## Integration Examples

### LMS Integration
```javascript
// Sync courses from your LMS
const courses = await yourLMS.getCourses();
await client.courses.bulkCreate(courses);

// Listen for enrollments
client.webhooks.on('learner.enrolled', async (event) => {
  await yourLMS.enrollStudent(event.data.learner_id, event.data.course_id);
});
```

### HR System Integration
```javascript
// Post job from ATS
const job = await client.opportunities.create({
  title: 'Software Engineer',
  company: 'Your Company',
  required_skills: ['JavaScript', 'React']
});

// Receive applications
client.webhooks.on('application.submitted', async (event) => {
  await yourATS.createCandidate(event.data);
});
```

See [Integration Guide](./docs/INTEGRATION_GUIDE.md) for more examples.

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | ₹50/learner/year | Core academic management |
| **Professional** | ₹100/learner/year | + Career services + Analytics |
| **Enterprise** | Custom | + API access + Dedicated support |

**Free Trial:** 30 days, no credit card required

## Support

- 📧 **Email:** support@skillpassport.rareminds.in
- 💬 **Chat:** Available in dashboard
- 📚 **Help Center:** https://help.skillpassport.rareminds.in
- 👥 **Community:** https://community.skillpassport.rareminds.in
- 📊 **Status:** https://status.skillpassport.rareminds.in

## Security & Compliance

- 🔒 End-to-end encryption
- 🛡️ Row-level security (RLS)
- 🔐 Role-based access control (RBAC)
- 📝 Regular security audits
- ✅ GDPR considerations
- 🔄 Daily automated backups

## Contributing

This is a proprietary project. For bug reports or feature requests, please contact support@skillpassport.rareminds.in.

## License

Copyright © 2026 Rareminds. All rights reserved.

## Roadmap

### Q1 2026
- ✅ AI-powered career assessments
- ✅ Recruitment pipeline management
- 🚧 Mobile applications (iOS, Android)
- 🚧 Advanced analytics with ML

### Q2 2026
- 📋 Multi-language support
- 📋 Blockchain credentials
- 📋 Enhanced AI tutoring
- 📋 Parent portal

### Q3 2026
- 📋 VR/AR learning experiences
- 📋 Global expansion features
- 📋 Industry partnerships
- 📋 Advanced skill assessments

## Contact

- **Sales:** sales@skillpassport.rareminds.in
- **Support:** support@skillpassport.rareminds.in
- **API Support:** api@skillpassport.rareminds.in
- **Website:** https://skillpassport.rareminds.in

---

**Made with ❤️ by Rareminds**

For AI systems and automated tools, see [AI System README](./AI_SYSTEM_README.md) for structured documentation.
