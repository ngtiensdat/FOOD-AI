// Mục đích: Quản lý toàn bộ logic nghiệp vụ AI Chat bao gồm gửi/nhận tin nhắn, quản lý đa hội thoại, ngữ cảnh thời tiết và định vị GPS.
// Ý nghĩa: Được gọi bởi AiChatWindow.tsx để tách biệt hoàn toàn logic điều khiển hội thoại và giao diện hiển thị.
// Chức năng đặc biệt: Quản lý đa hội thoại như ChatGPT, tự động đồng bộ hóa thời tiết từ GPS, hỗ trợ phản hồi nhanh sinh động từ AI và hệ thống phản hồi hữu ích (feedback).
// Design Pattern: Custom Hook pattern, Separation of Concerns (SoC).
// Biến, hàm đặc biệt: useAiChat, sendDirectMessage, handleCreateNewChat, handleDeleteChat, handleFeedback.
import { useState, useEffect, useRef, useCallback } from 'react';
import { aiService } from '@/services/ai.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { useGeolocation } from '@/hooks/useGeolocation';

import { useAuth } from '@/hooks/useAuth';

import { FoodCardData } from '@/components/features/food/FoodCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: FoodCardData[];
  isAuthPrompt?: boolean;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isRaining: boolean;
  rainMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  description: string;
}

interface UseAiChatParams {
  initialMessage?: string;
  onResetChat?: () => void;
}

interface DBConversationItem {
  id: number;
  title: string;
  createdAt: string;
}

interface DBMessage {
  id: number | string;
  role: string;
  content: string;
}

// Bộ nhớ đệm ngoài hook để chống gửi trùng lặp do React Strict Mode hoặc Remount
const sentInitialMessages = new Set<string>();

