/**
 * Store Smoke Tests
 * Basic tests to verify all stores can be imported and initialized
 */

import { describe, it, expect } from 'vitest';

// Test store imports
describe('Store Imports', () => {
  it('should import all stores without errors', async () => {
    const stores = await import('../index');
    
    // Core stores
    expect(stores.useThemeStore).toBeDefined();
    expect(stores.useAuthStore).toBeDefined();
    expect(stores.useSearchStore).toBeDefined();
    expect(stores.usePortfolioStore).toBeDefined();
    expect(stores.useTourStore).toBeDefined();
    expect(stores.useAssessmentStore).toBeDefined();
    expect(stores.useSubscriptionStore).toBeDefined();
    
    // Additional stores
    expect(stores.useGlobalPresenceStore).toBeDefined();
    expect(stores.useTestStore).toBeDefined();
    expect(stores.usePromotionalStore).toBeDefined();
    expect(stores.useCareerAssistantStore).toBeDefined();
    expect(stores.useCounsellingStore).toBeDefined();
    expect(stores.useMessageStore).toBeDefined();
    
    // Utilities
    expect(stores.resetAllStores).toBeDefined();
    expect(stores.initializeStores).toBeDefined();
  });
});

// Test theme store
describe('Theme Store', () => {
  it('should have correct initial state', async () => {
    const { useThemeStore } = await import('../index');
    const state = useThemeStore.getState();
    
    expect(state.theme).toBe('light');
    expect(state.resolvedTheme).toBe('light');
    expect(state.toggleTheme).toBeDefined();
    expect(state.setTheme).toBeDefined();
    expect(state.applyTheme).toBeDefined();
  });

  it('should toggle theme', async () => {
    const { useThemeStore } = await import('../index');
    const store = useThemeStore.getState();
    
    // Start with light
    expect(store.resolvedTheme).toBe('light');
    
    // Toggle
    store.toggleTheme();
    
    // Should be dark
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});

// Test search store
describe('Search Store', () => {
  it('should have correct initial state', async () => {
    const { useSearchStore } = await import('../index');
    const state = useSearchStore.getState();
    
    expect(state.searchQuery).toBe('');
    expect(state.searchResults).toEqual([]);
    expect(state.isSearching).toBe(false);
    expect(state.currentPage).toBe(1);
  });

  it('should set search query', async () => {
    const { useSearchStore } = await import('../index');
    const store = useSearchStore.getState();
    
    store.setSearchQuery('test query');
    
    expect(useSearchStore.getState().searchQuery).toBe('test query');
  });

  it('should clear search', async () => {
    const { useSearchStore } = await import('../index');
    const store = useSearchStore.getState();
    
    // Set some state
    store.setSearchQuery('test');
    store.setSearchResults([{ id: '1', title: 'Test', type: 'test' }]);
    
    // Clear
    store.clearSearch();
    
    // Should be reset
    expect(useSearchStore.getState().searchQuery).toBe('');
    expect(useSearchStore.getState().searchResults).toEqual([]);
  });
});

// Test portfolio store
describe('Portfolio Store', () => {
  it('should have correct initial state', async () => {
    const { usePortfolioStore } = await import('../index');
    const state = usePortfolioStore.getState();
    
    expect(state.student).toBeNull();
    expect(state.viewerRole).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isManuallySet).toBe(false);
  });

  it('should set viewer role with defaults', async () => {
    const { usePortfolioStore } = await import('../index');
    const store = usePortfolioStore.getState();
    
    store.setViewerRole('student');
    
    expect(usePortfolioStore.getState().viewerRole).toBe('student');
    expect(usePortfolioStore.getState().settings.layout).toBe('infographic');
  });
});

// Test tour store
describe('Tour Store', () => {
  it('should have correct initial state', async () => {
    const { useTourStore } = await import('../index');
    const state = useTourStore.getState();
    
    expect(state.state.isRunning).toBe(false);
    expect(state.state.stepIndex).toBe(0);
    expect(state.state.tourKey).toBeNull();
    expect(state.loading).toBe(true);
  });

  it('should check eligibility', async () => {
    const { useTourStore } = await import('../index');
    const store = useTourStore.getState();
    
    // Set loading to false first
    store.setLoading(false);
    
    // Should be eligible for new tour
    expect(store.isEligible('student_dashboard')).toBe(true);
  });
});

// Test test store
describe('Test Store', () => {
  it('should have correct initial state', async () => {
    const { useTestStore } = await import('../index');
    const state = useTestStore.getState();
    
    expect(state.questions).toEqual([]);
    expect(state.selectedAnswers).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should set questions and initialize answers', async () => {
    const { useTestStore } = await import('../index');
    const store = useTestStore.getState();
    
    store.setQuestions([
      { id: '1', text: 'Question 1' },
      { id: '2', text: 'Question 2' }
    ]);
    
    expect(useTestStore.getState().questions).toHaveLength(2);
    expect(useTestStore.getState().selectedAnswers).toHaveLength(2);
    expect(useTestStore.getState().getTotalQuestions()).toBe(2);
  });

  it('should set answers', async () => {
    const { useTestStore } = await import('../index');
    const store = useTestStore.getState();
    
    store.setQuestions([{ id: '1', text: 'Q1' }, { id: '2', text: 'Q2' }]);
    store.setAnswer(0, 'answer1');
    
    expect(useTestStore.getState().selectedAnswers[0]).toBe('answer1');
    expect(useTestStore.getState().getAnsweredCount()).toBe(1);
  });
});

// Test promotional store
describe('Promotional Store', () => {
  it('should have correct initial state', async () => {
    const { usePromotionalStore } = await import('../index');
    const state = usePromotionalStore.getState();
    
    expect(state.assessmentEvent).toBeNull();
    expect(state.isAssessmentModalDismissed).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should calculate time remaining', async () => {
    const { usePromotionalStore } = await import('../index');
    const store = usePromotionalStore.getState();
    
    // Set an event with future end date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    store.setAssessmentEvent({
      id: '1',
      event_code: 'TEST',
      title: 'Test Event',
      end_date: futureDate.toISOString(),
      is_active: true
    });
    
    const timeRemaining = store.getAssessmentTimeRemaining();
    expect(timeRemaining).not.toBeNull();
    expect(timeRemaining!.days).toBeGreaterThanOrEqual(6);
  });
});

