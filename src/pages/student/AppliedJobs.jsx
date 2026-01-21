import { Calendar, MapPin } from 'lucide-react';
import Button from '../../components/Button';

const AppliedJobs = () => {
  const applications = [
    {
      id: 1,
      position: 'Software Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      salary: '$100,000 - $140,000',
      applied: '2025-10-05',
      status: 'pending',
      type: 'Full-time',
    },
    {
      id: 2,
      position: 'UI/UX Designer',
      company: 'DesignHub',
      location: 'Remote',
      salary: '$80,000 - $110,000',
      applied: '2025-10-03',
      status: 'reviewing',
      type: 'Full-time',
    },
    {
      id: 3,
      position: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      salary: '$90,000 - $130,000',
      applied: '2025-10-01',
      status: 'accepted',
      type: 'Full-time',
    },
    {
      id: 4,
      position: 'Frontend Developer Intern',
      company: 'WebCo',
      location: 'Boston, MA',
      salary: '$25/hour',
      applied: '2025-09-28',
      status: 'rejected',
      type: 'Internship',
    },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applied Jobs</h1>
        <p className="text-gray-600 mt-2">Track all your job applications in one place</p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{app.position}</h2>
                <p className="text-lg text-gray-700 mt-1">{app.company}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(
                  app.status
                )}`}
              >
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{app.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <span>{app.salary}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>Applied: {app.applied}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {app.type}
              </span>
              <div className="space-x-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                {app.status === 'pending' && (
                  <Button size="sm" variant="danger">
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">You haven't applied to any jobs yet.</p>
          <Button>Browse Available Jobs</Button>
        </div>
      )}
    </div>
  );
};

export default AppliedJobs;
