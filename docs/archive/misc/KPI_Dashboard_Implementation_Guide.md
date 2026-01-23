# KPI Dashboard Implementation Guide

## Overview
This document provides a complete guide for implementing the School Admin KPI Dashboard as per the FRD requirements.

## Components Created

### 1. KPIDashboard.tsx (Basic Version)
**Location:** `src/components/admin/KPIDashboard.tsx`

**Features:**
- 7 KPI Cards as per FRD requirements
- Auto-refresh every 15 minutes
- Real-time data fetching from Supabase
- Loading states
- Error handling with retry
- Currency formatting for fees
- Color-coded indicators

**KPI Cards Included:**
1. ✅ Total Students (auto-calculated, numeric display)
2. ✅ Attendance % Today (updates every 15 minutes, numeric)
3. ✅ Exams Scheduled (count of active exams, numeric)
4. ✅ Pending Assessments (teacher-driven, numeric)
5. ✅ Fee Collection (Daily/Weekly/Monthly - currency format)
6. ✅ Career Readiness Index (1-100 scale, AI-driven)
7. ✅ Library Overdue Items (numeric count)

### 2. KPIDashboardAdvanced.tsx (Enhanced Version)
**Location:** `src/components/admin/KPIDashboardAdvanced.tsx`

**Additional Features:**
- Drilldown functionality (click KPI to view details)
- Filter options (Grade, Section, Date Range)
- Manual refresh button
- Auto-refresh toggle
- Last updated timestamp
- Enhanced error handling
- Responsive grid layout

### 3. KPICard.tsx (Existing Component)
**Location:** `src/components/admin/KPICard.tsx`

**Features:**
- Reusable card component
- Color variants (blue, green, yellow, red, purple)
- Loading skeleton
- Trend indicators
- Icon support

## Database Schema Requirements

### Tables Used:
```sql
-- Students table
students (
  student_id UUID PRIMARY KEY,
  school_id UUID,
  status TEXT,
  grade TEXT,
  section TEXT,
  ...
)

-- Attendance Records table
attendance_records (
  att_id UUID PRIMARY KEY,
  student_id UUID,
  school_id UUID,
  date DATE,
  status TEXT, -- 'present', 'absent', 'late', 'excused'
  ...
)

-- Exams table
exams (
  exam_id UUID PRIMARY KEY,
  school_id UUID,
  date DATE,
  ...
)

-- Marks table
marks (
  mark_id UUID PRIMARY KEY,
  school_id UUID,
  published BOOLEAN,
  ...
)

-- Fee Payments table
fee_payments (
  receipt_id UUID PRIMARY KEY,
  student_id UUID,
  school_id UUID,
  amount DECIMAL,
  status TEXT, -- 'success', 'pending', 'failed'
  payment_date TIMESTAMP,
  ...
)

-- Career Recommendations table
career_recommendations (
  rec_id UUID PRIMARY KEY,
  student_id UUID,
  school_id UUID,
  suitability_score INTEGER, -- 0-100
  ...
)

-- Book Issue table
book_issue (
  issue_id UUID PRIMARY KEY,
  school_id UUID,
  due_date DATE,
  return_date DATE,
  ...
)
```

## Installation & Setup

### Step 1: Install Dependencies
```bash
npm install @heroicons/react
```

### Step 2: Configure Supabase
Ensure your Supabase configuration is set up in `src/config/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: Add Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Usage Examples

### Basic Usage
```tsx
import KPIDashboard from '@/components/admin/KPIDashboard';

function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">School Dashboard</h1>
      <KPIDashboard schoolId="your-school-id" />
    </div>
  );
}
```

### Advanced Usage with Drilldown
```tsx
import KPIDashboardAdvanced from '@/components/admin/KPIDashboardAdvanced';

function AdminDashboard() {
  const handleKPIClick = (kpiType: string, data: any) => {
    console.log('KPI Clicked:', kpiType, data);
    // Navigate to detailed view
    // router.push(`/admin/details/${kpiType}`);
  };

  return (
    <div className="p-6">
      <KPIDashboardAdvanced
        schoolId="your-school-id"
        refreshInterval={15 * 60 * 1000} // 15 minutes
        onKPIClick={handleKPIClick}
        enableDrilldown={true}
      />
    </div>
  );
}
```

### Custom Refresh Interval
```tsx
// Refresh every 5 minutes for real-time attendance
<KPIDashboard 
  schoolId="your-school-id"
  refreshInterval={5 * 60 * 1000}
