import React, { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { businessApi, type BusinessOrder } from '../services/businessApi';

export function OrderContacts() {
  const { authToken, locale, navigateTo } = useApp();
  const ar = locale === 'ar';
  const [orders, setOrders] = useState<BusinessOrder[] | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<BusinessOrder | null>(null);
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    setError(false);
    businessApi.listOrders(authToken).then(rows => {
      if (active) setOrders([...rows].reverse());
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [authToken, revision]);
  if (error) return <p role="alert">{ar ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'} <button onClick={() => setRevision(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></p>;
  if (!orders) return <p role="status">{ar ? 'جارٍ تحميل الطلبات…' : 'Loading orders…'}</p>;
  if (selected) return <section className="rounded-xl border border-white/15 p-4 space-y-3">
    <button onClick={() => setSelected(null)}>{ar ? 'العودة إلى الطلبات' : 'Back to orders'}</button>
    <h2 className="font-bold">{ar ? 'تفاصيل الطلب' : 'Order details'}</h2>
    <p><bdi>{selected.serviceName}</bdi> · <bdi>{selected.status}</bdi></p>
    <p><bdi>{selected.id}</bdi></p>
    <p>{selected.quantity} × {selected.unitPrice} = {selected.totalPrice} {ar ? 'عملة' : 'coins'}</p>
    <button className="rounded bg-[#c79a3b] text-[#07382a] px-3 py-2" onClick={() => navigateTo('IM_DETAIL', { orderId: selected.id })}>{ar ? 'تواصل مع الطرف الآخر' : 'Contact other party'}</button>
  </section>;
  return <div className="space-y-3">
    {!orders.length && <p>{ar ? 'لا توجد طلبات بعد.' : 'No orders yet.'}</p>}
    {orders.map(order => <button key={order.id} className="block w-full rounded border border-white/15 p-3 text-start" onClick={() => setSelected(order)}>
      <bdi>{order.serviceName}</bdi> · <bdi>{order.status}</bdi><small className="block"><bdi>{order.id}</bdi></small>
    </button>)}
  </div>;
}

export function MyOrdersView() {
  const { handleBack, locale } = useApp();
  return <section className="p-5 pb-28 space-y-4">
    <button onClick={handleBack}>{locale === 'ar' ? 'رجوع' : 'Back'}</button>
    <h1 className="text-xl font-bold">{locale === 'ar' ? 'طلباتي' : 'My orders'}</h1>
    <OrderContacts />
  </section>;
}
