/**
 * Mục đích file này để làm gì: Modal báo cáo vi phạm nội dung (Bài đăng hoặc bình luận).
 * Các file khác hay file này có ý nghĩa như nào: Thu thập dữ liệu báo cáo khớp cấu trúc bảng Report trong Prisma (targetType, targetId, content, status) và đẩy vào localStorage cho Admin xử lý.
 * Các chức năng đặc biệt: Hỗ trợ báo cáo bài đăng (POST) và bình luận (COMMENT), phân loại lý do vi phạm chuẩn mực cộng đồng trực quan.
 */
'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { reportService } from '@/services/report.service';

interface ReportModalProps {
  isOpen: boolean;
  targetId: number;
  targetType: 'POST' | 'COMMENT';
  currentUserId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

// REPORT_REASONS are sourced from LABELS.MODERATION.REPORT_REASONS to support i18n
// keeping a local alias for readability inside the component
const getReportReasons = () => LABELS.MODERATION.REPORT_REASONS;

export const ReportModal = ({
  isOpen,
  targetId,
  targetType,
  currentUserId,
  onClose,
  onSubmitted,
}: ReportModalProps) => {
  const reportReasons = getReportReasons();
  const [selectedReason, setSelectedReason] = useState(() => getReportReasons()[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullContent = selectedReason.startsWith(LABELS.MODERATION.REPORT_OTHER_PREFIX)
      ? customDetails.trim()
      : `${selectedReason}${customDetails.trim() ? `${LABELS.MODERATION.REPORT_DETAIL_PREFIX}${customDetails.trim()}` : ''}`;

    try {
      await reportService.createReport({
        targetType,
        targetId,
        content: fullContent || LABELS.MODERATION.DEFAULT_REPORT_CONTENT,
      });

      onSubmitted();
      onClose();
      // Reset form state
      setSelectedReason(reportReasons[0]);
      setCustomDetails('');
    } catch (err: unknown) {
      console.error(err);
      const { toast } = await import('@/store/useToastStore');
      toast.error(LABELS.MODERATION.TOAST_REPORT_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-wrapper">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-card max-w-md relative z-10 fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-h3 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert size={24} />
            {LABELS.MODERATION.REPORT_TITLE}
          </h2>
          <Button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            aria-label={LABELS.COMMON.CANCEL}
            variant="none"
            size="none"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Warning Banner */}
          <div className="alert-box-rose mb-6 text-xs leading-relaxed py-3.5 bg-rose-50/50">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{LABELS.MODERATION.REPORT_BANNER}</span>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {LABELS.MODERATION.REPORT_MAIN_REASON_LABEL}
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400 font-extrabold'
                        : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                  <Input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    variant="none"
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {LABELS.MODERATION.REPORT_REASON_LABEL}
            </label>
            <Input
              isTextArea
              variant="none"
              className="form-input min-h-[90px] resize-none w-full"
              placeholder={LABELS.MODERATION.REPORT_DETAILS_PLACEHOLDER}
              value={customDetails}
              onChange={(e) => setCustomDetails((e.target as HTMLTextAreaElement).value)}
              disabled={loading}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {LABELS.COMMON.CANCEL}
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              className="bg-rose-600 hover:bg-rose-700 border-rose-600 text-white"
            >
              {LABELS.MODERATION.REPORT_SUBMIT}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
