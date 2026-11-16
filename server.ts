import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  Conversation,
  ConversationTheme,
  Message,
  MessageAttachment,
  MessagingStore,
  TransportType,
  UserProfile,
  WsClientEvent,
  WsServerEvent,
} from './src/types/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'messages-store.json');
const PORT = Number(process.env.PORT || 3000);

function createSeedStore(): MessagingStore {
  const now = Date.now();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  const users: UserProfile[] = [
    {
      id: 'user-self',
      name: 'Alex Rivera',
      phone: '+1 (415) 555-0140',
      email: 'alex.rivera@example.com',
      avatarColor: '#0B57D0',
      initials: 'AR',
    },
    {
      id: 'user-maya',
      name: 'Maya Lin',
      phone: '+1 (415) 555-0192',
      email: 'maya.lin@example.com',
      avatarUrl: '/src/assets/images/avatar_maya_lin_1794841052246.jpg',
      avatarColor: '#146C2E',
      initials: 'ML',
    },
    {
      id: 'user-marcus',
      name: 'Marcus Vance',
      phone: '+1 (650) 555-0138',
      email: 'marcus.vance@example.com',
      avatarUrl: '/src/assets/images/avatar_marcus_vance_1794841053082.jpg',
      avatarColor: '#006A6A',
      initials: 'MV',
    },
    {
      id: 'user-elena',
      name: 'Elena Rostova',
      phone: '+1 (408) 555-0174',
      email: 'elena.rostova@example.com',
      avatarUrl: '/src/assets/images/avatar_elena_rostova_1794841052936.jpg',
      avatarColor: '#6750A4',
      initials: 'ER',
    },
    {
      id: 'user-devon',
      name: 'Devon Brooks',
      phone: '+1 (510) 555-0165',
      email: 'devon.brooks@example.com',
      avatarUrl: '/src/assets/images/avatar_devon_brooks_1794841053384.jpg',
      avatarColor: '#B3261E',
      initials: 'DB',
    },
    {
      id: 'user-priya',
      name: 'Priya Nair',
      phone: '+1 (415) 555-0183',
      email: 'priya.nair@example.com',
      avatarColor: '#7C4DFF',
      initials: 'PN',
    },
    {
      id: 'user-parcel',
      name: 'Metro Courier',
      phone: '44281',
      avatarColor: '#455A64',
      initials: 'MC',
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv-maya',
      title: 'Maya Lin',
      isGroup: false,
      participantIds: ['user-self', 'user-maya'],
      avatarUrl: '/src/assets/images/avatar_maya_lin_1794841052246.jpg',
      avatarColor: '#146C2E',
      initials: 'ML',
      phone: '+1 (415) 555-0192',
      transport: 'rcs',
      theme: 'blue',
      isPinned: true,
      isMuted: false,
      isArchived: false,
      unreadBy: { 'user-self': 1 },
      lastMessageAt: now - 4 * min,
      encryptionCode: '48291 03948 77102 64590 11284 99031',
    },
    {
      id: 'conv-marcus',
      title: 'Marcus Vance',
      isGroup: false,
      participantIds: ['user-self', 'user-marcus'],
      avatarUrl: '/src/assets/images/avatar_marcus_vance_1794841053082.jpg',
      avatarColor: '#006A6A',
      initials: 'MV',
      phone: '+1 (650) 555-0138',
      transport: 'rcs',
      theme: 'teal',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadBy: {},
      lastMessageAt: now - 38 * min,
      encryptionCode: '91042 55201 38492 10294 66712 40928',
    },
    {
      id: 'conv-hike',
      title: 'Marin Ridge Trail Crew',
      isGroup: true,
      participantIds: ['user-self', 'user-maya', 'user-devon', 'user-elena'],
      avatarColor: '#146C2E',
      initials: 'MR',
      transport: 'rcs',
      theme: 'emerald',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadBy: { 'user-self': 2 },
      lastMessageAt: now - 2 * hour,
      encryptionCode: '77410 88219 30491 55820 19283 44102',
    },
    {
      id: 'conv-elena',
      title: 'Elena Rostova',
      isGroup: false,
      participantIds: ['user-self', 'user-elena'],
      avatarUrl: '/src/assets/images/avatar_elena_rostova_1794841052936.jpg',
      avatarColor: '#6750A4',
      initials: 'ER',
      phone: '+1 (408) 555-0174',
      transport: 'rcs',
      theme: 'plum',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadBy: {},
      lastMessageAt: now - 5 * hour,
      encryptionCode: '33019 48201 99124 77412 60192 88210',
    },
    {
      id: 'conv-devon',
      title: 'Devon Brooks',
      isGroup: false,
      participantIds: ['user-self', 'user-devon'],
      avatarUrl: '/src/assets/images/avatar_devon_brooks_1794841053384.jpg',
      avatarColor: '#B3261E',
      initials: 'DB',
      phone: '+1 (510) 555-0165',
      transport: 'sms',
      theme: 'coral',
      isPinned: false,
      isMuted: true,
      isArchived: false,
      unreadBy: {},
      lastMessageAt: now - 1 * day - 2 * hour,
      encryptionCode: '',
    },
    {
      id: 'conv-priya',
      title: 'Priya Nair',
      isGroup: false,
      participantIds: ['user-self', 'user-priya'],
      avatarColor: '#7C4DFF',
      initials: 'PN',
      phone: '+1 (415) 555-0183',
      transport: 'rcs',
      theme: 'blue',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadBy: {},
      lastMessageAt: now - 2 * day,
      encryptionCode: '11920 33841 72019 44120 99201 55102',
    },
    {
      id: 'conv-parcel',
      title: 'Metro Courier',
      isGroup: false,
      participantIds: ['user-self', 'user-parcel'],
      avatarColor: '#455A64',
      initials: 'MC',
      phone: '44281',
      transport: 'sms',
      theme: 'blue',
      isPinned: false,
      isMuted: false,
      isArchived: true,
      unreadBy: {},
      lastMessageAt: now - 4 * day,
      encryptionCode: '',
    },
  ];

  const messages: Message[] = [
    // Maya Lin thread
    {
      id: 'msg-m1',
      conversationId: 'conv-maya',
      senderId: 'user-maya',
      senderName: 'Maya Lin',
      text: 'Hey! Did you get a chance to review the studio layout notes?',
      timestamp: now - 1 * day - 4 * hour,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-m2',
      conversationId: 'conv-maya',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'Yes, just finished reading through them. Love how clean the south window section looks.',
      timestamp: now - 1 * day - 3 * hour - 45 * min,
      status: 'read',
      transport: 'rcs',
      reactions: { '❤️': ['user-maya'] },
    },
    {
      id: 'msg-m3',
      conversationId: 'conv-maya',
      senderId: 'user-maya',
      senderName: 'Maya Lin',
      text: 'I grabbed coffee by Ferry Building if you want to walk over before the 2 PM walkthrough.',
      timestamp: now - 14 * min,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-m4',
      conversationId: 'conv-maya',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'On my way down now! Save me an oat cortado.',
      timestamp: now - 9 * min,
      status: 'read',
      transport: 'rcs',
      reactions: { '👍': ['user-maya'] },
    },
    {
      id: 'msg-m5',
      conversationId: 'conv-maya',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'Actually heading out the elevator in 2 mins.',
      timestamp: now - 8 * min,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-m6',
      conversationId: 'conv-maya',
      senderId: 'user-maya',
      senderName: 'Maya Lin',
      text: 'Got it right here! Sitting at the outdoor wooden table near the Embarcadero entrance.',
      timestamp: now - 4 * min,
      status: 'delivered',
      transport: 'rcs',
      reactions: {},
      isStarred: true,
    },

    // Marcus Vance thread
    {
      id: 'msg-mv1',
      conversationId: 'conv-marcus',
      senderId: 'user-marcus',
      senderName: 'Marcus Vance',
      text: 'Dropped the camera lenses off at the rental house.',
      timestamp: now - 52 * min,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-mv2',
      conversationId: 'conv-marcus',
      senderId: 'user-marcus',
      senderName: 'Marcus Vance',
      text: 'They confirmed the 35mm prime is reserved for Friday morning too.',
      timestamp: now - 51 * min,
      status: 'read',
      transport: 'rcs',
      reactions: { '🔥': ['user-self'] },
    },
    {
      id: 'msg-mv3',
      conversationId: 'conv-marcus',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'Awesome, that saves us an extra trip on Thursday afternoon. Let me know what the deposit total came out to.',
      timestamp: now - 38 * min,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },

    // Group thread
    {
      id: 'msg-g1',
      conversationId: 'conv-hike',
      senderId: 'user-devon',
      senderName: 'Devon Brooks',
      text: 'Weather forecast for Saturday looks crisp—62°F and clear skies along Dipsea Trail.',
      timestamp: now - 3 * hour,
      status: 'read',
      transport: 'rcs',
      reactions: { '🙌': ['user-maya', 'user-elena'] },
    },
    {
      id: 'msg-g2',
      conversationId: 'conv-hike',
      senderId: 'user-elena',
      senderName: 'Elena Rostova',
      text: 'Should we meet at Stinson Beach parking at 8:15 AM sharp?',
      timestamp: now - 2 * hour - 12 * min,
      status: 'delivered',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-g3',
      conversationId: 'conv-hike',
      senderId: 'user-maya',
      senderName: 'Maya Lin',
      text: 'Works for me! I am bringing extra water and trail snacks for everyone.',
      timestamp: now - 2 * hour,
      status: 'delivered',
      transport: 'rcs',
      reactions: {},
    },

    // Elena thread
    {
      id: 'msg-e1',
      conversationId: 'conv-elena',
      senderId: 'user-elena',
      senderName: 'Elena Rostova',
      text: 'Sent over the revised architecture PDF to your inbox. Let me know if page 4 matches what we discussed.',
      timestamp: now - 5 * hour - 15 * min,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-e2',
      conversationId: 'conv-elena',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'Checking it now—will send comments before 5 PM.',
      timestamp: now - 5 * hour,
      status: 'read',
      transport: 'rcs',
      reactions: { '👍': ['user-elena'] },
    },

    // Devon SMS thread
    {
      id: 'msg-d1',
      conversationId: 'conv-devon',
      senderId: 'user-devon',
      senderName: 'Devon Brooks',
      text: 'My signal is spotty out by Half Moon Bay, switching to SMS. Call me when you get back into town.',
      timestamp: now - 1 * day - 2 * hour,
      status: 'read',
      transport: 'sms',
      reactions: {},
    },

    // Priya thread
    {
      id: 'msg-p1',
      conversationId: 'conv-priya',
      senderId: 'user-self',
      senderName: 'Alex Rivera',
      text: 'Thanks again for introducing us to the acoustic consultant!',
      timestamp: now - 2 * day - 1 * hour,
      status: 'read',
      transport: 'rcs',
      reactions: {},
    },
    {
      id: 'msg-p2',
      conversationId: 'conv-priya',
      senderId: 'user-priya',
      senderName: 'Priya Nair',
      text: 'Anytime! Happy to connect you two.',
      timestamp: now - 2 * day,
      status: 'read',
      transport: 'rcs',
      reactions: { '😊': ['user-self'] },
    },

    // Archived parcel thread
    {
      id: 'msg-pc1',
      conversationId: 'conv-parcel',
      senderId: 'user-parcel',
      senderName: 'Metro Courier',
      text: 'Your package #MC-89421 was delivered to your front porch at 2:14 PM.',
      timestamp: now - 4 * day,
      status: 'read',
      transport: 'sms',
      reactions: {},
    },
  ];

  return { users, conversations, messages };
}

