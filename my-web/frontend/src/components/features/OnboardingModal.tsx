/**
 * Mục đích file này để làm gì: Component Modal để lấy thông tin khởi tạo tài khoản (Onboarding).
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị tự động khi người dùng mới đăng nhập lần đầu. Dùng chung cho cả luồng Thương gia (nhập chi nhánh) và Thực khách (khảo sát sở thích).
 * Các chức năng đặc biệt: Tự động cuộn, validate form theo bước, có hiệu ứng pháo hoa khi hoàn thành.
 */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, X, Plus, Trash2, MapPin, Compass } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { useOnboardingActions } from '@/hooks/useOnboardingActions';
import { LOCATION_DATA } from '@/constants/location.constant';

interface OnboardingModalProps {
  user: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  show?: boolean; // Cho phép force show từ Dashboard
  onClose?: () => void; // Cho phép đóng khi đang ở Dashboard
  title?: string;
}

export function OnboardingModal({ user, onComplete, onClose, title }: OnboardingModalProps) {
  const {
    step,
    setStep,
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
  } = useOnboardingActions({ user, onComplete });

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
            className={`bg-white w-full ${isBranchStep ? 'max-w-2xl' : 'max-w-xl'} rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8 md:p-10 transition-all duration-300`}
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
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>

            {/* Khối giao diện chính */}
            {isBranchStep ? (
              // BƯỚC KHAI BÁO CHI NHÁNH ĐA CƠ SỞ (MERCHANT)
              <div className="flex flex-col h-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-inner mx-auto text-orange-500">
                    <MapPin size={30} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                    {LABELS.ONBOARDING.BRANCH_STEP_TITLE}
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">
                    {LABELS.ONBOARDING.BRANCH_STEP_DESC}
                  </p>
                </div>

                {/* Danh sách các chi nhánh - Cuộn nội bộ mượt mà */}
                <form onSubmit={handleBranchSubmit} className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-300">
                    {branches.map((branch, index) => (
                      <div 
                        key={index}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 relative space-y-3"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                            {LABELS.RESTAURANT.BRANCH_NUMBER(index + 1)}: {branch.name || LABELS.COMMON.UNNAMED}
                          </span>
                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBranch(index)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1"
                              title={LABELS.RESTAURANT.DELETE_BRANCH}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Tên cơ sở */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.NAME_LABEL}
                            </label>
                            <input
                              type="text"
                              required
                              value={branch.name}
                              onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                              placeholder={LABELS.ONBOARDING.FORM.NAME_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          {/* Tỉnh / Thành phố */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.SETTINGS.PROFILE.EDIT_MODAL.CITY}
                            </label>
                            <select
                              required
                              value={branch.city || 'Hà Nội'}
                              onChange={(e) => {
                                handleBranchChange(index, 'city', e.target.value);
                                handleBranchChange(index, 'district', '');
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-primary text-xs font-bold"
                            >
                              {LOCATION_DATA.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quận / Huyện */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT}
                            </label>
                            <select
                              required
                              value={branch.district || ''}
                              onChange={(e) => handleBranchChange(index, 'district', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-primary text-xs font-bold"
                            >
                              <option value="" disabled hidden>
                                {LABELS.SETTINGS.PROFILE.EDIT_MODAL.DISTRICT_PLACEHOLDER}
                              </option>
                              {LOCATION_DATA.find((c) => c.value === (branch.city || 'Hà Nội'))
                                ?.districts.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Địa chỉ chi tiết */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.ADDRESS_LABEL}
                            </label>
                            <input
                              type="text"
                              required
                              value={branch.street || ''}
                              onChange={(e) => handleBranchChange(index, 'street', e.target.value)}
                              placeholder={LABELS.ONBOARDING.FORM.ADDRESS_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs font-bold"
                            />
                          </div>

                          {/* Vĩ độ */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.LAT_LABEL}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={branch.latitude}
                              onChange={(e) => handleBranchChange(index, 'latitude', parseFloat(e.target.value))}
                              placeholder={LABELS.ONBOARDING.FORM.LAT_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          {/* Kinh độ */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.LNG_LABEL}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={branch.longitude}
                              onChange={(e) => handleBranchChange(index, 'longitude', parseFloat(e.target.value))}
                              placeholder={LABELS.ONBOARDING.FORM.LNG_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          {/* Google Maps URL */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.MAP_URL_LABEL}
                            </label>
                            <input
                              type="url"
                              value={branch.mapUrl || ''}
                              onChange={(e) => handleBranchChange(index, 'mapUrl', e.target.value)}
                              placeholder={LABELS.ONBOARDING.FORM.MAP_URL_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          {/* Giờ mở cửa */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.HOURS_LABEL}
                            </label>
                            <input
                              type="text"
                              value={branch.openingHours || ''}
                              onChange={(e) => handleBranchChange(index, 'openingHours', e.target.value)}
                              placeholder={LABELS.ONBOARDING.FORM.HOURS_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          {/* Bio */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              {LABELS.ONBOARDING.FORM.BIO_LABEL}
                            </label>
                            <input
                              type="text"
                              value={branch.bio || ''}
                              onChange={(e) => handleBranchChange(index, 'bio', e.target.value)}
                              placeholder={LABELS.ONBOARDING.FORM.BIO_PLACEHOLDER}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm cơ sở mới */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleAddBranch}
                      className="px-4 py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-all text-xs font-bold flex items-center gap-1.5 bg-slate-50"
                    >
                      <Plus size={14} /> {LABELS.ONBOARDING.ADD_BRANCH_BTN}
                    </button>
                  </div>

                  {/* Thanh nút điều hướng cuối */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all text-xs md:text-sm"
                    >
                      {LABELS.ONBOARDING.BACK_BTN}
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-3 gradient-bg text-white rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all text-xs md:text-sm flex items-center justify-center gap-2"
                    >
                      {LABELS.ONBOARDING.COMPLETE_BTN} <Compass size={18} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // BƯỚC CÂU HỎI TRẮC NGHIỆM ĐẶC TRƯNG (CUSTOMER & RESTAURANT KHỞI ĐẦU)
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-inner">
                  {currentQuestion?.icon}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 leading-tight">
                  {title || currentQuestion?.question}
                </h2>
                {title && <p className="text-primary font-bold mb-2">{LABELS.CUSTOMER.QUESTION}: {currentQuestion?.question}</p>}
                <p className="text-gray-500 mb-10 text-sm md:text-base font-medium">
                  {currentQuestion?.description}
                </p>

                <div className="w-full">
                  {!showOtherInput ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {[...(currentQuestion?.options || []), { label: LABELS.COMMON.OTHER, value: 'other', emoji: '✍️' }].map((option) => (
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
                        placeholder={LABELS.FORM.OPINION_PLACEHOLDER}
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

                {/* Số bước đếm dưới modal */}
                <div className="mt-10 text-xs text-gray-400 font-bold uppercase tracking-widest">
                  {LABELS.ONBOARDING.STEP_INDICATOR(step + 1, totalSteps)}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // MÀN HÌNH HOÀN THÀNH ONBOARDING THÀNH CÔNG RỰC RỠ
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
