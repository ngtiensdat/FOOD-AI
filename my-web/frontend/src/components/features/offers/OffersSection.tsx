'use client';

import React from 'react';
import { Tag, Calendar, Store, Gift, Flame, Percent, ChevronRight, Trash2, Sparkles, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { toast } from '@/store/useToastStore';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { User, UserRole } from '@/types/user';
import { useRouter } from 'next/navigation';

interface OffersSectionProps {
  user: Partial<User> | null;
  setActiveTab: (tab: string) => void;
}

export const OffersSection = ({ user, setActiveTab }: OffersSectionProps) => {
  const { login } = useAuth();
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [promoType, setPromoType] = React.useState<'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER'>('DISCOUNT');
  const [promoValue, setPromoValue] = React.useState('');
  const [promoExpiry, setPromoExpiry] = React.useState('');
  const [promoDesc, setPromoDesc] = React.useState('');
  const [isCustomValue, setIsCustomValue] = React.useState(false);
  const [customValue, setCustomValue] = React.useState('');

  // Tự động chọn mốc khuyến mãi đầu tiên của loại tương ứng khi loại thay đổi
  React.useEffect(() => {
    const presets = LABELS.VOUCHER_MANAGER.FORM_OPTIONS.DISCOUNT_VALUES[promoType];
    if (presets && presets.length > 0) {
      setPromoValue(presets[0]);
      setIsCustomValue(false);
      setCustomValue('');
    }
  }, [promoType]);

  // DIP: Tất cả data fetching và business logic được ủy quyền cho useOffers hook
  const {
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
  } = useOffers({ user, login });

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalValue = isCustomValue ? customValue.trim() : promoValue.trim();

    if (!finalValue) {
      toast.error(LABELS.OFFERS.TOAST.VALUE_REQUIRED);
      return;
    }
    if (!promoExpiry) {
      toast.error(LABELS.OFFERS.TOAST.EXPIRY_REQUIRED);
      return;
    }
    if (!promoDesc.trim()) {
      toast.error(LABELS.OFFERS.TOAST.DESC_REQUIRED);
      return;
    }

    // Tự động sinh tiêu đề: [Tên Nhà Hàng] - [Loại] [Mốc ưu đãi]
    const typePrefix = promoType === 'DISCOUNT' ? 'Giảm giá ' : promoType === 'GIFT' ? 'Tặng kèm ' : '';
    const autoTitle = `${user?.name || 'Nhà hàng'} - ${typePrefix}${finalValue}`;
    // Tự động gán ảnh 3D mặc định theo loại
    const autoImage = LABELS.OFFERS.TYPE_IMAGES[promoType];

    const success = await handleCreateOffer({
      title: autoTitle,
      description: promoDesc.trim(),
      promoType,
      discountValue: finalValue,
      image: autoImage,
      validUntil: promoExpiry,
      status: isCustomValue ? 'PENDING' : 'APPROVED',
    });

    if (success) {
      setIsCreateModalOpen(false);
      // Reset form
      setPromoType('DISCOUNT');
      setPromoExpiry('');
      setPromoDesc('');
      setIsCustomValue(false);
      setCustomValue('');
    }
  };

  const getPromoBadgeColor = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'bg-rose-500 text-white';
      case 'COMBO': return 'bg-amber-500 text-white';
      case 'GIFT': return 'bg-emerald-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPromoLabel = (type: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER') => {
    return LABELS.OFFERS.PROMO_TYPES[type] || LABELS.OFFERS.PROMO_TYPES.OTHER;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24 fade-in">
      {/* Tab Selection Header */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-fit shadow-sm">
          <button
            onClick={() => setActiveSection('PROMOTIONS')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === 'PROMOTIONS'
                ? 'bg-white dark:bg-slate-950 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
            }`}
          >
            {LABELS.OFFERS.TABS.PROMOTIONS}
          </button>
          <button
            onClick={() => setActiveSection('VOUCHERS')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === 'VOUCHERS'
                ? 'bg-white dark:bg-slate-950 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
            }`}
          >
            {LABELS.OFFERS.TABS.VOUCHER_MALL}
          </button>
        </div>
      </div>

      {activeSection === 'VOUCHERS' ? (
        <div className="space-y-8">
          {user && (
            <div className="max-w-sm mx-auto p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10 rounded-3xl border border-amber-500/20 text-center relative overflow-hidden shadow-sm">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{LABELS.LOYALTY.POINTS_BALANCE}</p>
              <p className="text-3xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1.5 animate-pulse">
                <span>⭐</span>
                <span>{(user.points || 0).toLocaleString()}</span>
              </p>
            </div>
          )}

          {loadingVouchers ? (
            <div className="text-center py-12 text-gray-400 font-bold">
              {LABELS.COMMON.LOADING}
            </div>
          ) : groupedVouchers.length === 0 ? (
            <div className="card-container !p-16 text-center border-2 border-dashed !border-gray-100 dark:!border-slate-900 max-w-lg mx-auto">
              <Tag className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-500 mb-1">{LABELS.OFFERS.EMPTY_TITLE}</h3>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                {LABELS.OFFERS.EMPTY_DESC}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedVouchers.map((group) => {
                const groupKey = group.id ? String(group.id) : 'system';
                const isExpanded = !!expandedGroups[groupKey];
                
                return (
                  <div
                    key={groupKey}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between p-5 text-left font-black text-gray-800 dark:text-white hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all outline-none cursor-pointer border-none"
                    >
                      <div className="flex items-center gap-3">
                        {group.id === null ? (
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">{group.name}</h4>
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                            {group.list.length} ưu đãi đổi điểm
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="text-gray-400" size={16} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={16} />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-6 pt-2 border-t border-gray-50 dark:border-slate-800/50 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {group.list.map((voucher) => {
                            const userPoints = user?.points || 0;
                            const canAfford = userPoints >= voucher.pointsCost;
                            return (
                              <div
                                key={voucher.id}
                                className={`card-premium p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                                  canAfford
                                    ? 'hover:border-primary/40 hover:-translate-y-1'
                                    : 'opacity-75'
                                } bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl`}
                              >
                                {/* Voucher Left Design Cutout */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full border-y border-r border-gray-200 dark:border-slate-800" />
                                {/* Voucher Right Design Cutout */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full border-y border-l border-gray-200 dark:border-slate-800" />

                                <div className="pl-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-h2 !text-2xl text-primary font-black">{voucher.discountValue}</span>
                                    <span className="text-mini font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md">
                                      {LABELS.LOYALTY.REQUIRED_POINTS(voucher.pointsCost)}
                                    </span>
                                  </div>

                                  <h4 className="text-body font-bold text-gray-800 dark:text-white mt-3">{voucher.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{voucher.description}</p>

                                  <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-800 text-mini text-gray-400 font-bold">
                                    <span>{LABELS.LOYALTY.VOUCHER_MIN_SPEND_PREFIX}{voucher.minSpend}</span>
                                    <span>{LABELS.LOYALTY.VOUCHER_EXPIRY_PREFIX}{voucher.expiryDays}{LABELS.LOYALTY.VOUCHER_EXPIRY_SUFFIX}</span>
                                  </div>
                                </div>

                                <div className="mt-6 pl-2">
                                  <Button
                                    variant={canAfford ? 'primary' : 'secondary'}
                                    disabled={!canAfford || !user}
                                    onClick={() => handleRedeem(voucher)}
                                    className="w-full text-xs font-bold"
                                  >
                                    {!user ? (
                                      LABELS.AUTH.LOGIN_REQUIRED
                                    ) : canAfford ? (
                                      <span className="flex items-center justify-center gap-1.5">
                                        <Sparkles size={14} /> {LABELS.LOYALTY.REDEEM}
                                      </span>
                                    ) : (
                                      LABELS.LOYALTY.REDEEM_ERROR.split('.')[0]
                                    )}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Filter Tabs (col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card-premium p-4 space-y-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm">
              <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider px-3 mb-2">
                {LABELS.OFFERS.FILTER_TITLE}
              </span>
              {[
                { id: 'ALL', label: LABELS.OFFERS.FILTER.ALL, icon: Tag },
                { id: 'DISCOUNT', label: LABELS.OFFERS.FILTER.DISCOUNT, icon: Percent },
                { id: 'COMBO', label: LABELS.OFFERS.FILTER.COMBO, icon: Flame },
                { id: 'GIFT', label: LABELS.OFFERS.FILTER.GIFT, icon: Gift },
              ].map((tab) => {
                const isActive = filterType === tab.id;
                const Icon = tab.icon;

                return (
                  <Button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    variant="none"
                    size="none"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Search, Sort and Centered Offers Grid (col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-900 pb-4">
              <span className="text-xs font-bold text-gray-400">
                {LABELS.OFFERS.SHOWING_COUNT(filteredPromotions.length)}
              </span>
              
              {user?.role === UserRole.RESTAURANT && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                  size="none"
                  className="px-4 py-2 flex items-center gap-1.5 text-xs font-bold rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Plus size={14} />
                  {LABELS.OFFERS.CREATE_BTN}
                </Button>
              )}
            </div>

            {/* Grid List */}
            {filteredPromotions.length === 0 ? (
              <div className="card-container !p-16 text-center border-2 border-dashed !border-gray-100 dark:!border-slate-900 max-w-lg mx-auto">
                <Tag className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-500 mb-1">{LABELS.OFFERS.EMPTY_TITLE}</h3>
                <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                  {LABELS.OFFERS.EMPTY_DESC}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredPromotions.map((offer) => (
                  <article key={offer.id} className="card-premium overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300">
                    {/* Image Container */}
                    <div className="relative h-48 w-full bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800/80 overflow-hidden shrink-0 flex items-center justify-center p-4">
                      <SafeImage
                        src={offer.image}
                        alt={offer.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                      />
                      
                      {/* Promo Badge */}
                      <span className={`absolute top-4 left-4 text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-md ${getPromoBadgeColor(offer.promoType)}`}>
                        {getPromoLabel(offer.promoType)}
                      </span>

                      {/* Delete button (Trash2) */}
                      {(user?.role === UserRole.ADMIN || (user?.role === UserRole.RESTAURANT && offer.restaurantId === user?.id)) && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOffer(offer.id);
                          }}
                          className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-500 hover:text-white dark:bg-slate-950/90 text-rose-500 rounded-xl transition-all shadow-md backdrop-blur-sm border border-rose-500/10 cursor-pointer"
                          title={LABELS.OFFERS.DELETE_BTN}
                          aria-label={LABELS.OFFERS.DELETE_BTN}
                          variant="none"
                          size="none"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}

                      {/* Discount Value tag */}
                      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm text-primary text-xs font-black px-3 py-1.5 rounded-xl border border-primary/20 shadow-md flex items-center gap-1">
                        <Percent size={14} />
                        {offer.discountValue}
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                          <Store size={14} className="text-primary" />
                          <span>{offer.restaurantName}</span>
                        </div>
                        
                        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {offer.title}
                        </h3>
                        
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                          {offer.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-900 text-xs font-bold text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{LABELS.OFFERS.VALID_UNTIL(offer.validUntil)}</span>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            if (offer.restaurantId) {
                              router.push(`/restaurant/${offer.restaurantId}`);
                            } else {
                              toast.info(LABELS.OFFERS.CONTACT_TOAST(offer.restaurantName));
                            }
                          }}
                          className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 font-bold"
                          variant="none"
                          size="none"
                        >
                          {LABELS.OFFERS.VIEW_STORE}
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Balanced Mascot Card (col-span-3) */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            <div className="card-premium p-6 text-center space-y-4 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border border-amber-500/10 rounded-3xl">
              <div className="w-24 h-24 mx-auto relative shrink-0 select-none pointer-events-none">
                <img
                  src="/chibi%20linh%20v%E1%BA%ADt/th%E1%BA%A3%20tim.png"
                  alt="Mascot"
                  className="w-full h-full object-contain filter drop-shadow-md animate-bounce"
                  style={{ animationDuration: '3s' }}
                />
              </div>
              <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">{LABELS.OFFERS.RIGHT_CARD_TITLE}</h4>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                {LABELS.OFFERS.RIGHT_CARD_DESC}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Create Promotion Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">
                {LABELS.OFFERS.CREATE_MODAL_TITLE}
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-semibold">
                {LABELS.OFFERS.FORM.MODAL_SUBTITLE(user?.name)}
              </p>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {LABELS.OFFERS.FORM.TYPE_LABEL}
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                  >
                    <option value="DISCOUNT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.DISCOUNT}</option>
                    <option value="COMBO">{LABELS.OFFERS.FORM.TYPE_OPTIONS.COMBO}</option>
                    <option value="GIFT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.GIFT}</option>
                    <option value="OTHER">{LABELS.OFFERS.FORM.TYPE_OPTIONS.OTHER}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {LABELS.OFFERS.FORM.VALUE_LABEL}
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                    value={isCustomValue ? 'CUSTOM' : promoValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CUSTOM') {
                        setIsCustomValue(true);
                      } else {
                        setIsCustomValue(false);
                        setPromoValue(val);
                      }
                    }}
                  >
                    {LABELS.VOUCHER_MANAGER.FORM_OPTIONS.DISCOUNT_VALUES[promoType].map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                    <option value="CUSTOM">{LABELS.OFFERS.FORM.CUSTOM_OPTION}</option>
                  </select>
                </div>
              </div>

              {isCustomValue && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {LABELS.OFFERS.FORM.CUSTOM_LABEL}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all"
                    placeholder={LABELS.OFFERS.FORM.CUSTOM_PLACEHOLDER}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                    {LABELS.OFFERS.FORM.CUSTOM_PENDING_WARN}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {LABELS.OFFERS.FORM.EXPIRY_LABEL}
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                  value={promoExpiry}
                  onChange={(e) => setPromoExpiry(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {LABELS.OFFERS.FORM.DESC_LABEL}
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white font-semibold focus:outline-none focus:border-primary/50 transition-all resize-none"
                  placeholder={LABELS.OFFERS.FORM.DESC_PLACEHOLDER}
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="font-bold border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer"
                >
                  {LABELS.OFFERS.FORM.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="font-bold rounded-2xl cursor-pointer"
                >
                  {LABELS.OFFERS.FORM.SUBMIT}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
