/**
 * Mục đích: Custom hook quản lý toàn bộ business logic của VoucherManager.
 * Kiến thức: DIP – VoucherManager component không còn import voucherService trực tiếp.
 *             SRP – tách biệt hoàn toàn state/logic khỏi render UI.
 * Biến, hàm đặc biệt: useVoucherManager, fetchVouchers, handleCreateVoucher, handleGeneratePointCode, handleVerifyVoucher.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { voucherService } from '@/services/voucher.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

// ── Interfaces ─────────────────────────────────────────────────────────────
export interface VoucherData {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
  minSpend: string;
  expiryDays: number;
  expiryDate?: string;
  quantity: number;
  usedCount: number;
  image?: string;
  promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
  restaurantId?: number;
  restaurantName?: string;
  createdAt?: string;
}

export interface PointCodeData {
  id: string;
  code: string;
  points: number;
  restaurantId: number;
  createdAt: string;
  expiresAt: string;
  usedById: number | null;
  usedByName: string | null;
  usedAt: string | null;
}

interface UseVoucherManagerParams {
  restaurantId: number;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useVoucherManager({ restaurantId }: UseVoucherManagerParams) {
  const t = LABELS.VOUCHER_MANAGER;

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'VOUCHER' | 'POINT_CODE' | 'VERIFY_VOUCHER' | 'PROMOTION'>('VOUCHER');

  // ── Data state ──
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [editingVoucher, setEditingVoucher] = useState<VoucherData | null>(null);
  const [pointCodes, setPointCodes] = useState<PointCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Verification state ──
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    reason?: string;
    details?: {
      title: string;
      discountValue: string;
      minSpend: string;
      customerName: string;
      redeemedAt: string;
      isUsed?: boolean;
      usedAt?: string;
    };
  } | null>(null);
  const [applying, setApplying] = useState(false);

  // ── Form state ──
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [promoType, setPromoType] = useState<'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER'>('DISCOUNT');
  const [discountValue, setDiscountValue] = useState('');
  const [minSpend, setMinSpend] = useState('0đ');
  const [pointsCost, setPointsCost] = useState(100);
  const [quantity, setQuantity] = useState(100);
  const [expiryDays, setExpiryDays] = useState(30);
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');

  // ── Point Code Generator state ──
  const [pointAmountSelect, setPointAmountSelect] = useState<number>(100);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [activeCode, setActiveCode] = useState<{ code: string; expiresAt: string; points: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // ── Delete confirmation state ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Localized config options ──
  const promoTypeOptions = useMemo(() => [
    { value: 'DISCOUNT', label: LABELS.OFFERS.PROMO_TYPES.DISCOUNT },
    { value: 'COMBO', label: LABELS.OFFERS.PROMO_TYPES.COMBO },
    { value: 'GIFT', label: LABELS.OFFERS.PROMO_TYPES.GIFT },
    { value: 'OTHER', label: LABELS.OFFERS.PROMO_TYPES.OTHER },
  ], []);

  const discountValues = useMemo(() => t.FORM_OPTIONS?.DISCOUNT_VALUES?.[promoType] || [], [t.FORM_OPTIONS, promoType]);
  const quantities = useMemo(() => t.FORM_OPTIONS?.QUANTITIES || [10, 20, 50, 100, 200, 500, 1000], [t.FORM_OPTIONS]);
  const pointsCosts = useMemo(() => t.FORM_OPTIONS?.POINTS_COSTS || [50, 100, 200, 500, 1000, 2000], [t.FORM_OPTIONS]);
  const expiryDaysOptions = useMemo(() => t.FORM_OPTIONS?.EXPIRY_DAYS || [
    { value: 7, label: '7 ngày' },
    { value: 15, label: '15 ngày' },
    { value: 30, label: '30 ngày' },
    { value: 60, label: '60 ngày' },
  ], [t.FORM_OPTIONS]);
  const descriptions = useMemo(() => t.FORM_OPTIONS?.DESCRIPTIONS || ['Áp dụng cho mọi hóa đơn tại cửa hàng.'], [t.FORM_OPTIONS]);

  // Auto-select default description when promoType changes
  useEffect(() => {
    if (t.FORM_OPTIONS?.DESCRIPTIONS?.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(t.FORM_OPTIONS.DESCRIPTIONS[0]);
    }
  }, [promoType, t.FORM_OPTIONS]);

  // Update currentTime whenever timeLeft ticks
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTime(Date.now());
  }, [timeLeft]);

  // ── Data fetching ──
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await voucherService.getVouchers(restaurantId);
      setVouchers(data || []);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      toast.error(t.TOAST.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointCodesLogs = async () => {
    try {
      const logs = await voucherService.getPointCodesLogs();
      setPointCodes(logs || []);

      const now = new Date().getTime();
      const active = (logs || []).find(
        (code: PointCodeData) => !code.usedById && new Date(code.expiresAt).getTime() > now
      );
      setActiveCode(active ? { code: active.code, expiresAt: active.expiresAt, points: active.points } : null);
    } catch (err) {
      console.error('Error fetching point codes log:', err);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (activeTab === 'VOUCHER') fetchVouchers();
      else fetchPointCodesLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, activeTab]);

  // Countdown timer for active point code
  useEffect(() => {
    if (!activeCode) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((new Date(activeCode.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setActiveCode(null);
        fetchPointCodesLogs();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCode]);

  // ── Statistics ──
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalClaims = vouchers.reduce((acc, curr) => acc + (curr.usedCount ?? 0), 0);
    const totalQty = vouchers.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
    const claimRate = totalQty > 0 ? Math.round((totalClaims / totalQty) * 100) : 0;
    const active = vouchers.filter((v) => v.usedCount < v.quantity).length;
    return { total, active, totalClaims, claimRate };
  }, [vouchers]);

  // ── Filtered vouchers ──
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];
    if (filterType !== 'ALL') result = result.filter((o) => o.promoType === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) => o.title.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vouchers, filterType, searchQuery]);

  // ── Form handlers ──
  const handleOpenModal = () => {
    setEditingVoucher(null);
    setPromoType('DISCOUNT');
    setDiscountValue('');
    setMinSpend('0đ');
    setPointsCost(100);
    setQuantity(100);
    setExpiryDays(30);
    setExpiryDate('');
    if (t.FORM_OPTIONS?.DESCRIPTIONS?.length > 0) setDescription(t.FORM_OPTIONS.DESCRIPTIONS[0]);
    setIsOpenModal(true);
  };

  const handleEditClick = (voucher: VoucherData) => {
    setEditingVoucher(voucher);
    setPromoType(voucher.promoType);
    setDiscountValue(voucher.discountValue);
    setMinSpend(voucher.minSpend);
    setPointsCost(voucher.pointsCost);
    setQuantity(voucher.quantity);
    setExpiryDays(voucher.expiryDays);
    setExpiryDate(voucher.expiryDate ? voucher.expiryDate.split('T')[0] : '');
    setDescription(voucher.description);
    setIsOpenModal(true);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedId(id);
        toast.success(t.TOAST.COPY_SUCCESS(code));
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.error(t.TOAST.COPY_ERROR));
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await voucherService.deleteVoucher(confirmDeleteId);
      toast.success(t.TOAST.DELETE_SUCCESS);
      setConfirmDeleteId(null);
      fetchVouchers();
    } catch (err) {
      console.error(err);
      toast.error(t.TOAST.DELETE_ERROR);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabel = promoTypeOptions.find((o) => o.value === promoType)?.label || '';
    const title = `${typeLabel} ${discountValue}`;
    const payload = { title, description, pointsCost, discountValue, minSpend, expiryDays, expiryDate: expiryDate || undefined, quantity, promoType };

    try {
      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, payload);
        toast.success(t.TOAST.UPDATE_SUCCESS);
      } else {
        await voucherService.createVoucher(payload);
        toast.success(t.TOAST.CREATE_SUCCESS);
      }
      fetchVouchers();
      setIsOpenModal(false);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || t.TOAST.CREATE_ERROR);
    }
  };

  const handleGeneratePointCode = async () => {
    setGeneratingCode(true);
    try {
      const codeData = await voucherService.generatePointCode({ points: pointAmountSelect });
      toast.success(t.POINT_CODES.CREATE_SUCCESS_MSG(codeData.code, pointAmountSelect));
      setActiveCode({ code: codeData.code, expiresAt: codeData.expiresAt, points: codeData.points });
      fetchPointCodesLogs();
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || t.POINT_CODES.CREATE_ERROR);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleVerifyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await voucherService.verifyVoucher(verificationCode.trim());
      setVerificationResult(res);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || t.TOAST.VERIFY_ERROR);
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!verificationCode.trim() || !verificationResult?.isValid) return;
    setApplying(true);
    try {
      await voucherService.applyVoucher(verificationCode.trim());
      toast.success(t.VERIFY_VOUCHER.APPLY_SUCCESS);
      setVerificationCode('');
      setVerificationResult(null);
      fetchVouchers();
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || t.VERIFY_VOUCHER.APPLY_ERROR);
    } finally {
      setApplying(false);
    }
  };

  return {
    t,
    // Tab
    activeTab,
    setActiveTab,
    // Data
    vouchers,
    editingVoucher,
    pointCodes,
    loading,
    stats,
    filteredVouchers,
    currentTime,
    // Search & filter
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    copiedId,
    // Verification
    verificationCode,
    setVerificationCode,
    verifying,
    verificationResult,
    applying,
    // Form
    isOpenModal,
    setIsOpenModal,
    promoType,
    setPromoType,
    discountValue,
    setDiscountValue,
    minSpend,
    setMinSpend,
    pointsCost,
    setPointsCost,
    quantity,
    setQuantity,
    expiryDays,
    setExpiryDays,
    expiryDate,
    setExpiryDate,
    description,
    setDescription,
    promoTypeOptions,
    discountValues,
    quantities,
    pointsCosts,
    expiryDaysOptions,
    descriptions,
    // Point Code
    pointAmountSelect,
    setPointAmountSelect,
    generatingCode,
    activeCode,
    timeLeft,
    // Delete confirmation
    confirmDeleteId,
    setConfirmDeleteId,
    // Handlers
    handleOpenModal,
    handleEditClick,
    handleCopy,
    handleDelete,
    handleCreateVoucher,
    handleGeneratePointCode,
    handleVerifyVoucher,
    handleApplyVoucher,
  };
}
