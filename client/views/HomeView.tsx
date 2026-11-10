import React, { useState } from 'react';
import { Gamepad2, Search } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { defaultAvatar } from '../app/companionDiscovery';
import './discovery.css';

const games = [
  { name: 'PUBG Mobile', image: 'pubg' }, { name: 'EA FC', image: 'fc' },
  { name: 'Free Fire', image: 'freefire' }, { name: 'Valorant', image: 'valorant' },
];

export function HomeView() {
  const { moreEPals, discoveryStatus, reloadDiscovery, navigateTo, locale, setLocale } = useApp();
  const [query, setQuery] = useState('');
  const [game, setGame] = useState('');
  const ar = locale === 'ar';
  const label = (arabic: string, english: string) => ar ? arabic : english;
  const term = query.trim().toLowerCase();
  const visible = moreEPals.filter(p => (!game || p.game.toLowerCase() === game.toLowerCase()) &&
    [p.id, p.name, p.game].some(value => value.toLowerCase().includes(term)));
  return (
    <div className="discovery" dir={ar ? 'rtl' : 'ltr'}>
      <header className="discovery-header">
        <button className="discovery-language" onClick={() => setLocale(ar ? 'en' : 'ar')}>{ar ? 'English' : 'العربية'}</button>
        <strong>Le3eb <small>CLUB</small></strong>
      </header>
      <section className="discovery-hero">
        <div>
        <div className="discovery-kicker">{label('نادي اللاعبين', 'THE GAMING CLUB')}</div>
        <h1>{label('اللعب أحلى مع رفيق', 'Better games. Better company.')}</h1>
        <p>{label('اختر لعبتك واعثر على رفيق اللعب المناسب.', 'Choose your game and find your next teammate.')}</p>
        <label className="discovery-search"><Search size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={label('ابحث بالاسم أو اللعبة', 'Search by player or game')} aria-label={label('بحث', 'Search')} /></label>
        </div>
        <img className="discovery-art" src="/discovery-hero.jpg" alt="" onError={e => { e.currentTarget.hidden = true; }} />
      </section>
      <main className="discovery-main">
        <h2>{label('الألعاب', 'Popular games')}</h2>
        <div className="discovery-games">
          {games.map(({ name, image }) => <button type="button" key={name} aria-pressed={game === name} onClick={() => setGame(game === name ? '' : name)}>
            <img src={`/game-${image}.jpg`} alt="" onError={e => { e.currentTarget.hidden = true; }} />
            <span><Gamepad2 size={18} /><bdi>{name}</bdi></span>
          </button>)}
        </div>
        <h2>{game ? <bdi>{game}</bdi> : label('رفقاء اللعب', 'Gaming companions')}</h2>
        {discoveryStatus === 'loading' ? <p role="status" className="discovery-state">{label('جارٍ التحميل…', 'Loading companions…')}</p> :
          discoveryStatus === 'error' ? <div role="alert" className="discovery-state">{label('تعذر تحميل القائمة.', 'Could not load companions.')} <button onClick={() => void reloadDiscovery()}>{label('إعادة المحاولة', 'Retry')}</button></div> :
          !visible.length ? <p role="status" className="discovery-state">{label('لا يوجد رفقاء لعب هنا حالياً.', 'No companions here yet.')}</p> :
          <div className="discovery-players">{visible.map(p => (
            <button type="button" className="discovery-player" key={p.id} onClick={() => navigateTo('PROFILE', p)}>
              <img src={p.avatarUrl} alt="" onError={e => { if (e.currentTarget.getAttribute('src') !== defaultAvatar) e.currentTarget.src = defaultAvatar; }} />
              <span><strong><bdi>{p.name}</bdi></strong><span><bdi>{p.game}</bdi></span><span>{p.bio}</span>
              <span>{p.rating > 0 ? `★ ${p.rating}` : label('رفيق جديد', 'New companion')} · {p.orderCount} {label('طلبات مكتملة', 'completed')}</span>
              <span>{p.onlineStatus === 'Online' ? label('متصل', 'Online') : p.onlineStatus === 'Busy' ? label('مشغول', 'Busy') : label('غير متصل', 'Offline')} · {p.price} {label('عملة / ساعة', 'coins / hour')}</span></span>
            </button>
          ))}</div>}
      </main>
    </div>
  );
}
