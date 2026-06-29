import { z } from 'zod';
import { LABELS } from '@/constants/labels';

export const restaurantSchema = z.object({
  name: z.string().min(1, LABELS.RESTAURANT.EDIT_MODAL.NAME_REQUIRED),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  description: z.string().optional(),
  mapUrl: z.string().url(LABELS.FORM.URL_INVALID).or(z.string().length(0)),
  logo: z.string().url(LABELS.FORM.URL_INVALID).or(z.string().length(0)).nullable(),
  coverImage: z.string().url(LABELS.FORM.URL_INVALID).or(z.string().length(0)).nullable(),
  bio: z.string().optional(),
  contactEmail: z.string().email(LABELS.FORM.EMAIL_INVALID).or(z.string().length(0)),
  contactPhone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, LABELS.FORM.PHONE_INVALID).or(z.string().length(0)),
  openingHours: z.string()
    .regex(/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/, LABELS.RESTAURANT.HOURS_FORMAT_ERROR)
    .or(z.string().length(0)),
  syncWithPersonalAvatar: z.boolean().optional(),
  syncWithPersonalCover: z.boolean().optional(),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;
