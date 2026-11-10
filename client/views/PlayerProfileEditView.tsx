import React, { useState } from 'react';
import { useApp } from '../app/AppContext';
import { businessApi } from '../services/businessApi';

export function PlayerProfileEditView() {
  const { authToken, myCompanion, myCompanionLoading, myCompanionError, recordCompanionApplication,
    setCompanionStatusRefresh, handleBack, reloadDiscovery, locale } = useApp();
  const label = (ar: string, en: string) => locale === 'ar' ? ar : en;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  return <section className="p-6 pb-28 space-y-5 max-w-2xl mx-auto">
    <button onClick={handleBack}>{label('رجوع', 'Back')}</button>
    <h1 className="text-xl font-bold">{label('ملف المرافق', 'Player Profile')}</h1>
    {myCompanionLoading && !myCompanion ? <p role="status">{label('جارٍ التحميل…', 'Loading…')}</p>
      : myCompanionError ? <p role="alert">{label('تعذر التحميل.', 'Could not load your profile.')} <button onClick={() => setCompanionStatusRefresh(n => n + 1)}>{label('إعادة المحاولة', 'Retry')}</button></p>
      : !myCompanion ? <p>{label('لا يوجد طلب بعد.', 'No companion application yet.')}</p> :
        <form className="space-y-4" onSubmit={async event => {
          event.preventDefault();
          if (!authToken || saving) return;
          const fields = new FormData(event.currentTarget);
          setSaving(true);
          setMessage('');
          try {
            const record = await businessApi.applyCompanion(authToken, String(fields.get('game')).trim(),
              String(fields.get('intro')).trim(), Number(fields.get('price')));
            recordCompanionApplication(record);
            await reloadDiscovery();
            setMessage(record.status === 'PENDING_REVIEW' ? label('أُرسل الملف للمراجعة.', 'Profile submitted for review.') : label('لم يتغير الملف.', 'No changes to review.'));
          } catch {
            setMessage(label('تعذر حفظ الملف.', 'Could not save your profile.'));
          } finally { setSaving(false); }
        }}>
          <p role="status">{myCompanion.status === 'PENDING_REVIEW' ? label('قيد المراجعة', 'Pending review')
            : myCompanion.status === 'APPROVED' ? label('مقبول', 'Approved') : label('مرفوض', 'Rejected')}</p>
          {myCompanion.rejectionReason && <p>{myCompanion.rejectionReason}</p>}
          <p>{label('بعد تعديل الملف سيُخفى حتى الموافقة مجدداً.', 'Changes hide your listing until an administrator approves it again.')}</p>
          <label className="block">{label('اللعبة', 'Game')}<input name="game" required maxLength={80} className="block w-full bg-white/10 rounded p-3" defaultValue={myCompanion.gameName} /></label>
          <label className="block" htmlFor="companion-intro">{label('النبذة', 'Introduction')}</label>
          <textarea id="companion-intro" name="intro" required maxLength={2000} className="block w-full bg-white/10 rounded p-3" defaultValue={myCompanion.intro} />
          <label className="block">{label('السعر بالساعة', 'Hourly rate')}<input name="price" required type="number" step="any" min="0.01" max="500" className="block w-full bg-white/10 rounded p-3" defaultValue={myCompanion.hourlyRate} /></label>
          <button className="rounded bg-purple-600 px-4 py-3" disabled={saving}>{label('حفظ التغييرات', 'Save changes')}</button>
          <p role="status">{message}</p>
        </form>}
  </section>;
}
