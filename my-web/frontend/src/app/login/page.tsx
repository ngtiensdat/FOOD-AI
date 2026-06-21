/**
 * @fileoverview frontend/src/app/login/page.tsx
 * @module AuthLogin
 * @description Trang Đăng nhập của ứng dụng. Đóng vai trò UI Orchestrator chuyên biệt cho việc hiển thị form đăng nhập, toàn bộ logic xử lý trạng thái và gọi API được trừu tượng hoá vào hook `useLoginActions`.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/base/SafeImage';
import { Mail, Lock, ArrowRight, Eye, EyeOff, UtensilsCrossed, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
// Hooks
import { useLoginActions } from '@/hooks/useLoginActions';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { LABELS } from '@/constants/labels';

export default function LoginPage() {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    errors,
    isLoading,
    handleLogin,
    handleBlur,
  } = useLoginActions();

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Visual / Branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12" style={{ background: 'linear-gradient(145deg, #FF6B00 0%, #FF9A3C 45%, #FFB800 100%)' }}>
        {/* Background decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #fff7 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 z-10">
          <div className="relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="44px" className="object-contain p-1.5" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">{LABELS.COMMON.BRAND_NAME}</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center -mt-8">
          {/* Floating food icon circle */}
          <div className="relative mb-8">
            <div className="w-36 h-36 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
              <UtensilsCrossed className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
            {/* Floating badges */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 -right-4 bg-white rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-gray-800">{LABELS.AUTH.LOGIN_PANEL_RATING}</span>
            </motion.div>
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-2 -left-6 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-gray-700">{LABELS.AUTH.LOGIN_PANEL_AI_BADGE}</span>
            </motion.div>
          </div>

          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            {LABELS.AUTH.LOGIN_PANEL_HEADING}<br />
            <span className="text-white/80">{LABELS.AUTH.LOGIN_PANEL_HEADING_SUB}</span>
          </h2>
          <p className="text-white/70 text-base max-w-xs leading-relaxed">
            {LABELS.AUTH.LOGIN_PANEL_DESC}
          </p>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <p className="text-white/90 text-sm font-medium leading-relaxed">
            &ldquo;{LABELS.AUTH.LOGIN_PANEL_TESTIMONIAL}&rdquo;
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-9 h-9 rounded-full border-2 border-white/40 overflow-hidden flex-shrink-0 bg-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/9.x/personas/svg?seed=Khoa&size=36&backgroundColor=ffdfbf`}
                alt={LABELS.AUTH.LOGIN_PANEL_TESTIMONIAL_AUTHOR}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-white/90 text-xs font-bold block">{LABELS.AUTH.LOGIN_PANEL_TESTIMONIAL_AUTHOR}</span>
              <div className="flex gap-0.5 mt-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-50 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden">
            <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="40px" className="object-contain p-1.5" />
          </div>
          <span className="text-2xl font-black gradient-text">{LABELS.COMMON.BRAND_NAME}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 mb-1">{LABELS.AUTH.LOGIN_TITLE}</h1>
            <p className="text-gray-500 text-sm">{LABELS.AUTH.LOGIN_SUBTITLE}</p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-100 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-200 p-7">
            <form onSubmit={handleLogin} className="space-y-4">
              {errors.form && (
                <Alert type="error">{errors.form}</Alert>
              )}

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
                  className="pr-12"
                />
                <Button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  variant="none"
                  size="none"
                  className="absolute right-4 top-[42px] text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>

              <div className="text-right -mt-1">
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">{LABELS.AUTH.FORGOT_PASSWORD}</Link>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                className="py-3.5 text-base mt-2"
              >
                {LABELS.AUTH.LOGIN} <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-5 text-center text-gray-500 text-sm">
            {LABELS.AUTH.NO_ACCOUNT}{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">{LABELS.AUTH.REGISTER_NOW}</Link>
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
              ← {LABELS.COMMON.BACK}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
