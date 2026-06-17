'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, DollarSign, AlertTriangle, 
  Store, Utensils, Users, ArrowRight, CheckCircle2, X 
} from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface OnboardingModalProps {
  user: any;
  onComplete: (data: any) => void;
  show?: boolean; // Cho phép force show từ Dashboard
  onClose?: () => void; // Cho phép đóng khi đang ở Dashboard
  title?: string;
}

export function OnboardingModal({ user, onComplete, show, onClose, title }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const isRestaurant = user.role === 'RESTAURANT';

  const customerQuestions = [
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

  const restaurantQuestions = [
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

  const questions = isRestaurant ? restaurantQuestions : customerQuestions;
  const currentQuestion = questions[step];

  const handleSelect = (value: string) => {
    if (value === 'other') {
      setShowOtherInput(true);
      return;
    }

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    proceed(newAnswers);
  };

  const handleOtherSubmit = () => {
    if (!otherValue.trim()) return;
    const newAnswers = { ...answers, [currentQuestion.id]: `other:${otherValue}` };
    setAnswers(newAnswers);
    proceed(newAnswers);
  };

  const proceed = (newAnswers: any) => {
    setShowOtherInput(false);
    setOtherValue('');
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = async (finalAnswers: any) => {
    setIsFinishing(true);
    // Để người dùng thấy animation thành công trong 2 giây rồi mới gọi onComplete
    setTimeout(() => {
      onComplete(finalAnswers);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      
      <AnimatePresence mode="wait">
        {!isFinishing ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8 md:p-12"
          >
            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors z-20"
              >
                <X size={24} />
              </button>
            )}
            {/* Progress bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-400 to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-inner">
                {currentQuestion.icon}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 leading-tight">
                {title || currentQuestion.question}
              </h2>
              {title && <p className="text-primary font-bold mb-2">Câu hỏi: {currentQuestion.question}</p>}
              <p className="text-gray-500 mb-10 text-sm md:text-base font-medium">
                {currentQuestion.description}
              </p>

              <div className="w-full">
                {!showOtherInput ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {[...currentQuestion.options, { label: LABELS.COMMON.OTHER, value: 'other', emoji: '✍️' }].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="group relative flex items-center gap-4 p-5 bg-gray-50 border-2 border-transparent hover:border-primary hover:bg-orange-50 rounded-2xl transition-all text-left"
                      >
                        <span className="text-3xl group-hover:scale-125 transition-transform">{option.emoji}</span>
                        <div>
                          <div className="font-bold text-gray-800 group-hover:text-primary transition-colors text-sm md:text-base">
                            {option.label}
                          </div>
                        </div>
                        <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" size={18} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-4"
                  >
                    <textarea
                      autoFocus
                      placeholder="Hãy nhập ý kiến của bạn tại đây..."
                      className="w-full p-6 bg-gray-50 border-2 border-gray-200 rounded-3xl outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-lg min-h-[120px]"
                      value={otherValue}
                      onChange={(e) => setOtherValue(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowOtherInput(false)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        {LABELS.COMMON.BACK}
                      </button>
                      <button 
                        onClick={handleOtherSubmit}
                        disabled={!otherValue.trim()}
                        className="flex-[2] py-4 gradient-bg text-white rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {LABELS.COMMON.NEXT} <ArrowRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-10 text-xs text-gray-400 font-bold uppercase tracking-widest">
                {LABELS.CUSTOMER.STEP(step + 1, questions.length)}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center relative z-10 shadow-2xl overflow-hidden"
          >
            {/* Background decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.05),transparent)] pointer-events-none" />
            
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{LABELS.CUSTOMER.ONBOARDING_SUCCESS}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {LABELS.CUSTOMER.ONBOARDING_PREPARING}
            </p>
            
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  className="w-3 h-3 bg-primary rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
