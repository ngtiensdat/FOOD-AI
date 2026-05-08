import { useState, useEffect } from 'react';

export interface UserProfile {
  userId: number;
  fullName?: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  address?: string;
  workAt?: string;
  hasCompletedOnboarding: boolean;
  preferences?: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'RESTAURANT';
  hasCompletedOnboarding: boolean;
  profile?: UserProfile;
}


export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/'; // Redirect to home on logout
  };

  const isAuthenticated = !!user;
  const isCustomer = user?.role === 'CUSTOMER';
  const isAdmin = user?.role === 'ADMIN';
  const isRestaurant = user?.role === 'RESTAURANT';

  return {
    user,
    loading,
    isAuthenticated,
    isCustomer,
    isAdmin,
    isRestaurant,
    login,
    logout
  };
};
