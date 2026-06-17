'use client';

import React, { useState } from 'react';
import { Bell, Send, Users, User, AlertCircle, Megaphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { User as UserType } from '@/types/user';
import { addNotification } from '@/utils/notifications';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

interface AdminNotificationTabProps {
  allUsers: UserType[];
  adminAvatar?: string;
}

export const AdminNotificationTab = ({ allUsers = [], adminAvatar }: AdminNotificationTabProps) => {
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notifType, setNotifType] = useState<string>('SYSTEM');
  const [loading, setLoading] = useState(false);

  // Filter out admin users from recipient list
  const recipients = allUsers.filter(u => u.role !== 'ADMIN');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.CONTENT_REQUIRED);
      return;
    }

    if (targetType === 'SPECIFIC' && !selectedUserId) {
      toast.error(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.USER_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      if (targetType === 'ALL') {
        // Send to all users
        if (recipients.length === 0) {
          toast.info(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.NO_USERS);
          setLoading(false);
          return;
        }
        recipients.forEach(u => {
          addNotification(u.id, title.trim(), content.trim(), notifType, adminAvatar || '/admin-avatar.png');
        });
        toast.success(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.SEND_ALL_SUCCESS(recipients.length));
      } else {
        // Send to specific user
        const targetUser = recipients.find(u => String(u.id) === selectedUserId);
        if (!targetUser) {
          toast.error(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.USER_NOT_FOUND);
          setLoading(false);
          return;
        }
        addNotification(targetUser.id, title.trim(), content.trim(), notifType, adminAvatar || '/admin-avatar.png');
        toast.success(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.SEND_SPECIFIC_SUCCESS(targetUser.name));
      }

      // Reset form on success
      setTitle('');
      setContent('');
      setSelectedUserId('');
    } catch (err) {
      console.error(err);
      toast.error(LABELS.ADMIN.NOTIFICATION_TAB.TOAST.SEND_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <Bell className="text-primary animate-pulse" size={28} />
          {LABELS.ADMIN.NOTIFICATION_TAB.TITLE}
        </h2>
        <p className="text-sm text-gray-500">{LABELS.ADMIN.NOTIFICATION_TAB.DESC}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-2 card-premium p-6 space-y-6">
          <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
            {LABELS.ADMIN.NOTIFICATION_TAB.SECTION_TITLE}
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs font-bold text-gray-600">
            {/* Recipient select */}
            <div className="space-y-2">
              <label className="block text-gray-500 font-semibold mb-1">{LABELS.ADMIN.NOTIFICATION_TAB.RECIPIENT_LABEL}</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTargetType('ALL')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    targetType === 'ALL'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-white'
                  }`}
                >
                  <Users size={16} />
                  <span>{LABELS.ADMIN.NOTIFICATION_TAB.RECIPIENT_ALL(recipients.length)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('SPECIFIC')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    targetType === 'SPECIFIC'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-white'
                  }`}
                >
                  <User size={16} />
                  <span>{LABELS.ADMIN.NOTIFICATION_TAB.RECIPIENT_SPECIFIC}</span>
                </button>
              </div>
            </div>

            {/* Specific User Dropdown selector */}
            {targetType === 'SPECIFIC' && (
              <div className="space-y-1.5">
                <label className="block text-gray-500 font-semibold">{LABELS.ADMIN.NOTIFICATION_TAB.SELECT_USER_LABEL}</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-bold"
                >
                  <option value="">{LABELS.ADMIN.NOTIFICATION_TAB.SELECT_USER_PLACEHOLDER}</option>
                  {recipients.map(u => (
                    <option key={u.id} value={u.id}>
                      {LABELS.ADMIN.NOTIFICATION_TAB.USER_OPTION(u.name, u.role, u.email)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 font-semibold">{LABELS.ADMIN.NOTIFICATION_TAB.NOTIF_TYPE_LABEL}</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-bold"
              >
                <option value="SYSTEM">{LABELS.ADMIN.NOTIFICATION_TAB.NOTIF_TYPE_OPTIONS.SYSTEM}</option>
                <option value="WARNING">{LABELS.ADMIN.NOTIFICATION_TAB.NOTIF_TYPE_OPTIONS.WARNING}</option>
                <option value="PROMOTION">{LABELS.ADMIN.NOTIFICATION_TAB.NOTIF_TYPE_OPTIONS.PROMOTION}</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 font-semibold">{LABELS.ADMIN.NOTIFICATION_TAB.TITLE_LABEL}</label>
              <Input
                placeholder={LABELS.ADMIN.NOTIFICATION_TAB.TITLE_PLACEHOLDER}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 font-semibold">{LABELS.ADMIN.NOTIFICATION_TAB.CONTENT_LABEL}</label>
              <textarea
                rows={4}
                placeholder={LABELS.ADMIN.NOTIFICATION_TAB.CONTENT_PLACEHOLDER}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 dark:text-slate-200 font-medium"
              />
            </div>

            {/* Action */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full gap-2 py-3 rounded-xl shadow-lg shadow-primary/10 font-bold"
            >
              <Send size={16} />
              <span>{loading ? LABELS.ADMIN.NOTIFICATION_TAB.SENDING : LABELS.ADMIN.NOTIFICATION_TAB.SEND_BTN}</span>
            </Button>
          </form>
        </div>

        {/* Live Preview panel */}
        <div className="card-premium p-6 h-fit space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <CheckCircle className="text-emerald-500" size={16} />
            {LABELS.ADMIN.NOTIFICATION_TAB.PREVIEW_TITLE}
          </h3>

          <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-900/30 text-xs">
            <div className="flex justify-between items-start gap-2 mb-2">
              <span className="font-black text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                {notifType === 'WARNING' && <AlertCircle className="text-rose-500 shrink-0" size={14} />}
                {notifType === 'PROMOTION' && <Megaphone className="text-blue-500 shrink-0" size={14} />}
                {notifType === 'SYSTEM' && <Bell className="text-primary shrink-0" size={14} />}
                {title ? title : LABELS.ADMIN.NOTIFICATION_TAB.PREVIEW_TITLE_DEFAULT}
              </span>
              <span className="text-[9px] text-gray-400 font-bold shrink-0">{LABELS.ADMIN.NOTIFICATION_TAB.PREVIEW_TIME}</span>
            </div>
            <p className="leading-relaxed font-bold text-gray-500 dark:text-slate-400 whitespace-pre-wrap">
              {content ? content : LABELS.ADMIN.NOTIFICATION_TAB.PREVIEW_CONTENT_DEFAULT}
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
            <span className="text-[10px] font-black text-primary uppercase block mb-1">{LABELS.ADMIN.NOTIFICATION_TAB.TIP_TITLE}</span>
            <p className="text-[11px] font-bold text-gray-600 dark:text-slate-300 leading-normal">
              {LABELS.ADMIN.NOTIFICATION_TAB.TIP_DESC}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
