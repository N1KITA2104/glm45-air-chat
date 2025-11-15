import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { User } from '../types/api';
import { setAuthToken } from '../lib/apiClient';

type AuthState = {
  token: string | null;
  user: User | null;
};

type AuthActions = {
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User | null) => void;
};

const initialState: AuthState = {
  token: null,
  user: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (token, user) => {
        setAuthToken(token);
        set({ token, user });
      },
      clearAuth: () => {
        setAuthToken(null);
        set(initialState);
      },
      setUser: (user) => set((state) => ({ ...state, user })),
    }),
    {
      name: 'pet-ai-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    },
  ),
);

