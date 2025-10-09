import { Search, Download, Filter } from 'lucide-react';
import Button from '../../components/Button';

const ViewApplicants = () => {
  const applicants = [
    {
      id: 1,
      name: 'Alice Johnson',
      job: 'Software Engineer',
      applied: '2025-10-05',
      status: 'pending',
      skills: 'React, Node.js, Python',
    },
    {
      id: 2,
      name: 'Bob Smith',
      job: 'Product Designer',
      applied: '2025-10-04',
      status: 'reviewed',
      skills: 'Figma, UI/UX, Prototyping',
    },
    {
      id: 3,
      name: 'Carol White',
      job: 'Marketing Manager',
      applied: '2025-10-03',
      status: 'shortlisted',
      skills: 'SEO, Content Strategy, Analytics',
    },
    {
      id: 4,
      name: 'David Brown',
      job: 'Software Engineer',
      applied: '2025-10-02',
      status: 'rejected',
      skills: 'Java, Spring Boot, MySQL',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">View Applicants</h1>
        <p className="text-gray-600 mt-2">Review and manage job applications</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search applicants..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job Applied</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skills</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Applied Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={applicant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{applicant.name}</td>
                  <td className="py-3 px-4 text-gray-600">{applicant.job}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{applicant.skills}</td>
                  <td className="py-3 px-4 text-gray-600">{applicant.applied}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                        applicant.status
                      )}`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewApplicants;
