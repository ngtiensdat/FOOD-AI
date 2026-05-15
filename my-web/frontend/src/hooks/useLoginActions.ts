'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

export const useLoginActions = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = LABELS.FORM.EMAIL_INVALID;
    if (password.length < 1) newErrors.password = LABELS.FORM.PASSWORD_REQUIRED;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    } catch (error: any) {
      const msg = error.message || LABELS.COMMON.ERROR;
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
