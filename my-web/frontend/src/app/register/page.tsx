'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/base/SafeImage';
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, CheckCircle2, ShoppingBag, ChefHat, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
// Hooks
import { useRegisterActions } from '@/hooks/useRegisterActions';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { LABELS } from '@/constants/labels';
import { UserRole } from '@/types/user';

export default function RegisterPage() {
  const {
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
    handleRegister,
    handleBlur,
  } = useRegisterActions();

  const REGISTER_FEATURES = [
    { icon: Sparkles, text: LABELS.AUTH.REGISTER_PANEL_FEATURE_1 },
    { icon: ShoppingBag, text: LABELS.AUTH.REGISTER_PANEL_FEATURE_2 },
    { icon: ChefHat, text: LABELS.AUTH.REGISTER_PANEL_FEATURE_3 },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Visual / Branding ── */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-10" style={{ background: 'linear-gradient(145deg, #FF6B00 0%, #FF9A3C 45%, #FFB800 100%)' }}>
        {/* Background decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -right-16 w-[420px] h-[420px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 z-10">
          <div className="relative w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="40px" className="object-contain p-1.5" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">{LABELS.COMMON.BRAND_NAME}</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-4">
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            {LABELS.AUTH.REGISTER_PANEL_HEADING}<br />
            <span className="text-white/80">{LABELS.AUTH.REGISTER_PANEL_HEADING_SUB}</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-xs">
            {LABELS.AUTH.REGISTER_PANEL_DESC}
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {REGISTER_FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/85 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/20">
          <div className="flex -space-x-2">
            {LABELS.AUTH.REGISTER_PANEL_AVATAR_INITIALS.map((letter, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white/40 bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                {letter}
              </div>
            ))}
          </div>
          <div>
            <p className="text-white text-xs font-bold">{LABELS.AUTH.REGISTER_PANEL_MEMBER_COUNT}</p>
            <p className="text-white/65 text-xs">{LABELS.AUTH.REGISTER_PANEL_MEMBER_DESC}</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Register Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 bg-gray-50 dark:bg-gray-50 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="relative w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden">
            <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="36px" className="object-contain p-1.5" />
          </div>
          <span className="text-xl font-black gradient-text">{LABELS.COMMON.BRAND_NAME}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {successMessage ? (
            <div className="bg-white dark:bg-gray-100 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-200 p-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 dark:text-gray-900 mb-2">{LABELS.COMMON.SUCCESS}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-600 leading-relaxed">{successMessage}</p>
                </div>
                <Link href="/login" className="block">
                  <Button variant="primary" fullWidth>
                    {LABELS.AUTH.LOGIN_GO} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 mb-1">{LABELS.AUTH.REGISTER_TITLE}</h1>
                <p className="text-gray-500 text-sm">{LABELS.AUTH.REGISTER_SUBTITLE}</p>
              </div>

              {/* Form Card */}
              <div className="bg-white dark:bg-gray-100 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-200 p-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  {errors.form && (
                    <Alert type="error">{errors.form}</Alert>
                  )}

                  {/* Role selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-800 ml-0.5 uppercase tracking-wide">{LABELS.AUTH.WHO_ARE_YOU}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[UserRole.CUSTOMER, UserRole.RESTAURANT].map((r) => (
                        <Button
                          suppressHydrationWarning
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          variant="none"
                          size="none"
                          className={`py-2.5 rounded-xl border-2 font-bold transition-all text-sm ${
                            role === r
                              ? 'border-primary bg-orange-50 dark:bg-primary-light/10 text-primary'
                              : 'border-gray-200 dark:border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {r === UserRole.CUSTOMER ? LABELS.AUTH.CUSTOMER : LABELS.AUTH.RESTAURANT}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label={LABELS.SETTINGS.PROFILE.FULL_NAME}
                    icon={User}
                    required
                    placeholder={LABELS.FORM.PLACEHOLDERS.NAME}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    error={errors.name}
                  />

                  <Input
                    label={LABELS.FORM.EMAIL}
                    icon={Mail}
                    type="email"
                    required
                    placeholder={LABELS.FORM.PLACEHOLDERS.EMAIL}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                      <Input
                        label={LABELS.AUTH.PASSWORD}
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => handleBlur('password')}
                        error={errors.password}
                        className="pr-10"
                      />
                      <Button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="none"
                        size="none"
                        className="absolute right-3 top-[40px] text-gray-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>

                    <div className="relative group">
                      <Input
                        label={LABELS.AUTH.CONFIRM_PASSWORD}
                        icon={Lock}
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        error={errors.confirmPassword}
                        className="pr-10"
                      />
                      <Button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="none"
                        size="none"
                        className="absolute right-3 top-[40px] text-gray-400 hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>

                  {role === UserRole.RESTAURANT && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Input
                        label={LABELS.AUTH.LEGAL_DOCS}
                        isTextArea
                        required
                        placeholder={LABELS.AUTH.LEGAL_DOCS_PLACEHOLDER}
                        value={legalDocuments}
                        onChange={(e) => setLegalDocuments(e.target.value)}
                        onBlur={() => handleBlur('legalDocuments')}
                        error={errors.legalDocuments}
                      />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-2.5 py-0.5">
                    <Input suppressHydrationWarning variant="none" type="checkbox" required className="mt-0.5 accent-primary h-4 w-4 flex-shrink-0" />
                    <label className="text-xs text-gray-500 leading-relaxed">
                      {LABELS.AUTH.AGREE_TERMS_PREFIX}
                      <Link href="/terms" className="text-primary hover:underline font-bold">{LABELS.AUTH.AGREE_TERMS_LINK}</Link>
                      {LABELS.AUTH.AGREE_TERMS_AND}
                      <Link href="/policy" className="text-primary hover:underline font-bold">{LABELS.AUTH.AGREE_POLICY_LINK}</Link>
                    </label>
                  </div>

                  <Button type="submit" fullWidth loading={isLoading} className="py-3 text-base">
                    {LABELS.AUTH.REGISTER} <ArrowRight size={18} className="ml-2" />
                  </Button>
                </form>
              </div>

              {/* Footer */}
              <div className="mt-5 text-center text-gray-500 text-sm">
                {LABELS.AUTH.ALREADY_HAVE_ACCOUNT}{' '}
                <Link href="/login" className="text-primary font-bold hover:underline">{LABELS.AUTH.LOGIN}</Link>
              </div>
              <div className="mt-3 text-center">
                <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  ← {LABELS.COMMON.BACK}
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
