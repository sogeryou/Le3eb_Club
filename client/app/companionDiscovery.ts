import type { EPal } from '@shared/types';
import type { PublicCompanion } from '../services/businessApi';

export const defaultAvatar = '/default-companion.svg';

const covers = new Map([
  ['pubg mobile', '/game-pubg.jpg'], ['ea fc', '/game-fc.jpg'],
  ['free fire', '/game-freefire.jpg'], ['valorant', '/game-valorant.jpg'],
]);

export function safeAvatar(url: string | null) {
  if (url?.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url;
  try {
    const parsed = new URL(url ?? '');
    if (parsed.protocol === 'https:' && !/(^|\.)(picsum\.photos|example\.com)$/i.test(parsed.hostname)) return parsed.href;
  } catch { /* use the local avatar */ }
  return defaultAvatar;
}

export function toEPal(row: PublicCompanion): EPal {
  return {
    id: row.id, name: row.displayName, game: row.gameName, bio: row.intro,
    avatarUrl: safeAvatar(row.avatarUrl), price: row.hourlyRate,
    rating: row.rating ?? 0, orderCount: String(row.completedOrderCount), tags: [],
    onlineStatus: ({ ONLINE: 'Online', OFFLINE: 'Offline', BUSY: 'Busy' } as const)[row.availability],
    services: row.services?.map(service => ({
      id: service.id, name: service.name, icon: '', posterUrl: covers.get(service.name.toLowerCase()) ?? '/default-cover.svg', description: row.intro,
      rating: row.rating ?? 0, orderCount: String(row.completedOrderCount), screenshots: [],
      variants: [{ name: service.name, price: service.unitPrice, unit: service.unit }],
    })),
    reviews: row.reviews?.map(review => ({
      id: review.id, userName: review.displayName ?? '—', userAvatar: safeAvatar(review.avatarUrl),
      rating: review.rating, comment: review.content,
      date: new Date(review.createdAt).toISOString().slice(0, 10), timestamp: review.createdAt,
    })),
  };
}
