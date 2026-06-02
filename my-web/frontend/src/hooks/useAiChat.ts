/**
 * Mục đích file này để làm gì: Custom hook quản lý toàn bộ logic nghiệp vụ AI Chat (gửi/nhận tin nhắn, quản lý đa hội thoại, mock ngữ cảnh thời tiết và GPS).
 * Các file khác hay file này có ý nghĩa như nào: Được gọi bởi AiChatWindow.tsx (view component) để tách biệt hoàn toàn logic và giao diện.
 * Các chức năng đặc biệt: Quản lý đa hội thoại (tạo mới, chuyển đổi, xóa), gửi tin nhắn và nhận phản hồi AI, mock GPS và thời tiết cho kiểm thử.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Custom Hook pattern, Separation of Concerns (logic tách khỏi UI).
 * Các biến, hàm đặc biệt trong file: useAiChat(), sendMessage(), handleNewChat(), handleDeleteConversation(), handleSelectConversation().
 */
import { useState, useEffect, useRef } from 'react';
import { aiService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: any[];
}

interface UseAiChatParams {
  initialMessage?: string;
  onResetChat?: () => void;
}

export function useAiChat({ initialMessage, onResetChat }: UseAiChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessage) {
      return [{ id: 'user-init', role: 'user', content: initialMessage }];
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(!!initialMessage);
  const [quickReplies, setQuickReplies] = useState<{ label: string; text: string }[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [activeInitialMessage, setActiveInitialMessage] = useState<string | undefined>(initialMessage);

  // Các State Quản lý Đa Hội thoại tương tự ChatGPT
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<{ id: number; title: string; createdAt: string; messageCount?: number }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  // Bộ điều khiển Mock Ngữ cảnh (Thời tiết & Vị trí) để phục vụ kiểm thử
  const [showConfig, setShowConfig] = useState(false);
  const [temperature, setTemperature] = useState(28);
  const [isRaining, setIsRaining] = useState(false);
  
  // Tọa độ GPS (Mặc định là Quận 1, sẽ tự động ghi đè bằng GPS thật hoặc nhập tay)
  const [useGps, setUseGps] = useState(true);
  const [lat, setLat] = useState(LABELS.AI_CHAT.CONFIG.GPS_DEFAULTS.LAT); 
  const [lng, setLng] = useState(LABELS.AI_CHAT.CONFIG.GPS_DEFAULTS.LNG);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(LABELS.AI_CHAT.CONFIG.CITY_DEFAULTS.NAME);

  const chatFeedRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  // Tự động cuộn xuống dưới cùng bên trong container chat, không cuộn window
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  const loadConversations = async () => {
    const list = await aiService.getConversations();
    setConversations(list);
    return list;
  };

  // Load danh sách cuộc trò chuyện khi component mount
  useEffect(() => {
    async function initChats() {
      setIsLoading(true);
      
      if (initialMessage) {
        // Nếu người dùng bắt đầu từ thanh Hero, tạo một cuộc hội thoại mới tinh để tách biệt hoàn toàn bối cảnh
        const newConv = await aiService.createConversation();
        if (newConv) {
          setActiveConversationId(newConv.id);
          await loadConversations();
        }
      } else {
        const list = await loadConversations();
        if (list.length > 0) {
          // Tự động chọn cuộc hội thoại đầu tiên gần nhất
          setActiveConversationId(list[0].id);
        } else {
          // Tự động tạo cuộc trò chuyện mới tinh nếu chưa có
          const newConv = await aiService.createConversation();
          if (newConv) {
            setActiveConversationId(newConv.id);
            await loadConversations();
          }
        }
      }
      setIsLoading(false);
    }
    initChats();
  }, []);

  // Tải chi tiết lịch sử tin nhắn của cuộc trò chuyện hiện tại
  useEffect(() => {
    async function loadConvHistory() {
      if (!activeConversationId) return;
      
      // Nếu có activeInitialMessage và chưa gửi, ta giữ nguyên state messages là [{ id: 'user-init', ... }] để nó tự động gửi
      if (activeInitialMessage && !hasSentInitial.current) {
        setIsHistoryLoaded(true);
        return;
      }

      setIsLoading(true);
      try {
        const detail = await aiService.getConversationDetail(activeConversationId);
        if (detail) {
          if (detail.messages) {
            const mapped: ChatMessage[] = detail.messages.map((m: any) => ({
              id: String(m.id),
              role: m.role === 'USER' ? 'user' : 'ai',
              content: m.content,
            }));

            // Gắn suggestions vào tin nhắn AI cuối cùng trong lịch sử (nếu có)
            if (detail.suggestions && detail.suggestions.length > 0 && mapped.length > 0) {
              const lastAiMsgIndex = [...mapped].reverse().findIndex(m => m.role === 'ai');
              if (lastAiMsgIndex !== -1) {
                const actualIndex = mapped.length - 1 - lastAiMsgIndex;
                mapped[actualIndex].suggestions = detail.suggestions;
              }
            }
            setMessages(mapped);
          } else {
            setMessages([]);
          }
        }
        setQuickReplies([]);
      } catch (err) {
        console.error(LABELS.AI_CHAT.TOAST.LOAD_HISTORY_ERROR, err);
      } finally {
        setIsHistoryLoaded(true);
        setIsLoading(false);
      }
    }
    loadConvHistory();
  }, [activeConversationId]);

  // Tự động lấy tọa độ GPS thật của trình duyệt khi component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (error) => {
          console.warn(LABELS.AI_CHAT.TOAST.GPS_WARN, error);
        }
      );
    }
  }, []);

  // Hàm gửi tin nhắn trực tiếp (gọi từ handleSend, initialMessage, Quick Replies)
  const sendDirectMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Thêm tin nhắn của User vào UI trước
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setIsLoading(true);

    // Chuẩn bị tọa độ GPS
    const currentLat = useGps ? lat : undefined;
    const currentLng = useGps ? lng : undefined;

    // Gọi API chat và truyền thêm activeConversationId (nếu có)
    const response = await aiService.chat(
      text,
      currentLat,
      currentLng,
      city,
      district,
      temperature,
      isRaining,
      activeConversationId || undefined
    );

    // Thêm phản hồi của AI
    const aiMsgId = `ai-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { 
        id: aiMsgId, 
        role: 'ai', 
        content: response.reply || LABELS.AI_CHAT.CONFIRM.ERROR_FALLBACK,
        suggestions: response.suggestions || []
      }
    ]);

    // Lưu quick replies sinh ra động bởi AI từ Backend
    setQuickReplies(response.quickReplies || []);
    setIsLoading(false);

    // Tải lại danh sách hội thoại để cập nhật tiêu đề cuộc trò chuyện mới sinh
    await loadConversations();
  };

  // Tự động gửi initialMessage lên API khi lịch sử đã load xong
  useEffect(() => {
    async function sendInitial() {
      if (isHistoryLoaded && activeInitialMessage && !hasSentInitial.current && activeConversationId) {
        hasSentInitial.current = true;
        const msgToSend = activeInitialMessage;
        setActiveInitialMessage(undefined); // Xóa ngay để tránh gửi lại khi đổi chat hoặc tạo mới
        setIsLoading(true);
        try {
          const currentLat = useGps ? lat : undefined;
          const currentLng = useGps ? lng : undefined;

          const response = await aiService.chat(
            msgToSend,
            currentLat,
            currentLng,
            city,
            district,
            temperature,
            isRaining,
            activeConversationId
          );

          // Thêm phản hồi của AI
          const aiMsgId = `ai-${Date.now()}`;
          setMessages(prev => [
            ...prev,
            { 
              id: aiMsgId, 
              role: 'ai', 
              content: response.reply || LABELS.AI_CHAT.CONFIRM.ERROR_FALLBACK,
              suggestions: response.suggestions || []
            }
          ]);
          setQuickReplies(response.quickReplies || []);

          // Tải lại danh sách hội thoại để cập nhật tiêu đề cuộc trò chuyện
          await loadConversations();
        } catch (err) {
          console.error(LABELS.AI_CHAT.TOAST.SEND_FIRST_ERROR, err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    sendInitial();
  }, [isHistoryLoaded, activeInitialMessage, lat, lng, city, district, temperature, isRaining, useGps, activeConversationId]);

  // Xử lý gửi tin nhắn từ form
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    await sendDirectMessage(userText);
  };

  // Tạo cuộc trò chuyện mới tinh tương tự ChatGPT
  const handleCreateNewChat = async () => {
    // Cấm việc tạo đoạn chat mới nếu đã có một đoạn chat mới chưa có tin nhắn nào
    const emptyChat = conversations.find(
      (c) => c.messageCount === 0 || (c.title === LABELS.AI_CHAT.SIDEBAR.NEW_CHAT && (c.messageCount === 0 || c.messageCount === undefined))
    );
    if (emptyChat) {
      setActiveConversationId(emptyChat.id);
      setMessages([]);
      setQuickReplies([]);
      hasSentInitial.current = false;
      toast.info(LABELS.AI_CHAT.CONFIRM.EMPTY_CHAT_WARNING);
      return;
    }

    setIsLoading(true);
    const newConv = await aiService.createConversation();
    if (newConv) {
      setActiveConversationId(newConv.id);
      await loadConversations();
      setMessages([]);
      setQuickReplies([]);
      hasSentInitial.current = false;
    }
    setIsLoading(false);
  };

  // Xóa một cuộc trò chuyện cụ thể
  const handleDeleteChat = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    if (window.confirm(LABELS.AI_CHAT.CONFIRM.DELETE_CHAT)) {
      const success = await aiService.deleteConversation(convId);
      if (success) {
        const list = await loadConversations();
        if (activeConversationId === convId) {
          if (list.length > 0) {
            setActiveConversationId(list[0].id);
          } else {
            setActiveConversationId(null);
            setMessages([]);
            setQuickReplies([]);
            hasSentInitial.current = false;
            onResetChat?.(); // Gọi callback báo cho Hero thu nhỏ lại khi không còn hội thoại nào
          }
        }
      }
    }
  };

  // Làm mới tọa độ GPS bằng định vị thực tế của thiết bị
  const refreshGps = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setUseGps(true);
          toast.success(LABELS.AI_CHAT.TOAST.GPS_SUCCESS);
        },
        (error) => {
          toast.error(LABELS.AI_CHAT.TOAST.GPS_ERROR);
          console.warn(error);
        }
      );
    } else {
      toast.error(LABELS.AI_CHAT.TOAST.GPS_NOT_SUPPORTED);
    }
  };

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    quickReplies,
    isSidebarOpen,
    setIsSidebarOpen,
    conversations,
    activeConversationId,
    setActiveConversationId,
    showConfig,
    setShowConfig,
    temperature,
    setTemperature,
    isRaining,
    setIsRaining,
    district,
    city,
    setCity,
    useGps,
    setUseGps,
    lat,
    setLat,
    lng,
    setLng,
    chatFeedRef,
    sendDirectMessage,
    handleSend,
    handleCreateNewChat,
    handleDeleteChat,
    loadConversations,
    refreshGps,
    scrollToBottom,
  };
}
