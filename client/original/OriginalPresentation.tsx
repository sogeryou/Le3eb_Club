import { SourceLabel } from './SourceLabel';
import { RechargeView } from '../views/RechargeView';
import { MoneyPolicyNotice } from '../components/MoneyPolicyNotice';
import { useMoneyPolicy } from '../hooks/useMoneyPolicy';
import { OriginalOrders } from './OriginalOrders';

import { OriginalAvatarUpload, DiscoveryState } from './SupportingPages';
import { businessApi } from '../services/businessApi';
// Presentation extracted from supplied src/App.tsx. Original layout, not original business state.
import { useOriginalBridge } from './useOriginalBridge';
import { useActiveSessionGuard } from './useActiveSessionGuard';
import { useApp } from '../app/AppContext';
import { OriginalAuthModal as AuthModal, OriginalPlayerCenter, OriginalWithdraw, OriginalExchange } from './SupportingPages';
import { ResilientImage } from '../components/ResilientImage';
import { OrderConfirmView } from '../views/OrderConfirmView';

import { ImView } from '../views/ImView';
import { ImDetailView } from '../views/ImDetailView';
import { CompanionLevelDashboard, TaskCenter, LevelBenefits, DecayExplainerModal, IncomeReview, CustomerReview, IcebreakerPoolView } from './SupportingPages';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Gift, UserPlus, Gamepad2, Coffee, Star, Home, MessageSquare, User, ChevronRight, Play, ArrowLeft, CheckCircle2, AlertCircle, Mic2, MapPin, Heart, Venus, Mars, Copy, Check, Plus, Edit2, Image, Layout, Monitor, Smartphone, Share2, ChevronDown, ChevronUp, Filter, SlidersHorizontal, ThumbsUp, MoreHorizontal, Flag, Users, Zap, Send, Bell, Smile, AlertTriangle, CheckCheck, Wallet, History, Languages, Calendar, Settings, X, Phone, Mail, RefreshCw, Camera, LogOut, HelpCircle, Gem, ArrowUpRight, ArrowDownLeft, FileText, Lock, Globe, Link, BarChart3, TrendingUp, ArrowDownToLine, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Game, EPal, Coupon, Playlink, Post, Message, Wallet as WalletType, RechargePackage, WalletTransaction, Notification } from '@shared/types';
import { GAMES } from '../constants';
import { ReportModal, ReportContext } from './ReportModal';

// --- Components ---

const GlassCard = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

const ScoreMetricCard = ({ icon: Icon, label, value, color, className = "", onHelp }: { icon: any, label: string, value: string, color: string, className?: string, onHelp: () => void }) => (
  <GlassCard className={`p-4 space-y-2 relative group ${className}`}>
    <div className="flex items-center justify-between">
      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <button onClick={onHelp} className="text-gray-600 hover:text-white transition-colors">
        <HelpCircle className="w-3 h-3" />
      </button>
    </div>
    <div className="space-y-0.5">
      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-white">{value}</p>
    </div>
  </GlassCard>
);

const RuleItem = ({ label, desc }: { label: string, desc: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-white">{label}</p>
    <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
  </div>
);

const IconButton = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
      active
        ? 'bg-purple-600/40 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
    }`}>
      <Icon className={`w-10 h-10 ${active ? 'text-purple-300' : 'text-purple-400'}`} />
    </div>
    <span className={`text-[10px] font-bold tracking-widest uppercase ${active ? 'text-white' : 'text-gray-400'}`}>
      {label}
    </span>
  </button>
);

const WaveAnimation = ({ color = "bg-black" }: { color?: string }) => (
  <div className="flex items-center gap-[1px] h-2.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={`wave-${i}`}
        animate={{
          height: [2, 7, 2],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeInOut"
        }}
        className={`w-[1.2px] ${color} rounded-full shadow-[0_0_4px_rgba(255,255,255,0.3)]`}
      />
    ))}
  </div>
);

const EPalCard: React.FC<{
  epal: EPal;
  onProfileClick: () => void;
  onOrderClick: () => void;
  isPlaying?: boolean;
  onPlayToggle?: (e: React.MouseEvent) => void;
  badgeText?: string;
}> = ({ epal, onProfileClick, onOrderClick, isPlaying, onPlayToggle, badgeText }) => (
  <GlassCard className="relative p-4 flex items-center gap-4 hover:bg-white/[0.05] transition-all group border-white/5">
    {/* Column 1: Avatar */}
    <div className="relative shrink-0">
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 cursor-pointer group-hover:border-purple-500/50 transition-all shadow-lg"
        onClick={onProfileClick}
      >
        <ResilientImage
          src={epal.avatarUrl}
          alt={epal.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      {/* Play Button Overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayToggle?.(e);
        }}
        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border z-10 bg-purple-600 border-purple-500/50 text-white`}
      >
        {isPlaying ? (
          <WaveAnimation color="bg-white" />
        ) : (
          <Play className="w-3 h-3 fill-current ml-0.5" />
        )}
      </button>
    </div>

    {/* Column 2: Player Info */}
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <h4
        className="font-bold text-white text-lg leading-tight cursor-pointer hover:text-purple-400 transition-colors truncate"
        onClick={onProfileClick}
      >
        {epal.name}
      </h4>

      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
        <span className="text-sm text-white font-bold">{epal.rating.toFixed(1)}</span>
        <span className="text-[10px] text-gray-500 font-medium">
          ({epal.orderCount >= 1000 ? `${(epal.orderCount / 1000).toFixed(1)}k` : epal.orderCount})
        </span>
      </div>

      {badgeText && (
        <div className="mt-0.5 flex">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-full">
            {badgeText}
          </span>
        </div>
      )}
    </div>

    {/* Column 3: Price + CTA */}
    <div className="flex flex-col items-end gap-2 shrink-0 pl-2">
      <div className="flex flex-col items-end leading-none">
        <div className="flex items-center gap-1 text-white font-bold">
          <span className="text-sm">{epal.price}</span>
          <CoinIcon />
        </div>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">per hour</span>
      </div>

      <button
        onClick={onOrderClick}
        className="w-8 h-8 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-[0_2px_8px_rgba(168,85,247,0.2)]"
      >
        <Gamepad2 className="w-4 h-4" />
      </button>
    </div>
  </GlassCard>
);

