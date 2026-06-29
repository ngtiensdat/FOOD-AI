import { z } from 'zod';

export const foodSchema = z.object({
  name: z.string().min(1, 'Tên món ăn không được để trống'),
  price: z.number({ 
    message: 'Giá món ăn phải là số' 
  }).positive('Giá món ăn phải lớn hơn 0'),
  description: z.string().optional(),
  image: z.string().url('Đường dẫn ảnh không hợp lệ').or(z.string().length(0)),
  tags: z.array(z.string()).optional(),
  restaurantId: z.number({ message: 'Vui lòng chọn cơ sở kinh doanh' }),
  categoryId: z.number().optional().nullable(),
  calories: z.number().optional().nullable(),
  carbs: z.number().optional().nullable(),
  protein: z.number().optional().nullable(),
  fat: z.number().optional().nullable(),
});

export type FoodInput = z.infer<typeof foodSchema>;
