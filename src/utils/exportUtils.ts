// Export utilities for Analytics dashboard

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export specific section data to CSV
 */
export const exportSectionToCSV = (sectionName: string, data: any) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics_${sectionName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

  let exportData: any[] = [];

  switch (sectionName) {
    case 'Recruitment Funnel':
      exportData = data.map((stage: any) => ({
        Stage: stage.label,
        Candidates: stage.value,
        Conversion: stage.conversion ? `${stage.conversion}%` : 'N/A',
      }));
      break;

    case 'Quality Metrics':
      exportData = [
        { Metric: 'External Audited %', Value: data.external_audited_percentage },
        { Metric: 'Avg AI Score', Value: data.avg_ai_score_hired },
        { Metric: 'Rubric Pass Rate %', Value: data.rubric_pass_rate },
      ];
      break;

    case 'Speed Analytics':
      exportData = [
        { Metric: 'Time to First Response', Value: `${data.median_time_to_first_response} days` },
        { Metric: 'Time to Hire', Value: `${data.median_time_to_hire} days` },
        { Metric: 'Interview to Offer', Value: `${data.avg_interview_to_offer} days` },
        { Metric: 'Fastest Hire', Value: `${data.fastest_hire} days` },
      ];
      break;

    case 'Geographic Distribution':
      exportData = data.map((loc: any) => ({
        City: loc.city,
        Count: loc.count,
        Percentage: `${loc.percentage}%`,
      }));
      break;

    case 'Hackathon Performance':
      exportData = data.map((h: any) => ({
        Event: h.name,
        Applications: h.applications,
        Hires: h.hires,
        'Success Rate': `${((h.hires / h.applications) * 100).toFixed(1)}%`,
      }));
      break;

    case 'Course Performance':
      exportData = data.map((c: any) => ({
        Course: c.name,
        Candidates: c.applications,
        Hires: c.hires,
        'Success Rate': `${((c.hires / c.applications) * 100).toFixed(1)}%`,
      }));
      break;

    default:
      exportData = Array.isArray(data) ? data : [data];
  }

  exportToCSV(exportData, filename);
};

/**
 * Print/Generate PDF of the entire dashboard
 */
export const printDashboard = () => {
  window.print();
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get relative time (e.g., "2 minutes ago")
 */
export const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;

  return formatDate(date);
};

/**
 * Export data to Excel with formatted sheets
 * Note: This uses a simplified CSV export. For production, consider using xlsx library
 */
