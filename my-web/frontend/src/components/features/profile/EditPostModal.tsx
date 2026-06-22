/**
 * @fileoverview frontend/src/components/features/profile/EditPostModal.tsx
 * @description Modal chỉnh sửa bài đăng đã có. Cho phép thay đổi tiêu đề, nội dung, ảnh, loại bài, điểm đánh giá và liên kết nhà hàng/món ăn.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Star, Store, Utensils, ImageIcon } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { PostImageUploader } from '@/components/base/PostImageUploader';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { socialService } from '@/services/social.service';
import { authService } from '@/services/auth.service';
import { restaurantService } from '@/services/restaurant.service';
import { toast } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { FoodSelectAutocomplete } from '@/components/base/FoodSelectAutocomplete';
import { PostData } from './PostCard';

interface EditPostModalProps {
  post: PostData;
  onClose: () => void;
  /** Callback khi lưu thành công — trả về bài đăng đã cập nhật */
  onUpdated: (updated: Partial<PostData>) => void;
}

export function EditPostModal({ post, onClose, onUpdated }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [images, setImages] = useState<string[]>(post.images || (post.image ? [post.image] : []));
  const [postType, setPostType] = useState<PostData['postType']>(post.postType);
  const [rating, setRating] = useState(post.rating || 5);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(post.restaurant?.id ? post.restaurant.id.toString() : '');
  const [selectedFoodId, setSelectedFoodId] = useState(post.food?.id ? post.food.id.toString() : '');
  const [loading, setLoading] = useState(false);

  interface LinkableRestaurant {
    id: number;
    name: string;
    profile?: { coverImage?: string | null } | null;
  }
  interface LinkableFood {
    id: number;
    name: string;
    image?: string | null;
  }

  const [restaurants, setRestaurants] = useState<LinkableRestaurant[]>([]);
  const [foods, setFoods] = useState<LinkableFood[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState(post.restaurant?.name || '');
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);

  const { user, isAdmin, isRestaurant } = useAuth();
  const userRole = isAdmin ? 'ADMIN' : isRestaurant ? 'MERCHANT' : 'USER';

  // Đóng khi bấm Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Load restaurants for linking
  useEffect(() => {
    const loadLinkingData = async () => {
      try {
        if (isRestaurant) {
          const myRest = await restaurantService.getMyRestaurant();
          if (myRest?.data) setRestaurants([myRest.data]);
        } else if (isAdmin) {
          const restRes = await restaurantService.getPublicRestaurants({ pageSize: LIMITS.POST_LINKING_RESTAURANTS_PAGE_SIZE });
          setRestaurants(restRes?.data || []);
        } else if (user?.id) {
          const followingRes = await authService.getFollowing(user.id);
          setRestaurants(followingRes?.restaurants || []);
        }
      } catch (err) {
        console.error('Error loading linking data in EditPostModal:', err);
      }
    };
    loadLinkingData();
  }, [userRole, user?.id, isRestaurant, isAdmin]);

  // Load foods when restaurant changes
  useEffect(() => {
    if (selectedRestaurantId) {
      restaurantService.getPublicRestaurantFoods(Number(selectedRestaurantId), undefined, 1, 100)
        .then(res => setFoods(res.items || []))
        .catch(err => console.error('Error fetching foods for restaurant:', err));
    } else {
      setFoods([]);
      setSelectedFoodId('');
    }
  }, [selectedRestaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(LABELS.SOCIAL.TOAST.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(LABELS.SOCIAL.TOAST.CONTENT_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      await socialService.updatePost(post.id, {
        title: title.trim(),
        content: content.trim(),
        images,
        postType,
        rating: postType === 'REVIEW' ? rating : null,
        restaurantId: postType !== 'NORMAL' && selectedRestaurantId ? Number(selectedRestaurantId) : null,
        foodId: postType !== 'NORMAL' && selectedFoodId ? Number(selectedFoodId) : null,
      });

      onUpdated({
        title: title.trim(),
        content: content.trim(),
        images,
        postType,
        rating: postType === 'REVIEW' ? rating : null,
        restaurant: postType !== 'NORMAL' && selectedRestaurantId
          ? { id: Number(selectedRestaurantId), name: restaurants.find(r => r.id.toString() === selectedRestaurantId)?.name || restaurantSearch }
          : null,
        food: postType !== 'NORMAL' && selectedFoodId
          ? { id: Number(selectedFoodId), name: foods.find(f => f.id.toString() === selectedFoodId)?.name || '' }
          : null,
      });

      toast.success(LABELS.SOCIAL.TOAST.UPDATE_SUCCESS);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(LABELS.SOCIAL.TOAST.UPDATE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h2 className="font-black text-gray-900 dark:text-white text-base">{LABELS.SOCIAL.EDIT_POST_TITLE}</h2>
          <Button type="button" variant="none" size="none" onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Post type */}
          <div className="flex gap-2 flex-wrap">
            {(['NORMAL', 'REVIEW', 'PROMOTION'] as const).map((t) => (
              <Button
                variant="none" size="none"
                key={t}
                type="button"
                onClick={() => setPostType(t)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  postType === t
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-primary hover:text-primary'
                }`}
              >
                {t === 'NORMAL' && LABELS.SOCIAL.POST_TYPE_NORMAL}
                {t === 'REVIEW' && LABELS.SOCIAL.POST_TYPE_REVIEW}
                {t === 'PROMOTION' && LABELS.SOCIAL.POST_TYPE_PROMOTION}
              </Button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {LABELS.SOCIAL.TITLE_LABEL}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={LABELS.SOCIAL.TITLE_PLACEHOLDER}
              maxLength={200}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {LABELS.SOCIAL.CONTENT_LABEL}
            </label>
            <Input
              isTextArea
              variant="none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={LABELS.SOCIAL.CONTENT_PLACEHOLDER}
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-right text-xs text-gray-400">{content.length}/2000</p>
          </div>

          {/* Rating for Review type */}
          {postType === 'REVIEW' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                {LABELS.SOCIAL.RATING}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={LABELS.SOCIAL.RATING_STAR(star)}
                    variant="none"
                    size="none"
                  >
                    <Star
                      size={28}
                      className={
                        star <= rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 dark:text-slate-700'
                      }
                    />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Linking Section - Hidden for NORMAL posts */}
          {postType !== 'NORMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restaurant Link */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Store size={14} />
                  {LABELS.SOCIAL.SELECT_RESTAURANT}
                </label>
                <div 
                  className="relative mt-1.5"
                  onFocus={() => setShowRestaurantDropdown(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setShowRestaurantDropdown(false);
                      if (!selectedRestaurantId) setRestaurantSearch('');
                    }
                  }}
                >
                  <Input
                    variant="none"
                    className="form-input w-full bg-none cursor-pointer"
                    placeholder="-- Tìm kiếm hoặc chọn quán --"
                    value={restaurantSearch}
                    onChange={(e) => {
                      setRestaurantSearch((e.target as HTMLInputElement).value);
                      setSelectedRestaurantId('');
                      setShowRestaurantDropdown(true);
                    }}
                    disabled={loading}
                  />
                  {showRestaurantDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <Button
                        type="button"
                        variant="none"
                        size="none"
                        className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedRestaurantId('');
                          setRestaurantSearch('');
                          setShowRestaurantDropdown(false);
                        }}
                      >
                        -- Không liên kết --
                      </Button>
                      {restaurants
                        .filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()))
                        .slice(0, 5)
                        .map((r) => (
                          <Button
                            key={r.id}
                            type="button"
                            variant="none"
                            size="none"
                            className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedRestaurantId(r.id.toString());
                              setRestaurantSearch(r.name);
                              setShowRestaurantDropdown(false);
                            }}
                          >
                            {r.name}
                          </Button>
                      ))}
                      {restaurants.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-400 italic">Không tìm thấy quán nào đã theo dõi</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Food Link */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Utensils size={14} />
                  {LABELS.SOCIAL.SELECT_FOOD}
                </label>
                <div className="mt-1.5">
                  <FoodSelectAutocomplete
                    foods={foods}
                    selectedFoodId={selectedFoodId}
                    onSelectFood={(id) => setSelectedFoodId(id)}
                    disabled={loading || !selectedRestaurantId}
                    placeholder={!selectedRestaurantId ? "Vui lòng chọn quán trước" : "-- Tìm kiếm món ăn --"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon size={14} />
              {LABELS.COMMON.IMAGE}
            </label>
            <PostImageUploader images={images} onChange={setImages} disabled={loading} />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {LABELS.COMMON.CANCEL}
          </Button>
          <Button type="submit" variant="primary" loading={loading} onClick={handleSubmit}>
            <Save size={15} className="mr-1.5" />
            {LABELS.COMMON.SAVE}
          </Button>
        </div>
      </div>
    </div>
  );
}
