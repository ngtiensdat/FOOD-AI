'use client';

// Mục đích file: Hook quản lý state và logic cho luồng Đăng ký (Register) người dùng/nhà hàng.
// Ý nghĩa: Tách biệt logic xử lý form đăng ký, validate và gọi API ra khỏi component giao diện.
// Các chức năng đặc biệt: Hỗ trợ đăng ký nhiều role (Customer/Restaurant), validate động, quản lý giấy tờ cho nhà hàng.
// Các biến, hàm đặc biệt: ApiError, handleRegister, validate.

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { registerSchema } from '@/schemas/auth.schema';
import { UserRole } from '@/types/user';

interface ApiError {
  message?: string;
}

export const useRegisterActions = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<string>(UserRole.CUSTOMER);
  const [legalDocuments, setLegalDocuments] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        legalDocuments: role === UserRole.RESTAURANT ? legalDocuments : undefined,
      });

      const msg = role === UserRole.RESTAURANT
        ? LABELS.AUTH.REGISTER_SUCCESS_PENDING
        : LABELS.AUTH.REGISTER_SUCCESS_VERIFY;

      setSuccessMessage(msg);
      toast.success(msg);

      // Nếu là khách hàng thì cho login luôn hoặc chờ verify tùy logic backend
      // Ở đây giả định backend trả về user ngay
      if (role === UserRole.CUSTOMER && data) {
        // setUser(data); // Có thể dùng nếu muốn auto-login
      }
    } catch (error) {
      const err = error as ApiError;
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
