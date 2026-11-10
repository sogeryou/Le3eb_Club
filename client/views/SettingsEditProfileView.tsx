import { ResilientImage } from '../components/ResilientImage';
import React from 'react';
import { businessApi } from '../services/businessApi';
import { 
  Search, 
  Gift, 
  Gamepad2, 
  Coffee, 
  Star, 
  Home, 
  Compass, 
  MessageSquare, 
  User, 
  ChevronRight, 
  Play, 
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  Mic2,
  MapPin,
  User2,
  Heart,
  Venus,
  Mars,
  Copy,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Image,
  Layout,
  Monitor,
  Smartphone,
  Share2,
  ChevronDown,
  ChevronUp,
  Filter,
  SlidersHorizontal,
  ThumbsUp,
  MoreHorizontal,
  Flag,
  Users,
  Zap,
  Trophy,
  Send,
  Bell,
  Contact,
  Smile,
  AlertTriangle,
  Wallet,
  CreditCard,
  History,
  Settings,
  X,
  Camera,
  LogOut,
  ShieldCheck,
  HelpCircle,
  Gem,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Calendar,
  Store,
  ChevronLeft,
  Lock,
  Globe,
  Shield,
  Link,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Game, EPal, EPalServiceVariant, Coupon, Playlink, Post, Message, ChatSession, IMOrder, Wallet as WalletType, RechargePackage, WalletTransaction, RechargeOrder } from '@shared/types';
import { PRODUCT_SEMVER } from '../constants';
import { IconButton } from '../components/ui/IconButton';
import { WaveAnimation } from '../components/ui/WaveAnimation';
import { CoinIcon } from '../components/ui/CoinIcon';
import { EPalCard } from '../components/cards/EPalCard';
import { LegendEPalCard } from '../components/cards/LegendEPalCard';
import { GameGridItem } from '../components/cards/GameGridItem';
import { WalletView } from '../views/WalletView';
import { RechargeView } from '../views/RechargeView';
import { SettingsSubPage } from '../components/SettingsSubPage';
import { formatChatMessageTime } from '../lib/chatTime';

import { useApp } from '../app/AppContext';

