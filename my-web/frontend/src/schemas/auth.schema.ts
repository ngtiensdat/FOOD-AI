import { z } from 'zod';
import { LABELS } from '@/constants/labels';
import { UserRole } from '@/types/user';

export const loginSchema = z.object({
  email: z.string()
    .min(1, LABELS.FORM.EMAIL_REQUIRED)
    .email(LABELS.FORM.EMAIL_INVALID),
  password: z.string()
    .min(1, LABELS.FORM.PASSWORD_REQUIRED),
});

export const registerSchema = z.object({
  name: z.string()
    .min(2, LABELS.FORM.NAME_REQUIRED)
    .regex(/^[^0-9]*$/, LABELS.FORM.NAME_INVALID),
  email: z.string()
    .min(1, LABELS.FORM.EMAIL_REQUIRED)
    .email(LABELS.FORM.EMAIL_INVALID),
  password: z.string()
    .min(8, LABELS.FORM.PASSWORD_INVALID)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, LABELS.FORM.PASSWORD_INVALID),
  confirmPassword: z.string(),
  role: z.string().optional(),
  legalDocuments: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: LABELS.FORM.CONFIRM_PASSWORD_MISMATCH,
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === UserRole.RESTAURANT) {
    return !!data.legalDocuments && data.legalDocuments.trim().length >= 10;
  }
  return true;
}, {
  message: LABELS.FORM.LEGAL_DOCS_REQUIRED,
  path: ['legalDocuments'],
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, LABELS.AUTH.ENTER_EMAIL_ERROR)
    .email(LABELS.FORM.EMAIL_INVALID),
});

export const resetPasswordSchema = z.object({
  otp: z.string()
    .length(6, LABELS.AUTH.VERIFY_OTP_REQUIRED)
    .regex(/^\d{6}$/, LABELS.AUTH.VERIFY_OTP_INVALID),
  newPassword: z.string()
    .min(8, LABELS.AUTH.PASSWORD_MIN_LENGTH)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, LABELS.FORM.PASSWORD_INVALID),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: LABELS.AUTH.PASSWORD_MISMATCH,
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  email: z.string()
    .min(1, LABELS.FORM.EMAIL_REQUIRED)
    .email(LABELS.FORM.EMAIL_INVALID),
  otp: z.string()
    .length(6, LABELS.AUTH.VERIFY_OTP_REQUIRED)
    .regex(/^\d{6}$/, LABELS.AUTH.VERIFY_OTP_INVALID),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
