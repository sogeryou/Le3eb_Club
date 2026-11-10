import React, { useEffect, useRef, useState } from 'react';
import type { ConversationSummary, DirectMessage } from '@shared/directMessages';
import { useApp } from '../app/AppContext';
import { ResilientImage } from '../components/ResilientImage';
import { businessApi } from '../services/businessApi';

function mergeMessages(existing: DirectMessage[], incoming: DirectMessage[]) {
  return [...new Map([...existing, ...incoming].map(row => [row.sequence, row])).values()]
    .sort((a, b) => a.sequence - b.sequence);
}

export function ImDetailView() {
  const { authToken, authUser, chatTarget, handleBack, locale } = useApp();
  const ar = locale === 'ar';
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [revision, setRevision] = useState(0);
  const sendLock = useRef(false);
  const retry = useRef<{ content: string; id: string } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (!authToken || !chatTarget) return;
    const token = authToken;
    const target = chatTarget;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let id = 'conversationId' in target ? target.conversationId : '';
    let after: number | undefined;
    setLoadError(false);
    const poll = async () => {
      try {
        if (!id) {
          if ('conversationId' in target) return;
          id = (await businessApi.openConversation(token, target)).id;
        }
        if (!active) return;
        const page = await businessApi.conversationMessages(token, id, after === undefined ? undefined : { after });
        if (!active) return;
        setConversation(page.conversation);
        if (after === undefined) setHasOlder(page.hasOlder);
        setMessages(prev => mergeMessages(prev, page.messages));
        after = page.messages.at(-1)?.sequence ?? after ?? 0;
        if (after && document.visibilityState === 'visible') await businessApi.markConversationRead(token, id, after);
        if (active) setLoadError(false);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) timer = setTimeout(poll, 4000);
      }
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [authToken, chatTarget, revision]);

  useEffect(() => {
    if (viewport.current && stickToBottom.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!authToken || !conversation || !content || sendLock.current) return;
    sendLock.current = true;
    setBusy(true);
    setSendError(false);
    if (retry.current?.content !== content) retry.current = { content, id: crypto.randomUUID() };
    try {
      const message = await businessApi.sendConversationMessage(authToken, conversation.id, content, retry.current.id);
      stickToBottom.current = true;
      setMessages(prev => mergeMessages(prev, [message]));
      setDraft('');
      retry.current = null;
    } catch {
      setSendError(true);
    } finally {
      sendLock.current = false;
      setBusy(false);
    }
  }

  return <section className="p-5 max-w-3xl mx-auto space-y-4">
    <header className="flex items-center gap-3">
      <button className="rounded border px-3 py-2" onClick={handleBack}>{ar ? 'رجوع' : 'Back'}</button>
      {conversation && <>
        <ResilientImage kind="avatar" src={conversation.peer.avatarUrl} className="size-10 rounded-full object-cover" />
        <h1 className="font-bold"><bdi>{conversation.peer.displayName}</bdi></h1>
      </>}
    </header>
    {loadError && <p role="alert">{ar ? 'تعذر فتح المحادثة أو تحديثها.' : 'Could not open or refresh the conversation.'} <button className="underline" onClick={() => setRevision(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></p>}
    {!conversation && !loadError && <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading conversation…'}</p>}
    {conversation && <>
      <div className="h-[55vh] overflow-auto rounded-xl border border-white/15 p-3 space-y-2" ref={viewport} onScroll={event => {
        const el = event.currentTarget;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
      }}>
        {hasOlder && <button disabled={olderBusy} className="underline" onClick={async () => {
          if (!authToken || olderBusy || !messages[0]) return;
          setOlderBusy(true);
          setHistoryError(false);
          try {
            const older = await businessApi.conversationMessages(authToken, conversation.id, { before: messages[0].sequence });
            stickToBottom.current = false;
            setMessages(prev => mergeMessages(prev, older.messages));
            setHasOlder(older.hasOlder);
          } catch { setHistoryError(true); }
          finally { setOlderBusy(false); }
        }}>{ar ? 'تحميل الرسائل السابقة' : 'Load older messages'}</button>}
        {historyError && <p role="alert">{ar ? 'تعذر تحميل الرسائل السابقة.' : 'Could not load older messages.'}</p>}
        {!messages.length && <p>{ar ? 'ابدأ المحادثة برسالة.' : 'Start the conversation with a message.'}</p>}
        {messages.map(message => <div key={message.sequence} className={`flex ${message.senderId === authUser?.id ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-3 py-2 ${message.senderId === authUser?.id ? 'bg-[#0b4a38]' : 'bg-white/10'}`}>
            <p dir="auto" className="whitespace-pre-wrap break-words">{message.content}</p>
            <time className="text-xs text-gray-300">{new Date(message.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        </div>)}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <textarea className="flex-1 rounded bg-white/10 p-3" aria-label={ar ? 'رسالة' : 'Message'} maxLength={2000} value={draft} disabled={busy} onChange={event => setDraft(event.target.value)} />
        <button className="rounded bg-[#c79a3b] px-4 text-[#07382a] disabled:opacity-50" disabled={busy || !draft.trim()}>{ar ? 'إرسال' : 'Send'}</button>
      </form>
      {sendError && <p role="alert">{ar ? 'تعذر الإرسال. يمكنك المحاولة مجدداً.' : 'Could not send. Your draft is kept; try again.'}</p>}
    </>}
  </section>;
}
