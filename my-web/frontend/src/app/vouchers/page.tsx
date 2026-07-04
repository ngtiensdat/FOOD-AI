'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/features/Navbar';
import { VoucherMallTab } from '@/components/features/profile/VoucherMallTab';
import { Sidebar, SidebarItem, useSidebarCollapse } from '@/components/base/Sidebar';
import { ArrowLeft, Ticket, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { LABELS } from '@/constants/labels';

export default function VouchersPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'MALL' | 'WALLET' | 'CLAIM'>('MALL');
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setPoints(user.points || 0);
  }, [user, loading, router]);

  const handleUpdatePoints = (newPoints: number) => {
    setPoints(newPoints);
    if (user) {
      login({
        ...user,
        points: newPoints,
      });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-h2 gradient-text bg-gray-50 dark:bg-slate-950">{LABELS.COMMON?.LOADING || 'Đang tải...'}</div>;
  if (!user) return null;

  return (
    <div className="admin-layout flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex pt-20 min-h-[calc(100vh-5rem)] w-full">
        {/* Sidebar: Quản lý tích điểm & Ví voucher */}
        <Sidebar 
          showBrand={false} 
          className="top-20 h-[calc(100vh-5rem)] pt-4"
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleCollapse}
        >
          <SidebarItem icon={ArrowLeft} label={LABELS.COMMON?.BACK_HOME || 'Quay lại Trang chủ'} href="/" />
          <SidebarItem
            icon={Ticket}
            label="Chợ Voucher"
            active={activeSubTab === 'MALL'}
            onClick={() => setActiveSubTab('MALL')}
          />
          <SidebarItem
            icon={CheckCircle2}
            label="Ví Voucher của tôi"
            active={activeSubTab === 'WALLET'}
            onClick={() => setActiveSubTab('WALLET')}
          />
          <SidebarItem
            icon={Award}
            label="Nhập mã tích điểm"
            active={activeSubTab === 'CLAIM'}
            onClick={() => setActiveSubTab('CLAIM')}
          />
        </Sidebar>

        {/* Content Area */}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <VoucherMallTab
              currentPoints={points}
              onUpdatePoints={handleUpdatePoints}
              activeSubTab={activeSubTab}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
