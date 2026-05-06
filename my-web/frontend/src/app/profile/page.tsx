'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Camera, Edit3, Grid, Info, Users, 
  MapPin, Calendar, Mail, Phone, Briefcase, Heart,
  Search, Bell, MessageSquare, MoreHorizontal
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Navbar Profile */}
      <nav className="h-14 bg-white shadow-sm flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <span className="font-bold text-gray-800">{user.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><Search size={20} /></button>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><MessageSquare size={20} /></button>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><Bell size={20} /></button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto">
        {/* Header Section (Cover & Profile Pic) */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          {/* Cover Photo */}
          <div className="h-64 md:h-96 bg-gradient-to-r from-orange-400 to-rose-400 relative group cursor-pointer">
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
            <button className="absolute bottom-4 right-4 flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all text-sm">
              <Camera size={18} /> Chỉnh sửa ảnh bìa
            </button>
          </div>

          {/* Profile Info Area */}
          <div className="px-6 md:px-12 pb-6">
            <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 md:-mt-24 mb-6">
              <div className="relative group">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full gradient-bg border-4 border-white shadow-xl flex items-center justify-center text-white text-5xl font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-2 right-2 p-2 bg-gray-200 rounded-full border-2 border-white hover:bg-gray-300 transition-all">
                  <Camera size={20} />
                </button>
              </div>
              <div className="text-center md:text-left flex-1 md:pb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 font-medium text-lg mt-1">256 bạn bè • {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'RESTAURANT' ? 'Chủ nhà hàng' : 'Thành viên'}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:mb-4">
                <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:brightness-110 transition-all">
                  <Edit3 size={18} /> Chỉnh sửa trang cá nhân
                </button>
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center border-t border-gray-100 pt-1">
              {[
                { id: 'posts', label: 'Bài viết' },
                { id: 'about', label: 'Giới thiệu' },
                { id: 'friends', label: 'Bạn bè' },
                { id: 'photos', label: 'Ảnh' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 md:px-8 py-4 font-bold text-sm transition-all border-b-4 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Sidebar */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Giới thiệu</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Briefcase size={20} className="text-gray-400" />
                  <span>Làm việc tại <span className="font-bold">Food AI Global</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={20} className="text-gray-400" />
                  <span>Sống tại <span className="font-bold">Hà Nội, Việt Nam</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={20} className="text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={20} className="text-gray-400" />
                  <span>Tham gia từ {new Date().getFullYear()}</span>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-gray-100 rounded-lg font-bold text-gray-700 hover:bg-gray-200 transition-all">
                Chỉnh sửa chi tiết
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-gray-900">Ảnh</h2>
                <button className="text-primary font-bold text-sm hover:underline">Xem tất cả</button>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-lg overflow-hidden">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square bg-gray-100 hover:brightness-90 transition-all cursor-pointer"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Feed Content */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-6 py-2 text-left text-gray-500 transition-all">
                  {user.name} ơi, bạn đang nghĩ gì thế?
                </button>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-500 font-bold transition-all">
                   <Grid className="text-green-500" size={20} /> Ảnh/Video
                </button>
                <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-500 font-bold transition-all">
                   <Users className="text-blue-500" size={20} /> Gắn thẻ
                </button>
                <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-500 font-bold transition-all">
                   <Heart className="text-red-500" size={20} /> Cảm xúc
                </button>
              </div>
            </div>

            {/* Empty Feed State */}
            <div className="bg-white p-12 rounded-xl shadow-sm text-center border-2 border-dashed border-gray-100">
               <Info size={48} className="mx-auto text-gray-200 mb-4" />
               <h3 className="text-lg font-bold text-gray-400">Chưa có bài viết nào</h3>
               <p className="text-gray-400">Hãy chia sẻ khoảnh khắc ẩm thực đầu tiên của bạn!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
