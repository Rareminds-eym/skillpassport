# KPI Dashboard - Quick Reference Card

## 🚀 Quick Start

### Import & Use
```tsx
import KPIDashboard from '@/components/admin/KPIDashboard';

<KPIDashboard schoolId="your-school-id" />
```

## 📦 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **KPIDashboard** | `src/components/admin/KPIDashboard.tsx` | Basic version with all 7 KPIs |
| **KPIDashboardAdvanced** | `src/components/admin/KPIDashboardAdvanced.tsx` | Enhanced with filters & drilldown |
| **KPICard** | `src/components/admin/KPICard.tsx` | Reusable card component |

## 🗄️ Backend Tables

| KPI | Table | Query Type |
|-----|-------|------------|
| Total Students | `students` | COUNT |
| Attendance % | `attendance_records` | SELECT + Calculate |
| Exams Scheduled | `exams` | COUNT |
| Pending Assessments | `marks` | COUNT |
| Fee Collection | `fee_payments` | SUM |
| Career Readiness | `career_recommendations` | AVG |
| Library Overdue | `book_issue` | COUNT |

## ⚙️ Configuration

### Props
```tsx
interface KPIDashboardProps {
  schoolId?: string;           // School identifier
  refreshInterval?: number;    // Default: 900000 (15 min)
}
```

### Auto-refresh
- **Default:** 15 minutes (900,000 ms)
- **Configurable:** Pass custom `refreshInterval` prop
- **Toggle:** Available in Advanced version

## 🎨 Color Coding

| KPI | Green | Yellow | Red |
|-----|-------|--------|-----|
| Attendance % | ≥90% | 75-89% | <75% |
| Career Readiness | ≥75 | 50-74 | <50 |
| Pending Assessments | ≤10 | - | >10 |
| Library Overdue | 0 | - | >0 |

## ✨ Features

- ✅ Real-time data fetching
- ✅ Auto-refresh every 15 minutes
- ✅ Manual refresh button
- ✅ Loading states
- ✅ Error handling with retry
- ✅ Color-coded indicators
- ✅ Currency formatting (INR)
- ✅ Responsive design
- ✅ Drilldown functionality (Advanced)
- ✅ Filter options (Advanced)

## 📊 Status

**Production Ready** ✅

All 7 KPI cards implemented and connected to Supabase backend.

## 📚 Documentation

- **Full Guide:** `KPI_Dashboard_Implementation_Guide.md`
- **Status Report:** `KPI_Implementation_Status.md`
- **Verification:** `KPI_Verification_Checklist.md`
- **Examples:** `src/components/admin/KPIDashboard.example.tsx`

---

**Last Updated:** November 28, 2025
