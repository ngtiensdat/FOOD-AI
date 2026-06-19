/**
 * Mục đích file này để làm gì: Modal tạo bài đăng mới trên Mạng xã hội.
 * Các file khác hay file này có ý nghĩa như nào: Thu thập thông tin bài viết theo đúng cấu trúc model Post trong Prisma (title, content, image, rating, postType, restaurantId, foodId).
 * Các chức năng đặc biệt: Tự động tải danh sách nhà hàng và món ăn từ API phục vụ việc liên kết bài đăng, hiển thị các trường đánh giá sao động tùy theo loại bài viết.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Star, Image as ImageIcon, Store, Utensils } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Alert } from '@/components/base/Alert';
import { PostImageUploader } from '@/components/base/PostImageUploader';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { restaurantService } from '@/services/restaurant.service';
import { foodService } from '@/services/food.service';
import { socialService } from '@/services/social.service';
import { authService } from '@/services/auth.service';
import { PostData } from './PostCard';
import { useAuth } from '@/hooks/useAuth';
import { FoodSelectAutocomplete } from '@/components/base/FoodSelectAutocomplete';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (post: PostData) => void;
}

export const CreatePostModal = ({ isOpen, onClose, onCreated }: CreatePostModalProps) => {
  // Thêm 'PROMOTION' và 'ANNOUNCEMENT' vào danh sách kiểu dữ liệu
  const [postType, setPostType] = useState<'NORMAL' | 'REVIEW' | 'PROMOTION' | 'ANNOUNCEMENT'>('NORMAL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);

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
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');

  // Dropdown UI states
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, isAdmin, isRestaurant } = useAuth();
  const userRole = isAdmin ? 'ADMIN' : isRestaurant ? 'MERCHANT' : 'USER';

  // Load restaurants and foods for linking
  useEffect(() => {
    if (isOpen) {
      if (isAdmin) setPostType('ANNOUNCEMENT');
      else if (isRestaurant) setPostType('NORMAL');
      else setPostType('NORMAL');

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
          console.error('Error loading linking data for posts:', err);
        }
      };
      loadLinkingData();
    }
  }, [isOpen, userRole, user?.id]);

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


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(LABELS.SOCIAL.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      setError(LABELS.SOCIAL.CONTENT_REQUIRED);
      return;
    }

    setLoading(true);

    setLoading(true);

    let finalImages = images;
    if (images.length === 0) {
      let defaultImg = undefined;
      if (selectedFoodId) {
        const f = foods.find(x => x.id.toString() === selectedFoodId);
        if (f?.image) defaultImg = f.image;
      }
      if (!defaultImg && selectedRestaurantId) {
        const r = restaurants.find(x => x.id.toString() === selectedRestaurantId);
        if (r?.profile?.coverImage) defaultImg = r.profile.coverImage;
      }
      if (defaultImg) {
        finalImages = [defaultImg];
      }
    }

    socialService.createPost({
      title: title.trim(),
      content: content.trim(),
      postType,
      rating: postType === 'REVIEW' ? rating : undefined,
      image: finalImages[0] || undefined,
      images: finalImages.length > 0 ? finalImages : undefined,
      restaurantId: selectedRestaurantId ? Number(selectedRestaurantId) : undefined,
      foodId: selectedFoodId ? Number(selectedFoodId) : undefined,
    })
      .then((createdPost) => {
        onCreated(createdPost);
        setLoading(false);
        onClose();
        // Reset form
        setTitle('');
        setContent('');
        setPostType('NORMAL');
        setRating(5);
        setImages([]);
        setSelectedRestaurantId('');
        setSelectedFoodId('');
        setRestaurantSearch('');
      })
      .catch((err) => {
        console.error(err);
        setError('Lỗi khi đăng bài viết. Vui lòng thử lại.');
        setLoading(false);
      });
  };

  return (
    <div className="modal-wrapper">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-card max-w-2xl relative z-10 fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-h3 text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} />
            {LABELS.SOCIAL.CREATE_POST}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error">
              {error}
            </Alert>
          )}

          {/* Post Type Selector */}
          {/* Post Type Selector phân theo mã Role */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {LABELS.SOCIAL.SELECT_POST_TYPE}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'NORMAL' as const, label: LABELS.SOCIAL.POST_TYPE_NORMAL, allowedRoles: ['USER', 'MERCHANT'] },
                { type: 'REVIEW' as const, label: 'Bài viết đánh giá', allowedRoles: ['USER'] },
                { type: 'PROMOTION' as const, label: 'Bài viết quảng cáo', allowedRoles: ['MERCHANT'] },
                { type: 'ANNOUNCEMENT' as const, label: 'Thông báo hệ thống', allowedRoles: ['ADMIN'] }
              ]
                // Bộ lọc: Chỉ giữ lại những nút bấm phù hợp với Role hiện tại của người dùng
                .filter((item) => item.allowedRoles.includes(userRole || 'USER'))
                .map((item) => (
                  <Button
                    key={item.type}
                    type="button"
                    onClick={() => setPostType(item.type)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${postType === item.type
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50'
                      }`}
                    variant="none"
                    size="none"
                  >
                    {item.label}
                  </Button>
                ))}
            </div>
          </div>


          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {LABELS.SOCIAL.TITLE_LABEL}
            </label>
            <Input
              type="text"
              className="form-input w-full"
              placeholder={LABELS.SOCIAL.TITLE_PLACEHOLDER}
              value={title}
              onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
              disabled={loading}
              variant="none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {LABELS.SOCIAL.CONTENT_LABEL}
            </label>
            <Input
              isTextArea
              variant="none"
              className="form-input min-h-[120px] resize-y w-full"
              placeholder={LABELS.SOCIAL.CONTENT_PLACEHOLDER}
              value={content}
              onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
              disabled={loading}
            />
          </div>

          {/* Rating for Review type */}
          {postType === 'REVIEW' && (
            <div className="fade-in">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
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

          {/* Image Uploader */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} />
              Ảnh bài đăng
            </label>
            <PostImageUploader
              images={images}
              onChange={setImages}
              disabled={loading}
            />
          </div>

          {/* Linking Section - Hidden for NORMAL posts */}
          {postType !== 'NORMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restaurant Link */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Store size={14} />
                  {LABELS.SOCIAL.SELECT_RESTAURANT}
                </label>
                <div 
                  className="relative"
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
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedRestaurantId('');
                          setRestaurantSearch('');
                          setShowRestaurantDropdown(false);
                        }}
                      >
                        -- Không liên kết --
                      </button>
                      {restaurants
                        .filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()))
                        .slice(0, 5)
                        .map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedRestaurantId(r.id.toString());
                              setRestaurantSearch(r.name);
                              setShowRestaurantDropdown(false);
                            }}
                          >
                            {r.name}
                          </button>
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils size={14} />
                  {LABELS.SOCIAL.SELECT_FOOD}
                </label>
                <FoodSelectAutocomplete
                  foods={foods}
                  selectedFoodId={selectedFoodId}
                  onSelectFood={(id, name) => setSelectedFoodId(id)}
                  disabled={loading || !selectedRestaurantId}
                  placeholder={!selectedRestaurantId ? "Vui lòng chọn quán trước" : "-- Tìm kiếm món ăn --"}
                />
              </div>
            </div>
          )}

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
            <Button variant="primary" type="submit" loading={loading}>
              <Sparkles size={16} className="mr-2" />
              {LABELS.SOCIAL.SUBMIT_POST}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
