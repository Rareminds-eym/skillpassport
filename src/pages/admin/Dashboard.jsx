import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Jobs', value: '89', icon: Briefcase, color: 'bg-green-100 text-green-600' },
    { label: 'Applications', value: '567', icon: FileText, color: 'bg-orange-100 text-orange-600' },
    { label: 'Growth', value: '+23%', icon: TrendingUp, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform activities and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-gray-700">New student registered: John Doe</p>
            </div>
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-gray-700">Job posted: Software Engineer at TechCorp</p>
            </div>
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p className="text-gray-700">Application submitted: Marketing Intern</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Server Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Database</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">API Response Time</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                45ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
