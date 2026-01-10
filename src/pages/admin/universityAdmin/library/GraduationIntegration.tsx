import React, { useState } from 'react';
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const GraduationIntegration = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'batches', name: 'Graduation Batches', icon: UserGroupIcon },
    { id: 'clearances', name: 'Clearance Status', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Integration Settings', icon: Cog6ToothIcon },
  ];

  const stats = [
    { name: 'Upcoming Graduations', value: '1,247', change: '+5%', changeType: 'increase' },
    { name: 'Pending Clearances', value: '89', change: '-12%', changeType: 'decrease' },
    { name: 'Cleared Students', value: '1,158', change: '+18%', changeType: 'increase' },
    { name: 'Integration Success Rate', value: '98.2%', change: '+2%', changeType: 'increase' },
  ];

  const graduationBatches = [
    {
      id: 1,
      batchName: 'May 2025 - Engineering',
      college: 'Engineering College A',
      program: 'B.Tech',
      totalStudents: 245,
      clearedStudents: 198,
      pendingClearances: 47,
      graduationDate: '2025-05-15',
      status: 'in-progress',
    },
    {
      id: 2,
      batchName: 'June 2025 - Arts & Science',
      college: 'Arts & Science College B',
      program: 'M.Sc',
      totalStudents: 156,
      clearedStudents: 142,
      pendingClearances: 14,
      graduationDate: '2025-06-20',
      status: 'in-progress',
    },
    {
      id: 3,
      batchName: 'April 2025 - Commerce',
      college: 'Commerce College C',
      program: 'B.Com',
      totalStudents: 189,
      clearedStudents: 189,
      pendingClearances: 0,
      graduationDate: '2025-04-30',
      status: 'completed',
    },
  ];

  const clearanceRequirements = [
    {
      id: 1,
      requirement: 'All Library Books Returned',
      description: 'Student must return all issued books',
      automated: true,
      priority: 'High',
    },
    {
      id: 2,
      requirement: 'Outstanding Fines Cleared',
      description: 'All library fines must be paid',
      automated: true,
      priority: 'High',
    },
    {
      id: 3,
      requirement: 'Library Card Submitted',
      description: 'Physical library card must be returned',
      automated: false,
      priority: 'Medium',
    },
    {
      id: 4,
      requirement: 'No Damage Claims',
      description: 'No pending damage claims for library materials',
      automated: true,
      priority: 'High',
    },
  ];

  const integrationPoints = [
    {
      system: 'Student Information System (SIS)',
      status: 'connected',
      lastSync: '2025-01-10 14:30',
      description: 'Student enrollment and academic records',
    },
    {
      system: 'Library Management System',
      status: 'connected',
      lastSync: '2025-01-10 14:25',
      description: 'Book issues, returns, and fine tracking',
    },
    {
      system: 'Certificate Generation Module',
      status: 'connected',
      lastSync: '2025-01-10 14:20',
      description: 'Automated certificate generation',
    },
    {
      system: 'Alumni Database',
      status: 'pending',
      lastSync: 'Never',
      description: 'Post-graduation student tracking',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* ERP Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">ERP-FR-19: Library Clearance Integration</h3>
        <p className="text-blue-700 mb-4">
          The system shall integrate library clearance with graduation process to ensure all students 
          complete required library procedures before receiving their certificates.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automated clearance verification</li>
              <li>• Real-time status tracking</li>
              <li>• Batch processing for graduations</li>
              <li>• Integration with certificate generation</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Streamlined graduation process</li>
              <li>• Reduced manual verification</li>
              <li>• Improved compliance tracking</li>
              <li>• Enhanced student experience</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Process Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Student Registration</p>
            <p className="text-xs text-gray-500">Graduation batch created</p>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <BuildingLibraryIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-sm font-medium">Library Verification</p>
            <p className="text-xs text-gray-500">Automated clearance check</p>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Clearance Approval</p>
            <p className="text-xs text-gray-500">Status updated in SIS</p>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium">Certificate Generation</p>
            <p className="text-xs text-gray-500">Graduation completed</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBatches = () => (
    <div className="space-y-6">
      {graduationBatches.map((batch) => (
        <div key={batch.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{batch.batchName}</h3>
              <p className="text-sm text-gray-600">{batch.college} - {batch.program}</p>
              <p className="text-sm text-gray-600">Graduation Date: {batch.graduationDate}</p>
            </div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('-', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{batch.totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{batch.clearedStudents}</p>
              <p className="text-sm text-gray-600">Cleared</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{batch.pendingClearances}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${(batch.clearedStudents / batch.totalStudents) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Progress: {Math.round((batch.clearedStudents / batch.totalStudents) * 100)}% completed
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
                View Details
              </button>
              {batch.status === 'in-progress' && (
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                  Process Batch
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderClearances = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Clearance Requirements</h3>
        <div className="space-y-4">
          {clearanceRequirements.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{req.requirement}</h4>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  req.priority === 'High' ? 'bg-red-100 text-red-800' :
                  req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {req.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  req.automated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {req.automated ? 'Automated' : 'Manual'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Integration Status</h3>
        <div className="space-y-4">
          {integrationPoints.map((system, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{system.system}</h4>
                <p className="text-sm text-gray-600">{system.description}</p>
                <p className="text-xs text-gray-500">Last sync: {system.lastSync}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}>
                  {system.status === 'connected' ? (
                    <CheckCircleIcon className="h-3 w-3" />
                  ) : (
                    <ExclamationTriangleIcon className="h-3 w-3" />
                  )}
                  {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                </span>
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-process Clearances</h4>
              <p className="text-sm text-gray-600">Automatically process clearances when requirements are met</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Send email notifications for clearance status updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'batches':
        return renderBatches();
      case 'clearances':
        return renderClearances();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          Graduation Integration
        </h1>
        <p className="text-gray-600 mt-2">
          ERP-FR-19: Integrate library clearance with graduation process
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default GraduationIntegration;