export function SettingsEditProfileView() {
const {
    deviceId, locale, setLocale, t, supportedLocales, getLocaleLabel,
    currentView, setCurrentView, wallet, setWallet, transactions, setTransactions,
    rechargePackages, setRechargePackages, isRecharging, setIsRecharging,
    isRecording, setIsRecording, recordingTime, setRecordingTime,
    pushNotificationsEnabled, setPushNotificationsEnabled, cacheSize, setCacheSize,
    isAuthenticated, setIsAuthenticated, isAuthenticatedRef, authToken, setAuthToken,
    showAuthModal, setShowAuthModal, authMode, setAuthMode, authEmail, setAuthEmail,
    authPassword, setAuthPassword, authUsername, setAuthUsername, authStatus, setAuthStatus,
    toastMessage, setToastMessage, companionRankings, setCompanionRankings,
    rankingsLoading, setRankingsLoading, rankingsError, setRankingsError,
    rankingSortBy, setRankingSortBy, showRankingModal, setShowRankingModal,
    expandedRankingId, setExpandedRankingId, pendingNavigationRef, authTokenRef,
    fetchWallet, fetchTransactions, fetchPackages, fetchCompanionRankings, sortedRankings,
    openAuthModal, notify, requireAuthAction, handleLogout, handleAuthSubmit, handleRecharge,
    selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, selectedGame, setSelectedGame,
    selectedServiceCategory, setSelectedServiceCategory, applicationDetails, setApplicationDetails,
    selectedEPal, setSelectedEPal, selectedPost, setSelectedPost, showGiftPanel, setShowGiftPanel,
    selectedGiftId, setSelectedGiftId, giftQuantity, setGiftQuantity, showQuantitySelector, setShowQuantitySelector,
    userCoins, setUserCoins, userDiamonds, setUserDiamonds, withdrawAmount, setWithdrawAmount,
    withdrawAddress, setWithdrawAddress, withdrawSubmitting, setWithdrawSubmitting,
    userRole, setUserRole, isPlayerOnline, setIsPlayerOnline, playerApplicationStatus, setPlayerApplicationStatus,
    playerApplicationStep, setPlayerApplicationStep, playerApplicationData, setPlayerApplicationData,
    applyGameSearchQuery, setApplyGameSearchQuery, showApplySelectionModal, setShowApplySelectionModal,
    showGameSelectorModal, setShowGameSelectorModal, focusCommentInput, setFocusCommentInput, commentInputRef,
    handleWithdrawSubmit, moreEPals, setMoreEPals, loadingMore, setLoadingMore, favorites, setFavorites,
    playingEPalId, setPlayingEPalId, activeServiceId, setActiveServiceId, selectedVariant, setSelectedVariant,
    orderQuantity, setOrderQuantity, availableCoupons, setAvailableCoupons, selectedCoupon, setSelectedCoupon,
    showCouponModal, setShowCouponModal, showServiceTypeModal, setShowServiceTypeModal,
    profileTab, setProfileTab, selectedPlaylinkId, setSelectedPlaylinkId, showPlaylinkModal, setShowPlaylinkModal,
    showUnfollowModal, setShowUnfollowModal, epalToUnfollow, setEpalToUnfollow, showServiceDetails, setShowServiceDetails,
    reviewSortOrder, setReviewSortOrder, selectedReviewTag, setSelectedReviewTag, selectedRatingFilter, setSelectedRatingFilter,
    showReviewFilterModal, setShowReviewFilterModal, imTab, setImTab, imSearchQuery, setImSearchQuery,
    walletTab, setWalletTab, walletDate, setWalletDate, selectedApplyGameCategory, setSelectedApplyGameCategory,
    epalSortBy, setEpalSortBy, epalFilters, setEpalFilters, showEpalFilterModal, setShowEpalFilterModal,
    showRankSelectorModal, setShowRankSelectorModal, showServerSelectorModal, setShowServerSelectorModal,
    showPlatformSelectorModal, setShowPlatformSelectorModal, isImSearchExpanded, setIsImSearchExpanded,
    chatSessions, setChatSessions, imOrders, setImOrders, showOngoingOrderWarning, setShowOngoingOrderWarning,
    currentMessages, setCurrentMessages, messageInput, setMessageInput, selectedOrder, setSelectedOrder,
    showOrderDetailModal, setShowOrderDetailModal, showImServiceCards, setShowImServiceCards,
    showReviewModal, setShowReviewModal, reviewRating, setReviewRating, reviewTags, setReviewTags, reviewFeedback, setReviewFeedback,
    orderTab, setOrderTab, userStatus, setUserStatus, showStatusModal, setShowStatusModal, viewHistory, setViewHistory,
    contactsTab, setContactsTab, communityTab, setCommunityTab, showFullSearch, setShowFullSearch,
    fullSearchQuery, setFullSearchQuery, fullSearchResults, setFullSearchResults,
    isScrolling, setIsScrolling, copied, setCopied, followedEPals, setFollowedEPals, followersOfMe, mutualFollowers,
    filteredPosts, toggleFollow, confirmUnfollow, copyToClipboard, observer, lastElementRef, legendEPals,
    navigateTo, handleBack, loadMore, toggleFavorite, handlePlayToggle, allSortedGames, favoritedGames, alphabet, scrollToLetter, groupedGames,
    EPALS, GAMES, POSTS,
    authUser, setAuthUser, reloadDiscovery,
  } = useApp();
  const [uploading, setUploading] = React.useState(false);
  const [avatarStatus, setAvatarStatus] = React.useState('');

  return (
            <motion.div 
              key="settings_edit_profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsSubPage title="Edit Profile" onBack={() => setCurrentView('SETTINGS')}>
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#c79a3b]/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                      <ResilientImage kind="avatar"
                        src={authUser?.avatarUrl}
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2 bg-[#c79a3b] rounded-xl border-2 border-[#07382a] shadow-xl cursor-pointer">
                      <Camera className="w-4 h-4 text-white" />
                      <input className="sr-only" type="file" aria-label={locale === 'ar' ? 'تغيير الصورة الشخصية' : 'Change avatar'}
                        accept="image/jpeg,image/png,image/webp" disabled={!authToken || uploading}
                        onChange={async event => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          if (!file || !authToken || !authUser || uploading) return;
                          setUploading(true);
                          setAvatarStatus('');
                          try {
                            const { avatarUrl } = await businessApi.uploadAvatar(authToken, file);
                            setAuthUser(user => user?.id === authUser.id ? { ...user, avatarUrl } : user);
                            await reloadDiscovery();
                            setAvatarStatus(locale === 'ar' ? 'تم حفظ الصورة' : 'Avatar saved');
                          } catch {
                            setAvatarStatus(locale === 'ar' ? 'تعذر حفظ الصورة. اختر صورة JPEG أو PNG أو WebP حتى 5 ميغابايت.' : 'Could not save the avatar. Try a JPEG, PNG or WebP image up to 5 MB.');
                          } finally {
                            setUploading(false);
                          }
                        }} />
                    </label>
                  </div>
                  <p role="status">{uploading ? (locale === 'ar' ? 'جارٍ الرفع…' : 'Uploading…') : avatarStatus}</p>
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Nickname</p>
                      <input 
                        type="text" 
                        defaultValue="Alex"
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#c79a3b]/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Bio</p>
                      <textarea 
                        defaultValue="Gaming is life! 🎮"
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#c79a3b]/50 outline-none transition-all h-32 resize-none"
                      />
                    </div>
                    <button className="w-full py-5 bg-[#c79a3b] rounded-2xl font-black text-white shadow-sm active:scale-95 transition-all uppercase tracking-widest text-xs mt-4">
                      Save Changes
                    </button>
                  </div>
                </div>
              </SettingsSubPage>
            </motion.div>
  );
}
