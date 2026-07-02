'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/base/SafeImage';
import { ArrowLeft, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { authService } from '@/services/auth.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { forgotPasswordSchema } from '@/schemas/auth.schema';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (val: string) => {
    const result = forgotPasswordSchema.safeParse({ email: val });
    if (!result.success) {
      return result.error.issues[0].message;
    }
    return null;
  };

  useEffect(() => {
    if (touched) {
      setError(validateEmail(email));
    }
  }, [email, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSuccess(null);

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email.trim());
      setSuccess(response?.message || LABELS.AUTH.SEND_OTP_SUCCESS);
      toast.success(LABELS.AUTH.SEND_OTP_SUCCESS_TOAST);
      
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
      }, 2000);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      setError(errorResponse?.message || LABELS.AUTH.SEND_OTP_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-small">
        <ArrowLeft size={20} /> {LABELS.AUTH.BACK_TO_LOGIN}
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-lg overflow-hidden">
              <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="48px" className="object-contain p-2" />
            </div>
            <span className="text-3xl font-bold gradient-text">{LABELS.COMMON.BRAND_NAME}</span>
          </Link>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-h2 text-gray-900 mb-2">{LABELS.AUTH.FORGOT_PASSWORD_TITLE}</h1>
            <p className="text-gray-600 text-body">
              {LABELS.AUTH.FORGOT_PASSWORD_SUBTITLE}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <Input
              label={LABELS.AUTH.EMAIL_LABEL}
              icon={Mail}
              type="email"
              required
              placeholder={LABELS.AUTH.EMAIL_PLACEHOLDER}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              disabled={isLoading || !!success}
            />

            <Button type="submit" fullWidth loading={isLoading} disabled={!!success} className="py-4 text-lg font-bold">
              {LABELS.AUTH.SEND_OTP} <ArrowRight className="ml-2" size={20} />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
