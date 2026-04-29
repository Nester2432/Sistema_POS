import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  empresa_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean; // Para saber si ya cargó de localStorage
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, token, refreshToken) => {
        console.log("Guardando autenticación para:", user.email);
        set({ user, token, refreshToken });
      },
      setToken: (token) => set({ token }),
      logout: () => {
        console.log("Cerrando sesión...");
        set({ user: null, token: null, refreshToken: null });
        localStorage.removeItem('auth-storage');
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
