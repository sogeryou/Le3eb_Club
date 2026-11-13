import React, { useEffect, useState } from 'react';
import type { ConversationSummary } from '@shared/directMessages';
import { useApp } from '../app/AppContext';
import { ResilientImage } from '../components/ResilientImage';
import { businessApi } from '../services/businessApi';

import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { OriginalOrders } from '../original/OriginalOrders';

export function ImView() {
  const { authToken, navigateTo, locale, imTab, setImTab } = useApp();
  const ar = locale === 'ar';
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!authToken || imTab !== 'MESSAGE') return;
    setRows([]);
    setLoading(true);
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await businessApi.listConversations(authToken);
        if (active) { setRows(result); setFailed(false); }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) { setLoading(false); timer = setTimeout(poll, 4000); }
      }
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [authToken, imTab, revision]);
  return <motion.section key="im" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="min-h-screen pb-20 pt-4 px-6 space-y-6">
    <div className="flex items-center border-b border-white/5 pb-4" aria-label={ar ? 'الرسائل والطلبات' : 'Messages and orders'}>
      {(['MESSAGE','FRIENDS','ORDER'] as const).map(tab=><button key={tab} className={`flex-1 text-center text-lg font-bold transition-all relative ${imTab===tab?'text-white':'text-gray-500'}`} aria-pressed={imTab===tab} onClick={()=>setImTab(tab)}>{tab==='MESSAGE'?(ar?'الرسائل':'Message'):tab==='FRIENDS'?(ar?'الأصدقاء':'Friends'):(ar?'الطلبات':'Order')}{imTab===tab&&<motion.div layoutId="imTab" className="absolute -bottom-4 left-0 right-0 h-1 bg-purple-500 rounded-full"/>}</button>)}
    </div>
    {imTab === 'ORDER' ? <OriginalOrders embedded /> : imTab==='FRIENDS'?<div className="py-20 text-center space-y-4"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5"><Users className="w-8 h-8 text-gray-600"/></div><p className="text-gray-500 font-bold">{ar?'قائمة الأصدقاء غير متاحة بعد.':'Friends are not available yet.'}</p></div>:<>
      {loading && <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading conversations…'}</p>}
      {failed && <p role="alert">{ar ? 'تعذر تحميل المحادثات.' : 'Could not load conversations.'} <button className="underline" onClick={() => setRevision(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></p>}
      {!loading && !failed && rows.length === 0 && <p>{ar ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p>}
      {rows.map(row => <button className="flex w-full gap-4 items-center text-start hover:bg-white/5 transition-all p-2 -mx-2 rounded-xl" key={row.id} onClick={() => navigateTo('IM_DETAIL', { conversationId: row.id })}>
        <ResilientImage kind="avatar" src={row.peer.avatarUrl} className="w-14 h-14 rounded-full object-cover border border-white/10" />
        <span className="min-w-0 flex-1">
          <strong><bdi>{row.peer.displayName}</bdi></strong>
          <span className="block truncate text-gray-300" dir="auto">{row.lastMessage?.content ?? (ar ? 'محادثة جديدة' : 'New conversation')}</span>
        </span>
        {!!row.unreadCount && <span className="w-5 h-5 rounded-full bg-purple-600 text-center text-xs font-bold text-white">{row.unreadCount}</span>}
      </button>)}
    </>}
  </motion.section>;
}