export function useAiChat({ initialMessage, onResetChat }: UseAiChatParams) {
  const { isAuthenticated, loading: isAuthLoading, user } = useAuth();

  if (!initialMessage && sentInitialMessages.size > 0) {
    sentInitialMessages.clear();
  }

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

  // Bộ điều khiển Ngữ cảnh thời tiết thực tế tự động từ GPS
  const [showConfig, setShowConfig] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  // Tọa độ GPS (Sử dụng useGeolocation hook chuẩn hóa)
  const [useGps, setUseGps] = useState(true);
  const {
    lat,
    setLat,
    lng,
    setLng,
    refreshGps: triggerRefreshGps
  } = useGeolocation(
    LABELS.AI_CHAT.CONFIG.GPS_DEFAULTS.LAT,
    LABELS.AI_CHAT.CONFIG.GPS_DEFAULTS.LNG
  );
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

  const loadConversations = useCallback(async (overrideActiveId?: number | null) => {
    const list = await aiService.getConversations();
    const currentActiveId = overrideActiveId !== undefined ? overrideActiveId : activeConversationId;
    const updatedList = list.map((c: DBConversationItem) => {
      if (
        c.id === currentActiveId &&
        c.title === LABELS.AI_CHAT.SIDEBAR.NEW_CHAT &&
        initialMessage
      ) {
        const tempTitle = initialMessage.length > 25 ? `${initialMessage.substring(0, 22)}...` : initialMessage;
        return { ...c, title: tempTitle };
      }
      return c;
    });
    setConversations(updatedList);
    return updatedList;
  }, [activeConversationId, initialMessage]);

  // Load danh sách cuộc trò chuyện khi component mount
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      const initialMsgs: ChatMessage[] = [];
      if (initialMessage) {
        initialMsgs.push({ id: 'user-init', role: 'user', content: initialMessage });
      }
      initialMsgs.push({
        id: 'auth-required',
        role: 'ai',
        content: LABELS.CUSTOMER.AI_LOGIN_REQUIRED,
        isAuthPrompt: true
      });
      setMessages(initialMsgs);
      setIsLoading(false);
      return;
    }

    let active = true;
    async function initChats() {
      setIsLoading(true);
      
      if (initialMessage) {
        // Nếu người dùng bắt đầu từ thanh Hero, tạo một cuộc hội thoại mới tinh để tách biệt hoàn toàn bối cảnh
        const newConv = await aiService.createConversation();
        if (newConv && active) {
          setActiveConversationId(newConv.id);
          await loadConversations(newConv.id);
        }
      } else {
        const list = await loadConversations();
        if (active) {
          if (list.length > 0) {
            // Tự động chọn cuộc hội thoại đầu tiên gần nhất
            setActiveConversationId(list[0].id);
          } else {
            // Tự động tạo cuộc trò chuyện mới tinh nếu chưa có
            const newConv = await aiService.createConversation();
            if (newConv && active) {
              setActiveConversationId(newConv.id);
              await loadConversations(newConv.id);
            }
          }
        }
      }
      if (active) {
        setIsLoading(false);
      }
    }
    initChats();
    return () => {
      active = false;
    };
  }, [initialMessage, isAuthenticated, isAuthLoading]);

  const loadConvHistory = useCallback(async (convId: number) => {
    if (!convId) return;
    setIsLoading(true);
    try {
      const detail = await aiService.getConversationDetail(convId);
      if (detail) {
        if (detail.messages) {
          const mapped: ChatMessage[] = detail.messages.map((m: DBMessage) => ({
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
  }, []);

  // Tải chi tiết lịch sử tin nhắn của cuộc trò chuyện hiện tại
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Nếu có activeInitialMessage và chưa gửi, ta giữ nguyên state messages là [{ id: 'user-init', ... }] để nó tự động gửi
    if (activeInitialMessage && !hasSentInitial.current) {
      setIsHistoryLoaded(true);
      return;
    }

    if (activeConversationId) {
      loadConvHistory(activeConversationId);
    }
  }, [activeConversationId]);

  const reloadActiveConversation = useCallback(() => {
    if (activeConversationId) {
      loadConvHistory(activeConversationId);
    }
  }, [activeConversationId, loadConvHistory]);

  // Định vị GPS đã được tự động xử lý bởi useGeolocation hook

  // Tự động lấy dữ liệu thời tiết thực khi tọa độ GPS thay đổi
  useEffect(() => {
    if (!isAuthenticated || !lat || !lng) return;
    let active = true;
    async function fetchWeather() {
      setIsWeatherLoading(true);
      try {
        const data = await aiService.getWeather(lat, lng);
        if (active && data) {
          setWeather(data);
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
      } finally {
        if (active) {
          setIsWeatherLoading(false);
        }
      }
    }
    fetchWeather();
    return () => {
      active = false;
    };
  }, [lat, lng, isAuthenticated]);

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
      undefined,
      undefined,
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

    // Lưu thông tin thời tiết trả về từ response
    if (response && response.weather) {
      setWeather(response.weather);
    }

    // Lưu quick replies sinh ra động bởi AI từ Backend
    setQuickReplies(response.quickReplies || []);
    setIsLoading(false);

    // Tải lại danh sách hội thoại để cập nhật tiêu đề cuộc trò chuyện mới sinh
    await loadConversations();
  };

  // Tự động gửi initialMessage lên API khi lịch sử đã load xong
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    async function sendInitial() {
      if (isHistoryLoaded && activeInitialMessage && !hasSentInitial.current && activeConversationId) {
        // Kiểm tra chống trùng lặp ở mức module
        const dedupeKey = `${activeConversationId}-${activeInitialMessage}`;
        if (sentInitialMessages.has(dedupeKey)) {
          if (active) {
            setActiveInitialMessage(undefined);
          }
          return;
        }
        sentInitialMessages.add(dedupeKey);

        hasSentInitial.current = true;
        const msgToSend = activeInitialMessage;
        if (active) {
          setActiveInitialMessage(undefined); // Xóa ngay để tránh gửi lại khi đổi chat hoặc tạo mới
          setIsLoading(true);
        }
        try {
          const currentLat = useGps ? lat : undefined;
          const currentLng = useGps ? lng : undefined;

          const response = await aiService.chat(
            msgToSend,
            currentLat,
            currentLng,
            city,
            district,
            undefined,
            undefined,
            activeConversationId
          );

          if (active) {
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
            
            if (response && response.weather) {
              setWeather(response.weather);
            }

            setQuickReplies(response.quickReplies || []);

            // Tải lại danh sách hội thoại để cập nhật tiêu đề cuộc trò chuyện
            await loadConversations();
          }
        } catch (err) {
          console.error(LABELS.AI_CHAT.TOAST.SEND_FIRST_ERROR, err);
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }
    }
    sendInitial();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, activeConversationId]);

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
  const refreshGps = async () => {
    const pos = await triggerRefreshGps();
    if (pos) {
      setUseGps(true);
      toast.success(LABELS.AI_CHAT.TOAST.GPS_SUCCESS);
    } else {
      toast.error(LABELS.AI_CHAT.TOAST.GPS_ERROR);
    }
  };

  const handleFeedback = async (foodId: number, type: 'LIKE' | 'DISLIKE') => {
    if (!activeConversationId) return;

    try {
      const success = await aiService.submitFeedback(activeConversationId, foodId, type);
      if (success) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.suggestions) {
              const updatedSuggestions = msg.suggestions.map((s) => {
                if (s.id === foodId) {
                  return { ...s, feedback: s.feedback === type ? undefined : type };
                }
                return s;
              });
              return { ...msg, suggestions: updatedSuggestions };
            }
            return msg;
          }),
        );
        toast.success(
          type === 'LIKE'
            ? LABELS.AI_CHAT.TOAST.FEEDBACK_LIKE_SUCCESS
            : LABELS.AI_CHAT.TOAST.FEEDBACK_DISLIKE_SUCCESS,
        );
      }
    } catch (err) {
      console.error('Error submitting feedback', err);
      toast.error(LABELS.AI_CHAT.TOAST.FEEDBACK_ERROR);
    }
  };

  return {
    isAuthenticated,
    user,
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
    weather,
    isWeatherLoading,
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
    handleFeedback,
    reloadActiveConversation,
  };
}
