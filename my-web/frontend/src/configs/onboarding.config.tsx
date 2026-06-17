import React from 'react';
import { Sparkles, Heart, DollarSign, AlertTriangle, Store, Utensils, Users } from 'lucide-react';
import { LABELS } from '@/constants/labels';

export const CUSTOMER_QUESTIONS = [
  {
    id: 'goal',
    question: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.Q,
    description: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.DESC,
    icon: <Sparkles className="text-orange-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.OPT.WEIGHT_LOSS, value: 'weight_loss', emoji: '🥗' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.OPT.MUSCLE_GAIN, value: 'muscle_gain', emoji: '💪' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.OPT.EAT_CLEAN, value: 'eat_clean', emoji: '🥦' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.GOAL.OPT.ENJOY, value: 'enjoy', emoji: '🍕' },
    ]
  },
  {
    id: 'cuisine',
    question: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.Q,
    description: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.DESC,
    icon: <Heart className="text-red-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.OPT.VIETNAMESE, value: 'vietnamese', emoji: '🍜' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.OPT.KOREAN, value: 'korean', emoji: '🥘' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.OPT.JAPANESE, value: 'japanese', emoji: '🍣' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.CUISINE.OPT.WESTERN, value: 'western', emoji: '🍔' },
    ]
  },
  {
    id: 'budget',
    question: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.Q,
    description: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.DESC,
    icon: <DollarSign className="text-green-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.OPT.UNDER_100K, value: 'under_100k', emoji: '💰' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.OPT['100K_200K'], value: '100k_200k', emoji: '💳' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.OPT['200K_400K'], value: '200k_400k', emoji: '💎' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.BUDGET.OPT.OVER_400K, value: 'over_400k', emoji: '👑' },
    ]
  },
  {
    id: 'allergies',
    question: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.Q,
    description: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.DESC,
    icon: <AlertTriangle className="text-yellow-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.OPT.SEAFOOD, value: 'seafood', emoji: '🦐' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.OPT.PEANUTS, value: 'peanuts', emoji: '🥜' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.OPT.DAIRY, value: 'dairy', emoji: '🥛' },
      { label: LABELS.ONBOARDING.QUESTIONS.CUSTOMER.ALLERGIES.OPT.NONE, value: 'none', emoji: '✅' },
    ]
  }
];

export const RESTAURANT_QUESTIONS = [
  {
    id: 'style',
    question: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.Q,
    description: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.DESC,
    icon: <Store className="text-blue-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.OPT.LUXURY, value: 'luxury', emoji: '🏛️' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.OPT.CASUAL, value: 'casual', emoji: '🏠' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.OPT.STREET, value: 'street', emoji: '🛵' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.STYLE.OPT.TAKEAWAY, value: 'takeaway', emoji: '🥡' },
    ]
  },
  {
    id: 'flavor',
    question: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.Q,
    description: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.DESC,
    icon: <Utensils className="text-orange-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.OPT.SPICY, value: 'spicy', emoji: '🌶️' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.OPT.SWEET, value: 'sweet', emoji: '🍯' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.OPT.SAVORY, value: 'savory', emoji: '🍲' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.FLAVOR.OPT.LIGHT, value: 'light', emoji: '🥬' },
    ]
  },
  {
    id: 'target',
    question: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.Q,
    description: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.DESC,
    icon: <Users className="text-purple-500" size={32} />,
    options: [
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.OPT.STUDENTS, value: 'students', emoji: '🎓' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.OPT.OFFICE, value: 'office', emoji: '💼' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.OPT.FAMILY, value: 'family', emoji: '👨‍👩‍👧‍👦' },
      { label: LABELS.ONBOARDING.QUESTIONS.RESTAURANT.TARGET.OPT.TOURISTS, value: 'tourists', emoji: '📸' },
    ]
  }
];
