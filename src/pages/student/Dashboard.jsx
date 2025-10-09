import { Briefcase, FileText, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const stats = [
    { label: 'Applications', value: '8', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'In Progress', value: '3', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Accepted', value: '1', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Jobs Saved', value: '12', icon: Briefcase, color: 'bg-slate-100 text-slate-600' },
  ];

  const recentApplications = [
    { company: 'TechCorp', position: 'Software Engineer', status: 'pending', date: '2025-10-05' },
    { company: 'DesignHub', position: 'UI/UX Designer', status: 'reviewing', date: '2025-10-03' },
    { company: 'StartupXYZ', position: 'Full Stack Developer', status: 'accepted', date: '2025-10-01' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your applications and career progress</p>
        </div>
        <Link to="/student/browse-jobs">
          <Button>Browse Jobs</Button>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
          <div className="space-y-4">
            {recentApplications.map((app, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.position}</h3>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Applied on {app.date}</p>
              </div>
            ))}
          </div>
          <Link to="/student/applied-jobs">
            <Button variant="outline" className="w-full mt-4">
              View All Applications
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Completion</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Overall Progress</span>
                <span className="text-blue-600 font-semibold">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800">Basic Information</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800">Education Details</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-800">Work Experience</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Skills & Certifications</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <Link to="/student/profile">
              <Button className="w-full mt-2">Complete Your Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
