import { ArrowLeft, ChevronRight, Trophy, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../app/AppContext';
import { AuthModal } from '../components/auth/AuthModal';
import { useState, type ReactNode } from 'react';
import { businessApi } from '../services/businessApi';
import { useActiveSessionGuard } from './useActiveSessionGuard';

type PageProps = { onBack?: () => void; onNavigate?: (view: any) => void; ranking?: unknown; [key: string]: unknown };
export function EmptyFeature({ title, tabs = [], children }: { title: string; tabs?: string[]; children?: ReactNode }) {
 const app = useApp(); const arabic = app.locale === 'ar';
 return <motion.section initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="min-h-screen bg-[#0f071a] pb-24">
  <header className="sticky top-0 z-30 bg-[#0f071a]/80 backdrop-blur-xl border-b border-white/10 p-6 flex items-center gap-4"><button aria-label={arabic ? 'رجوع' : 'Back'} onClick={app.handleBack} className="p-2 rounded-xl bg-white/5 border border-white/10"><ArrowLeft className="w-5 h-5 rtl:rotate-180"/></button><h1 className="text-xl font-bold">{title}</h1></header>
  <div className="p-6 space-y-6">{tabs.length > 0 && <div className="flex gap-3 rounded-2xl bg-white/5 border border-white/10 p-2">{tabs.map(tab => <span key={tab} className="flex-1 p-3 text-center text-xs font-bold text-purple-300">{tab}</span>)}</div>}
   <div className="rounded-[32px] bg-white/5 border border-white/10 p-10 text-center space-y-4"><BarChart3 className="w-12 h-12 mx-auto text-purple-400"/><p className="font-bold">{arabic ? 'لا توجد بيانات متاحة' : 'No data available'}</p><p className="text-sm text-gray-400">{arabic ? 'هذه الميزة غير متاحة بعد. لا توجد إحصاءات أو مكافآت تقديرية.' : 'This feature is not available yet. No estimated statistics or rewards are shown.'}</p></div>{children}
  </div></motion.section>;
}
export function CompanionLevelDashboard(props: PageProps) { const {navigateTo,locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مستوى اللاعب':'Player Level'}>{[['TASK_CENTER','Task Center'],['LEVEL_BENEFITS','Level Benefits'],['RANKING_CENTER','Ranking Center']].map(([view,label])=><button key={view} onClick={()=>navigateTo(view as any)} className="w-full p-6 rounded-3xl border border-white/10 bg-white/5 flex items-center gap-4"><Trophy className="text-purple-400"/><span className="flex-1 text-start">{label}</span><ChevronRight className="rtl:rotate-180"/></button>)}</EmptyFeature>; }
export function TaskCenter(_props: PageProps) { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مركز المهام':'Task Center'} tabs={locale==='ar'?['النشاط','الخدمة']:['Activity','Service']}/>; }
export function LevelBenefits(_props: PageProps) { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مزايا المستوى':'Level Benefits'}/>; }
export function IncomeReview(_props: PageProps) { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مراجعة الدخل':'Income Review'} tabs={locale==='ar'?['الدخل','الخدمات']:['Income','Services']}/>; }
export function CustomerReview(_props: PageProps) { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مراجعة العملاء':'Customer Review'} tabs={locale==='ar'?['العملاء','التقييمات']:['Customers','Reviews']}/>; }
export function IcebreakerPoolView(_props: PageProps) { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'مستخدمون جدد':'New Users'} tabs={locale==='ar'?['مستخدمون جدد','الكل']:['New Users','All']}/>; }
export function DecayExplainerModal(_props: PageProps) { return null; }
export function OriginalAuthModal() {
 const app=useApp(); return <AuthModal show={app.showAuthModal} onClose={()=>app.setShowAuthModal(false)} authMode={app.authMode} setAuthMode={app.setAuthMode} authLoginMethod={app.authLoginMethod} setAuthLoginMethod={app.setAuthLoginMethod} authEmail={app.authEmail} setAuthEmail={app.setAuthEmail} authPassword={app.authPassword} setAuthPassword={app.setAuthPassword} authEmailCode={app.authEmailCode} setAuthEmailCode={app.setAuthEmailCode} authCodeCooldown={app.authCodeCooldown} authCodeSending={app.authCodeSending} authUsername={app.authUsername} setAuthUsername={app.setAuthUsername} authStatus={app.authStatus} onSendEmailCode={app.handleSendAuthEmailCode} onSubmit={app.handleAuthSubmit} t={app.t}/>;
}

export function OriginalPlayerCenter() {
 const app=useApp();
 return <EmptyFeature title={app.locale==='ar'?'مركز اللاعب':'Player Center'}>{[
  ['PLAYER_SERVICES','My Services'],['PLAYER_ORDERS','Player Orders'],['COMPANION_LEVEL_DASHBOARD','Player Level'],
  ['TASK_CENTER','Task Center'],['LEVEL_BENEFITS','Level Benefits'],['RANKING_CENTER','Ranking Center'],
  ['INCOME_REVIEW','Income Review'],['CUSTOMER_REVIEW','Customer Review'],['NEW_USERS','New Users'],
 ].map(([route,label])=><button key={route} onClick={()=>app.navigateTo(route as any)} className="flex items-center gap-4 w-full p-6 rounded-3xl bg-white/5 border border-white/10"><Trophy className="text-purple-400"/><span className="flex-1 text-start">{label}</span><ChevronRight className="rtl:rotate-180"/></button>)}</EmptyFeature>;
}
export function OriginalWithdraw() { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'سحب الماس':'Withdraw Diamonds'}/>; }
export function OriginalExchange() { const {locale}=useApp(); return <EmptyFeature title={locale==='ar'?'تحويل الماس':'Exchange Diamonds'}/>; }

export function OriginalAvatarUpload({onUploaded}: {onUploaded: (url: string)=>void}) {
 const {authToken,authUser,setAuthUser,notify,locale}=useApp(); const [busy,setBusy]=useState(false);
 const captureSession=useActiveSessionGuard();
 return <label className="absolute -bottom-2 -right-2 p-2 bg-purple-600 rounded-xl border-2 border-[#0f071a] shadow-xl cursor-pointer">
  <span>{busy?'…':'+'}</span><input aria-label={locale==='ar'?'تحميل صورة شخصية':'Upload avatar'} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||!authToken} className="sr-only" onChange={async event=>{
   const file=event.target.files?.[0]; event.target.value=''; if(!file||!authToken||!authUser)return;setBusy(true);
   const stillCurrent=captureSession();
   try{const result=await businessApi.uploadAvatar(authToken,file);if(!stillCurrent())return;setAuthUser(current=>current?.id===authUser.id?{...current,avatarUrl:result.avatarUrl}:current);onUploaded(result.avatarUrl);notify(locale==='ar'?'تم تحديث الصورة.':'Avatar updated.');}catch(error){if(stillCurrent())notify((error as Error).message);}finally{if(stillCurrent())setBusy(false);}
  }}/></label>;
}
export function DiscoveryState() {
 const {discoveryStatus,reloadDiscovery,locale,EPALS}=useApp(); const ar=locale==='ar';
 if(discoveryStatus==='error')return <p role="alert" className="text-gray-300 pt-4">{ar?'تعذر تحميل الدليل.':'Could not load the directory.'} <button onClick={reloadDiscovery} className="text-purple-300 underline">{ar?'إعادة المحاولة':'Retry'}</button></p>;
 if(discoveryStatus==='loading')return <p role="status" className="text-gray-400 pt-4">{ar?'جارٍ التحميل…':'Loading companions…'}</p>;
 if(!EPALS.length)return <p className="text-gray-400 pt-4">{ar?'لا يوجد رفقاء معتمدون بعد.':'No approved companions yet.'}</p>;
 return null;
}
