/**
 * Mục đích file này để làm gì: Tab Báo lỗi kỹ thuật trong phần Cài đặt tài khoản.
 * Các file khác hay file này có ý nghĩa như nào: Cung cấp biểu mẫu báo lỗi chuẩn cho người dùng, lưu phản hồi vào localStorage để mô phỏng tính năng gửi feedback lỗi.
 * Các chức năng đặc biệt: Phân loại danh mục lỗi động (AI/UI/Hệ thống), kiểm duyệt độ dài phản hồi tối thiểu, mô phỏng tải ảnh lỗi qua link URL.
 */
'use client';

import React, { useState } from 'react';
import { Bug, Image as ImageIcon, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { bugReportService } from '@/services/bug-report.service';

export const BugReportTab = () => {
  const [category, setCategory] = useState<'AI' | 'UI' | 'PERFORMANCE' | 'OTHER'>('UI');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (description.trim().length < LIMITS.BUG_REPORT_DESC_MIN_LENGTH) {
      setError(LABELS.BUG_REPORT.DESC_TOO_SHORT);
      return;
    }

    setLoading(true);

    try {
      await bugReportService.createBugReport({
        category,
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      setSuccess(true);
      setDescription('');
      setImageUrl('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || LABELS.BUG_REPORT.SUBMIT_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h3 className="text-h3 text-gray-900 flex items-center gap-2 mb-1">
          <Bug className="text-rose-500" size={24} />
          {LABELS.BUG_REPORT.TITLE}
        </h3>
        <p className="text-small text-gray-500">
          {LABELS.BUG_REPORT.SUBTITLE}
        </p>
      </div>

      {success && (
        <div className="alert-box-rose !bg-emerald-50 !border-emerald-200 !color-emerald-600 dark:!bg-emerald-950/20 dark:!border-emerald-900/50 dark:!text-emerald-400 p-4 font-bold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{LABELS.BUG_REPORT.SUCCESS}</span>
        </div>
      )}

      {error && (
        <div className="alert-box-rose p-4 font-bold flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {LABELS.BUG_REPORT.CATEGORY}
          </label>
          <select
            className="form-input bg-none"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            disabled={loading}
          >
            <option value="AI">{LABELS.BUG_REPORT.CATEGORIES.AI}</option>
            <option value="UI">{LABELS.BUG_REPORT.CATEGORIES.UI}</option>
            <option value="PERFORMANCE">{LABELS.BUG_REPORT.CATEGORIES.PERFORMANCE}</option>
            <option value="OTHER">{LABELS.BUG_REPORT.CATEGORIES.OTHER}</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {LABELS.BUG_REPORT.DESC}
          </label>
          <textarea
            className="form-input min-h-[140px] resize-y"
            placeholder={LABELS.BUG_REPORT.DESC_PLACEHOLDER}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Image Screenshot Link */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ImageIcon size={14} />
            {LABELS.BUG_REPORT.IMAGE}
          </label>
          <input
            type="text"
            className="form-input"
            placeholder={LABELS.BUG_REPORT.IMAGE_PLACEHOLDER}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button variant="primary" type="submit" loading={loading} className="w-full sm:w-auto shadow-md">
            <Sparkles size={16} className="mr-2" />
            {LABELS.BUG_REPORT.SUBMIT}
          </Button>
        </div>
      </form>
    </div>
  );
};
