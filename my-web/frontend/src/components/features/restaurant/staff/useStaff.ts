import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/store/useToastStore';
import { restaurantService } from '@/services/restaurant.service';
import { Restaurant } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';

export type StaffSubTab = 'active_staff' | 'pending_invitations' | 'staff_histories' | 'staff_reviews';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  restaurantId: number;
  role: 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  restaurantId: number;
  restaurantName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';
  createdAt: string;
}

export interface StaffHistory {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  restaurantId: number;
  restaurantName: string;
  action: string;
  performedBy: string;
  createdAt: string;
}

export interface StaffReview {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  restaurantName: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

interface UseStaffParams {
  myBranches: Restaurant[];
}

export function useStaff({ myBranches }: UseStaffParams) {
  const t = LABELS.STAFF_MANAGER;

  const [activeSubTab, setActiveSubTab] = useState<StaffSubTab>('active_staff');

  // Data lists
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [invitationList, setInvitationList] = useState<StaffInvitation[]>([]);
  const [historyList, setHistoryList] = useState<StaffHistory[]>([]);
  const [reviewList, setReviewList] = useState<StaffReview[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Form states
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [reviewStaffId, setReviewStaffId] = useState<string | null>(null);
  const [reviewStaffName, setReviewStaffName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const fetchData = useCallback(async () => {
    try {
      if (activeSubTab === 'active_staff') {
        const data = await restaurantService.getMyStaffs();
        setStaffList(data);
      } else if (activeSubTab === 'pending_invitations') {
        const data = await restaurantService.getStaffInvitations();
        setInvitationList(data);
      } else if (activeSubTab === 'staff_histories') {
        const data = await restaurantService.getStaffHistories();
        setHistoryList(data);
      } else if (activeSubTab === 'staff_reviews') {
        const data = await restaurantService.getStaffReviews();
        setReviewList(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
    }
  }, [activeSubTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (myBranches.length > 0 && selectedBranchId === 0) {
      setSelectedBranchId(myBranches[0].id);
    }
  }, [myBranches, selectedBranchId]);

  const handleOpenAddModal = () => {
    setEmail('');
    setSelectedBranchId(myBranches[0]?.id || 0);
    setIsAddModalOpen(true);
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error(t.TOAST.EMAIL_REQUIRED); return; }
    try {
      await restaurantService.inviteStaff({ email: email.trim().toLowerCase(), restaurantId: selectedBranchId });
      toast.success(t.TOAST.INVITE_SUCCESS(email));
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.INVITE_ERROR);
    }
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setEmail(staff.email);
    setSelectedBranchId(staff.restaurantId);
    setStatus(staff.status);
    setIsEditModalOpen(true);
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingStaffId) { toast.error(t.TOAST.NAME_REQUIRED); return; }
    try {
      await restaurantService.updateStaff(editingStaffId, { name, restaurantId: selectedBranchId, status });
      toast.success(t.TOAST.UPDATE_SUCCESS);
      setIsEditModalOpen(false);
      setEditingStaffId(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.UPDATE_ERROR);
    }
  };

  const handleOpenReviewModal = (staff: StaffMember) => {
    setReviewStaffId(staff.id);
    setReviewStaffName(staff.name);
    setRating(5);
    setFeedback('');
    setIsReviewModalOpen(true);
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewStaffId) return;
    try {
      await restaurantService.createStaffReview(reviewStaffId, rating, feedback);
      toast.success(t.TOAST.REVIEW_SUCCESS(reviewStaffName));
      setIsReviewModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.REVIEW_ERROR);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    const confirm = window.confirm(t.TOAST.DISMISS_CONFIRM(staffName));
    if (confirm) {
      try {
        await restaurantService.deleteStaff(id);
        toast.success(t.TOAST.DISMISS_SUCCESS);
        fetchData();
      } catch (error) { toast.error(t.TOAST.DISMISS_ERROR); }
    }
  };

  const handleRevokeInvitation = async (id: string, invitedEmail: string) => {
    const confirm = window.confirm(t.TOAST.REVOKE_CONFIRM(invitedEmail));
    if (confirm) {
      try {
        await restaurantService.revokeInvitation(id);
        toast.success(t.TOAST.REVOKE_SUCCESS);
        fetchData();
      } catch (error) { toast.error(t.TOAST.REVOKE_ERROR); }
    }
  };

  const toggleStatus = async (staff: StaffMember) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await restaurantService.updateStaff(staff.id, { status: nextStatus });
      toast.success(t.TOAST.STATUS_CHANGE_SUCCESS(nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khoá'));
      fetchData();
    } catch (error) { toast.error(t.TOAST.STATUS_CHANGE_ERROR); }
  };

  const getBranchName = (branchId: number) => {
    const branch = myBranches.find((b) => b.id === branchId);
    return branch ? branch.name : `Chi nhánh ID ${branchId}`;
  };

  return {
    activeSubTab, setActiveSubTab,
    staffList, invitationList, historyList, reviewList,
    isAddModalOpen, setIsAddModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isReviewModalOpen, setIsReviewModalOpen,
    name, setName,
    email, setEmail,
    selectedBranchId, setSelectedBranchId,
    status, setStatus,
    rating, setRating,
    feedback, setFeedback,
    reviewStaffName,
    handleOpenAddModal,
    handleInviteStaff,
    handleOpenEditModal,
    handleEditStaff,
    handleOpenReviewModal,
    handleCreateReview,
    handleDeleteStaff,
    handleRevokeInvitation,
    toggleStatus,
    getBranchName,
  };
}
