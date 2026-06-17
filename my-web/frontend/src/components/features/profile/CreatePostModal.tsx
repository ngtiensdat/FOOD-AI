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
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { restaurantService } from '@/services/restaurant.service';
import { foodService } from '@/services/food.service';
import { socialService } from '@/services/social.service';
import { PostData } from './PostCard';
import { useAuth } from '@/hooks/useAuth';

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
  const [imageUrl, setImageUrl] = useState('');

  interface LinkableRestaurant {
    id: number;
    name: string;
  }
  interface LinkableFood {
    id: number;
    name: string;
  }

  const [restaurants, setRestaurants] = useState<LinkableRestaurant[]>([]);
  const [foods, setFoods] = useState<LinkableFood[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');

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
          const [restRes, foodRes] = await Promise.all([
            restaurantService.getPublicRestaurants({ pageSize: LIMITS.POST_LINKING_RESTAURANTS_PAGE_SIZE }),
            foodService.getAllFoods()
          ]);
          
          setRestaurants(restRes?.data || []);
          setFoods(Array.isArray(foodRes) ? foodRes : []);
        } catch (err) {
          console.error('Error loading linking data for posts:', err);
        }
      };
      loadLinkingData();
    }
  }, [isOpen, userRole]);


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

    socialService.createPost({
      title: title.trim(),
      content: content.trim(),
      postType,
      rating: postType === 'REVIEW' ? rating : undefined,
      image: imageUrl.trim() || undefined,
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
        setImageUrl('');
        setSelectedRestaurantId('');
        setSelectedFoodId('');
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

          {/* Image URL Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} />
              {LABELS.SOCIAL.IMAGE_LABEL}
            </label>
            <Input
              type="text"
              className="form-input w-full"
              placeholder={LABELS.SOCIAL.IMAGE_URL_PLACEHOLDER}
              value={imageUrl}
              onChange={(e) => setImageUrl((e.target as HTMLInputElement).value)}
              disabled={loading}
              variant="none"
            />
          </div>

          {/* Linking Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant Link */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store size={14} />
                {LABELS.SOCIAL.SELECT_RESTAURANT}
              </label>
              <select
                className="form-input bg-none"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                disabled={loading}
              >
                <option value="">{LABELS.SOCIAL.NO_LINK_OPTION}</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Link */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Utensils size={14} />
                {LABELS.SOCIAL.SELECT_FOOD}
              </label>
              <select
                className="form-input bg-none"
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                disabled={loading}
              >
                <option value="">{LABELS.SOCIAL.NO_LINK_OPTION}</option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
