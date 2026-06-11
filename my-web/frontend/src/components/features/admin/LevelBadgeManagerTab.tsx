'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Shield, User, Store, Sparkles } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { badgeService } from '@/services/badge.service';

export interface BadgeConfig {
  id: string;
  role: 'CUSTOMER' | 'RESTAURANT';
  title: string;
  points: number;
}


export const LevelBadgeManagerTab = () => {
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [role, setRole] = useState<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');

  // Load from backend on mount
  useEffect(() => {
    async function loadBadges() {
      try {
        const data = await badgeService.getBadges();
        setBadges(data || []);
      } catch (err) {
        console.error('Lỗi khi tải cấu hình danh hiệu:', err);
      }
    }
    loadBadges();
  }, []);

  const handleAddBadge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(LABELS.ADMIN.BADGES_MANAGER.TITLE_REQUIRED);
      return;
    }

    const minPoints = parseInt(points);
    if (isNaN(minPoints) || minPoints < 0) {
      toast.error(LABELS.ADMIN.BADGES_MANAGER.POINTS_REQUIRED);
      return;
    }

    try {
      const created = await badgeService.createBadge({
        role,
        title: title.trim(),
        points: minPoints
      });

      setBadges(prev => [...prev, created].sort((a, b) => a.points - b.points));
      toast.success(LABELS.ADMIN.BADGES_MANAGER.SAVE_SUCCESS);

      setTitle('');
      setPoints('');
    } catch (err: any) {
      console.error(err);
      toast.error(LABELS.ADMIN.BADGES_MANAGER.CREATE_ERROR);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (window.confirm(LABELS.ADMIN.BADGES_MANAGER.DELETE_CONFIRM)) {
      try {
        await badgeService.deleteBadge(id);
        setBadges(prev => prev.filter((b) => b.id !== id));
        toast.success(LABELS.ADMIN.DELETE_SUCCESS);
      } catch (err: any) {
        console.error(err);
        toast.error(LABELS.ADMIN.BADGES_MANAGER.DELETE_ERROR);
      }
    }
  };

  const customerBadges = badges.filter((b) => b.role === 'CUSTOMER');
  const restaurantBadges = badges.filter((b) => b.role === 'RESTAURANT');

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <Award className="text-primary animate-bounce" size={28} />
          {LABELS.ADMIN.BADGES_MANAGER.TITLE}
        </h2>
        <p className="text-sm text-gray-500">{LABELS.ADMIN.BADGES_MANAGER.DESC}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add Config */}
        <div className="card-premium p-6 h-fit bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-500/20">
          <h3 className="text-body font-black text-gray-800 flex items-center gap-2 mb-6">
            <Plus size={20} className="text-primary" />
            {LABELS.ADMIN.BADGES_MANAGER.ADD_BADGE}
          </h3>

          <form onSubmit={handleAddBadge} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {LABELS.ADMIN.BADGES_MANAGER.ROLE}
              </label>
              <select
                className="form-input bg-none"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="CUSTOMER">{LABELS.AUTH.CUSTOMER}</option>
                <option value="RESTAURANT">{LABELS.AUTH.RESTAURANT}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {LABELS.ADMIN.BADGES_MANAGER.BADGE_TITLE}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={LABELS.ADMIN.BADGES_MANAGER.TITLE_PLACEHOLDER}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {LABELS.ADMIN.BADGES_MANAGER.MIN_POINTS}
              </label>
              <input
                type="number"
                className="form-input"
                placeholder={LABELS.ADMIN.BADGES_MANAGER.POINTS_PLACEHOLDER}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth className="mt-2 font-bold shadow-md">
              <Sparkles size={16} className="mr-2" />
              {LABELS.ADMIN.BADGES_MANAGER.ADD_BADGE}
            </Button>
          </form>
        </div>

        {/* Badges List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer badges */}
          <div className="card-premium p-6 space-y-4">
            <h3 className="text-body font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <User size={18} className="text-emerald-500" />
              {LABELS.AUTH.CUSTOMER}
            </h3>

            {customerBadges.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">{LABELS.ADMIN.TABLE.EMPTY}</p>
            ) : (
              <div className="space-y-3">
                {customerBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center hover:border-emerald-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="font-extrabold text-gray-800 text-sm">{badge.title}</span>
                      <p className="text-mini text-gray-400 font-bold">
                        ⭐ {LABELS.LOYALTY.REQUIRED_POINTS(badge.points)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="!p-2 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
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
          <div className="card-premium p-6 space-y-4">
            <h3 className="text-body font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Store size={18} className="text-blue-500" />
              {LABELS.AUTH.RESTAURANT}
            </h3>

            {restaurantBadges.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">{LABELS.ADMIN.TABLE.EMPTY}</p>
            ) : (
              <div className="space-y-3">
                {restaurantBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center hover:border-blue-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="font-extrabold text-gray-800 text-sm">{badge.title}</span>
                      <p className="text-mini text-gray-400 font-bold">
                        ⭐ {LABELS.LOYALTY.REQUIRED_POINTS(badge.points)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="!p-2 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
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
      </div>
    </div>
  );
};
