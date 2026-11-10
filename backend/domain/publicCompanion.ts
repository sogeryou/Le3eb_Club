import type { CompanionEntity, OrderEntity, ReviewEntity, UserEntity } from './types.js';

export function publicCompanion(
  companion: CompanionEntity,
  user: UserEntity | undefined,
  orders: OrderEntity[],
  reviews: ReviewEntity[],
) {
  if (companion.status !== 'APPROVED' || !user || user.id !== companion.userId) return null;
  const visibleReviews = reviews.filter(r => r.companionId === companion.id && r.status === 'APPROVED');
  const { id, gameName, intro, hourlyRate, availability } = companion;
  return {
    id, gameName, intro, hourlyRate, availability,
    displayName: user.username,
    avatarUrl: user.avatarUrl ?? null,
    rating: visibleReviews.length
      ? Number((visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length).toFixed(2))
      : null,
    reviewCount: visibleReviews.length,
    completedOrderCount: orders.filter(o => o.companionId === id && o.status === 'COMPLETED').length,
  };
}
