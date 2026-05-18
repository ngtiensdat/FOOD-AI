'use client';

import { useState } from 'react';
import { toast } from '@/store/useToastStore';
import { ONBOARDING_DEFAULTS, ONBOARDING_LABELS } from '@/constants/onboarding.constant';
import { CUSTOMER_QUESTIONS, RESTAURANT_QUESTIONS } from '@/constants/onboarding-questions';

interface UseOnboardingActionsProps {
  user: any;
  onComplete: (data: any) => void;
}

export function useOnboardingActions({ user, onComplete }: UseOnboardingActionsProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const isRestaurant = user.role === 'RESTAURANT';

  // Khởi tạo các chi nhánh động của thương gia dựa trên dữ liệu mặc định tránh magic number
  const [branches, setBranches] = useState<any[]>([
    {
      name: '',
      address: '',
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
    if (value === 'other') {
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
        address: '',
        latitude: 0,
        longitude: 0,
        mapUrl: '',
        bio: '',
        openingHours: '',
      }
    ]);
    toast.success(ONBOARDING_LABELS.ADD_BRANCH_SUCCESS);
  };

  const handleRemoveBranch = (index: number) => {
    if (branches.length === 1) {
      toast.error(ONBOARDING_LABELS.MIN_BRANCH_REQUIRED);
      return;
    }
    setBranches(branches.filter((_, i) => i !== index));
    toast.success(ONBOARDING_LABELS.REMOVE_BRANCH_SUCCESS);
  };

  const handleBranchChange = (index: number, field: string, value: any) => {
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
      if (!b.name.trim() || !b.address.trim()) {
        toast.error(ONBOARDING_LABELS.REQUIRED_BRANCH_FIELDS(i + 1));
        return;
      }
      
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        toast.error(ONBOARDING_LABELS.INVALID_COORDINATES(i + 1));
        return;
      }
      
      if (lat < -90 || lat > 90) {
        toast.error(ONBOARDING_LABELS.INVALID_LATITUDE(i + 1));
        return;
      }
      
      if (lng < -180 || lng > 180) {
        toast.error(ONBOARDING_LABELS.INVALID_LONGITUDE(i + 1));
        return;
      }
    }

    finishOnboarding(answers, branches);
  };

  const finishOnboarding = async (finalAnswers: any, finalBranches?: any[]) => {
    setIsFinishing(true);
    setTimeout(() => {
      onComplete({
        preferences: finalAnswers,
        ...(isRestaurant ? { branches: finalBranches } : {})
      });
    }, ONBOARDING_DEFAULTS.SUCCESS_ANIMATION_TIMEOUT);
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