function loadStore(): MessagingStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const seed = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as MessagingStore;
    if (!parsed.users || !parsed.conversations || !parsed.messages) {
      throw new Error('Corrupt store');
    }
    return parsed;
  } catch {
    const seed = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

let store: MessagingStore = loadStore();

function persistStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

const app = express();
app.use(express.json({ limit: '15mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface ClientMeta {
  ws: WebSocket;
  userId: string;
}

const clients = new Set<ClientMeta>();

function getOnlineUserIds(): string[] {
  const ids = new Set<string>();
  for (const c of clients) {
    if (c.ws.readyState === WebSocket.OPEN && c.userId) {
      ids.add(c.userId);
    }
  }
  return Array.from(ids);
}

function broadcast(event: WsServerEvent) {
  const payload = JSON.stringify(event);
  for (const c of clients) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(payload);
    }
  }
}

function broadcastPresence() {
  broadcast({ type: 'presence:update', onlineUserIds: getOnlineUserIds() });
}

wss.on('connection', (ws) => {
  const meta: ClientMeta = { ws, userId: 'user-self' };
  clients.add(meta);

  ws.send(
    JSON.stringify({
      type: 'state:sync',
      store,
      onlineUserIds: getOnlineUserIds(),
    } satisfies WsServerEvent),
  );
  broadcastPresence();

  ws.on('message', (data) => {
    try {
      const event = JSON.parse(data.toString()) as WsClientEvent;
      if (event.type === 'client:identify') {
        meta.userId = event.userId;
        broadcastPresence();
      } else if (event.type === 'typing:set') {
        broadcast({
          type: 'typing:update',
          conversationId: event.conversationId,
          userId: event.userId,
          isTyping: event.isTyping,
        });
      } else if (event.type === 'conversation:read') {
        markConversationRead(event.conversationId, event.userId);
      }
    } catch {
      // Ignore malformed websocket payload
    }
  });

  ws.on('close', () => {
    clients.delete(meta);
    broadcastPresence();
  });
});

function markConversationRead(conversationId: string, userId: string) {
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) return;

  let changedConv = false;
  if ((conv.unreadBy[userId] || 0) > 0) {
    conv.unreadBy[userId] = 0;
    changedConv = true;
  }

  const updatedMessages: Message[] = [];
  for (const msg of store.messages) {
    if (
      msg.conversationId === conversationId &&
      msg.senderId !== userId &&
      msg.status !== 'read' &&
      msg.status !== 'scheduled'
    ) {
      msg.status = 'read';
      updatedMessages.push(msg);
    }
  }

  if (changedConv || updatedMessages.length > 0) {
    persistStore();
    if (changedConv) {
      broadcast({ type: 'conversation:updated', conversation: conv });
    }
    for (const m of updatedMessages) {
      broadcast({ type: 'message:updated', message: m });
    }
  }
}