// Test career assistant store
describe('Career Assistant Store', () => {
  it('should have correct initial state', async () => {
    const { useCareerAssistantStore } = await import('../index');
    const state = useCareerAssistantStore.getState();
    
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(state.showWelcome).toBe(true);
    expect(state.input).toBe('');
  });

  it('should add conversation', async () => {
    const { useCareerAssistantStore } = await import('../index');
    const store = useCareerAssistantStore.getState();
    
    store.addConversation({
      id: '1',
      title: 'Test Conversation',
      created_at: new Date().toISOString()
    });
    
    expect(useCareerAssistantStore.getState().conversations).toHaveLength(1);
    expect(useCareerAssistantStore.getState().currentConversationId).toBe('1');
  });

  it('should add and remove chips', async () => {
    const { useCareerAssistantStore } = await import('../index');
    const store = useCareerAssistantStore.getState();
    
    store.addChip('career');
    store.addChip('jobs');
    
    expect(useCareerAssistantStore.getState().selectedChips).toContain('career');
    expect(useCareerAssistantStore.getState().selectedChips).toContain('jobs');
    
    store.removeChip('career');
    
    expect(useCareerAssistantStore.getState().selectedChips).not.toContain('career');
  });
});

// Test global presence store
describe('Global Presence Store', () => {
  it('should have correct initial state', async () => {
    const { useGlobalPresenceStore } = await import('../index');
    const state = useGlobalPresenceStore.getState();
    
    expect(state.onlineUsers).toEqual([]);
    expect(state.isConnected).toBe(false);
    expect(state.currentUserId).toBeNull();
  });

  it('should add and remove online users', async () => {
    const { useGlobalPresenceStore } = await import('../index');
    const store = useGlobalPresenceStore.getState();
    
    store.addOnlineUser({
      userId: '1',
      userName: 'Test User',
      userType: 'student',
      status: 'online',
      lastSeen: new Date().toISOString()
    });
    
    expect(useGlobalPresenceStore.getState().onlineUsers).toHaveLength(1);
    expect(useGlobalPresenceStore.getState().getOnlineCount()).toBe(1);
    
    store.removeOnlineUser('1');
    
    expect(useGlobalPresenceStore.getState().onlineUsers).toHaveLength(0);
  });
});

// Test assessment store
describe('Assessment Store', () => {
  it('should have correct initial state', async () => {
    const { useAssessmentStore } = await import('../index');
    const state = useAssessmentStore.getState();
    
    expect(state.status).toBe('idle');
    expect(state.answers).toEqual({});
    expect(state.currentSectionIndex).toBe(0);
    expect(state.currentQuestionIndex).toBe(0);
  });

  it('should set grade level and change status', async () => {
    const { useAssessmentStore } = await import('../index');
    const store = useAssessmentStore.getState();
    
    store.setGradeLevel('12');
    
    expect(useAssessmentStore.getState().gradeLevel).toBe('12');
    expect(useAssessmentStore.getState().status).toBe('categorySelection');
  });

  it('should set answers', async () => {
    const { useAssessmentStore } = await import('../index');
    const store = useAssessmentStore.getState();
    
    store.setAnswer('q1', 'answer1');
    
    expect(useAssessmentStore.getState().answers.q1).toBe('answer1');
    expect(useAssessmentStore.getState().getAnsweredQuestions()).toBe(1);
  });

  it('should reset to initial state', async () => {
    const { useAssessmentStore } = await import('../index');
    const store = useAssessmentStore.getState();
    
    // Change some state
    store.setGradeLevel('12');
    store.setAnswer('q1', 'answer');
    
    // Reset
    store.reset();
    
    expect(useAssessmentStore.getState().status).toBe('idle');
    expect(useAssessmentStore.getState().gradeLevel).toBeNull();
    expect(useAssessmentStore.getState().answers).toEqual({});
  });
});

// Test subscription store
describe('Subscription Store', () => {
  it('should have correct initial state', async () => {
    const { useSubscriptionStore } = await import('../index');
    const state = useSubscriptionStore.getState();
    
    expect(state.hasAccess).toBe(false);
    expect(state.accessReason).toBe('no_subscription');
    expect(state.isLoading).toBe(true);
    expect(state.userEntitlements).toEqual([]);
  });

  it('should set access data', async () => {
    const { useSubscriptionStore } = await import('../index');
    const store = useSubscriptionStore.getState();
    
    store.setAccessData({
      hasAccess: true,
      accessReason: 'active',
      subscription: { id: '1', status: 'active' }
    });
    
    expect(useSubscriptionStore.getState().hasAccess).toBe(true);
    expect(useSubscriptionStore.getState().getIsActive()).toBe(true);
  });
});

// Test utility functions
describe('Store Utilities', () => {
  it('should reset all stores', async () => {
    const { resetAllStores, useSearchStore, useTourStore } = await import('../index');
    
    // Set some state
    useSearchStore.getState().setSearchQuery('test');
    
    // Reset (now async)
    await resetAllStores();
    
    // Search should be cleared (but other stores need auth logout)
    expect(useSearchStore.getState().searchQuery).toBe('');
    expect(useTourStore.getState().activeTourKey).toBeNull();
  });
});
