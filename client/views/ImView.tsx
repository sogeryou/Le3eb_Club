import React, { useEffect, useState } from 'react';
import type { ConversationSummary } from '@shared/directMessages';
import { useApp } from '../app/AppContext';
import { ResilientImage } from '../components/ResilientImage';
import { businessApi } from '../services/businessApi';
import { OrderContacts } from './MyOrdersView';

export function ImView() {
  const { authToken, navigateTo, locale, imTab, setImTab } = useApp();
  const ar = locale === 'ar';
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!authToken || imTab === 'ORDER') return;
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
  return <section className="p-5 pb-28 space-y-4">
    <div className="flex gap-4" aria-label={ar ? 'الرسائل والطلبات' : 'Messages and orders'}>
      <button className="rounded border px-3 py-2" aria-pressed={imTab !== 'ORDER'} onClick={() => setImTab('MESSAGE')}>{ar ? 'المحادثات' : 'Conversations'}</button>
      <button className="rounded border px-3 py-2" aria-pressed={imTab === 'ORDER'} onClick={() => setImTab('ORDER')}>{ar ? 'الطلبات' : 'Orders'}</button>
    </div>
    {imTab === 'ORDER' ? <OrderContacts /> : <>
      {loading && <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading conversations…'}</p>}
      {failed && <p role="alert">{ar ? 'تعذر تحميل المحادثات.' : 'Could not load conversations.'} <button className="underline" onClick={() => setRevision(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></p>}
      {!loading && !failed && rows.length === 0 && <p>{ar ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p>}
      {rows.map(row => <button className="flex w-full gap-3 items-center text-start border border-white/15 rounded-xl p-3" key={row.id} onClick={() => navigateTo('IM_DETAIL', { conversationId: row.id })}>
        <ResilientImage kind="avatar" src={row.peer.avatarUrl} className="size-12 rounded-full object-cover" />
        <span className="min-w-0 flex-1">
          <strong><bdi>{row.peer.displayName}</bdi></strong>
          <span className="block truncate text-gray-300" dir="auto">{row.lastMessage?.content ?? (ar ? 'محادثة جديدة' : 'New conversation')}</span>
        </span>
        {!!row.unreadCount && <span className="rounded-full bg-[#c79a3b] px-2 text-[#07382a]">{row.unreadCount}</span>}
      </button>)}
    </>}
  </section>;
}
