'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Plus, Award, Star, Flame, Trophy, Shield, Clock, Globe, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

// Services & Components
import { useAuth } from '@/hooks/useAuth';
import { useProfileData } from '@/hooks/useProfileData';
import { useSocialActions } from '@/hooks/useSocialActions';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { socialService } from '@/services/social.service';
import { addNotification } from '@/utils/notifications';
import { User, UserRole } from '@/types/user';
import { Navbar } from '@/components/features/Navbar';
import { LevelUpModal } from '@/components/features/badges/LevelUpModal';
import { LABELS } from '@/constants/labels';
import { GAMIFICATION_CONSTANTS } from '@/constants/gamification.constant';
import { Avatar } from '@/components/base/Avatar';
import { toast } from '@/store/useToastStore';
import { Button } from '@/components/base/Button';

// Modular Feature Components
import { PostCard, PostData } from '@/components/features/profile/PostCard';
import { CreatePostModal } from '@/components/features/profile/CreatePostModal';
import { ReportModal } from '@/components/features/profile/ReportModal';

// Forum Configurations (Fixes hardcoded settings / magic values)
const FORUM_CONFIG = {
  PAGINATION_LIMIT: 10,
  SEEN_POSTS_STORAGE_KEY: 'food_ai_seen_posts',
  OBSERVER_THRESHOLD: 0.2,
  TABS: {
    ALL: 'all',
    FOLLOWING: 'following',
  } as const,
};

