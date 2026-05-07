'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Check, X, Users, Store, ArrowLeft, Search, Sparkles, Pizza, Star, Menu, Settings, LogOut, User, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { adminService } from '@/services/food.service';

export default function AdminDashboard() {
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'menu' | 'customers'>('merchants');
  const [foodSubTab, setFoodSubTab] = useState<'system' | 'merchant'>('system');
  const [loading, setLoading] = useState(true);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [foods, users, pending] = await Promise.all([
        adminService.getAllFoods(),
        adminService.getAllUsers(),
        fetch('http://localhost:3001/admin/pending-users').then(res => res.json())
      ]);
      setAllFoods(foods);
      setAllUsers(users);
      setPendingMerchants(pending);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này? Thao tác này không thể hoàn tác.')) {
      const ok = await adminService.deleteUser(id);
      if (ok) fetchData();
    }
  };

  const handleUpdateStatus = async (userId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:3001/admin/update-status/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.log('Lỗi cập nhật trạng thái:', error);
    }
  };

  const handleUpdateFood = async (foodId: number, data: any) => {
    try {
      const ok = await adminService.updateFood(foodId, data);
      if (ok) {
        fetchData();
        setEditingFood(null);
      }
    } catch (error) {
      console.log('Lỗi cập nhật món ăn:', error);
    }
  };

  const handleDeleteFood = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      try {
        const ok = await adminService.deleteFood(id);
        if (ok) fetchData();
      } catch (error) {
        console.log('Lỗi xóa món ăn:', error);
      }
    }
  };

  const handleRecommendFood = async (id: number) => {
    try {
      const ok = await adminService.recommendFood(id);
      if (ok) fetchData();
    } catch (error) {
      console.log('Lỗi đẩy món:', error);
    }
  };

  const filteredData = () => {
    let data = [];
    if (activeTab === 'merchants') data = pendingMerchants;
    else if (activeTab === 'menu') {
      data = allFoods.filter(f => foodSubTab === 'system' ? !f.restaurantId : !!f.restaurantId);
    }
    else if (activeTab === 'users') data = allUsers.filter(u => u.role === 'RESTAURANT' && u.status === 'APPROVED');
    else if (activeTab === 'customers') data = allUsers.filter(u => u.role === 'CUSTOMER');

    return data.filter((item: any) =>
      (item.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <span className="text-2xl font-bold gradient-text tracking-tight">Admin Panel</span>
        </div>

        <nav className="space-y-3 flex-1">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'merchants' ? 'bg-orange-50 text-primary shadow-sm shadow-orange-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Check size={20} /> Duyệt Thương gia
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-orange-50 text-primary shadow-sm shadow-orange-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Store size={20} /> Quản lý Thương gia
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'customers' ? 'bg-orange-50 text-primary shadow-sm shadow-orange-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Users size={20} /> Quản lý Thực khách
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'menu' ? 'bg-orange-50 text-primary shadow-sm shadow-orange-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Pizza size={20} /> Quản lý Thực đơn
          </button>
        </nav>

        <Link href="/" className="flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-primary font-bold transition-all mt-auto">
          <ArrowLeft size={20} /> Quay lại trang chủ
        </Link>
      </aside>

      {/* Main Content */}
      <main className="ml-80 flex-1 p-12">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800">
              {activeTab === 'merchants' ? 'Duyệt Thương gia' : activeTab === 'menu' ? 'Quản lý Thực đơn' : activeTab === 'users' ? 'Quản lý Thương gia' : 'Quản lý Thực khách'}
            </h2>
            {activeTab === 'menu' && (
              <div className="flex gap-6 mt-4 text-sm font-bold">
                <button
                  onClick={() => setFoodSubTab('system')}
                  className={`pb-2 border-b-2 transition-all ${foodSubTab === 'system' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Món ăn hệ thống
                </button>
                <button
                  onClick={() => setFoodSubTab('merchant')}
                  className={`pb-2 border-b-2 transition-all ${foodSubTab === 'merchant' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Món ăn thương gia
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl w-80 outline-none focus:border-primary transition-all"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {mounted && user && (
              <div className="flex items-center gap-3 relative">
                <Link
                  href="/profile"
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-110 transition-all flex items-center justify-center bg-gray-100"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
                  suppressHydrationWarning
                >
                  <Menu size={24} />
                </button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin: {user.name}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl text-gray-700 font-bold transition-all">
                      <User size={18} className="text-primary" /> Trang cá nhân
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-xl text-gray-700 font-bold transition-all text-left">
                      <Settings size={18} className="text-primary" /> Cài đặt
                    </button>
                    <div className="h-px bg-gray-100 my-2 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl text-red-500 font-bold transition-all"
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-8 py-5 font-bold">{activeTab === 'menu' ? 'Món ăn' : 'Tên tài khoản'}</th>
                <th className="px-8 py-5 font-bold">{activeTab === 'menu' ? (foodSubTab === 'system' ? 'Tên quán (Hệ thống)' : 'Nhà hàng') : 'Email'}</th>
                <th className="px-8 py-5 font-bold">{activeTab === 'menu' ? 'Giá' : 'Ngày đăng ký'}</th>
                <th className="px-8 py-5 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : filteredData().length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400">Không tìm thấy dữ liệu nào.</td></tr>
              ) : (
                filteredData().map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-8 py-6 font-bold text-gray-800">{item.name}</td>
                    <td className="px-8 py-6 text-gray-600 font-medium">
                      {activeTab === 'menu' ? (item.restaurant?.name || item.restaurantName || 'Hệ thống') : item.email}
                    </td>
                    <td className="px-8 py-6 text-gray-500">
                      {activeTab === 'menu' ? `${item.price.toLocaleString()}đ` : new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-2">
                        {activeTab === 'merchants' ? (
                          <>
                            <button onClick={() => handleUpdateStatus(item.id, 'APPROVED')} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><Check size={18} /></button>
                            <button onClick={() => handleUpdateStatus(item.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><X size={18} /></button>
                          </>
                        ) : activeTab === 'menu' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateFood(item.id, { isFeaturedToday: !item.isFeaturedToday })}
                              className={`p-2 rounded-xl transition-all ${item.isFeaturedToday ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}
                              title="Nổi bật Ngày"
                            >
                              <Star size={18} fill={item.isFeaturedToday ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => handleUpdateFood(item.id, { isFeaturedWeekly: !item.isFeaturedWeekly })}
                              className={`p-2 rounded-xl transition-all ${item.isFeaturedWeekly ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}
                              title="Nổi bật Tuần"
                            >
                              <Star size={18} fill={item.isFeaturedWeekly ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => handleRecommendFood(item.id)}
                              className={`p-2 rounded-xl transition-all ${item.isAdminRecommended ? 'bg-primary text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-300'}`}
                              title="Đẩy lên Gợi ý"
                            >
                              <Sparkles size={18} fill={item.isAdminRecommended ? "currentColor" : "none"} />
                            </button>

                            {/* Nút Phê duyệt (Nếu đang chờ) */}
                            {item.status === 'PENDING' && (
                              <button 
                                onClick={() => handleUpdateFood(item.id, { status: 'APPROVED' })}
                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                                title="Phê duyệt"
                              >
                                <Check size={18} />
                              </button>
                            )}

                            {/* Nút Chỉnh sửa */}
                            <button 
                              onClick={() => {
                                setEditingFood(item);
                                setEditFormData({
                                  name: item.name,
                                  price: item.price,
                                  description: item.description,
                                  image: item.image,
                                  tags: item.tags?.join(', ') || ''
                                });
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                              title="Chỉnh sửa món ăn"
                            >
                              <Settings size={18} />
                            </button>

                            <button 
                              onClick={() => handleDeleteFood(item.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                              title="Xóa món ăn"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(item.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      {/* Modal Chỉnh sửa món ăn */}
      {editingFood && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="text-blue-500" /> Chỉnh sửa thông tin món ăn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tên món</label>
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1" 
                  value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Giá (VNĐ)</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1" 
                  value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">URL Hình ảnh</label>
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1" 
                  value={editFormData.image} onChange={e => setEditFormData({...editFormData, image: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tags (Phân tách bằng dấu phẩy)</label>
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1" 
                  value={editFormData.tags} onChange={e => setEditFormData({...editFormData, tags: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mô tả</label>
                <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 min-h-[100px]" 
                  value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingFood(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Hủy</button>
              <button 
                onClick={() => handleUpdateFood(editingFood.id, {
                  ...editFormData,
                  tags: editFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
                })} 
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
