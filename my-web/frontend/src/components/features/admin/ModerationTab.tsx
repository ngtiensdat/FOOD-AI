/**
 * Mục đích file này để làm gì: Component Tab Kiểm duyệt nội dung trong Panel Admin.
 * Các file khác hay file này có ý nghĩa như nào: Hiển thị và xử lý hàng đợi các báo cáo vi phạm (Reports) lấy từ localStorage.
 * Các chức năng đặc biệt: Cho phép Admin phê duyệt (gỡ bỏ bài đăng/bình luận vi phạm tương ứng trong localStorage) hoặc bác bỏ báo cáo (giữ nguyên bài đăng).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { addNotification } from '@/utils/notifications';
import { reportService } from '@/services/report.service';

interface Report {
  id: number;
  userId: number;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  content: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
}

const DEFAULT_REPORTS: Report[] = [];

export const ModerationTab = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    async function loadPendingReports() {
      try {
        const data = await reportService.getPendingReports();
        setReports(data || []);
      } catch (err) {
        console.error('Lỗi khi tải hàng đợi kiểm duyệt:', err);
      }
    }
    loadPendingReports();
  }, []);

  const handleResolve = async (reportId: number, targetType: 'POST' | 'COMMENT', targetId: number) => {
    try {
      await reportService.resolveReport(reportId);
      
      // Update local state
      setReports(prev => prev.filter(r => r.id !== reportId));

      const targetReport = reports.find(r => r.id === reportId);
      
      // Send notifications
      if (targetReport && targetReport.userId) {
        addNotification(
          targetReport.userId,
          LABELS.MODERATION.NOTIFICATIONS.REPORT_RESOLVED_TITLE,
          LABELS.MODERATION.NOTIFICATIONS.REPORT_RESOLVED_BODY(targetType, targetId),
          'MODERATION_RESOLVE',
          '/admin-avatar.png'
        );
      }

      toast.success(LABELS.MODERATION.RESOLVE_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xử lý báo cáo vi phạm!');
    }
  };

  const handleRejectReport = async (reportId: number) => {
    try {
      await reportService.dismissReport(reportId);
      
      // Update local state
      setReports(prev => prev.filter(r => r.id !== reportId));

      const targetReport = reports.find(r => r.id === reportId);
      if (targetReport && targetReport.userId) {
        addNotification(
          targetReport.userId,
          LABELS.MODERATION.NOTIFICATIONS.REPORT_RESOLVED_TITLE,
          LABELS.MODERATION.NOTIFICATIONS.REPORT_DISMISSED_BODY(targetReport.targetType, targetReport.targetId),
          'MODERATION_DISMISS',
          '/admin-avatar.png'
        );
      }

      toast.success(LABELS.MODERATION.REJECT_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi từ chối báo cáo vi phạm!');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <ShieldAlert className="text-rose-500" size={28} />
          {LABELS.MODERATION.TITLE}
        </h2>
        <p className="text-sm text-gray-500">{LABELS.MODERATION.PENDING_REPORTS}</p>
      </div>

      {pendingReports.length === 0 ? (
        <div className="card-container !p-12 text-center border-2 border-dashed !border-gray-100">
          <Check className="mx-auto text-emerald-500 mb-4 stroke-[3]" size={48} />
          <h3 className="text-lg font-bold text-gray-400">{LABELS.MODERATION.NO_REPORTS}</h3>
          <p className="text-gray-400 text-small">{LABELS.MODERATION.CLEAN_STATE_DESC}</p>
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header-row border-b border-gray-200 dark:border-slate-800">
                  <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.TARGET_TYPE}</th>
                  <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.TARGET_ID}</th>
                  <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.REPORT_REASON}</th>
                  <th className="py-4 px-6 text-xs font-black text-right">{LABELS.COMMON.ACTION}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs font-bold text-gray-600">
                {pendingReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                        report.targetType === 'POST'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400'
                      }`}>
                        {report.targetType}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-mono text-gray-400">#{report.targetId}</td>
                    <td className="py-5 px-6 max-w-sm">
                      <div className="flex gap-2 items-start">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{report.content}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Approve Report: Resolve/Remove Post */}
                        <Button
                          variant="ghost"
                          onClick={() => handleResolve(report.id, report.targetType, report.targetId)}
                          className="!p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                          title={LABELS.MODERATION.ACTION_APPROVE}
                          aria-label={LABELS.MODERATION.ACTION_APPROVE}
                        >
                          <Trash2 size={16} />
                        </Button>

                        {/* Reject Report: Dismiss */}
                        <Button
                          variant="ghost"
                          onClick={() => handleRejectReport(report.id)}
                          className="!p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                          title={LABELS.MODERATION.ACTION_REJECT}
                          aria-label={LABELS.MODERATION.ACTION_REJECT}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
