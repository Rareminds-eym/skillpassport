import { useState, useEffect } from 'react';
import { CheckCircle, X, Eye, Filter, Search, File, Video } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

interface Activity {
  id: string;
  student_id: string;
  student: string;
  title: string;
  type: 'Project' | 'Training' | 'Certificate';
  status: 'pending' | 'sent_to_admin' | 'rejected';
  date: string;
  description: string;
  remarks?: string;
  tech_stack?: string[];
  demo_link?: string;
  github_link?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  organization?: string;
  certificate_url?: string;
  video_url?: string;
  ppt_url?: string;
  issuer?: string;
  level?: string;
  credential_id?: string;
  link?: string;
  issued_on?: string;
  document_url?: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent_to_admin' | 'rejected'>('pending');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailModal, setDetailModal] = useState<Activity | null>(null);
  const [remark, setRemark] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    
    try {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      const { data: trainings, error: trainingsError } = await supabase
        .from('trainings')
        .select('*');

      const { data: certificates, error: certificatesError } = await supabase
        .from('certificates')
        .select('*');

      if (projectsError || trainingsError || certificatesError) {
        throw projectsError || trainingsError || certificatesError;
      }

      const allActivities: Activity[] = [
        ...(projects || []).map((p: any) => ({
          id: p.id,
          student_id: p.student_id,
          student: ``,
          title: p.title,
          type: 'Project' as const,
          status: p.approval_status || 'pending',
          date: p.created_at,
          description: p.description || '',
          tech_stack: p.tech_stack,
          demo_link: p.demo_link,
          github_link: p.github_link,
          start_date: p.start_date,
          end_date: p.end_date,
          duration: p.duration,
          organization: p.organization,
          certificate_url: p.certificate_url,
          video_url: p.video_url,
          ppt_url: p.ppt_url,
          remarks: p.remarks,
        })),
        ...(trainings || []).map((t: any) => ({
          id: t.id,
          student_id: t.student_id,
          student: `Student ${t.student_id.substring(0, 8)}`,
          title: t.title,
          type: 'Training' as const,
          status: t.approval_status || 'pending',
          date: t.created_at,
          description: t.description || '',
          organization: t.organization,
          start_date: t.start_date,
          end_date: t.end_date,
          duration: t.duration,
          remarks: t.remarks,
        })),
        ...(certificates || []).map((c: any) => ({
          id: c.id,
          student_id: c.student_id,
          student: `Student ${c.student_id.substring(0, 8)}`,
          title: c.title,
          type: 'Certificate' as const,
          status: c.approval_status || 'pending',
          date: c.created_at,
          description: c.description || '',
          issuer: c.issuer,
          level: c.level,
          credential_id: c.credential_id,
          link: c.link,
          issued_on: c.issued_on,
          document_url: c.document_url,
          remarks: c.remarks,
        })),
      ];

      setActivities(allActivities);

    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleBulkAction = async (action: 'sent_to_admin' | 'rejected') => {
    try {
      const updates = selected.map(async (id) => {
        const activity = activities.find(a => a.id === id);
        if (!activity) return;
        
        const table = activity.type === 'Project' ? 'projects' : 
                     activity.type === 'Training' ? 'trainings' : 'certificates';
        
        const { error } = await supabase
          .from(table)
          .update({ 
            approval_status: action,
            remarks: remark || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        return true;
      });
      
      await Promise.all(updates);
      await fetchActivities();
      setSelected([]);
      setRemark('');
    } catch (error) {
      console.error('Error bulk updating:', error);
    }
  };

  const handleSingleAction = async (id: string, action: 'sent_to_admin' | 'rejected') => {
    try {
      const activity = activities.find(a => a.id === id);
      if (!activity) return;
      
      const table = activity.type === 'Project' ? 'projects' : 
                   activity.type === 'Training' ? 'trainings' : 'certificates';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          approval_status: action,
          remarks: remark || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchActivities();
      setDetailModal(null);
      setRemark('');
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const openDetailModal = (activity: Activity) => {
    setDetailModal(activity);
    setRemark(activity.remarks || '');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      sent_to_admin: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pending',
      sent_to_admin: 'Sent to Admin',
      rejected: 'Rejected',
    };
    return labels[status as keyof typeof labels] || 'Pending';
  };

  const tabCounts = {
    pending: activities.filter(a => a.status === 'pending').length,
    sent_to_admin: activities.filter(a => a.status === 'sent_to_admin').length,
    rejected: activities.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">✅ Activity Verification</h1>
        <p className="text-gray-600">Review and approve student-submitted skill activities</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 bg-white rounded-t-2xl px-6 shadow-sm">
          {(['pending', 'sent_to_admin', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold transition-all relative ${
                activeTab === tab
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getStatusLabel(tab)}
              <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tab === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                tab === 'sent_to_admin' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Project">Project</option>
              <option value="Training">Training</option>
              <option value="Certificate">Certificate</option>
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

      {activeTab === 'pending' && selected.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-md p-4 border border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {selected.length} {selected.length === 1 ? 'activity' : 'activities'} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('sent_to_admin')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Reject Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'pending' && (
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Activity Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    No {getStatusLabel(activeTab).toLowerCase()} activities found
                  </td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    {activeTab === 'pending' && (
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
                        {getStatusLabel(activity.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDetailModal(activity)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setDetailModal(null)}></div>

            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">{detailModal.type} Details</h3>
                  <button
                    onClick={() => setDetailModal(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

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
                  <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                  <p className="text-base font-semibold text-gray-900">{detailModal.title}</p>
                </div>

                {detailModal.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                    <p className="text-sm text-gray-700 leading-relaxed">{detailModal.description}</p>
                  </div>
                )}

                {/* Project Details */}
                {detailModal.type === 'Project' && (
                  <>
                    {detailModal.organization && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Organization</label>
                        <p className="text-sm text-gray-900">{detailModal.organization}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {detailModal.start_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                          <p className="text-sm text-gray-900">{new Date(detailModal.start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {detailModal.end_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                          <p className="text-sm text-gray-900">{new Date(detailModal.end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {detailModal.duration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                        <p className="text-sm text-gray-900">{detailModal.duration}</p>
                      </div>
                    )}
                    {detailModal.tech_stack && detailModal.tech_stack.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Tech Stack</label>
                        <div className="flex flex-wrap gap-2">
                          {detailModal.tech_stack.map((tech, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(detailModal.demo_link || detailModal.github_link) && (
                      <div className="space-y-2">
                        {detailModal.demo_link && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Demo Link</label>
                            <a href={detailModal.demo_link} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline break-all">
                              {detailModal.demo_link}
                            </a>
                          </div>
                        )}
                        {detailModal.github_link && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">GitHub Link</label>
                            <a href={detailModal.github_link} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline break-all">
                              {detailModal.github_link}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {(detailModal.certificate_url || detailModal.video_url || detailModal.ppt_url) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Attachments</label>
                        <div className="space-y-2">
                          {detailModal.certificate_url && (
                            <a href={detailModal.certificate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                              <File className="h-5 w-5" />
                              Certificate
                            </a>
                          )}
                          {detailModal.video_url && (
                            <a href={detailModal.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                              <Video className="h-5 w-5" />
                              Video
                            </a>
                          )}
                          {detailModal.ppt_url && (
                            <a href={detailModal.ppt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                              <File className="h-5 w-5" />
                              Presentation
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Training Details */}
                {detailModal.type === 'Training' && (
                  <>
                    {detailModal.organization && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Organization</label>
                        <p className="text-sm text-gray-900">{detailModal.organization}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {detailModal.start_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                          <p className="text-sm text-gray-900">{new Date(detailModal.start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {detailModal.end_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                          <p className="text-sm text-gray-900">{new Date(detailModal.end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {detailModal.duration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                        <p className="text-sm text-gray-900">{detailModal.duration}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Certificate Details */}
                {detailModal.type === 'Certificate' && (
                  <>
                    {detailModal.issuer && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Issuer</label>
                        <p className="text-sm text-gray-900">{detailModal.issuer}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {detailModal.level && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Level</label>
                          <p className="text-sm text-gray-900">{detailModal.level}</p>
                        </div>
                      )}
                      {detailModal.issued_on && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Issued On</label>
                          <p className="text-sm text-gray-900">{new Date(detailModal.issued_on).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {detailModal.credential_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Credential ID</label>
                        <p className="text-sm text-gray-900 font-mono">{detailModal.credential_id}</p>
                      </div>
                    )}
                    {detailModal.link && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Verification Link</label>
                        <a href={detailModal.link} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline break-all">
                          {detailModal.link}
                        </a>
                      </div>
                    )}
                    {detailModal.document_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Document</label>
                        <a href={detailModal.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                          <File className="h-5 w-5" />
                          View Certificate Document
                        </a>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Educator Remarks {activeTab === 'pending' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Add your feedback or remarks..."
                    disabled={activeTab !== 'pending'}
                  />
                </div>

                {detailModal.remarks && activeTab !== 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Previous Remarks</label>
                    <p className="text-sm text-blue-800">{detailModal.remarks}</p>
                  </div>
                )}
              </div>

              {activeTab === 'pending' && (
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
                  <button
                    onClick={() => setDetailModal(null)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSingleAction(detailModal.id, 'rejected')}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <X className="h-5 w-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleSingleAction(detailModal.id, 'sent_to_admin')}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
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