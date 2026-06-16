'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/features/Navbar';
import { Footer } from '@/components/features/Footer';
import { Button } from '@/components/base/Button';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';
import { LABELS } from '@/constants/labels';
import { GAMIFICATION_CONSTANTS } from '@/constants/gamification.constant';

// Import Modular Components
import { UserXpCard } from '@/components/features/badges/UserXpCard';
import { PointsRulesTable } from '@/components/features/badges/PointsRulesTable';
import { BadgeGrid } from '@/components/features/badges/BadgeGrid';
import { LeaderboardList } from '@/components/features/badges/LeaderboardList';

// Decouple API Endpoints
const API_ENDPOINTS = {
  LEADERBOARD: '/user/leaderboard',
  BADGES: '/badges',
  RULES: '/badges/rules',
  PROFILE: (id: number) => `/user/profile/${id}`,
};

interface LeaderboardUser {
  id: number;
  name: string;
  role: string;
  points: number;
  level: number;
  badgeTitle: string | null;
  profile?: {
    avatar: string | null;
  };
}

interface BadgeConfig {
  id: string;
  role: string;
  title: string;
  points: number;
  minReviews: number | null;
  minPostLikes: number | null;
  minRatingAvg: number | null;
  minRatingCount: number | null;
  minFollowers: number | null;
}

interface GamificationRules {
  pointsPerLevel: number;
  postReviewPoints: number;
  commentPoints: number;
  likePoints: number;
  deductionMultiplier: number;
}

interface GamificationProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  level: number;
  badgeTitle: string | null;
  _count?: {
    posts?: number;
    userFollowers?: number;
  };
  restaurants?: Array<{
    _count?: {
      followers?: number;
    };
  }>;
}

export default function BadgesPage() {
  const { user: me, isAuthenticated } = useAuth();
  const router = useRouter();
  const labels = LABELS.LOYALTY.BADGES_PAGE;

  // API states
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [rules, setRules] = useState<GamificationRules | null>(null);

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter tabs
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole.CUSTOMER | UserRole.RESTAURANT>(UserRole.CUSTOMER);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch public leaderboard
      const leaderboardData = await apiClient.get(API_ENDPOINTS.LEADERBOARD).catch(() => []);
      setLeaderboard(leaderboardData);

      // Fetch badges threshold list
      const badgesData = await apiClient.get(API_ENDPOINTS.BADGES).catch(() => []);
      setBadges(badgesData);

      // Fetch dynamic rules configuration
      const rulesData = await apiClient.get(API_ENDPOINTS.RULES).catch(() => null);
      setRules(rulesData);

      // Fetch user profile if logged in to get counts
      if (me?.id) {
        const profileData = await apiClient.get(API_ENDPOINTS.PROFILE(me.id)).catch(() => null);
        setProfile(profileData);
        if (profileData?.role) {
          setActiveRoleTab(profileData.role === UserRole.ADMIN ? UserRole.CUSTOMER : profileData.role);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin Gamification:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [me?.id]);

  // Calculations for current user using global constants
  const userPoints = profile?.points ?? me?.points ?? GAMIFICATION_CONSTANTS.DEFAULT_POINTS;
  const userLevel = profile?.level ?? me?.level ?? GAMIFICATION_CONSTANTS.DEFAULT_LEVEL;
  const userBadge = profile?.badgeTitle ?? me?.badgeTitle ?? null;
  const pointsPerLevel = rules?.pointsPerLevel ?? GAMIFICATION_CONSTANTS.DEFAULT_POINTS_PER_LEVEL;
  const xpProgress = userPoints % pointsPerLevel;
  const xpPercent = Math.min(
    GAMIFICATION_CONSTANTS.MAX_XP_PERCENT,
    Math.max(GAMIFICATION_CONSTANTS.MIN_XP_PERCENT, (xpProgress / pointsPerLevel) * GAMIFICATION_CONSTANTS.PERCENT_FACTOR)
  );

  // Stats summary for locked/unlocked condition preview
  const userReviewsCount = profile?._count?.posts ?? GAMIFICATION_CONSTANTS.DEFAULT_REVIEWS;
  const userFollowersCount = profile?.role === UserRole.CUSTOMER
    ? (profile?._count?.userFollowers ?? GAMIFICATION_CONSTANTS.DEFAULT_FOLLOWERS)
    : (profile?.restaurants?.[0]?._count?.followers ?? GAMIFICATION_CONSTANTS.DEFAULT_FOLLOWERS);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar activeTab="" setActiveTab={() => { }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-16 pb-8 md:pt-25 md:pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Trophy className="text-amber-500 w-10 h-10 animate-bounce" />
              {labels.PAGE_TITLE}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">
              {labels.PAGE_SUBTITLE}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="self-start md:self-auto border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-all font-bold gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? labels.UPDATING : labels.REFRESH_DATA}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-slate-400 font-bold animate-pulse">{labels.LOADING_DATA}</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: User Card & Rules */}
            <div className="lg:col-span-2 space-y-8">
              {/* User Progress Card */}
              <UserXpCard
                isAuthenticated={isAuthenticated}
                profile={profile}
                me={me}
                userLevel={userLevel}
                userPoints={userPoints}
                userBadge={userBadge}
                userReviewsCount={userReviewsCount}
                xpProgress={xpProgress}
                pointsPerLevel={pointsPerLevel}
                xpPercent={xpPercent}
                onLoginClick={() => router.push('/login')}
                labels={labels}
              />

              {/* Dynamic Point Rules Table */}
              <PointsRulesTable
                rules={rules}
                labels={labels}
                constants={GAMIFICATION_CONSTANTS}
              />

              {/* Badge thresholds grid */}
              <BadgeGrid
                badges={badges}
                activeRoleTab={activeRoleTab}
                setActiveRoleTab={setActiveRoleTab}
                userBadge={userBadge}
                userPoints={userPoints}
                userReviewsCount={userReviewsCount}
                userFollowersCount={userFollowersCount}
                isAuthenticated={isAuthenticated}
                userRole={me?.role}
                labels={labels}
              />
            </div>

            {/* Right Column: Leaderboard */}
            <LeaderboardList
              leaderboard={leaderboard}
              me={me}
              onUserClick={(id) => router.push(`/profile?id=${id}`)}
              labels={labels}
            />
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
