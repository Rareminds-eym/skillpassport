/**
 * useZohoSalesIQ Hook
 * 
 * React hook for Zoho SalesIQ integration with user context
 * Opens chat with logged-in user information
 */

import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useLearnerDataByEmail } from '@/entities/learner';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { getLogger } from '@/shared/config/logging';
import { openZohoChat, setZohoCustomInfo, setZohoVisitorInfo } from '@/shared/lib/zoho/zohoSalesIQ';
import type { ZohoCustomInfo } from '@/shared/lib/zoho/types';
import { useUser, useUserRole } from '@/shared/model/authStore';

const logger = getLogger('use-zoho-salesiq');

interface OpenZohoChatOptions {
  issueSource?: string;
}

export function useZohoSalesIQ() {
  const user = useUser();
  const { role } = useUserRole();
  const location = useLocation();
  const [isOpening, setIsOpening] = useState(false);

  // Get learner data if user is a learner (typed as any due to JS hook)
  const userEmail = user?.email || '';
  const { learnerData } = useLearnerDataByEmail(userEmail) as { learnerData: any; loading: boolean; error: any };

  // Get subscription data (typed as any due to mixed JS/TS codebase)
  const { subscriptionData } = useSubscriptionQuery() as { subscriptionData: any; loading: boolean; refreshSubscription: () => Promise<void> };

  /**
   * Open Zoho chat with user context
   */
  const openChatWithContext = useCallback(async (options?: OpenZohoChatOptions) => {
    if (isOpening) {
      return;
    }

    setIsOpening(true);

    try {
      if (!user) {
        logger.warn('Cannot open Zoho chat: User not authenticated');
        // Still try to open chat without user context
        await openZohoChat();
        return;
      }

      // Prepare visitor information (SAFE data only)
      // Priority order: user object -> learner data -> user metadata -> fallback
      const firstName = user.user_metadata?.first_name || learnerData?.first_name || '';
      const lastName = user.user_metadata?.last_name || learnerData?.last_name || '';
      const fullName = user.name || learnerData?.name || `${firstName} ${lastName}`.trim() || 'User';
      
      const visitorName = fullName;
      const visitorEmail = user.email || '';
      const visitorPhone = user.user_metadata?.phone || 
                          user.user_metadata?.phone_number || 
                          learnerData?.contact_number || 
                          learnerData?.phone || 
                          learnerData?.mobile || 
                          '';

      logger.info('Preparing Zoho visitor info', { 
        hasName: !!visitorName, 
        hasEmail: !!visitorEmail, 
        hasPhone: !!visitorPhone,
        name: visitorName,
        email: visitorEmail,
        phoneLength: visitorPhone.length
      });

      // Set visitor info FIRST - this populates the form fields
      const visitorInfoSet = await setZohoVisitorInfo({
        name: visitorName,
        email: visitorEmail,
        phone: visitorPhone,
      });

      logger.info('Zoho visitor info set', { success: visitorInfoSet, name: visitorName, email: visitorEmail });

      // Prepare custom context information (SAFE data only)
      const customInfo: ZohoCustomInfo = {
        'User ID': user.id || '',
        'Role': role || 'unknown',
        'Current Page': location.pathname,
        'Issue Source': options?.issueSource || 'Contact Us Button',
      };

      // Add learner-specific information if available
      if (learnerData) {
        if (learnerData.id) {
          customInfo['Learner ID'] = learnerData.id;
        }
        if (learnerData.school?.name) {
          customInfo['School'] = learnerData.school.name;
        }
        if (learnerData.college?.name) {
          customInfo['College'] = learnerData.college.name;
        }
        if (learnerData.universityCollege?.name) {
          customInfo['University College'] = learnerData.universityCollege.name;
        }
        if (learnerData.university) {
          customInfo['University'] = learnerData.university;
        }
      }

      // Add subscription information if available
      if (subscriptionData) {
        customInfo['Subscription Plan'] = subscriptionData.planName || subscriptionData.plan || 'Unknown';
        customInfo['Subscription Status'] = subscriptionData.status || 'Unknown';
        
        if (subscriptionData.isOrganizationLicense) {
          customInfo['License Type'] = 'Organization';
          if (subscriptionData.organizationType) {
            customInfo['Organization Type'] = subscriptionData.organizationType;
          }
        } else {
          customInfo['License Type'] = 'Individual';
        }
      }

      // Add organization context from user
      if (user.orgId) {
        customInfo['Organization ID'] = user.orgId;
      }

      // Set custom info
      const customInfoSet = await setZohoCustomInfo(customInfo);
      logger.info('Zoho custom info set', { success: customInfoSet });

      // Longer delay to ensure Zoho registers the visitor info before opening chat
      // This prevents the pre-chat form from appearing and ensures chat stays open
      await new Promise(resolve => setTimeout(resolve, 800));

      // Open chat with retry logic
      let chatOpened = await openZohoChat();
      
      // If first attempt failed, try once more after a delay
      if (!chatOpened) {
        logger.warn('First attempt to open Zoho chat failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        chatOpened = await openZohoChat();
        
        if (!chatOpened) {
          logger.error('Failed to open Zoho chat after retry', new Error('Chat failed to open'));
          throw new Error('Unable to open chat. Please try again.');
        }
      }

      logger.info('Zoho chat opened successfully');

    } catch (error) {
      logger.error('Failed to open Zoho chat with context', error instanceof Error ? error : new Error(String(error)));
      
      // Fallback: try to open chat without context
      try {
        await openZohoChat();
      } catch (fallbackError) {
        logger.error('Failed to open Zoho chat (fallback)', fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
      }
    } finally {
      setIsOpening(false);
    }
  }, [user, role, location, learnerData, subscriptionData, isOpening]);

  return {
    openChatWithContext,
    isOpening,
  };
}
