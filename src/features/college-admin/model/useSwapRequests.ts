import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';

import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import {
  getSwapRequests,
  getSwapRequestDetails,
  respondToSwapRequest,
  cancelSwapRequest,
  getSwapStatistics,
} from '../api';
import type { ClassSwapRequestWithDetails, SwapStatistics } from '@/shared/types/classSwap';

const logger = getLogger('college-admin:useSwapRequests');

type TabType = 'received' | 'sent' | 'history';

interface UseSwapRequestsReturn {
  activeTab: TabType;
  requests: ClassSwapRequestWithDetails[];
  loading: boolean;
  searchQuery: string;
  educatorId: string;
  isCollegeEducator: boolean;
  statistics: SwapStatistics | null;
  filteredRequests: ClassSwapRequestWithDetails[];

  setActiveTab: (tab: TabType) => void;
  setSearchQuery: (query: string) => void;
  loadRequests: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  handleAccept: (requestId: string) => Promise<void>;
  handleReject: (requestId: string, reason?: string) => Promise<void>;
  handleCancel: (requestId: string) => Promise<void>;
}

export const useSwapRequests = (): UseSwapRequestsReturn => {
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
      const user = useAuthStore.getState().user;
      if (!user?.id) return;

      const response = await apiPost('/college-admin/faculty', {
        action: 'get-educator-id-by-user',
        user_id: user.id,
      });

      if (response.data) {
        setEducatorId(response.data.educatorId || '');
        setIsCollegeEducator(response.data.isCollegeEducator || false);
      }
    } catch (error) {
      logger.error('Error loading educator data', error as Error);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await getSwapRequests(educatorId);

      if (data) {
        const detailedRequests = await Promise.all(
          data.map(async (req) => {
            const { data: detailed } = await getSwapRequestDetails(req.id, isCollegeEducator);
            return detailed || req;
          })
        );

        let filtered = detailedRequests;
        if (activeTab === 'received') {
          filtered = detailedRequests.filter((r: any) => r.target_faculty_id === educatorId && r.status === 'pending');
        } else if (activeTab === 'sent') {
          filtered = detailedRequests.filter((r: any) => r.requester_faculty_id === educatorId);
        } else {
          filtered = detailedRequests.filter((r: any) => r.status !== 'pending');
        }

        setRequests(filtered as ClassSwapRequestWithDetails[]);
      }
    } catch (error) {
      logger.error('Error loading requests', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getSwapStatistics(educatorId);
      setStatistics(stats);
    } catch (error) {
      logger.error('Error loading statistics', error as Error);
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

  const filteredRequests = requests.filter(req => {
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

  return {
    activeTab,
    requests,
    loading,
    searchQuery,
    educatorId,
    isCollegeEducator,
    statistics,
    filteredRequests,
    setActiveTab,
    setSearchQuery,
    loadRequests,
    loadStatistics,
    handleAccept,
    handleReject,
    handleCancel,
  };
};
