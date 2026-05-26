'use client';

// Mục đích file: Hook quản lý toàn bộ state và logic của luồng Onboarding.
// Ý nghĩa: Tách biệt logic nhập liệu (sở thích, thông tin chi nhánh) khỏi component giao diện.
// Các chức năng đặc biệt: Xử lý quy trình điền form từng bước, validate thông tin toạ độ và giờ mở cửa, thêm xoá chi nhánh động.
// Các biến, hàm đặc biệt: OnboardingBranchState, handleBranchSubmit, handleAddBranch, finishOnboarding.

import { useState } from 'react';
import { toast } from '@/store/useToastStore';
import { CUSTOMER_QUESTIONS, RESTAURANT_QUESTIONS } from '@/configs/onboarding.config';
import { LABELS } from '@/constants/labels';
import { isValidOpeningHours } from '@/utils/helpers';
import { User, UserRole } from '@/types/user';

const DEFAULT_CITY = 'Hà Nội';
const OTHER_OPTION_KEY = 'other';

export interface OnboardingBranchState {
  name: string;
  city: string;
  district: string;
  street: string;
  latitude: number | string;
  longitude: number | string;
  mapUrl: string;
  bio: string;
  openingHours: string;
}

export interface OnboardingSubmitData {
  preferences: Record<string, string>;
  branches?: {
    name: string;
    address: string;
    latitude: number | string;
    longitude: number | string;
    mapUrl: string;
    bio: string;
    openingHours: string;
  }[];
}

interface UseOnboardingActionsProps {
  user: User;
  onComplete: (data: OnboardingSubmitData) => void;
}

export function useOnboardingActions({ user, onComplete }: UseOnboardingActionsProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const isRestaurant = user.role === UserRole.RESTAURANT;

  // Khởi tạo các chi nhánh động của thương gia dựa trên dữ liệu mặc định tránh magic number
  const [branches, setBranches] = useState<OnboardingBranchState[]>([
    {
      name: '',
      city: DEFAULT_CITY,
      district: '',
      street: '',
      latitude: 0,
      longitude: 0,
      mapUrl: '',
      bio: '',
      openingHours: '',
    }
  ]);

  const questions = isRestaurant ? RESTAURANT_QUESTIONS : CUSTOMER_QUESTIONS;
  const totalSteps = isRestaurant ? questions.length + 1 : questions.length;
  const isBranchStep = isRestaurant && step === questions.length;
  const currentQuestion = !isBranchStep ? questions[step] : null;

  const handleSelect = (value: string) => {
    if (value === OTHER_OPTION_KEY) {
      setShowOtherInput(true);
      return;
    }

    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    proceed(newAnswers);
  };

  const handleOtherSubmit = () => {
    if (!otherValue.trim() || !currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: `${OTHER_OPTION_KEY}:${otherValue}` };
    setAnswers(newAnswers);
    proceed(newAnswers);
  };

  const proceed = (newAnswers: Record<string, string>) => {
    setShowOtherInput(false);
    setOtherValue('');
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      if (isRestaurant) {
        setStep(questions.length);
      } else {
        finishOnboarding(newAnswers);
      }
    }
  };

  const handleAddBranch = () => {
    setBranches([
      ...branches,
      {
        name: '',
        city: DEFAULT_CITY,
        district: '',
        street: '',
        latitude: 0,
        longitude: 0,
        mapUrl: '',
        bio: '',
        openingHours: '',
      }
    ]);
    toast.success(LABELS.ONBOARDING.ADD_BRANCH_SUCCESS);
  };

  const handleRemoveBranch = (index: number) => {
    if (branches.length === 1) {
      toast.error(LABELS.ONBOARDING.MIN_BRANCH_REQUIRED);
      return;
    }
    setBranches(branches.filter((_, i) => i !== index));
    toast.success(LABELS.ONBOARDING.REMOVE_BRANCH_SUCCESS);
  };

  const handleBranchChange = (index: number, field: keyof OnboardingBranchState, value: string | number) => {
    const newBranches = [...branches];
    newBranches[index] = {
      ...newBranches[index],
      [field]: value
    };
    setBranches(newBranches);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ràng buộc tính hợp lệ của dữ liệu
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      if (!b.name.trim() || !b.city || !b.district || !b.street.trim()) {
        toast.error(LABELS.ONBOARDING.REQUIRED_BRANCH_FIELDS(i + 1));
        return;
      }
      
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        toast.error(LABELS.ONBOARDING.INVALID_COORDINATES(i + 1));
        return;
      }
      
      if (lat < -90 || lat > 90) {
        toast.error(LABELS.ONBOARDING.INVALID_LATITUDE(i + 1));
        return;
      }
      
      if (lng < -180 || lng > 180) {
        toast.error(LABELS.ONBOARDING.INVALID_LONGITUDE(i + 1));
        return;
      }

      if (b.openingHours && b.openingHours.trim()) {
        if (!isValidOpeningHours(b.openingHours)) {
          toast.error(LABELS.ONBOARDING.INVALID_HOURS_FORMAT(i + 1));
          return;
        }
      }
    }

    const finalBranches = branches.map(b => {
      const { city, district, street, ...rest } = b;
      return {
        ...rest,
        address: `${street}, ${district}, ${city}`
      };
    });

    finishOnboarding(answers, finalBranches);
  };

  const finishOnboarding = async (finalAnswers: Record<string, string>, finalBranches?: OnboardingSubmitData['branches']) => {
    setIsFinishing(true);
    setTimeout(() => {
      onComplete({
        preferences: finalAnswers,
        ...(isRestaurant ? { branches: finalBranches } : {})
      });
    }, 2000);
  };

  return {
    step,
    setStep,
    answers,
    isFinishing,
    showOtherInput,
    setShowOtherInput,
    otherValue,
    setOtherValue,
    branches,
    questions,
    totalSteps,
    isBranchStep,
    currentQuestion,
    handleSelect,
    handleOtherSubmit,
    handleAddBranch,
    handleRemoveBranch,
    handleBranchChange,
    handleBranchSubmit
  };
}
