'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, Edit3, Grid, Info, Users, 
  MapPin, Calendar, Mail, Phone, Briefcase, Heart,
  Search, Bell, MessageSquare, MoreHorizontal, X, Save,
  Shield, Store
} from 'lucide-react';
import { authService } from '@/services/auth.service';

function ProfileContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [user, setUser] = useState<any>(null); // Thông tin của người được xem Profile
  const [me, setMe] = useState<any>(null); // Thông tin của chính mình
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const myUser = savedUser ? JSON.parse(savedUser) : null;
    setMe(myUser);

    const idToFetch = targetId ? parseInt(targetId) : myUser?.id;
    if (idToFetch) {
      fetchProfile(idToFetch, myUser?.id);
    }
  }, [targetId]);

  const fetchProfile = async (id: number, requesterId?: number) => {
    try {
      const data = await authService.getProfile(id, requesterId);
      setProfile(data);
      setUser(data); // Cập nhật thông tin người được xem
      setEditData({
        name: data.name,
        fullName: data.profile?.fullName || '',
        phone: data.profile?.phone || '',
        avatar: data.profile?.avatar || '',
        coverImage: data.profile?.coverImage || '',
        bio: data.profile?.bio || '',
        address: data.profile?.address || '',
        workAt: data.profile?.workAt || '',
      });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authService.updateProfile({ userId: user.id, ...editData });
      await fetchProfile(user.id);
      // Cập nhật lại localStorage nếu tên thay đổi
      const updatedUser = { ...user, name: editData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMe(updatedUser);
      setIsEditing(false);
      alert('Cập nhật trang cá nhân thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async () => {
    if (!me) {
      alert('Vui lòng đăng nhập để theo dõi!');
      return;
    }
    setIsFollowLoading(true);
    try {
      const response = await fetch('http://localhost:3001/auth/toggle-follow-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: me.id, followingId: user.id }),
      });
      await fetchProfile(user.id, me.id); // Reload data
    } catch (error) {
      console.error('Lỗi khi follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (!user || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

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
          <div 
            className="h-64 md:h-96 bg-cover bg-center relative group cursor-pointer"
            style={{ 
              backgroundImage: profile.profile?.coverImage 
                ? `url(${profile.profile.coverImage})` 
                : 'linear-gradient(to right, #fb923c, #f43f5e)' 
            }}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all text-sm"
            >
              <Camera size={18} /> Chỉnh sửa ảnh bìa
            </button>
          </div>

          {/* Profile Info Area */}
          <div className="px-6 md:px-12 pb-10 pt-8">
            <div className="relative flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="relative group">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-white transition-transform hover:scale-[1.02]">
                  {profile.profile?.avatar ? (
                    <img src={profile.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-5xl font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-2 right-2 p-2 bg-gray-200 rounded-full border-2 border-white hover:bg-gray-300 transition-all"
                >
                  <Camera size={20} />
                </button>
              </div>
              <div className="text-center md:text-left flex-1 md:pb-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{user.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3">
                  <p className="text-gray-500 font-bold text-lg flex items-center gap-2">
                    {user.role === 'ADMIN' ? (
                      <span className="flex items-center gap-1.5"><Shield size={20} className="text-primary" /> Quản trị viên tối cao</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-800">
                        {user.role === 'RESTAURANT' ? <Store size={20} className="text-primary" /> : <Heart size={20} className="text-primary" />}
                        {(profile.restaurants?.[0]?._count?.followers || 0) + (profile._count?.userFollowers || 0)} người theo dõi • {(profile._count?.userFollowing || 0) + (profile._count?.follows || 0)} đang theo dõi
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-gray-600 mt-3 max-w-lg font-medium text-lg">
                  {profile.profile?.bio || "Chia sẻ suy nghĩ của bạn..."}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:mb-6">
                {me?.id !== user.id && user.role !== 'ADMIN' && me?.role !== 'ADMIN' ? (
                  <button 
                    onClick={handleFollowUser}
                    disabled={isFollowLoading}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all ${
                      user.isFollowing 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-primary text-white hover:brightness-110'
                    }`}
                  >
                    {isFollowLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      user.isFollowing ? 'Đang theo dõi' : 'Theo dõi'
                    )}
                  </button>
                ) : me?.id === user.id ? (
                  <>
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all">
                      <Grid size={18} /> Bảng điều khiển
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-300 transition-all"
                    >
                      <Edit3 size={18} /> Chỉnh sửa
                    </button>
                  </>
                ) : null}
                <button className="p-3 bg-gray-200 rounded-2xl hover:bg-gray-300 transition-all text-gray-800">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center border-t border-gray-100 pt-1">
              {[
                { id: 'posts', label: 'Bài viết' },
                { id: 'about', label: 'Giới thiệu' },
                { id: 'friends', label: user.role === 'RESTAURANT' ? `Người theo dõi (${(profile.restaurants?.[0]?._count?.followers || 0) + (profile._count?.userFollowers || 0)})` : `Người theo dõi (${profile._count?.userFollowers || 0})` },
                { id: 'photos', label: 'Ảnh' },
              ].filter(tab => {
                if (user.role === 'CUSTOMER' && tab.id === 'friends') return false;
                return true;
              }).map(tab => (
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
                  <span>Làm việc tại <span className="font-bold">{profile.profile?.workAt || "Chưa cập nhật"}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={20} className="text-gray-400" />
                  <span>Sống tại <span className="font-bold">{profile.profile?.address || "Chưa cập nhật"}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={20} className="text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={20} className="text-gray-400" />
                  <span>Tham gia từ {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 py-2 bg-gray-100 rounded-lg font-bold text-gray-700 hover:bg-gray-200 transition-all"
              >
                Chỉnh sửa chi tiết
              </button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white font-bold">
                  {profile.profile?.avatar ? (
                    <img src={profile.profile.avatar} className="w-full h-full object-cover" />
                  ) : user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-6 py-2 text-left text-gray-500 transition-all">
                  {user.name} ơi, bạn đang nghĩ gì thế?
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Chỉnh sửa trang cá nhân</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Tên hiển thị</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Số điện thoại</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">URL Ảnh đại diện</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      value={editData.avatar} onChange={e => setEditData({...editData, avatar: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">URL Ảnh bìa</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      value={editData.coverImage} onChange={e => setEditData({...editData, coverImage: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 ml-1">Tiểu sử</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all min-h-[80px]" 
                    value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Sống tại</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      placeholder="Hà Nội, Việt Nam..."
                      value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Làm việc tại</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all" 
                      placeholder="Công ty ABC..."
                      value={editData.workAt} onChange={e => setEditData({...editData, workAt: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Hủy
                </button>
                <button 
                  disabled={loading}
                  onClick={handleSave}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
