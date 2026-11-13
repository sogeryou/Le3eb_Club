import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Calendar, Search, FileText, Gamepad2, MessageCircle, Star, X } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { businessApi, type BusinessOrder, type BusinessReview } from '../services/businessApi';
import { CoinIcon } from '../components/ui/CoinIcon';


/** Source App.tsx PURCHASE_HISTORY / PLAYER_ORDERS / ORDER_DETAIL card structure, live API data. */
export function OriginalOrders({ embedded = false, mode = 'buyer' }: { embedded?: boolean; key?: string; mode?: 'buyer' | 'player' | 'detail' }) {
 const app=useApp(); const ar=app.locale==='ar';
 const [orders,setOrders]=useState<BusinessOrder[]>([]), [reviews,setReviews]=useState<BusinessReview[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false);
 const [tab,setTab]=useState('ALL'),[search,setSearch]=useState(''),[expanded,setExpanded]=useState(false),[showDates,setShowDates]=useState(false),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const [reviewOrder,setReviewOrder]=useState<BusinessOrder|null>(null),[rating,setRating]=useState(5),[content,setContent]=useState('');
 const lock=useRef(false);
 const player=mode==='player';
 const detail=mode==='detail';
 const selected=orders.find(order=>order.id===app.selectedOrder?.id);
 useEffect(()=>{
  let active=true;setOrders([]);setReviews([]);setLoading(true);setError('');
  if(!app.authToken){setLoading(false);return;}
  Promise.all([businessApi.listOrders(app.authToken),businessApi.listReviews(app.authToken)])
   .then(([rows,feedback])=>{if(active){setOrders([...rows].reverse());setReviews(feedback);}})
   .catch(error=>{if(active)setError((error as Error).message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[app.authToken,revision,mode]);
 async function update(order:BusinessOrder,action:'accept'|'start'|'complete'|'cancel'){
  if(!app.authToken||lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const updated=await businessApi.updateOrder(app.authToken,order.id,action);setOrders(rows=>rows.map(row=>row.id===updated.id?updated:row));await app.fetchWallet();await app.fetchTransactions();}
  catch(error){setError((error as Error).message);}finally{lock.current=false;setBusy(false);}
 }
 const label=(status:string)=>({CREATED:ar?'قيد الانتظار':'Pending',ACCEPTED:ar?'مقبول':'Accepted',IN_SERVICE:ar?'جارٍ التنفيذ':'Ongoing',COMPLETED:ar?'مكتمل':'Completed',CANCELLED:ar?'ملغي':'Cancelled',DISPUTED:ar?'متنازع عليه':'Disputed'}[status]??status);
 const open=(order:BusinessOrder)=>{app.setSelectedOrder({id:order.id,epalId:order.companionId,serviceName:order.serviceName,status:'PENDING',price:order.totalPrice,timestamp:order.createdAt??0});app.navigateTo('ORDER_DETAIL');};
 const chat=(order:BusinessOrder)=>app.navigateTo('IM_DETAIL',{orderId:order.id});
 const reviewed=(order:BusinessOrder)=>reviews.find(review=>review.orderId===order.id);
 const canReview=(order:BusinessOrder)=>order.status==='COMPLETED'&&order.userId===app.authUser?.id&&!reviewed(order);
 const filtered=orders.filter(order=>{
  if(!embedded && (player ? order.companionId!==app.myCompanion?.id : order.userId!==app.authUser?.id))return false;
  if(tab!=='ALL'&&order.status!==tab)return false;
  if(search&&!`${order.serviceName} ${order.id}`.toLowerCase().includes(search.toLowerCase()))return false;
  if(start&&(!order.createdAt||order.createdAt<new Date(start).getTime()))return false;
  if(end&&(!order.createdAt||order.createdAt>new Date(end).getTime()+86400000))return false;
  return true;
 });
 const reviewButton=(order:BusinessOrder)=>canReview(order)&&<button className="px-4 py-2 bg-purple-600 rounded-xl text-xs font-black" onClick={()=>{setReviewOrder(order);setRating(5);setContent('');}}>{ar?'تقييم':'Rate'}</button>;
 const status=(order:BusinessOrder)=><span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-purple-500/20 text-purple-300">{label(order.status)}</span>;
 return <motion.section key={detail?'order_detail':player?'player_orders':'purchase_history'} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="min-h-screen pb-20 bg-[#0f071a] p-6 space-y-6">
  {!embedded&&<header className="sticky top-0 z-40 backdrop-blur-md bg-[#0f071a]/80 -mx-6 px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4">
   <button aria-label={ar?'رجوع':'Back'} onClick={app.handleBack} className="p-2 bg-white/5 rounded-xl border border-white/10"><ArrowLeft className="w-5 h-5 rtl:rotate-180"/></button>
   {expanded&&!detail?<input autoFocus aria-label={ar?'بحث الطلبات':'Search orders'} value={search} onChange={event=>setSearch(event.target.value)} placeholder={ar?'بحث الطلبات…':'Search orders…'} className="flex-1 min-w-0 bg-white/5 rounded-xl p-3"/>:<h1 className="text-xl font-bold">{detail?(ar?'تفاصيل الطلب':'Order Details'):player?(ar?'طلبات اللاعب':'My Order'):(ar?'سجل المشتريات':'Purchase History')}</h1>}
   {!detail&&<div className="flex gap-2"><button aria-label="Search orders" onClick={()=>setExpanded(value=>!value)} className="p-2 text-gray-400"><Search className="w-5 h-5"/></button><button aria-label="Filter dates" onClick={()=>setShowDates(value=>!value)} className="p-2 text-gray-400"><Calendar className="w-5 h-5"/></button></div>}
  </header>}
  {loading&&<p role="status" className="text-gray-400">{ar?'جارٍ تحميل الطلبات…':'Loading orders…'}</p>}
  {error&&<p role="alert" className="text-red-300">{error} <button onClick={()=>setRevision(value=>value+1)} className="underline">{ar?'إعادة المحاولة':'Retry'}</button></p>}
  {detail?selected&&<>
   <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-6 space-y-6">
    <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0"><Gamepad2 className="w-8 h-8 text-purple-400"/></div><div className="min-w-0"><h2 className="text-xl font-black truncate">{selected.serviceName}</h2><div className="flex flex-wrap gap-2 mt-1"><span className="text-[10px] font-black text-purple-400">ID: {selected.id}</span>{status(selected)}</div></div></div>
    <div className="pt-6 border-t border-white/5"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{selected.userId===app.authUser?.id?(ar?'الرفيق':'E-Pal'):(ar?'العميل':'Customer')}</p><button onClick={()=>chat(selected)} className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3"><MessageCircle className="text-purple-400"/><span>{ar?'تواصل مع الطرف الآخر':'Contact other party'}</span></button></div>
    <div className="pt-6 border-t border-white/5 space-y-3">{[
     [ar?'وقت الطلب':'Order Time',selected.createdAt?new Date(selected.createdAt).toLocaleString(app.locale):'—'],
     [ar?'سعر الوحدة':'Unit Price',selected.unitPrice],[ar?'الكمية':'Quantity',selected.quantity],[ar?'المجموع':'Total Amount',selected.totalPrice],
    ].map(([key,value])=><div key={key} className="flex justify-between gap-4"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{key}</span><span className="text-sm font-bold">{value}</span></div>)}</div>
   </div>
   <div className="space-y-3">{selected.companionId===app.myCompanion?.id&&selected.status==='CREATED'&&<button disabled={busy} onClick={()=>update(selected,'accept')} className="w-full py-5 rounded-2xl bg-purple-600 font-black">{ar?'قبول الطلب':'Accept Order'}</button>}
    {selected.status==='ACCEPTED'&&<button disabled={busy} onClick={()=>update(selected,'start')} className="w-full py-5 rounded-2xl bg-purple-600 font-black">{ar?'بدء الخدمة':'Start Service'}</button>}
    {selected.status==='IN_SERVICE'&&<button disabled={busy} onClick={()=>update(selected,'complete')} className="w-full py-5 rounded-2xl bg-purple-600 font-black">{ar?'إكمال الخدمة':'Complete Service'}</button>}
    {['CREATED','ACCEPTED'].includes(selected.status)&&<button disabled={busy} onClick={()=>update(selected,'cancel')} className="w-full py-5 rounded-2xl border border-white/10 bg-white/5 font-black">{ar?'إلغاء الطلب':'Cancel Order'}</button>}
    {reviewButton(selected)}{reviewed(selected)&&<div className="p-6 rounded-[32px] border border-white/10 bg-white/5 space-y-3"><p className="font-bold">{ar?'تقييمك':'Your review'} · {reviewed(selected)?.rating}/5</p><p>{reviewed(selected)?.content}</p><p className="text-xs text-gray-400">{reviewed(selected)?.status}</p></div>}
   </div>
  </>:<>
   {showDates&&<div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10"><label className="text-xs text-gray-400">{ar?'من':'Start Date'}<input aria-label="Start Date" type="date" value={start} onChange={event=>setStart(event.target.value)} className="w-full p-3 rounded-xl bg-[#0f071a] text-white"/></label><label className="text-xs text-gray-400">{ar?'إلى':'End Date'}<input aria-label="End Date" type="date" value={end} onChange={event=>setEnd(event.target.value)} className="w-full p-3 rounded-xl bg-[#0f071a] text-white"/></label></div>}
   <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto">{['ALL','CREATED','ACCEPTED','IN_SERVICE','COMPLETED'].map(value=><button key={value} onClick={()=>setTab(value)} className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${tab===value?'bg-purple-600 text-white':'text-gray-500'}`}>{value==='ALL'?(ar?'الكل':'All'):label(value)}</button>)}</div>
   <div className="space-y-6">{filtered.map(order=><article key={order.id} className="p-5 bg-white/5 rounded-[24px] border border-white/10 space-y-4"><div className="flex justify-between gap-4"><div><h2 className="font-bold text-lg">{order.serviceName}</h2><p className="text-[10px] text-gray-500">{order.createdAt?new Date(order.createdAt).toLocaleString(app.locale):'—'}</p></div>{status(order)}</div><div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5"><div className="flex items-center gap-2"><CoinIcon/><span className="font-black text-xl">{order.totalPrice}</span></div><div className="flex gap-2"><button onClick={()=>open(order)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-gray-400">{ar?'التفاصيل':'Details'}</button>{reviewButton(order)}<button onClick={()=>chat(order)} className="px-4 py-2 bg-purple-600 rounded-xl text-xs font-black flex items-center gap-2"><MessageCircle className="w-3 h-3"/>{ar?'محادثة':'Chat'}</button></div></div></article>)}</div>
   {!loading&&!error&&!filtered.length&&<div className="flex flex-col items-center py-20 space-y-4 text-gray-500"><FileText className="w-16 h-16"/><p className="font-bold">{ar?'لا توجد طلبات':'No orders found'}</p></div>}
  </>}
  <AnimatePresence>{reviewOrder&&<motion.div key="review" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"><div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#1a0b2e] p-6 space-y-6"><div className="flex justify-between"><h2 className="text-xl font-black">{ar?'تقييم الخدمة':'Rate this service'}</h2><button aria-label="Close review" onClick={()=>setReviewOrder(null)}><X/></button></div><div className="flex justify-center gap-3">{[1,2,3,4,5].map(value=><button key={value} aria-label={`${value} stars`} onClick={()=>setRating(value)}><Star className={`w-8 h-8 ${value<=rating?'fill-purple-400 text-purple-400':'text-gray-500'}`}/></button>)}</div><textarea aria-label={ar?'تعليق التقييم':'Review feedback'} value={content} onChange={event=>setContent(event.target.value)} className="w-full min-h-32 bg-white/5 border border-white/10 rounded-2xl p-4"/><button disabled={busy||!content.trim()} className="w-full p-4 rounded-2xl bg-purple-600 font-black disabled:opacity-50" onClick={async()=>{
   if(!app.authToken||lock.current)return;lock.current=true;setBusy(true);
   try{const review=await businessApi.createReview(app.authToken,reviewOrder.id,rating,content.trim());setReviews(rows=>[...rows,review]);setReviewOrder(null);app.notify(ar?'أُرسل التقييم للمراجعة.':'Review submitted for moderation.');}catch(error){setError((error as Error).message);}finally{lock.current=false;setBusy(false);}
  }}>{ar?'إرسال التقييم':'Submit Review'}</button></div></motion.div>}</AnimatePresence>
 </motion.section>;
}
