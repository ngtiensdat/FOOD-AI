'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, User, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
// Hooks
import { useRegisterActions } from '@/hooks/useRegisterActions';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { LABELS } from '@/constants/labels';

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
    handleRegister
  } = useRegisterActions();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-small">
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
              <Image src="/favicon.ico" alt="Food AI Logo" fill className="object-contain p-2" />
            </div>
            <span className="text-3xl font-bold gradient-text">Food AI</span>
          </Link>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100">
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{LABELS.AUTH.VERIFY_ACCOUNT}</h2>
                <p className="text-sm text-gray-500 font-medium px-2 leading-relaxed">{successMessage}</p>
              </div>
              <div className="pt-4 border-t border-gray-50">
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
                <h1 className="text-h2 mb-2">{LABELS.AUTH.REGISTER_TITLE}</h1>
                <p className="text-gray-500 text-body">{LABELS.AUTH.REGISTER_SUBTITLE}</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {errors.form && (
                  <Alert type="error">{errors.form}</Alert>
                )}
                <div className="space-y-2">
                  <label className="text-small font-semibold text-gray-700 ml-1">{LABELS.AUTH.WHO_ARE_YOU}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['CUSTOMER', 'RESTAURANT'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-3 rounded-xl border-2 font-bold transition-all text-small ${
                          role === r ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {r === 'CUSTOMER' ? LABELS.AUTH.CUSTOMER : LABELS.AUTH.RESTAURANT}
                      </button>
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

                <div className="relative group">
                  <Input
                    label={LABELS.AUTH.CONFIRM_PASSWORD}
                    icon={Lock}
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder={LABELS.FORM.PLACEHOLDERS.PASSWORD}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-[46px] text-gray-400 hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {role === 'RESTAURANT' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <Input
                      label={LABELS.AUTH.LEGAL_DOCS}
                      isTextArea
                      required
                      placeholder={LABELS.AUTH.LEGAL_DOCS_PLACEHOLDER}
                      value={legalDocuments}
                      onChange={(e) => setLegalDocuments(e.target.value)}
                      error={errors.legalDocuments}
                    />
                  </motion.div>
                )}

                <div className="flex items-start gap-3 p-1">
                  <input type="checkbox" required className="mt-1 accent-primary h-4 w-4" />
                  <label className="text-xs text-gray-500 leading-relaxed">
                    {LABELS.AUTH.AGREE_TERMS}
                  </label>
                </div>

                <Button type="submit" fullWidth loading={isLoading} className="py-4 text-lg">
                  {LABELS.AUTH.REGISTER} <ArrowRight size={20} className="ml-2" />
                </Button>
              </form>

              <div className="mt-8 text-center text-gray-500 text-small">
                {LABELS.AUTH.ALREADY_HAVE_ACCOUNT} <Link href="/login" className="text-primary font-bold hover:underline">{LABELS.AUTH.LOGIN}</Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
