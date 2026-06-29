'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Shield, User, Store, Sparkles, Settings, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { badgeService } from '@/services/badge.service';
import { UserRole } from '@/types/user';
import { apiClient } from '@/lib/api-client';

export interface BadgeConfig {
  id: string;
  role: UserRole;
  title: string;
  points: number;
  minReviews: number | null;
  minPostLikes: number | null;
  minRatingAvg: number | null;
  minRatingCount: number | null;
  minFollowers: number | null;
}

interface GamificationRules {
  pointsPerLevel: number;
  postReviewPoints: number;
  commentPoints: number;
  likePoints: number;
  deductionMultiplier: number;
}

export const LevelBadgeManagerTab = () => {
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [showBadgeLists, setShowBadgeLists] = useState(false);
  const [role, setRole] = useState<UserRole.CUSTOMER | UserRole.RESTAURANT>(UserRole.CUSTOMER);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');

  // Advanced Badge criteria
  const [minReviews, setMinReviews] = useState('');
  const [minPostLikes, setMinPostLikes] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [minRatingAvg, setMinRatingAvg] = useState('');
  const [minRatingCount, setMinRatingCount] = useState('');

  // Gamification Rules Configuration
  const [pointsPerLevel, setPointsPerLevel] = useState('1000');
  const [postReviewPoints, setPostReviewPoints] = useState('50');
  const [commentPoints, setCommentPoints] = useState('10');
  const [likePoints, setLikePoints] = useState('5');
  const [deductionMultiplier, setDeductionMultiplier] = useState('1.0');

  const [loadingBadges, setLoadingBadges] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);
  const [savingRules, setSavingRules] = useState(false);

  const bmLabels = LABELS.ADMIN.BADGES_MANAGER;

  // Load from backend on mount
  const loadData = async () => {
    setLoadingBadges(true);
    setLoadingRules(true);
    try {
      // Load Badges list
      const badgeData = await badgeService.getBadges();
      setBadges(badgeData || []);
      setLoadingBadges(false);

      // Load Gamification Config
      const rulesData: GamificationRules = await apiClient.get('/admin/gamification-config');
      if (rulesData) {
        setPointsPerLevel(rulesData.pointsPerLevel?.toString() ?? '1000');
        setPostReviewPoints(rulesData.postReviewPoints?.toString() ?? '50');
        setCommentPoints(rulesData.commentPoints?.toString() ?? '10');
        setLikePoints(rulesData.likePoints?.toString() ?? '5');
        setDeductionMultiplier(rulesData.deductionMultiplier?.toString() ?? '1.0');
      }
    } catch (err) {
      console.error(bmLabels.RULES_LOAD_ERROR, err);
      toast.error(bmLabels.RULES_LOAD_ERROR_TOAST);
    } finally {
      setLoadingBadges(false);
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBadge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(bmLabels.TITLE_REQUIRED);
      return;
    }

    const minPoints = parseInt(points);
    if (isNaN(minPoints) || minPoints < 0) {
      toast.error(bmLabels.POINTS_REQUIRED);
      return;
    }

    const reviews = minReviews ? parseInt(minReviews) : null;
    const likes = minPostLikes ? parseInt(minPostLikes) : null;
    const followers = minFollowers ? parseInt(minFollowers) : null;
    const ratingAvgVal = minRatingAvg ? parseFloat(minRatingAvg) : null;
    const ratingCountVal = minRatingCount ? parseInt(minRatingCount) : null;

    try {
      const created = await badgeService.createBadge({
        role,
        title: title.trim(),
        points: minPoints,
        minReviews: reviews,
        minPostLikes: likes,
        minFollowers: followers,
        minRatingAvg: role === UserRole.RESTAURANT ? ratingAvgVal : null,
        minRatingCount: role === UserRole.RESTAURANT ? ratingCountVal : null,
      });

      setBadges(prev => [...prev, created].sort((a, b) => a.points - b.points));
      toast.success(bmLabels.SAVE_SUCCESS);

      // Reset fields
      setTitle('');
      setPoints('');
      setMinReviews('');
      setMinPostLikes('');
      setMinFollowers('');
      setMinRatingAvg('');
      setMinRatingCount('');
    } catch (err: unknown) {
      console.error(err);
      toast.error(bmLabels.CREATE_ERROR);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (window.confirm(bmLabels.DELETE_CONFIRM)) {
      try {
        await badgeService.deleteBadge(id);
        setBadges(prev => prev.filter((b) => b.id !== id));
        toast.success(LABELS.ADMIN.DELETE_SUCCESS);
      } catch (err: unknown) {
        console.error(err);
        toast.error(bmLabels.DELETE_ERROR);
      }
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRules(true);

    try {
      await apiClient.put('/admin/gamification-config', {
        pointsPerLevel: parseInt(pointsPerLevel) || 1000,
        postReviewPoints: parseInt(postReviewPoints) || 0,
        commentPoints: parseInt(commentPoints) || 0,
        likePoints: parseInt(likePoints) || 0,
        deductionMultiplier: parseFloat(deductionMultiplier) || 1.0,
      });

      toast.success(bmLabels.RULES_SAVE_SUCCESS);
    } catch (err) {
      console.error('Lỗi lưu cấu hình điểm:', err);
      toast.error(bmLabels.RULES_SAVE_ERROR);
    } finally {
      setSavingRules(false);
    }
  };
  const customerBadges = badges.filter((b) => b.role === UserRole.CUSTOMER);
  const restaurantBadges = badges.filter((b) => b.role === UserRole.RESTAURANT);

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2 mb-1">
            <Award className="text-primary animate-bounce" size={28} />
            {bmLabels.TITLE}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{bmLabels.DESC}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBadgeLists(!showBadgeLists)}
            className={`border-gray-200 dark:border-slate-800 text-sm font-semibold transition-all cursor-pointer ${
              showBadgeLists ? 'bg-primary text-white hover:bg-primary-light border-primary' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900'
            }`}
          >
            <Award size={16} className="mr-2" />
            {showBadgeLists ? "Ẩn danh sách Danh hiệu" : "Xem danh sách Danh hiệu"}
          </Button>
          <Button
            variant="outline"
            onClick={loadData}
            className="self-start sm:self-auto border-gray-200 dark:border-slate-800 cursor-pointer"
          >
            <RefreshCw size={16} className="mr-2" />
            {bmLabels.REFRESH_BTN}
          </Button>
        </div>
      </div>

      {/* Forms layout - side-by-side using full width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Add Config */}
        <div className="card-premium p-6 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-500/20 shadow-md">
          <h3 className="text-body font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Plus size={20} className="text-primary" />
            {bmLabels.ADD_BADGE_FORM_TITLE}
          </h3>

          <form onSubmit={handleAddBadge} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {bmLabels.ROLE}
              </label>
              <select
                className="form-input bg-none"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole.CUSTOMER | UserRole.RESTAURANT)}
              >
                <option value={UserRole.CUSTOMER}>{LABELS.AUTH.CUSTOMER}</option>
                <option value={UserRole.RESTAURANT}>{LABELS.AUTH.RESTAURANT}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {bmLabels.BADGE_TITLE}
              </label>
              <Input
                variant="none"
                type="text"
                className="form-input"
                placeholder={bmLabels.TITLE_PLACEHOLDER}
                value={title}
                onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.MIN_POINTS_LABEL}
                </label>
                <Input
                  variant="none"
                  type="number"
                  className="form-input"
                  placeholder="1000"
                  value={points}
                  onChange={(e) => setPoints((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.MIN_REVIEWS_LABEL}
                </label>
                <Input
                  variant="none"
                  type="number"
                  className="form-input"
                  placeholder={bmLabels.OPTIONAL_PLACEHOLDER}
                  value={minReviews}
                  onChange={(e) => setMinReviews((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.MIN_LIKES_LABEL}
                </label>
                <Input
                  variant="none"
                  type="number"
                  className="form-input"
                  placeholder={bmLabels.OPTIONAL_PLACEHOLDER}
                  value={minPostLikes}
                  onChange={(e) => setMinPostLikes((e.target as HTMLInputElement).value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.MIN_FOLLOWERS_LABEL}
                </label>
                <Input
                  variant="none"
                  type="number"
                  className="form-input"
                  placeholder={bmLabels.OPTIONAL_PLACEHOLDER}
                  value={minFollowers}
                  onChange={(e) => setMinFollowers((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            {role === UserRole.RESTAURANT && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {bmLabels.MIN_RATING_AVG_LABEL}
                  </label>
                  <Input
                    variant="none"
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="4.5"
                    value={minRatingAvg}
                    onChange={(e) => setMinRatingAvg((e.target as HTMLInputElement).value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {bmLabels.MIN_RATING_COUNT_LABEL}
                  </label>
                  <Input
                    variant="none"
                    type="number"
                    className="form-input"
                    placeholder="20"
                    value={minRatingCount}
                    onChange={(e) => setMinRatingCount((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth className="mt-2 font-bold shadow-md cursor-pointer">
              <Sparkles size={16} className="mr-2" />
              {bmLabels.ADD_BADGE}
            </Button>
          </form>
        </div>

        {/* Gamification Rules Settings */}
        <div className="card-premium p-6 shadow-md border-gray-200 dark:border-slate-800">
          <h3 className="text-body font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Settings size={20} className="text-gray-500 dark:text-slate-400" />
            {bmLabels.RULES_CONFIG_TITLE}
          </h3>

          {loadingRules ? (
            <p className="text-center text-xs text-gray-400 py-4 animate-pulse">{bmLabels.RULES_LOADING}</p>
          ) : (
            <form onSubmit={handleSaveRules} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.RULES_POINTS_PER_LEVEL}
                </label>
                <Input
                  variant="none"
                  type="number"
                  className="form-input"
                  value={pointsPerLevel}
                  onChange={(e) => setPointsPerLevel((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {bmLabels.RULES_REVIEW_POINTS}
                  </label>
                  <Input
                    variant="none"
                    type="number"
                    className="form-input"
                    value={postReviewPoints}
                    onChange={(e) => setPostReviewPoints((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {bmLabels.RULES_COMMENT_POINTS}
                  </label>
                  <Input
                    variant="none"
                    type="number"
                    className="form-input"
                    value={commentPoints}
                    onChange={(e) => setCommentPoints((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {bmLabels.RULES_LIKE_POINTS}
                  </label>
                  <Input
                    variant="none"
                    type="number"
                    className="form-input"
                    value={likePoints}
                    onChange={(e) => setLikePoints((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {bmLabels.RULES_DEDUCTION_MULTIPLIER}
                </label>
                <Input
                  variant="none"
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={deductionMultiplier}
                  onChange={(e) => setDeductionMultiplier((e.target as HTMLInputElement).value)}
                  required
                />
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  {bmLabels.RULES_DEDUCTION_HELP}
                </p>
              </div>

              <Button
                type="submit"
                variant="secondary"
                fullWidth
                loading={savingRules}
                className="mt-2 font-bold shadow-md cursor-pointer"
              >
                <Save size={16} className="mr-2" />
                {bmLabels.RULES_SAVE_BTN}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Badges List Section: Toggled when requested */}
      {showBadgeLists && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Customer badges */}
          <div className="card-premium p-6 space-y-4 shadow-md border-gray-150 dark:border-slate-800">
            <h3 className="text-body font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <User size={18} className="text-emerald-500" />
              {bmLabels.CUSTOMER_BADGES_TITLE(customerBadges.length)}
            </h3>

            {loadingBadges ? (
              <p className="text-center text-xs text-gray-400 py-4 animate-pulse">{bmLabels.BADGES_LOADING}</p>
            ) : customerBadges.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">{LABELS.ADMIN.TABLE.EMPTY}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customerBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-start hover:border-emerald-500/30 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <span className="font-extrabold text-gray-900 dark:text-slate-100 text-sm block truncate">{badge.title}</span>
                      <div className="space-y-1 text-mini text-gray-500 dark:text-slate-400 font-bold">
                        <div className="flex items-center gap-1">{bmLabels.XP_REQUIRED}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.points.toLocaleString()}</span></div>
                        {badge.minReviews !== null && <div>{bmLabels.REVIEWS_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minReviews}{bmLabels.REVIEWS_UNIT}</span></div>}
                        {badge.minPostLikes !== null && <div>{bmLabels.LIKES_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minPostLikes}</span></div>}
                        {badge.minFollowers !== null && <div>{bmLabels.FOLLOWERS_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minFollowers}{bmLabels.FOLLOWERS_UNIT}</span></div>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="!p-2 text-gray-400 hover:text-rose-500 rounded-xl transition-all shrink-0 cursor-pointer"
                      title={LABELS.COMMON.DELETE}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restaurant badges */}
          <div className="card-premium p-6 space-y-4 shadow-md border-gray-150 dark:border-slate-800">
            <h3 className="text-body font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Store size={18} className="text-blue-500" />
              {bmLabels.RESTAURANT_BADGES_TITLE(restaurantBadges.length)}
            </h3>

            {loadingBadges ? (
              <p className="text-center text-xs text-gray-400 py-4 animate-pulse">{bmLabels.BADGES_LOADING}</p>
            ) : restaurantBadges.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">{LABELS.ADMIN.TABLE.EMPTY}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {restaurantBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-start hover:border-blue-500/30 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <span className="font-extrabold text-gray-900 dark:text-slate-100 text-sm block truncate">{badge.title}</span>
                      <div className="space-y-1 text-mini text-gray-500 dark:text-slate-400 font-bold">
                        <div className="flex items-center gap-1">{bmLabels.XP_REQUIRED}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.points.toLocaleString()}</span></div>
                        {badge.minReviews !== null && <div>{bmLabels.REVIEWS_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minReviews}{bmLabels.REVIEWS_UNIT}</span></div>}
                        {badge.minPostLikes !== null && <div>{bmLabels.LIKES_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minPostLikes}</span></div>}
                        {badge.minFollowers !== null && <div>{bmLabels.FOLLOWERS_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minFollowers}{bmLabels.FOLLOWERS_UNIT}</span></div>}
                        {badge.minRatingAvg !== null && <div>{bmLabels.RATING_AVG_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minRatingAvg}{bmLabels.RATING_AVG_UNIT}</span></div>}
                        {badge.minRatingCount !== null && <div>{bmLabels.RATING_COUNT_LABEL_SHORT}<span className="text-gray-800 dark:text-slate-200 font-extrabold">{badge.minRatingCount}{bmLabels.RATING_COUNT_UNIT}</span></div>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="!p-2 text-gray-400 hover:text-rose-500 rounded-xl transition-all shrink-0 cursor-pointer"
                      title={LABELS.COMMON.DELETE}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


