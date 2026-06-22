'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SafeImage } from '@/components/base/SafeImage';
import { ArrowLeft, Lock, Key, ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { authService } from '@/services/auth.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { resetPasswordSchema } from '@/schemas/auth.schema';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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

  const validateForm = (forceCheckAll = false) => {
    const otpCode = otp.join('');
    const result = resetPasswordSchema.safeParse({
      otp: otpCode,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (forceCheckAll || touched[field]) {
          return issue.message;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    setError(validateForm(false));
  }, [otp, newPassword, confirmPassword, touched]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
    
    // Mark OTP as touched if they fill all fields or change
    if (newOtp.join('').length === 6) {
      setTouched((prev) => ({ ...prev, otp: true }));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
      setTouched((prev) => ({ ...prev, otp: true }));
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response?.message || LABELS.AUTH.RESEND_OTP_SUCCESS);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || LABELS.AUTH.RESEND_OTP_ERROR);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ otp: true, newPassword: true, confirmPassword: true });
    
    const validationError = validateForm(true);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const otpCode = otp.join('');

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        otp: otpCode,
        newPass: newPassword,
      });

      setSuccess(response?.message || LABELS.AUTH.RESET_SUCCESS);
      toast.success(LABELS.AUTH.RESET_SUCCESS_TOAST);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || LABELS.AUTH.RESET_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-6"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{LABELS.COMMON.SUCCESS}!</h2>
            <p className="text-sm text-gray-500 font-medium px-2 leading-relaxed">
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
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <Key className="w-8 h-8" />
            </div>
            <h1 className="text-h2 text-gray-900 mb-2">{LABELS.AUTH.RESET_PASSWORD_TITLE}</h1>
            <p className="text-gray-600 text-body">
              {LABELS.AUTH.RESET_PASSWORD_SUBTITLE(email || LABELS.AUTH.YOUR_EMAIL)}
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {error && <Alert type="error">{error}</Alert>}

            {/* OTP input field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">
                {LABELS.AUTH.OTP_INPUT_LABEL}
              </label>
              <div className="flex justify-center gap-2 md:gap-3">
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
                    onBlur={() => setTouched((prev) => ({ ...prev, otp: true }))}
                    className="w-11 h-12 md:w-12 md:h-14 text-center text-xl font-extrabold text-gray-900 border-2 border-gray-150 rounded-xl bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Password input fields */}
            <div className="relative group">
              <Input
                label={LABELS.AUTH.NEW_PASSWORD_LABEL}
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={LABELS.AUTH.NEW_PASSWORD_PLACEHOLDER}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="none"
                size="none"
                className="absolute right-4 top-[46px] text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>

            <div className="relative group">
              <Input
                label={LABELS.AUTH.CONFIRM_NEW_PASSWORD_LABEL}
                icon={Lock}
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder={LABELS.AUTH.CONFIRM_NEW_PASSWORD_LABEL}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="none"
                size="none"
                className="absolute right-4 top-[46px] text-gray-400 hover:text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>

            <Button type="submit" fullWidth loading={isLoading} className="py-4 text-lg font-bold mt-2">
              {LABELS.AUTH.RESET_PASSWORD_TITLE} <ShieldCheck className="ml-2" size={20} />
            </Button>
          </form>

          <div className="mt-6 text-center text-gray-500 text-small">
            {LABELS.AUTH.NO_OTP_RECEIVED}{' '}
            <Button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
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

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/forgot-password" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-small">
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
            {LABELS.COMMON.LOADING}
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
