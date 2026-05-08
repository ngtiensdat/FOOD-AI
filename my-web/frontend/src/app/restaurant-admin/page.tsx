'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, TrendingUp, Users, Star, Plus, Settings, Store, 
  BarChart3, ArrowLeft, LogOut, Search, Trash2, Edit, CheckCircle, 
  Clock, XCircle, MapPin, Navigation, Pizza, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { foodService } from '@/services/food.service';
import { useAuth } from '@/hooks/useAuth';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [myFoods, setMyFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'ai-history'>('overview');
  
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    tags: '',
    address: '',
    mapUrl: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    fetchMyFoods();
  }, [user]);

  const fetchMyFoods = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await foodService.getMyFoods();
      setMyFoods(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách món ăn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (food: any) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      price: food.price.toString(),
      description: food.description || '',
      image: food.image || '',
      tags: food.tags?.join(', ') || '',
      address: food.address || '',
      mapUrl: food.mapUrl || food.map_url || '',
      lat: food.lat?.toString() || '',
      lng: food.lng?.toString() || ''
    });
    setIsAddingFood(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      let ok;
      if (editingFood) {
        ok = await foodService.updateFood(editingFood.id, data);
      } else {
        ok = await foodService.createFood(data);
      }

      if (ok) {
        alert(editingFood ? 'Cập nhật thành công! Món ăn sẽ hiển thị lại sau khi Admin duyệt.' : 'Đã gửi yêu cầu thêm món ăn! Vui lòng chờ Admin phê duyệt.');
        setIsAddingFood(false);
        setEditingFood(null);
        fetchMyFoods();
      }
    } catch (error) {
      alert('Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      const ok = await foodService.updateFood(id, { isActive: false });
      if (ok) fetchMyFoods();
    }
  };

  const stats = [
    { label: 'Lượt đề xuất AI', value: '128', icon: <Sparkles size={20} />, trend: '+24%', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Tổng món ăn', value: myFoods.length.toString(), icon: <Pizza size={20} />, trend: 'Sẵn sàng', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Lượt xem món', value: '1.420', icon: <Users size={20} />, trend: '+15%', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Đánh giá quán', value: '4.8', icon: <Star size={20} fill="currentColor" />, trend: 'Rất tốt', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Merchant */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg">
            <Store size={24} />
          </div>
          <span className="text-2xl font-bold gradient-text tracking-tight">Merchant Hub</span>
        </div>

        <nav className="space-y-3 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-orange-50 text-primary shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <BarChart3 size={20} /> Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'menu' ? 'bg-orange-50 text-primary shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Pizza size={20} /> Thực đơn của tôi
          </button>
          <button
            onClick={() => setActiveTab('ai-history')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'ai-history' ? 'bg-orange-50 text-primary shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Sparkles size={20} /> Lịch sử đề xuất
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <Link href="/" className="flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-primary font-bold transition-all">
            <ArrowLeft size={20} /> Quay lại Home
          </Link>
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }}
            className="w-full flex items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-50 rounded-2xl font-bold transition-all"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="ml-80 flex-1 p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800">
                {activeTab === 'overview' ? 'Chào mừng quay trở lại!' : activeTab === 'menu' ? 'Quản lý thực đơn' : 'Lịch sử đề xuất AI'}
              </h2>
              <p className="text-gray-500 font-medium mt-1">Cửa hàng của bạn đang hoạt động rất tốt ✨</p>
            </div>
            {activeTab === 'menu' && (
              <button
                onClick={() => {
                  setEditingFood(null);
                  setFormData({ name: '', price: '', description: '', image: '', tags: '', address: '', mapUrl: '', lat: '', lng: '' });
                  setIsAddingFood(true);
                }}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:scale-105 transition-all flex items-center gap-3"
              >
                <Plus size={24} /> Đăng món mới
              </button>
            )}
          </header>

          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>{stat.icon}</div>
                      <span className="text-xs font-bold text-green-500 bg-green-50 px-3 py-1 rounded-xl">{stat.trend}</span>
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Quick View Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-8">Hoạt động gần đây</h3>
                  <div className="space-y-6">
                    {myFoods.slice(0, 3).map((food, i) => (
                      <div key={i} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-3xl transition-all border border-transparent hover:border-gray-100">
                        <img src={food.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{food.name}</h4>
                          <p className="text-sm text-gray-400">Trạng thái: <span className="text-primary font-bold">{food.status}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{food.price.toLocaleString()}đ</p>
                        </div>
                      </div>
                    ))}
                    {myFoods.length === 0 && <p className="text-center text-gray-400 py-8">Bạn chưa có món ăn nào.</p>}
                  </div>
                </div>
                
                <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100">
                  <Sparkles size={40} className="mb-6 opacity-50" />
                  <h3 className="text-2xl font-bold mb-4">Gợi ý AI cho quán</h3>
                  <p className="text-orange-50 mb-8 leading-relaxed">Dựa trên xu hướng, món "Phở cuốn" đang được tìm kiếm nhiều. Bạn có muốn thêm vào thực đơn?</p>
                  <button className="w-full py-4 bg-white text-primary rounded-2xl font-bold shadow-lg hover:scale-105 transition-all text-sm font-bold">
                    Xem Insight chi tiết
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'menu' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest">
                    <th className="px-8 py-5 font-bold">Món ăn</th>
                    <th className="px-8 py-5 font-bold text-center">Trạng thái</th>
                    <th className="px-8 py-5 font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-bold">Đang tải thực đơn...</td></tr>
                  ) : myFoods.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-bold">Bạn chưa đăng món ăn nào.</td></tr>
                  ) : (
                    myFoods.map((food: any) => (
                      <tr key={food.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                                <img src={food.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-800 text-lg block">{food.name}</span>
                                <span className="text-primary font-bold">{food.price.toLocaleString()}đ</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {food.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-green-100">
                              <CheckCircle size={14} /> Đã duyệt
                            </span>
                          ) : food.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                              <Clock size={14} /> Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-100">
                              <XCircle size={14} /> Bị từ chối
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleOpenEdit(food)}
                              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(food.id)}
                              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ai-history' && (
             <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-gray-200 shadow-sm">
                <Sparkles size={64} className="mx-auto text-gray-100 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa có lịch sử đề xuất!</h3>
                <p className="text-gray-400 font-medium">Khi khách hàng hỏi AI và được gợi ý món ăn của bạn, lịch sử sẽ hiện ở đây.</p>
             </div>
          )}
        </div>
      </main>

      {/* Modal Thêm/Sửa món ăn */}
      <AnimatePresence>
        {(isAddingFood) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  {editingFood ? <Edit className="text-blue-500" /> : <Plus className="text-primary" />}
                  {editingFood ? 'Chỉnh sửa món ăn' : 'Đăng món ăn mới'}
                </h3>
                <button onClick={() => { setIsAddingFood(false); setEditingFood(null); }} className="text-gray-400 hover:text-gray-600 transition-all">
                  <XCircle size={32} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tên món ăn</label>
                    <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all font-bold text-gray-700"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Giá (VNĐ)</label>
                    <input type="number" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all font-bold text-gray-700"
                      value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tags (Phân tách bằng dấu phẩy)</label>
                    <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                      placeholder="Món nước, Cay, Ăn sáng..."
                      value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Hình ảnh (URL)</label>
                  <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                    placeholder="https://..."
                    value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Địa chỉ phục vụ (Nếu khác địa chỉ quán)</label>
                    <input className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                      placeholder="Nhập địa chỉ cụ thể cho món này..."
                      value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Google Maps URL</label>
                    <input className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                      placeholder="https://maps.app.goo.gl/..."
                      value={formData.mapUrl} onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <MapPin size={14} /> Vĩ độ (Lat)
                    </label>
                    <input type="number" step="any" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                      value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Navigation size={14} /> Kinh độ (Lng)
                    </label>
                    <input type="number" step="any" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all"
                      value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mô tả món ăn</label>
                  <textarea required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-1 outline-none focus:border-primary transition-all min-h-[120px]"
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsAddingFood(false); setEditingFood(null); }} className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Hủy</button>
                  <button type="submit" className="flex-1 py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-orange-100 hover:scale-[1.02] transition-all">
                    {editingFood ? 'Lưu thay đổi' : 'Đăng món ngay'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
