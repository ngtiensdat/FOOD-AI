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

  const logout = async () => {
    try {
      const { authService } = await import('@/services/auth.service');
      await authService.logout();
    } catch (err) {
      console.warn('Lỗi gọi API đăng xuất:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_pos_terminal');
    }
    storeLogout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const isAuthenticated = !!user;
  const isCustomer = user?.role === UserRole.CUSTOMER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRestaurant = user?.role === UserRole.RESTAURANT;
  const isStaff = user?.role === UserRole.STAFF;

  return {
    user,
    loading: !mounted,
    isAuthenticated,
    isCustomer,
    isAdmin,
    isRestaurant,
    isStaff,
    login,
    logout,
  };
};

