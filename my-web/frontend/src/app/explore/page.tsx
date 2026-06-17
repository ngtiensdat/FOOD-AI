'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Services & Components
import { foodService } from '@/services/food.service';
import { FoodCard } from '@/components/features/FoodCard';
import { FoodDetailModal } from '@/components/features/FoodDetailModal';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { LABELS } from '@/constants/labels';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get('tag') || '';

  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'offers' | 'settings'>('explore');

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
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        if (tab === 'home') router.push('/');
        else setActiveTab(tab);
      }} />

      {/* Header Area */}
      <div className="bg-white border-b border-gray-100 pt-32 pb-12 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="w-12 h-12 rounded-2xl"
              >
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1 className="text-h2 text-gray-800">
                  {LABELS.EXPLORE.TITLE_TAG(tag || '')}
                </h1>
                <p className="text-gray-500 font-medium text-small">
                  {LABELS.EXPLORE.FOUND_COUNT(filteredFoods.length)}
                </p>
              </div>
            </div>

            <div className="w-full md:w-96">
              <Input
                icon={Search}
                placeholder={LABELS.EXPLORE.SEARCH_IN_TAG(tag || '')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold text-body">{LABELS.EXPLORE.SEARCHING}</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-card border border-dashed border-gray-200 shadow-sm">
            <ShoppingBag size={64} className="mx-auto text-gray-100 mb-6" />
            <h3 className="text-h2 text-gray-800 mb-2">{LABELS.EXPLORE.EMPTY_TITLE}</h3>
            <p className="text-gray-400 text-body">{LABELS.EXPLORE.EMPTY_DESC}</p>
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

      {selectedFood && (
        <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center font-bold text-h2 gradient-text">{LABELS.EXPLORE.LOADING}</div>}>
      <ExploreContent />
    </Suspense>
  );
}
