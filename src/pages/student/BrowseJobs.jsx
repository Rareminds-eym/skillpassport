import { useState } from 'react';
import { Search, MapPin, DollarSign, Bookmark } from 'lucide-react';
import Button from '../../components/Button';

const BrowseJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const jobs = [
    {
      id: 1,
      title: 'Software Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$100,000 - $140,000',
      description: 'Build scalable web applications using modern technologies.',
      posted: '2 days ago',
      saved: false,
    },
    {
      id: 2,
      title: 'Product Designer',
      company: 'DesignHub',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80,000 - $110,000',
      description: 'Create beautiful and intuitive user experiences.',
      posted: '3 days ago',
      saved: true,
    },
    {
      id: 3,
      title: 'Data Scientist',
      company: 'DataCorp',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$110,000 - $150,000',
      description: 'Analyze large datasets and build predictive models.',
      posted: '5 days ago',
      saved: false,
    },
    {
      id: 4,
      title: 'Marketing Intern',
      company: 'MarketPro',
      location: 'Boston, MA',
      type: 'Internship',
      salary: '$20/hour',
      description: 'Support marketing campaigns and content creation.',
      posted: '1 week ago',
      saved: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-gray-600 mt-2">Discover new opportunities that match your skills</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button>Search</Button>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Locations</option>
            <option>Remote</option>
            <option>San Francisco</option>
            <option>New York</option>
            <option>Boston</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
            <option>Contract</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                    <p className="text-lg text-gray-700 mt-1">{job.company}</p>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600">
                    <Bookmark className={`w-6 h-6 ${job.saved ? 'fill-blue-600 text-blue-600' : ''}`} />
                  </button>
                </div>
                <p className="text-gray-600 mt-3">{job.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <DollarSign className="w-5 h-5" />
                <span>{job.salary}</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {job.type}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Posted {job.posted}</span>
              <div className="space-x-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm">Apply Now</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseJobs;
