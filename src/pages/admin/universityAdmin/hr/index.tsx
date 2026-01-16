import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FacultyLifecycle from './FacultyLifecycle';
import EmployeeRecords from './EmployeeRecords';
import LeaveManagement from './LeaveManagement';
import PayrollManagement from './PayrollManagement';

const HRIndex: React.FC = () => {
  return (
    <Routes>
      <Route path="/faculty-lifecycle" element={<FacultyLifecycle />} />
      <Route path="/employee-records" element={<EmployeeRecords />} />
      <Route path="/leave-management" element={<LeaveManagement />} />
      <Route path="/payroll-management" element={<PayrollManagement />} />
    </Routes>
  );
};

export default HRIndex;