/>
```

## Props Documentation

### KPIDashboard Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| schoolId | string | undefined | School identifier for filtering data |
| refreshInterval | number | 900000 (15 min) | Auto-refresh interval in milliseconds |

### KPIDashboardAdvanced Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| schoolId | string | undefined | School identifier for filtering data |
| refreshInterval | number | 900000 (15 min) | Auto-refresh interval in milliseconds |
| onKPIClick | function | undefined | Callback when KPI card is clicked |
| enableDrilldown | boolean | true | Enable click-through to detailed views |

### KPICard Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Card title |
| value | string \| number | required | Main value to display |
| change | number | undefined | Percentage change |
| changeLabel | string | 'vs last period' | Label for change indicator |
| icon | ReactNode | undefined | Icon component |
| color | string | 'blue' | Color theme (blue/green/yellow/red/purple) |
| loading | boolean | false | Show loading skeleton |

## Color Coding Logic

### Attendance %
- 🟢 Green: ≥ 90%
- 🟡 Yellow: 75-89%
- 🔴 Red: < 75%

### Career Readiness Index
- 🟢 Green: ≥ 75/100
- 🟡 Yellow: 50-74/100
- 🔴 Red: < 50/100

### Pending Assessments
- 🟢 Green: ≤ 10 pending
- 🔴 Red: > 10 pending

### Library Overdue
- 🟢 Green: 0 overdue items
- 🔴 Red: > 0 overdue items

## Performance Optimization

### 1. Auto-refresh Strategy
- Default: 15 minutes (as per FRD)
- Attendance-focused: 5 minutes
- Low-priority: 30 minutes

### 2. Caching
```typescript
// Implement caching to reduce API calls
const [cachedData, setCachedData] = useState<KPIData | null>(null);

// Use cached data on error
if (error && cachedData) {
  return <KPIDashboard data={cachedData} />;
}
```

### 3. Lazy Loading
```typescript
// Load KPI cards progressively
const [loadedCards, setLoadedCards] = useState<string[]>([]);

useEffect(() => {
  // Load cards one by one
  const cards = ['students', 'attendance', 'exams', ...];
  cards.forEach((card, index) => {
    setTimeout(() => {
      setLoadedCards(prev => [...prev, card]);
    }, index * 100);
  });
}, []);
```

## Error Handling

### Network Errors
```typescript
try {
  // Fetch data
} catch (err) {
  if (err.message.includes('network')) {
    setError('Network error. Using cached data.');
    // Use cached data
  } else {
    setError('Failed to load data. Please retry.');
  }
}
```

### Graceful Degradation
- Show cached data on error
- Display partial data if some queries fail
- Provide manual refresh option

## Testing

### Unit Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import KPIDashboard from './KPIDashboard';

test('renders all KPI cards', async () => {
  render(<KPIDashboard schoolId="test-school" />);
  
  await waitFor(() => {
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Attendance % Today')).toBeInTheDocument();
    expect(screen.getByText('Exams Scheduled')).toBeInTheDocument();
  });
});

test('handles loading state', () => {
  render(<KPIDashboard schoolId="test-school" />);
  
  expect(screen.getAllByTestId('kpi-card')).toHaveLength(7);
});
```

### Integration Tests
```typescript
test('fetches and displays real data', async () => {
  const { container } = render(<KPIDashboard schoolId="test-school" />);
  
  await waitFor(() => {
    const values = screen.getAllByTestId('kpi-value');
    expect(values[0]).toHaveTextContent(/\d+/); // Total Students
  });
});
```

## Accessibility

### ARIA Labels
```tsx
<div 
  role="region" 
  aria-label="School KPI Dashboard"
  aria-live="polite"
>
  <KPIDashboard />
</div>
```

### Keyboard Navigation
- All KPI cards are keyboard accessible
- Tab through cards
- Enter to trigger drilldown

## Mobile Responsiveness

### Breakpoints
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns

```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-4
```

## Future Enhancements

### 1. Export Functionality
```typescript
const exportDashboard = () => {
  const data = {
    timestamp: new Date(),
    kpis: kpiData,
  };
  
  // Export to CSV
  const csv = convertToCSV(data);
  downloadFile(csv, 'dashboard-export.csv');
};
```

### 2. Comparison View
```typescript
// Compare current vs previous period
<KPICard
  title="Total Students"
  value={currentData.totalStudents}
  change={calculateChange(currentData, previousData)}
/>
```

### 3. Alerts Integration
```typescript
// Show alerts for critical KPIs
{kpiData.attendanceToday < 75 && (
  <Alert severity="warning">
    Attendance below 75%! Immediate action required.
  </Alert>
)}
```

### 4. Real-time Updates (WebSocket)
```typescript
useEffect(() => {
  const channel = supabase
    .channel('kpi-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        // Update attendance KPI in real-time
        updateAttendanceKPI(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Troubleshooting

### Issue: KPIs not updating
**Solution:** Check auto-refresh is enabled and refresh interval is set correctly.

### Issue: Slow loading
**Solution:** Implement pagination and lazy loading for large datasets.

### Issue: Incorrect data
**Solution:** Verify database queries and school_id filtering.

### Issue: Color coding not working
**Solution:** Check threshold values match FRD requirements.

## Support & Maintenance

### Monitoring
- Track API response times
- Monitor error rates
- Log failed queries

### Updates
- Review KPI thresholds quarterly
- Update color coding based on school policies
- Add new KPIs as requirements evolve

## Conclusion

The KPI Dashboard implementation provides a comprehensive, real-time view of school operations as specified in the FRD. It includes all 7 required KPI cards with proper formatting, color coding, auto-refresh, and error handling.

For questions or issues, refer to the FRD document or contact the development team.
