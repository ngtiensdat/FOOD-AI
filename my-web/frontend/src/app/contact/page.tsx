// Mục đích file này để làm gì: Trang hiển thị thông tin liên hệ và form phản hồi trực tuyến của Food AI.
// Các file khác hay file này có ý nghĩa như nào: Được liên kết từ chân trang (Footer), giúp khách hàng và đối tác gửi yêu cầu hỗ trợ hoặc phản hồi lỗi.
// Các chức năng đặc biệt: Form gửi tin nhắn tương tác, hiển thị thông tin người đại diện Nguyễn Tiến Đạt, tự động hóa dịch ngôn ngữ.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, State Management (useState), Internationalization (i18n).
// Các biến, hàm đặc biệt trong file: ContactPage (React Component), handleSubmit (xử lý gửi form).
'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, User } from 'lucide-react';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(LABELS.CONTACT_PAGE.FORM_ERROR_FILL);
      return;
    }

    setLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      toast.success(LABELS.CONTACT_PAGE.FORM_SUCCESS_MSG);
      setName('');
      setEmail('');
      setMessage('');
    }, 1200);
  };

  return (
    <main className="page-container min-h-screen flex flex-col justify-between">
      <Navbar activeTab="home" setActiveTab={() => {}} />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-16 flex-grow w-full">
        <div className="text-center mb-12 fade-in">
          <h1 className="text-4xl font-extrabold mb-4 gradient-text">{LABELS.FOOTER.CONTACT}</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            {LABELS.CONTACT_PAGE.SUBTITLE}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start fade-in">
          {/* Contact Details Card */}
          <div className="md:col-span-2 card-premium p-8 space-y-8 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="text-primary" size={24} />
                {LABELS.CONTACT_PAGE.INFO_TITLE}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {LABELS.CONTACT_PAGE.INFO_DESC}
              </p>
            </div>

            <div className="space-y-6 flex-grow flex flex-col justify-center my-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{LABELS.CONTACT_PAGE.CONTACT_PERSON_LABEL}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{LABELS.CONTACT_PAGE.CONTACT_PERSON}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{LABELS.CONTACT_PAGE.OFFICE_LABEL}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{LABELS.CONTACT_PAGE.OFFICE_VAL}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{LABELS.CONTACT_PAGE.PHONE_LABEL}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{LABELS.CONTACT_PAGE.PHONE_VAL}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{LABELS.CONTACT_PAGE.EMAIL_LABEL}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{LABELS.CONTACT_PAGE.EMAIL_VAL}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium text-center">
              {LABELS.CONTACT_PAGE.WORKING_HOURS}
            </p>
          </div>

          {/* Contact Form Card */}
          <div className="md:col-span-3 card-premium p-8 h-full">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{LABELS.CONTACT_PAGE.FORM_TITLE}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{LABELS.CONTACT_PAGE.INPUT_NAME}</label>
                <Input
                  id="name"
                  type="text"
                  placeholder={LABELS.CONTACT_PAGE.INPUT_NAME_PLACEHOLDER}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-slate-900/40"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{LABELS.CONTACT_PAGE.INPUT_EMAIL}</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-slate-900/40"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{LABELS.CONTACT_PAGE.INPUT_MESSAGE}</label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder={LABELS.CONTACT_PAGE.INPUT_MESSAGE_PLACEHOLDER}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-xl p-4 text-sm font-semibold outline-none focus:border-primary transition-all duration-150 focus:ring-4 focus:ring-primary/5"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer active:scale-98 transition-all"
              >
                <Send size={16} />
                {loading ? LABELS.CONTACT_PAGE.SUBMIT_BTN_LOADING : LABELS.CONTACT_PAGE.SUBMIT_BTN}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
