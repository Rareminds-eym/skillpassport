// Zustand Stores - Barrel Export (Re-exports from FSD locations)
// All stores are self-contained and don't require React providers

// ====================
// Core Stores
// ====================

export {
  useThemeStore,
  useTheme,
  useIsDark
} from '@/shared/model/themeStore';

export {
  useAuthStore,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useUserRole,
  useAuthActions,
  useErrorNotification,
  type User,
  type Session
} from '@/features/auth/model/authStore';

// ====================
// Feature Stores
// ====================

export {
  useSearchStore,
  useSearch,
  useSearchQuery,
  useSearchResults,
  useIsSearching,
  useSearchFilters,
  useSearchHistory,
  useSearchActions,
  type SearchFilters,
  type SearchResult
} from '@/shared/model/searchStore';

export {
  usePortfolioStore,
  usePortfolio,
  usePortfolioStudent,
  usePortfolioSettings,
  usePortfolioLoading,
  usePortfolioViewerRole,
  usePortfolioActions,
  useIsViewingOtherStudent,
  type PortfolioSettings,
  type DisplayPreferences
} from '@/features/digital-portfolio/model/portfolioStore';

export {
  useAssessmentStore,
  useAssessmentStatus,
  useAssessmentAnswers,
  useAssessmentCurrentQuestion,
  useAssessmentTime,
  useAssessmentFlowActions,
  useAssessmentNavigation,
  type AssessmentFlowStatus,
  type AssessmentFlowState,
  type GradeLevel,
  type StreamCategory,
  type AnswerValue,
  type Answers,
  type SectionTimings,
  type AssessmentAttempt
} from '@/features/assessment/model/assessmentStore';

export {
  useTourStore,
  useTourState,
  useTourLoading,
  useIsTourRunning,
  useActiveTourKey,
  useTourProgress,
  useTourActions,
  useTourEligibility,
  useTour,
  type TourKey,
  type TourProgress,
  type TourState
} from '@/shared/model/tourStore';

export {
  useSubscriptionStore,
  useSubscriptionAccess,
  useSubscriptionWarnings,
  useUserEntitlements,
  useSubscriptionPurchase,
  useSubscription,
  useSubscription as useSubscriptionContext, // Alias for backward compatibility
  ACCESS_REASONS,
  WARNING_TYPES,
  type AccessReason,
  type WarningType,
  type Subscription,
  type Entitlement,
  type SubscriptionCost
} from '@/features/subscription/model/subscriptionStore';

// ====================
// Additional Feature Stores
// ====================

export {
  useGlobalPresenceStore,
  useGlobalPresence,
  useOnlineUsers,
  useIsConnected,
  useOnlineCount,
  useCurrentPresence,
  useUserOnlineStatus,
  usePresenceActions,
  type OnlineUser
} from '@/shared/model/globalPresenceStore';

export {
  useTestStore,
  useTest,
  useTestQuestions,
  useTestAnswers,
  useTestLoading,
  useTestProgress,
  useTestActions,
  type Question
} from '@/features/assessment/model/testStore';

export {
  usePromotionalStore,
  useAssessmentPromotional,
  useCurrentPromotional,
  usePromotionalActions,
  type PromotionalEvent,
  type TimeRemaining
} from '@/features/promotional/model/promotionalStore';

export {
  useCareerAssistantStore,
  useCareerConversations,
  useCareerMessages,
  useCareerUIState,
  useCareerAssistantActions,
  useCareerFeedback,
  useCareerAssistant,
  type Conversation,
  type Message,
  type FeedbackData
} from '@/features/career-assistant/model/careerAssistantStore';

// ====================
// Existing Stores (already in codebase)
// ====================

export {
  useCounsellingStore,
  type CounsellingStore
} from '@/features/counselling/model/counsellingStore';

export {
  useMessageStore,
  useMessages,
  useConversations,
  useCurrentConversationId,
  useUnreadCount,
  useMessageLoadingStates,
  useCurrentConversation,
  useUnreadMessagesCount,
  type MessageState
} from '@/features/messaging/model/messageStore';

// ====================
// Store Utilities
// ====================

// Helper to reset all stores (useful for logout)
export const resetAllStores = async () => {
  const { useAuthStore } = await import('@/features/auth/model/authStore');
  const { useSearchStore } = await import('@/shared/model/searchStore');
  const { usePortfolioStore } = await import('@/features/digital-portfolio/model/portfolioStore');
  const { useTourStore } = await import('@/shared/model/tourStore');
  const { useAssessmentStore } = await import('@/features/assessment/model/assessmentStore');
  const { useSubscriptionStore } = await import('@/features/subscription/model/subscriptionStore');

  // Reset individual stores
  useAuthStore.getState().logout();
  useSearchStore.getState().clearSearch();
  usePortfolioStore.getState().clearStudent();
  useTourStore.getState().reset();
  useAssessmentStore.getState().reset();
  useSubscriptionStore.getState().clearAccessCache();
};

// Initialize all stores on app load
export const initializeStores = async () => {
  const { useAuthStore } = await import('@/features/auth/model/authStore');

  // Initialize auth first (other stores may depend on it)
  await useAuthStore.getState().initialize();
};
