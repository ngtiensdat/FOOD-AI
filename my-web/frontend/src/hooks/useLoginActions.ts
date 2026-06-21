'use client';

// Mục đích file: Hook quản lý state và logic cho luồng Đăng nhập (Login).
// Ý nghĩa: Tách biệt logic xử lý form đăng nhập, validate và gọi API ra khỏi component giao diện.
// Các chức năng đặc biệt: Validate form bằng Zod schema, hiển thị lỗi động, set user vào Zustand store.
// Các biến, hàm đặc biệt: ApiError, handleLogin, validate.

import { useState, useEffect } from 'react';
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (currentEmail = email, currentPassword = password, forceCheckAll = false) => {
    const result = loginSchema.safeParse({ email: currentEmail, password: currentPassword });
    const newErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && (forceCheckAll || touched[path])) {
          newErrors[path] = issue.message;
        }
      });
    }
    setErrors(newErrors);
    return result.success;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    validate(email, password, false);
  }, [email, password, touched]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(email, password, true)) return;

    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);

      // Nếu email chưa được xác thực, hiển thị thông báo nhắc nhở (vẫn cho đăng nhập)
      if (data.user && data.user.isEmailVerified === false) {
        toast.info(LABELS.AUTH.LOGIN_SUCCESS_UNVERIFIED);
      } else {
        toast.success(LABELS.COMMON.SUCCESS);
      }

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
    handleLogin,
    handleBlur,
  };
};
