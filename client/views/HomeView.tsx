import { ResilientImage } from '../components/ResilientImage';
import React, { useState } from 'react';
import { Gamepad2, Search } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { findCatalogGame, sameGame } from '@shared/games';
import './discovery.css';


export function HomeView() {
  const { GAMES, moreEPals, discoveryStatus, reloadDiscovery, navigateTo, locale, setLocale } = useApp();
  const [query, setQuery] = useState('');
  const [game, setGame] = useState('');
  const ar = locale === 'ar';
  const label = (arabic: string, english: string) => ar ? arabic : english;
  const term = query.trim().toLowerCase();
  const queryGame = findCatalogGame(query);
  const visible = moreEPals.filter(p => (!game || sameGame(p.game, game)) &&
    ([p.id, p.name, p.game].some(value => value.toLowerCase().includes(term)) || (queryGame && sameGame(p.game, queryGame.id))));
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
        <ResilientImage className="discovery-art" src="/discovery-hero.jpg" alt="" />
      </section>
      <main className="discovery-main">
        <h2>{label('الألعاب', 'Popular games')}</h2>
        <div className="discovery-games">
          {GAMES.map(({ id, name, imageUrl, onlineCompanions }) => <button type="button" key={id} data-game-id={id} aria-pressed={game === id} onClick={() => setGame(game === id ? '' : id)}>
            <ResilientImage src={imageUrl} alt="" />
            <span><Gamepad2 size={18} /><bdi>{name}</bdi></span>
            {discoveryStatus === 'ready' && typeof onlineCompanions === 'number' &&
              <small className="game-online-count" data-online-count={onlineCompanions}>{onlineCompanions} {label('متصل', 'online')}</small>}
          </button>)}
        </div>
        <h2>{game ? <bdi>{GAMES.find(g => g.id === game)?.name}</bdi> : label('رفقاء اللعب', 'Gaming companions')}</h2>
        {discoveryStatus === 'loading' ? <p role="status" className="discovery-state">{label('جارٍ التحميل…', 'Loading companions…')}</p> :
          discoveryStatus === 'error' ? <div role="alert" className="discovery-state">{label('تعذر تحميل القائمة.', 'Could not load companions.')} <button onClick={() => void reloadDiscovery()}>{label('إعادة المحاولة', 'Retry')}</button></div> :
          !visible.length ? <p role="status" className="discovery-state">{label('لا يوجد رفقاء لعب هنا حالياً.', 'No companions here yet.')}</p> :
          <div className="discovery-players">{visible.map(p => (
            <button type="button" className="discovery-player" key={p.id} onClick={() => navigateTo('PROFILE', p)}>
              <ResilientImage kind="avatar" src={p.avatarUrl} alt="" />
              <span><strong><bdi>{p.name}</bdi></strong><span><bdi>{p.game}</bdi></span><span>{p.bio}</span>
              <span>{p.rating > 0 ? `★ ${p.rating}` : label('رفيق جديد', 'New companion')} · {p.orderCount} {label('طلبات مكتملة', 'completed')}</span>
              <span>{p.onlineStatus === 'Online' ? label('متصل', 'Online') : p.onlineStatus === 'Busy' ? label('مشغول', 'Busy') : label('غير متصل', 'Offline')} · {p.price} {label('عملة / ساعة', 'coins / hour')}</span></span>
            </button>
          ))}</div>}
      </main>
    </div>
  );
}
