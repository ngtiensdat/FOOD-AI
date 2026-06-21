import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: Partial<User> | null;
  setUser: (_user: Partial<User> | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (newUser) => {
        const current = get().user;
        // Skip update if values are identical (prevents infinite render loops)
        if (
          newUser !== null &&
          current !== null &&
          JSON.stringify(newUser) === JSON.stringify(current)
        ) {
          return;
        }
        set({ user: newUser });
      },
      logout: () => {
        set({ user: null });
        // Xóa cookie accessToken và refreshToken sẽ được xử lý ở backend (logout API)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);