// Scheduled messages ticker (real server-side scheduler)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const msg of store.messages) {
    if (msg.status === 'scheduled' && msg.scheduledFor && msg.scheduledFor <= now) {
      msg.status = 'delivered';
      msg.timestamp = now;
      delete msg.scheduledFor;
      const conv = store.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessageAt = now;
        for (const pid of conv.participantIds) {
          if (pid !== msg.senderId) {
            conv.unreadBy[pid] = (conv.unreadBy[pid] || 0) + 1;
          }
        }
        broadcast({ type: 'message:updated', message: msg });
        broadcast({ type: 'conversation:updated', conversation: conv });
      }
      changed = true;
    }
  }
  if (changed) {
    persistStore();
  }
}, 3000);

// REST API Routes
app.get('/api/state', (_req, res) => {
  res.json({ store, onlineUserIds: getOnlineUserIds() });
});

app.post('/api/messages', (req, res) => {
  const {
    id,
    conversationId,
    senderId,
    text = '',
    attachments,
    replyToId,
    scheduledFor,
  } = req.body as {
    id?: string;
    conversationId: string;
    senderId: string;
    text?: string;
    attachments?: MessageAttachment[];
    replyToId?: string;
    scheduledFor?: number;
  };

  const conv = store.conversations.find((c) => c.id === conversationId);
  const sender = store.users.find((u) => u.id === senderId);
  if (!conv || !sender) {
    res.status(404).json({ error: 'Conversation or sender not found' });
    return;
  }

  if (!text.trim() && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'Message must have text or attachments' });
    return;
  }

  const now = Date.now();
  const isScheduled = Boolean(scheduledFor && scheduledFor > now);
  const newMessage: Message = {
    id: id || `msg-${now}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    senderId,
    senderName: sender.name,
    text: text.trim(),
    timestamp: isScheduled ? scheduledFor! : now,
    status: isScheduled ? 'scheduled' : 'delivered',
    transport: conv.transport,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
    reactions: {},
    replyToId,
    scheduledFor: isScheduled ? scheduledFor : undefined,
  };

  store.messages.push(newMessage);

  if (!isScheduled) {
    conv.lastMessageAt = now;
    if (conv.isArchived) {
      conv.isArchived = false;
    }
    for (const pid of conv.participantIds) {
      if (pid !== senderId) {
        conv.unreadBy[pid] = (conv.unreadBy[pid] || 0) + 1;
      }
    }
  }

  persistStore();
  broadcast({ type: 'message:created', message: newMessage, conversation: conv });
  res.status(201).json({ message: newMessage, conversation: conv });
});

app.patch('/api/messages/:id/react', (req, res) => {
  const { id } = req.params;
  const { emoji, userId } = req.body as { emoji: string; userId: string };
  const msg = store.messages.find((m) => m.id === id);
  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  const currentUsers = msg.reactions[emoji] || [];
  if (currentUsers.includes(userId)) {
    const filtered = currentUsers.filter((u) => u !== userId);
    if (filtered.length === 0) {
      delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji] = filtered;
    }
  } else {
    msg.reactions[emoji] = [...currentUsers, userId];
  }

  persistStore();
  broadcast({ type: 'message:updated', message: msg });
  res.json({ message: msg });
});

app.patch('/api/messages/:id/star', (req, res) => {
  const { id } = req.params;
  const msg = store.messages.find((m) => m.id === id);
  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  msg.isStarred = !msg.isStarred;
  persistStore();
  broadcast({ type: 'message:updated', message: msg });
  res.json({ message: msg });
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  const [removed] = store.messages.splice(idx, 1);
  persistStore();
  broadcast({
    type: 'message:deleted',
    messageId: removed.id,
    conversationId: removed.conversationId,
  });
  res.json({ deletedId: removed.id });
});

app.post('/api/conversations', (req, res) => {
  const {
    title,
    phone,
    participantIds,
    creatorId = 'user-self',
    transport = 'rcs',
    theme = 'blue',
  } = req.body as {
    title: string;
    phone?: string;
    participantIds?: string[];
    creatorId?: string;
    transport?: TransportType;
    theme?: ConversationTheme;
  };

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Conversation title is required' });
    return;
  }

  const cleanTitle = title.trim();
  const cleanPhone = phone?.trim() || `+1 (415) 555-${Math.floor(1000 + Math.random() * 9000)}`;

  let resolvedParticipants = participantIds ? [...participantIds] : [];
  if (!resolvedParticipants.includes(creatorId)) {
    resolvedParticipants.unshift(creatorId);
  }

  // If 1:1 new contact that doesn't exist yet in users, create a UserProfile
  if (resolvedParticipants.length === 1) {
    const existingByPhone = store.users.find(
      (u) => u.phone === cleanPhone || u.name.toLowerCase() === cleanTitle.toLowerCase(),
    );
    if (existingByPhone) {
      resolvedParticipants.push(existingByPhone.id);
    } else {
      const initials = cleanTitle
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('');
      const palette = ['#0B57D0', '#146C2E', '#6750A4', '#006A6A', '#B3261E', '#7C4DFF'];
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: cleanTitle,
        phone: cleanPhone,
        avatarColor: palette[store.users.length % palette.length],
        initials: initials || 'C',
      };
      store.users.push(newUser);
      resolvedParticipants.push(newUser.id);
    }
  }

  const isGroup = resolvedParticipants.length > 2;

  // Check if existing 1:1 conversation already exists
  if (!isGroup && resolvedParticipants.length === 2) {
    const existingConv = store.conversations.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        resolvedParticipants.every((id) => c.participantIds.includes(id)),
    );
    if (existingConv) {
      if (existingConv.isArchived) {
        existingConv.isArchived = false;
        persistStore();
        broadcast({ type: 'conversation:updated', conversation: existingConv });
      }
      res.json({ conversation: existingConv, existing: true });
      return;
    }
  }

  const otherUsers = store.users.filter((u) => u.id !== creatorId && resolvedParticipants.includes(u.id));
  const primaryOther = otherUsers[0];
  const initials = (isGroup ? cleanTitle : primaryOther?.name || cleanTitle)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const codeBlock = () => String(Math.floor(10000 + Math.random() * 89999));
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    title: isGroup ? cleanTitle : primaryOther?.name || cleanTitle,
    isGroup,
    participantIds: resolvedParticipants,
    avatarUrl: isGroup ? undefined : primaryOther?.avatarUrl,
    avatarColor: primaryOther?.avatarColor || '#0B57D0',
    initials: initials || 'CH',
    phone: isGroup ? undefined : primaryOther?.phone || cleanPhone,
    transport,
    theme,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadBy: {},
    lastMessageAt: Date.now(),
    encryptionCode:
      transport === 'rcs'
        ? `${codeBlock()} ${codeBlock()} ${codeBlock()} ${codeBlock()} ${codeBlock()} ${codeBlock()}`
        : '',
  };

  store.conversations.unshift(newConv);
  persistStore();
  broadcast({ type: 'conversation:created', conversation: newConv });
  res.status(201).json({ conversation: newConv });
});

app.patch('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conv = store.conversations.find((c) => c.id === id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const { isPinned, isMuted, isArchived, theme, transport, markUnreadFor } = req.body as Partial<
    Pick<Conversation, 'isPinned' | 'isMuted' | 'isArchived' | 'theme' | 'transport'>
  > & { markUnreadFor?: string };

  if (typeof isPinned === 'boolean') conv.isPinned = isPinned;
  if (typeof isMuted === 'boolean') conv.isMuted = isMuted;
  if (typeof isArchived === 'boolean') conv.isArchived = isArchived;
  if (theme) conv.theme = theme;
  if (transport) conv.transport = transport;
  if (markUnreadFor) {
    conv.unreadBy[markUnreadFor] = Math.max(1, conv.unreadBy[markUnreadFor] || 0);
  }

  persistStore();
  broadcast({ type: 'conversation:updated', conversation: conv });
  res.json({ conversation: conv });
});

app.post('/api/conversations/:id/read', (req, res) => {
  const { id } = req.params;
  const { userId = 'user-self' } = req.body as { userId?: string };
  markConversationRead(id, userId);
  const conv = store.conversations.find((c) => c.id === id);
  res.json({ conversation: conv });
});

app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.conversations.findIndex((c) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  store.conversations.splice(idx, 1);
  store.messages = store.messages.filter((m) => m.conversationId !== id);
  persistStore();
  broadcast({ type: 'conversation:deleted', conversationId: id });
  res.json({ deletedId: id });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Messages server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
