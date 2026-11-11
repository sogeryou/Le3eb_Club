import type { RechargeOrder, RechargePackage, Wallet as WalletType, WalletTransaction } from '@shared/types';
import type { ConversationSummary, DirectMessage, MessagePage } from '@shared/directMessages';
import type { PublicMoneyPolicy } from '@shared/money';

export interface AuthUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  email: string;
  role: 'USER' | 'PLAYER' | 'ADMIN';
  adminRoleTemplate?: string;
  permissions?: string[];
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  legacyToken?: string;
  user: AuthUser;
}

export interface CompanionProfile {
  id: string;
  userId: string;
  gameName: string;
  intro: string;
  hourlyRate: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  availability: 'ONLINE' | 'OFFLINE' | 'BUSY';
}

export interface CompanionRanking {
  rank: number;
  companionId: string;
  gameName: string;
  hourlyRate: number;
  availability: 'ONLINE' | 'OFFLINE' | 'BUSY';
  avgRating: number;
  completedOrderCount: number;
  reviewCount: number;
  completionRate: number;
  totalRevenue: number;
  rankingScore: number;
  poolTag: 'NEW' | 'STABLE' | 'HIGH_PERFORMING';
  scoreBreakdown: {
    quality: number;
    volume: number;
    fulfillment: number;
    revenue: number;
    riskPenalty: number;
  };
}

export interface PublicCompanion {
  id: string;
  gameName: string;
  displayName: string;
  avatarUrl: string | null;
  intro: string;
  hourlyRate: number;
  availability: CompanionProfile['availability'];
  rating: number | null;
  completedOrderCount: number;
  services?: { id: string; name: string; unitPrice: number; unit: string }[];
  reviews?: { id: string; rating: number; content: string; createdAt: number; displayName: string | null; avatarUrl: string | null }[];
}

export interface BusinessOrder {
  id: string;
  userId: string;
  companionId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'CREATED' | 'ACCEPTED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
}

