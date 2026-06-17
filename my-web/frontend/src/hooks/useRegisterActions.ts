'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

export const useRegisterActions = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('CUSTOMER');
  const [legalDocuments, setLegalDocuments] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    if (name.trim().length < 2) newErrors.name = LABELS.FORM.NAME_REQUIRED;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = LABELS.FORM.EMAIL_INVALID;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) newErrors.password = LABELS.FORM.PASSWORD_INVALID;
    if (password !== confirmPassword) newErrors.confirmPassword = LABELS.FORM.CONFIRM_PASSWORD_MISMATCH;
    if (role === 'RESTAURANT' && legalDocuments.trim().length < 10) {
      newErrors.legalDocuments = LABELS.FORM.LEGAL_DOCS_REQUIRED;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const data = await authService.register({
        name,
        email,
        password,
        role,
        legalDocuments: role === 'RESTAURANT' ? legalDocuments : undefined,
      });

      const msg = role === 'RESTAURANT'
        ? LABELS.AUTH.REGISTER_SUCCESS_PENDING
        : LABELS.AUTH.REGISTER_SUCCESS_VERIFY;
      
      setSuccessMessage(msg);
      toast.success(msg);

      // Nếu là khách hàng thì cho login luôn hoặc chờ verify tùy logic backend
      // Ở đây giả định backend trả về user ngay
      if (role === 'CUSTOMER' && data) {
        // setUser(data); // Có thể dùng nếu muốn auto-login
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || LABELS.COMMON.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    confirmPassword, setConfirmPassword,
    showConfirmPassword, setShowConfirmPassword,
    role, setRole,
    legalDocuments, setLegalDocuments,
    errors,
    successMessage,
    isLoading,
    handleRegister
  };
};