const LegendEPalCard: React.FC<{
  epal: EPal;
  onProfileClick: () => void;
  isPlaying?: boolean;
  onPlayToggle?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: 'overlay' | 'stacked';
}> = ({ epal, onProfileClick, isPlaying, onPlayToggle, className = "", variant = 'overlay' }) => {
  const displayTags = epal.tags.slice(0, 2);
  const remainingCount = epal.tags.length - 2;

  const InfoContent = () => (
    <div className="flex justify-between items-start relative">
      <div className={`flex-1 min-w-0 ${variant === 'overlay' ? 'pr-8' : ''}`}>
        <div className="flex items-center gap-1.5">
          <h4 className={`font-bold truncate ${variant === 'overlay' ? 'text-white text-xs sm:text-sm' : 'text-white text-sm'}`}>{epal.name}</h4>
          <div className="flex items-center gap-0.5 shrink-0 bg-black/20 px-1 py-0.5 rounded-md">
            <Star className="w-2 h-2 text-yellow-500 fill-current" />
            <span className="text-[8px] text-white font-bold">{epal.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-1 overflow-hidden">
            {displayTags.map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="px-1.5 py-0.5 bg-purple-500/30 border border-purple-500/30 rounded-full text-[7px] font-bold text-purple-200 whitespace-nowrap">
                {tag}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded-full text-[7px] font-bold text-gray-300 whitespace-nowrap">
                +{remainingCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Play Button for Overlay Variant */}
      {variant === 'overlay' && (
        <div className="absolute right-0 z-10 top-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayToggle?.(e);
            }}
            className="w-8 h-8 bg-purple-600 border border-purple-500/50 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            {isPlaying ? (
              <WaveAnimation color="bg-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white fill-current" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col gap-3 ${className}`} onClick={onProfileClick}>
        <div className="relative aspect-square rounded-[32px] overflow-hidden group shadow-2xl border border-white/5">
          <ResilientImage
            src={epal.avatarUrl}
            alt={epal.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Play Button inside avatar for stacked variant */}
          <div className="absolute bottom-3 right-3 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayToggle?.(e);
              }}
              className="w-8 h-8 bg-purple-600 border border-purple-500/50 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              {isPlaying ? (
                <WaveAnimation color="bg-white" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-current" />
              )}
            </button>
          </div>
        </div>
        <div className="px-1">
          <InfoContent />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-square rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl border border-white/5 ${className}`}
      onClick={onProfileClick}
    >
      {/* Background Image */}
      <ResilientImage
        src={epal.avatarUrl}
        alt={epal.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />

      {/* Bottom 1/4 Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/40 backdrop-blur-xl border-t border-white/10 p-3 flex flex-col justify-center">
        <InfoContent />
      </div>
    </div>
  );
};

const GameGridItem: React.FC<{
  game: Game;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}> = ({ game, isFavorite, onToggleFavorite, onClick }) => (
  <div
    onClick={onClick}
    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-white/5"
  >
    <ResilientImage
      src={game.imageUrl}
      alt={game.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 flex flex-col justify-end">
      <span className="font-bold text-white text-[10px] leading-tight line-clamp-2">{game.name}</span>
    </div>

    <button
      onClick={onToggleFavorite}
      className="absolute top-1 right-1 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
    >
      <Star
        className={`w-3 h-3 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-white'}`}
      />
    </button>
  </div>
);

// --- Helpers ---

const formatChatMessageTime = (timestamp: number, previousTimestamp?: number) => {
  const now = new Date();
  const date = new Date(timestamp);

  // If the difference is less than 5 minutes, don't show time
  if (previousTimestamp && timestamp - previousTimestamp < 5 * 60 * 1000) {
    return null;
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isSameDay(now, date)) {
    return timeStr;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(yesterday, date)) {
    return `Yesterday ${timeStr}`;
  }

  const beforeYesterday = new Date(now);
  beforeYesterday.setDate(now.getDate() - 2);
  if (isSameDay(beforeYesterday, date)) {
    return `2 days ago ${timeStr}`;
  }

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  if (date > oneWeekAgo) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${timeStr}`;
  }

  if (now.getFullYear() === date.getFullYear()) {
    return `${date.getMonth() + 1}-${date.getDate()}`;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

// --- Views ---

type View = 'HOME' | 'COMMUNITY' | 'POST_DETAIL' | 'GAME_DETAIL' | 'PROFILE' | 'ORDER_CONFIRM' | 'LEGEND_LIST' | 'ALL_REVIEWS' | 'CATEGORY_SERVICES' | 'IM' | 'IM_DETAIL' | 'NOTIFICATIONS' | 'CONTACTS' | 'COMMUNITY_SELECTOR' | 'ME' | 'WALLET' | 'RECHARGE' | 'WITHDRAW' | 'EXCHANGE_DIAMONDS' | 'APPLY_PLAYER' | 'APPLY_PLAYER_CATEGORY' | 'APPLY_PLAYER_DETAILS' | 'APPLY_PLAYER_SERVICE_FORM' | 'SETTINGS' | 'PURCHASE_HISTORY' | 'PLAYER_ORDERS' | 'ORDER_DETAIL' | 'SETTINGS_EDIT_PROFILE' | 'SETTINGS_CHANGE_PASSWORD' | 'SETTINGS_LINKED_ACCOUNTS' | 'SETTINGS_LANGUAGE' | 'SETTINGS_PRIVACY' | 'SETTINGS_TERMS' | 'PLAYER_CENTER' | 'RANKING_CENTER' | 'PLAYER_SERVICES' | 'COMPANION_LEVEL_DASHBOARD' | 'TASK_CENTER' | 'LEVEL_BENEFITS' | 'INCOME_REVIEW' | 'CUSTOMER_REVIEW' | 'SETTINGS_NOTIFICATIONS' | 'SETTINGS_BLACKLIST' | 'FEEDBACK' | 'MANAGE_PLAYLINKS' | 'ADD_PLAYLINK' | 'NEW_USERS' | 'NEW_EPALS_LIST';

const CoinIcon = ({ className = "w-3 h-3", textClassName = "text-[8px]" }: { className?: string, textClassName?: string }) => (
  <span className={`${className} rounded-full bg-yellow-500 inline-flex items-center justify-center shrink-0`}>
    <span className={`${textClassName} text-black font-black leading-none`}>C</span>
  </span>
);

const WalletView = ({
  wallet,
  transactions,
  packages,
  onSelectPackage,
  onBack,
  userRole,
  userDiamonds,
  diamondTransactions,
  onWithdraw,
  onExchange,
  onOpenDatePicker,
  startDate,
  endDate,
  onResetDates
}: {
  wallet: WalletType | null,
  transactions: WalletTransaction[],
  packages: RechargePackage[],
  onSelectPackage: (pkg: RechargePackage, method: 'GOOGLE_PAY' | 'APPLE_PAY') => void,
  onBack: () => void,
  userRole: 'USER' | 'PLAYER',
  userDiamonds: number,
  diamondTransactions: WalletTransaction[],
  onWithdraw: () => void,
  onExchange: () => void,
  onOpenDatePicker: (id: string, value: string, title: string) => void,
  startDate: string,
  endDate: string,
  onResetDates: () => void
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { locale, navigateTo } = useApp();
  const policy = useMoneyPolicy();
  const [walletTab, setWalletTab] = useState<'COINS' | 'DIAMONDS'>('COINS');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const detectPaymentMethod = (): 'APPLE_PAY' | 'GOOGLE_PAY' => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|macintosh/.test(ua)) return 'APPLE_PAY';
    return 'GOOGLE_PAY';
  };

  const currentTransactions = walletTab === 'COINS' ? transactions : diamondTransactions;

  const filteredTransactions = currentTransactions.filter(tx => {
    // Type Filter
    if (typeFilter === 'EXPENSE' && tx.amount > 0) return false;
    if (typeFilter === 'INCOME' && tx.amount < 0) return false;

    // Time Filter
    if (!startDate && !endDate) return true;
    const txTime = tx.timestamp;
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity;
    return txTime >= start && txTime <= end;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0514]">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={showHistory ? () => setShowHistory(false) : onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white rtl:rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">{showHistory ? 'History' : (userRole === 'PLAYER' ? 'My Assets' : 'Wallet')}</h2>
        </div>
        {!showHistory ? (
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <History className="w-6 h-6" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowTypeMenu(!showTypeMenu);
                  setShowDatePicker(false);
                }}
                className={`p-2 rounded-full transition-all ${showTypeMenu ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Filter className="w-6 h-6" />
              </button>

              <AnimatePresence>
                {showTypeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-[#1a102a] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1"
                  >
                    {[
                      { id: 'ALL', label: 'All Types' },
                      { id: 'INCOME', label: 'Income' },
                      { id: 'EXPENSE', label: 'Expenses' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setTypeFilter(type.id as any);
                          setShowTypeMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-start transition-all ${
                          typeFilter === type.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowTypeMenu(false);
                }}
                className={`p-2 rounded-full transition-all ${showDatePicker ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Calendar className="w-6 h-6" />
              </button>

              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#1a102a] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-4"
                  >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Date Range</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Start Date</label>
                      <button
                        onClick={() => onOpenDatePicker('WALLET_START', startDate, 'Start Date')}
                        className="w-full bg-[#0f071a] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white text-start font-bold"
                      >
                        {startDate || 'Select Date'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">End Date</label>
                      <button
                        onClick={() => onOpenDatePicker('WALLET_END', endDate, 'End Date')}
                        className="w-full bg-[#0f071a] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white text-start font-bold"
                      >
                        {endDate || 'Select Date'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onResetDates}
                        className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="flex-1 py-2 bg-purple-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {!showHistory ? (
          <>
            {userRole === 'PLAYER' && (
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full">
                <button
                  onClick={() => setWalletTab('COINS')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${walletTab === 'COINS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Coins
                </button>
                <button
                  onClick={() => setWalletTab('DIAMONDS')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${walletTab === 'DIAMONDS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Diamonds
                </button>
              </div>
            )}

            {walletTab === 'COINS' ? (
              <>
                {/* Coin Balance Card */}
                <GlassCard className="p-8 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Wallet className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1"><SourceLabel text="Coin Balance" /></div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter">{wallet?.balance || 0}</span>
                      <CoinIcon className="w-6 h-6" />
                    </div>
                  </div>
                </GlassCard>

                {/* Recharge Packages */}
                <div className="space-y-4">
                  <MoneyPolicyNotice />
                  <button className="text-purple-400 text-sm font-bold" onClick={() => navigateTo('RECHARGE')}>{locale === 'ar' ? 'شحن العملات' : 'Recharge Coins'}</button>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest px-2"><SourceLabel text="Recharge Packages" /></p>
                  <div className="grid grid-cols-2 gap-4">
                    {packages.map(pkg => (
                      <button
                        key={`wallet-recharge-package-${pkg.id}`}
                        data-recharge-package={pkg.id}
                        disabled={policy?.rechargeMode !== 'sandbox'}
                        onClick={() => onSelectPackage(pkg, detectPaymentMethod())}
                        className="relative p-6 rounded-3xl border-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all flex flex-col items-center gap-3 active:scale-95 group"
                      >
                        {Number(pkg.bonus) > 0 && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 text-[10px] font-black px-2 py-1 rounded-full shadow-lg z-10">
                            +{pkg.bonus} BONUS
                          </div>
                        )}
                        <div className="flex items-center gap-2 group-hover:scale-110 transition-transform">
                          <span className="text-3xl font-black text-white">{pkg.coins}</span>
                          <CoinIcon className="w-5 h-5" />
                        </div>
                        <div className="text-purple-400 font-black text-lg">${pkg.amount}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Diamond Balance Card */}
                <GlassCard className="p-8 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Gem className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Diamond Balance</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter">{userDiamonds}</span>
                      <Gem className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold mt-2">≈ ${policy ? (userDiamonds / policy.diamondsPerUsd).toFixed(2) : '—'} USD</p>
                  </div>
                  <div className="mt-4 w-full flex gap-3">
                    <button
                      onClick={onExchange}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-purple-400 text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Exchange
                    </button>
                    <button
                      onClick={onWithdraw}
                      className="flex-1 py-4 bg-purple-600 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Withdraw
                    </button>
                  </div>
                </GlassCard>

                {/* Earning Info */}
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest px-2">Earning Tips</p>
                  <GlassCard className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Complete Orders</p>
                        <p className="text-xs text-gray-500">Earn diamonds by providing high-quality services to your customers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <Smile className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Gifting unavailable</p>
                        <p className="text-xs text-gray-500">No gift purchases or gift income are supported in this version.</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* History Tabs */}
            {userRole === 'PLAYER' && (
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full">
                <button
                  onClick={() => setWalletTab('COINS')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${walletTab === 'COINS' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  Coins
                </button>
                <button
                  onClick={() => setWalletTab('DIAMONDS')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${walletTab === 'DIAMONDS' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  Diamonds
                </button>
              </div>
            )}

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                  <GlassCard key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-purple-500/10' : 'bg-red-500/10'
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="w-5 h-5 text-purple-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{tx.description}</div>
                        <div className="text-gray-500 text-[10px] font-medium">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${tx.amount > 0 ? 'text-purple-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      {walletTab === 'COINS' ? <CoinIcon className="w-3 h-3" /> : <Gem className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-4">
                  <History className="w-12 h-12 opacity-20" />
                  <p className="font-bold">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DatePickerModal = ({
  isOpen,
  onClose,
  value,
  onChange,
  title,
  mode = 'PAST',
  language = 'English'
}: {
  isOpen: boolean,
  onClose: () => void,
  value: string,
  onChange: (date: string) => void,
  title: string,
  mode?: 'PAST' | 'BIRTHDAY',
  language?: 'English' | 'Arabic'
}) => {
  const parts = (value || new Date().toISOString().split('T')[0]).split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  const now = new Date();
  const currentYear = now.getFullYear();
  const eighteenYearsAgoYear = currentYear - 18;

  const handleConfirm = () => {
    onClose();
  };

  const t_local = (en: string, ar: string) => language === 'Arabic' ? ar : en;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a102d] border-t border-white/10 rounded-t-[40px] z-[1001] h-[60vh] flex flex-col pt-2 shadow-2xl"
            dir={language === 'Arabic' ? 'rtl' : 'ltr'}
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />

            <div className="px-8 flex items-center justify-between mb-2">
              <button onClick={onClose} className="text-gray-500 font-bold text-sm transition-colors hover:text-white">{t_local('Cancel', 'إلغاء')}</button>
              <h3 className="text-white font-black uppercase tracking-widest text-sm">{title}</h3>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-hidden relative px-8 py-4 flex gap-2">
              <div className="absolute top-1/2 left-8 right-8 h-14 -translate-y-1/2 pointer-events-none bg-white/5 border-y border-white/10 rounded-2xl" />

              {/* Year */}
              <div className="flex-1 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-24 text-center">
                {Array.from({ length: 100 }, (_, i) => {
                  const y = (mode === 'BIRTHDAY' ? eighteenYearsAgoYear - i : currentYear - i).toString();
                  const isSelected = year === y;
                  return (
                    <div
                      key={`y-${y}`}
                      onClick={() => {
                        const newDate = `${y}-${month}-${day}`;
                        if (mode !== 'BIRTHDAY' && new Date(newDate) > now) {
                          onChange(now.toISOString().split('T')[0]);
                        } else {
                          onChange(newDate);
                        }
                      }}
                      className={`h-14 flex items-center justify-center snap-center transition-all duration-300 cursor-pointer ${
                        isSelected ? 'text-white text-xl font-black' : 'text-gray-600 text-sm font-bold'
                      }`}
                    >
                      {y}
                    </div>
                  );
                })}
              </div>

              {/* Month */}
              <div className="flex-1 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-24 text-center">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = (i + 1).toString().padStart(2, '0');
                  const isSelected = month === m;
                  return (
                    <div
                      key={`m-${m}`}
                      onClick={() => {
                        const newDate = `${year}-${m}-${day}`;
                        if (mode !== 'BIRTHDAY' && new Date(newDate) > now) {
                          onChange(now.toISOString().split('T')[0]);
                        } else {
                          onChange(newDate);
                        }
                      }}
                      className={`h-14 flex items-center justify-center snap-center transition-all duration-300 cursor-pointer ${
                        isSelected ? 'text-white text-xl font-black' : 'text-gray-600 text-sm font-bold'
                      }`}
                    >
                      {new Date(2000, i).toLocaleString(language === 'Arabic' ? 'ar-SA' : 'en-US', { month: 'short' })}
                    </div>
                  );
                })}
              </div>

              {/* Day */}
              <div className="flex-1 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-24 text-center">
                {Array.from({ length: 31 }, (_, i) => {
                  const d = (i + 1).toString().padStart(2, '0');
                  const isSelected = day === d;
                  return (
                    <div
                      key={`d-${d}`}
                      onClick={() => {
                        const newDate = `${year}-${month}-${d}`;
                        if (mode !== 'BIRTHDAY' && new Date(newDate) > now) {
                          onChange(now.toISOString().split('T')[0]);
                        } else {
                          onChange(newDate);
                        }
                      }}
                      className={`h-14 flex items-center justify-center snap-center transition-all duration-300 cursor-pointer ${
                        isSelected ? 'text-white text-xl font-black' : 'text-gray-600 text-sm font-bold'
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-8 pb-10 pt-4">
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 transition-all"
              >
                {t_local('Confirm', 'تأكيد')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};



const FeedbackView = ({
  onBack,
  onOpenDatePicker,
  selectedTime,
}: {
  onBack: () => void,
  onOpenDatePicker: (id: string, value: string, title: string) => void,
  selectedTime: string
}) => {
  const { authToken, notify } = useApp();
  const captureSession = useActiveSessionGuard();
  const [feedbackType, setFeedbackType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback categories
  const feedbackTypes = [
    { id: 'RECHARGE', label: 'Recharge' },
    { id: 'WITHDRAWAL', label: 'Withdrawal' },
    { id: 'ORDER', label: 'Order' },
    { id: 'REGISTRATION', label: 'Registration' },
    { id: 'PRIVATE_MESSAGE', label: 'Private Msg' },
    { id: 'GIFTING', label: 'Gifting' },
    { id: 'LAG', label: 'Lag/Performance' }
  ];

  const handleSubmit = async () => {
    if (!feedbackType || !description || !authToken) return;
    setIsSubmitting(true);
    const stillCurrent = captureSession();
    try { await businessApi.createTicket(authToken, feedbackType, description + (selectedTime ? '\n' + selectedTime : '')); if (stillCurrent()) { notify('Feedback submitted'); onBack(); } } catch (error) { if (stillCurrent()) notify((error as Error).message); } finally { if (stillCurrent()) setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0514] pb-24">
      <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0a0514]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white rtl:rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">Submit Feedback</h2>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Type Selection */}
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Feedback Type</label>
          <div className="grid grid-cols-2 gap-3">
            {feedbackTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setFeedbackType(type.id)}
                className={`px-4 py-3 rounded-2xl text-[11px] font-bold transition-all border ${
                  feedbackType === type.id
                    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Time of Occurrence</label>
          <button
            onClick={() => onOpenDatePicker('FEEDBACK_TIME', selectedTime, 'Occurrence Time')}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-start group hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${selectedTime ? 'text-white' : 'text-gray-500'}`}>
                {selectedTime || 'Select the time problem occurred'}
              </span>
              <Calendar className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </div>
          </button>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Problem Description (Required)</label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500/50 min-h-[150px] outline-none transition-all resize-none shadow-inner"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-600">
              {description.length} / 500
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Screenshot (Optional)</label>
          <div className="flex flex-col gap-4">
            {image ? (
              <div className="relative w-full h-[200px] md:h-[240px] rounded-2xl overflow-hidden border border-white/20 group">
                <ResilientImage src={image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => notify('Feedback attachments are not supported yet.')}
                className="w-full h-[200px] md:h-[240px] rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-gray-500 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
              >
                <Camera className="w-10 h-10 group-hover:text-purple-400 transition-colors" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0514] via-[#0a0514] to-transparent z-40">
        <button
          disabled={!feedbackType || !description || !selectedTime || isSubmitting}
          onClick={handleSubmit}
          className={`w-full max-w-md mx-auto py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
            !feedbackType || !description || !selectedTime || isSubmitting
              ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
              : 'bg-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95 hover:brightness-110'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ManagePlaylinksView = ({
  playlinks,
  onAdd,
  onEdit,
  onDelete,
  onBack
}: {
  playlinks: Playlink[],
  onAdd: () => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onBack: () => void
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0514]">
      <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0a0514]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white rtl:rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">Playlinks</h2>
        </div>
        <button
          onClick={onAdd}
          className="p-2 bg-purple-600 rounded-xl text-white active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {playlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
              <Gamepad2 className="w-10 h-10 text-gray-700" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">No Playlinks Found</p>
              <p className="text-xs text-gray-500">Connect your game accounts to show your rank and stats.</p>
            </div>
            <button
              onClick={onAdd}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-purple-400 hover:bg-white/10 transition-all"
            >
              Add First Playlink
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {playlinks.map(link => (
              <div key={link.id} className="relative group">
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                    <ResilientImage src={link.posterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{link.gameName}</p>
                    <p className="text-purple-400 font-bold text-xs">{link.nickname}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(link.id)}
                      className="p-3 text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 rounded-2xl transition-all active:scale-90"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(link.id)}
                      className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AddPlaylinkView = ({
  games,
  onSave,
  onBack,
  initialData
}: {
  games: Game[],
  onSave: (link: Partial<Playlink> & { screenshot?: string }) => void,
  onBack: () => void,
  initialData?: Playlink
}) => {
  const [step, setStep] = useState<'GAME' | 'DETAILS'>(initialData ? 'DETAILS' : 'GAME');
  const [selectedGame, setSelectedGame] = useState<Game | null>(
    initialData ? (games.find(g => g.name === initialData.gameName) || null) : null
  );
  const [form, setForm] = useState({
    nickname: initialData?.nickname || '',
    platform: initialData?.platform || '',
    server: initialData?.server || '',
    rank: initialData?.rank || '',
    role: initialData?.role || '',
    style: initialData?.style || '',
    screenshot: null as string | null
  });

  const formOptions = {
    platforms: ['PC', 'Mobile', 'PS'],
    servers: ['North America', 'Europe', 'Asia', 'South America'],
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    positions: ['Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Entry', 'Duelist', 'Smokes'],
    styles: ['Aggressive', 'Passive', 'Team-player', 'Carry']
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setStep('DETAILS');
  };

    const handleSave = () => {
    if (!selectedGame || !form.nickname || !form.platform || !form.server || !form.rank) return;
    onSave({
      gameName: selectedGame.name,
      posterUrl: selectedGame.imageUrl,
      nickname: form.nickname,
      rank: form.rank,
      platform: form.platform as any,
      server: form.server,
      role: form.role,
      style: form.style,
      screenshot: form.screenshot || undefined
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0514] pb-24">
      <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0a0514]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={(step === 'DETAILS' && !initialData) ? () => setStep('GAME') : onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white rtl:rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">{step === 'GAME' ? 'Select Game' : 'Playlink Details'}</h2>
        </div>
      </div>

      <div className="p-6">
        {step === 'GAME' ? (
          <div className="grid grid-cols-2 gap-4">
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game)}
                className="relative group aspect-[4/5] rounded-3xl overflow-hidden border-2 border-white/10 hover:border-purple-500/50 transition-all active:scale-95"
              >
                <ResilientImage src={game.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <p className="text-white font-black text-sm text-start leading-tight">{game.name}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Game Nickname/ID (Required)</label>
                <input
                  type="text"
                  value={form.nickname}
                  placeholder="e.g. PlayerOne#1234"
                  onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Current Ranking</label>
                <select
                  value={form.rank}
                  onChange={(e) => setForm(prev => ({ ...prev, rank: e.target.value }))}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none outline-none focus:border-purple-500/50"
                >
                  <option value="">Select Ranking</option>
                  {formOptions.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Platform */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Platform" /></label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none outline-none focus:border-purple-500/50"
                  >
                    <option value="">Select Platform</option>
                    {formOptions.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Server */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Server" /></label>
                  <select
                    value={form.server}
                    onChange={(e) => setForm(prev => ({ ...prev, server: e.target.value }))}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none outline-none focus:border-purple-500/50"
                  >
                    <option value=""><SourceLabel text="Select Server" /></option>
                    {formOptions.servers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Position/Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="">Select Role</option>
                        {formOptions.positions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Play Style</label>
                      <select
                        value={form.style}
                        onChange={(e) => setForm(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="">Select Style</option>
                        {formOptions.styles.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Verification Screenshot</label>
                <div className="flex gap-4">
                   {form.screenshot ? (
                     <div className="relative flex-1 aspect-video rounded-2xl overflow-hidden border border-white/20 group">
                       <ResilientImage src={form.screenshot} className="w-full h-full object-cover" />
                       <button
                         onClick={() => setForm(prev => ({ ...prev, screenshot: null }))}
                         className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                       >
                         <X className="w-6 h-6" />
                       </button>
                     </div>
                   ) : (
                     <button
                       onClick={() => setForm(prev => ({ ...prev, screenshot: '/default-cover.svg' }))}
                       className="flex-1 aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-purple-500/50 hover:text-purple-400 transition-all active:scale-95 group"
                     >
                        <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Upload Screen</span>
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0514] via-[#0a0514] to-transparent z-40">
          <button
          disabled={step === 'GAME' || !form.nickname || !form.platform || !form.server || !form.rank}
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 ${
            step === 'GAME' || !form.nickname || !form.platform || !form.server || !form.rank
              ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed shadow-none'
              : 'bg-purple-600 text-white hover:brightness-110'
          }`}
        >
          <Send className="w-4 h-4" /><SourceLabel text="Save" /></button>
      </div>

    </div>
  );
};

const COUNTRIES = [
  'North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania',
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan',
  'South Korea', 'China', 'Singapore', 'Australia', 'Brazil', 'Mexico'
];

const SettingsSubPage: React.FC<{
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  stickyHeader?: boolean;
}> = ({ title, onBack, children, rightElement, stickyHeader }) => (
  <div className="min-h-screen pb-20 bg-[#0f071a]">
    <div className={`${stickyHeader ? 'sticky top-0 z-[60] bg-[#0f071a]/80 backdrop-blur-md border-b border-white/5' : ''} p-6 pb-4`}>
      <div className="flex items-center justify-between relative">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl border border-white/10 relative z-10 transition-all active:scale-95">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{title}</h1>
        <div className="relative z-10 flex items-center justify-end">
          {rightElement || <div className="w-10" />}
        </div>
      </div>
    </div>
    <div className="p-6 pt-0 space-y-6">
      {children}
    </div>
  </div>
);

const LANGUAGES_DATA = {
  English: {
    dir: 'ltr',
    home: 'Home',
    community: 'Community',
    messages: 'Messages',
    me: 'Me',
    settings: 'Settings',
    language: 'Language',
    confirm: 'Confirm',
    cancel: 'Cancel',
    changeLanguageTitle: 'Change Language',
    changeLanguageDesc: 'Are you sure you want to change the language? The application will be re-rendered.',
    recharge: 'Recharge',
    wallet: 'Wallet',
    search: 'Search',
    favorite: 'Favorite',
    games: 'Games',
    chilling: 'Chilling',
    trendingRealms: 'Trending Realms',
    legendEPals: 'Legend EPals',
    newEPals: 'New EPals',
    newUsers: 'New Users',
    moreEPals: 'More EPals',
    searchForEPals: 'Search for EPals',
    noEPalsFound: 'No EPals found with these filters',
    unfollowConfirm: 'Are you sure you want to unfollow this companion?',
    epal: 'EPal',
    viewAll: 'View All',
    logout: 'Log Out',
    myOrders: 'My Orders',
    playerCenter: 'Player Center',
    rankingCenter: 'Ranking Center',
    myServices: 'My Services',
    taskCenter: 'Task Center',
    all: 'All',
    selectCommunity: 'Select Community',
    typeMessage: 'Type a message...',
    send: 'Send',
    report: 'Report',
    block: 'Block',
    unblock: 'Unblock',
    online: 'Online',
    offline: 'Offline',
    trending: 'Trending',
    latest: 'Latest',
    following: 'Following',
    follow: 'Follow',
    balance: 'Balance',
    coins: 'Coins',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    album: 'Album',
    post: 'Post',
    service: 'Service',
    followed: 'Followed',
    fans: 'Fans',
    visitors: 'Visitors',
    payment: 'Payment',
    coupon: 'Coupon',
    discount: 'Discount',
    total: 'Total',
    payNow: 'Pay Now',
    confirmOrder: 'Confirm Order',
    selectPaymentMethod: 'Select Payment Method',
    viewMore: 'View More',
    viewLess: 'View Less'
  },
  Arabic: {
    dir: 'rtl',
    home: 'الرئيسية',
    community: 'المجتمع',
    messages: 'الرسائل',
    me: 'أنا',
    settings: 'الإعدادات',
    language: 'اللغة',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    changeLanguageTitle: 'تغيير اللغة',
    changeLanguageDesc: 'هل أنت متأكد أنك تريد تغيير اللغة؟ سيتم تبديل اتجاه الواجهة.',
    recharge: 'شحن',
    wallet: 'المحفظة',
    search: 'بحث',
    favorite: 'المفضلة',
    games: 'ألعاب',
    chilling: 'دردشة',
    trendingRealms: 'العوالم الشائعة',
    legendEPals: 'أصحاب الأساطير',
    newEPals: 'أصحاب جدد',
    newUsers: 'مستخدمون جدد',
    moreEPals: 'المزيد من الـ أصحاب',
    searchForEPals: 'ابحث عن أصحاب',
    noEPalsFound: 'لم يتم العثور على أصحاب بهذه الفلاتر',
    unfollowConfirm: 'هل أنت متأكد أنك تريد إلغاء متابعة هذا الصاحب؟',
    epal: 'صاحب',
    viewAll: 'عرض الكل',
    logout: 'تسجيل الخروج',
    myOrders: 'طلباتي',
    playerCenter: 'مركز اللاعب',
    rankingCenter: 'مركز التصنيف',
    myServices: 'خدماتي',
    taskCenter: 'مركز المهام',
    all: 'الكل',
    selectCommunity: 'اختر المجتمع',
    typeMessage: 'اكتب رسالة...',
    send: 'إرسال',
    report: 'إبلاغ',
    block: 'حظر',
    unblock: 'إلغاء الحظر',
    online: 'متصل',
    offline: 'غير متصل',
    trending: 'الرائج',
    latest: 'الأحدث',
    following: 'المتابعة',
    follow: 'متابعة',
    balance: 'الرصيد',
    coins: 'عملات',
    profile: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    album: 'الألبوم',
    post: 'منشور',
    service: 'خدمة',
    followed: 'تمت متابعته',
    fans: 'المعجبون',
    visitors: 'الزوار',
    payment: 'الدفع',
    coupon: 'كوبون',
    discount: 'خصم',
    total: 'الإجمالي',
    payNow: 'ادفع الآن',
    confirmOrder: 'تأكيد الطلب',
    selectPaymentMethod: 'اختر طريقة الدفع',
    viewMore: 'عرض المزيد',
    viewLess: 'عرض أقل'
  }
} as const;

export default function OriginalPresentation() {
 const { authUser, isAuthenticated, openAuthModal, handleLogout, myCompanion, toastMessage, currentView, wallet, transactions, rechargePackages, isRecharging, isRecording, setIsRecording, recordingTime, setRecordingTime, cacheSize, setCacheSize, handleRecharge, selectedCategory, setSelectedCategory, searchQuery, selectedGame, setSelectedGame, selectedServiceCategory, setSelectedServiceCategory, applicationDetails, setApplicationDetails, selectedEPal, selectedPost, showGiftPanel, setShowGiftPanel, selectedGiftId, setSelectedGiftId, giftQuantity, setGiftQuantity, showQuantitySelector, setShowQuantitySelector, userDiamonds, withdrawAmount, setWithdrawAmount, userRole, playerApplicationStatus, setPlayerApplicationStatus, playerApplicationStep, setPlayerApplicationStep, playerApplicationData, setPlayerApplicationData, applyGameSearchQuery, setApplyGameSearchQuery, showApplySelectionModal, setShowApplySelectionModal, showGameSelectorModal, setShowGameSelectorModal, commentInputRef, moreEPals, loadingMore, favorites, playingEPalId, activeServiceId, setActiveServiceId, selectedVariant, setSelectedVariant, orderQuantity, setOrderQuantity, availableCoupons, selectedCoupon, setSelectedCoupon, showCouponModal, setShowCouponModal, showServiceTypeModal, setShowServiceTypeModal, profileTab, setProfileTab, selectedPlaylinkId, setSelectedPlaylinkId, showPlaylinkModal, setShowPlaylinkModal, showUnfollowModal, setShowUnfollowModal, epalToUnfollow, showServiceDetails, setShowServiceDetails, reviewSortOrder, setReviewSortOrder, selectedReviewTag, setSelectedReviewTag, selectedRatingFilter, setSelectedRatingFilter, showReviewFilterModal, setShowReviewFilterModal, imTab, setImTab, imSearchQuery, selectedApplyGameCategory, setSelectedApplyGameCategory, epalSortBy, setEpalSortBy, epalFilters, setEpalFilters, showEpalFilterModal, setShowEpalFilterModal, showRankSelectorModal, setShowRankSelectorModal, showServerSelectorModal, setShowServerSelectorModal, showPlatformSelectorModal, setShowPlatformSelectorModal, chatSessions, imOrders, setImOrders, showOngoingOrderWarning, setShowOngoingOrderWarning, currentMessages, setCurrentMessages, messageInput, setMessageInput, selectedOrder, setSelectedOrder, showOrderDetailModal, setShowOrderDetailModal, showImServiceCards, setShowImServiceCards, showReviewModal, setShowReviewModal, reviewRating, setReviewRating, reviewTags, setReviewTags, reviewFeedback, setReviewFeedback, orderTab, setOrderTab, userStatus, setUserStatus, showStatusModal, setShowStatusModal, viewHistory, contactsTab, setContactsTab, communityTab, setCommunityTab, showFullSearch, setShowFullSearch, fullSearchQuery, setFullSearchQuery, fullSearchResults, setFullSearchResults, isScrolling, copied, followedEPals, followersOfMe, mutualFollowers, filteredPosts, toggleFollow, confirmUnfollow, copyToClipboard, lastElementRef, legendEPals, navigateTo, handleBack, toggleFavorite, handlePlayToggle, scrollToLetter, groupedGames, EPALS, GAMES, POSTS, selectedLanguage, setSelectedLanguage, userProfile, setUserProfile, diamondTransactions, playerServices, setPlayerServices, myPlaylinks, setMyPlaylinks, notifications, setNotifications, playerRanking, getLevelBenefits, handleExchangeDiamonds, handleWithdrawDiamonds, handleStartBind, handleSendCode, handleVerifyBind, handleUnbind, handleUpdatePassword, handleCreatePost, handleBlockUser, handleReportSubmit, processWeeklyUpdate, isInteractionBlocked, unavailable, blockedUsers, newEPals, submitApplication } = useOriginalBridge();
 const t = (key: keyof typeof LANGUAGES_DATA['English']) => LANGUAGES_DATA[selectedLanguage][key] || LANGUAGES_DATA.English[key];
 const [pendingLanguage, setPendingLanguage] = useState<'English' | 'Arabic' | null>(null);
const [showLanguageConfirm, setShowLanguageConfirm] = useState(false);
const [serviceSort, setServiceSort] = useState<'NAME_ASC' | 'NAME_DESC' | 'ORDERS_ASC' | 'ORDERS_DESC'>('NAME_ASC');
const [showServiceSortMenu, setShowServiceSortMenu] = useState(false);
const [serviceToToggle, setServiceToToggle] = useState<any>(null);
const [serviceToDelete, setServiceToDelete] = useState<any>(null);
const [playingServiceId, setPlayingServiceId] = useState<string | null>(null);
const [notificationSettings, setNotificationSettings] = useState({
    message: true,
    order: true,
    system: true,
    post: true
  });
const [showDecayExplainer, setShowDecayExplainer] = useState(false);
const [isEditingService, setIsEditingService] = useState(false);
const [editingPlaylinkId, setEditingPlaylinkId] = useState<string | null>(null);
const [playlinkToDelete, setPlaylinkToDelete] = useState<string | null>(null);
const [tempProfile, setTempProfile] = useState(userProfile);
useEffect(() => {
  if (currentView === 'SETTINGS_EDIT_PROFILE') setTempProfile(userProfile);
}, [currentView, userProfile]);
const [bindType, setBindType] = useState<'EMAIL' | 'PHONE' | null>(null);
const [bindValue, setBindValue] = useState('');
const [verificationCode, setVerificationCode] = useState('');
const [verificationStep, setVerificationStep] = useState<'VIEW' | 'INPUT' | 'VERIFY' | null>(null);
const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
const [resendCooldown, setResendCooldown] = useState(0);
const [showBindModal, setShowBindModal] = useState(false);
const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
const [showServiceForm, setShowServiceForm] = useState(false);
const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    price: 0,
    unit: 'hour',
    promotion: {
      type: 'NONE' as 'NONE' | 'FIRST_ORDER_DISCOUNT' | 'DISCOUNT' | 'BUY_X_GET_Y',
      value: 0,
      buyX: 0,
      getY: 0,
      limitType: 'NONE' as 'NONE' | 'TIME' | 'QUANTITY',
      startDate: '',
      endDate: '',
      limitValue: 0
    }
  });
const [showImOrderCard, setShowImOrderCard] = useState(false);
const [imDetailOrderTab, setImDetailOrderTab] = useState<'EPAL' | 'CUSTOMER'>('EPAL');
const [imOrderTab, setImOrderTab] = useState<'EPAL' | 'CUSTOMER'>('EPAL');
const [showImReportMenu, setShowImReportMenu] = useState(false);
const [orderSearchQuery, setOrderSearchQuery] = useState('');
const [orderStartDate, setOrderStartDate] = useState('');
const [orderEndDate, setOrderEndDate] = useState('');
const [walletStartDate, setWalletStartDate] = useState('');
const [walletEndDate, setWalletEndDate] = useState('');
const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
const [isOrderSearchExpanded, setIsOrderSearchExpanded] = useState(false);
const [exchangeAmount, setExchangeAmount] = useState<number | ''>('');
const [showRankingRules, setShowRankingRules] = useState(false);
const [rankingTab, setRankingTab] = useState<'ACTIVITY' | 'SERVICE'>('ACTIVITY');
const [isReportModalOpen, setIsReportModalOpen] = useState(false);
const [reportContext, setReportContext] = useState<ReportContext>('USER');
const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState(false);
const [isClearCacheConfirmOpen, setIsClearCacheConfirmOpen] = useState(false);
const [userToUnblock, setUserToUnblock] = useState<string | null>(null);
const [isProfileMoreOpen, setIsProfileMoreOpen] = useState(false);
const [showSubmissionToast, setShowSubmissionToast] = useState<{ show: boolean; message: string; subtext?: string }>({ show: false, message: '' });
const [showPlaylinkSelection, setShowPlaylinkSelection] = useState(false);
const [notificationTab, setNotificationTab] = useState<'ORDER' | 'SOCIAL' | 'SYSTEM'>('ORDER');
const [isMarkReadConfirmOpen, setIsMarkReadConfirmOpen] = useState(false);
const [feedbackTime, setFeedbackTime] = useState('');
const [datePickerTarget, setDatePickerTarget] = useState<{
    id: string;
    value: string;
    title: string;
  } | null>(null);
const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
const [showCountryPicker, setShowCountryPicker] = useState(false);
const [showExitConfirm, setShowExitConfirm] = useState(false);
const [showCreatePost, setShowCreatePost] = useState(false);
const [showPostCategorySelector, setShowPostCategorySelector] = useState(false);
const [newPostContent, setNewPostContent] = useState('');
const [postImages, setPostImages] = useState<string[]>([]);
const [newPostGame, setNewPostGame] = useState<Game | null>(null);
const onOpenDatePicker = (id: string, value: string, title: string) => {
    let defaultValue = value;
    if (!defaultValue) {
      if (id === 'BIRTHDAY') {
        const today = new Date();
        today.setFullYear(today.getFullYear() - 18);
        defaultValue = today.toISOString().split('T')[0];
      } else {
        defaultValue = new Date().toISOString().split('T')[0];
      }
    }
    setDatePickerTarget({ id, value: defaultValue, title });
  };
const handleDateChange = (newDate: string) => {
    if (!datePickerTarget) return;

    // Common check: Prevent future dates across all pickers (except if we ever allow future)
    const isFuture = new Date(newDate) > new Date();
    const validatedDate = isFuture ? new Date().toISOString().split('T')[0] : newDate;

    setDatePickerTarget(prev => prev ? { ...prev, value: validatedDate } : null);

    switch (datePickerTarget.id) {
      case 'BIRTHDAY':
        setTempProfile(prev => ({ ...prev, birthday: validatedDate }));
        break;
      case 'WALLET_START':
        setWalletStartDate(validatedDate);
        if (new Date(validatedDate) > new Date(walletEndDate)) {
          setWalletEndDate(validatedDate);
        }
        break;
      case 'WALLET_END':
        setWalletEndDate(validatedDate);
        if (new Date(validatedDate) < new Date(walletStartDate)) {
          setWalletStartDate(validatedDate);
        }
        break;
      case 'ORDER_START':
        setOrderStartDate(validatedDate);
        if (new Date(validatedDate) > new Date(orderEndDate)) {
          setOrderEndDate(validatedDate);
        }
        break;
      case 'ORDER_END':
        setOrderEndDate(validatedDate);
        if (new Date(validatedDate) < new Date(orderStartDate)) {
          setOrderStartDate(validatedDate);
        }
        break;
      case 'PROMO_START':
        setServiceForm(prev => ({
          ...prev,
          promotion: {
            ...prev.promotion,
            startDate: validatedDate,
            endDate: new Date(validatedDate) > new Date(prev.promotion.endDate || '') ? validatedDate : prev.promotion.endDate
          }
        }));
        break;
      case 'FEEDBACK_TIME':
        setFeedbackTime(validatedDate);
        break;
      case 'PROMO_END':
        setServiceForm(prev => ({
          ...prev,
          promotion: {
            ...prev.promotion,
            endDate: validatedDate,
            startDate: new Date(validatedDate) < new Date(prev.promotion.startDate || '') ? validatedDate : prev.promotion.startDate
          }
        }));
        break;
    }
  };
return (
    <div
      data-view={currentView} dir={LANGUAGES_DATA[selectedLanguage].dir}
      className={`min-h-screen bg-[#0f071a] text-white font-sans selection:bg-purple-500/30 ${selectedLanguage === 'Arabic' ? 'text-start' : 'text-start'}`}
    >
      <AuthModal />
      {toastMessage && <div role="status" className="fixed bottom-24 inset-x-4 z-[300] rounded-2xl border border-purple-400/30 bg-[#211034] px-5 py-4 text-center">{toastMessage}</div>}
      {/* Header */}
      {['HOME', 'COMMUNITY', 'IM', 'ME', 'COMMUNITY_SELECTOR'].includes(currentView) && (
        <header className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          {currentView === 'HOME' ? (
            <>
              <div className="flex-1 max-w-xs">
                <button
                  onClick={() => setShowFullSearch(true)}
                  className="w-full flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-purple-500/50 transition-all text-start"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="ms-2 text-sm text-gray-500">{t('search')}</span>
                </button>
              </div>
              <button className="ms-4 p-2 text-purple-400 hover:bg-purple-500/10 rounded-full transition-colors">
                <Gift className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full">
              {viewHistory.length > 1 && (
                <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full">
                  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>
              )}
              <h2 className={`text-lg font-bold flex-1 min-w-0 ${viewHistory.length === 1 ? 'text-center' : ''}`}>
                 {currentView === 'COMMUNITY' ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                      <button
                        onClick={() => setSelectedGame(null)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          selectedGame === null ? 'bg-purple-600 text-white' : 'text-gray-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        All
                      </button>
                      {GAMES.slice(0, 4).map(game => (
                        <button
                          key={`apply-game-btn-${game.id}`}
                          onClick={() => setSelectedGame(game)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            selectedGame?.id === game.id ? 'bg-purple-600 text-white' : 'text-gray-400'
                          }`}
                        >
                          {game.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => navigateTo('COMMUNITY_SELECTOR')}
                      className="p-1.5 bg-white/5 rounded-full text-gray-400 shrink-0 ml-2"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ) : currentView === 'IM' ? (
                  <div className="flex items-center justify-between w-full">
                    <span>Messages</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowFullSearch(true)} className="p-2 hover:bg-white/10 rounded-full">
                        <Search className="w-5 h-5" />
                      </button>
                      <button onClick={() => navigateTo('CONTACTS')} className="p-2 hover:bg-white/10 rounded-full">
                        <Users className="w-5 h-5" />
                      </button>
                      <button onClick={() => navigateTo('NOTIFICATIONS')} className="p-2 hover:bg-white/10 rounded-full">
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : currentView === 'ME' ? (
                  t('me')
                ) : currentView === 'COMMUNITY_SELECTOR' ? (
                  t('selectCommunity')
                ) : null}
              </h2>
            </div>
          )}
        </header>
      )}

      <main className="pb-20">
        {/* Full-screen Search Modal */}
      <AnimatePresence>
        {showFullSearch && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-[#0f071a] flex flex-col"
          >
            {/* Search Header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5">
              <button
                onClick={() => {
                  setShowFullSearch(false);
                  setFullSearchQuery('');
                  setFullSearchResults([]);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by ID or Name"
                  value={fullSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setFullSearchQuery(query);
                    if (query.trim()) {
                      const results = EPALS.filter(epal =>
                        epal.id.toLowerCase().includes(query.toLowerCase()) ||
                        epal.name.toLowerCase().includes(query.toLowerCase())
                      );
                      setFullSearchResults(results);
                    } else {
                      setFullSearchResults([]);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-6 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {fullSearchQuery.trim() === '' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                    <Search className="w-10 h-10 text-gray-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 font-bold">{t('searchForEPals')}</p>
                    <p className="text-xs text-gray-600">Enter an ID or nickname to find someone</p>
                  </div>
                </div>
              ) : fullSearchResults.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <p className="text-gray-500 font-bold">No results found for "{fullSearchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Search Results</p>
                  <div className="space-y-4">
                    {fullSearchResults.map(epal => {
                      const session = currentView === 'IM' ? chatSessions.find(s => s.participantId === epal.id) : null;

                      return (
                          <div
                            key={`search-result-epal-${epal.id}`}
                            onClick={() => {
                              setShowFullSearch(false);
                              if (currentView === 'IM') {
                                navigateTo('IM_DETAIL', epal);
                              } else {
                                navigateTo('PROFILE', epal);
                              }
                            }}
                            className="flex items-center gap-4 p-2 hover:bg-white/5 transition-all cursor-pointer rounded-xl"
                          >
                            <ResilientImage src={epal.avatarUrl} className="w-14 h-14 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white truncate">{epal.name}</h4>
                              {session ? (
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <p className="text-[11px] text-gray-500 truncate flex-1">{session.lastMessage}</p>
                                  <span className="text-[9px] text-gray-700 shrink-0">{formatChatMessageTime(session.lastTimestamp)}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-500 font-mono">ID: {epal.id}</span>
                                  <span className="text-gray-700 text-[10px]">•</span>
                                  <span className="text-[10px] text-purple-400 font-bold">{epal.game}</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                          </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={currentView}>
          {currentView === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 space-y-8"
            >
              <DiscoveryState />
              {/* Category Buttons */}
              <section className="pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <IconButton
                    icon={Star}
                    label={t('favorite')}
                    onClick={() => {
                      setSelectedCategory('FAVOURITE');
                      navigateTo('CATEGORY_SERVICES');
                    }}
                  />
                  <IconButton
                    icon={Gamepad2}
                    label={t('games')}
                    onClick={() => {
                      setSelectedCategory('GAMES');
                      navigateTo('CATEGORY_SERVICES');
                    }}
                  />
                  <IconButton
                    icon={Coffee}
                    label={t('chilling')}
                    onClick={() => {
                      setSelectedCategory('CHILLING');
                      navigateTo('CATEGORY_SERVICES');
                    }}
                  />
                </div>
              </section>

              {/* Trending Realms */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight">{t('trendingRealms')}</h3>
                  <button
                    onClick={() => {
                      setSelectedCategory('GAMES');
                      navigateTo('CATEGORY_SERVICES');
                    }}
                    className="text-xs text-purple-400 font-bold"
                  >
                    {t('viewAll')}
                  </button>
                </div>
                <div
                  className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollLeft + target.offsetWidth >= target.scrollWidth - 10) {
                      setTimeout(() => {
                        setSelectedCategory('GAMES');
                        navigateTo('CATEGORY_SERVICES');
                      }, 100);
                    }
                  }}
                >
                      {GAMES.slice(0, 8).map(game => (
                        <div
                          key={`trending-game-v2-${game.id}`}
                          onClick={() => navigateTo('GAME_DETAIL', game)}
                          className="relative min-w-[180px] h-44 rounded-2xl overflow-hidden group cursor-pointer snap-start"
                        >
                      <ResilientImage
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <span className="font-bold text-white">{game.name}</span>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">{typeof game.onlineCompanions === 'number' ? game.onlineCompanions : '—'} {selectedLanguage === 'Arabic' ? 'متصل' : 'Online'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Legend ePals */}
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{t('legendEPals')}</h3>
                  </div>
                  <button onClick={() => navigateTo('LEGEND_LIST')} className="text-sm font-bold text-purple-400 flex items-center gap-1">
                    {t('viewAll')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>

                <div
                  className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollLeft + target.offsetWidth >= target.scrollWidth - 10) {
                      setTimeout(() => navigateTo('LEGEND_LIST'), 100);
                    }
                  }}
                >
                    <div className="grid grid-rows-2 grid-flow-col gap-4">
                      {!legendEPals.length && <p className="text-sm text-gray-500 py-4">{selectedLanguage === 'Arabic' ? 'لا يوجد لاعبون في هذه المجموعة بعد.' : 'No companions in this pool yet.'}</p>}
                      {legendEPals.map(epal => (
                        <div key={`legend-epal-home-${epal.id}`} className="w-[280px] snap-start">
                          <LegendEPalCard
                            epal={epal}
                            onProfileClick={() => navigateTo('PROFILE', epal)}
                            isPlaying={playingEPalId === epal.id}
                            onPlayToggle={(e) => handlePlayToggle(epal.id, e)}
                            className="w-[280px]"
                          />
                        </div>
                      ))}
                    </div>
                </div>
              </section>

              {/* New EPals Entrance */}
              <section className="mb-8">
                <div
                  onClick={() => navigateTo('NEW_EPALS_LIST')}
                  className="relative h-[180px] rounded-[32px] overflow-hidden group cursor-pointer border border-white/10 shadow-2xl transition-all active:scale-95 mx-6"
                >
                  <ResilientImage
                    src={EPALS.find(e => !e.isLegend)?.avatarUrl || '/default-cover.svg'}
                    alt="New EPals"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-[#0f071a]/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-1">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter shadow-2xl group-hover:scale-110 transition-transform">{t('newEPals')}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Recently Joined</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* More ePals */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight">{t('moreEPals')}</h3>
                <div className="space-y-4">
                  {moreEPals.map(epal => {
                    const badgeText = epal.game;

                    return (
                      <EPalCard
                        key={`more-epal-view-card-${epal.id}`}
                        epal={epal}
                        onProfileClick={() => navigateTo('PROFILE', epal)}
                        onOrderClick={() => navigateTo('ORDER_CONFIRM', { epal })}
                        isPlaying={playingEPalId === epal.id}
                        onPlayToggle={(e) => handlePlayToggle(epal.id, e)}
                        badgeText={badgeText}

                      />
                    );
                  })}
                </div>

                {/* Sentinel for infinite scroll */}
                <div ref={lastElementRef} className="h-20 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'COMMUNITY_SELECTOR' && (
            <motion.div
              key="community_selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-6 pt-6 pb-24"
            >
              <div className="space-y-8">
                {Object.entries(
                  GAMES.reduce((acc, game) => {
                    const letter = game.name[0].toUpperCase();
                    if (!acc[letter]) acc[letter] = [];
                    acc[letter].push(game);
                    return acc;
                  }, {} as { [key: string]: Game[] })
                ).sort(([a], [b]) => a.localeCompare(b)).map(([letter, games]) => (
                  <div key={`community-selector-letter-${letter}`} className="space-y-4">
                    <div className="text-purple-400 font-bold text-lg border-b border-white/10 pb-2">{letter}</div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                      {(games as Game[]).sort((a, b) => a.name.localeCompare(b.name)).map(game => (
                        <button
                          key={`community-selector-game-${game.id}`}
                          onClick={() => {
                            setSelectedGame(game);
                            navigateTo('COMMUNITY');
                          }}
                          className="flex flex-col gap-2 transition-all text-center group"
                        >
                          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/5">
                            <ResilientImage
                              src={game.imageUrl}
                              alt={game.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="font-bold text-white text-[11px] truncate px-1">{game.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'COMMUNITY' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-0"
            >
              {/* Community Tabs */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md border-b border-white/5">
                <div className="flex px-6">
                  {[
                    { id: 'TRENDING', label: t('trending') },
                    { id: 'LATEST', label: t('latest') },
                    { id: 'FOLLOWING', label: t('following') }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCommunityTab(tab.id as any)}
                      className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                        communityTab === tab.id ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                      {communityTab === tab.id && (
                        <motion.div
                          layoutId="communityTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posts List - Seamless Style */}
              <div className="divide-y divide-white/5 pb-24">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <div
                      key={`community-post-${post.id}`}
                      onClick={() => navigateTo('POST_DETAIL', { post })}
                      className="bg-transparent hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Post Header */}
                      <div className="p-6 flex items-center justify-between">
                        <div
                          className="flex items-center gap-4 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            const epal = EPALS.find(ep => ep.id === post.userId);
                            if (epal) navigateTo('PROFILE', epal);
                          }}
                        >
                          <ResilientImage
                            src={post.userAvatar}
                            alt={post.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-purple-500/50 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-0.5">
                            <div className="font-bold text-base text-white group-hover:text-purple-400 transition-colors">{post.userName}</div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                              {post.gameName && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                                  <span className="text-purple-400/80">{post.gameName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(post.userId);
                          }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            followedEPals.has(post.userId)
                              ? 'bg-white/10 text-gray-400'
                              : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          }`}
                        >
                          {followedEPals.has(post.userId) ? t('following') : t('follow')}
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="px-6 pb-4 space-y-4">
                        <p className="text-base text-gray-200 leading-relaxed">{post.content}</p>
                        <PostImageGrid images={post.images || []} postId={post.id} />
                      </div>

                      {/* Post Actions */}
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInteractionBlocked(post.userId)) return;
                              // Handle like logic
                            }}
                            className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                          >
                            <ThumbsUp className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-bold">{post.likes}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInteractionBlocked(post.userId)) return;
                              navigateTo('POST_DETAIL', { post, focusInput: true });
                            }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-6 h-6" />
                            <span className="text-sm font-bold">{post.comments}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInteractionBlocked(post.userId)) return;
                              setShowGiftPanel(true);
                            }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <Gift className="w-6 h-6" />
                            <span className="text-sm font-bold">Gift</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportContext('POST');
                              setIsReportModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Flag className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Globe className="w-10 h-10 text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-white font-bold">No posts found</h3>
                      <p className="text-gray-500 text-sm">
                        {communityTab === 'FOLLOWING'
                          ? "You haven't followed anyone yet or they haven't posted."
                          : "Try exploring other tabs or categories."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Action Button */}
              <div className="fixed bottom-24 right-6 z-[60]">
                <button
                  onClick={() => {
                    setShowPostCategorySelector(true);
                  }}
                  className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-90 transition-all border-2 border-white/10"
                >
                  <Plus className="w-8 h-8" />
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'CATEGORY_SERVICES' && (
            <motion.div
              key="category_services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              {/* Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md border-b border-white/5">
                <div className="px-6 py-4 flex items-center gap-4">
                  <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                  </button>
                  <h2 className="text-lg font-bold">{t('service')}s</h2>
                </div>

                <div className="flex px-6 border-b border-white/5">
                  {[
                    { id: 'FAVOURITE', label: 'Favorite' },
                    { id: 'GAMES', label: 'Games' },
                    { id: 'CHILLING', label: 'Chilling' }
                  ].map(tab => (
                    <button
                      key={`category-service-tab-${tab.id}`}
                      onClick={() => setSelectedCategory(tab.id as Category)}
                      className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                        selectedCategory === tab.id ? 'text-purple-400' : 'text-gray-500'
                      }`}
                    >
                      {tab.label}
                      {selectedCategory === tab.id && (
                        <motion.div
                          layoutId="activeCategoryTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 space-y-6">
                {selectedCategory === 'GAMES' && groupedGames ? (
                <div className="space-y-8 pt-4">
                  {Object.keys(groupedGames).length > 0 ? (
                    Object.entries(groupedGames as { [key: string]: Game[] }).map(([letter, games]) => (
                      <div key={`category-letter-section-${letter}`} id={`letter-${letter}`} className="space-y-4">
                        <h3 className="text-xl font-bold text-purple-400 border-b border-white/5 pb-2">{letter}</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {games.map(game => (
                            <GameGridItem
                              key={`category-game-${game.id}`}
                              game={game}
                              isFavorite={favorites.includes(game.id)}
                              onToggleFavorite={(e) => toggleFavorite(game.id, e)}
                              onClick={() => navigateTo('GAME_DETAIL', game)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="font-bold">No games found for "{searchQuery}"</p>
                    </div>
                  )}

                  {/* Alphabet Sidebar */}
                  {Object.keys(groupedGames).length > 0 && (
                    <motion.div
                      animate={{ opacity: isScrolling ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-50 py-4 bg-black/20 backdrop-blur-sm rounded-full border border-white/5"
                    >
                      {Object.keys(groupedGames).map(letter => (
                        <button
                          key={`category-alphabet-${letter}`}
                          onClick={() => scrollToLetter(letter)}
                          className="text-[10px] font-bold text-gray-500 hover:text-purple-400 transition-colors px-2 py-0.5"
                        >
                          {letter}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 pt-4">
                  {(() => {
                    const filtered = (selectedCategory === 'FAVOURITE'
                      ? GAMES.filter(g => favorites.includes(g.id))
                      : GAMES.filter(g => g.category === selectedCategory)
                    ).filter(g =>
                      searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                          {selectedCategory === 'FAVOURITE' && searchQuery === '' ? (
                            <>
                              <Star className="w-12 h-12 opacity-20" />
                              <p className="font-bold">No favorites yet</p>
                            </>
                          ) : (
                            <>
                              <Search className="w-12 h-12 opacity-20" />
                              <p className="font-bold">No results found {searchQuery && `for "${searchQuery}"`}</p>
                            </>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-3 gap-4">
                        {filtered.map(game => (
                          <GameGridItem
                            key={`category-service-game-${game.id}`}
                            game={game}
                            isFavorite={favorites.includes(game.id)}
                            onToggleFavorite={(e) => toggleFavorite(game.id, e)}
                            onClick={() => navigateTo('GAME_DETAIL', game)}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              </div>
            </motion.div>
          )}

          {currentView === 'POST_DETAIL' && selectedPost && (
            <motion.div
              key={`post_detail_${selectedPost.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              {/* Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-white/5">
                <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>
                <h2 className="text-lg font-bold">Post Detail</h2>
              </div>

              {/* Original Post */}
              <div className="p-6 space-y-4">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => {
                    const epal = EPALS.find(ep => ep.id === selectedPost.userId);
                    if (epal) navigateTo('PROFILE', epal);
                  }}
                >
                  <ResilientImage
                    src={selectedPost.userAvatar}
                    alt={selectedPost.userName}
                    className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-purple-500/50 transition-all"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-bold text-base text-white group-hover:text-purple-400 transition-colors">{selectedPost.userName}</div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      {new Date(selectedPost.timestamp).toLocaleDateString()}
                      {selectedPost.gameName && ` • ${selectedPost.gameName}`}
                    </div>
                  </div>
                </div>
                <p className="text-base text-gray-200 leading-relaxed">{selectedPost.content}</p>
                <PostImageGrid images={selectedPost.images || []} postId={selectedPost.id} />

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-8">
                        <button className={`flex items-center gap-2 transition-colors ${selectedPost.isLiked ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                          <ThumbsUp className={`w-6 h-6 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-bold">{selectedPost.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                          <MessageSquare className="w-6 h-6" />
                          <span className="text-sm font-bold">{selectedPost.comments}</span>
                        </button>
                        <button onClick={() => setShowGiftPanel(true)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                          <Gift className="w-6 h-6" />
                          <span className="text-sm font-bold">Gift</span>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setReportContext('POST');
                          setIsReportModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Flag className="w-6 h-6" />
                      </button>
                    </div>
              </div>

              {/* Author's Services - Horizontal Scroll */}
              {(() => {
                const author = EPALS.find(e => e.id === selectedPost.userId);
                if (!author || !author.services || author.services.length === 0) return null;

                return (
                  <div className="py-6 space-y-4">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
                      {author.services
                        .sort((a, b) => {
                          const aOrders = parseInt(a.orderCount.replace(/[^0-9.]/g, '') || '0') * (a.orderCount.includes('k') ? 1000 : 1);
                          const bOrders = parseInt(b.orderCount.replace(/[^0-9.]/g, '') || '0') * (b.orderCount.includes('k') ? 1000 : 1);
                          return bOrders - aOrders;
                        })
                        .map(service => (
                          <div key={`post-author-service-${service.id}`} className="min-w-[200px]">
                            <GlassCard className="p-2 flex flex-col gap-2">
                              <div className="relative aspect-video rounded-lg overflow-hidden">
                                <ResilientImage src={service.posterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                  <span className="text-[9px] font-bold text-white">{service.rating.toFixed(1)}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-white text-xs line-clamp-1">{service.name}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{service.orderCount}</span>
                                  <button
                                    onClick={() => navigateTo('ORDER_CONFIRM', { epal: author, variant: service.variants[0] })}
                                    className="px-2 py-1 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-bold text-[10px] transition-colors active:scale-95"
                                  >
                                    <span className="flex items-center gap-1">
                                      {service.variants[0].price} <CoinIcon />
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })()}

              {/* Comments Section */}
              <div className="px-6 space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold">Comments ({selectedPost.comments})</h3>
                <div className="space-y-8">
                  {selectedPost.commentsList?.map(comment => (
                    <div key={`post-comment-${comment.id}`} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex items-start gap-3 cursor-pointer group"
                          onClick={() => {
                            const epal = EPALS.find(ep => ep.id === comment.userId);
                            if (epal) navigateTo('PROFILE', epal);
                          }}
                        >
                          <ResilientImage
                            src={comment.userAvatar}
                            className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-purple-500/50 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">{comment.userName}</span>
                              <span className="text-[10px] text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                        <button className="p-1 text-gray-500 hover:text-purple-400 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="pl-13 flex items-center gap-6">
                        <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider">Reply</button>
                        <button className="text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-wider">Report</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Input Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0b2e]/95 backdrop-blur-xl border-t border-white/10 p-4 pb-8">
                <div className="max-w-md mx-auto flex items-center gap-3">
                  <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      placeholder="Say something nice..."
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (isInteractionBlocked(selectedPost.userId)) return;
                    }}
                    className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'LEGEND_LIST' && (
            <motion.div
              key="legend_list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              {/* Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-white/5 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>
                <h2 className="text-lg font-bold">{t('legendEPals')}</h2>
              </div>

              <div className="px-6 grid grid-cols-2 gap-4">
                {EPALS.filter(e => e.isLegend).map(epal => (
                  <LegendEPalCard
                    key={`legend-list-epal-${epal.id}`}
                    epal={epal}
                    onProfileClick={() => navigateTo('PROFILE', epal)}
                    isPlaying={playingEPalId === epal.id}
                    onPlayToggle={(e) => handlePlayToggle(epal.id, e)}
                    variant="stacked"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'GAME_DETAIL' && (
            <motion.div
              key="game_detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="min-h-screen pb-20"
            >
              <div className="relative h-[35vh] w-full">
                <ResilientImage
                  src={selectedGame?.imageUrl}
                  alt={selectedGame?.name}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-transparent to-black/40" />

                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="absolute top-6 left-6 p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/40 transition-all z-50"
                >
                  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>

                <div className="absolute bottom-6 left-6">
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">{selectedGame?.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <p className="text-purple-400 font-bold text-sm tracking-widest drop-shadow-md">{typeof selectedGame?.onlineCompanions === 'number' ? selectedGame.onlineCompanions : '—'} {selectedLanguage === 'Arabic' ? 'متصل' : 'Online'}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 mt-6 space-y-4">
                {/* Sort & Filter Controls */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'DEFAULT', label: 'Default' },
                      { id: 'ORDERS', label: 'Orders' },
                      { id: 'SCORE', label: 'Score' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setEpalSortBy(option.id as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                          epalSortBy === option.id
                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowEpalFilterModal(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                      Object.values(epalFilters).some(v => v !== 'ALL' && !Array.isArray(v)) || epalFilters.priceRange[0] !== 0 || epalFilters.priceRange[1] !== 100
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                  </button>
                </div>

                {(() => {
                  const filteredEpals = EPALS
                    .filter(e => e.game.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''))
                    .filter(e => {
                      if (epalFilters.status === 'ONLINE' && e.onlineStatus !== 'Online') return false;
                      if (epalFilters.gender !== 'ALL' && e.gender !== epalFilters.gender) return false;
                      if (e.price < epalFilters.priceRange[0] || e.price > epalFilters.priceRange[1]) return false;

                      // For Server, Platform, Rank, we check playlinks
                      if (epalFilters.server !== 'ALL' || epalFilters.platform !== 'ALL' || epalFilters.rank !== 'ALL') {
                        const matchingPlaylink = e.playlinks?.find(pl =>
                          pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || '')
                        );
                        if (!matchingPlaylink) return false;
                        if (epalFilters.server !== 'ALL' && matchingPlaylink.server !== epalFilters.server) return false;
                        if (epalFilters.platform !== 'ALL' && matchingPlaylink.platform !== epalFilters.platform) return false;
                        if (epalFilters.rank !== 'ALL' && matchingPlaylink.rank !== epalFilters.rank) return false;
                      }

                      return true;
                    })
                    .sort((a, b) => {
                      if (epalSortBy === 'ORDERS') {
                        const aOrders = parseFloat(a.orderCount.replace('k', '')) * (a.orderCount.includes('k') ? 1000 : 1);
                        const bOrders = parseFloat(b.orderCount.replace('k', '')) * (b.orderCount.includes('k') ? 1000 : 1);
                        return bOrders - aOrders;
                      }
                      if (epalSortBy === 'SCORE') return b.rating - a.rating;
                      return 0; // Default
                    });

                  if (filteredEpals.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                        <Search className="w-12 h-12 opacity-20" />
                        <p className="font-bold">{t('noEPalsFound')}</p>
                        <button
                          onClick={() => setEpalFilters({
                            status: 'ALL',
                            gender: 'ALL',
                            priceRange: [0, 100],
                            server: 'ALL',
                            platform: 'ALL',
                            rank: 'ALL',
                          })}
                          className="text-purple-400 font-bold text-sm"
                        >
                          Reset Filters
                        </button>
                      </div>
                    );
                  }

                  return filteredEpals.map(epal => {
                    const playlink = epal.playlinks?.find(pl =>
                      pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || '')
                    );

                    let badgeText = undefined;
                    if (selectedGame?.category !== 'CHILLING') {
                      if (epalFilters.rank !== 'ALL') badgeText = playlink?.rank;
                      else if (epalFilters.server !== 'ALL') badgeText = playlink?.server;
                      else if (epalFilters.platform !== 'ALL') badgeText = playlink?.platform;
                      else badgeText = playlink?.rank || playlink?.role || playlink?.server;
                    }

                    return (
                      <EPalCard
                        key={`game-detail-epal-${epal.id}`}
                        epal={epal}
                        onProfileClick={() => navigateTo('PROFILE', epal)}
                        onOrderClick={() => navigateTo('ORDER_CONFIRM', { epal })}
                        isPlaying={playingEPalId === epal.id}
                        onPlayToggle={(e) => handlePlayToggle(epal.id, e)}
                        badgeText={badgeText}
                      />
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {currentView === 'PROFILE' && selectedEPal && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="space-y-0"
            >
              <div className="relative h-[35vh]">
                <ResilientImage
                  src={selectedEPal.avatarUrl}
                  alt={selectedEPal.name}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-transparent to-black/40" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
                  <button
                    onClick={handleBack}
                    className="p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/40 transition-all"
                  >
                    <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                  </button>
                  <div className="flex items-center gap-2">
                    {selectedEPal.id !== myCompanion?.id && (
                      <div className="relative">
                        <button
                          onClick={() => setIsProfileMoreOpen(!isProfileMoreOpen)}
                          className="p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/40 transition-all"
                        >
                          <MoreHorizontal className="w-6 h-6" />
                        </button>

                        <AnimatePresence>
                          {isProfileMoreOpen && (
                            <>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsProfileMoreOpen(false)}
                                className="fixed inset-0 z-[60]"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute top-12 right-0 w-40 bg-[#1a0b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[70] p-1.5"
                              >
                                <button
                                  onClick={() => {
                                    setIsProfileMoreOpen(false);
                                    setReportContext('USER');
                                    setIsReportModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-gray-300 hover:text-white"
                                >
                                  <Flag className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-bold">{t('report')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setIsProfileMoreOpen(false);
                                    setIsBlockConfirmOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all text-red-400"
                                >
                                  <Ban className="w-4 h-4" />
                                  <span className="text-xs font-bold">
                                    {blockedUsers.has(selectedEPal.id) ? t('unblock') : t('block')}
                                  </span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {selectedEPal.id === myCompanion?.id && (
                      <button
                        onClick={() => navigateTo('SETTINGS_EDIT_PROFILE')}
                        className="p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/40 transition-all"
                      >
                        <Settings className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 -mt-12 relative z-10 space-y-6">
                {/* Avatar Frame */}
                <div className="absolute -top-12 left-10 w-24 h-24 rounded-3xl border-4 border-[#0f071a] overflow-hidden shadow-2xl z-30">
                  <ResilientImage src={selectedEPal.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                <GlassCard className="p-5 pt-16 space-y-3 relative z-20 shadow-2xl">
                  {/* Follow Button - Top Right */}
                  {selectedEPal && selectedEPal.id !== myCompanion?.id && (
                    <button
                      onClick={() => selectedEPal && toggleFollow(selectedEPal.id)}
                      className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-95 transition-all group ${
                        selectedEPal && followedEPals.has(selectedEPal.id)
                          ? 'bg-white/10 border border-white/20'
                          : 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 text-white ${
                          selectedEPal && followedEPals.has(selectedEPal.id) ? 'fill-current' : ''
                        }`}
                      />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                        {selectedEPal && followedEPals.has(selectedEPal.id) ? 'Following' : 'Follow'}
                      </span>
                    </button>
                  )}

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 pr-24">
                      <h1 className="text-xl font-bold truncate tracking-tight">{selectedEPal.name}</h1>
                      {selectedEPal.gender && (
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${selectedEPal.gender === 'Female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {selectedEPal.gender === 'Female' ? <Venus className="w-3 h-3" /> : <Mars className="w-3 h-3" />}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tight">ID: {selectedEPal.id.slice(0, 8)}</span>
                        <button
                          onClick={() => copyToClipboard(selectedEPal.id)}
                          className="p-1 hover:bg-white/10 rounded-md transition-colors"
                        >
                          {copied ? <Check className="w-2.5 h-2.5 text-purple-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{selectedEPal.followersCount ?? '—'}</span>
                          <span className="font-medium opacity-60"><SourceLabel text="Followers" /></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{selectedEPal.followingCount ?? '—'}</span>
                          <span className="font-medium opacity-60"><SourceLabel text="Following" /></span>
                        </div>
                      </div>
                    </div>

                    {/* Info Badges */}
                      <div className="flex flex-wrap gap-2">
                        {selectedEPal.onlineStatus && (
                          <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-lg text-purple-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase">{selectedEPal.onlineStatus}</span>
                          </div>
                        )}

                        {selectedEPal.region && (
                          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">{selectedEPal.region}</span>
                          </div>
                        )}
                      </div>

                      {selectedEPal.bio && (
                        <p className="text-xs text-gray-400 leading-relaxed px-1">
                          {selectedEPal.bio}
                        </p>
                      )}
                    </div>
                </GlassCard>

                {/* Profile Tabs */}
                <div className="flex justify-between items-center px-2 py-4 border-b border-white/5 sticky top-0 bg-[#0f071a]/80 backdrop-blur-xl z-40 -mx-6 px-8">
                  {[
                    { id: 'Playlink', icon: Play },
                    { id: 'Service', icon: Gamepad2, hidden: !selectedEPal.services || selectedEPal.services.length === 0 },
                    { id: 'Album', icon: Image },
                    { id: 'Post', icon: Layout }
                  ].filter(tab => !tab.hidden).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileTab(tab.id as any)}
                      className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${profileTab === tab.id ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <tab.icon className={`w-5 h-5 ${profileTab === tab.id ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{tab.id}</span>
                      {profileTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-4 left-0 right-0 h-0.5 bg-purple-400 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {profileTab === 'Service' && selectedEPal.services && selectedEPal.services.length > 0 && (
                  <div className="space-y-6 pt-2 relative z-30">
                    <div className="flex gap-4 overflow-x-auto pt-4 pb-6 no-scrollbar -mx-2 px-2">
                      {selectedEPal.services.map(service => {
                        return (
                          <button
                            key={`profile-service-tab-${service.id}`}
                            onClick={() => setActiveServiceId(service.id)}
                            className={`flex flex-col items-center gap-2 shrink-0 transition-all duration-300 ${activeServiceId === service.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                          >
                            <div className={`w-20 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeServiceId === service.id ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.7)] scale-110' : 'border-white/10'}`}>
                              <ResilientImage
                                src={service.posterUrl}
                                alt={service.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${activeServiceId === service.id ? 'text-white' : 'text-gray-500'}`}>{service.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Service Content */}
                    {selectedEPal.services.find(s => s.id === activeServiceId) && (
                      <div className="space-y-6">
                        {(() => {
                          const service = selectedEPal.services.find(s => s.id === activeServiceId)!;
                          return (
                            <>
                              <GlassCard className="p-6 space-y-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1.5">
                                      <h3 className="text-xl font-bold">{service.name}</h3>
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                          <span className="text-sm font-bold">{service.rating.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                          <span className="text-sm font-bold">{service.orderCount} Orders</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => handlePlayToggle(selectedEPal.id, e)}
                                      className="w-10 h-10 bg-purple-600 border border-purple-500/50 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
                                    >
                                      {playingEPalId === selectedEPal.id ? (
                                        <WaveAnimation color="bg-white" />
                                      ) : (
                                        <Play className="w-4 h-4 text-white fill-current" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Screenshots */}
                                <ResilientImage
                                  src={service.screenshots[0]}
                                  className="w-full h-36 object-cover rounded-2xl border border-white/10"
                                  referrerPolicy="no-referrer"
                                />

                                <div className="space-y-4">
                                  <p className="text-gray-400 text-sm leading-relaxed">{service.description}</p>

                                  {/* Service Details Toggle */}
                                  {service.details && (
                                    <div className="space-y-3">
                                      <button
                                        onClick={() => setShowServiceDetails(!showServiceDetails)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors"
                                      >
                                        {showServiceDetails ? (
                                          <>
                                            <ChevronUp className="w-3 h-3" />
                                            View Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3 h-3" />
                                            View More
                                          </>
                                        )}
                                      </button>

                                      <AnimatePresence>
                                        {showServiceDetails && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="space-y-1.5 pt-1">
                                              {service.details.rank && (
                                                <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/10">
                                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest"><SourceLabel text="Rank" /></p>
                                                  <p className="text-xs font-bold text-purple-400">{service.details.rank}</p>
                                                </div>
                                              )}
                                              {service.details.server && (
                                                <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/10">
                                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest"><SourceLabel text="Server" /></p>
                                                  <p className="text-xs font-bold text-purple-400">{service.details.server}</p>
                                                </div>
                                              )}
                                              {service.details.main && (
                                                <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/10">
                                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Main</p>
                                                  <p className="text-xs font-bold text-purple-400">{service.details.main}</p>
                                                </div>
                                              )}
                                              {service.details.style && (
                                                <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/10">
                                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest"><SourceLabel text="Style" /></p>
                                                  <p className="text-xs font-bold text-purple-400">{service.details.style}</p>
                                                </div>
                                              )}
                                              {service.details.platform && (
                                                <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/10">
                                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest"><SourceLabel text="Platform" /></p>
                                                  <p className="text-xs font-bold text-purple-400">{service.details.platform}</p>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>

                                {/* Variants */}
                                <div className="space-y-3 pt-2">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-widest"><SourceLabel text="Service Types" /></h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {service.variants.map((v) => (
                                      <button
                                        key={v.name}
                                        onClick={() => navigateTo('ORDER_CONFIRM', { epal: selectedEPal, variant: v })}
                                        className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all text-start"
                                      >
                                        <span className="text-sm font-bold">{v.name}</span>
                                        <span className="text-white font-bold flex items-center gap-1">
                                          {v.price} <CoinIcon />
                                          <span className="text-[10px] text-gray-500 uppercase">/ {v.unit}</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </GlassCard>

                              {/* Reviews Section */}
                              <div className="space-y-6">
                                <div className="flex justify-between items-end px-1">
                                  <div className="space-y-1">
                                    <h3 className="text-lg font-bold"><SourceLabel text="User Reviews" /></h3>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30">
                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                        <span className="text-sm font-bold text-purple-400">{selectedEPal.rating.toFixed(1)}</span>
                                      </div>
                                      <span className="text-xs text-gray-500 font-bold">{selectedEPal.orderCount} Ratings</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => navigateTo('ALL_REVIEWS', { epal: selectedEPal })}
                                    className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                                  ><SourceLabel text="View All" /><ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Review Tags */}
                                {selectedEPal.reviewTags && (
                                  <div className="flex flex-wrap gap-2 px-1">
                                    {selectedEPal.reviewTags.map((tag, idx) => (
                                      <div
                                        key={`${tag.name}-${idx}`}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2"
                                      >
                                        <span className="text-[11px] font-bold text-gray-300">{tag.name}</span>
                                        <span className="text-[10px] font-bold text-gray-500">{tag.count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="space-y-3">
                                  {selectedEPal.reviews?.slice(0, 2).map(review => (
                                    <div key={review.id}>
                                      <GlassCard className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                            <ResilientImage src={review.userAvatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                            <div>
                                              <p className="text-sm font-bold">{review.userName}</p>
                                              <div className="flex gap-0.5">
                                                {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={`profile-review-detail-${review.id}-star-${i}`} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-700'}`} />
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                          <span className="text-[10px] text-gray-600 font-bold">{review.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 italic">"{review.comment}"</p>
                                      </GlassCard>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {profileTab === 'Playlink' && (
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    {selectedEPal.playlinks?.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => {
                          setSelectedPlaylinkId(pl.id);
                          setShowPlaylinkModal(true);
                        }}
                        className="relative aspect-[16/6] rounded-2xl overflow-hidden group active:scale-[0.98] transition-all border border-white/5"
                      >
                        <ResilientImage
                          src={pl.posterUrl}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                          <div className="space-y-1 text-start">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 backdrop-blur-md px-2 py-0.5 rounded border border-purple-500/20">
                              {pl.gameName}
                            </span>
                            <h3 className="text-lg font-black text-white tracking-tight uppercase">{pl.nickname}</h3>
                          </div>
                          {pl.platform && (
                            <div className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center">
                              {pl.platform === 'PC' && <Monitor className="w-4 h-4 text-white" />}
                              {pl.platform === 'PS' && <Gamepad2 className="w-4 h-4 text-white" />}
                              {pl.platform === 'Mobile' && <Smartphone className="w-4 h-4 text-white" />}
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-nowrap gap-2 overflow-hidden">
                          {[pl.rank, pl.server, pl.role, pl.style].filter(Boolean).map((tag, idx) => (
                            <span key={`album-tag-${selectedEPal.id}-${idx}`} className="text-[9px] font-bold text-white/90 uppercase tracking-wider bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap shrink-0">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {profileTab === 'Album' && (
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    {(selectedEPal.album || [1, 2, 3, 4, 5, 6]).map((item, i) => (
                      <div key={`profile-album-${selectedEPal.id}-${i}`} className="aspect-square rounded-xl bg-white/5 border border-white/5 overflow-hidden">
                        <ResilientImage
                          src={typeof item === 'string' ? item : `/default-cover.svg`}
                          className={`w-full h-full object-cover transition-all duration-500 ${typeof item === 'string' ? '' : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {profileTab === 'Post' && (
                  <div className="space-y-4 pt-4">
                    {(() => {
                      const userPosts = POSTS.filter(p => p.userId === selectedEPal.id);
                      if (userPosts.length === 0) {
                        return (
                          <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                              <Layout className="w-8 h-8 text-gray-600" />
                            </div>
                            <p className="text-gray-500 font-bold">No posts yet</p>
                          </div>
                        );
                      }
                      return userPosts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => navigateTo('POST_DETAIL', { post })}
                          className="w-full text-start"
                        >
                          <GlassCard className="p-4 space-y-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <ResilientImage src={post.userAvatar} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <p className="text-xs font-bold">{post.userName}</p>
                                <p className="text-[10px] text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-200 line-clamp-3">{post.content}</p>
                            {post.images && post.images.length > 0 && (
                              <div className={`grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                {post.images.slice(0, 2).map((img, idx) => (
                                  <div key={`${img}-${idx}`} className="aspect-video rounded-xl bg-white/5 overflow-hidden">
                                    <ResilientImage src={img} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </GlassCard>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Floating Profile Actions */}
              <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 pointer-events-none">
                <div className="flex gap-4 max-w-md mx-auto pointer-events-auto">
                  <button
                    onClick={() => {
                      if (!selectedEPal) return;
                      if (isInteractionBlocked(selectedEPal.id)) return;
                      navigateTo('IM_DETAIL', selectedEPal);
                    }}
                    className="flex-1 py-4 rounded-2xl bg-[#1a0b2e]/90 backdrop-blur-xl border border-white/10 font-bold flex items-center justify-center gap-3 text-white shadow-2xl active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-5 h-5 text-purple-400" /><SourceLabel text="Chat" /></button>
                  <button
                    onClick={() => {
                      if (selectedEPal && activeServiceId) {
                        if (isInteractionBlocked(selectedEPal.id)) return;
                        const service = selectedEPal.services?.find(s => s.id === activeServiceId);
                        if (service) {
                          navigateTo('ORDER_CONFIRM', { epal: selectedEPal, variant: service.variants[0] });
                        }
                      }
                    }}
                    className="flex-1 py-4 rounded-2xl bg-purple-600 font-bold shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 text-white"
                  >
                    <Play className="w-5 h-5 fill-current" /><SourceLabel text="Play" /></button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'ALL_REVIEWS' && selectedEPal && (
            <motion.div
              key="all_reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              {/* Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-white/5 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                </button>
                <h2 className="text-lg font-bold">All Reviews</h2>
              </div>

              <div className="px-6 space-y-6">
                {/* Rating Summary */}
                <GlassCard className="p-8 flex items-center justify-between bg-white/[0.03] border-white/5 rounded-[32px] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-50" />
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-baseline">
                      <span className="text-7xl font-bold text-white tracking-tighter">
                        {selectedEPal.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex gap-1.5 px-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={`profile-summary-star-${selectedEPal.id}-${i}`} className={`w-5 h-5 ${i < Math.floor(selectedEPal.rating) ? 'text-yellow-400 fill-current' : 'text-white/10'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 text-end">
                    <div className="text-white/30 text-lg font-medium tracking-tight">
                      {selectedEPal.orderCount.toLocaleString()} reviews
                    </div>
                  </div>
                </GlassCard>

              {/* Tags & Filters */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filter by Tag</h3>
                  <div className="flex items-center gap-3">
                    {(selectedReviewTag || selectedRatingFilter || reviewSortOrder !== 'DEFAULT') && (
                      <button
                        onClick={() => {
                          setSelectedReviewTag(null);
                          setSelectedRatingFilter(null);
                          setReviewSortOrder('DEFAULT');
                        }}
                        className="text-[10px] font-bold text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => setShowReviewFilterModal(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                        selectedRatingFilter || reviewSortOrder !== 'DEFAULT'
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Filter</span>
                    </button>
                  </div>
                </div>
                {selectedEPal.reviewTags && (
                  <div className="flex flex-wrap gap-2">
                    {selectedEPal.reviewTags.map((tag, idx) => (
                      <button
                        key={`${tag.name}-${idx}`}
                        onClick={() => setSelectedReviewTag(tag.name === selectedReviewTag ? null : tag.name)}
                        className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2 ${
                          selectedReviewTag === tag.name
                            ? 'bg-purple-600/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className={`text-xs font-bold ${selectedReviewTag === tag.name ? 'text-purple-400' : 'text-gray-300'}`}>
                          {tag.name}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{tag.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              {(selectedRatingFilter || reviewSortOrder !== 'DEFAULT') && (
                <div className="flex flex-wrap gap-2 px-1">
                  {selectedRatingFilter && (
                    <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                      <span className="text-[10px] font-bold text-purple-400">{selectedRatingFilter} Stars</span>
                    </div>
                  )}
                  {reviewSortOrder !== 'DEFAULT' && (
                    <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <span className="text-[10px] font-bold text-purple-400">
                        {reviewSortOrder === 'NEWEST' ? 'Newest' :
                         reviewSortOrder === 'OLDEST' ? 'Oldest' :
                         reviewSortOrder === 'RATING_HIGH' ? 'Highest Rating' : 'Lowest Rating'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Review List */}
              <div className="space-y-4">
                {(() => {
                  let filtered = [...(selectedEPal.reviews || [])];

                  // Filter by tag
                  if (selectedReviewTag) {
                    filtered = filtered.filter(r => r.tags?.includes(selectedReviewTag));
                  }

                  // Filter by rating
                  if (selectedRatingFilter) {
                    filtered = filtered.filter(r => r.rating === selectedRatingFilter);
                  }

                  // Sort
                  if (reviewSortOrder === 'NEWEST') {
                    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                  } else if (reviewSortOrder === 'OLDEST') {
                    filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                  } else if (reviewSortOrder === 'RATING_HIGH') {
                    filtered.sort((a, b) => b.rating - a.rating);
                  } else if (reviewSortOrder === 'RATING_LOW') {
                    filtered.sort((a, b) => a.rating - b.rating);
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                          <MessageSquare className="w-8 h-8 text-gray-700" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-bold">No reviews found</p>
                          <p className="text-xs text-gray-500">Try selecting a different filter or tag</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReviewTag(null);
                            setSelectedRatingFilter(null);
                            setReviewSortOrder('DEFAULT');
                          }}
                          className="text-xs font-bold text-purple-400"
                        >
                          Reset all filters
                        </button>
                      </div>
                    );
                  }

                  return filtered.map(review => (
                    <div key={review.id}>
                      <GlassCard className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => {
                              const epal = EPALS.find(ep => ep.name === review.userName);
                              if (epal) navigateTo('PROFILE', epal);
                            }}
                          >
                            <ResilientImage
                              src={review.userAvatar}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white/5 group-hover:border-purple-500/50 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-sm font-bold group-hover:text-purple-400 transition-colors">{review.userName}</p>
                              <div className="flex gap-0.5">
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <Star key={`profile-review-${review.id}-star-${i}`} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-700'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-600 font-bold">{review.date}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed italic">"{review.comment}"</p>
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {review.tags.map((t, i) => (
                              <span key={`tag-${review.id}-${i}`} className="text-[9px] font-bold text-gray-500 uppercase tracking-tight bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </GlassCard>
                    </div>
                  ));
                })()}
              </div>
              </div>
            </motion.div>
          )}

          {currentView === 'IM' && <ImView />}

          {currentView === 'CONTACTS' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 pt-6 px-6 space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold">Contacts</h1>
              </div>

              {/* Contacts Tabs */}
              <div className="flex items-center border-b border-white/5">
                {[
                  { id: 'FRIENDS', label: 'Friends' },
                  { id: 'FOLLOWING', label: 'Following' },
                  { id: 'FOLLOWERS', label: 'Followers' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setContactsTab(tab.id as any)}
                    className={`flex-1 text-center pb-3 text-sm font-bold transition-all relative ${
                      contactsTab === tab.id ? 'text-purple-400' : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                    {contactsTab === tab.id && (
                      <motion.div
                        layoutId="contactsTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                      />
                    )}
                  </button>
                ))}
              </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {(() => {
                      const filteredList = contactsTab === 'FRIENDS'
                        ? mutualFollowers
                        : contactsTab === 'FOLLOWING'
                        ? EPALS.filter(e => followedEPals.has(e.id))
                        : EPALS.filter(e => followersOfMe.has(e.id));

                      if (filteredList.length === 0) {
                        return (
                          <div className="col-span-2 py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                              <Users className="w-8 h-8 text-gray-700" />
                            </div>
                            <p className="text-gray-500 font-bold">No {contactsTab.toLowerCase()} yet</p>
                          </div>
                        );
                      }

                      return filteredList.map(epal => (
                        <div
                          key={`contact-${contactsTab}-${epal.id}`}
                          onClick={() => navigateTo('PROFILE', epal)}
                          className="flex items-center gap-3 hover:bg-white/5 transition-all cursor-pointer p-2 rounded-xl group"
                        >
                          <div className="relative shrink-0">
                            <ResilientImage src={epal.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-purple-500/50 transition-colors" referrerPolicy="no-referrer" />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f071a] ${epal.onlineStatus === 'Online' ? 'bg-purple-500' : 'bg-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate group-hover:text-purple-400 transition-colors">{epal.name}</h4>
                            <p className="text-[10px] text-gray-500 truncate">{epal.game}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
            </motion.div>
          )}

          {currentView === 'IM_DETAIL' && <ImDetailView />}

          {currentView === 'ME' && (
            <motion.div
              key="me"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a]"
            >
              <div className="px-6 pt-8 space-y-4 relative z-10">
                {/* User Info Card */}
                <div className="flex items-center gap-4 px-2">
                  <div className="relative cursor-pointer" onClick={() => isAuthenticated ? navigateTo('SETTINGS_EDIT_PROFILE') : openAuthModal()}>
                    <div className="w-20 h-20 rounded-[28px] border-4 border-[#0f071a] overflow-hidden shadow-2xl hover:border-purple-500/50 transition-all">
                      <ResilientImage src={userProfile.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-white truncate">{userProfile.name}</h1>
                      {!isAuthenticated && <button className="text-sm font-bold text-purple-400" onClick={() => openAuthModal()}>{selectedLanguage === 'Arabic' ? 'تسجيل الدخول / إنشاء حساب' : 'Login / Sign up'}</button>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold">
                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">ID: {authUser?.id ?? '—'}</span>
                      </div>
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${
                          userStatus === 'ONLINE' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          userStatus === 'PLAYING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          userStatus === 'RESTING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${
                          userStatus === 'ONLINE' ? 'bg-purple-400' :
                          userStatus === 'PLAYING' ? 'bg-blue-400' :
                          userStatus === 'RESTING' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        {userStatus}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wallet Card */}
                <GlassCard
                  className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30 overflow-hidden relative group cursor-pointer"
                  role="button" tabIndex={0} aria-label={selectedLanguage === 'Arabic' ? 'المحفظة' : 'Wallet'}
                  onKeyDown={(event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigateTo('WALLET'); } }}
                  onClick={() => navigateTo('WALLET')}
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest"><SourceLabel text="Wallet Balance" /></p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CoinIcon className="w-6 h-6" />
                          <span className="text-3xl font-black text-white tracking-tight">{wallet?.balance ?? 0}</span>
                        </div>
                        {userRole === 'PLAYER' && (
                          <>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <div className="flex items-center gap-2">
                              <Gem className="w-6 h-6 text-purple-400" />
                              <span className="text-3xl font-black text-white tracking-tight">{userDiamonds}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </GlassCard>

                {/* Main Menu */}
                <div className="space-y-2">

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => navigateTo('PURCHASE_HISTORY')}
                      className="w-full flex items-center justify-between p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 active:scale-[0.99] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-start">
                          <p className="font-bold text-white"><SourceLabel text="Purchase History" /></p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {userRole === 'PLAYER' ? (
                      <button
                        onClick={() => navigateTo('PLAYER_CENTER')}
                        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-600/20 to-transparent rounded-[24px] border border-purple-500/30 hover:bg-purple-600/20 active:scale-[0.99] transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <BarChart3 className="w-6 h-6" />
                          </div>
                          <div className="text-start">
                            <p className="font-bold text-white">Player Center</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateTo('APPLY_PLAYER')}
                        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-600/20 to-transparent rounded-[24px] border border-purple-500/30 hover:bg-purple-600/20 active:scale-[0.99] transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <Zap className="w-6 h-6 fill-current" />
                          </div>
                          <div className="text-start">
                            <p className="font-bold text-white"><SourceLabel text="Become a Player" /></p>
                            <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest"><SourceLabel text="Earn Diamonds Now" /></p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Secondary Menu */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    {[
                      { icon: Settings, label: 'Settings', color: 'text-gray-400', action: () => navigateTo('SETTINGS') },
                      { icon: UserPlus, label: 'New Users', color: 'text-purple-400', action: () => navigateTo('NEW_USERS') },
                      { icon: Ban, label: 'Blacklist', color: 'text-red-400', action: () => navigateTo('SETTINGS_BLACKLIST') },
                      { icon: HelpCircle, label: 'Feedback', color: 'text-blue-400', action: () => navigateTo('FEEDBACK') },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                          <span className="font-bold text-gray-300"><SourceLabel text={item.label} /></span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Selection Modal */}
              <AnimatePresence>
                {showStatusModal && (
                  <div className="fixed inset-0 z-[100] flex items-end justify-center px-6 pb-12">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowStatusModal(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="w-full max-w-md bg-[#1a1225] rounded-[32px] p-6 relative z-10 border border-white/10 shadow-2xl"
                    >
                      <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
                      <h3 className="text-lg font-bold text-white mb-6 text-center">Adjust Status</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'ONLINE', label: 'Online', color: 'bg-purple-500', icon: <div className="w-2 h-2 rounded-full bg-purple-500" /> },
                          { id: 'OFFLINE', label: 'Offline', color: 'bg-gray-500', icon: <div className="w-2 h-2 rounded-full bg-gray-500" /> },
                          { id: 'PLAYING', label: 'Playing', color: 'bg-blue-500', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> },
                          { id: 'RESTING', label: 'Resting', color: 'bg-yellow-500', icon: <div className="w-2 h-2 rounded-full bg-yellow-500" /> },
                        ].map((status) => (
                          <button
                            key={status.id}
                            onClick={() => {
                              setUserStatus(status.id as any);
                              setShowStatusModal(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              userStatus === status.id
                                ? 'bg-purple-600/20 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {status.icon}
                              <span className="font-bold">{status.label}</span>
                            </div>
                            {userStatus === status.id && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowStatusModal(false)}
                        className="w-full py-4 mt-6 bg-white/5 rounded-2xl text-sm font-bold text-gray-400 hover:bg-white/10 transition-all"
                      ><SourceLabel text="Cancel" /></button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {(currentView === 'PURCHASE_HISTORY' || currentView === 'MY_ORDERS') && <OriginalOrders key="purchase_history" />}

          {currentView === 'PLAYER_ORDERS' && <OriginalOrders key="player_orders" mode="player" />}

          {currentView === 'ORDER_DETAIL' && <OriginalOrders key="order_detail" mode="detail" />}

          {currentView === 'RECHARGE' && (
            <motion.div
              key="recharge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              <RechargeView
                packages={rechargePackages}
                onSelect={handleRecharge}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentView === 'APPLY_PLAYER' && (
            <motion.div
              key="apply_player"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen bg-[#0f071a] flex flex-col"
            >
              <div className="sticky top-0 z-50 backdrop-blur-md bg-[#0f071a]/80 p-6 flex items-center gap-4 border-b border-white/5">
                <button
                  onClick={() => {
                    if (playerApplicationStep > 1) {
                      setPlayerApplicationStep(prev => prev - 1);
                    } else {
                      handleBack();
                    }
                  }}
                  className="p-2 bg-white/5 rounded-xl border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold"><SourceLabel text={isEditingService ? 'Edit Service' : 'Become a Player'} /></h1>
                  {!isEditingService && (
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Step {playerApplicationStep} of 4</p>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">

                {/* Progress Bar */}
                {!isEditingService && (
                  <div className="flex gap-2 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-500 ${
                          step <= playerApplicationStep ? 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {playerApplicationStatus === 'PENDING' ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 text-center">
                    <div className="w-24 h-24 rounded-[40px] bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                      <History className="w-12 h-12 text-purple-400 animate-spin-slow" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white">Application Pending</h2>
                      <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                        Your application is awaiting review. Check this page for the actual approval status.
                      </p>
                    </div>
                    <button
                      onClick={handleBack}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-all"
                    >
                      Back to Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Step 1: Select Category */}
                    {playerApplicationStep === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white"><SourceLabel text="Choose Your Game" /></h2>
                          <p className="text-sm text-gray-500"><SourceLabel text="Select the main game you want to provide services for." /></p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Search games..."
                            value={applyGameSearchQuery}
                            onChange={(e) => setApplyGameSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                          />
                        </div>

                        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                          {[
                            { id: 'GAMES', label: 'Games' },
                            { id: 'CHILLING', label: 'Chill' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setSelectedApplyGameCategory(tab.id)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedApplyGameCategory === tab.id ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-8">
                          {Object.entries(
                            GAMES
                              .filter(game =>
                                game.category === selectedApplyGameCategory &&
                                game.name.toLowerCase().includes(applyGameSearchQuery.toLowerCase())
                              )
                              .reduce((acc, game) => {
                                const firstLetter = game.name[0].toUpperCase();
                                if (!acc[firstLetter]) acc[firstLetter] = [];
                                acc[firstLetter].push(game);
                                return acc;
                              }, {} as Record<string, Game[]>)
                          )
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([letter, games]) => (
                            <div key={`apply-game-selector-letter-${letter}`} className="space-y-2">
                              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-2">{letter}</p>
                              <div className="space-y-1">
                                {(games as Game[]).sort((a, b) => a.name.localeCompare(b.name)).map(game => (
                                  <button
                                    key={`apply-game-selector-option-${game.id}`}
                                    onClick={() => {
                                      setPlayerApplicationData(prev => ({ ...prev, gameId: game.id }));
                                    }}
                                    className={`w-full py-4 px-4 flex items-center gap-4 rounded-2xl border transition-all group ${
                                      playerApplicationData.gameId === game.id
                                        ? 'bg-purple-600/20 border-purple-500/50'
                                        : 'bg-transparent border-transparent hover:bg-white/5'
                                    }`}
                                  >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-2xl shrink-0">
                                      <ResilientImage src={game.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 text-start">
                                      <p className={`text-base font-bold transition-colors ${
                                        playerApplicationData.gameId === game.id ? 'text-white' : 'text-gray-300'
                                      }`}>{game.name}</p>
                                    </div>
                                    {playerApplicationData.gameId === game.id && (
                                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Configuration */}
                    {playerApplicationStep === 2 && (
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white"><SourceLabel text="Game Configuration" /></h2>
                          <p className="text-xs text-purple-300">{selectedLanguage === 'Arabic' ? 'يُحفظ حاليًا اسم اللعبة والنبذة والسعر بالساعة فقط. بقية الحقول اختيارية وغير محفوظة بعد.' : 'Currently only the game, introduction and hourly price are saved. Other fields are optional and not stored yet.'}</p>
                          <p className="text-sm text-gray-500">
                            Configure your {GAMES.find(g => g.id === playerApplicationData.gameId)?.name} details.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {GAMES.find(g => g.id === playerApplicationData.gameId)?.hasRank && (
                            <button
                              onClick={() => setShowApplySelectionModal({
                                show: true,
                                type: 'RANK',
                                title: 'Select Rank',
                                options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master']
                              })}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                              <div className="text-start">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"><SourceLabel text="Rank" /></p>
                                <p className={`text-sm font-bold ${playerApplicationData.rank ? 'text-white' : 'text-gray-600'}`}>
                                  {playerApplicationData.rank || 'Select Rank'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}

                          {GAMES.find(g => g.id === playerApplicationData.gameId)?.hasMain && (
                            <button
                              onClick={() => setShowApplySelectionModal({
                                show: true,
                                type: 'MAIN',
                                title: 'Select Position',
                                options: ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
                              })}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                              <div className="text-start">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"><SourceLabel text="Main Position" /></p>
                                <p className={`text-sm font-bold ${playerApplicationData.mainPosition ? 'text-white' : 'text-gray-600'}`}>
                                  {playerApplicationData.mainPosition || 'Select Position'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}

                          {GAMES.find(g => g.id === playerApplicationData.gameId)?.hasServer && (
                            <button
                              onClick={() => setShowApplySelectionModal({
                                show: true,
                                type: 'SERVER',
                                title: 'Select Server',
                                options: ['NA', 'EUW', 'EUNE', 'SEA', 'KR', 'JP']
                              })}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                              <div className="text-start">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"><SourceLabel text="Server" /></p>
                                <p className={`text-sm font-bold ${playerApplicationData.server ? 'text-white' : 'text-gray-600'}`}>
                                  {playerApplicationData.server || 'Select Server'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}

                          {GAMES.find(g => g.id === playerApplicationData.gameId)?.hasPlatform && (
                            <button
                              onClick={() => setShowApplySelectionModal({
                                show: true,
                                type: 'PLATFORM',
                                title: 'Select Platform',
                                options: ['PC', 'PS4/5', 'Xbox', 'Mobile', 'Switch']
                              })}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                              <div className="text-start">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"><SourceLabel text="Platform" /></p>
                                <p className={`text-sm font-bold ${playerApplicationData.platform ? 'text-white' : 'text-gray-600'}`}>
                                  {playerApplicationData.platform || 'Select Platform'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Style" /></p>
                            <input
                              type="text"
                              placeholder="e.g. Aggressive, Strategic, Chill"
                              value={playerApplicationData.style}
                              onChange={(e) => setPlayerApplicationData(prev => ({ ...prev, style: e.target.value }))}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Introduction" /></p>
                            <textarea
                              placeholder="Tell users about your skills and playstyle..."
                              rows={4}
                              value={playerApplicationData.intro}
                              onChange={(e) => setPlayerApplicationData(prev => ({ ...prev, intro: e.target.value }))}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all resize-none"
                            />
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Game Screenshot" /></p>
                            <div className="space-y-3">
                              {playerApplicationData.screenshots.length > 0 ? (
                                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 relative">
                                  <ResilientImage src={playerApplicationData.screenshots[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <button
                                    onClick={() => setPlayerApplicationData(prev => ({ ...prev, screenshots: [] }))}
                                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-xl text-white backdrop-blur-md"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={unavailable}
                                  className="w-full aspect-video rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-gray-500 hover:bg-white/10 transition-all"
                                >
                                  <Camera className="w-8 h-8" />
                                  <span className="text-[10px] font-black uppercase tracking-widest"><SourceLabel text="Add Game Screenshot" /></span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Voice & Cover */}
                    {playerApplicationStep === 3 && (
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white"><SourceLabel text="Voice & Cover" /></h2>
                          <p className="text-sm text-gray-500">
                            Make your profile stand out with a voice recording and a great cover.
                          </p>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Voice Recording" /></p>
                            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] flex flex-col items-center gap-6 min-h-[240px] justify-center">
                              <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center relative shrink-0">
                                {isRecording && (
                                  <motion.div
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full bg-purple-600"
                                  />
                                )}
                                <Mic2 className={`w-8 h-8 relative z-10 ${isRecording ? 'text-white' : 'text-purple-400'}`} />
                              </div>

                              <div className="text-center space-y-1 h-16 flex flex-col justify-center">
                                {isRecording ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl font-black text-white tabular-nums">
                                      0:{recordingTime.toString().padStart(2, '0')}
                                    </span>
                                    <div className="flex gap-2 h-3 items-center">
                                      {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div
                                          key={`wave-${i}`}
                                          animate={{ height: [4, 12, 4] }}
                                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                          className="w-1 bg-purple-500 rounded-full"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-white">
                                      {playerApplicationData.voiceUrl ? 'Greeting Recorded' : 'Record your greeting'}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Max 30 seconds</p>
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col w-full gap-3">
                                {!isRecording && !playerApplicationData.voiceUrl && (
                                  <button
                                    onClick={unavailable}
                                    className="w-full py-4 bg-purple-600 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                  ><SourceLabel text="Start Recording" /></button>
                                )}

                                {isRecording && (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => {
                                        clearInterval((window as any).recordingTimer);
                                        setIsRecording(false);
                                        setRecordingTime(0);
                                      }}
                                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-gray-400 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                                    ><SourceLabel text="Cancel" /></button>
                                    <button
                                      onClick={unavailable}
                                      className="flex-1 py-4 bg-purple-600 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                      Done
                                    </button>
                                  </div>
                                )}

                                {!isRecording && playerApplicationData.voiceUrl && (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={unavailable}
                                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-purple-400 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                      Re-record
                                    </button>
                                    <div className="flex-1 py-4 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Saved</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Cover Image" /></p>
                            <button
                              onClick={unavailable}
                              className="w-full aspect-[3/4] bg-white/5 border border-dashed border-white/20 rounded-[32px] overflow-hidden flex flex-col items-center justify-center gap-3 group relative"
                            >
                              {playerApplicationData.coverUrl ? (
                                <>
                                  <ResilientImage src={playerApplicationData.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-white" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-gray-500" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-white"><SourceLabel text="Upload Cover" /></p>
                                    <p className="text-[10px] text-gray-500">Portrait recommended</p>
                                  </div>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Cover Intro" /></p>
                            <input
                              type="text"
                              placeholder="A short catchy intro for your cover..."
                              value={playerApplicationData.coverIntro}
                              onChange={(e) => setPlayerApplicationData(prev => ({ ...prev, coverIntro: e.target.value }))}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Service & Promotion */}
                    {playerApplicationStep === 4 && (
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white"><SourceLabel text="Service & Pricing" /></h2>
                          <p className="text-sm text-gray-500"><SourceLabel text="Set the hourly price for your selected game. Extra services and promotions are not supported yet." /></p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {(playerApplicationData.services || []).map((service, index) => (
                            <GlassCard key={`apply-service-card-${index}`} className="p-5 flex items-center justify-between border-white/10 hover:border-purple-500/30 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                  <Gamepad2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white font-black text-sm uppercase tracking-tight">{service.serviceName}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-lg font-black text-white">{service.price}</span>
                                    <CoinIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">/ {service.unit}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setServiceForm(service);
                                    setEditingServiceIndex(index);
                                    navigateTo('APPLY_PLAYER_SERVICE_FORM');
                                  }}
                                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this service?')) {
                                      setPlayerApplicationData(prev => ({
                                        ...prev,
                                        services: prev.services.filter((_, i) => i !== index)
                                      }));
                                    }
                                  }}
                                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </GlassCard>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setServiceForm({
                              serviceName: '',
                              price: 0,
                              unit: 'hour',
                              promotion: {
                                type: 'NONE',
                                value: 0,
                                buyX: 0,
                                getY: 0,
                                limitType: 'NONE',
                                startDate: '',
                                endDate: '',
                                limitValue: 0
                              }
                            });
                            setEditingServiceIndex(null);
                            navigateTo('APPLY_PLAYER_SERVICE_FORM');
                          }}
                          className="w-full p-5 bg-white/5 border border-dashed border-white/20 rounded-2xl text-gray-500 font-bold hover:border-purple-500/50 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span><SourceLabel text="Add Service" /></span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              {playerApplicationStatus !== 'PENDING' && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f071a]/80 backdrop-blur-xl border-t border-white/10 z-50">
                  {playerApplicationStep < 4 ? (
                    <button
                      onClick={() => setPlayerApplicationStep(prev => prev + 1)}
                      disabled={(() => {
                        if (playerApplicationStep === 1) return !playerApplicationData.gameId;
                        if (playerApplicationStep === 2) {
                          if (!playerApplicationData.intro.trim()) return true;

                          return false;
                        }
                        if (playerApplicationStep === 3) {
                          return false;
                        }
                        return false;
                      })()}
                      className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all uppercase tracking-widest text-xs"
                    ><SourceLabel text="Next Step" /></button>
                  ) : (
                    <button
                      onClick={() => submitApplication()}
                      disabled={(() => {
                        if (playerApplicationStep === 4) {
                          return playerApplicationData.services.length === 0;
                        }
                        if (!playerApplicationData.serviceName || !playerApplicationData.price) return true;
                        if (playerApplicationData.promotion.type !== 'NONE') {
                          if (playerApplicationData.promotion.type === 'BUY_X_GET_Y') {
                            if (!playerApplicationData.promotion.buyX || !playerApplicationData.promotion.getY) return true;
                          } else {
                            if (!playerApplicationData.promotion.value) return true;
                          }
                          if (playerApplicationData.promotion.limitType !== 'NONE' && !playerApplicationData.promotion.limitValue) return true;
                        }
                        return false;
                      })()}
                      className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all uppercase tracking-widest text-xs"
                    >
                      <SourceLabel text={playerApplicationStatus === 'APPROVED' ? 'Update Service' : 'Submit Application'} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Selection Modal for Player Application */}
          <AnimatePresence>
            {showApplySelectionModal.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
              >
                <div
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  onClick={() => setShowApplySelectionModal(prev => ({ ...prev, show: false }))}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="relative w-full max-w-md bg-[#1a102d] rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 overflow-hidden shadow-2xl"
                >
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-white">{showApplySelectionModal.title}</h2>
                      <button
                        onClick={() => setShowApplySelectionModal(prev => ({ ...prev, show: false }))}
                        className="p-2 bg-white/5 rounded-xl border border-white/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {showApplySelectionModal.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            const type = showApplySelectionModal.type;
                            setPlayerApplicationData(prev => ({
                              ...prev,
                              rank: type === 'RANK' ? option : prev.rank,
                              mainPosition: type === 'MAIN' ? option : prev.mainPosition,
                              server: type === 'SERVER' ? option : prev.server,
                              platform: type === 'PLATFORM' ? option : prev.platform,
                            }));
                            setShowApplySelectionModal(prev => ({ ...prev, show: false }));
                          }}
                          className={`w-full p-5 rounded-2xl text-start border transition-all flex items-center justify-between group ${
                            (showApplySelectionModal.type === 'RANK' && playerApplicationData.rank === option) ||
                            (showApplySelectionModal.type === 'MAIN' && playerApplicationData.mainPosition === option) ||
                            (showApplySelectionModal.type === 'SERVER' && playerApplicationData.server === option) ||
                            (showApplySelectionModal.type === 'PLATFORM' && playerApplicationData.platform === option)
                              ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold">{option}</span>
                          {((showApplySelectionModal.type === 'RANK' && playerApplicationData.rank === option) ||
                            (showApplySelectionModal.type === 'MAIN' && playerApplicationData.mainPosition === option) ||
                            (showApplySelectionModal.type === 'SERVER' && playerApplicationData.server === option) ||
                            (showApplySelectionModal.type === 'PLATFORM' && playerApplicationData.platform === option)) && (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentView === 'APPLY_PLAYER_CATEGORY' && (
            <motion.div
              key="apply_player_category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a] p-6 space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold">Select Category</h1>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">Service Category</h2>
                  <p className="text-sm text-gray-500">What kind of service will you provide for {selectedGame?.name}?</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {['Ranked Carry', 'Normal Play', 'Coaching', 'Leveling', 'Fun & Casual'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedServiceCategory(cat);
                        navigateTo('APPLY_PLAYER_DETAILS');
                      }}
                      className={`w-full p-6 rounded-[24px] border transition-all flex items-center justify-between group ${
                        selectedServiceCategory === cat
                          ? 'bg-purple-600/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-bold text-lg">{cat}</span>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'APPLY_PLAYER_DETAILS' && (
            <motion.div
              key="apply_player_details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a] p-6 space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold">Service Details</h1>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Rank / Level</p>
                  <input
                    type="text"
                    value={applicationDetails.rank}
                    onChange={(e) => setApplicationDetails(prev => ({ ...prev, rank: e.target.value }))}
                    placeholder="e.g. Diamond IV, Level 100"
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2"><SourceLabel text="Platform" /></p>
                  <div className="grid grid-cols-3 gap-2">
                    {['PC', 'Mobile', 'Console'].map(p => (
                      <button
                        key={`apply-platform-choice-${p}`}
                        onClick={() => setApplicationDetails(prev => ({ ...prev, platform: p }))}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          applicationDetails.platform === p
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2"><SourceLabel text="Style" /></p>
                  <input
                    type="text"
                    value={applicationDetails.style}
                    onChange={(e) => setApplicationDetails(prev => ({ ...prev, style: e.target.value }))}
                    placeholder="e.g. Aggressive, Chill, Pro"
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Price (Coins/hr)</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={applicationDetails.price}
                        onChange={(e) => setApplicationDetails(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g. 5"
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <CoinIcon />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Discount (%)</p>
                    <input
                      type="number"
                      value={applicationDetails.discount}
                      onChange={(e) => setApplicationDetails(prev => ({ ...prev, discount: e.target.value }))}
                      placeholder="e.g. 10"
                      className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => submitApplication()}
                className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs"
              ><SourceLabel text="Submit Application" /></button>
            </motion.div>
          )}

          {currentView === 'SETTINGS' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a] p-6 space-y-8"
            >
              <div className="flex items-center justify-between relative">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10 relative z-10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2">{t('settings')}</h1>
                <div className="w-10" />
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2"><SourceLabel text="Account" /></p>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigateTo('SETTINGS_EDIT_PROFILE')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-300"><SourceLabel text="Edit Profile" /></span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigateTo('SETTINGS_CHANGE_PASSWORD')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Change Password" /></span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigateTo('SETTINGS_LINKED_ACCOUNTS')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Linked Accounts" /></span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2"><SourceLabel text="General" /></p>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigateTo('SETTINGS_LANGUAGE')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300">{t('language')}</span>
                      <div className="flex items-center gap-2">
                        <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${selectedLanguage === 'Arabic' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('SETTINGS_NOTIFICATIONS')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Notifications" /></span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => setIsClearCacheConfirmOpen(true)}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Clear Cache" /></span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-600">{cacheSize}</span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2"><SourceLabel text="About" /></p>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigateTo('SETTINGS_PRIVACY')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Privacy Policy" /></span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigateTo('SETTINGS_TERMS')}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-gray-300"><SourceLabel text="Terms of Service" /></span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="w-full flex items-center justify-between p-5">
                      <span className="font-bold text-gray-300"><SourceLabel text="Version" /></span>
                      <span className="text-[10px] font-bold text-gray-600">v1.2.0 (MVP)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-5 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all">
                    <LogOut className="w-5 h-5" />
                    <span><SourceLabel text="Logout Account" /></span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'RANKING_CENTER' && <CompanionLevelDashboard />}

          {currentView === 'PLAYER_CENTER' && <OriginalPlayerCenter />}

          {currentView === 'COMPANION_LEVEL_DASHBOARD' && (
            <CompanionLevelDashboard
              ranking={playerRanking}
              onBack={handleBack}
              onNavigate={navigateTo}
            />
          )}

          {currentView === 'TASK_CENTER' && (
            <TaskCenter
              ranking={playerRanking}
              onBack={handleBack}
            />
          )}

          {currentView === 'LEVEL_BENEFITS' && (
            <LevelBenefits
              ranking={playerRanking}
              onBack={handleBack}
            />
          )}

          {currentView === 'INCOME_REVIEW' && (
            <IncomeReview
              ranking={playerRanking}
              onBack={handleBack}
            />
          )}

          {currentView === 'CUSTOMER_REVIEW' && (
            <CustomerReview
              onBack={handleBack}
              onNavigate={navigateTo}
            />
          )}

          {currentView === 'PLAYER_SERVICES' && (
            <motion.div
              key="player_services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-24 bg-[#0f071a] flex flex-col"
            >
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between relative shrink-0">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10 relative z-10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2">Game Services</h1>

                <div className="relative z-10">
                  <button
                    onClick={() => setShowServiceSortMenu(!showServiceSortMenu)}
                    className={`p-2 rounded-xl border transition-all ${showServiceSortMenu ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showServiceSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a102a] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1"
                      >
                        {[
                          { id: 'NAME_ASC', label: 'Name (A-Z)', icon: ChevronDown },
                          { id: 'NAME_DESC', label: 'Name (Z-A)', icon: ChevronUp },
                          { id: 'ORDERS_DESC', label: 'Orders (High-Low)', icon: TrendingUp },
                          { id: 'ORDERS_ASC', label: 'Orders (Low-High)', icon: TrendingUp },
                        ].map(sort => (
                          <button
                            key={sort.id}
                            onClick={() => {
                              setServiceSort(sort.id as any);
                              setShowServiceSortMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-start transition-all ${
                              serviceSort === sort.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{sort.label}</span>
                            <sort.icon className="w-3 h-3" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12">
                <div className="space-y-8">
                  {(() => {
                    const sortedServices = [...playerServices].sort((a, b) => {
                      if (serviceSort === 'NAME_ASC') return a.name.localeCompare(b.name);
                      if (serviceSort === 'NAME_DESC') return b.name.localeCompare(a.name);
                      if (serviceSort === 'ORDERS_DESC') return b.orders - a.orders;
                      if (serviceSort === 'ORDERS_ASC') return a.orders - b.orders;
                      return 0;
                    });

                    const grouped = sortedServices.reduce((acc, s) => {
                      if (!acc[s.name]) acc[s.name] = [];
                      acc[s.name].push(s);
                      return acc;
                    }, {} as Record<string, any[]>);

                    return (Object.entries(grouped) as [string, any[]][]).map(([gameName, services]) => (
                      <div key={gameName} className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className="w-1 h-4 bg-purple-500 rounded-full" />
                          <h3 className="text-xs font-black text-white uppercase tracking-widest">{gameName}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {services.map((service) => (
                            <GlassCard key={service.id} className="relative group overflow-visible">
                              <div className="flex gap-4 p-4">
                                {/* Cover Image */}
                                <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0">
                                  <ResilientImage
                                    src={service.coverUrl}
                                    alt={service.coverName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />

                                  {/* Voice Preview Button - Moved to bottom right of image */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPlayingServiceId(playingServiceId === service.id ? null : service.id);
                                    }}
                                    className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all border border-white/20 ${
                                      playingServiceId === service.id ? 'bg-purple-600' : 'bg-purple-600/80 backdrop-blur-md'
                                    }`}
                                  >
                                    {playingServiceId === service.id ? (
                                      <WaveAnimation color="bg-white" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    )}
                                  </button>
                                </div>

                                {/* Service Details */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-bold text-white text-base leading-tight">{service.coverName}</h4>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xl font-black text-white">{service.price}</span>
                                        <CoinIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">/ {service.unit}</span>
                                      </div>

                                      {/* Toggle Switch */}
                                      <div className="flex items-center gap-2 mt-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setServiceToToggle(service);
                                          }}
                                          className={`relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out ${
                                            service.status === 'ONLINE' ? 'bg-purple-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-700'
                                          }`}
                                        >
                                          <motion.div
                                            layout
                                            initial={false}
                                            animate={{
                                              x: service.status === 'ONLINE' ? 24 : 4,
                                              scale: service.status === 'ONLINE' ? 1.1 : 1,
                                              backgroundColor: "#ffffff"
                                            }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 500,
                                              damping: 30,
                                              mass: 1
                                            }}
                                            className="absolute top-1 left-0 w-4 h-4 rounded-full shadow-lg z-10"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                                            <div className={`w-1 h-1 rounded-full bg-white/20 transition-opacity duration-300 ${service.status === 'ONLINE' ? 'opacity-0' : 'opacity-100'}`} />
                                            <div className={`w-1 h-1 rounded-full bg-white/20 transition-opacity duration-300 ${service.status === 'ONLINE' ? 'opacity-100' : 'opacity-0'}`} />
                                          </div>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={unavailable}
                                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                      >
                                        <Settings className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setServiceToDelete(service);
                                        }}
                                        className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                                        title="Delete Service"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </GlassCard>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Fixed Bottom Bar for Add New Service */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f071a] via-[#0f071a] to-transparent pt-12 z-50">
                <button
                  onClick={() => {
                    setIsEditingService(false);
                    setPlayerApplicationStep(1);
                    setPlayerApplicationData({
                      gameId: '',
                      rank: '',
                      mainPosition: '',
                      server: '',
                      platform: '',
                      style: '',
                      intro: '',
                      screenshots: [],
                      voiceUrl: '',
                      coverUrl: '',
                      coverIntro: '',
                      services: [],
                    });
                    navigateTo('APPLY_PLAYER');
                  }}
                  className="w-full p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Service</span>
                </button>
              </div>

              {/* Confirmation Modals */}
              <AnimatePresence>
                {serviceToToggle && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-sm bg-[#1a102a] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-white">
                          {serviceToToggle.status === 'ONLINE' ? 'Take Down Service?' : 'List Service?'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {serviceToToggle.status === 'ONLINE'
                            ? 'This service will be hidden from the marketplace. You can list it again anytime.'
                            : 'This service will be visible to all users in the marketplace.'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setServiceToToggle(null)}
                          className="flex-1 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                        ><SourceLabel text="Cancel" /></button>
                        <button
                          onClick={() => unavailable()}
                          className="flex-1 p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg transition-all"
                        ><SourceLabel text="Confirm" /></button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {serviceToDelete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-sm bg-[#1a102a] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-white">Delete Service?</h3>
                        <p className="text-sm text-gray-400">
                          This action cannot be undone. All service data and history will be permanently removed.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setServiceToDelete(null)}
                          className="flex-1 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                        ><SourceLabel text="Cancel" /></button>
                        <button
                          onClick={() => unavailable()}
                          className="flex-1 p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg transition-all"
                        ><SourceLabel text="Delete" /></button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentView === 'APPLY_PLAYER_SERVICE_FORM' && (
            <motion.div
              key="apply_player_service_form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a] p-6 space-y-8"
            >
              <div className="flex items-center justify-between relative">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10 relative z-10">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2">
                  <SourceLabel text={editingServiceIndex !== null ? 'Edit Service' : 'New Service'} />
                </h1>
                <div className="w-10" />
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Service Name" /></p>
                  <input
                    type="text"
                    placeholder="e.g. Pro Carry Service"
                    value={serviceForm.serviceName}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, serviceName: e.target.value }))}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-1 px-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest"><SourceLabel text="Price" /></p>
                      <button
                        onClick={unavailable}
                        className="text-gray-600 hover:text-white transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Hourly price in coins" min={1}
                        value={serviceForm.price || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const [min, max] = [1, Number.MAX_SAFE_INTEGER];
                          if (val > max) {
                            setServiceForm(prev => ({ ...prev, price: max }));
                          } else {
                            setServiceForm(prev => ({ ...prev, price: val }));
                          }
                        }}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          const [min, max] = [1, Number.MAX_SAFE_INTEGER];
                          if (val < min) setServiceForm(prev => ({ ...prev, price: min }));
                        }}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all pr-12"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <CoinIcon />
                      </div>
                    </div>
                  </div>

                  <div className="pb-5 text-gray-600 font-black text-xl">/</div>

                  <div className="flex-1 space-y-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2"><SourceLabel text="Unit" /></p>
                    <div className="relative">
                      <select
                        value={serviceForm.unit}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500/50 outline-none transition-all appearance-none"
                      >
                        <option value="hour">hour</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Promotion (Optional)</p>
                    <button
                      onClick={unavailable}
                      className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                        serviceForm.promotion.type !== 'NONE' ? 'text-purple-400' : 'text-gray-600'
                      }`}
                    >
                      {serviceForm.promotion.type !== 'NONE' ? 'Remove' : 'Add'}
                    </button>
                  </div>

                  {serviceForm.promotion.type !== 'NONE' && (
                    <div className="space-y-6 p-6 bg-white/5 border border-white/10 rounded-[32px]">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion Type</p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'FIRST_ORDER_DISCOUNT', label: 'First Order Discount' },
                            { id: 'DISCOUNT', label: 'General Discount' },
                            { id: 'BUY_X_GET_Y', label: 'Buy X Get Y' }
                          ].map((type) => (
                            <button
                              key={`service-promotion-type-${type.id}`}
                              onClick={() => setServiceForm(prev => ({
                                ...prev,
                                promotion: { ...prev.promotion, type: type.id as any }
                              }))}
                              className={`p-4 rounded-2xl text-start border transition-all ${
                                serviceForm.promotion.type === type.id ? 'bg-purple-600/20 border-purple-500/50 text-white' : 'bg-white/5 border-white/10 text-gray-500'
                              }`}
                            >
                              <p className="text-xs font-bold">{type.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {serviceForm.promotion.type === 'BUY_X_GET_Y' ? 'Promotion Details' : 'Discount Value (1-20%)'}
                        </p>
                        {serviceForm.promotion.type === 'BUY_X_GET_Y' ? (
                          <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                              <p className="text-[8px] font-black text-gray-500 uppercase px-2">Buy X</p>
                              <input
                                type="number"
                                placeholder="1-10"
                                min="1"
                                max="10"
                                value={serviceForm.promotion.buyX || ''}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val > 10) val = 10;
                                  if (val < 1) val = 1;
                                  setServiceForm(prev => ({
                                    ...prev,
                                    promotion: { ...prev.promotion, buyX: val }
                                  }));
                                }}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500/50 outline-none transition-all"
                              />
                            </div>
                            <div className="pt-6 text-gray-500 font-black">GET</div>
                            <div className="flex-1 space-y-1">
                              <p className="text-[8px] font-black text-gray-500 uppercase px-2">Get Y</p>
                              <input
                                type="number"
                                placeholder="1-10"
                                min="1"
                                max="10"
                                value={serviceForm.promotion.getY || ''}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val > 10) val = 10;
                                  if (val < 1) val = 1;
                                  setServiceForm(prev => ({
                                    ...prev,
                                    promotion: { ...prev.promotion, getY: val }
                                  }));
                                }}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500/50 outline-none transition-all"
                              />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="number"
                            placeholder="1-20"
                            min="1"
                            max="20"
                            value={serviceForm.promotion.value || ''}
                            onChange={(e) => {
                              let val = Number(e.target.value);
                              if (val > 20) val = 20;
                              if (val < 1) val = 1;
                              setServiceForm(prev => ({
                                ...prev,
                                promotion: { ...prev.promotion, value: val }
                              }));
                            }}
                            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                          />
                        )}
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion Limit</p>
                        <div className="flex gap-2">
                          {[
                            { id: 'NONE', label: 'None' },
                            { id: 'TIME', label: 'Time' },
                            { id: 'QUANTITY', label: 'Qty' }
                          ].map((limit) => (
                            <button
                              key={limit.id}
                              onClick={() => setServiceForm(prev => ({
                                ...prev,
                                promotion: { ...prev.promotion, limitType: limit.id as any }
                              }))}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                serviceForm.promotion.limitType === limit.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'
                              }`}
                            >
                              {limit.label}
                            </button>
                          ))}
                        </div>
                        {serviceForm.promotion.limitType === 'TIME' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-500 uppercase px-2">Start Date</p>
                              <button
                                onClick={() => onOpenDatePicker('PROMO_START', serviceForm.promotion.startDate || '', 'Start Date')}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-start hover:bg-white/10 transition-all"
                              >
                                {serviceForm.promotion.startDate || 'Select'}
                              </button>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-500 uppercase px-2">End Date</p>
                              <button
                                onClick={() => onOpenDatePicker('PROMO_END', serviceForm.promotion.endDate || '', 'End Date')}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-start hover:bg-white/10 transition-all"
                              >
                                {serviceForm.promotion.endDate || 'Select'}
                              </button>
                            </div>
                          </div>
                        )}
                        {serviceForm.promotion.limitType === 'QUANTITY' && (
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-gray-500 uppercase px-2">Quantity (1-10)</p>
                            <input
                              type="number"
                              placeholder="1-10"
                              min="1"
                              max="10"
                              value={serviceForm.promotion.limitValue || ''}
                              onChange={(e) => {
                                let val = Number(e.target.value);
                                if (val > 10) val = 10;
                                if (val < 1) val = 1;
                                setServiceForm(prev => ({
                                  ...prev,
                                  promotion: { ...prev.promotion, limitValue: val }
                                }));
                              }}
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f071a]/80 backdrop-blur-xl border-t border-white/10 z-50">
                <button
                  onClick={() => {
                    if (!serviceForm.serviceName || !serviceForm.price) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    setPlayerApplicationData(prev => {
                      const newServices = [...(prev.services || [])];
                      if (editingServiceIndex !== null) {
                        newServices[editingServiceIndex] = serviceForm;
                      } else {
                        newServices.push(serviceForm);
                      }
                      return { ...prev, services: newServices };
                    });
                    handleBack();
                  }}
                  className="w-full p-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-[0.98]"
                >
                  <SourceLabel text={editingServiceIndex !== null ? 'Save Changes' : 'Add Service'} />
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'WITHDRAW' && <OriginalWithdraw />}

          {currentView === 'EXCHANGE_DIAMONDS' && <OriginalExchange />}

          {currentView === 'SETTINGS_EDIT_PROFILE' && (
            <motion.div
              key="settings_edit_profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage
                title="Edit Profile"
                stickyHeader
                onBack={() => {
                  const hasChanges = JSON.stringify(userProfile) !== JSON.stringify(tempProfile);
                  if (hasChanges) {
                    setShowExitConfirm(true);
                  } else {
                    handleBack();
                  }
                }}
                rightElement={
                  <button
                    onClick={() => unavailable()}
                    className="text-purple-400 font-black uppercase tracking-widest text-[11px] px-4 py-2 bg-purple-400/10 rounded-xl border border-purple-400/20 active:scale-95 transition-all"
                  ><SourceLabel text="Save" /></button>
                }
              >
                <div className="space-y-8 pb-10">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-white/5">
                        <ResilientImage
                          src={tempProfile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <OriginalAvatarUpload onUploaded={(url) => setTempProfile(prev => ({...prev, avatarUrl:url}))} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Nickname</p>
                      <input
                        type="text"
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                        placeholder="Your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Gender (Non-modifiable)</p>
                      <div className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl text-gray-500 font-bold flex items-center gap-3">
                        {tempProfile.gender === 'Female' ? <Venus className="w-4 h-4 shrink-0" /> : <Mars className="w-4 h-4 shrink-0" />}
                        <span className="flex-1">{tempProfile.gender}</span>
                        <Lock className="w-4 h-4 opacity-30" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Birthday</p>
                      <button
                        onClick={() => onOpenDatePicker('BIRTHDAY', tempProfile.birthday, 'Select Birthday')}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.99]"
                      >
                        <span>{tempProfile.birthday || 'Select Birthday'}</span>
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Country / Region</p>
                      <button
                        onClick={() => setShowCountryPicker(true)}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.99]"
                      >
                        <span>{tempProfile.region || 'Select Country'}</span>
                        <Globe className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Bio</p>
                      <textarea
                        value={tempProfile.bio}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500/50 outline-none transition-all h-32 resize-none placeholder:text-gray-700"
                        placeholder="Tell the community about yourself..."
                      />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Playlinks</p>
                      <button
                        onClick={() => navigateTo('MANAGE_PLAYLINKS')}
                        className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl group active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Gamepad2 className="w-5 h-5" />
                          </div>
                          <div className="text-start">
                            <p className="text-white font-bold text-sm">Manage Playlinks</p>
                            <p className="text-[10px] text-gray-500 font-medium">{myPlaylinks.length} Connected Accounts</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Album Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Album ({tempProfile.album.length}/9)</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {tempProfile.album.map((url, index) => (
                        <div key={`settings-album-preview-${index}`} className="relative aspect-square group">
                          <ResilientImage
                            src={url}
                            className="w-full h-full object-cover rounded-2xl border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => setTempProfile(prev => ({
                              ...prev,
                              album: prev.album.filter((_, i) => i !== index)
                            }))}
                            className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      ))}
                      {tempProfile.album.length < 9 && (
                        <button
                          onClick={unavailable}
                          className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600 hover:border-purple-500/50 hover:text-purple-400 transition-all active:scale-95"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Add Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_CHANGE_PASSWORD' && (
            <motion.div
              key="settings_change_password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Change Password" onBack={handleBack}>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Current Password</p>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full p-5 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-700 focus:border-purple-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">New Password</p>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="password"
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full p-5 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-700 focus:border-purple-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Confirm New Password</p>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                        placeholder="Repeat new password"
                        className="w-full p-5 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-700 focus:border-purple-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleUpdatePassword}
                    className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs mt-8"
                  >
                    Update Password
                  </button>
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_LINKED_ACCOUNTS' && (
            <motion.div
              key="settings_linked_accounts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Linked Accounts" onBack={handleBack}>
                <div className="space-y-2 pt-4">
                  {/* Critical Bindings: Phone & Email */}
                  <div className="space-y-2">
                    {[
                      { id: 'PHONE', name: 'Phone Number', icon: <Phone className="w-5 h-5 text-purple-400" />, value: userProfile.phone },
                      { id: 'EMAIL', name: 'Email Address', icon: <Mail className="w-5 h-5 text-blue-400" />, value: userProfile.email },
                    ].map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => acc.value ? handleStartBind(acc.id as any, acc.value) : handleStartBind(acc.id as any)}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-all">
                            {acc.icon}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{acc.name}</p>
                            <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                              {acc.value || (acc.id === 'EMAIL' ? 'Not bound' : '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acc.value ? (
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:translate-x-1 transition-transform" />
                          ) : (
                            <button
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              Bind
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Third Party Bindings */}
                  <div className="space-y-2">
                    {[
                      { name: 'Discord', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-[#5865F2]', linked: userProfile.linkedAccounts.Discord, username: '' },
                      { name: 'Google', icon: <Globe className="w-5 h-5" />, color: 'bg-[#DB4437]', linked: userProfile.linkedAccounts.Google },
                      { name: 'Facebook', icon: <Globe className="w-5 h-5" />, color: 'bg-[#4267B2]', linked: userProfile.linkedAccounts.Facebook },
                      { name: 'Apple', icon: <Smartphone className="w-5 h-5" />, color: 'bg-white text-black text-black', linked: userProfile.linkedAccounts.Apple },
                    ].map(acc => (
                      <div key={acc.name} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${acc.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                            {acc.icon}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{acc.name}</p>
                            {acc.linked && <p className="text-[10px] font-bold text-gray-500 mt-0.5">{acc.username || 'Linked'}</p>}
                          </div>
                        </div>
                        <button
                          disabled={acc.linked}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            acc.linked ? 'bg-white/5 text-gray-700 border border-white/10 cursor-not-allowed' : 'bg-purple-600 text-white shadow-lg'
                          }`}
                        >
                          {acc.linked ? 'Linked' : 'Link'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_LANGUAGE' && (
            <motion.div
              key="settings_language"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title={t('language')} onBack={handleBack}>
                <div className="space-y-2 pt-4">
                  {(['English', 'Arabic'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (lang !== selectedLanguage) {
                          setPendingLanguage(lang);
                          setShowLanguageConfirm(true);
                        } else {
                          handleBack();
                        }
                      }}
                      className={`w-full p-5 flex items-center justify-between rounded-2xl border transition-all ${
                        selectedLanguage === lang
                          ? 'bg-purple-600/10 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-bold">{lang === 'Arabic' ? 'العربية' : 'English'}</span>
                      {selectedLanguage === lang && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_PRIVACY' && (
            <motion.div
              key="settings_privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Privacy Policy" onBack={handleBack}>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-gray-400">{selectedLanguage === 'Arabic' ? 'لم يتم نشر نص معتمد لهذه السياسة بعد.' : 'Approved policy content has not been published yet.'}</div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_TERMS' && (
            <motion.div
              key="settings_terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Terms of Service" onBack={handleBack}>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-gray-400">{selectedLanguage === 'Arabic' ? 'لم يتم نشر نص معتمد لهذه السياسة بعد.' : 'Approved policy content has not been published yet.'}</div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_NOTIFICATIONS' && (
            <motion.div
              key="settings_notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Notifications" onBack={handleBack}>
                <div className="px-6 space-y-4">
                  {[
                    { key: 'message', label: 'Message Messages' },
                    { key: 'order', label: 'Order Messages' },
                    { key: 'system', label: 'System Messages' },
                    { key: 'post', label: 'Post Messages' }
                  ].map(({ key, label }) => (
                    <div key={key} className="w-full flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <span className="font-bold text-gray-300">{label}</span>
                      <button
                        onClick={unavailable}
                        className={`w-10 h-5 rounded-full relative transition-colors ${notificationSettings[key as keyof typeof notificationSettings] ? 'bg-purple-600' : 'bg-white/10'}`}
                      >
                        <motion.div
                          animate={{ x: notificationSettings[key as keyof typeof notificationSettings] ? 24 : 4 }}
                          className="absolute top-1 w-3 h-3 rounded-full bg-white"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'SETTINGS_BLACKLIST' && (
            <motion.div
              key="settings_blacklist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Blacklist" onBack={() => handleBack()}>
                <div className="px-6 space-y-4">
                  {blockedUsers.size === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                        <Ban className="w-10 h-10 text-gray-700" />
                      </div>
                      <p className="text-gray-500 font-bold">Your blacklist is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                       {Array.from(blockedUsers).map(userId => {
                         const epal = EPALS.find(e => e.id === userId);
                         if (!epal) return null;
                         return (
                           <div key={`blacklist-item-${epal.id}`} className="flex items-center justify-between py-4 border-b border-white/5">
                             <div className="flex items-center gap-4">
                               <ResilientImage src={epal.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-lg" referrerPolicy="no-referrer" />
                               <div>
                                 <p className="font-bold text-white text-base">{epal.name}</p>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">ID: {epal.id.slice(0, 12)}...</p>
                               </div>
                             </div>
                              <button
                                onClick={() => {
                                  setUserToUnblock(epal.id);
                                  setIsUnblockConfirmOpen(true);
                                }}
                                className="px-5 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-red-400 transition-all active:scale-95"
                              >
                                Unblock
                              </button>
                           </div>
                         )
                       })}
                    </div>
                  )}
                </div>
              </SettingsSubPage>
            </motion.div>
          )}

          {currentView === 'NEW_USERS' && (
            <motion.div
              key="new_users-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IcebreakerPoolView
                onBack={handleBack}
                onNavigateToProfile={(payload) => navigateTo('PROFILE', payload)}
                t={t as any}
              />
            </motion.div>
          )}

          {currentView === 'NEW_EPALS_LIST' && (
            <motion.div
              key="new_epals-page"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md border-b border-white/5 px-6 pt-12 pb-6 flex items-center gap-4">
                <button onClick={handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">{t('newEPals')}</h1>
              </div>

              {/* New EPals List */}
              <div className="px-6 space-y-4 pt-6">
                {!newEPals.length && <p className="p-6 text-sm text-gray-500">{selectedLanguage === 'Arabic' ? 'لا يوجد لاعبون جدد بعد.' : 'No new companions yet.'}</p>}
                {newEPals.slice(0, 15).map(epal => (
                  <EPalCard
                    key={`new_epals-page-epal-${epal.id}`}
                    epal={epal}
                    onProfileClick={() => navigateTo('PROFILE', epal)}
                    onOrderClick={() => navigateTo('ORDER_CONFIRM', { epal })}
                    isPlaying={playingEPalId === epal.id}
                    onPlayToggle={(e) => handlePlayToggle(epal.id, e)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'WALLET' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20"
            >
              <WalletView
                wallet={wallet}
                transactions={transactions}
                packages={rechargePackages}
                onSelectPackage={handleRecharge}
                onBack={handleBack}
                userRole={userRole}
                userDiamonds={userDiamonds}
                diamondTransactions={diamondTransactions}
                onWithdraw={() => navigateTo('WITHDRAW')}
                onExchange={() => navigateTo('EXCHANGE_DIAMONDS')}
                onOpenDatePicker={(id, val, title) => setDatePickerTarget({ id, value: val, title })}
                startDate={walletStartDate}
                endDate={walletEndDate}
                onResetDates={() => {
                  setWalletStartDate('');
                  setWalletEndDate('');
                }}
              />
            </motion.div>
          )}

          {currentView === 'FEEDBACK' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FeedbackView
                onBack={handleBack}
                onOpenDatePicker={(id, val, title) => setDatePickerTarget({ id, value: val, title })}
                selectedTime={feedbackTime}
              />
            </motion.div>
          )}

          {currentView === 'MANAGE_PLAYLINKS' && (
            <motion.div
              key="manage_playlinks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ManagePlaylinksView
                playlinks={myPlaylinks}
                onAdd={() => {
                  setEditingPlaylinkId(null);
                  navigateTo('ADD_PLAYLINK');
                }}
                onEdit={(id) => {
                  setEditingPlaylinkId(id);
                  navigateTo('ADD_PLAYLINK');
                }}
                onDelete={(id) => {
                  setPlaylinkToDelete(id);
                }}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentView === 'ADD_PLAYLINK' && (
            <motion.div
              key="add_playlink"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AddPlaylinkView
                games={GAMES}
                onBack={handleBack}
                initialData={editingPlaylinkId ? myPlaylinks.find(l => l.id === editingPlaylinkId) : undefined}
                onSave={() => unavailable()}
              />
            </motion.div>
          )}

          {currentView === 'NOTIFICATIONS' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen pb-20 bg-[#0f071a]"
            >
              {/* Header */}
              <div className="sticky top-0 z-50 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                  </button>
                  <h1 className="text-xl font-bold"><SourceLabel text="Notifications" /></h1>
                </div>
                <button
                  onClick={() => setIsMarkReadConfirmOpen(true)}
                  className="p-2 text-gray-500 hover:text-purple-400 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6 pt-6 border-b border-white/5">
                {(['ORDER', 'SOCIAL', 'SYSTEM'] as const).map((tab) => (
                  <button
                    key={`notif-tab-${tab}`}
                    onClick={() => setNotificationTab(tab)}
                    className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                      notificationTab === tab ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {tab}
                    {notifications.some(n => n.type === tab && n.unread) && (
                      <span className="absolute top-0 right-[20%] w-2 h-2 rounded-full bg-red-500 border border-[#0f071a]" />
                    )}
                    {notificationTab === tab && (
                      <motion.div
                        layoutId="activeTabNotif"
                        className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="space-y-1">
                {notifications
                  .filter(n => n.type === notificationTab)
                  .map((notif) => (
                    <div
                      key={`notif-item-${notif.id}`}
                      onClick={() => unavailable()}
                      className="px-6 py-5 relative transition-all active:bg-white/5 cursor-pointer flex gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold transition-colors ${notif.unread ? 'text-white' : 'text-gray-400'}`}>{notif.title}</h3>
                          <span className="text-[10px] font-bold text-gray-600">{notif.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-500">{notif.content}</p>
                      </div>
                      {notif.unread && (
                        <div className="shrink-0 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        </div>
                      )}
                    </div>
                  ))}
                {notifications.filter(n => n.type === notificationTab).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Mark All as Read Confirmation Modal */}
          <AnimatePresence>
            {isMarkReadConfirmOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMarkReadConfirmOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-sm bg-[#1a0b2e] border border-white/10 rounded-[32px] p-8 space-y-6 relative z-10"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <CheckCheck className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white text-center">Mark all as read?</h3>
                      <p className="text-sm text-gray-400 leading-relaxed px-4 text-center">
                        All {notificationTab.toLowerCase()} notifications will be marked as read.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => unavailable()}
                      className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-900/40 active:scale-95"
                    ><SourceLabel text="Confirm" /></button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {currentView === 'ORDER_CONFIRM' && <OrderConfirmView />}
        </motion.div>
      </AnimatePresence>

        {/* Unfollow Confirmation Modal */}
        <AnimatePresence>
          {showUnfollowModal && epalToUnfollow && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUnfollowModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-[201] p-6 pointer-events-none"
              >
                <GlassCard className="w-full max-w-xs p-6 space-y-6 pointer-events-auto shadow-2xl border-white/20 bg-[#1a0b2e]/90">
                  <div className="space-y-2 text-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border-2 border-purple-500/30">
                      <ResilientImage src={epalToUnfollow.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="text-lg font-bold">Unfollow {epalToUnfollow.name}?</h3>
                    <p className="text-xs text-gray-400">{t('unfollowConfirm')}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmUnfollow}
                      className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-bold text-sm active:scale-95 transition-all"
                    >
                      Unfollow
                    </button>
                    <button
                      onClick={() => setShowUnfollowModal(false)}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm active:scale-95 transition-all"
                    ><SourceLabel text="Cancel" /></button>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Playlink Gallery Modal */}
        <AnimatePresence>
          {showPlaylinkModal && selectedEPal && selectedPlaylinkId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
              onClick={() => setShowPlaylinkModal(false)}
            >
              <button
                className="absolute top-10 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white z-[110] active:scale-90 transition-transform"
                onClick={() => setShowPlaylinkModal(false)}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>

              <div
                className="w-full max-w-sm overflow-x-auto flex snap-x snap-mandatory no-scrollbar gap-6"
                onClick={(e) => e.stopPropagation()}
              >
                {(selectedEPal.playlinks || []).concat(myPlaylinks || []).filter((pl, index, self) =>
                  index === self.findIndex((t) => t.id === pl.id)
                ).map((pl) => (
                  <div
                    key={pl.id}
                    id={`pl-card-${pl.id}`}
                    className="min-w-full snap-center"
                  >
                    <GlassCard className="overflow-hidden border-white/20 shadow-2xl bg-[#0f071a] flex flex-col w-full relative">
                      {/* Top Rank Highlight */}
                      <div className="bg-purple-600 px-6 py-4 flex justify-between items-center pr-14">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Current Rank</span>
                        </div>
                        <span className="text-xl font-black text-white italic">{pl.rank || '-'}</span>
                      </div>

                      {/* Share Button - Top Right of Card */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.share) {
                              navigator.share({
                                title: `${pl.gameName} - ${pl.nickname}`,
                                text: `Check out ${selectedEPal.name}'s ${pl.gameName} profile!`,
                                url: window.location.href
                              }).catch(console.error);
                            }
                          }}
                          className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Info Grid */}
                      <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4 bg-white/2">
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]"><SourceLabel text="Platform" /></p>
                          <div className="flex items-center gap-2">
                            {pl.platform === 'PC' && <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                            {pl.platform === 'PS' && <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />}
                            {pl.platform === 'Mobile' && <Smartphone className="w-3.5 h-3.5 text-purple-400" />}
                            <span className="text-sm font-bold text-white">{pl.platform || '-'}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]"><SourceLabel text="Server" /></p>
                          <p className="text-sm font-bold text-white">{pl.server || '-'}</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Position</p>
                          <p className="text-sm font-bold text-white">{pl.role || '-'}</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]"><SourceLabel text="Style" /></p>
                          <p className="text-sm font-bold text-white">{pl.style || '-'}</p>
                        </div>
                      </div>

                      {/* Game Image at bottom */}
                      <div className="relative aspect-video overflow-hidden group">
                        <ResilientImage
                          src={pl.posterUrl}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-6">
                          <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{pl.gameName}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-purple-400 tracking-widest">{pl.nickname}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(pl.nickname);
                              }}
                              className="p-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors group/copy"
                            >
                              {copied ? (
                                <Check className="w-2.5 h-2.5 text-purple-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-purple-400 group-hover/copy:text-purple-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Filter Modal */}
        <AnimatePresence>
          {showReviewFilterModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReviewFilterModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-[#1a0b2e] rounded-t-[32px] border-t border-white/10 z-[201] max-w-md mx-auto p-6 pb-12 space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Filter & Sort</h2>
                  <button
                    onClick={() => setShowReviewFilterModal(false)}
                    className="text-gray-500 hover:text-white font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Sort Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Sort By</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'DEFAULT', label: 'Default' },
                      { id: 'NEWEST', label: 'Newest' },
                      { id: 'OLDEST', label: 'Oldest' },
                      { id: 'RATING_HIGH', label: 'Highest Rating' },
                      { id: 'RATING_LOW', label: 'Lowest Rating' }
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => setReviewSortOrder(sort.id as any)}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all text-start ${
                          reviewSortOrder === sort.id
                            ? 'bg-purple-600/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <span className={`text-sm font-bold ${reviewSortOrder === sort.id ? 'text-purple-400' : 'text-gray-300'}`}>
                          {sort.label}
                        </span>
                        {reviewSortOrder === sort.id && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Filter by Rating</h3>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setSelectedRatingFilter(null)}
                      className={`px-5 py-3 rounded-2xl border whitespace-nowrap transition-all flex items-center gap-2 ${
                        selectedRatingFilter === null
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <span className="text-sm font-bold">All</span>
                    </button>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={`rating-filter-star-${star}`}
                        onClick={() => setSelectedRatingFilter(star === selectedRatingFilter ? null : star)}
                        className={`px-5 py-3 rounded-2xl border whitespace-nowrap transition-all flex items-center gap-2 ${
                          selectedRatingFilter === star
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <span className="text-sm font-bold">{star}</span>
                        <Star className={`w-3.5 h-3.5 ${selectedRatingFilter === star ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowReviewFilterModal(false)}
                  className="w-full py-4 rounded-2xl bg-purple-600 font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95 transition-all text-white"
                >
                  Apply Filters
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Gift Panel */}
        <AnimatePresence>
          {showGiftPanel && <motion.div key="gift-unavailable" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end"><div className="w-full p-8 rounded-t-[32px] bg-[#1a0b2e] border-t border-white/10 space-y-4"><button aria-label="Close gifts" onClick={()=>setShowGiftPanel(false)}><X/></button><h2 className="text-xl font-bold">{selectedLanguage==='Arabic'?'الهدايا':'Gifts'}</h2><p className="text-gray-400">{selectedLanguage==='Arabic'?'إرسال الهدايا غير متاح بعد.':'Gifting is not available yet.'}</p></div></motion.div>}
        </AnimatePresence>

        {/* Game Selector Modal */}
        <AnimatePresence>
          {showGameSelectorModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGameSelectorModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed inset-6 bg-[#1a0b2e] rounded-[32px] border border-white/10 z-[201] max-w-md mx-auto p-6 overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">All Communities</h2>
                  <button onClick={() => setShowGameSelectorModal(false)} className="text-gray-500 hover:text-white font-bold">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                  <button
                    onClick={() => {
                      setSelectedGame(null);
                      setShowGameSelectorModal(false);
                      if (currentView !== 'COMMUNITY') navigateTo('COMMUNITY');
                    }}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      selectedGame === null ? 'bg-purple-600/20 border-purple-500/50' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <span className="font-bold">All Communities</span>
                    {selectedGame === null && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                  </button>
                  {GAMES.map(game => (
                    <button
                      key={`selector-game-${game.id}`}
                      onClick={() => {
                        setSelectedGame(game);
                        setShowGameSelectorModal(false);
                        if (currentView === 'APPLY_PLAYER') {
                          navigateTo('APPLY_PLAYER_CATEGORY');
                        } else if (currentView !== 'COMMUNITY') {
                          navigateTo('COMMUNITY');
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                        selectedGame?.id === game.id ? 'bg-purple-600/20 border-purple-500/50' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <ResilientImage src={game.imageUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <span className="font-bold flex-1 text-start">{game.name}</span>
                      {selectedGame?.id === game.id && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Ongoing Order Warning Modal */}
        <AnimatePresence>
          {showOngoingOrderWarning && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOngoingOrderWarning(false)}
                className="fixed inset-0 bg-black/60 z-[600]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm bg-[#1a0b2e] rounded-[32px] border border-white/10 z-[601] p-8 text-center space-y-6 shadow-2xl"
              >
                <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Ongoing Order</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    You already have an ongoing order with this EPal. Please complete or cancel it before placing a new one.
                  </p>
                </div>
                <button
                  onClick={() => setShowOngoingOrderWarning(false)}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  Got it
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Order Detail Modal */}
        <AnimatePresence>

        </AnimatePresence>

        {/* Review Modal */}
        <AnimatePresence>

        </AnimatePresence>
      </main>

        {/* EPal Filter Modal */}
        <AnimatePresence>
          {showEpalFilterModal && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-[#0f071a] z-[401] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0 border-b border-white/5">
                <button
                  onClick={() => setShowEpalFilterModal(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white">Filters</h2>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-10">
                {/* Status */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</h3>
                  <div className="flex gap-3">
                    {['ALL', 'ONLINE'].map(s => (
                      <button
                        key={`epal-status-filter-${s}`}
                        onClick={() => setEpalFilters(prev => ({ ...prev, status: s as any }))}
                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${
                          epalFilters.status === s
                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {s === 'ALL' ? 'All' : 'Online Only'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Gender</h3>
                  <div className="flex gap-3">
                    {['ALL', 'Male', 'Female'].map(g => (
                      <button
                        key={`epal-gender-filter-${g}`}
                        onClick={() => setEpalFilters(prev => ({ ...prev, gender: g as any }))}
                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${
                          epalFilters.gender === g
                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {g === 'ALL' ? 'All' : g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Price Range</h3>
                    <span className="text-xs font-bold text-white">{epalFilters.priceRange[0]} - {epalFilters.priceRange[1]} Coins</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={epalFilters.priceRange[1]}
                      onChange={(e) => setEpalFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value)] }))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>

                {/* Dynamic Filters (Server, Platform, Rank) */}
                {(() => {
                  const gameEpals = EPALS.filter(e => e.game.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                  const playlinks = gameEpals.flatMap(e => e.playlinks || []).filter(pl => pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));

                  const servers = Array.from(new Set(playlinks.map(pl => pl.server).filter(Boolean)));
                  const platforms = Array.from(new Set(playlinks.map(pl => pl.platform).filter(Boolean)));
                  const ranks = Array.from(new Set(playlinks.map(pl => pl.rank).filter(Boolean)));

                  return (
                    <div className="space-y-10">
                      {servers.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]"><SourceLabel text="Server" /></h3>
                          <button
                            onClick={() => setShowServerSelectorModal(true)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all hover:bg-white/10"
                          >
                            <span>{epalFilters.server === 'ALL' ? 'All Servers' : epalFilters.server}</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}

                      {platforms.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]"><SourceLabel text="Platform" /></h3>
                          <button
                            onClick={() => setShowPlatformSelectorModal(true)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all hover:bg-white/10"
                          >
                            <span>{epalFilters.platform === 'ALL' ? 'All Platforms' : epalFilters.platform}</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}

                      {ranks.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]"><SourceLabel text="Rank" /></h3>
                          <button
                            onClick={() => setShowRankSelectorModal(true)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all hover:bg-white/10"
                          >
                            <span>{epalFilters.rank === 'ALL' ? 'All Ranks' : epalFilters.rank}</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-white/5 bg-[#0f071a] flex gap-4 shrink-0">
                <button
                  onClick={() => setEpalFilters({
                    status: 'ALL',
                    gender: 'ALL',
                    priceRange: [0, 100],
                    server: 'ALL',
                    platform: 'ALL',
                    rank: 'ALL',
                  })}
                  className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-gray-400 uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowEpalFilterModal(false)}
                  className="flex-[2] py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rank Selector Modal */}
        <AnimatePresence>
          {showRankSelectorModal && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-[#0f071a] z-[500] flex flex-col"
            >
              <div className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setShowRankSelectorModal(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white"><SourceLabel text="Select Rank" /></h2>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setEpalFilters(prev => ({ ...prev, rank: 'ALL' }));
                      setShowRankSelectorModal(false);
                    }}
                    className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                      epalFilters.rank === 'ALL' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold">All Ranks</span>
                    {epalFilters.rank === 'ALL' && <CheckCircle2 className="w-5 h-5" />}
                  </button>

                  {(() => {
                    const gameEpals = EPALS.filter(e => e.game.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const playlinks = gameEpals.flatMap(e => e.playlinks || []).filter(pl => pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const ranks = Array.from(new Set(playlinks.map(pl => pl.rank).filter(Boolean)));

                    const RANK_ORDER = [
                      'Unranked', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger',
                      'Ascendant', 'Immortal', 'Radiant', 'Predator', 'AR', 'Level'
                    ];

                    const sortedRanks = ranks.sort((a, b) => {
                      const aIndex = RANK_ORDER.findIndex(r => String(a).includes(r));
                      const bIndex = RANK_ORDER.findIndex(r => String(b).includes(r));
                      if (aIndex === -1 && bIndex === -1) return String(a).localeCompare(String(b));
                      if (aIndex === -1) return 1;
                      if (bIndex === -1) return -1;
                      return aIndex - bIndex;
                    });

                    return sortedRanks.map(r => (
                      <button
                        key={`rank-selector-option-${r}`}
                        onClick={() => {
                          setEpalFilters(prev => ({ ...prev, rank: r as string }));
                          setShowRankSelectorModal(false);
                        }}
                        className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                          epalFilters.rank === r ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-bold">{r}</span>
                        {epalFilters.rank === r && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server Selector Modal */}
        <AnimatePresence>
          {showServerSelectorModal && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-[#0f071a] z-[500] flex flex-col"
            >
              <div className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setShowServerSelectorModal(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white"><SourceLabel text="Select Server" /></h2>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
                <div className="space-y-3">
                  {(() => {
                    const gameEpals = EPALS.filter(e => e.game.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const playlinks = gameEpals.flatMap(e => e.playlinks || []).filter(pl => pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const servers = Array.from(new Set(playlinks.map(pl => pl.server).filter(Boolean)));

                    return (
                      <>
                        <button
                          onClick={() => {
                            setEpalFilters(prev => ({ ...prev, server: 'ALL' }));
                            setShowServerSelectorModal(false);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                            epalFilters.server === 'ALL' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold">All Servers</span>
                          {epalFilters.server === 'ALL' && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                        {servers.map(s => (
                          <button
                            key={`server-selector-option-${s}`}
                            onClick={() => {
                              setEpalFilters(prev => ({ ...prev, server: s as string }));
                              setShowServerSelectorModal(false);
                            }}
                            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                              epalFilters.server === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="font-bold">{s}</span>
                            {epalFilters.server === s && <CheckCircle2 className="w-5 h-5" />}
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform Selector Modal */}
        <AnimatePresence>
          {showPlatformSelectorModal && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-[#0f071a] z-[500] flex flex-col"
            >
              <div className="px-6 pt-12 pb-6 flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setShowPlatformSelectorModal(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white">Select Platform</h2>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
                <div className="space-y-3">
                  {(() => {
                    const gameEpals = EPALS.filter(e => e.game.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const playlinks = gameEpals.flatMap(e => e.playlinks || []).filter(pl => pl.gameName.toLowerCase().includes(selectedGame?.name.toLowerCase().split(' ')[0] || ''));
                    const platforms = Array.from(new Set(playlinks.map(pl => pl.platform).filter(Boolean)));

                    return (
                      <>
                        <button
                          onClick={() => {
                            setEpalFilters(prev => ({ ...prev, platform: 'ALL' }));
                            setShowPlatformSelectorModal(false);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                            epalFilters.platform === 'ALL' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold">All Platforms</span>
                          {epalFilters.platform === 'ALL' && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                        {platforms.map(p => (
                          <button
                            key={`platform-selector-option-${p}`}
                            onClick={() => {
                              setEpalFilters(prev => ({ ...prev, platform: p as string }));
                              setShowPlatformSelectorModal(false);
                            }}
                            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                              epalFilters.platform === p ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="font-bold">{p}</span>
                            {epalFilters.platform === p && <CheckCircle2 className="w-5 h-5" />}
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recharge Loading Overlay */}
        <AnimatePresence>
          {isRecharging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CoinIcon className="w-8 h-8 animate-bounce" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Processing Payment</h3>
                <p className="text-gray-400 text-sm">Please do not close the app or refresh the page...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Bottom Navigation */}
      {(currentView === 'HOME' || currentView === 'COMMUNITY' || currentView === 'CATEGORY_SERVICES' || currentView === 'IM' || currentView === 'ME') && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="bg-[#1a0b2e] border-t border-white/5 px-4 py-2 flex justify-around items-center shadow-2xl pointer-events-auto">
            <NavButton icon={Home} active={currentView === 'HOME' || currentView === 'CATEGORY_SERVICES'} onClick={() => navigateTo('HOME')} label={t('home')} />
            <NavButton icon={Globe} active={currentView === 'COMMUNITY'} onClick={() => navigateTo('COMMUNITY')} label={t('community')} />
            <NavButton icon={MessageSquare} active={currentView === 'IM'} onClick={() => navigateTo('IM')} label={t('messages')} />
            <NavButton icon={User} active={currentView === 'ME'} onClick={() => navigateTo('ME')} label={t('me')} />
          </div>
        </nav>
      )}
      <AnimatePresence>
        {showDecayExplainer && (
          <DecayExplainerModal
            ranking={playerRanking}
            onClose={() => setShowDecayExplainer(false)}
            onGoToTasks={() => {
              setShowDecayExplainer(false);
              navigateTo('TASK_CENTER');
            }}
          />
        )}
      </AnimatePresence>

      {/* Block/Unblock Confirmation Modal (from Profile) */}
      <AnimatePresence>
        {isBlockConfirmOpen && selectedEPal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#1a0b2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${blockedUsers.has(selectedEPal.id) ? 'bg-purple-500/10 text-purple-400' : 'bg-red-500/10 text-red-500'}`}>
                  <Ban className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    {blockedUsers.has(selectedEPal.id) ? 'Confirm Unblock?' : 'Confirm Block?'}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">
                    {blockedUsers.has(selectedEPal.id)
                      ? `Are you sure you want to unblock ${selectedEPal.name}? They will be able to interact with you again.`
                      : `Are you sure you want to block ${selectedEPal.name}? They will not be able to interact with you.`}
                  </p>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsBlockConfirmOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-gray-400 uppercase tracking-widest active:scale-95 transition-all"
                  ><SourceLabel text="Cancel" /></button>
                  <button
                    onClick={() => handleBlockUser(selectedEPal.id)}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                      blockedUsers.has(selectedEPal.id) ? 'bg-purple-600 shadow-purple-900/40' : 'bg-red-600 shadow-red-900/40'
                    }`}
                  ><SourceLabel text="Confirm" /></button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated Unblock Confirmation Modal (from Blacklist page) */}
      <AnimatePresence>
        {isUnblockConfirmOpen && userToUnblock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#1a0b2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Ban className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Confirm Unblock?</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">
                    Are you sure you want to unblock this user? They will be able to interact with you again.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsUnblockConfirmOpen(false);
                    setUserToUnblock(null);
                  }}
                  className="py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-gray-400 uppercase tracking-widest active:scale-95 transition-all"
                ><SourceLabel text="Cancel" /></button>
                <button
                  onClick={() => {
                    handleBlockUser(userToUnblock);
                    setIsUnblockConfirmOpen(false);
                    setUserToUnblock(null);
                  }}
                  className="py-4 rounded-2xl bg-purple-600 text-xs font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                ><SourceLabel text="Confirm" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Cache Confirmation Modal */}
      <AnimatePresence>
        {isClearCacheConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#1a0f2e] border border-white/10 rounded-[32px] p-8 space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Clear Cache?</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-bold">
                    This will remove temporary files and free up space. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsClearCacheConfirmOpen(false)}
                  className="py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-gray-400 uppercase tracking-widest active:scale-95 transition-all"
                ><SourceLabel text="Cancel" /></button>
                <button
                  onClick={unavailable}
                  className="py-4 rounded-2xl bg-red-600 text-xs font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                ><SourceLabel text="Confirm" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetName={selectedEPal?.name || selectedPost?.userName || ''}
        context={reportContext}
        onSubmit={handleReportSubmit}
      />

      {/* Country Picker Modal */}
      <AnimatePresence>
        {showCountryPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCountryPicker(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1a0f2e] border-t border-white/10 rounded-t-[32px] z-[201] max-h-[50vh] flex flex-col pt-2"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />

              <div className="px-6 flex items-center justify-between mb-4">
                <button onClick={() => setShowCountryPicker(false)} className="text-gray-500 font-bold text-sm transition-colors hover:text-white"><SourceLabel text="Cancel" /></button>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Select Country</h3>
                <button
                  onClick={() => setShowCountryPicker(false)}
                  className="text-purple-400 font-black uppercase tracking-widest text-sm transition-colors hover:text-purple-300"
                >
                  Done
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-20 px-6 relative">
                {/* Selection Highlight */}
                <div className="absolute top-1/2 left-6 right-6 h-12 -translate-y-1/2 pointer-events-none bg-white/5 border-y border-white/10 rounded-xl" />

                {COUNTRIES.map((country) => {
                  const isSelected = tempProfile.region === country;
                  return (
                    <div
                      key={country}
                      onClick={() => setTempProfile(prev => ({ ...prev, region: country }))}
                      className={`h-12 flex items-center justify-center snap-center transition-all duration-300 cursor-pointer ${isSelected ? 'text-white text-lg font-black' : 'text-gray-600 text-sm font-bold'}`}
                    >
                      {country}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#1a0b2e] border border-white/10 rounded-[32px] p-8 space-y-6 relative z-10"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    You have unsaved changes. Are you sure you want to exit?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                ><SourceLabel text="Cancel" /></button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleBack();
                  }}
                  className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-red-900/40"
                ><SourceLabel text="Confirm" /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Confirmation Modal */}
      <AnimatePresence>
        {showLanguageConfirm && pendingLanguage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#1a0b2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Languages className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    {t('changeLanguageTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium px-2">
                    {t('changeLanguageDesc')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSelectedLanguage(pendingLanguage);
                    setPendingLanguage(null);
                    setShowLanguageConfirm(false);
                    handleBack();
                  }}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  {t('confirm')}
                </button>
                <button
                  onClick={() => {
                    setShowLanguageConfirm(false);
                    setPendingLanguage(null);
                  }}
                  className="w-full py-4 bg-white/5 text-gray-400 hover:text-white rounded-2xl font-bold uppercase tracking-widest transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playlinkToDelete && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlaylinkToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1a0b2e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                  <Trash2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Delete Playlink?</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    This will permanently remove this game association from your profile. This action cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => unavailable()}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-red-900/20 transition-all active:scale-95"
                  >
                    Delete Permanently
                  </button>
                  <button
                    onClick={() => setPlaylinkToDelete(null)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all"
                  ><SourceLabel text="Cancel" /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DatePickerModal
        isOpen={!!datePickerTarget}
        onClose={() => setDatePickerTarget(null)}
        value={datePickerTarget?.value || ''}
        onChange={handleDateChange}
        title={datePickerTarget?.title || 'Select Date'}
        mode={datePickerTarget?.id === 'BIRTHDAY' ? 'BIRTHDAY' : 'PAST'}
        language={selectedLanguage}
      />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {showSubmissionToast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-6 right-6 z-[2000]"
          >
            <div className="max-w-xs mx-auto bg-[#1a0b2e]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{showSubmissionToast.message}</h4>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        <AnimatePresence mode="wait">
        <motion.div key={currentView}>
          {showPostCategorySelector && (
            <PostCategorySelectorModal
              isOpen={showPostCategorySelector}
              onClose={() => setShowPostCategorySelector(false)}
              onSelect={(game) => {
                setNewPostGame(game);
                setShowPostCategorySelector(false);
                setTimeout(() => setShowCreatePost(true), 300);
              }}
              games={GAMES}
            />
          )}
          {showCreatePost && (
            <CreatePostModal
              isOpen={showCreatePost}
              onClose={() => {
                setShowCreatePost(false);
                setPostImages([]);
                setNewPostGame(null);
              }}
              onPost={handleCreatePost}
              content={newPostContent}
              setContent={setNewPostContent}
              images={postImages}
              setImages={setPostImages}
              selectedGame={newPostGame}
            />
          )}
        </motion.div>
      </AnimatePresence>

        <AccountBindModal
          isOpen={showBindModal}
          onClose={() => setShowBindModal(false)}
          type={bindType}
          value={bindValue}
          onValueChange={setBindValue}
          step={verificationStep}
          onSendCode={handleSendCode}
          onVerify={handleVerifyBind}
          code={verificationCode}
          onCodeChange={setVerificationCode}
          resendCooldown={resendCooldown}
          selectedCountryCode={selectedCountryCode}
          onSelectedCountryCodeChange={setSelectedCountryCode}
          setVerificationStep={setVerificationStep}
          handleUnbind={handleUnbind}
        />
    </div>
  );
}


const COUNTRY_CODES = [
  { code: '+1', name: 'USA' },
  { code: '+86', name: 'China' },
  { code: '+44', name: 'UK' },
  { code: '+81', name: 'Japan' },
  { code: '+971', name: 'UAE' },
];

const AccountBindModal = ({
  isOpen,
  onClose,
  type,
  value,
  onValueChange,
  step,
  onSendCode,
  onVerify,
  code,
  onCodeChange,
  resendCooldown,
  selectedCountryCode,
  onSelectedCountryCodeChange,
  setVerificationStep,
  handleUnbind
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'EMAIL' | 'PHONE' | null;
  value: string;
  onValueChange: (val: string) => void;
  step: 'VIEW' | 'INPUT' | 'VERIFY' | null;
  onSendCode: () => void;
  onVerify: () => void;
  code: string;
  onCodeChange: (val: string) => void;
  resendCooldown: number;
  selectedCountryCode: string;
  onSelectedCountryCodeChange: (val: string) => void;
  setVerificationStep: (step: 'VIEW' | 'INPUT' | 'VERIFY') => void;
  handleUnbind: (type: 'EMAIL' | 'PHONE') => void;
}) => {
  if (!isOpen || !type) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[#1a0b2e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-[301]"
        >
          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                {step === 'VIEW' ? (type === 'EMAIL' ? 'Email Binding' : 'Phone Binding') :
                 step === 'INPUT' ? `Bind ${type === 'EMAIL' ? 'Email' : 'Phone'}` : 'Verification'}
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {step === 'VIEW' ? (
              <div className="space-y-10">
                <div className="space-y-4 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-2">
                    {type === 'EMAIL' ? <Mail className="w-10 h-10 text-purple-400" /> : <Phone className="w-10 h-10 text-purple-400" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-medium tracking-wideGray">Your current bound {type.toLowerCase()} address is</p>
                    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setVerificationStep('INPUT')}
                    className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
                  >
                    Change {type === 'EMAIL' ? 'Email' : 'Phone'}
                  </button>
                  <button
                    onClick={() => handleUnbind(type)}
                    className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-red-400 hover:bg-red-500/10 hover:border-red-500/20 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ) : step === 'INPUT' ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 block">
                    {type === 'EMAIL' ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="flex flex-col gap-4">
                    {type === 'PHONE' && (
                      <div className="relative">
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => onSelectedCountryCodeChange(e.target.value)}
                          className="appearance-none w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold focus:outline-none focus:border-purple-500 transition-all cursor-pointer text-base"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code} className="bg-[#1a0b2e] text-white">
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-purple-400">
                        {type === 'EMAIL' ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                      </div>
                      <input
                        type={type === 'EMAIL' ? 'email' : 'tel'}
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder={type === 'EMAIL' ? 'example@email.com' : 'Enter phone number'}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500 transition-all font-bold text-base"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={onSendCode}
                  disabled={!value}
                  className="w-full py-5 bg-purple-600 rounded-2xl font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:scale-100 disabled:shadow-none mt-4"
                >
                  Send Verification Code
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">We've sent a 6-digit code to</p>
                  <p className="font-bold text-white tracking-wide">{type === 'PHONE' ? `${selectedCountryCode} ${value}` : value}</p>
                </div>

                <div className="flex justify-center gap-2">
                  <div className="relative w-full max-w-xs flex justify-center gap-2">
                    {/* Hidden input to capture numeric typing */}
                    <input
                      type="tel"
                      maxLength={6}
                      value={code}
                      autoFocus
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        onCodeChange(val);
                      }}
                      className="absolute inset-0 opacity-0 cursor-default"
                    />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={`code-digit-${i}`}
                        className={`w-12 h-14 bg-white/5 border rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                          code.length === i ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-purple-500/5' :
                          code[i] ? 'border-white/20 text-white' : 'border-white/10 text-gray-700'
                        }`}
                      >
                        {code[i] || ''}
                        {code.length === i && (
                          <motion.div
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-0.5 h-6 bg-purple-500 rounded-full ml-0.5"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={onVerify}
                    disabled={code.length !== 6}
                    className="w-full py-4 bg-purple-600 rounded-2xl font-black text-white shadow-lg shadow-purple-600/20 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Verify & Bind
                  </button>

                  <button
                    onClick={onSendCode}
                    disabled={resendCooldown > 0}
                    className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-purple-400 disabled:text-gray-600 transition-all"
                  >
                    {resendCooldown > 0 ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" /> Resend in {resendCooldown}s</>
                    ) : (
                      <><RefreshCw className="w-3 h-3" /> Resend Code</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PostCategorySelectorModal = ({ isOpen, onClose, onSelect, games }: {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (game: Game) => void,
  games: Game[]
}) => {
  if (!isOpen) return null;

  const groupedGames = games.reduce((acc, game) => {
    const letter = game.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(game);
    return acc;
  }, {} as { [key: string]: Game[] });

  return (
    <div className="fixed inset-0 z-[120] bg-[#0f071a] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-widest">Select Category</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="space-y-8">
          {Object.entries(groupedGames)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, letterGames]) => (
              <div key={`post-category-letter-${letter}`} className="space-y-4">
                <div className="text-purple-400 font-bold text-lg border-b border-white/10 pb-2">{letter}</div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                  {letterGames
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(game => (
                      <button
                        key={`post-category-option-${game.id}`}
                        onClick={() => onSelect(game)}
                        className="flex flex-col gap-2 transition-all text-center group active:scale-95"
                      >
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/5 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                          <ResilientImage
                            src={game.imageUrl}
                            alt={game.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="font-bold text-white text-[11px] truncate px-1 group-hover:text-purple-400 transition-colors">
                          {game.name}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const CreatePostModal = ({
  isOpen,
  onClose,
  onPost,
  content,
  setContent,
  images,
  setImages,
  selectedGame,
}: {
  isOpen: boolean,
  onClose: () => void,
  onPost: () => void,
  content: string,
  setContent: (v: string) => void,
  images: string[],
  setImages: React.Dispatch<React.SetStateAction<string[]>>,
  selectedGame: Game | null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 9 - images.length;
    const newFiles: File[] = Array.from(files).slice(0, remainingSlots) as File[];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#0f071a] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f071a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Create Post</h2>
          {selectedGame && (
            <span className="text-[10px] text-purple-400 font-bold mt-1 uppercase tracking-wider">{selectedGame.name}</span>
          )}
        </div>
        <button
          onClick={onPost}
          disabled={(!content.trim() && images.length === 0) || !selectedGame}
          className="px-6 py-2 bg-purple-600 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-purple-900/20"
        >
          Post
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 space-y-6">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?..."
            className="w-full bg-transparent text-white text-lg placeholder:text-gray-600 outline-none transition-all resize-none min-h-[120px]"
          />

          {/* Image Grid */}
          <div className="grid grid-cols-3 gap-2 pb-10">
            {images.map((img, idx) => (
              <div key={`post-creation-img-${idx}-${img.substring(0, 20)}`} className="relative aspect-square rounded-xl overflow-hidden group">
                <ResilientImage src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-white/10 transition-all"
              >
                <Plus className="w-6 h-6" />
                <span className="text-[10px] uppercase font-black tracking-widest">{images.length}/9</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PostImageGrid = ({ images, postId }: { images: string[], postId?: string }) => {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 bg-white/5">
        <ResilientImage
          src={images[0]}
          alt="Post content"
          className="w-full max-h-[70vh] object-contain bg-black/20"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const gridCols = (images.length === 2 || images.length === 4) ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-1 rounded-2xl overflow-hidden border border-white/5 bg-[#0f071a]`}>
      {images.map((img, i) => (
        <div key={`post-grid-img-${postId || 'single'}-${i}`} className="aspect-square relative group overflow-hidden">
          <ResilientImage
            src={img}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}
    </div>
  );
};

const NavButton = ({ icon: Icon, active, onClick, label }: { icon: any, active?: boolean, onClick?: () => void, label?: string }) => (
  <button
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`flex flex-col items-center transition-all duration-300 ${
      active
        ? 'text-purple-400 scale-105'
        : 'text-gray-500 hover:text-purple-400'
    }`}
  >
    <div className={`p-2 rounded-full ${active ? 'bg-purple-600/10' : ''}`}>
      <Icon className="w-5 h-5" fill={active ? "currentColor" : "none"} />
    </div>
  </button>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'SUCCESS' | 'ERROR' | 'INFO', onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
    >
      <div className={`px-6 py-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between gap-4 ${
        type === 'SUCCESS' ? 'bg-purple-500/20' :
        type === 'ERROR' ? 'bg-red-500/20' : 'bg-purple-600/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            type === 'SUCCESS' ? 'bg-purple-500/20 text-purple-400' :
            type === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {type === 'SUCCESS' ? <CheckCheck className="w-4 h-4" /> :
             type === 'ERROR' ? <X className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <p className="text-white text-sm font-bold">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
