/**
 * Mục đích: Custom hook quản lý toàn bộ data fetching và business actions cho trang Offers/Voucher Mall.
 * Kiến thức: DIP – OffersSection component không còn phụ thuộc trực tiếp vào offerService/voucherService.
 *             SRP – tách biệt data logic khỏi render logic của OffersSection.
 * Biến, hàm đặc biệt: useOffers, handleDeleteOffer, handleRedeem, groupedVouchers, filteredPromotions.
 */
import { useState, useEffect, useMemo } from 'react';
import { offerService } from '@/services/offer.service';
import { voucherService } from '@/services/voucher.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { User } from '@/types/user';

export interface OfferData {
  id: number;
  title: string;
  description: string;
  promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
  discountValue: string;
  restaurantName: string;
  restaurantId?: number;
  image: string;
  validUntil: string;
  createdAt?: string;
}

export interface VoucherData {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
  minSpend: string;
  expiryDays: number;
  restaurantId?: number;
  restaurantName?: string;
}

interface UseOffersParams {
  user: Partial<User> | null;
  login: (_user: Partial<User>) => void;
}

export function useOffers({ user, login }: UseOffersParams) {
  const [activeSection, setActiveSection] = useState<'PROMOTIONS' | 'VOUCHERS'>('PROMOTIONS');
  const [promotions, setPromotions] = useState<OfferData[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch promotions on mount
  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await offerService.getOffers();
        setPromotions(data || []);
      } catch (err) {
        console.error('Lỗi khi tải khuyến mại:', err);
      }
    }
    loadOffers();
  }, []);

  // Fetch vouchers when switching to VOUCHERS tab
  useEffect(() => {
    if (activeSection === 'VOUCHERS') {
      const loadVouchers = async () => {
        setLoadingVouchers(true);
        try {
          const data = await voucherService.getVouchers();
          setVouchers(data || []);
        } catch (err) {
          console.error('Lỗi khi tải danh sách voucher đổi điểm:', err);
        } finally {
          setLoadingVouchers(false);
        }
      };
      loadVouchers();
    }
  }, [activeSection]);

  // Group vouchers by restaurant for the accordion UI
  const groupedVouchers = useMemo(() => {
    const groups: Record<string, { id: number | null; name: string; list: VoucherData[] }> = {};
    const filteredVouchers = searchQuery.trim()
      ? vouchers.filter(
          (v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.restaurantName && v.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : vouchers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filteredVouchers.forEach((v: any) => {
      const key = v.restaurantId ? String(v.restaurantId) : 'system';
      if (!groups[key]) {
        groups[key] = {
          id: v.restaurantId || null,
          name: v.restaurantName || 'Hệ thống FOOD AI',
          list: [],
        };
      }
      groups[key].list.push(v);
    });

    return Object.values(groups)
      .sort((a, b) => {
        if (a.id === null) return -1;
        if (b.id === null) return 1;
        return a.name.localeCompare(b.name);
      })
      .filter((group) => group.list.length > 0);
  }, [vouchers, searchQuery]);

  // Filter promotions by type and search query
  const filteredPromotions = useMemo(() => {
    let result = promotions;
    if (filterType !== 'ALL') {
      result = result.filter((p) => p.promoType === filterType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.restaurantName.toLowerCase().includes(query)
      );
    }
    return result;
  }, [promotions, filterType, searchQuery]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!window.confirm(LABELS.OFFERS.TOAST.DELETE_CONFIRM)) return;
    try {
      await offerService.deleteOffer(offerId);
      setPromotions((prev) => prev.filter((p) => p.id !== offerId));
      toast.success(LABELS.OFFERS.TOAST.DELETE_SUCCESS);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.OFFERS.TOAST.DELETE_ERROR);
    }
  };

  const handleRedeem = async (voucher: VoucherData) => {
    const userPoints = user?.points || 0;
    if (userPoints < voucher.pointsCost) {
      toast.error(LABELS.LOYALTY.REDEEM_ERROR);
      return;
    }

    try {
      const redeemed = await voucherService.redeemVoucher(voucher.id);
      const nextPoints = userPoints - voucher.pointsCost;

      if (user) {
        login({ ...user, points: nextPoints });
      }

      toast.success(LABELS.LOYALTY.REDEEM_SUCCESS_WITH_CODE(redeemed.code));
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.LOYALTY.REDEEM_ERROR_VOUCHER);
    }
  };

  const handleCreateOffer = async (dto: {
    title: string;
    description: string;
    promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
    discountValue: string;
    image: string;
    validUntil: string;
    status?: string;
  }) => {
    try {
      const newOffer = await offerService.createOffer(dto);
      if (newOffer.status === 'APPROVED') {
        setPromotions((prev) => [newOffer, ...prev]);
        toast.success(LABELS.OFFERS.TOAST.CREATE_SUCCESS);
      } else {
        toast.success(LABELS.OFFERS.TOAST.CREATE_PENDING_SUCCESS);
      }
      return true;
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.OFFERS.TOAST.CREATE_ERROR);
      return false;
    }
  };

  return {
    activeSection,
    setActiveSection,
    filterType,
    setFilterType,
    loadingVouchers,
    groupedVouchers,
    filteredPromotions,
    expandedGroups,
    toggleGroup,
    handleDeleteOffer,
    handleRedeem,
    handleCreateOffer,
    searchQuery,
    setSearchQuery,
  };
}
