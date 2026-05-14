'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
    handleLogin
  } = useLoginActions();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-small">
        <ArrowLeft size={20} /> {LABELS.COMMON.BACK}
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-lg overflow-hidden">
              <Image src="/favicon.ico" alt="Food AI Logo" fill className="object-contain p-2" />
            </div>
            <span className="text-3xl font-bold gradient-text">Food AI</span>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-h2 mb-2">{LABELS.AUTH.LOGIN_TITLE}</h1>
            <p className="text-gray-500 text-body">{LABELS.AUTH.LOGIN_SUBTITLE}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                error={errors.password}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[46px] text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right">
              <a href="#" className="text-small font-bold text-primary hover:underline">{LABELS.AUTH.FORGOT_PASSWORD}</a>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="py-4 text-lg"
            >
              {LABELS.AUTH.LOGIN} <ArrowRight size={20} className="ml-2" />
            </Button>
          </form>

          <div className="mt-8 text-center text-gray-500 text-small">
            {LABELS.AUTH.NO_ACCOUNT} <Link href="/register" className="text-primary font-bold hover:underline">{LABELS.AUTH.REGISTER_NOW}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