export default function ForumPage() {
  const { user: me, login } = useAuth();
  const { profile, actions } = useProfileData(me?.id ? String(me.id) : null);
  const router = useRouter();

  // Social Feed local states
  const [posts, setPosts] = useState<PostData[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [feedTab, setFeedTab] = useState<'all' | 'following'>(FORUM_CONFIG.TABS.ALL);
  
  // Seen posts & pagination states
  const [seenPostIds, setSeenPostIds] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(FORUM_CONFIG.PAGINATION_LIMIT);

  // Load seen posts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FORUM_CONFIG.SEEN_POSTS_STORAGE_KEY);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as number[];
        setSeenPostIds(new Set(ids));
      } catch (e) {
        console.error('Error parsing seen posts:', e);
      }
    }
  }, []);

  const handleMarkAsSeen = (postId: number) => {
    setSeenPostIds((prev) => {
      if (prev.has(postId)) return prev;
      const next = new Set(prev);
      next.add(postId);
      localStorage.setItem(FORUM_CONFIG.SEEN_POSTS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Load posts
  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await socialService.getPosts();
        setPosts(data || []);
      } catch (err) {
        console.error('Error loading posts:', err);
      }
    }
    loadPosts();
  }, []);

  // Fetch following list
  useEffect(() => {
    if (me?.id) {
      authService.getFollowing(me.id)
        .then((data: { users?: { id: number }[]; restaurants?: { id: number }[] }) => {
          const followedUserIds = data?.users?.map((u) => u.id) || [];
          const followedRestaurantIds = data?.restaurants?.map((u) => u.id) || [];
          setFollowingIds([...followedUserIds, ...followedRestaurantIds]);
        })
        .catch((err: unknown) => console.error('Lỗi lấy danh sách theo dõi:', err));
    }
  }, [me?.id]);

  // Load Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const users = await userService.getLeaderboard();
        setLeaderboard(users || []);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    fetchLeaderboard();
  }, []);

  // Intersection observer to track posts seen by user
  useEffect(() => {
    if (posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postIdStr = entry.target.getAttribute('data-post-id');
            if (postIdStr) {
              const postId = parseInt(postIdStr, 10);
              if (!isNaN(postId)) {
                handleMarkAsSeen(postId);
              }
            }
          }
        });
      },
      { threshold: FORUM_CONFIG.OBSERVER_THRESHOLD }
    );

    const elements = document.querySelectorAll('.post-card-observer');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [posts, seenPostIds]);

  // Centralized social interactions & reports hook
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportTargetId,
    setReportTargetId,
    reportTargetType,
    setReportTargetType,
    handleCreatePost,
    handleLike,
    handleComment,
    handleOpenReport,
    handleReportSubmitted,
    handleShare,
    handleDeleteComment,
    handleReplyComment,
    handleDeleteReply,
    handleDeletePost,
    isLevelUpModalOpen,
    setIsLevelUpModalOpen,
    levelUpData,
  } = useSocialActions({
    posts,
    setPosts,
    profile,
    me,
    actions,
    login,
    isProfilePage: false,
  });

  return (
    <div className="page-container min-h-screen">
      <Navbar activeTab="forum" setActiveTab={() => {}} />

      <div className="w-full px-6 md:px-12 pt-24 lg:h-screen lg:overflow-hidden pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-stretch">
          
          {/* Left Column: Personal info or Community Welcome (col-span-3) */}
          <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto scrollbar-hide pb-8">
            {profile ? (
              <div className="card-premium p-6 space-y-5 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-500/10">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                  <Avatar src={profile.profile?.avatar} name={me?.name} size={60} className="border-2 border-white shadow shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-gray-800 dark:text-white truncate text-base">{me?.name}</h4>
                    <span className="text-mini font-bold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md mt-1 inline-flex items-center gap-1">
                      <img src="/images/badges/badge_star.png" alt="Star" className="w-3.5 h-3.5 object-contain shrink-0" />
                      <span>{profile.badgeTitle || LABELS.SOCIAL.SIDEBAR.NEW_MEMBER}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">{LABELS.SOCIAL.SIDEBAR.LEVEL}</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white mt-1 block">Lv. {profile.level || 1}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">{LABELS.SOCIAL.SIDEBAR.POINTS}</span>
                    <span className="text-xl font-black text-amber-500 mt-1 block">⭐ {profile.points || 0}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-mini text-gray-500 mb-1.5 font-bold">
                    <span>{LABELS.SOCIAL.SIDEBAR.LEVEL_PROGRESS}</span>
                    <span>{(profile.xp || 0) % GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL} / {GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL} XP</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-gray-200/50 dark:border-slate-700">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(GAMIFICATION_CONSTANTS.MIN_XP_PERCENT, (((profile.xp || 0) % GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL) / GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL) * GAMIFICATION_CONSTANTS.PERCENT_FACTOR)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-premium p-6 text-center space-y-4">
                <Info size={32} className="text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-700">{LABELS.SOCIAL.SIDEBAR.JOIN_COMMUNITY}</h4>
                <p className="text-xs text-gray-400">{LABELS.SOCIAL.SIDEBAR.JOIN_COMMUNITY_DESC}</p>
                <Button
                  onClick={() => router.push('/login')}
                  variant="none"
                  size="none"
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow hover:shadow-md transition-all text-xs"
                >
                  {LABELS.SOCIAL.SIDEBAR.LOGIN_NOW}
                </Button>
              </div>
            )}

            {/* Bảng điều hướng bảng tin (Tất cả / Theo dõi) */}
            <div className="card-premium p-4 space-y-2">
              <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider px-3 mb-2">
                {LABELS.SOCIAL.SIDEBAR.FEED_MENU || 'Bảng tin'}
              </span>
              {[
                { id: FORUM_CONFIG.TABS.ALL, label: LABELS.SOCIAL.TAB_ALL, icon: Globe },
                { id: FORUM_CONFIG.TABS.FOLLOWING, label: LABELS.SOCIAL.TAB_FOLLOWING, icon: UserCheck, authRequired: true },
              ].map((tab) => {
                const isActive = feedTab === tab.id;
                const Icon = tab.icon;
                
                // Ẩn tab 'Theo dõi' nếu chưa đăng nhập
                if (tab.authRequired && !me) return null;

                return (
                  <Button
                    key={tab.id}
                    onClick={() => setFeedTab(tab.id as 'all' | 'following')}
                    variant="none"
                    size="none"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Main Feed (col-span-6) */}
          <div className="lg:col-span-6 space-y-6 lg:h-full lg:overflow-y-auto scrollbar-hide pb-8">

            {/* Write Post Trigger Card */}
            {profile && (
              <div className="card-container !p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl shadow-sm">
                <div className="flex gap-4">
                  <Avatar src={profile.profile?.avatar} name={me?.name} size={40} />
                  <Button 
                    onClick={() => setIsPostModalOpen(true)}
                    variant="none"
                    size="none"
                    className="flex-1 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full px-6 py-2.5 text-left text-gray-500 transition-all text-small font-bold flex items-center justify-between border border-gray-100 dark:border-slate-800"
                  >
                    <span>{LABELS.SETTINGS.PROFILE.POSTS.THINKING(me?.name || '')}</span>
                    <Plus size={18} className="text-primary" />
                  </Button>
                </div>
              </div>
            )}

            {/* Feed List */}
            {(() => {
              // 1. Filter out shared posts and filter by tab
              const filteredPosts = posts.filter((post) => {
                if (post.isShared) return false;
                
                // Show everything in the 'all' tab
                if (feedTab === FORUM_CONFIG.TABS.ALL) return true;

                // 'following' tab logic
                const authorId = post.author?.id;
                const isOwnPost = authorId && me?.id === authorId;
                const isFollowed = authorId && followingIds.includes(authorId);
                return isOwnPost || isFollowed;
              });

              // 2. Sort/Prioritize: Unseen posts first, Seen posts pushed to the bottom (restricted)
              const unseen = filteredPosts.filter(post => !seenPostIds.has(post.id));
              const seen = filteredPosts.filter(post => seenPostIds.has(post.id));
              const sortedPosts = [...unseen, ...seen];

              // 3. Paginate to visibleCount
              const displayedPosts = sortedPosts.slice(0, visibleCount);

              return sortedPosts.length === 0 ? (
                <div className="card-container !p-16 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                  <Info size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-400">{LABELS.SOCIAL.FEED_EMPTY}</h3>
                  <p className="text-gray-400 text-small mt-1">{LABELS.SOCIAL.FEED_EMPTY_DESC}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {displayedPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="post-card-observer" 
                      data-post-id={post.id}
                    >
                      <PostCard
                        post={post}
                        me={me}
                        onLike={handleLike}
                        onComment={handleComment}
                        onReport={handleOpenReport}
                        onShare={handleShare}
                        onDeleteComment={handleDeleteComment}
                        onReplyComment={handleReplyComment}
                        onDeleteReply={handleDeleteReply}
                        onDeletePost={handleDeletePost}
                      />
                    </div>
                  ))}

                  {/* Load More Button */}
                  {sortedPosts.length > visibleCount && (
                    <div className="text-center py-4">
                      <Button
                        onClick={() => setVisibleCount((prev) => prev + FORUM_CONFIG.PAGINATION_LIMIT)}
                        variant="none"
                        size="none"
                        className="px-8 py-3 rounded-full font-bold border border-primary text-primary hover:bg-primary/5 transition-all text-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <Clock size={14} className="animate-pulse" />
                        <span>{LABELS.SOCIAL.LOAD_MORE_POSTS}</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Leaderboard / Top Rank (col-span-3) */}
          <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto scrollbar-hide pb-8">
            {/* Leaderboard Card */}
            <div className="card-premium p-5 space-y-3">
              {/* Header with Title and Toggle Button */}
              <div
                onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                className="flex items-center justify-between cursor-pointer select-none group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsLeaderboardOpen(!isLeaderboardOpen);
                  }
                }}
                aria-expanded={isLeaderboardOpen}
                aria-label={isLeaderboardOpen ? LABELS.SOCIAL.SIDEBAR.TOGGLE_COLLAPSE : LABELS.SOCIAL.SIDEBAR.TOGGLE_EXPAND}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="text-amber-500" size={17} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-gray-800 dark:text-white truncate">
                      {LABELS.SOCIAL.SIDEBAR.LEADERBOARD_TITLE}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">Top 10 thành viên</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-gray-400 group-hover:text-primary transition-colors hidden sm:inline">
                    {isLeaderboardOpen ? LABELS.SOCIAL.SIDEBAR.TOGGLE_COLLAPSE : LABELS.SOCIAL.SIDEBAR.TOGGLE_EXPAND}
                  </span>
                  <div className="w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                    {isLeaderboardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isLeaderboardOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden pt-2 border-t border-gray-100 dark:border-slate-800/80"
                  >
                    {loadingLeaderboard ? (
                      <div className="space-y-3 py-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
                              <div className="h-2 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">{LABELS.SOCIAL.SIDEBAR.LEADERBOARD_EMPTY}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {leaderboard.slice(0, 10).map((item, idx) => {
                          const isTop1 = idx === 0;
                          const isTop2 = idx === 1;
                          const isTop3 = idx === 2;
                          return (
                            <div
                              key={item.id}
                              onClick={() => router.push(`/profile?id=${item.id}`)}
                              className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all cursor-pointer border ${
                                isTop1
                                  ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20'
                                  : isTop2
                                  ? 'bg-slate-500/5 hover:bg-slate-500/10 border-slate-300/30 dark:border-slate-700/40'
                                  : isTop3
                                  ? 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-900/60 border-transparent hover:border-gray-100 dark:hover:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Rank indicator */}
                                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                  {isTop1 ? (
                                    <img src="/images/badges/medal_gold.png" alt="Top 1" className="w-5 h-5 object-contain" />
                                  ) : isTop2 ? (
                                    <img src="/images/badges/medal_silver.png" alt="Top 2" className="w-5 h-5 object-contain" />
                                  ) : isTop3 ? (
                                    <img src="/images/badges/medal_bronze.png" alt="Top 3" className="w-5 h-5 object-contain" />
                                  ) : (
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">{idx + 1}</span>
                                  )}
                                </div>

                                <Avatar src={item.profile?.avatar} name={item.name} size={32} />

                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate text-xs leading-snug">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                    <span className="text-primary font-semibold">Lv.{item.level || 1}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[80px]">{item.badgeTitle || LABELS.SOCIAL.SIDEBAR.NEW}</span>
                                  </div>
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                                {item.points || 0} pts
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Create Post Modal */}
      {profile && (
        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onCreated={handleCreatePost}
        />
      )}

      {/* Content Violation Report Modal */}
      {isReportModalOpen && reportTargetId && (
        <ReportModal
          isOpen={isReportModalOpen}
          targetId={reportTargetId}
          targetType={reportTargetType}
          currentUserId={me?.id || 0}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitted={handleReportSubmitted}
        />
      )}

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        level={levelUpData?.level || 1}
        badge={levelUpData?.badge}
      />
    </div>
  );
}
