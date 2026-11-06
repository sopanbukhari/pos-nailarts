import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadStoredAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('nailart_token', token);
    localStorage.setItem('nailart_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('nailart_token');
    localStorage.removeItem('nailart_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: () => {
    const token = localStorage.getItem('nailart_token');
    const userStr = localStorage.getItem('nailart_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('nailart_token');
        localStorage.removeItem('nailart_user');
      }
    }
  },
}));
