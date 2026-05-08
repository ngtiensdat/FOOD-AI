'use client';

import React, { useEffect, useState } from 'react';
import { User, Heart, Clock, Settings, Sparkles, ChevronRight, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { authService } from '@/services/auth.service';

export default function CustomerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        window.location.href = '/login';
        return;
      }
      const user = JSON.parse(savedUser);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/auth/profile/${user.id}`);
        if (!res.ok) throw new Error('Không thể kết nối đến máy chủ');
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleOnboardingComplete = async (preferences: any) => {
    if (!profile) return;
    try {
      await authService.completeOnboarding({
        userId: profile.id,
        preferences
      });
      
      // Cập nhật lại thông tin profile và đồng bộ LocalStorage
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/auth/profile/${profile.id}`);
      const newData = await res.json();
      setProfile(newData);

      // Đồng bộ hóa triệt để với LocalStorage để Trang chủ không hiện lại Modal
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        const updatedUser = { 
          ...currentUser, 
          hasCompletedOnboarding: true,
          profile: {
            ...currentUser.profile,
            hasCompletedOnboarding: true,
            preferences: preferences
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setShowOnboarding(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Lỗi cập nhật sở thích:', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải thông tin...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full">
        <Link href="/" className="flex items-center gap-2 mb-12 px-2">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-bold gradient-text">Food AI</span>
        </Link>

        <nav className="space-y-2 flex-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <ArrowLeft size={18} /> Quay lại Home
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-primary rounded-xl font-bold transition-all">
            <User size={18} /> Hồ sơ cá nhân
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <Heart size={18} /> Món ăn yêu thích
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <Clock size={18} /> Lịch sử đề xuất
          </a>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 p-12">
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Chào bạn, {profile?.name}! 👋</h2>
              <p className="text-gray-500 font-medium">Hôm nay bạn muốn AI gợi ý món gì cho bữa trưa không?</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-gray-800">{profile?.name}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{profile?.role}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-xl">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* AI Suggestion Box */}
            <section className="gradient-bg p-8 rounded-[2.5rem] text-white shadow-2xl shadow-orange-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Gợi ý AI dành riêng cho bạn</h3>
                <p className="opacity-90 mb-8 max-w-md">Dựa trên lịch sử ăn uống của bạn, chúng tôi đề xuất món <b>Phở Bò Gia Truyền</b> cho hôm nay.</p>
                <button className="bg-white text-primary px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
                  Thử ngay
                </button>
              </div>
              <Sparkles className="absolute right-[-20px] bottom-[-20px] opacity-20" size={180} />
            </section>

            {/* Profile Info */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowOnboarding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-primary rounded-xl font-bold text-sm hover:bg-orange-100 transition-all"
                  >
                    <Sparkles size={16} /> Cập nhật sở thích AI
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400">
                    <Settings size={20}/>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                  <p className="font-bold text-gray-700">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Số điện thoại</label>
                  <p className="font-bold text-gray-700">{profile?.profile?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Sở thích ăn uống (AI Context)</label>
                  <p className="font-bold text-gray-700 italic">
                    {profile?.profile?.preferences ? 
                      Object.values(profile.profile.preferences).join(', ') : 
                      'Bạn chưa cập nhật sở thích để AI tư vấn tốt hơn.'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Món ăn gần đây</h3>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                      <img src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format`} alt="food" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">Bún chả Hà Nội</h4>
                      <p className="text-xs text-gray-400">Được AI gợi ý {i} ngày trước</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modals & Notifications */}
      {showOnboarding && (
        <OnboardingModal 
          user={profile} 
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
          title="Cập nhật sở thích ăn uống"
        />
      )}

      {updateSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-10 right-10 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-[10000] font-bold flex items-center gap-3"
        >
          <Sparkles size={20} /> Cập nhật sở thích thành công!
        </motion.div>
      )}
    </div>
  );
}
