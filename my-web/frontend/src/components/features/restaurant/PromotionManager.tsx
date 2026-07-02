'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Tag, Percent, Gift, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { toast } from '@/store/useToastStore';
import { offerService } from '@/services/offer.service';
import { LABELS } from '@/constants/labels';
import { SafeImage } from '@/components/base/SafeImage';

interface PromotionData {
  id: number;
  title: string;
  description: string;
  promoType: 'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER';
  discountValue: string;
  restaurantName: string;
  restaurantId?: number;
  image: string;
  validUntil: string;
  promoCode?: string;
  terms?: string;
  quantity?: number;
  usedCount?: number;
}

interface PromotionManagerProps {
  restaurantId: number;
  restaurantName: string;
}

export const PromotionManager = ({ restaurantId, restaurantName }: PromotionManagerProps) => {
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal states
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionData | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promoType, setPromoType] = useState<'DISCOUNT' | 'COMBO' | 'GIFT' | 'OTHER'>('DISCOUNT');
  const [discountValue, setDiscountValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [terms, setTerms] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [image, setImage] = useState('');
  const t = LABELS.PROMOTION_MANAGER;

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await offerService.getOffers(restaurantId);
      setPromotions(data || []);
    } catch (err) {
      console.error('Error loading promotions:', err);
      toast.error(t.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [restaurantId]);

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setTitle('');
    setDescription('');
    setPromoType('DISCOUNT');
    setDiscountValue('');
    setValidUntil('');
    setPromoCode('');
    setTerms('');
    setQuantity(100);
    setImage('');
    setIsOpenModal(true);
  };

  const handleOpenEdit = (promo: PromotionData) => {
    setEditingPromo(promo);
    setTitle(promo.title);
    setDescription(promo.description);
    setPromoType(promo.promoType);
    setDiscountValue(promo.discountValue);
    setValidUntil(promo.validUntil);
    setPromoCode(promo.promoCode || '');
    setTerms(promo.terms || '');
    setQuantity(promo.quantity || 100);
    setImage(promo.image);
    setIsOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !discountValue.trim() || !validUntil.trim()) {
      toast.error(t.REQUIRED_FIELDS);
      return;
    }

    const genericImages = {
      DISCOUNT: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
      COMBO: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80',
      GIFT: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      OTHER: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    };

    const finalImage = image.trim() || genericImages[promoType];

    const payload = {
      title,
      description,
      promoType,
      discountValue,
      restaurantName,
      restaurantId,
      image: finalImage,
      validUntil,
      promoCode: promoCode.trim() || undefined,
      terms: terms.trim() || undefined,
      quantity,
    };

    try {
      if (editingPromo) {
        await offerService.updateOffer(editingPromo.id, payload);
        toast.success(t.SAVE_SUCCESS_EDIT);
      } else {
        await offerService.createOffer(payload);
        toast.success(t.SAVE_SUCCESS_ADD);
      }
      setIsOpenModal(false);
      loadPromotions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t.SAVE_ERROR);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.CONFIRM_DELETE)) return;
    try {
      await offerService.deleteOffer(id);
      toast.success(t.DELETE_SUCCESS);
      loadPromotions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t.DELETE_ERROR);
    }
  };
  const getPromoBadgeColor = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'COMBO': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'GIFT': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  };

  const filteredPromotions = useMemo(() => {
    return promotions.filter(promo => {
      const matchSearch = promo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          promo.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || promo.promoType === filterType;
      return matchSearch && matchType;
    });
  }, [promotions, searchQuery, filterType]);


  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <h3 className="text-body font-black text-gray-800 dark:text-white">{t.TITLE}</h3>
          <p className="text-mini text-gray-400 font-bold mt-1">{t.SUBTITLE}</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black uppercase bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>{t.BTN_ADD}</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            variant="none"
            type="text"
            placeholder={t.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-10 text-xs font-bold focus:border-primary dark:text-slate-200 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: t.FILTER_ALL },
            { id: 'DISCOUNT', label: t.FILTER_DISCOUNT },
            { id: 'COMBO', label: t.FILTER_COMBO },
            { id: 'GIFT', label: t.FILTER_GIFT },
            { id: 'OTHER', label: t.FILTER_OTHER },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === type.id
                  ? 'bg-primary text-white shadow-md shadow-primary/10'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:border-primary'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="card-container p-12 text-center text-xs text-gray-400 font-bold bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl">
          {t.LOADING}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="card-container p-16 text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl max-w-md mx-auto">
          <Tag className="mx-auto text-gray-200 mb-4" size={48} />
          <h4 className="font-extrabold text-sm text-gray-500 mb-1">{t.EMPTY_TITLE}</h4>
          <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
            {t.EMPTY_DESC}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => (
            <article
              key={promo.id}
              className="card-premium overflow-hidden flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl"
            >
              <div className="relative h-44 w-full bg-gray-100 overflow-hidden shrink-0">
                <SafeImage
                  src={promo.image}
                  alt={promo.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Promo Badge */}
                <span className={`absolute top-4 left-4 text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-sm capitalize ${getPromoBadgeColor(promo.promoType)}`}>
                  {promo.promoType}
                </span>

                {/* Value Badge */}
                <span className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-950/90 text-primary text-xs font-black px-3 py-1 rounded-xl shadow-md border border-primary/20">
                  {promo.discountValue}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {promo.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {promo.description}
                  </p>
                </div>

                <div className="flex flex-col gap-1 pt-3 border-t border-dashed border-gray-100 dark:border-slate-800 text-mini text-gray-400 font-bold">
                  {promo.promoCode && <span>{t.APPLY_CODE}<span className="text-primary">{promo.promoCode}</span></span>}
                  <span>{t.VALID_UNTIL}{promo.validUntil}</span>
                  {promo.quantity !== undefined && <span>{t.QUANTITY}{promo.quantity}</span>}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleOpenEdit(promo)}
                    variant="outline"
                    className="flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border-gray-200 dark:border-slate-850 hover:bg-gray-50 text-gray-700 dark:text-slate-300"
                  >
                    <Edit2 size={12} /> {t.BTN_EDIT}
                  </Button>
                  <Button
                    onClick={() => handleDelete(promo.id)}
                    variant="none"
                    className="py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Save Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            onClick={() => setIsOpenModal(false)}
            className="absolute inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-2xl z-10 flex flex-col gap-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-black text-gray-800 dark:text-white">
                {editingPromo ? t.MODAL_TITLE_EDIT : t.MODAL_TITLE_ADD}
              </h3>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 outline-none text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_TITLE}</label>
                <Input
                  variant="none"
                  type="text"
                  placeholder={t.PLACEHOLDER_TITLE}
                  value={title}
                  onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_DESC}</label>
                <textarea
                  placeholder={t.PLACEHOLDER_DESC}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_TYPE}</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                  >
                    <option value="DISCOUNT">{t.FILTER_DISCOUNT}</option>
                    <option value="COMBO">{t.FILTER_COMBO}</option>
                    <option value="GIFT">{t.FILTER_GIFT}</option>
                    <option value="OTHER">{t.FILTER_OTHER}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_VALUE}</label>
                  <Input
                    variant="none"
                    type="text"
                    placeholder={t.PLACEHOLDER_VALUE}
                    value={discountValue}
                    onChange={(e) => setDiscountValue((e.target as HTMLInputElement).value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_VALID_UNTIL}</label>
                  <Input
                    variant="none"
                    type="text"
                    placeholder={t.PLACEHOLDER_VALID_UNTIL}
                    value={validUntil}
                    onChange={(e) => setValidUntil((e.target as HTMLInputElement).value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_CODE}</label>
                  <Input
                    variant="none"
                    type="text"
                    placeholder={t.PLACEHOLDER_CODE}
                    value={promoCode}
                    onChange={(e) => setPromoCode((e.target as HTMLInputElement).value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_QUANTITY}</label>
                  <Input
                    variant="none"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number((e.target as HTMLInputElement).value))}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_IMAGE}</label>
                  <Input
                    variant="none"
                    type="text"
                    placeholder={t.PLACEHOLDER_IMAGE}
                    value={image}
                    onChange={(e) => setImage((e.target as HTMLInputElement).value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">{t.LABEL_TERMS}</label>
                <textarea
                  placeholder={t.PLACEHOLDER_TERMS}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full h-16 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:text-slate-200 font-bold resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button
                  onClick={() => setIsOpenModal(false)}
                  type="button"
                  variant="outline"
                  className="flex-1 py-3 text-xs font-bold rounded-xl text-gray-500 border-gray-200 dark:border-slate-800"
                >
                  {t.BTN_CANCEL}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold rounded-xl bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {t.BTN_SAVE}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
