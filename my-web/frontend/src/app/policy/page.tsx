// Mục đích file này để làm gì: Trang hiển thị Chính sách bảo mật (Privacy Policy) của Food AI.
// Các file khác hay file này có ý nghĩa như nào: Được truy cập từ chân trang (Footer) và các liên kết đồng ý điều khoản ở trang Đăng ký (Register).
// Các chức năng đặc biệt: Hiển thị đầy đủ 6 phần chính sách bảo mật về dữ liệu AI, mã hóa mật khẩu, chia sẻ dữ liệu và tích hợp đa ngôn ngữ.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, Internationalization (i18n).
// Các biến, hàm đặc biệt trong file: PolicyPage (React Component).
'use client';

import React from 'react';
import { Lock, Eye, Cpu, Database, Share2, Shield } from 'lucide-react';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { LABELS } from '@/constants/labels';

export default function PolicyPage() {
  return (
    <main className="page-container min-h-screen flex flex-col justify-between">
      <Navbar activeTab="home" setActiveTab={() => {}} />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16 flex-grow w-full">
        <div className="text-center mb-12 fade-in">
          <h1 className="text-4xl font-extrabold mb-4 gradient-text">{LABELS.FOOTER.POLICY}</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            {LABELS.POLICY_PAGE.SUBTITLE}
          </p>
        </div>

        <div className="space-y-8 fade-in">
          {/* Section 1 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Database size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC1_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC1_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Lock size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC2_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC2_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Cpu size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC3_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC3_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Eye size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC4_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC4_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Share2 size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC5_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC5_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="card-premium p-8 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary shrink-0">
                <Shield size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{LABELS.POLICY_PAGE.SEC6_TITLE}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {LABELS.POLICY_PAGE.SEC6_DESC}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
