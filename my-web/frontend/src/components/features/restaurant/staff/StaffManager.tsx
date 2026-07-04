'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Plus, Trash2, Edit2, Shield, UserCheck, 
  UserX, Mail, Store, XCircle, Save, Clock, Star, 
  History, MessageSquare, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Restaurant } from '@/types/restaurant';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Avatar } from '@/components/base/Avatar';
import { useStaff, StaffSubTab, StaffMember, StaffInvitation, StaffHistory, StaffReview } from './useStaff';

interface StaffManagerProps {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
  selectedSubTab?: StaffSubTab;
  onSubTabChange?: (tabId: StaffSubTab) => void;
}

export function StaffManager({ restaurant, myBranches, selectedSubTab, onSubTabChange }: StaffManagerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const s = useStaff({ myBranches });

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (selectedSubTab) s.setActiveSubTab(selectedSubTab); }, [selectedSubTab]);

  const handleTabClick = (tabId: StaffSubTab) => {
    s.setActiveSubTab(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  const renderPortal = (children: React.ReactNode) => {
    if (!isMounted || typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Users size={24} className="text-primary" /> Quản lý nhân viên
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Gửi yêu cầu gán vai trò STAFF cho các tài khoản người dùng đã có trên hệ thống để họ có quyền truy cập POS.
          </p>
        </div>
        <Button onClick={s.handleOpenAddModal}
          className="shrink-0 py-2.5 px-4 font-black text-xs uppercase tracking-wider bg-primary hover:bg-primary-light text-white rounded-xl flex items-center gap-2 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]">
          <Plus size={16} /> Mời nhân viên mới
        </Button>
      </div>

      {/* Sub-tab pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
        {([
          { id: 'active_staff' as const, label: 'Nhân viên đang hoạt động', icon: <Users size={16} /> },
          { id: 'pending_invitations' as const, label: 'Lời mời đang chờ', icon: <Clock size={16} /> },
          { id: 'staff_histories' as const, label: 'Nhật ký hoạt động', icon: <History size={16} /> },
          { id: 'staff_reviews' as const, label: 'Đánh giá năng lực', icon: <Star size={16} /> },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              s.activeSubTab === tab.id
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10 scale-[1.01]'
                : 'bg-white dark:bg-slate-900 text-gray-500 border-gray-150 dark:border-slate-800 hover:text-gray-750 dark:hover:text-slate-350'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {s.activeSubTab === 'active_staff' && <ActiveStaffTab staffList={s.staffList} toggleStatus={s.toggleStatus} onEdit={s.handleOpenEditModal} onReview={s.handleOpenReviewModal} onDelete={s.handleDeleteStaff} getBranchName={s.getBranchName} />}
      {s.activeSubTab === 'pending_invitations' && <PendingInvitationsTab invitationList={s.invitationList} getBranchName={s.getBranchName} onRevoke={s.handleRevokeInvitation} />}
      {s.activeSubTab === 'staff_histories' && <StaffHistoriesTab historyList={s.historyList} />}
      {s.activeSubTab === 'staff_reviews' && <StaffReviewsTab reviewList={s.reviewList} />}

      {/* Modal: Invite Staff */}
      {renderPortal(
        <AnimatePresence>
          {s.isAddModalOpen && (
            <div className="modal-wrapper">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => s.setIsAddModalOpen(false)} className="modal-overlay" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white"><Shield className="text-primary" size={24} /> Mời tài khoản Nhân viên</h3>
                  <Button onClick={() => s.setIsAddModalOpen(false)} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 -mt-4">Nhập email tài khoản người dùng đã có trên hệ thống để gửi lời mời hợp tác nhận việc.</p>
                <form onSubmit={s.handleInviteStaff} className="space-y-4">
                  <Input label="Email người nhận lời mời *" icon={Mail} type="email" required placeholder="Ví dụ: nhanvien@gmail.com" value={s.email} onChange={(e) => s.setEmail((e.target as HTMLInputElement).value)} />
                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Chi nhánh quán gán làm việc *</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <select value={s.selectedBranchId} onChange={(e) => s.setSelectedBranchId(Number(e.target.value))} className="form-input py-4 pl-12 pr-10 rounded-2xl text-sm font-semibold cursor-pointer">
                        {myBranches.map((b) => (<option key={b.id} value={b.id} className="dark:bg-slate-900">{b.name}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                    <Button type="button" variant="outline" fullWidth onClick={() => s.setIsAddModalOpen(false)}>Hủy</Button>
                    <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Send size={16} /> Gửi lời mời</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Modal: Edit Staff */}
      {renderPortal(
        <AnimatePresence>
          {s.isEditModalOpen && (
            <div className="modal-wrapper">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => s.setIsEditModalOpen(false)} className="modal-overlay" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-h3 flex items-center gap-3 text-gray-950 dark:text-white"><Edit2 className="text-primary" size={24} /> Sửa phân bổ Nhân viên</h3>
                  <Button onClick={() => s.setIsEditModalOpen(false)} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
                </div>
                <form onSubmit={s.handleEditStaff} className="space-y-4">
                  <Input label="Họ và Tên (Tên hiển thị) *" type="text" required value={s.name} onChange={(e) => s.setName((e.target as HTMLInputElement).value)} />
                  <Input label="Email đăng nhập" type="email" disabled icon={Mail} value={s.email} className="bg-gray-150 text-gray-400 cursor-not-allowed dark:bg-slate-950" />
                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Chi nhánh làm việc *</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <select value={s.selectedBranchId} onChange={(e) => s.setSelectedBranchId(Number(e.target.value))} className="form-input py-4 pl-12 pr-10 rounded-2xl text-sm font-semibold cursor-pointer">
                        {myBranches.map((b) => (<option key={b.id} value={b.id} className="dark:bg-slate-900">{b.name}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Trạng thái hoạt động *</label>
                    <select value={s.status} onChange={(e) => s.setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className="form-input py-4 px-6 rounded-2xl text-sm font-semibold cursor-pointer">
                      <option value="ACTIVE" className="dark:bg-slate-900">Đang hoạt động (ACTIVE)</option>
                      <option value="INACTIVE" className="dark:bg-slate-900">Tạm khoá (INACTIVE)</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                    <Button type="button" variant="outline" fullWidth onClick={() => s.setIsEditModalOpen(false)}>Hủy</Button>
                    <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Cập nhật thay đổi</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Modal: Review Staff */}
      {renderPortal(
        <AnimatePresence>
          {s.isReviewModalOpen && (
            <div className="modal-wrapper">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => s.setIsReviewModalOpen(false)} className="modal-overlay" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white"><Star className="text-amber-500 fill-current" size={24} /> Đánh giá năng lực Nhân sự</h3>
                  <Button onClick={() => s.setIsReviewModalOpen(false)} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 -mt-4">Đang đánh giá nhân viên: <span className="font-bold text-gray-800 dark:text-white">{s.reviewStaffName}</span></p>
                <form onSubmit={s.handleCreateReview} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Điểm số năng lực (1 - 5 sao) *</label>
                    <div className="flex items-center gap-3 py-2 px-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => s.setRating(star)} className="hover:scale-110 transition-transform">
                          <Star size={32} className={`${star <= s.rating ? 'text-amber-500 fill-current' : 'text-gray-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Nhận xét chi tiết *</label>
                    <div className="relative group">
                      <MessageSquare className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      <textarea required placeholder="Nhập nhận xét về thái độ làm việc, năng lực bán hàng..." value={s.feedback} onChange={(e) => s.setFeedback(e.target.value)} className="form-input py-4 pl-12 pr-6 rounded-2xl text-sm font-semibold h-32 resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                    <Button type="button" variant="outline" fullWidth onClick={() => s.setIsReviewModalOpen(false)}>Hủy</Button>
                    <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Lưu đánh giá</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ──────── Sub-components (Tab nội dung) ──────── */

function ActiveStaffTab({ staffList, toggleStatus, onEdit, onReview, onDelete, getBranchName }: {
  staffList: StaffMember[]; toggleStatus: (s: StaffMember) => void; onEdit: (s: StaffMember) => void; onReview: (s: StaffMember) => void; onDelete: (id: string, name: string) => void; getBranchName: (id: number) => string;
}) {
  if (staffList.length === 0) return (<div className="card-container text-center py-16 text-gray-400"><Users className="mx-auto text-gray-300 mb-3" size={48} /><span className="text-sm font-bold block">Quán chưa có nhân viên nào. Hãy gửi lời mời nhận việc!</span></div>);
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead><tr className="table-header-row">
          <th className="px-8 py-5 font-bold">Họ & Tên</th><th className="px-8 py-5 font-bold">Email đăng nhập</th><th className="px-8 py-5 font-bold">Chi nhánh được gán</th><th className="px-8 py-5 font-bold">Ngày tham gia</th><th className="px-8 py-5 font-bold text-center">Trạng thái</th><th className="px-8 py-5 font-bold text-center">Thao tác</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {staffList.map((staff) => (
            <tr key={staff.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
              <td className="px-8 py-5"><div className="flex items-center gap-3"><Avatar name={staff.name} size={36} /><div><span className="font-bold text-gray-800 dark:text-slate-100 text-base block">{staff.name}</span><span className="text-xs text-gray-400 font-medium">Vai trò: {staff.role}</span></div></div></td>
              <td className="px-8 py-5 font-medium">{staff.email}</td>
              <td className="px-8 py-5"><span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400"><Store size={14} className="text-primary" />{getBranchName(staff.restaurantId)}</span></td>
              <td className="px-8 py-5 font-medium text-gray-400">{staff.createdAt}</td>
              <td className="px-8 py-5 text-center">
                <button onClick={() => toggleStatus(staff)} className={`badge-status hover:scale-[1.02] cursor-pointer select-none transition-all ${staff.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50' : 'bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'}`}>
                  {staff.status === 'ACTIVE' ? <UserCheck size={12} /> : <UserX size={12} />}
                  {staff.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khoá'}
                </button>
              </td>
              <td className="px-8 py-5">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onReview(staff)} className="text-amber-500 border-amber-100 dark:text-amber-400 dark:border-slate-800" title="Đánh giá năng lực"><Star size={16} /></Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(staff)} className="text-blue-600 dark:text-blue-400" title="Sửa phân bổ"><Edit2 size={16} /></Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(staff.id, staff.name)} className="text-red-600 dark:text-rose-450" title="Trục xuất nhân viên"><Trash2 size={16} /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingInvitationsTab({ invitationList, getBranchName, onRevoke }: { invitationList: StaffInvitation[]; getBranchName: (id: number) => string; onRevoke: (id: string, email: string) => void }) {
  if (invitationList.length === 0) return (<div className="card-container text-center py-16 text-gray-400"><Clock className="mx-auto text-gray-300 mb-3" size={48} /><span className="text-sm font-bold block">Không có lời mời nào đang chờ.</span></div>);
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead><tr className="table-header-row"><th className="px-8 py-5 font-bold">Email nhận lời mời</th><th className="px-8 py-5 font-bold">Chi nhánh phân bổ</th><th className="px-8 py-5 font-bold">Ngày mời</th><th className="px-8 py-5 font-bold text-center">Trạng thái</th><th className="px-8 py-5 font-bold text-center">Thao tác</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {invitationList.map((inv) => (
            <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
              <td className="px-8 py-5 font-bold">{inv.email}</td>
              <td className="px-8 py-5"><span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400"><Store size={14} className="text-primary" />{getBranchName(inv.restaurantId)}</span></td>
              <td className="px-8 py-5 text-gray-400">{inv.createdAt}</td>
              <td className="px-8 py-5 text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl border ${inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50' : inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50' : 'bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'}`}>
                  {inv.status === 'PENDING' ? 'Chờ xác nhận' : inv.status === 'ACCEPTED' ? 'Đã nhận việc' : 'Từ chối'}
                </span>
              </td>
              <td className="px-8 py-5 text-center">
                {inv.status === 'PENDING' ? (<Button variant="outline" size="sm" onClick={() => onRevoke(inv.id, inv.email)} className="text-red-500 border-red-100 hover:bg-red-50 dark:border-slate-800">Hủy lời mời</Button>) : (<span className="text-xs text-gray-400">-</span>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffHistoriesTab({ historyList }: { historyList: StaffHistory[] }) {
  if (historyList.length === 0) return (<div className="card-container text-center py-16 text-gray-400"><History className="mx-auto text-gray-300 mb-3" size={48} /><span className="text-sm font-bold block">Chưa có nhật ký hoạt động nhân sự nào.</span></div>);
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead><tr className="table-header-row"><th className="px-8 py-5 font-bold">Thời gian</th><th className="px-8 py-5 font-bold">Nhân sự</th><th className="px-8 py-5 font-bold">Hành động</th><th className="px-8 py-5 font-bold">Người thực hiện</th><th className="px-8 py-5 font-bold">Chi nhánh</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {historyList.map((h) => (
            <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
              <td className="px-8 py-5 text-gray-400">{h.createdAt}</td>
              <td className="px-8 py-5"><div><span className="font-bold block">{h.userName}</span><span className="text-xs text-gray-400">{h.userEmail}</span></div></td>
              <td className="px-8 py-5">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl ${h.action === 'INVITED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : h.action === 'ACCEPTED' ? 'bg-green-50 text-green-600 dark:bg-emerald-950/30 dark:text-emerald-400' : h.action === 'DECLINED' ? 'bg-red-50 text-red-600 dark:bg-rose-950/30 dark:text-rose-400' : h.action === 'REVOKED' ? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                  {h.action === 'INVITED' ? 'Gửi lời mời' : h.action === 'ACCEPTED' ? 'Đã nhận việc' : h.action === 'DECLINED' ? 'Từ chối' : h.action === 'REVOKED' ? 'Đã hủy lời mời' : 'Đã trục xuất'}
                </span>
              </td>
              <td className="px-8 py-5 font-medium">{h.performedBy}</td>
              <td className="px-8 py-5">{h.restaurantName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffReviewsTab({ reviewList }: { reviewList: StaffReview[] }) {
  if (reviewList.length === 0) return (<div className="card-container text-center py-16 text-gray-400"><Star className="mx-auto text-gray-300 mb-3" size={48} /><span className="text-sm font-bold block">Chưa có đánh giá nào cho nhân viên.</span></div>);
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead><tr className="table-header-row"><th className="px-8 py-5 font-bold">Nhân viên</th><th className="px-8 py-5 font-bold">Chi nhánh</th><th className="px-8 py-5 font-bold text-center">Đánh giá điểm số</th><th className="px-8 py-5 font-bold">Nhận xét chi tiết</th><th className="px-8 py-5 font-bold">Ngày đánh giá</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {reviewList.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
              <td className="px-8 py-5"><div><span className="font-bold block">{r.userName}</span><span className="text-xs text-gray-400">{r.userEmail}</span></div></td>
              <td className="px-8 py-5 font-medium">{r.restaurantName}</td>
              <td className="px-8 py-5"><div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold"><Star size={16} className="fill-current" /><span>{r.rating}/5</span></div></td>
              <td className="px-8 py-5 max-w-xs truncate font-medium text-gray-600 dark:text-slate-400" title={r.feedback}>{r.feedback || 'Không có nhận xét bổ sung.'}</td>
              <td className="px-8 py-5 text-gray-400">{r.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