export interface BusinessReview {
  id: string;
  orderId: string;
  companionId: string;
  rating: number;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

import { apiUrl, readJsonResponse } from '@shared/apiClient';

type HttpMethod = 'GET' | 'POST' | 'PATCH';

async function request<T>(path: string, method: HttpMethod, body?: unknown, token?: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return readJsonResponse<T>(response);
}

export const businessApi = {
  register(username: string, email: string, password: string, deviceId?: string) {
    return request<unknown>('/api/auth/register', 'POST', { username, email, password, deviceId });
  },
  login(email: string, password: string, deviceId?: string) {
    return request<AuthSession>('/api/auth/login', 'POST', { email, password, deviceId });
  },
  sendEmailCode(email: string, purpose: 'login' | 'register' = 'login', deviceId?: string) {
    return request<{ ok: boolean; purpose: 'login' | 'register'; expiresInSec: number; cooldownSec: number }>(
      '/api/auth/email-code/send',
      'POST',
      { email, purpose, deviceId }
    );
  },
  loginWithEmailCode(email: string, code: string, username?: string, deviceId?: string) {
    return request<AuthSession>('/api/auth/email-code/login', 'POST', { email, code, username, deviceId });
  },
  createTicket(token: string, subject: string, body: string) {
    return request<{ id: string; status: string }>('/api/tickets', 'POST', { subject, body }, token);
  },
  listMyTickets(token: string) {
    return request<Array<{ id: string; subject: string; status: string; createdAt: number }>>('/api/tickets', 'GET', undefined, token);
  },
  getSession(token: string) {
    return request<AuthSession['user']>('/api/auth/session', 'GET', undefined, token);
  },
  logout(token: string) {
    return request<{ ok: boolean }>('/api/auth/logout', 'POST', undefined, token);
  },
  applyCompanion(token: string, gameName: string, intro: string, hourlyRate: number) {
    return request<CompanionProfile>('/api/companions/apply', 'POST', { gameName, intro, hourlyRate }, token);
  },
  getMyCompanion(token: string) {
    return request<CompanionProfile | null>('/api/companions/me', 'GET', undefined, token);
  },
  listCompanions(token: string) {
    return request<CompanionProfile[]>('/api/companions?available=true', 'GET', undefined, token);
  },
  discoverCompanions() {
    return request<PublicCompanion[]>('/api/companions', 'GET');
  },
  async uploadAvatar(token: string, file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      throw new Error('Choose a JPEG, PNG or WebP image up to 5 MB.');
    }
    const signed = await request<{ url: string; key: string; maxBytes: number; headers?: { 'If-None-Match'?: string } }>('/api/uploads/signed', 'POST', { purpose: 'avatar', mime: file.type }, token);
    if (file.size > signed.maxBytes) throw new Error('Image is too large.');
    const local = signed.url.startsWith('/api/uploads/dev-put?');
    if (!local && !signed.url.startsWith('https://')) throw new Error('Upload location is invalid.');
    const upload = await fetch(local ? apiUrl(signed.url) : signed.url, {
      method: 'PUT', body: file, redirect: 'error',
      headers: local ? { 'Content-Type': file.type, Authorization: `Bearer ${token}` }
        : { 'Content-Type': file.type, ...(signed.headers?.['If-None-Match'] === '*' ? { 'If-None-Match': '*' } : {}) },
    });
    if (!upload.ok) throw new Error('Image upload failed.');
    return request<{ avatarUrl: string }>('/api/uploads/commit', 'POST', { purpose: 'avatar', key: signed.key }, token);
  },
  getCompanion(id: string) {
    return request<PublicCompanion>(`/api/companions/${encodeURIComponent(id)}`, 'GET');
  },
  listCompanionRankings(token: string, limit = 20) {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    return request<CompanionRanking[]>(`/api/companions/rankings?limit=${safeLimit}`, 'GET', undefined, token);
  },
  createOrder(token: string, companionId: string, serviceName: string, quantity: number) {
    return request<BusinessOrder>('/api/orders', 'POST', { companionId, serviceName, quantity }, token);
  },
  updateOrder(token: string, orderId: string, action: 'accept' | 'start' | 'complete' | 'cancel') {
    return request<BusinessOrder>(`/api/orders/${orderId}/${action}`, 'POST', {}, token);
  },
  listOrders(token: string) {
    return request<BusinessOrder[]>('/api/orders', 'GET', undefined, token);
  },
  getMoneyPolicy() {
    return request<PublicMoneyPolicy>('/api/money/policy', 'GET');
  },
  openConversation(token: string, target: { companionId: string } | { orderId: string }) {
    return request<ConversationSummary>('/api/conversations', 'POST', target, token);
  },
  listConversations(token: string) {
    return request<ConversationSummary[]>('/api/conversations', 'GET', undefined, token);
  },
  conversationMessages(token: string, id: string, page?: { before: number } | { after: number }) {
    const query = page ? ('after' in page ? `?after=${page.after}` : `?before=${page.before}`) : '';
    return request<MessagePage>(`/api/conversations/${encodeURIComponent(id)}/messages${query}`, 'GET', undefined, token);
  },
  sendConversationMessage(token: string, id: string, content: string, clientId: string) {
    return request<DirectMessage>(`/api/conversations/${encodeURIComponent(id)}/messages`, 'POST', { content, clientId }, token);
  },
  markConversationRead(token: string, id: string, through: number) {
    return request<{ unreadCount: number }>(`/api/conversations/${encodeURIComponent(id)}/read`, 'POST', { through }, token);
  },
  createReview(token: string, orderId: string, rating: number, content: string) {
    return request<BusinessReview>('/api/reviews', 'POST', { orderId, rating, content }, token);
  },
  listReviews(token: string) {
    return request<BusinessReview[]>('/api/reviews', 'GET', undefined, token);
  },
  listRechargePackages() {
    return request<RechargePackage[]>('/api/recharge/packages', 'GET');
  },
  createRechargeOrder(token: string, packageId: string, paymentMethod: 'GOOGLE_PAY' | 'APPLE_PAY', policyId?: string) {
    return request<RechargeOrder>('/api/recharge/create', 'POST', { packageId, paymentMethod, policyId }, token);
  },
  verifyRecharge(token: string, orderId: string, transactionId: string, status: 'SUCCESS' | 'FAILED') {
    return request<{ status: 'SUCCESS' | 'PENDING' | 'FAILED'; alreadyProcessed?: boolean; coins?: number; message?: string }>(
      '/api/recharge/verify',
      'POST',
      { orderId, transactionId, status },
      token
    );
  },
  getWalletBalance(token: string) {
    return request<WalletType>('/api/wallet/balance', 'GET', undefined, token);
  },
  listWalletTransactions(token: string) {
    return request<WalletTransaction[]>('/api/wallet/transactions', 'GET', undefined, token);
  },
  createWithdrawRequest(token: string, diamondAmount: number, channel: string) {
    return request<unknown>('/api/wallet/withdraw-requests', 'POST', { diamondAmount, channel }, token);
  }
};
