import { useState } from 'react';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  EyeIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  student: string;
  title: string;
  type: 'Project' | 'Art' | 'Sports' | 'Competition' | 'Workshop' | 'Certification';
  status: 'Pending' | 'Verified' | 'Rejected';
  date: string;
  media: string;
  description: string;
  remarks?: string;
}

const mockActivities: Activity[] = [
  {
    id: 'A001',
    student: 'John Doe',
    title: 'Science Project',
    type: 'Project',
    status: 'Pending',
    date: '2025-10-29',
    media: 'project.pdf',
    description: 'A comprehensive project on renewable energy sources and their impact on climate change.',
  },
  {
    id: 'A002',
    student: 'Priya S.',
    title: 'Art Portfolio',
    type: 'Art',
    status: 'Pending',
    date: '2025-10-28',
    media: 'portfolio.jpg',
    description: 'A collection of paintings exploring abstract expressionism.',
  },
  {
    id: 'A003',
    student: 'Rahul Sharma',
    title: 'Coding Competition',
    type: 'Competition',
    status: 'Verified',
    date: '2025-10-25',
    media: 'certificate.pdf',
    description: 'First place in regional coding hackathon. Developed an AI-based solution.',
    remarks: 'Excellent problem-solving skills demonstrated.'
  },
  {
    id: 'A004',
    student: 'Sneha Reddy',
    title: 'Basketball Tournament',
    type: 'Sports',
    status: 'Verified',
    date: '2025-10-24',
    media: 'sports.jpg',
    description: 'Participated in inter-school basketball tournament.',
    remarks: 'Great teamwork and leadership.'
  },
  {
    id: 'A005',
    student: 'Amit Kumar',
    title: 'Music Workshop',
    type: 'Workshop',
    status: 'Rejected',
    date: '2025-10-20',
    media: 'workshop.pdf',
    description: 'Attended a 2-day music production workshop.',
    remarks: 'Insufficient documentation provided.'
  },
];

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailModal, setDetailModal] = useState<Activity | null>(null);
  const [remark, setRemark] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesTab = activity.status === activeTab;
    const matchesSearch = activity.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesDate = (!dateRange.start || activity.date >= dateRange.start) &&
                       (!dateRange.end || activity.date <= dateRange.end);
    return matchesTab && matchesSearch && matchesType && matchesDate;
  });

  const handleSelect = (id: string) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleBulkAction = (action: 'Verified' | 'Rejected') => {
    setActivities(activities.map(activity => 
      selected.includes(activity.id) 
        ? { ...activity, status: action, remarks: `Bulk ${action.toLowerCase()}` }
        : activity
    ));
    setSelected([]);
  };

  const handleSingleAction = (id: string, action: 'Verified' | 'Rejected') => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, status: action, remarks: remark || `${action} by educator` }
        : activity
    ));
    setDetailModal(null);
    setRemark('');
  };

  const openDetailModal = (activity: Activity) => {
    setDetailModal(activity);
    setRemark(activity.remarks || '');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Verified: 'bg-green-100 text-green-800 border-green-300',
      Rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return badges[status as keyof typeof badges] || badges.Pending;
  };

  const getMediaIcon = (filename: string) => {
    if (filename.endsWith('.pdf') || filename.endsWith('.doc')) return <DocumentIcon className="h-5 w-5" />;
    if (filename.endsWith('.jpg') || filename.endsWith('.png')) return <PhotoIcon className="h-5 w-5" />;
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) return <VideoCameraIcon className="h-5 w-5" />;
    return <DocumentIcon className="h-5 w-5" />;
  };

  const tabCounts = {
    Pending: activities.filter(a => a.status === 'Pending').length,
    Verified: activities.filter(a => a.status === 'Verified').length,
    Rejected: activities.filter(a => a.status === 'Rejected').length,
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">✅ Activity Verification</h1>
        <p className="text-gray-600">Review and approve student-submitted skill activities</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 bg-white rounded-t-2xl px-6 shadow-sm">
          {(['Pending', 'Verified', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold transition-all relative ${
                activeTab === tab
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tab === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                tab === 'Verified' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Project">Project</option>
              <option value="Art">Art</option>
              <option value="Sports">Sports</option>
              <option value="Competition">Competition</option>
              <option value="Workshop">Workshop</option>
              <option value="Certification">Certification</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {activeTab === 'Pending' && selected.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-md p-4 border border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {selected.length} {selected.length === 1 ? 'activity' : 'activities'} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('Verified')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('Rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <XMarkIcon className="h-5 w-5" />
              Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'Pending' && (
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selected.length === filteredActivities.length && filteredActivities.length > 0}
                      onChange={() => 
                        setSelected(
                          selected.length === filteredActivities.length 
                            ? [] 
                            : filteredActivities.map(a => a.id)
                        )
                      }
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Activity Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'Pending' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    No {activeTab.toLowerCase()} activities found
                  </td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    {activeTab === 'Pending' && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(activity.id)}
                          onChange={() => handleSelect(activity.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{activity.student}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{activity.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(activity)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                        {activeTab === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleSingleAction(activity.id, 'Verified')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleSingleAction(activity.id, 'Rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setDetailModal(null)}></div>

            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Activity Details</h3>
                  <button
                    onClick={() => setDetailModal(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Student Name</label>
                    <p className="text-base font-semibold text-gray-900">{detailModal.student}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Activity Type</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {detailModal.type}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Activity Title</label>
                  <p className="text-base font-semibold text-gray-900">{detailModal.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailModal.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Submission Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(detailModal.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Media Attachment</label>
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      {getMediaIcon(detailModal.media)}
                      <a href="#" className="hover:underline">{detailModal.media}</a>
                    </div>
                  </div>
                </div>

                {/* Media Preview Placeholder */}
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3">
                    {getMediaIcon(detailModal.media)}
                  </div>
                  <p className="text-sm text-gray-600">Media Preview</p>
                  <p className="text-xs text-gray-500 mt-1">{detailModal.media}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Educator Remarks {activeTab === 'Pending' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Add your feedback or remarks..."
                    disabled={activeTab !== 'Pending'}
                  />
                </div>

                {detailModal.remarks && activeTab !== 'Pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Previous Remarks</label>
                    <p className="text-sm text-blue-800">{detailModal.remarks}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {activeTab === 'Pending' && (
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
                  <button
                    onClick={() => setDetailModal(null)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSingleAction(detailModal.id, 'Rejected')}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleSingleAction(detailModal.id, 'Verified')}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
