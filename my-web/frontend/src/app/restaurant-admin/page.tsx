'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Users, Star, Plus, Settings, Store, BarChart3, ArrowLeft, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { foodService } from '@/services/food.service';
import { useAuth } from '@/hooks/useAuth';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [orders] = useState([
    { id: '#ORD-2021', customer: 'Nguyễn Văn A', items: 'Mì vằn thắn (2)', total: '110.000đ', status: 'Đang chuẩn bị' },
    { id: '#ORD-2022', customer: 'Trần Thị B', items: 'Combo Bia hơi (1)', total: '89.000đ', status: 'Chờ giao hàng' },
    { id: '#ORD-2023', customer: 'Lê Văn C', items: 'Salad Ức gà (1)', total: '65.000đ', status: 'Đang chuẩn bị' },
  ]);

  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    tags: '',
    mapUrl: '',
    lat: '',
    lng: ''
  });

  const stats = [
    { label: 'Doanh thu ngày', value: '1.250.000đ', icon: <TrendingUp size={20} />, trend: '+12%', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Tổng đơn hàng', value: '45', icon: <ShoppingBag size={20} />, trend: '+5%', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Khách hàng mới', value: '18', icon: <Users size={20} />, trend: '+20%', color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Đánh giá', value: '4.8', icon: <Star size={20} fill="currentColor" />, trend: '0%', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFood.name || !newFood.price || !newFood.description || !newFood.image || !newFood.tags) {
      alert('Vui lòng điền đầy đủ các trường thông tin bắt buộc!');
      return;
    }

    try {
      const data = {
        ...newFood,
        tags: newFood.tags.split(',').map(t => t.trim()).filter(t => t),
        userId: user?.id
      };

      const ok = await foodService.createFood(data);
      if (ok) {
        alert('Đã gửi yêu cầu thêm món ăn! Vui lòng chờ Admin phê duyệt.');
        setIsAddingFood(false);
        setNewFood({ name: '', price: '', description: '', image: '', tags: '', mapUrl: '', lat: '', lng: '' });
      } else {
        alert('Có lỗi xảy ra khi gửi yêu cầu.');
      }
    } catch (error) {
      console.error('Lỗi thêm món:', error);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Merchant */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full">
        <Link href="/" className="flex items-center gap-2 mb-12 px-2">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
            <Store size={18} />
          </div>
          <span className="text-xl font-bold text-gray-800">Merchant Hub</span>
        </Link>

        <nav className="space-y-2 flex-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <ArrowLeft size={18} /> Quay lại Home
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-primary rounded-xl font-bold transition-all">
            <Store size={18} /> Tổng quan quán
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <ShoppingBag size={18} /> Đơn hàng
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-primary rounded-xl font-bold transition-all">
            <Settings size={18} /> Cài đặt quán
          </a>
        </nav>

        <button
          onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </aside>

      <main className="ml-72 flex-1 p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Store className="text-primary" size={32} /> Quản lý Nhà hàng
              </h2>
              <p className="text-gray-500 font-medium">Bếp Nhà FoodAI - Chào mừng bạn quay trở lại!</p>
            </div>
            <button
              onClick={() => setIsAddingFood(true)}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Thêm món ăn mới
            </button>
          </header>

          {/* Modal Thêm món ăn nhanh */}
          {isAddingFood && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6">Thêm món ăn mới</h3>
                <form onSubmit={handleAddFood} className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Tên món ăn</label>
                      <input required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        value={newFood.name} onChange={e => setNewFood({ ...newFood, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Giá (VNĐ)</label>
                      <input type="number" required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        value={newFood.price} onChange={e => setNewFood({ ...newFood, price: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Hình ảnh (URL)</label>
                      <input required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        placeholder="https://..."
                        value={newFood.image} onChange={e => setNewFood({ ...newFood, image: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Link Google Map (Tùy chọn)</label>
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        placeholder="https://maps.app.goo.gl/..."
                        value={newFood.mapUrl} onChange={e => setNewFood({ ...newFood, mapUrl: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Tags (Phân tách bằng dấu phẩy)</label>
                      <input required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        placeholder="Món nước, Bình dân, Truyền thống..."
                        value={newFood.tags} onChange={e => setNewFood({ ...newFood, tags: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Vĩ độ (Lat) (Tùy chọn)</label>
                      <input type="number" step="any" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        placeholder="xxx.xxx"
                        value={newFood.lat} onChange={e => setNewFood({ ...newFood, lat: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 ml-1">Kinh độ (Lng) (Tùy chọn)</label>
                      <input type="number" step="any" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all"
                        placeholder="zzz.zzz"
                        value={newFood.lng} onChange={e => setNewFood({ ...newFood, lng: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Mô tả món ăn (Để AI gợi ý tốt hơn)</label>
                    <textarea required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mt-1 outline-none focus:border-primary transition-all min-h-[100px]"
                      value={newFood.description} onChange={e => setNewFood({ ...newFood, description: e.target.value })} />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddingFood(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Hủy</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-orange-100">Lưu món</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>{stat.icon}</div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">{stat.trend}</span>
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Đơn hàng mới</h3>
                <button className="text-primary font-bold text-sm">Xem tất cả</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-8 py-4 font-bold">Mã đơn</th>
                      <th className="px-8 py-4 font-bold">Khách hàng</th>
                      <th className="px-8 py-4 font-bold">Tổng tiền</th>
                      <th className="px-8 py-4 font-bold">Trạng thái</th>
                      <th className="px-8 py-4 font-bold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-5 font-bold text-gray-800 text-sm">{order.id}</td>
                        <td className="px-8 py-5 text-gray-600 text-sm font-medium">{order.customer}</td>
                        <td className="px-8 py-5 text-gray-800 text-sm font-bold">{order.total}</td>
                        <td className="px-8 py-5">
                          <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{order.status}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button className="text-primary font-bold text-sm hover:underline">Chi tiết</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions/Settings */}
            <div className="space-y-8">
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <BarChart3 size={20} className="text-primary" /> Hiệu suất AI
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-medium">Món ăn gợi ý nhiều nhất</span>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-xs text-orange-800 font-bold">
                    Mì vằn thắn đặc biệt (80%)
                  </div>
                  <button className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-all">
                    Cập nhật AI Insights
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
