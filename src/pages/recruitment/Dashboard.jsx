import { Briefcase, Users, Eye, TrendingUp } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const RecruiterDashboard = () => {
  const stats = [
    { label: 'Active Jobs', value: '12', icon: Briefcase, color: 'bg-green-100 text-green-600' },
    { label: 'Total Applicants', value: '89', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Profile Views', value: '234', icon: Eye, color: 'bg-orange-100 text-orange-600' },
    { label: 'Hire Rate', value: '18%', icon: TrendingUp, color: 'bg-slate-100 text-slate-600' },
  ];

  const recentJobs = [
    { title: 'Software Engineer', applicants: 23, status: 'active', posted: '2 days ago' },
    { title: 'Product Designer', applicants: 15, status: 'active', posted: '5 days ago' },
    { title: 'Marketing Manager', applicants: 31, status: 'closed', posted: '1 week ago' },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
        </div>
        <Link to="/recruitment/post-job">
          <Button>Post New Job</Button>
        </Link>
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Job Postings</h2>
          <div className="space-y-4">
            {recentJobs.map((job, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      job.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{job.applicants} applicants</span>
                  <span>{job.posted}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/recruitment/applicants">
            <Button variant="outline" className="w-full mt-4">
              View All Jobs
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">AJ</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Alice Johnson</p>
                <p className="text-sm text-gray-600">Applied for Software Engineer</p>
              </div>
              <span className="text-sm text-gray-500">2h ago</span>
            </div>
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">BS</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Bob Smith</p>
                <p className="text-sm text-gray-600">Applied for Product Designer</p>
              </div>
              <span className="text-sm text-gray-500">5h ago</span>
            </div>
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-semibold">CW</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Carol White</p>
                <p className="text-sm text-gray-600">Applied for Marketing Manager</p>
              </div>
              <span className="text-sm text-gray-500">1d ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
