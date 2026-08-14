/**
 * Sidebar State Store
 * Manages sidebar collapse/expand state across components
 */

import { create } from 'zustand';

export const useSidebarStore = create((set) => ({
    isCollapsed: false,
    setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));
