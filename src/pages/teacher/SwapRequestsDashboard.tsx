import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import SwapRequestCard from '../../components/teacher/SwapRequestCard';
import {
  getSwapRequests,
  getSwapRequestDetails,
  respondToSwapRequest,
  cancelSwapRequest,
  getSwapStatistics,
} from '../../services/classSwapService';
import type { ClassSwapRequestWithDetails, SwapStatistics } from '../../types/classSwap';

type TabType = 'received' | 'sent' | 'history';

const SwapRequestsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [requests, setRequests] = useState<ClassSwapRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [educatorId, setEducatorId] = useState<string>('');
  const [isCollegeEducator, setIsCollegeEducator] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<SwapStatistics | null>(null);

  useEffect(() => {
    loadEducatorData();
  }, []);

  useEffect(() => {
    if (educatorId) {
      loadRequests();
      loadStatistics();
    }
  }, [educatorId, activeTab]);

  const loadEducatorData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const userId = userData.user.id;
      const userRole = userData.user.user_metadata?.user_role || userData.user.user_metadata?.role;

      if (userRole === 'college_educator') {
        const { data: collegeLecturerData } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (collegeLecturerData) {
          setEducatorId(collegeLecturerData.id);
          setIsCollegeEducator(true);
          return;
        }
      }

      const { data: educatorData } = await supabase
        .from('school_educators')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (educatorData) {
        setEducatorId(educatorData.id);
        setIsCollegeEducator(false);
      }
    } catch (error) {
      console.error('Error loading educator data:', error);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await getSwapRequests(educatorId);

      if (data) {
        // Load detailed information for each request
        const detailedRequests = await Promise.all(
          data.map(async (req) => {
            const { data: detailed } = await getSwapRequestDetails(req.id, isCollegeEducator);
            return detailed || req;
          })
        );

        // Filter based on active tab
        let filtered = detailedRequests;
        if (activeTab === 'received') {
          filtered = detailedRequests.filter(
            (r) => r.target_faculty_id === educatorId && r.status === 'pending'
          );
        } else if (activeTab === 'sent') {
          filtered = detailedRequests.filter((r) => r.requester_faculty_id === educatorId);
        } else {
          filtered = detailedRequests.filter((r) => r.status !== 'pending');
        }

        setRequests(filtered as ClassSwapRequestWithDetails[]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getSwapStatistics(educatorId);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await respondToSwapRequest(requestId, {
        status: 'accepted',
        response_message: 'Request accepted',
      });

      if (error) throw error;

      alert('Swap request accepted! Waiting for admin approval.');
      loadRequests();
      loadStatistics();
    } catch (error) {
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      const { error } = await respondToSwapRequest(requestId, {
        status: 'rejected',
        response_message: reason || 'Request rejected',
      });

      if (error) throw error;

      alert('Swap request rejected.');
      loadRequests();
      loadStatistics();
    } catch (error) {
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await cancelSwapRequest(requestId);

      if (error) throw error;

      alert('Swap request cancelled.');
      loadRequests();
      loadStatistics();
    } catch (error) {
      alert('Failed to cancel request. Please try again.');
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      req.requester_slot?.subject_name.toLowerCase().includes(query) ||
      req.target_slot?.subject_name.toLowerCase().includes(query) ||
      req.requester_faculty?.first_name.toLowerCase().includes(query) ||
      req.requester_faculty?.last_name.toLowerCase().includes(query) ||
      req.target_faculty?.first_name.toLowerCase().includes(query) ||
      req.target_faculty?.last_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <RefreshCw className="h-7 w-7 text-indigo-600" />
                Class Swap Requests
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your class swap requests and exchanges
              </p>
            </div>
            <button
              onClick={() => loadRequests()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{statistics.total_requests}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {statistics.pending_requests}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Accepted</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {statistics.accepted_requests}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {statistics.rejected_requests}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Completed</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {statistics.completed_swaps}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('received')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === 'received'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📥 Received
                  {statistics && statistics.pending_requests > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {statistics.pending_requests}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === 'sent'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📤 Sent
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === 'history'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📜 History
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900">No requests found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {activeTab === 'received' &&
                    'You have no pending swap requests from other educators.'}
                  {activeTab === 'sent' && "You haven't sent any swap requests yet."}
                  {activeTab === 'history' && 'No completed or cancelled requests.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <SwapRequestCard
                    key={request.id}
                    request={request}
                    viewMode={activeTab === 'history' ? 'history' : activeTab}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    onViewDetails={(id) => console.log('View details:', id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapRequestsDashboard;
