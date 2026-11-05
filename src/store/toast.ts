import { create } from 'zustand';

interface ToastState {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  show: (message: string, action?: { label: string; onPress: () => void }) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message, action) => set({ message, actionLabel: action?.label, onAction: action?.onPress }),
  hide: () => set({ message: null, actionLabel: undefined, onAction: undefined }),
}));

export const toast = (message: string, action?: { label: string; onPress: () => void }) =>
  useToast.getState().show(message, action);
