import React from 'react';
import { Sparkles, Heart, DollarSign, AlertTriangle, Store, Utensils, Users } from 'lucide-react';

export const CUSTOMER_QUESTIONS = [
  {
    id: 'goal',
    question: 'Mục tiêu ăn uống của bạn là gì?',
    description: 'Để AI gợi ý những món ăn phù hợp với sức khỏe của bạn.',
    icon: <Sparkles className="text-orange-500" size={32} />,
    options: [
      { label: 'Giảm cân', value: 'weight_loss', emoji: '🥗' },
      { label: 'Tăng cơ', value: 'muscle_gain', emoji: '💪' },
      { label: 'Ăn sạch (Eat Clean)', value: 'eat_clean', emoji: '🥦' },
      { label: 'Thưởng thức', value: 'enjoy', emoji: '🍕' },
    ]
  },
  {
    id: 'cuisine',
    question: 'Bạn đặc biệt thích phong cách ẩm thực nào?',
    description: 'Chúng tôi sẽ ưu tiên hiển thị các quán có hương vị này.',
    icon: <Heart className="text-red-500" size={32} />,
    options: [
      { label: 'Việt Nam', value: 'vietnamese', emoji: '🍜' },
      { label: 'Hàn Quốc', value: 'korean', emoji: '🥘' },
      { label: 'Nhật Bản', value: 'japanese', emoji: '🍣' },
      { label: 'Âu Mỹ', value: 'western', emoji: '🍔' },
    ]
  },
  {
    id: 'budget',
    question: 'Ngân sách cho một bữa ăn của bạn?',
    description: 'Gợi ý các quán ăn phù hợp với túi tiền của bạn.',
    icon: <DollarSign className="text-green-500" size={32} />,
    options: [
      { label: 'Dưới 50k', value: 'low', emoji: '💰' },
      { label: '50k - 100k', value: 'medium', emoji: '💳' },
      { label: '100k - 200k', value: 'high', emoji: '💎' },
      { label: 'Trên 200k', value: 'premium', emoji: '👑' },
    ]
  },
  {
    id: 'allergies',
    question: 'Bạn có bị dị ứng với gì không?',
    description: 'An toàn của bạn là trên hết. Hãy cho AI biết nhé!',
    icon: <AlertTriangle className="text-yellow-500" size={32} />,
    options: [
      { label: 'Hải sản', value: 'seafood', emoji: '🦐' },
      { label: 'Đậu phộng', value: 'peanuts', emoji: '🥜' },
      { label: 'Sữa/Phô mai', value: 'dairy', emoji: '🥛' },
      { label: 'Không dị ứng', value: 'none', emoji: '✅' },
    ]
  }
];

export const RESTAURANT_QUESTIONS = [
  {
    id: 'style',
    question: 'Phong cách quán của bạn là gì?',
    description: 'Giúp khách hàng hình dung về không gian quán.',
    icon: <Store className="text-blue-500" size={32} />,
    options: [
      { label: 'Sang trọng', value: 'luxury', emoji: '🏛️' },
      { label: 'Bình dân', value: 'casual', emoji: '🏠' },
      { label: 'Vỉa hè/Đường phố', value: 'street', emoji: '🛵' },
      { label: 'Bán mang về', value: 'takeaway', emoji: '🥡' },
    ]
  },
  {
    id: 'flavor',
    question: 'Hương vị chủ đạo của quán là gì?',
    description: 'Khách hàng thường tìm kiếm theo hương vị ưa thích.',
    icon: <Utensils className="text-orange-500" size={32} />,
    options: [
      { label: 'Cay nồng', value: 'spicy', emoji: '🌶️' },
      { label: 'Ngọt ngào', value: 'sweet', emoji: '🍯' },
      { label: 'Đậm đà', value: 'savory', emoji: '🍲' },
      { label: 'Thanh đạm', value: 'light', emoji: '🥬' },
    ]
  },
  {
    id: 'target',
    question: 'Đối tượng khách hàng bạn muốn tiếp cận?',
    description: 'AI sẽ ưu tiên hiển thị quán cho tệp khách này.',
    icon: <Users className="text-purple-500" size={32} />,
    options: [
      { label: 'Sinh viên', value: 'students', emoji: '🎓' },
      { label: 'Dân văn phòng', value: 'office', emoji: '💼' },
      { label: 'Gia đình', value: 'family', emoji: '👨‍👩‍👧‍👦' },
      { label: 'Khách du lịch', value: 'tourists', emoji: '📸' },
    ]
  }
];
