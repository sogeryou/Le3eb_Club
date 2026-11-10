export type DirectMessage = {
  sequence: number;
  senderId: string;
  content: string;
  createdAt: number;
};

export type ConversationSummary = {
  id: string;
  peer: { id: string; displayName: string; avatarUrl: string | null };
  lastMessage: DirectMessage | null;
  unreadCount: number;
  updatedAt: number;
};

export type MessagePage = { conversation: ConversationSummary; messages: DirectMessage[]; hasOlder: boolean };
