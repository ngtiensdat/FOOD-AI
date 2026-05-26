'use client';

// Mục đích file: Hook quản lý state và logic cho luồng Đăng nhập (Login).
// Ý nghĩa: Tách biệt logic xử lý form đăng nhập, validate và gọi API ra khỏi component giao diện.
// Các chức năng đặc biệt: Validate form bằng Zod schema, hiển thị lỗi động, set user vào Zustand store.
// Các biến, hàm đặc biệt: ApiError, handleLogin, validate.

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { loginSchema } from '@/schemas/auth.schema';

interface ApiError {
  message?: string;
}

export const useLoginActions = () => {
  const setUser = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          newErrors[path as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      toast.success(LABELS.COMMON.SUCCESS);
      window.location.href = '/';
    } catch (error) {
      const err = error as ApiError;
      const msg = err.message || LABELS.COMMON.ERROR;
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    errors,
    isLoading,
    handleLogin
  };
};
