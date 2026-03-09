// Zustand Stores - Barrel Export
// All stores are self-contained and don't require React providers

// ====================
// Core Stores
// ====================

export { 
  useThemeStore,
  useTheme,
  useIsDark 
} from './themeStore';

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
} from './authStore';

// ====================
// Feature Stores
// ====================

export {
  useSearchStore,
  useSearchQuery,
  useSearchResults,
  useIsSearching,
  useSearchFilters,
  useSearchHistory,
  useSearchActions,
  type SearchFilters,
  type SearchResult 
} from './searchStore';

export {
  usePortfolioStore,
  usePortfolioStudent,
  usePortfolioSettings,
  usePortfolioLoading,
  usePortfolioViewerRole,
  usePortfolioActions,
  useIsViewingOtherStudent,
  type PortfolioSettings,
  type DisplayPreferences 
} from './portfolioStore';

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
} from './assessmentStore';

export {
  useTourStore,
  useTourState,
  useTourLoading,
  useIsTourRunning,
  useActiveTourKey,
  useTourProgress,
  useTourActions,
  useTourEligibility,
  type TourKey,
  type TourProgress,
  type TourState 
} from './tourStore';

export {
  useSubscriptionStore,
  useSyncSubscriptionWithQuery,
  useSubscriptionAccess,
  useSubscriptionWarnings,
  useUserEntitlements,
  useSubscriptionPurchase,
  type AccessReason,
  type WarningType,
  type Subscription,
  type Entitlement,
  type SubscriptionCost 
} from './subscriptionStore';

// ====================
// Additional Feature Stores
// ====================

export {
  useGlobalPresenceStore,
  useOnlineUsers,
  useIsConnected,
  useOnlineCount,
  useCurrentPresence,
  useUserOnlineStatus,
  usePresenceActions,
  type OnlineUser 
} from './globalPresenceStore';

export {
  useTestStore,
  useTestQuestions,
  useTestAnswers,
  useTestLoading,
  useTestProgress,
  useTestActions,
  type Question 
} from './testStore';

export {
  usePromotionalStore,
  useAssessmentPromotional,
  useCurrentPromotional,
  usePromotionalActions,
  type PromotionalEvent,
  type TimeRemaining 
} from './promotionalStore';

export {
  useCareerAssistantStore,
  useCareerConversations,
  useCareerMessages,
  useCareerUIState,
  useCareerAssistantActions,
  useCareerFeedback,
  type Conversation,
  type Message,
  type FeedbackData 
} from './careerAssistantStore';

// ====================
// Existing Stores (already in codebase)
// ====================

export {
  useCounsellingStore,
  type CounsellingStore 
} from './counsellingStore';

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
} from './useMessageStore';

// ====================
// Store Utilities
// ====================

// Helper to reset all stores (useful for logout)
export const resetAllStores = async () => {
  const { useAuthStore } = await import('./authStore');
  const { useSearchStore } = await import('./searchStore');
  const { usePortfolioStore } = await import('./portfolioStore');
  const { useTourStore } = await import('./tourStore');
  const { useAssessmentStore } = await import('./assessmentStore');
  const { useSubscriptionStore } = await import('./subscriptionStore');

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
  const { useAuthStore } = await import('./authStore');
  
  // Initialize auth first (other stores may depend on it)
  await useAuthStore.getState().initialize();
};
