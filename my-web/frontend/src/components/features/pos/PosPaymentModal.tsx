/**
 * Mục đích file này để làm gì: Component Modal thanh toán VietQR qua PayOS dành cho máy POS.
 * Các file khác hay file này có ý nghĩa như thế nào: Được gọi từ màn hình bán hàng POS (PosPage) để thực hiện thanh toán chuyển khoản trước khi tạo đơn hàng trên cơ sở dữ liệu.
 * Các chức năng đặc biệt: Tự động polling kiểm tra trạng thái thanh toán từ PayOS, đếm ngược thời gian hết hiệu lực QR 5 phút, cooldown nút hủy giao dịch 30 giây để tránh lỗi và cung cấp nút đối soát thủ công để xử lý khi kết nối lag.
 * Các biến, hàm đặc biệt trong file: PAYMENT_TIMEOUT_SECONDS, CANCEL_COOLDOWN_SECONDS, POLLING_INTERVAL_MS, handleForceCheckStatus, handleSuccessCheckout.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Copy, CheckCircle2, Loader2, X, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { orderService } from '@/services/order.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

// Constant Configurations
const PAYMENT_TIMEOUT_SECONDS = 300; // 5 minutes in seconds
const CANCEL_COOLDOWN_SECONDS = 30; // 30 seconds block delay
const POLLING_INTERVAL_MS = 3000; // Poll status every 3 seconds

interface PosPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  tableName: string;
  onPaymentSuccess: () => Promise<void>;
}

export const PosPaymentModal = ({
  isOpen,
  onClose,
  totalAmount,
  tableName,
  onPaymentSuccess,
}: PosPaymentModalProps) => {
  const t = LABELS.POS.PAYMENT_MODAL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    orderCode: number;
    checkoutUrl: string;
    qrCode: string;
    amount: number;
    description: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Timers states
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [cancelTimeLeft, setCancelTimeLeft] = useState(CANCEL_COOLDOWN_SECONDS);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createPayment = async () => {
    setLoading(true);
    setError(null);
    setPaymentStatus('PENDING');
    setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
    setCancelTimeLeft(CANCEL_COOLDOWN_SECONDS);
    try {
      const desc = `Ban ${tableName}`.trim();
      const data = await orderService.createPaymentLink(totalAmount, desc);
      setPaymentData(data);
    } catch (err: any) {
      console.error('Lỗi khi tạo mã QR PayOS:', err);
      setError(err?.message || t.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessCheckout = async () => {
    setConfirmingOrder(true);
    try {
      await onPaymentSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Lỗi khi lưu đơn hàng sau thanh toán:', err);
      toast.error(LABELS.POS.TOAST.CHECKOUT_ERROR);
    } finally {
      setConfirmingOrder(false);
    }
  };

  // Initialize and create payment request
  useEffect(() => {
    if (!isOpen) return;
    createPayment();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // Chỉ kích hoạt lại khi modal đóng/mở (isOpen thay đổi), không lắng nghe totalAmount hay tableName
    // để tránh bị gọi lại khi đơn hàng hoàn tất làm thay đổi state giỏ hàng/bàn ăn ở component cha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Timers countdown
  useEffect(() => {
    if (loading || error || paymentStatus === 'PAID' || paymentStatus === 'CANCELLED') return;

    const timer = setInterval(() => {
      // 1. Overall payment timeout countdown
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('CANCELLED');
          toast.error(LABELS.POS.PAYMENT_MODAL.EXPIRED_TITLE);
          return 0;
        }
        return prev - 1;
      });

      // 2. Cancel button block countdown
      setCancelTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, paymentStatus]);

  // Polling for payment status
  useEffect(() => {
    if (!paymentData || paymentStatus === 'PAID' || paymentStatus === 'CANCELLED' || timeLeft === 0) return;

    pollingRef.current = setInterval(async () => {
      try {
        console.log(`[PayOS Polling] Checking status for orderCode: ${paymentData.orderCode}`);
        const res = await orderService.getPaymentLinkStatus(paymentData.orderCode);
        console.log(`[PayOS Polling] Result status:`, res?.status, res);
        
        if (res && res.status) {
          const normalizedStatus = res.status.toUpperCase();
          if (normalizedStatus === 'PAID') {
            console.log('[PayOS Polling] Payment successful!');
            setPaymentStatus('PAID');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            toast.success(t.SUCCESS);
            handleSuccessCheckout();
          } else if (normalizedStatus === 'CANCELLED') {
            console.log('[PayOS Polling] Payment cancelled.');
            setPaymentStatus('CANCELLED');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            toast.error(t.CANCEL);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi cập nhật trạng thái PayOS:', err);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [paymentData, paymentStatus, timeLeft]);

  const handleCancelTransaction = () => {
    if (cancelTimeLeft > 0) return;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPaymentStatus('CANCELLED');
    onClose();
  };

  const handleForceCheckStatus = async () => {
    if (!paymentData || checkingStatus) return;
    setCheckingStatus(true);
    try {
      console.log(`[PayOS Manual Check] Checking status for orderCode: ${paymentData.orderCode}`);
      const res = await orderService.getPaymentLinkStatus(paymentData.orderCode);
      console.log(`[PayOS Manual Check] Result status:`, res?.status, res);

      if (res && res.status) {
        const normalizedStatus = res.status.toUpperCase();
        if (normalizedStatus === 'PAID') {
          console.log('[PayOS Manual Check] Payment verified successfully!');
          setPaymentStatus('PAID');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          toast.success(t.SUCCESS);
          await handleSuccessCheckout();
        } else {
          console.log('[PayOS Manual Check] Payment not verified yet.');
          toast.error(t.NOT_RECEIVED);
        }
      } else {
        toast.error(t.CHECK_FAILED);
      }
    } catch (err: any) {
      console.error('Lỗi khi kiểm tra thủ công:', err);
      toast.error(t.CHECK_ERROR);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopy = () => {
    if (!paymentData) return;
    navigator.clipboard.writeText(paymentData.description);
    setCopied(true);
    toast.success(t.COPY_SUCCESS);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isExpired = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={cancelTimeLeft === 0 ? onClose : undefined}
      />
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-2xl w-full relative z-10 space-y-5 animate-in scale-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <QrCode size={20} className="text-primary animate-pulse" />
              {t.TITLE}
            </h3>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">
              {t.DESC(tableName)}
            </p>
          </div>
          {cancelTimeLeft === 0 && (
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-650 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={36} className="text-primary animate-spin" />
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400">{t.LOADING}</p>
          </div>
        ) : error ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <AlertTriangle size={40} className="text-rose-500" />
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{error}</p>
            <Button size="sm" onClick={onClose} className="px-5">{t.CLOSE}</Button>
          </div>
        ) : paymentStatus === 'PAID' ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 animate-bounce">
            <CheckCircle2 size={56} className="text-emerald-500" />
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{t.SUCCESS}</p>
            <p className="text-xs text-gray-400">{t.SUCCESS_SUB}</p>
          </div>
        ) : isExpired ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500">
              <Clock size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-gray-800 dark:text-white">{t.EXPIRED_TITLE}</p>
              <p className="text-[11px] text-gray-400 font-bold">{t.EXPIRED_DESC}</p>
            </div>
            <div className="flex gap-3 w-full max-w-sm pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs"
              >
                {t.CLOSE}
              </Button>
              <Button
                onClick={createPayment}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                {t.RECREATE}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Section */}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 relative group">
                {paymentData?.qrCode ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(paymentData.qrCode)}`}
                    alt="VietQR PayOS"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-gray-400">Lỗi mã QR</div>
                )}
              </div>
              
              {/* Countdown badge */}
              <div className="mt-3 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 px-3 py-1 rounded-full text-[11px] font-black tracking-wider">
                <Clock size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>{t.TIME_LEFT(formatTime(timeLeft))}</span>
              </div>
            </div>

            {/* Billing details & status */}
            <div className="flex-1 w-full space-y-4 text-xs font-bold">
              <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t.AMOUNT_LABEL}</span>
                  <span className="text-lg font-black text-primary">{formatCurrency(totalAmount)}</span>
                </div>
                
                <div className="border-t border-gray-100 dark:border-slate-850 pt-2.5 flex justify-between items-center">
                  <span className="text-gray-400">{t.DESC_LABEL}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-gray-900 dark:text-white uppercase font-mono">{paymentData?.description}</span>
                    <button 
                      onClick={handleCopy}
                      className="p-1 hover:bg-gray-250 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-gray-650 transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-750 dark:text-amber-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>{t.SYSTEM_CHECKING}</span>
              </div>

              {paymentData?.checkoutUrl && (
                <a 
                  href={paymentData.checkoutUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-center transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>{t.OPEN_PORTAL}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && paymentStatus !== 'PAID' && !isExpired && (
          <div className="flex gap-4 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button
              onClick={handleCancelTransaction}
              disabled={cancelTimeLeft > 0 || checkingStatus}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer text-center ${
                cancelTimeLeft > 0 || checkingStatus
                  ? 'border-gray-150 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-gray-450 dark:text-slate-600 cursor-not-allowed'
                  : 'border-gray-200 dark:border-slate-700 text-gray-650 dark:text-slate-400 hover:text-rose-500 hover:border-rose-350'
              }`}
            >
              {cancelTimeLeft > 0 ? t.CANCEL_WAITING(cancelTimeLeft) : t.CANCEL}
            </button>
            <button
              onClick={handleForceCheckStatus}
              disabled={checkingStatus}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                checkingStatus
                  ? 'bg-gray-100 dark:bg-slate-900 text-gray-450 border border-gray-150 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01]'
              }`}
            >
              {checkingStatus ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {t.CHECKING_BTN}
                </>
              ) : (
                t.CONFIRM_BTN
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
