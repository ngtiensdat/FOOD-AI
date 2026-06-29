'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SafeImage } from '@/components/base/SafeImage';
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { authService } from '@/services/auth.service';
import { toast } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { verifyEmailSchema } from '@/schemas/auth.schema';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { login } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    // Keep only last char if pasted or typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Jump to next input if typed
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move backward on backspace if empty
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(Number(pasteData))) {
      const pasteOtp = pasteData.split('');
      setOtp(pasteOtp);
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const otpCode = otp.join('');

    const validation = verifyEmailSchema.safeParse({ email, otp: otpCode });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyEmailOtp(email, otpCode);
      
      if (response && response.status === 'PENDING') {
        // Tài khoản RESTAURANT chờ duyệt
        setIsPendingApproval(true);
        setSuccess(response.message || LABELS.AUTH.VERIFY_SUCCESS_PENDING);
        toast.success(response.message);
      } else {
        // Auto-login cho CUSTOMER
        if (response && response.user) {
          login(response.user);
        }
        setSuccess(LABELS.AUTH.VERIFY_SUCCESS);
        toast.success(LABELS.AUTH.VERIFY_SUCCESS_TOAST);
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || LABELS.AUTH.VERIFY_OTP_INVALID);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    try {
      const response = await authService.resendOtp(email);
      toast.success(response?.message || LABELS.AUTH.RESEND_OTP_SUCCESS);
      setResendCooldown(60); // 60s cooldown
    } catch (err: any) {
      setError(err?.message || LABELS.AUTH.RESEND_OTP_ERROR);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-100 p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-200">
      {success && isPendingApproval ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-6"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-900 tracking-tight">{LABELS.AUTH.VERIFY_SUCCESS}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-600 font-medium px-2 leading-relaxed">
              {success}
            </p>
          </div>
          <div className="pt-4 border-t border-gray-55">
            <Link href="/login" className="w-full">
              <Button variant="primary" fullWidth className="py-4">
                {LABELS.AUTH.LOGIN_GO} <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-h2 text-gray-900 mb-2">{LABELS.AUTH.VERIFY_EMAIL_TITLE}</h1>
            <p className="text-gray-600 text-body">
              {LABELS.AUTH.VERIFY_EMAIL_SUBTITLE(email || LABELS.AUTH.YOUR_EMAIL)}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <div className="flex justify-center gap-3 md:gap-4 my-8">
              {otp.map((digit, idx) => (
                <Input
                  key={idx}
                  variant="none"
                  ref={(el) => {
                    if (el) inputRefs.current[idx] = el as HTMLInputElement;
                  }}
                  type="text"
                  maxLength={1}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e as React.KeyboardEvent<HTMLInputElement>)}
                  onPaste={idx === 0 ? (e) => handlePaste(e as React.ClipboardEvent<HTMLInputElement>) : undefined}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-extrabold text-gray-900 border-2 border-gray-150 rounded-2xl bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  disabled={isLoading || !!success}
                />
              ))}
            </div>

            <Button type="submit" fullWidth loading={isLoading} disabled={!!success} className="py-4 text-lg font-bold">
              {LABELS.AUTH.CONFIRM_OTP} <ShieldCheck className="ml-2" size={20} />
            </Button>
          </form>

          <div className="mt-8 text-center text-gray-500 text-small">
            {LABELS.AUTH.NO_OTP_RECEIVED}{' '}
            <Button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || !!success}
              variant="none"
              size="none"
              className={`font-bold transition-colors ${
                resendCooldown > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary hover:underline cursor-pointer'
              }`}
            >
              {resendCooldown > 0 ? LABELS.AUTH.RESEND_OTP_COOLDOWN(resendCooldown) : LABELS.AUTH.RESEND_OTP_BTN}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/register" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-small">
        <ArrowLeft size={20} /> {LABELS.COMMON.BACK}
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

        <Suspense fallback={
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 text-center py-20 text-gray-500">
            {LABELS.AUTH.LOADING_VERIFY}
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
