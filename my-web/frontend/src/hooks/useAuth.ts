import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, UserRole } from '@/types/user';

export const useAuth = () => {
  const { user: storeUser, setUser, logout: storeLogout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const user = mounted ? storeUser : null;

  const login = (userData: Partial<User>) => {
    setUser(userData);
  };

  const logout = () => {
    storeLogout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const isAuthenticated = !!user;
  const isCustomer = user?.role === UserRole.CUSTOMER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRestaurant = user?.role === UserRole.RESTAURANT;

  return {
    user,
    loading: false, // Zustand persist handles loading internally or we can add a state if needed
    isAuthenticated,
    isCustomer,
    isAdmin,
    isRestaurant,
    login,
    logout,
  };
};

