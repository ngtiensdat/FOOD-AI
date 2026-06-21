'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Calendar, Store, Gift, Flame, Percent, Sparkles, X, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { toast } from '@/store/useToastStore';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';
import { offerService } from '@/services/offer.service';
import { useAuth } from '@/hooks/useAuth';
import { User, UserRole } from '@/types/user';
import { ImageUploader } from '@/components/base/ImageUploader';
import { FoodSelectAutocomplete, LinkableFood } from '@/components/base/FoodSelectAutocomplete';
import { restaurantService } from '@/services/restaurant.service';

interface OfferData {
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

interface OffersSectionProps {
  user: Partial<User> | null;
  setActiveTab: (tab: string) => void;
}

export const OffersSection = ({ user, setActiveTab }: OffersSectionProps) => {
  const [promotions, setPromotions] = useState<OfferData[]>([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [promoType, setPromoType] = useState<'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER'>('DISCOUNT');
  const [validUntil, setValidUntil] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foods, setFoods] = useState<LinkableFood[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    // Initialize selected template from LABELS once they are available on client
    if (LABELS.OFFERS.DEFAULT_TEMPLATES?.length > 0) {
      setSelectedTemplate(prev => prev || LABELS.OFFERS.DEFAULT_TEMPLATES[0].url);
    }
  }, []);

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

  const { isRestaurant } = useAuth();
  const isMerchant = isRestaurant;

  // Load menu foods when merchant opens modal
  useEffect(() => {
    if (isMerchant && user?.id && isOpenModal) {
      restaurantService.getPublicRestaurantFoods(user.id, undefined, 1, 100)
        .then(res => setFoods(res.items || []))
        .catch(console.error);
    }
  }, [isMerchant, user?.id, isOpenModal]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(LABELS.OFFERS.TOAST.TITLE_REQUIRED);
      return;
    }
    if (!discountValue.trim()) {
      toast.error(LABELS.OFFERS.TOAST.VALUE_REQUIRED);
      return;
    }
    if (!validUntil) {
      toast.error(LABELS.OFFERS.TOAST.EXPIRY_REQUIRED);
      return;
    }
    if (!description.trim()) {
      toast.error(LABELS.OFFERS.TOAST.DESC_REQUIRED);
      return;
    }

    const isEn = typeof window !== 'undefined' && localStorage.getItem('lang') === 'en';
    const formattedDate = new Date(validUntil).toLocaleDateString(isEn ? 'en-US' : 'vi-VN');

    try {
      const created = await offerService.createOffer({
        title: title.trim(),
        description: description.trim(),
        promoType,
        discountValue: discountValue.trim(),
        restaurantName: user?.name || LABELS.OFFERS.FORM.MERCHANT_FALLBACK,
        restaurantId: user?.id,
        image: customImage || selectedTemplate || LABELS.OFFERS.DEFAULT_TEMPLATES[0].url,
        validUntil: formattedDate,
      });

      setPromotions(prev => [created, ...prev]);
      toast.success(LABELS.OFFERS.TOAST.CREATE_SUCCESS);
      
      // Reset form
      setTitle('');
      setDiscountValue('');
      setPromoType('DISCOUNT');
      setValidUntil('');
      setDescription('');
      setSelectedTemplate(LABELS.OFFERS.DEFAULT_TEMPLATES[0].url);
      setCustomImage('');
      setSelectedFoodId('');
      setIsOpenModal(false);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.OFFERS.TOAST.CREATE_ERROR);
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!window.confirm(LABELS.OFFERS.TOAST.DELETE_CONFIRM)) return;
    try {
      await offerService.deleteOffer(offerId);
      setPromotions(prev => prev.filter(p => p.id !== offerId));
      toast.success(LABELS.OFFERS.TOAST.DELETE_SUCCESS);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { message?: string };
      toast.error(errorResponse.message || LABELS.OFFERS.TOAST.DELETE_ERROR);
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

  const filteredPromotions = filterType === 'ALL' 
    ? promotions 
    : promotions.filter(p => p.promoType === filterType);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-24 fade-in">
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 to-rose-600 text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="animate-spin" />
            {LABELS.OFFERS.BANNER_BADGE}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight whitespace-pre-line">
            {LABELS.OFFERS.BANNER_TITLE}
          </h1>
          <p className="text-white/80 text-sm font-bold leading-relaxed">
            {LABELS.OFFERS.BANNER_DESC}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-3 shrink-0">
          {isMerchant ? (
            <Button
              variant="outline"
              onClick={() => setIsOpenModal(true)}
              className="!bg-white !text-orange-600 hover:scale-105 active:scale-95 transition-all !py-4 !px-8 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <Plus size={18} />
              {LABELS.OFFERS.CREATE_BTN}
            </Button>
          ) : (
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
              <span className="text-xs font-black block mb-1">{LABELS.OFFERS.MERCHANT_ONLY_TITLE}</span>
              <p className="text-[11px] text-white/80 font-bold max-w-[180px]">
                {LABELS.OFFERS.MERCHANT_ONLY_DESC}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-900 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: LABELS.OFFERS.FILTER.ALL },
            { id: 'DISCOUNT', label: LABELS.OFFERS.FILTER.DISCOUNT },
            { id: 'COMBO', label: LABELS.OFFERS.FILTER.COMBO },
            { id: 'GIFT', label: LABELS.OFFERS.FILTER.GIFT },
          ].map(tab => (
            <Button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:bg-gray-100'
              }`}
              variant="none"
              size="none"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        
        <span className="text-xs font-bold text-gray-400">
          {LABELS.OFFERS.SHOWING_COUNT(filteredPromotions.length)}
        </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPromotions.map((offer) => (
            <article key={offer.id} className="card-premium overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-300">
              {/* Image Container */}
              <div className="relative h-48 w-full bg-gray-100 overflow-hidden shrink-0">
                <SafeImage
                  src={offer.image}
                  alt={offer.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                    onClick={() => toast.info(LABELS.OFFERS.CONTACT_TOAST(offer.restaurantName))}
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

      {/* Create Offer Form Modal */}
      {isOpenModal && isMerchant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          {/* Form Container */}
          <div 
            className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-900 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-900 pb-3">
              <h3 className="font-black text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <Gift className="text-primary" size={22} />
                {LABELS.OFFERS.CREATE_MODAL_TITLE}
              </h3>
              <Button 
                onClick={() => setIsOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer border-none bg-transparent"
                variant="none"
                size="none"
              >
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs font-bold text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-gray-400">{LABELS.OFFERS.FORM.TITLE_LABEL}</label>
                  <Input
                    placeholder={LABELS.OFFERS.FORM.TITLE_PLACEHOLDER}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Promo Type */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400">{LABELS.OFFERS.FORM.TYPE_LABEL}</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER')}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-bold"
                  >
                    <option value="DISCOUNT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.DISCOUNT}</option>
                    <option value="COMBO">{LABELS.OFFERS.FORM.TYPE_OPTIONS.COMBO}</option>
                    <option value="GIFT">{LABELS.OFFERS.FORM.TYPE_OPTIONS.GIFT}</option>
                    <option value="OTHER">{LABELS.OFFERS.FORM.TYPE_OPTIONS.OTHER}</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400">{LABELS.OFFERS.FORM.VALUE_LABEL}</label>
                  <Input
                    placeholder={LABELS.OFFERS.FORM.VALUE_PLACEHOLDER}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>

                {/* Expiry date */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400">{LABELS.OFFERS.FORM.EXPIRY_LABEL}</label>
                  <Input
                    variant="none"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil((e.target as HTMLInputElement).value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-bold"
                  />
                </div>

                {/* Restaurant Name (Pre-filled) */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400">{LABELS.OFFERS.FORM.MERCHANT_LABEL}</label>
                  <div className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-900 p-3 rounded-xl text-gray-500 font-extrabold flex items-center gap-1.5">
                    <Store size={14} />
                    {user?.name || LABELS.OFFERS.FORM.MERCHANT_FALLBACK}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-gray-400">{LABELS.OFFERS.FORM.DESC_LABEL}</label>
                <Input
                  isTextArea
                  variant="none"
                  rows={3}
                  placeholder={LABELS.OFFERS.FORM.DESC_PLACEHOLDER}
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Image Selection Section */}
              <div className="space-y-4">
                <label className="block text-gray-400">{LABELS.OFFERS.FORM.IMAGE_LABEL}</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                  {/* Option 1: Upload Manual Image */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</div>
                      Tải ảnh lên thủ công
                    </span>
                    <ImageUploader 
                      uploadType="post-image" 
                      currentUrl={customImage && customImage !== selectedTemplate ? customImage : undefined} 
                      onUploaded={(url) => { 
                        setCustomImage(url); 
                        setSelectedFoodId(''); 
                        setSelectedTemplate(''); 
                      }} 
                    />
                  </div>

                  {/* Option 2: Select Food */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">2</div>
                      Hoặc chọn Món ăn
                    </span>
                    <FoodSelectAutocomplete
                      foods={foods}
                      selectedFoodId={selectedFoodId}
                      onSelectFood={(id, name, image) => {
                        setSelectedFoodId(id);
                        if (image) setCustomImage(image);
                        setSelectedTemplate('');
                      }}
                      disabled={foods.length === 0}
                      placeholder={foods.length === 0 ? "Chưa có món ăn nào trong thực đơn" : "-- Tìm kiếm món ăn --"}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Ảnh của món ăn sẽ được tự động làm ảnh bìa cho Ưu đãi nếu món đó có ảnh.</p>
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 py-3 rounded-xl font-bold"
                  onClick={() => setIsOpenModal(false)}
                >
                  {LABELS.OFFERS.FORM.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3 rounded-xl gap-1.5 shadow-lg shadow-primary/10 font-bold"
                >
                  <Plus size={16} />
                  <span>{LABELS.OFFERS.FORM.SUBMIT}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
