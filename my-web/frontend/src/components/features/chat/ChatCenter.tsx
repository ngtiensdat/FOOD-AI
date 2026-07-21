import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Search, Users, Plus, Check, CheckCheck, Inbox, AlertCircle, ArrowLeft, MoreVertical } from 'lucide-react';
import { chatService, Conversation, ChatMessage, ChatParticipant } from '@/services/chat.service';
import { useSocket } from '@/providers/socket-provider';
import { Avatar } from '@/components/base/Avatar';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { toast } from '@/store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatCenterProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const ChatCenter = ({ userId, isOpen, onClose, onOpen }: ChatCenterProps) => {
  const { socket, isConnected } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'requests'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [minimizedUnreadCount, setMinimizedUnreadCount] = useState(0);
  
  // Search & Group states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatParticipant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<ChatParticipant[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [hasInboxUnread, setHasInboxUnread] = useState(false);
  const [hasRequestsUnread, setHasRequestsUnread] = useState(false);

  const checkUnreadStatus = useCallback(async (
    inboxList?: Conversation[],
    requestsList?: Conversation[]
  ) => {
    try {
      // Reuse already-fetched lists if provided, otherwise fetch fresh
      const inbox = inboxList ?? await chatService.getConversations('inbox');
      const requests = requestsList ?? await chatService.getConversations('requests');
      
      const inboxUnread = inbox.some(
        c => c.lastMessage && !(c.lastMessage as any).isRead && c.lastMessage.sender.id !== userId
      );
      const requestsUnread = requests.some(
        c => c.participants.find(p => p.id === userId)?.isAccepted === false
      );
      
      setHasInboxUnread(inboxUnread);
      setHasRequestsUnread(requestsUnread);
    } catch (e) {
      console.warn('Lỗi kiểm tra chấm đỏ:', e);
    }
  }, [userId]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations(activeSubTab);
      setConversations(data || []);
      // Reuse the fetched data to compute unread status, no extra API calls
      if (activeSubTab === 'inbox') {
        await checkUnreadStatus(data, undefined);
      } else {
        await checkUnreadStatus(undefined, data);
      }
    } catch (err) {
      console.error('Lỗi tải cuộc hội thoại:', err);
    }
  }, [activeSubTab, checkUnreadStatus]);

  async function loadMessages(id: number) {
    try {
      const data = await chatService.getMessages(id);
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]); // use stable ID not object reference to prevent re-renders

  // Handle Socket message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: number; message: ChatMessage }) => {
      // Append message if this conversation is active
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        
        // Auto mark as read on backend if open, otherwise count as unread for the floating chat head
        if (isOpen) {
          chatService.getMessages(data.conversationId);
        } else {
          setMinimizedUnreadCount((prev) => prev + 1);
        }
      }
      
      // Refresh conversations list to update lastMessage and sorting (only when panel is visible)
      if (isOpen) {
        loadConversations();
      }
    };

    socket.on('direct_message', handleNewMessage);

    return () => {
      socket.off('direct_message', handleNewMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedConversation?.id, isOpen, loadConversations]);

  // Reset minimized count when opened
  useEffect(() => {
    if (isOpen) {
      setMinimizedUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await chatService.searchUsers(val);
      setSearchResults(results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = async (user: ChatParticipant) => {
    try {
      const conv = await chatService.createDirectChat(user.id);
      setSearchQuery('');
      setSearchResults([]);
      
      // Construct a conversation object to activate immediately
      const fullConv: Conversation = {
        id: conv.id,
        name: user.name,
        isGroup: false,
        creatorId: null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: [
          { id: userId, name: '', email: '', role: '', avatar: null, isAccepted: true },
          user,
        ],
        lastMessage: null,
      };

      // Find if already exists in local list, else prepend
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [fullConv, ...prev];
      });

      setSelectedConversation(fullConv);
      setIsCreatingGroup(false);
    } catch (err) {
      toast.error('Không thể bắt đầu trò chuyện');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedGroupUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    try {
      const conv = await chatService.createGroupChat(
        groupName.trim(),
        selectedGroupUsers.map((u) => u.id),
      );
      toast.success('Đã tạo nhóm trò chuyện thành công!');
      
      setGroupName('');
      setSelectedGroupUsers([]);
      setIsCreatingGroup(false);
      
      // Select the new group
      const fullConv: Conversation = {
        id: conv.id,
        name: groupName.trim(),
        isGroup: true,
        creatorId: userId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: [
          { id: userId, name: '', email: '', role: '', avatar: null, isAccepted: true },
          ...selectedGroupUsers,
        ],
        lastMessage: null,
      };

      setSelectedConversation(fullConv);
      loadConversations();
    } catch (err) {
      toast.error('Không thể tạo nhóm trò chuyện');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const txt = messageText.trim();
    setMessageText('');

    try {
      const msg = await chatService.sendMessage(selectedConversation.id, txt);
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    } catch (err) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedConversation) return;
    try {
      await chatService.acceptRequest(selectedConversation.id);
      toast.success('Đã chấp nhận yêu cầu trò chuyện');
      
      // Update local acceptance state
      setSelectedConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === userId ? { ...p, isAccepted: true } : p,
          ),
        };
      });

      // Reload conversations
      loadConversations();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi chấp nhận');
    }
  };

  const toggleGroupParticipant = (user: ChatParticipant) => {
    setSelectedGroupUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const getChatPartner = (conv: Conversation) => {
    if (conv.isGroup) return { name: conv.name || 'Nhóm Trò Chuyện', avatar: null };
    const partner = conv.participants.find((p) => p.id !== userId);
    return {
      name: partner?.name || 'Người dùng Food AI',
      avatar: partner?.avatar || null,
      role: partner?.role || '',
    };
  };

  return (
    <AnimatePresence>
      {/* 1. SIDE-IN LIST DRAWER - Only open if isOpen is true AND no active conversation is selected */}
      {isOpen && !selectedConversation && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
            className="w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl relative z-10 flex flex-col rounded-l-3xl border-l border-gray-100 dark:border-slate-900"
          >
            {/* Header Area */}
            <div className="p-4 border-b border-gray-50 dark:border-slate-900 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-primary" size={22} />
                <span className="font-black text-base text-gray-800 dark:text-white">Trung tâm tin nhắn</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ------------------- CONVERSATIONS LIST & SEARCH VIEW ------------------- */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
              
              {/* Search Bar / Group Toggle Header */}
              <div className="p-3 border-b border-gray-50 dark:border-slate-900 space-y-3 bg-gray-50/20 dark:bg-slate-900/10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl outline-none text-xs font-bold text-gray-750 dark:text-slate-200 focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Create Group Chat Toggle Button */}
                {!isCreatingGroup ? (
                  <button
                    onClick={() => setIsCreatingGroup(true)}
                    className="w-full py-2 px-3 border border-dashed border-primary/40 text-primary hover:border-primary font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-primary/[0.02]"
                  >
                    <Plus size={14} />
                    Tạo nhóm trò chuyện mới
                  </button>
                ) : (
                  // Group Creation Panel
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-3.5 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center pb-1.5 border-b border-gray-50 dark:border-slate-800/80">
                      <span className="text-xs font-black uppercase text-gray-800 dark:text-white flex items-center gap-1"><Users size={14} /> Thiết lập nhóm</span>
                      <button onClick={() => setIsCreatingGroup(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>

                    <Input
                      variant="none"
                      placeholder="Đặt tên cho nhóm..."
                      value={groupName}
                      onChange={(e) => setGroupName((e.target as HTMLInputElement).value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl"
                    />

                    {/* Selected group users badges */}
                    {selectedGroupUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {selectedGroupUsers.map((u) => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/15 text-[10px] font-black px-2 py-0.5 rounded-lg">
                            {u.name}
                            <button onClick={() => toggleGroupParticipant(u)} className="hover:text-red-500"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={handleCreateGroup}
                      disabled={!groupName.trim() || selectedGroupUsers.length === 0}
                      className="w-full py-2 text-[10px] font-black uppercase tracking-wide bg-primary hover:bg-primary-light"
                    >
                      Tạo nhóm ({selectedGroupUsers.length})
                    </Button>
                  </div>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {searchQuery.trim() && (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-900 bg-white dark:bg-slate-950">
                  <span className="block px-4 py-2 text-[9px] font-black uppercase text-gray-400 bg-slate-50/50 dark:bg-slate-900/30">Kết quả tìm kiếm</span>
                  {isSearching ? (
                    <div className="text-center py-8 text-xs font-bold text-gray-400">Đang tìm...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-gray-400">Không tìm thấy người dùng nào</div>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (isCreatingGroup) {
                            toggleGroupParticipant(user);
                          } else {
                            startChat(user);
                          }
                        }}
                        className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={user.name} size={32} />
                          <div>
                            <h4 className="text-xs font-black text-gray-800 dark:text-white">{user.name}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{user.email}</p>
                          </div>
                        </div>
                        
                        {isCreatingGroup ? (
                          <input
                            type="checkbox"
                            checked={selectedGroupUsers.some((u) => u.id === user.id)}
                            onChange={() => {}}
                            className="w-4 h-4 accent-primary"
                          />
                        ) : (
                          <Plus size={16} className="text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STANDARD INBOX/REQUESTS SUBTABS */}
              {!searchQuery.trim() && (
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
                  {/* Subtab selection headers */}
                  <div className="grid grid-cols-2 text-center border-b border-gray-50 dark:border-slate-900 select-none">
                    <button
                      onClick={() => setActiveSubTab('inbox')}
                      className={`py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeSubTab === 'inbox'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span>Hộp thư</span>
                      {hasInboxUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveSubTab('requests')}
                      className={`py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeSubTab === 'requests'
                          ? 'border-primary text-primary animate-pulse'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span>Tin nhắn chờ</span>
                      {hasRequestsUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Conversations list area */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-50/60 dark:divide-slate-900/60 custom-scrollbar bg-slate-50/10">
                    {conversations.length === 0 ? (
                      <div className="text-center py-20 text-gray-400 space-y-2">
                        <Inbox className="mx-auto text-gray-300 dark:text-slate-700" size={36} />
                        <p className="text-xs font-bold">Không có cuộc trò chuyện nào</p>
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const partner = getChatPartner(conv);
                        const isUnread = conv.lastMessage && !(conv.lastMessage as any).isRead && conv.lastMessage.sender.id !== userId;
                        const isPendingRequest = !conv.isGroup && conv.participants.find(p => p.id === userId)?.isAccepted === false;
                        const showDot = isUnread || (activeSubTab === 'requests' && isPendingRequest);
                        return (
                          <div
                            key={conv.id}
                            onClick={() => {
                              setSelectedConversation(conv);
                              onClose(); // Hide list drawer, open small floating box instead!
                            }}
                            className="p-3.5 flex items-center gap-3.5 hover:bg-white dark:hover:bg-slate-900/40 cursor-pointer transition-colors relative"
                          >
                            {/* Left Avatar */}
                            <Avatar src={partner.avatar} name={partner.name} size={38} className="shrink-0 border border-white dark:border-slate-800" />
                            
                            {/* Middle conversation details */}
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className={`text-xs text-gray-800 dark:text-white truncate pr-2 ${showDot ? 'font-black' : 'font-bold'}`}>
                                  {partner.name}
                                </h4>
                                <span className="text-[9px] text-gray-400 font-bold shrink-0">
                                  {new Date(conv.updatedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                                </span>
                              </div>
                              <p className={`text-[10px] truncate leading-relaxed ${showDot ? 'text-gray-900 dark:text-slate-100 font-bold' : 'text-gray-400 font-semibold'}`}>
                                {conv.lastMessage 
                                  ? `${conv.lastMessage.sender.id === userId ? 'Bạn' : conv.lastMessage.sender.name}: ${conv.lastMessage.content}` 
                                  : 'Bắt đầu cuộc hội thoại mới...'}
                              </p>
                            </div>

                            {/* Red dot indicator */}
                            {showDot && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shrink-0 shadow-sm" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}

      {/* 2. FLOATING ACTIVE CHAT BOX - If isOpen is true AND selectedConversation is NOT null */}
      {isOpen && selectedConversation && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-0 right-12 md:right-24 z-50 w-80 sm:w-96 h-[460px] bg-white dark:bg-slate-950 shadow-2xl rounded-t-[20px] border border-gray-250 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          {/* Header Area (Messenger styling) */}
          <div className="p-3 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-primary text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  onOpen(); // Reopen lists drawer!
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer shrink-0"
                title="Quay lại danh sách"
              >
                <ArrowLeft size={16} />
              </button>

              <Avatar
                src={getChatPartner(selectedConversation).avatar}
                name={getChatPartner(selectedConversation).name}
                size={32}
                className="border border-white/20 shrink-0"
              />

              <div className="min-w-0">
                <h4 className="text-[11px] font-black truncate pr-1 text-white">
                  {getChatPartner(selectedConversation).name}
                </h4>
                <span className="text-[9px] text-white/80 font-bold block uppercase tracking-wide">
                  {selectedConversation.isGroup 
                    ? `${selectedConversation.participants.length} thành viên`
                    : 'Đang hoạt động'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Minimize button */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <span className="block w-2.5 h-0.5 bg-white rounded-full" />
              </button>
              {/* Close button */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Warning requests panel */}
          {activeSubTab === 'requests' && !selectedConversation.participants.find(p => p.id === userId)?.isAccepted && (
            <div className="p-3 bg-orange-50/50 dark:bg-amber-950/10 border-b border-orange-100 dark:border-amber-950/20 text-center space-y-1.5 shrink-0">
              <AlertCircle className="mx-auto text-amber-500" size={20} />
              <p className="text-[10px] font-bold text-gray-600 dark:text-slate-350 max-w-xs mx-auto">
                Bạn và người này không follow nhau. Chấp nhận yêu cầu để chat.
              </p>
              <Button onClick={handleAcceptRequest} className="text-[9px] py-1 px-3 font-black rounded-lg">
                Chấp nhận
              </Button>
            </div>
          )}

          {/* Scrollable Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/50">
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === userId;
              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <Avatar
                      src={msg.sender?.profile?.avatar}
                      name={msg.sender?.name}
                      size={24}
                    />
                  )}

                  <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 shadow-sm text-xs font-semibold ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-800/80 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed break-words text-[11px]">{msg.content}</p>
                    <span className={`text-[8px] font-bold block mt-0.5 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input field */}
          {(activeSubTab === 'inbox' || selectedConversation.participants.find(p => p.id === userId)?.isAccepted) && (
            <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-950 flex gap-2 shrink-0">
              <Input
                variant="none"
                type="text"
                placeholder="Aa"
                value={messageText}
                onChange={(e) => setMessageText((e.target as HTMLInputElement).value)}
                className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold rounded-full outline-none focus:border-primary text-gray-700 dark:text-slate-200"
              />
              <Button
                type="submit"
                disabled={!messageText.trim()}
                className="p-2 bg-primary text-white rounded-full hover:bg-primary-light flex items-center justify-center shrink-0 border-none"
              >
                <Send size={14} />
              </Button>
            </form>
          )}
        </motion.div>
      )}

      {/* Floating Chat Head Bubble when minimized (like Facebook Messenger) */}
      {!isOpen && selectedConversation && (
        <motion.div
          initial={{ scale: 0, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: 50, opacity: 0 }}
          className="fixed bottom-24 right-6 z-50 group flex items-center"
        >
          <div className="relative cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 shadow-2xl rounded-full">
            {/* Avatar circle */}
            <div 
              onClick={onOpen}
              className="w-14 h-14 rounded-full border-2 border-primary bg-white dark:bg-slate-900 p-0.5 flex items-center justify-center relative overflow-hidden"
              title={getChatPartner(selectedConversation).name}
            >
              <Avatar
                src={getChatPartner(selectedConversation).avatar}
                name={getChatPartner(selectedConversation).name}
                size={52}
                className="rounded-full object-cover"
              />
              
              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>

            {/* Notification Badge if new message arrives for this conversation */}
            {minimizedUnreadCount > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse border border-white">
                {minimizedUnreadCount}
              </span>
            )}

            {/* Close Button to dismiss chat head */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedConversation(null);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 dark:bg-slate-800 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md border border-white text-[9px] cursor-pointer"
              aria-label="Đóng cuộc hội thoại"
            >
              <X size={10} />
            </button>

            {/* Tooltip name tag showing on hover */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-950/95 dark:bg-slate-900/95 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-800">
              {getChatPartner(selectedConversation).name}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
