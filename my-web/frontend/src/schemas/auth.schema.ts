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

export type LoginInput = z.infer<typeof registerSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
