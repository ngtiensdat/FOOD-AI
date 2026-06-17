// Mục đích file này để làm gì: Component hiển thị giao diện cấu hình ngôn ngữ của tài khoản.
// Các file khác hay file này có ý nghĩa như nào: Tab con của SettingsSection, quản lý ngôn ngữ hiển thị hệ thống.
// Các chức năng đặc biệt: Cho phép chọn ngôn ngữ hiển thị (tiếng Việt/tiếng Anh) và kích hoạt modal xác nhận trước khi thực hiện tải lại trang.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management, Confirmation Flow.
// Các biến, hàm đặc biệt trong file: LanguageSettingsTab component.
'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { LABELS } from '@/constants/labels';

import { ConfirmModal } from '@/components/base/ConfirmModal';

export const LanguageSettingsTab = () => {
  const [lang, setLang] = React.useState('vi');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [pendingLang, setPendingLang] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang(localStorage.getItem('lang') || 'vi');
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card-container p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <Globe className="text-primary" size={20} /> {LABELS.SETTINGS.TABS.LANGUAGE}
        </h3>
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
          <div className="pr-4">
            <span className="font-bold text-gray-700 block mb-0.5">{LABELS.SETTINGS.TABS.LANGUAGE}</span>
            <span className="text-xs text-gray-400 font-medium">{LABELS.SETTINGS.LANG_DESC}</span>
          </div>
          <select
            value={lang}
            onChange={(e) => {
              setPendingLang(e.target.value);
              setShowConfirm(true);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 border border-gray-200 text-gray-700 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="vi">{LABELS.AI_CHAT.PREFERENCES.LANG_VI || 'Tiếng Việt'}</option>
            <option value="en">{LABELS.AI_CHAT.PREFERENCES.LANG_EN || 'Tiếng Anh'}</option>
          </select>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={LABELS.SETTINGS.LANGUAGE_CONFIRM_TITLE}
        message={LABELS.SETTINGS.LANGUAGE_CONFIRM_DESC}
        confirmText={LABELS.COMMON.SAVE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="warning"
        onConfirm={() => {
          localStorage.setItem('lang', pendingLang);
          document.cookie = `lang=${pendingLang}; path=/; max-age=31536000; SameSite=Lax`;
          window.location.reload();
        }}
        onCancel={() => {
          setShowConfirm(false);
          setPendingLang('');
        }}
      />
    </div>
  );
};
