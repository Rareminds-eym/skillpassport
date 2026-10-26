import { create } from 'zustand';

export const useAssistantVisibility = create<{
  facilitatorOpen: boolean;
  setFacilitatorOpen: (open: boolean) => void;
}>((set) => ({
  facilitatorOpen: false,
  setFacilitatorOpen: (facilitatorOpen) => set({ facilitatorOpen }),
}));
