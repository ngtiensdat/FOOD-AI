'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, ArrowLeft, Filter, Sparkles, MapPin, 
  Navigation, ShoppingBag, Eye, X, Store 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { foodService } from '@/services/food.service';
import { FoodCard } from '@/components/features/FoodCard';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get('tag') || '';
  
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  
  // Debug dữ liệu khi chọn món
  useEffect(() => {
    if (selectedFood) {
      console.log('--- FRONTEND: DỮ LIỆU MÓN ĐANG XEM ---');
      console.log('Tên:', selectedFood.name);
      console.log('Địa chỉ:', selectedFood.address);
      console.log('Map URL:', selectedFood.mapUrl || selectedFood.map_url);
      console.log('Full Object:', selectedFood);
    }
  }, [selectedFood]);

  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      try {
        const data = await foodService.getAllFoods(tag);
        setFoods(data);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu món ăn:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, [tag]);

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.restaurant?.name || food.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-100 pt-32 pb-12 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="w-12 h-12 bg-gray-50 text-gray-500 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  Khám phá <span className="gradient-text">"{tag}"</span>
                </h1>
                <p className="text-gray-500 font-medium">Tìm thấy {filteredFoods.length} món ngon trong danh mục này</p>
              </div>
            </div>

            <div className="w-full md:w-96 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder={`Tìm kiếm trong mục ${tag}...`}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 outline-none focus:bg-white focus:border-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold">Đang tìm món ngon cho bạn...</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm">
            <ShoppingBag size={64} className="mx-auto text-gray-100 mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Rất tiếc, không tìm thấy món nào!</h3>
            <p className="text-gray-400">Bạn hãy thử tìm kiếm với từ khóa khác nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredFoods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FoodCard food={food} onViewDetail={setSelectedFood} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal Detail (Re-used logic from main page) */}
      {selectedFood && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedFood(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row"
          >
            <button 
              onClick={() => setSelectedFood(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-20 md:text-gray-500 md:bg-gray-100 md:hover:bg-gray-200"
            >
              <X size={24} />
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
              <img 
                src={selectedFood.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'} 
                alt={selectedFood.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="mb-8">
                <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-4">
                  {selectedFood.restaurant?.name || selectedFood.restaurantName || 'Hệ thống'}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{selectedFood.name}</h2>
                <p className="text-2xl font-bold text-primary">{selectedFood.price?.toLocaleString()}đ</p>
              </div>

              <div className="space-y-6 mb-10 text-gray-600">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả món ăn</h4>
                  <p className="leading-relaxed">{selectedFood.description}</p>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group/addr">
                  <MapPin className="text-primary mt-1 shrink-0" size={20} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">Địa chỉ quán</h4>
                    {selectedFood.mapUrl || selectedFood.map_url ? (
                      <a 
                        href={selectedFood.mapUrl || selectedFood.map_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:underline font-medium flex items-center justify-between gap-2"
                      >
                        <span>{selectedFood.address || selectedFood.restaurant?.address || 'Xem vị trí trên bản đồ'}</span>
                        <Navigation size={16} className="text-blue-500 group-hover/addr:scale-125 transition-transform" />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {selectedFood.address || selectedFood.restaurant?.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href={`/profile?id=${selectedFood.restaurant?.ownerId}`}
                  className="flex-1 gradient-bg text-white py-4 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Store size={20} /> Trang Quán ăn
                </Link>
                <button className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  <span>Xem các bài đánh giá</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-bold">Đang tải trang khám phá...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
