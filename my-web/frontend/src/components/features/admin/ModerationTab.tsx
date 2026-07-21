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
import { offerService } from '@/services/offer.service';

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
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'REPORTS' | 'PROMOTIONS'>('REPORTS');

  useEffect(() => {
    async function loadPendingReports() {
      try {
        const data = await reportService.getPendingReports();
        setReports(data || []);
      } catch (err) {
        console.error('Lỗi khi tải hàng đợi kiểm duyệt:', err);
      }
    }
    async function loadPendingOffers() {
      try {
        const data = await offerService.getOffers(undefined, 'PENDING');
        setPendingOffers(data || []);
      } catch (err) {
        console.error('Lỗi khi tải hàng đợi khuyến mãi:', err);
      }
    }
    loadPendingReports();
    loadPendingOffers();
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
      toast.error(LABELS.MODERATION.RESOLVE_ERROR);
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
      toast.error(LABELS.MODERATION.DISMISS_ERROR);
    }
  };

  const handleApproveOffer = async (offerId: number) => {
    try {
      await offerService.approveOffer(offerId);
      setPendingOffers(prev => prev.filter(o => o.id !== offerId));
      toast.success(LABELS.MODERATION.PROMOTIONS_APPROVE_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.MODERATION.PROMOTIONS_APPROVE_ERROR);
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      await offerService.rejectOffer(offerId);
      setPendingOffers(prev => prev.filter(o => o.id !== offerId));
      toast.success(LABELS.MODERATION.PROMOTIONS_REJECT_SUCCESS);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.MODERATION.PROMOTIONS_REJECT_ERROR);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2 mb-1">
          <ShieldAlert className="text-rose-500" size={28} />
          {LABELS.MODERATION.TITLE}
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">{LABELS.MODERATION.DESCRIPTION}</p>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-gray-100 dark:border-slate-800 gap-6 pb-0">
        <button
          onClick={() => setActiveSubTab('REPORTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'REPORTS'
              ? 'border-rose-500 text-rose-500'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
          }`}
        >
          {LABELS.MODERATION.TAB_REPORTS_COUNT(pendingReports.length)}
        </button>
        <button
          onClick={() => setActiveSubTab('PROMOTIONS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'PROMOTIONS'
              ? 'border-rose-500 text-rose-500'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
          }`}
        >
          {LABELS.MODERATION.TAB_PROMOTIONS_COUNT(pendingOffers.length)}
        </button>
      </div>

      {activeSubTab === 'REPORTS' && (
        pendingReports.length === 0 ? (
          <div className="card-container !p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
            <Check className="mx-auto text-emerald-500 mb-4 stroke-[3]" size={48} />
            <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">{LABELS.MODERATION.NO_REPORTS}</h3>
            <p className="text-gray-400 dark:text-slate-500 text-small">{LABELS.MODERATION.CLEAN_STATE_DESC}</p>
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
                          <Button
                            variant="ghost"
                            onClick={() => handleResolve(report.id, report.targetType, report.targetId)}
                            className="!p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                            title={LABELS.MODERATION.ACTION_APPROVE}
                            aria-label={LABELS.MODERATION.ACTION_APPROVE}
                          >
                            <Trash2 size={16} />
                          </Button>
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
        )
      )}

      {activeSubTab === 'PROMOTIONS' && (
        pendingOffers.length === 0 ? (
          <div className="card-container !p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
            <Check className="mx-auto text-emerald-500 mb-4 stroke-[3]" size={48} />
            <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">{LABELS.MODERATION.PROMOTIONS_EMPTY}</h3>
            <p className="text-gray-400 dark:text-slate-500 text-small">{LABELS.MODERATION.PROMOTIONS_EMPTY_DESC}</p>
          </div>
        ) : (
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row border-b border-gray-200 dark:border-slate-800">
                    <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.PROMOTIONS_COL_STORE}</th>
                    <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.PROMOTIONS_COL_TYPE}</th>
                    <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.PROMOTIONS_COL_TITLE_VALUE}</th>
                    <th className="py-4 px-6 text-xs font-black">{LABELS.MODERATION.PROMOTIONS_COL_DESC}</th>
                    <th className="py-4 px-6 text-xs font-black text-right">{LABELS.MODERATION.PROMOTIONS_COL_ACTION}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs font-bold text-gray-600">
                  {pendingOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-5 px-6 font-semibold text-gray-800 dark:text-slate-200">{offer.restaurantName}</td>
                      <td className="py-5 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                          {offer.promoType}
                        </span>
                      </td>
                      <td className="py-5 px-6 max-w-xs">
                        <div className="space-y-1">
                          <p className="text-gray-900 dark:text-white font-extrabold">{offer.title}</p>
                          <p className="text-[10px] text-primary font-bold">{LABELS.MODERATION.PROMOTIONS_VALUE_PREFIX}{offer.discountValue}</p>
                        </div>
                      </td>
                      <td className="py-5 px-6 max-w-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                        {offer.description}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleApproveOffer(offer.id)}
                            className="px-3 py-1.5 flex items-center gap-1 text-[11px] font-bold rounded-xl cursor-pointer"
                            size="none"
                          >
                            <Check size={12} />
                            {LABELS.MODERATION.PROMOTIONS_APPROVE}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectOffer(offer.id)}
                            className="px-3 py-1.5 flex items-center gap-1 text-[11px] font-bold rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            size="none"
                          >
                            <X size={12} />
                            {LABELS.MODERATION.PROMOTIONS_REJECT}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};
