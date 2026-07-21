// Mục đích file này để làm gì: Custom hook quản lý trạng thái và hành vi nghiệp vụ cho giao diện Quản lý thiết bị máy POS của Merchant.
// Các file khác hay file này có ý nghĩa như nào: Được gọi bởi component PosTerminalManager để tách biệt logic xử lý khỏi tầng giao diện.
// Các chức năng đặc biệt: Quản lý danh sách máy POS, thêm mới/chỉnh sửa máy POS, thay đổi trạng thái hoạt động, tải và xem nhật ký hoạt động (logs) của máy POS.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Custom Hook Pattern, Separation of Concerns.
// Các biến, hàm đặc biệt trong file: usePosTerminal, handleCreateTerminal, handleEditTerminal, handleDeleteTerminal, toggleStatus.
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/store/useToastStore';
import { posTerminalService, PosTerminal, PosTerminalLog } from '@/services/pos-terminal.service';
import { Restaurant } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';

export type PosTerminalSubTab = 'machines' | 'logs';

interface UsePosTerminalParams {
  myBranches: Restaurant[];
}

export function usePosTerminal({ myBranches }: UsePosTerminalParams) {
  const t = LABELS.RESTAURANT.POS_TERMINAL_MANAGER;

  const [activeSubTab, setActiveSubTab] = useState<PosTerminalSubTab>('machines');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);

  const [terminalList, setTerminalList] = useState<PosTerminal[]>([]);
  const [logList, setLogList] = useState<PosTerminalLog[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editingTerminalId, setEditingTerminalId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (myBranches.length > 0 && selectedBranchId === 0) {
      setSelectedBranchId(myBranches[0].id);
    }
  }, [myBranches, selectedBranchId]);

  const fetchData = useCallback(async () => {
    if (selectedBranchId === 0) return;
    try {
      if (activeSubTab === 'machines') {
        const data = await posTerminalService.getMyPosTerminals(selectedBranchId);
        setTerminalList(data);
      } else if (activeSubTab === 'logs') {
        const data = await posTerminalService.getPosTerminalLogs(selectedBranchId);
        setLogList(data);
      }
    } catch (error) {
      console.error('Lỗi khi nạp dữ liệu POS terminal:', error);
    }
  }, [selectedBranchId, activeSubTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setName('');
    const currentBranch = myBranches.find(b => b.id === selectedBranchId);
    const branchPrefix = currentBranch 
      ? currentBranch.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 10)
      : 'pos';
    setCode(`${branchPrefix}_`);
    setPassword('');
    setIsAddModalOpen(true);
  };

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t.NAME_REQUIRED);
      return;
    }
    if (!code.trim() || code.trim().length < 3) {
      toast.error(t.CODE_MIN_LENGTH);
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      toast.error(t.PASSWORD_MIN_LENGTH);
      return;
    }

    try {
      await posTerminalService.createPosTerminal({
        name: name.trim(),
        code: code.trim().toLowerCase(),
        password: password.trim(),
        restaurantId: selectedBranchId,
      });
      toast.success(t.CREATE_SUCCESS);
      setIsAddModalOpen(false);
      fetchData();
    } catch (error: any) {
      const errMsg = error?.message || 'Lỗi khi tạo máy POS.';
      toast.error(errMsg);
    }
  };

  const handleOpenEditModal = (terminal: PosTerminal) => {
    setEditingTerminalId(terminal.id);
    setName(terminal.name);
    setCode(terminal.code);
    setPassword('');
    setIsActive(terminal.isActive);
    setIsEditModalOpen(true);
  };

  const handleEditTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingTerminalId) {
      toast.error(t.NAME_REQUIRED);
      return;
    }

    try {
      await posTerminalService.updatePosTerminal(editingTerminalId, {
        name: name.trim(),
        password: password.trim() ? password.trim() : undefined,
        isActive,
      });
      toast.success(t.UPDATE_SUCCESS);
      setIsEditModalOpen(false);
      setEditingTerminalId(null);
      fetchData();
    } catch (error: any) {
      const errMsg = error?.message || 'Lỗi khi cập nhật máy POS.';
      toast.error(errMsg);
    }
  };

  const handleDeleteTerminal = async (id: number, terminalName: string) => {
    const confirm = window.confirm(t.CONFIRM_DELETE_MSG(terminalName));
    if (confirm) {
      try {
        await posTerminalService.deletePosTerminal(id);
        toast.success(t.DELETE_SUCCESS);
        fetchData();
      } catch (error) {
        toast.error(t.DELETE_ERROR);
      }
    }
  };

  const toggleStatus = async (terminal: PosTerminal) => {
    const nextStatus = !terminal.isActive;
    try {
      await posTerminalService.updatePosTerminal(terminal.id, { isActive: nextStatus });
      toast.success(
        nextStatus ? t.STATUS_ACTIVE_MSG(terminal.name) : t.STATUS_INACTIVE_MSG(terminal.name)
      );
      fetchData();
    } catch (error) {
      toast.error(t.STATUS_UPDATE_ERROR);
    }
  };

  return {
    activeSubTab,
    setActiveSubTab,
    selectedBranchId,
    setSelectedBranchId,
    terminalList,
    logList,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    name,
    setName,
    code,
    setCode,
    password,
    setPassword,
    isActive,
    setIsActive,
    handleOpenAddModal,
    handleCreateTerminal,
    handleOpenEditModal,
    handleEditTerminal,
    handleDeleteTerminal,
    toggleStatus,
  };
}
