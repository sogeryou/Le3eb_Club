import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { Notification, Playlink, Post, WalletTransaction } from '@shared/types';
import { useApp } from '../app/AppContext';
import { useActiveSessionGuard } from './useActiveSessionGuard';
import { safeAvatar } from '../app/companionDiscovery';
import { businessApi, type BusinessDashboard, type CompanionRanking, type PublicCompanion } from '../services/businessApi';

/** The supplied source owns presentation; only the existing backend owns domain state. */
export function useOriginalBridge() {
  const app = useApp();
  const captureSession = useActiveSessionGuard();
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [rankings, setRankings] = useState<CompanionRanking[]>([]);
  const [publicProfile, setPublicProfile] = useState<PublicCompanion | null>(null);
  useEffect(() => {
    let active = true;
    setPublicProfile(null);
    if (app.myCompanion?.status === 'APPROVED') businessApi.getCompanion(app.myCompanion.id)
      .then(value => { if (active) setPublicProfile(value); }).catch(() => {});
    return () => { active = false; };
  }, [app.myCompanion?.id, app.myCompanion?.status, app.currentView]);
  useEffect(() => { let active = true; businessApi.listCompanionRankings('', 100).then(rows => { if (active) setRankings(rows); }).catch(() => { if (active) setRankings([]); }); return () => { active = false; }; }, [app.EPALS]);
  const [playerApplicationData, setPlayerApplicationData] = useState({
    ...app.playerApplicationData,
    services: [] as Array<{ id: string; serviceName: string; price: number; unit: string; promotion: typeof app.playerApplicationData.promotion }>,
  });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    let active = true;
    setDashboard(null);
    if (app.authToken) businessApi.getDashboard(app.authToken)
      .then(value => { if (active) setDashboard(value); }).catch(() => { if (active) setDashboard(null); });
    return () => { active = false; };
  }, [app.authToken, app.currentView, app.wallet?.balance]);
  const unavailable = (..._args: unknown[]) => app.notify(app.locale === 'ar' ? 'هذه الميزة غير متاحة بعد. لم يتم حفظ أي تغييرات.' : 'This feature is not available yet. No changes were saved.');
  const userProfile = useMemo(() => ({
    avatarUrl: safeAvatar(app.authUser?.avatarUrl ?? null), name: app.authUser?.username ?? (app.locale === 'ar' ? 'زائر' : 'Guest'),
    gender: '', birthday: '', region: '', bio: app.myCompanion?.intro ?? '', email: app.authUser?.email ?? '', phone: '',
    linkedAccounts: { Discord: false, Google: false, Facebook: false, Apple: false }, album: [] as string[],
  }), [app.authUser, app.myCompanion, app.locale]);
  const playerServices = app.myCompanion ? [{
    id: app.myCompanion.id, name: app.myCompanion.gameName, coverName: app.myCompanion.intro,
    coverUrl: app.GAMES.find(game => game.name === app.myCompanion?.gameName)?.imageUrl ?? '/default-cover.svg',
    voiceUrl: '', price: app.myCompanion.hourlyRate, unit: 'hr', rating: publicProfile?.rating ?? '—', reviews: publicProfile?.reviews?.length ?? '—',
    status: app.myCompanion.availability, orders: publicProfile?.completedOrderCount ?? '—',
  }] : [];
  const legendIds = new Set(rankings.filter(row => row.poolTag === 'HIGH_PERFORMING').map(row => row.companionId));
  const newIds = new Set(rankings.filter(row => row.poolTag === 'NEW').map(row => row.companionId));
  const EPALS = app.EPALS.map(epal => ({ ...epal, isLegend: legendIds.has(epal.id) }));
  const submitApplication = async () => {
    if (!app.requireAuthAction() || !app.authToken || submitting) return;
    if (playerApplicationData.services.length !== 1 || playerApplicationData.services[0].promotion?.type !== 'NONE') {
      app.notify(app.locale === 'ar' ? 'يُدعم حاليًا سعر خدمة واحدة دون عروض ترويجية.' : 'Only one hourly service without promotions is supported currently.'); return;
    }
    const game = app.GAMES.find(row => row.id === playerApplicationData.gameId) ?? app.selectedGame;
    const intro = playerApplicationData.intro.trim() || app.applicationDetails.style.trim();
    const price = Number(playerApplicationData.services[0]?.price || playerApplicationData.price || app.applicationDetails.price);
    if (!game || !intro || !Number.isFinite(price) || price <= 0) {
      app.notify(app.locale === 'ar' ? 'اختر لعبة وأدخل نبذة وسعرًا صالحًا.' : 'Choose a game and enter an introduction and a valid hourly price.'); return;
    }
    setSubmitting(true);
    const stillCurrent = captureSession();
    try {
      const record = await businessApi.applyCompanion(app.authToken, game.name, intro, price);
      if (!stillCurrent()) return;
      app.recordCompanionApplication(record);
      app.notify(app.locale === 'ar' ? 'تم إرسال الطلب للمراجعة.' : 'Application submitted for review.');
      app.navigateTo('APPLY_PLAYER');
    } catch (error) { if (stillCurrent()) app.notify((error as Error).message); }
    finally { if (stillCurrent()) setSubmitting(false); }
  };
  const handleReportSubmit = async (report: { type: string; description: string; images: string[] }) => {
    if (!app.requireAuthAction() || !app.authToken || !app.selectedEPal) return false;
    if (report.images.length) { app.notify('Report attachments are not supported yet. Remove attachments to send your report.'); return false; }
    const stillCurrent = captureSession();
    try {
      await businessApi.submitReport(app.authToken, 'COMPANION', app.selectedEPal.id, `${report.type}: ${report.description}`);
      if (!stillCurrent()) return false;
      app.notify(app.locale === 'ar' ? 'تم إرسال البلاغ للمراجعة.' : 'Report submitted for review.');
      return true;
    } catch (error) { if (stillCurrent()) app.notify((error as Error).message); return false; }
  };
  const setIsPlayerOnline = async (value: boolean) => {
    if (!app.authToken || !app.myCompanion) return unavailable();
    const stillCurrent = captureSession();
    try { const result = await businessApi.updateCompanionAvailability(app.authToken, app.myCompanion.id, value ? 'ONLINE' : 'OFFLINE'); if (stillCurrent()) app.recordCompanionApplication(result); }
    catch (error) { if (stillCurrent()) app.notify((error as Error).message); }
  };
  const setUserStatus = async (status: 'ONLINE'|'OFFLINE'|'PLAYING'|'RESTING') => {
    if (!app.authToken || !app.myCompanion || status === 'RESTING') return unavailable();
    const stillCurrent = captureSession();
    try { const result = await businessApi.updateCompanionAvailability(app.authToken,app.myCompanion.id,status==='PLAYING'?'BUSY':status); if (stillCurrent()) app.recordCompanionApplication(result); }
    catch(error) { if (stillCurrent()) app.notify((error as Error).message); }
  };
  return {
    ...app, EPALS, moreEPals: EPALS.filter(row => !row.isLegend), legendEPals: EPALS.filter(row => row.isLegend), newEPals: EPALS.filter(row => newIds.has(row.id)),
    selectedLanguage: (app.locale === 'ar' ? 'Arabic' : 'English') as 'English' | 'Arabic',
    setSelectedLanguage: (language: 'English' | 'Arabic') => app.setLocale(language === 'Arabic' ? 'ar' : 'en'),
    userProfile, setUserProfile: unavailable, userCoins: app.wallet?.balance ?? 0, userDiamonds: dashboard?.diamondWallet.balance ?? 0, cacheSize: '—',
    diamondTransactions: [] as WalletTransaction[], playerServices, setPlayerServices: unavailable,
    myPlaylinks: [] as Playlink[], setMyPlaylinks: unavailable, notifications: [] as Notification[], setNotifications: unavailable,
    playerRanking: null, getLevelBenefits: (..._args: unknown[]) => ({ priceRange: [0, Number.MAX_SAFE_INTEGER], exposure: 'Unavailable' }), getLevelConfig: () => null,
    setPlayerRanking: unavailable, processWeeklyUpdate: unavailable, handleExchangeDiamonds: unavailable, handleWithdrawDiamonds: unavailable,
    handleStartBind: unavailable, handleSendCode: unavailable, handleVerifyBind: unavailable, handleUnbind: unavailable,
    handleUpdatePassword: unavailable, handleCreatePost: unavailable, handleBlockUser: unavailable, handleReportSubmit,
    isInteractionBlocked: (..._args: unknown[]) => false, allPosts: [] as Post[], setAllPosts: unavailable,
    blockedUsers: new Set<string>(), setBlockedUsers: unavailable, blockedMeUsers: new Set<string>(),
    toggleFollow: unavailable, confirmUnfollow: unavailable,
    handlePlayToggle: (_id: string, event: MouseEvent) => { event.stopPropagation(); unavailable(); },
    playerApplicationData, setPlayerApplicationData, submitApplication, submitting, unavailable,
    isPlayerOnline: app.myCompanion?.availability === 'ONLINE', setIsPlayerOnline,
    userStatus: app.myCompanion?.availability === 'BUSY' ? 'PLAYING' : app.myCompanion?.availability ?? 'OFFLINE', setUserStatus,
  };
}
