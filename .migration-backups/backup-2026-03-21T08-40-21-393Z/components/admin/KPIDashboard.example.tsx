/**
 * KPI Dashboard Usage Examples
 * 
 * This file demonstrates how to use the KPI Dashboard components
 * in different scenarios for the School Admin Portal
 */

import { useState } from 'react';
import KPIDashboard from './KPIDashboard';
import KPIDashboardAdvanced from './KPIDashboardAdvanced';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================
export const BasicKPIDashboardExample = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">School Admin Dashboard</h1>
      <KPIDashboard schoolId="your-school-id" />
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: Advanced Usage with Drilldown
// ============================================================================
export const AdvancedKPIDashboardExample = () => {
  const [selectedKPI, setSelectedKPI] = useState<any>(null);

  const handleKPIClick = (kpiType: string, data: any) => {
    console.log('KPI Clicked:', kpiType, data);
    setSelectedKPI({ type: kpiType, data });
    
    // Navigate to detailed view or show modal
    // Example: router.push(`/admin/details/${kpiType}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">School Admin Dashboard</h1>
      
      <KPIDashboardAdvanced
        schoolId="your-school-id"
        refreshInterval={15 * 60 * 1000} // 15 minutes
        onKPIClick={handleKPIClick}
        enableDrilldown={true}
      />

      {/* Show selected KPI details */}
      {selectedKPI && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">Selected KPI: {selectedKPI.type}</h3>
          <pre className="text-sm">{JSON.stringify(selectedKPI.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: Custom Refresh Interval (5 minutes for attendance)
// ============================================================================
export const FastRefreshDashboardExample = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Real-Time Attendance Dashboard</h1>
      <KPIDashboard 
        schoolId="your-school-id"
        refreshInterval={5 * 60 * 1000} // 5 minutes for real-time attendance
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Principal Dashboard with Full Features
// ============================================================================
export const PrincipalDashboardExample = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  const handleKPIClick = async (kpiType: string, data: any) => {
    // Fetch detailed data based on KPI type
    switch (kpiType) {
      case 'students':
        // Fetch student list with filters
        setModalContent({
          title: 'Student Details',
          type: 'students',
          data: data
        });
        break;
      
      case 'attendance':
        // Fetch attendance breakdown by class/section
        setModalContent({
          title: 'Attendance Breakdown',
          type: 'attendance',
          data: data
        });
        break;
      
      case 'exams':
        // Fetch exam schedule
        setModalContent({
          title: 'Upcoming Exams',
          type: 'exams',
          data: data
        });
        break;
      
      case 'assessments':
        // Fetch pending assessments list
        setModalContent({
          title: 'Pending Assessments',
          type: 'assessments',
          data: data
        });
        break;
      
      case 'fees':
        // Fetch fee collection details
        setModalContent({
          title: 'Fee Collection Details',
          type: 'fees',
          data: data
        });
        break;
      
      case 'career':
        // Fetch career readiness breakdown
        setModalContent({
          title: 'Career Readiness Analysis',
          type: 'career',
          data: data
        });
        break;
      
      case 'library':
        // Fetch overdue books list
        setModalContent({
          title: 'Overdue Library Items',
          type: 'library',
          data: data
        });
        break;
    }
    
    setShowDetailModal(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Real-time overview of school operations
        </p>
      </div>

      <KPIDashboardAdvanced
        schoolId="your-school-id"
        refreshInterval={15 * 60 * 1000}
        onKPIClick={handleKPIClick}
        enableDrilldown={true}
      />

      {/* Detail Modal */}
      {showDetailModal && modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{modalContent.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Render detailed content based on type */}
              <pre className="bg-gray-50 p-4 rounded-lg text-sm">
                {JSON.stringify(modalContent.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Multi-School Dashboard (for IT Admin)
// ============================================================================
export const MultiSchoolDashboardExample = () => {
  const [selectedSchool, setSelectedSchool] = useState('school-1');
  
  const schools = [
    { id: 'school-1', name: 'Delhi Public School' },
    { id: 'school-2', name: 'Ryan International' },
    { id: 'school-3', name: 'Kendriya Vidyalaya' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Multi-School Dashboard</h1>
        
        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          {schools.map(school => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      <KPIDashboardAdvanced
        schoolId={selectedSchool}
        refreshInterval={15 * 60 * 1000}
        enableDrilldown={true}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 6: Export Dashboard Data
// ============================================================================
export const ExportableDashboardExample = () => {
  const handleExportData = async () => {
    // Export KPI data to CSV/PDF
    console.log('Exporting dashboard data...');
    // Implementation for export functionality
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">School Admin Dashboard</h1>
        
        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Export Dashboard
        </button>
      </div>

      <KPIDashboard schoolId="your-school-id" />
    </div>
  );
};
