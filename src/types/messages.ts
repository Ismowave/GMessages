export type ConversationTheme = 'blue' | 'emerald' | 'plum' | 'teal' | 'coral';

export type TransportType = 'rcs' | 'sms';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'scheduled';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  avatarColor: string;
  initials: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'audio' | 'file' | 'location';
  url: string;
  name?: string;
  size?: number;
  durationSec?: number;
  mimeType?: string;
  locationLabel?: string;
  coordinates?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  status: DeliveryStatus;
  transport: TransportType;
  attachments?: MessageAttachment[];
  reactions: Record<string, string[]>;
  replyToId?: string;
  isStarred?: boolean;
  scheduledFor?: number;
  editedAt?: number;
}

export interface Conversation {
  id: string;
  title: string;
  isGroup: boolean;
  participantIds: string[];
  avatarUrl?: string;
  avatarColor: string;
  initials: string;
  phone?: string;
  transport: TransportType;
  theme: ConversationTheme;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  unreadBy: Record<string, number>;
  lastMessageAt: number;
  encryptionCode: string;
}

export interface MessagingStore {
  users: UserProfile[];
  conversations: Conversation[];
  messages: Message[];
}

export type FilterTab = 'all' | 'unread' | 'starred' | 'archived';

export type WsClientEvent =
  | { type: 'client:identify'; userId: string }
  | { type: 'typing:set'; conversationId: string; userId: string; isTyping: boolean }
  | { type: 'conversation:read'; conversationId: string; userId: string };

export type WsServerEvent =
  | { type: 'state:sync'; store: MessagingStore; onlineUserIds: string[] }
  | { type: 'message:created'; message: Message; conversation: Conversation }
  | { type: 'message:updated'; message: Message }
  | { type: 'message:deleted'; messageId: string; conversationId: string }
  | { type: 'conversation:created'; conversation: Conversation; initialMessages?: Message[] }
  | { type: 'conversation:updated'; conversation: Conversation }
  | { type: 'conversation:deleted'; conversationId: string }
  | { type: 'typing:update'; conversationId: string; userId: string; isTyping: boolean }
  | { type: 'presence:update'; onlineUserIds: string[] };