export const exportToExcel = (sections: Array<{ name: string; data: any[] }>, filename: string) => {
  let excelContent = '';

  sections.forEach((section, index) => {
    if (index > 0) excelContent += '\n\n'; // Add spacing between sections

    // Add section header
    excelContent += `${section.name}\n`;
    excelContent += '='.repeat(50) + '\n';

    // Add section data
    if (section.data && section.data.length > 0) {
      const headers = Object.keys(section.data[0]);
      excelContent += headers.join(',') + '\n';

      section.data.forEach((row) => {
        excelContent +=
          headers
            .map((header) => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(',') + '\n';
      });
    }
  });

  // Create blob and download
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate comprehensive analytics export
 */
export const exportComprehensiveAnalytics = (
  data: {
    funnel: any;
    quality: any;
    speed: any;
    geography: any;
    attribution: any;
    recruiters?: any[];
  },
  format: 'csv' | 'excel' = 'excel'
) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics_comprehensive_${timestamp}`;

  if (format === 'excel') {
    const sections = [
      {
        name: 'Recruitment Funnel',
        data: [
          { Stage: 'Sourced', Count: data.funnel.sourced },
          {
            Stage: 'Screened',
            Count: data.funnel.screened,
            'Conversion %': ((data.funnel.screened / data.funnel.sourced) * 100).toFixed(1),
          },
          {
            Stage: 'Interviewed',
            Count: data.funnel.interviewed,
            'Conversion %': ((data.funnel.interviewed / data.funnel.screened) * 100).toFixed(1),
          },
          {
            Stage: 'Offered',
            Count: data.funnel.offered,
            'Conversion %': ((data.funnel.offered / data.funnel.interviewed) * 100).toFixed(1),
          },
          {
            Stage: 'Hired',
            Count: data.funnel.hired,
            'Conversion %': ((data.funnel.hired / data.funnel.offered) * 100).toFixed(1),
          },
        ],
      },
      {
        name: 'Speed Metrics',
        data: [
          {
            Metric: 'Time to First Response',
            Value: `${data.speed.median_time_to_first_response} days`,
          },
          { Metric: 'Time to Hire', Value: `${data.speed.median_time_to_hire} days` },
          { Metric: 'Interview to Offer', Value: `${data.speed.avg_interview_to_offer} days` },
          { Metric: 'Fastest Hire', Value: `${data.speed.fastest_hire} days` },
        ],
      },
      {
        name: 'Quality Metrics',
        data: [
          { Metric: 'External Audited %', Value: data.quality.external_audited_percentage },
          { Metric: 'Avg AI Score (Hired)', Value: data.quality.avg_ai_score_hired },
          { Metric: 'Rubric Pass Rate %', Value: data.quality.rubric_pass_rate },
        ],
      },
      {
        name: 'Geographic Distribution',
        data: data.geography.locations.map((loc: any) => ({
          City: loc.city,
          'Hire Count': loc.count,
          Percentage: `${loc.percentage}%`,
        })),
      },
      {
        name: 'Top Colleges',
        data: data.geography.colleges.map((college: any) => ({
          College: college.name,
          'Hire Count': college.count,
        })),
      },
    ];

    if (data.recruiters && data.recruiters.length > 0) {
      sections.push({
        name: 'Recruiter Performance',
        data: data.recruiters.map((r: any) => ({
          Recruiter: r.name,
          'Total Hires': r.totalHires,
          'Conversion Rate %': r.conversionRate,
          'Avg Time to Hire (days)': r.avgTimeToHire,
          'Quality Score': r.avgQualityScore,
          'Offer Acceptance %': r.offerAcceptanceRate,
        })),
      });
    }

    exportToExcel(sections, filename);
  } else {
    // Fallback to simple CSV export
    exportSectionToCSV('Comprehensive Analytics', data);
  }
};

/**
 * Schedule a report (simulation - in production this would call an API)
 */
export const scheduleReport = (config: {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  sections: string[];
  format: 'csv' | 'excel' | 'pdf';
}) => {
  // In production, this would make an API call to backend
  // For now, just show a success message
  alert(
    `Report "${config.name}" scheduled successfully!\n\nFrequency: ${config.frequency}\nRecipients: ${config.recipients.join(', ')}\nFormat: ${config.format.toUpperCase()}`
  );

  return {
    id: `report_${Date.now()}`,
    ...config,
    nextRun: getNextRunDate(config.frequency),
    isActive: true,
  };
};

/**
 * Calculate next run date based on frequency
 */
const getNextRunDate = (frequency: 'daily' | 'weekly' | 'monthly'): string => {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }

  return now.toISOString();
};

/**
 * Download sample template for bulk operations
 */
export const downloadTemplate = (type: 'candidates' | 'jobs' | 'offers') => {
  let template: any[] = [];

  switch (type) {
    case 'candidates':
      template = [
        {
          Name: 'John Doe',
          Email: 'john@example.com',
          Phone: '+1234567890',
          Location: 'City',
          Skills: 'Skill1, Skill2',
          Experience: '2 years',
          Source: 'LinkedIn',
        },
      ];
      break;
    case 'jobs':
      template = [
        {
          Title: 'Software Engineer',
          Department: 'Engineering',
          Location: 'Remote',
          'Job Level': 'Mid Level',
          Description: 'Job description here',
          Requirements: 'Requirement 1, Requirement 2',
        },
      ];
      break;
    case 'offers':
      template = [
        {
          'Candidate ID': 'CAND001',
          'Job Title': 'Software Engineer',
          Salary: '80000',
          'Start Date': '2025-01-15',
          Benefits: 'Health, Dental, 401k',
        },
      ];
      break;
  }

  exportToCSV(template, `${type}_template`);
};
