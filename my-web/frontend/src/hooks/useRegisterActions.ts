'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { registerSchema } from '@/schemas/auth.schema';

export const useRegisterActions = () => {
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
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      role,
      legalDocuments,
    });
    if (!result.success) {
      const newErrors: any = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          newErrors[path] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
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
      toast.error(err.message || LABELS.COMMON.ERROR);
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
