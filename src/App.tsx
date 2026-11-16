import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Copy,
  Edit3,
  ExternalLink,
  Forward,
  MessageSquare,
  MessageSquareText,
  MoreVertical,
  Phone,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import profileAvatar from './assets/images/avatar_marcus_vance_1794841053082.jpg';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  type SmsMessage,
  type SmsThread,
  type SyncChangeType,
  LS_FONT_SCALE_KEY,
  LS_LEGACY_THREADS_KEY,
  LS_THREADS_KEY,
  enqueueSyncChange,
  flushPendingSyncQueue,
  loadOfflineState,
  mergeWithHomepageThreads,
  readLocalStoragePreferences,
  savePreferencesToDb,
  saveThreadsToDb,
} from './utils/offlineDb';

const INITIAL_THREADS: SmsThread[] = [
  {
    id: 'thread-mpesa',
    recipientName: 'MPESA',
    avatarColor: '#FAD047',
    avatarType: 'initial',
    canReply: false,
    isPinned: true,
    unreadCount: 0,
    timeLabel: '00:45',
    messages: [
      {
        id: 'msg-1',
        text: 'Pay wallet Abdisalan Ahmed Mohamed\n0741363100 on 15/11/26 at 11:02 PM.\nTransaction cost, Ksh7.00.',
      },
      {
        id: 'msg-2',
        showTimestampBefore: '00:45',
        text: 'UKGMR27ZXL Confirmed. Ksh10.00 sent to HOMELINK INTERNET SOLUTIONS for account 254706244187 on 16/11/26 at 12:45 AM New M-PESA balance is Ksh6.86. Transaction cost, Ksh0.00.Amount you can transact within the day is 499,990.00. See all your balances now https://saf.cx/kWQpy',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-iandm',
    recipientName: 'IANDMBANK',
    avatarColor: '#C57AFF',
    avatarType: 'person',
    canReply: false,
    isPinned: true,
    unreadCount: 0,
    timeLabel: 'Sun',
    messages: [
      {
        id: 'msg-i1',
        showTimestampBefore: 'Sun',
        text: 'Dear Customer, we are pleased to inform you that your monthly e-statement is now available in your I&M mobile app.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-ziidi',
    recipientName: 'ZIIDI',
    avatarColor: '#F06A57',
    avatarType: 'person',
    canReply: false,
    isPinned: true,
    unreadCount: 1,
    timeLabel: 'Sun',
    messages: [
      {
        id: 'msg-z1',
        showTimestampBefore: 'Sun',
        text: 'You have successfully withdrawn Ksh. 50.00 of transaction code UKFMR256BN. Your new Ziidi balance is Ksh. 420.00.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-mkenya',
    recipientName: 'MKENYA SYS',
    avatarColor: '#FAD047',
    avatarType: 'person',
    canReply: true,
    isPinned: true,
    unreadCount: 0,
    timeLabel: 'Draft',
    isDraft: true,
    draftText: 'https://vt.tiktok.com/ZSgr8qbXt/',
    messages: [
      {
        id: 'msg-mk1',
        showTimestampBefore: 'Sat',
        text: 'System notification: your backup verification completed successfully.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-treasure',
    recipientName: 'Treasure',
    avatarColor: '#FAD047',
    avatarType: 'initial',
    canReply: true,
    isPinned: false,
    unreadCount: 19,
    timeLabel: '19:47',
    messages: [
      {
        id: 'msg-t1',
        showTimestampBefore: '19:47',
        text: 'Please call me thank you. TEXT, WIN, CHEMSHA! Dial *188# now, text with Chemsha and stand a chance to win daily rewards.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-mshwari',
    recipientName: 'MShwari',
    avatarColor: '#6EC477',
    avatarType: 'person',
    canReply: false,
    isPinned: false,
    unreadCount: 1,
    timeLabel: '17:29',
    messages: [
      {
        id: 'msg-ms1',
        showTimestampBefore: '17:29',
        text: 'Dear Customer, top up your M-Shwari savings account ahead of December expenses, earn interest and grow your limit.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-loop',
    recipientName: 'LOOP_info',
    avatarColor: '#F06A57',
    avatarType: 'person',
    canReply: false,
    isPinned: false,
    unreadCount: 13,
    timeLabel: '16:15',
    messages: [
      {
        id: 'msg-l1',
        showTimestampBefore: '16:15',
        text: "Hey Samuel, don't let low balance slow you down. Add money to your LOOP wallet and continue enjoying seamless payments.",
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-safaricom',
    recipientName: 'SAFARICOM',
    avatarColor: '#6EC477',
    avatarType: 'person',
    canReply: false,
    isPinned: false,
    unreadCount: 3,
    timeLabel: '14:04',
    messages: [
      {
        id: 'msg-sf1',
        showTimestampBefore: '14:04',
        text: 'Get 60 minutes for only 60 Bonga Points and keep talking! Dial *126*0# TODAY! You have 1,420 Bonga Points available.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-okoa',
    recipientName: 'Okoa Jahazi',
    avatarColor: '#FAD047',
    avatarType: 'person',
    canReply: false,
    isPinned: false,
    unreadCount: 39,
    timeLabel: 'Thu',
    messages: [
      {
        id: 'msg-ok1',
        showTimestampBefore: 'Thu',
        text: 'You will not be able to access Okoa Jahazi for the next 24 hours due to late repayment on your previous advance.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-20836',
    recipientName: '20836',
    avatarColor: '#F56BA2',
    avatarType: 'person',
    canReply: false,
    isPinned: false,
    unreadCount: 6,
    timeLabel: 'Thu',
    messages: [
      {
        id: 'msg-208',
        showTimestampBefore: 'Thu',
        text: "'It's been a tough year, but guess what? You made it — and better days are loading 🙏 Share a smile with someone today.",
        simLabel: '• 1: Safaricom',
      },
    ],
  },
];

const QUICK_TEMPLATES = [
  {
    label: 'Money received',
    text: 'UKGMR94P2L Confirmed.You have received Ksh500.00 from JOHN DOE 0712345678 on 16/11/26 at 09:15 AM New M-PESA balance is Ksh506.86. Dial *334# to transact.',
  },
  {
    label: 'Buy goods',
    text: 'UKGMR81K4M Confirmed. Ksh120.00 paid to NAIVAS SUPERMARKET. on 16/11/26 at 10:30 AM.New M-PESA balance is Ksh386.86. Transaction cost, Ksh0.00.',
  },
  {
    label: 'Airtime purchase',
    text: 'UKGMR72T9N Confirmed. You bought Ksh50.00 of airtime on 16/11/26 at 11:05 AM.New M-PESA balance is Ksh336.86. Transaction cost, Ksh0.00.',
  },
];

const FOCUS_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.09 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.3);
    });
  } catch {
    // Ignore audio errors
  }
}

function PersonSilhouetteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] fill-[#1C1C1C]" aria-hidden="true">
      <path d="M12 11.6a3.55 3.55 0 1 0 0-7.1 3.55 3.55 0 0 0 0 7.1zm0 2c-3.45 0-6.4 1.82-6.4 4.05 0 .64.52 1.15 1.16 1.15h10.48c.64 0 1.16-.51 1.16-1.15 0-2.23-2.95-4.05-6.4-4.05z" />
    </svg>
  );
}

function UprightPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[15px] h-[15px] stroke-[#9AA0A6] fill-none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z" />
      <path d="M12 14v6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-[#7CACF8]" aria-hidden="true">
      <path d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7L12 2Z" />
    </svg>
  );
}

function ThreadAvatar({
  thread,
  size = 'home',
}: {
  thread: SmsThread;
  size?: 'home' | 'header';
}) {
  const initial = thread.recipientName.trim().charAt(0).toUpperCase() || 'M';
  const dim = size === 'home' ? 'w-[44px] h-[44px]' : 'w-10 h-10';
  const textSz = size === 'home' ? 'text-[22px]' : 'text-[19px]';

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0 select-none overflow-hidden`}
      style={{ backgroundColor: thread.avatarColor }}
      aria-hidden="true"
    >
      {thread.avatarType === 'initial' ? (
        <span className={`font-display ${textSz} font-light text-[#1C1C1C] leading-none`}>
          {initial}
        </span>
      ) : (
        <PersonSilhouetteIcon />
      )}
    </div>
  );
}

function renderLinkedSmsText(
  text: string,
  onLinkTap: (kind: 'phone' | 'url' | 'date', value: string) => void,
) {
  const pattern =
    /(https?:\/\/[^\s]+|\b\d{2}\/\d{2}\/\d{2}(?:\s+at\s+\d{1,2}:\d{2}\s?(?:AM|PM))?|\b\d{10,12}\b)/gi;

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(pattern);
    return (
      <span key={lineIdx}>
        {parts.map((part, idx) => {
          if (!part) return null;
          if (/^https?:\/\//i.test(part)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLinkTap('url', part);
                }}
                className="underline decoration-[#E8EAED]/85 underline-offset-2 break-all hover:text-white"
              >
                {part}
              </a>
            );
          }
          if (/^\d{10,12}$/.test(part)) {
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkTap('phone', part);
                }}
                className="inline underline decoration-[#E8EAED]/85 underline-offset-2 hover:text-white cursor-pointer"
              >
                {part}
              </button>
            );
          }
          if (/^\d{2}\/\d{2}\/\d{2}/i.test(part)) {
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkTap('date', part);
                }}
                className="inline underline decoration-[#E8EAED]/85 underline-offset-2 hover:text-white cursor-pointer text-left"
              >
                {part}
              </button>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(() =>
    readLocalStoragePreferences().lastSyncedAt,
  );
  const [userAvatar, setUserAvatar] = useState<string | undefined>(() =>
    readLocalStoragePreferences().userAvatar,
  );

  const [threads, setThreads] = useState<SmsThread[]>(() => {
    try {
      const saved =
        localStorage.getItem(LS_THREADS_KEY) ||
        localStorage.getItem(LS_LEGACY_THREADS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SmsThread[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeWithHomepageThreads(parsed, INITIAL_THREADS);
        }
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('thread-mpesa');
  const [pageView, setPageView] = useState<'home' | 'conversation'>('home');
  const [homeSearchOpen, setHomeSearchOpen] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [sparkleSheetOpen, setSparkleSheetOpen] = useState(false);

  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(LS_FONT_SCALE_KEY));
      if (!Number.isNaN(saved) && saved >= 0.8 && saved <= 1.9) return saved;
    } catch {
      // Ignore
    }
    return 1;
  });
  const [showZoomBadge, setShowZoomBadge] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [replyDraft, setReplyDraft] = useState('');

  // Long-press focus & blur state
  const [longPressEnabled, setLongPressEnabled] = useState<boolean>(
    () => readLocalStoragePreferences().longPressEnabled,
  );
  const [focusedMsgId, setFocusedMsgId] = useState<string | null>(null);

  const [entitySheet, setEntitySheet] = useState<{
    kind: 'phone' | 'url' | 'date';
    value: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Persistent notification popup state (stays until swiped away)
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    threadId: string;
    senderName: string;
    avatarColor: string;
    avatarType: 'initial' | 'person';
    text: string;
    code?: string;
  } | null>(null);
  const [notifDrag, setNotifDrag] = useState<{ x: number; y: number; dragging: boolean }>({
    x: 0,
    y: 0,
    dragging: false,
  });

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const zoomBadgeTimerRef = useRef<number | null>(null);
  const readReceiptTimersRef = useRef<number[]>([]);
  const hasHydratedDbRef = useRef(false);

  // Long-press refs
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Two-finger pinch-to-zoom refs
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const fontScaleRef = useRef<number>(fontScale);
  fontScaleRef.current = fontScale;

  // Notification swipe refs
  const notifSwipeRef = useRef<{ startX: number; startY: number } | null>(null);

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || INITIAL_THREADS[0];

  const scheduleReadReceiptProgression = (threadId: string, messageId: string) => {
    const deliveredTimer = window.setTimeout(() => {
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId && m.status === 'sent'
                    ? { ...m, status: 'delivered' as const }
                    : m,
                ),
              }
            : t,
        );
        saveThreadsToDb(next).catch(() => {});
        return next;
      });
    }, 700);

    const readTimer = window.setTimeout(() => {
      const readAt = Date.now();
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId && m.status !== 'read'
                    ? { ...m, status: 'read' as const, readAt }
                    : m,
                ),
              }
            : t,
        );
        saveThreadsToDb(next).catch(() => {});
        return next;
      });
      queueMutation(
        'message:read',
        { messageId, status: 'read', readAt },
        threadId,
      );
    }, 1800);

    readReceiptTimersRef.current.push(deliveredTimer, readTimer);
  };

  // Hydrate locally stored messages, contacts, preferences & pending sync queue from IndexedDB
  useEffect(() => {
    let active = true;
    loadOfflineState(INITIAL_THREADS).then((state) => {
      if (!active) return;
      if (state.threads.length > 0) {
        setThreads(state.threads);
        state.threads.forEach((t) => {
          t.messages.forEach((m) => {
            if (m.direction === 'outgoing' && m.status && m.status !== 'read') {
              scheduleReadReceiptProgression(t.id, m.id);
            }
          });
        });
      }
      setFontScale(state.preferences.fontScale);
      setLongPressEnabled(state.preferences.longPressEnabled);
      setLastSyncedAt(state.preferences.lastSyncedAt);
      if (state.preferences.userAvatar) {
        setUserAvatar(state.preferences.userAvatar);
      }
      setPendingSyncCount(state.pendingCount);
      hasHydratedDbRef.current = true;
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist threads & contacts to IndexedDB + localStorage mirror
  useEffect(() => {
    if (!hasHydratedDbRef.current) return;
    saveThreadsToDb(threads).catch(() => {});
  }, [threads]);

  // Persist user preferences to IndexedDB + localStorage mirror
  useEffect(() => {
    if (!hasHydratedDbRef.current) return;
    savePreferencesToDb({ fontScale, longPressEnabled, userAvatar: userAvatar || '' }).catch(() => {});
  }, [fontScale, longPressEnabled, userAvatar]);

  const runSyncFlush = async (announce = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const result = await flushPendingSyncQueue();
      setPendingSyncCount(result.remainingCount);
      if (result.syncedAt) {
        setLastSyncedAt(result.syncedAt);
      }
      if (announce && result.syncedCount > 0) {
        showToast(
          `Synced ${result.syncedCount} offline change${result.syncedCount === 1 ? '' : 's'}`,
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatically synchronise pending changes when internet connectivity returns
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      runSyncFlush(true).catch(() => {});
    }
  }, [isOnline]);

  const queueMutation = (
    type: SyncChangeType,
    payload: Record<string, unknown>,
    threadId?: string,
  ) => {
    enqueueSyncChange(type, payload, threadId)
      .then((count) => {
        setPendingSyncCount(count);
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          runSyncFlush(false).catch(() => {});
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setComposerOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setFocusedMsgId(null);
        setHomeSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (zoomBadgeTimerRef.current) window.clearTimeout(zoomBadgeTimerRef.current);
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      readReceiptTimersRef.current.forEach((id) => window.clearTimeout(id));
      readReceiptTimersRef.current = [];
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  };

  const revealZoomBadge = () => {
    setShowZoomBadge(true);
    if (zoomBadgeTimerRef.current) window.clearTimeout(zoomBadgeTimerRef.current);
    zoomBadgeTimerRef.current = window.setTimeout(() => setShowZoomBadge(false), 1100);
  };

  const handleCopyText = (text: string, label = 'Copied to clipboard') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast(label);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setUserAvatar(dataUrl);
        savePreferencesToDb({ userAvatar: dataUrl }).catch(() => {});
        showToast('Profile photo updated');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openThread = (thread: SmsThread) => {
    setActiveThreadId(thread.id);
    setReplyDraft(thread.isDraft && thread.draftText ? thread.draftText : '');
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t)),
    );
    setFocusedMsgId(null);
    setPageView('conversation');
  };

  const triggerIncomingNotification = (thread: SmsThread, msg: SmsMessage) => {
    const codeMatch = msg.text.match(/\b([A-Z0-9]{10})\b/);
    setNotifDrag({ x: 0, y: 0, dragging: false });
    setActiveNotification({
      id: msg.id,
      threadId: thread.id,
      senderName: thread.recipientName,
      avatarColor: thread.avatarColor,
      avatarType: thread.avatarType,
      text: msg.text,
      code: codeMatch?.[1],
    });

    playNotificationChime();

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          new Notification(thread.recipientName, { body: msg.text });
        } catch {
          // Ignore
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then((perm) => {
            if (perm === 'granted') {
              try {
                new Notification(thread.recipientName, { body: msg.text });
              } catch {
                // Ignore
              }
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleReceiveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draftText.trim();
    if (!clean) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const newMsg: SmsMessage = {
      id: `msg-${Date.now()}`,
      showTimestampBefore: timeStr,
      text: clean,
      simLabel: '• 1: Safaricom',
    };

    const updatedThread: SmsThread = {
      ...activeThread,
      timeLabel: timeStr,
      unreadCount: pageView === 'home' ? activeThread.unreadCount + 1 : 0,
      messages: [...activeThread.messages, newMsg],
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? updatedThread : t)),
    );
    queueMutation(
      'message:received',
      { messageId: newMsg.id, text: clean, timeStr },
      activeThread.id,
    );
    setDraftText('');
    setComposerOpen(false);
    triggerIncomingNotification(updatedThread, newMsg);
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = replyDraft.trim();
    if (!clean) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const newMsg: SmsMessage = {
      id: `msg-${Date.now()}`,
      direction: 'outgoing',
      status: 'sent',
      showTimestampBefore: timeStr,
      text: clean,
      simLabel: '• 1: Safaricom',
    };
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              timeLabel: timeStr,
              isDraft: false,
              draftText: undefined,
              messages: [...t.messages, newMsg],
            }
          : t,
      );
      saveThreadsToDb(next).catch(() => {});
      return next;
    });
    queueMutation(
      'message:sent',
      { messageId: newMsg.id, text: clean, timeStr, status: 'sent' },
      activeThread.id,
    );
    scheduleReadReceiptProgression(activeThread.id, newMsg.id);
    setReplyDraft('');
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = renameDraft.trim();
    if (!nextName) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id ? { ...t, recipientName: nextName } : t,
      ),
    );
    queueMutation('thread:renamed', { recipientName: nextName }, activeThread.id);
    setRenameOpen(false);
    showToast(`Renamed to ${nextName}`);
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChatName.trim();
    if (!clean) return;
    const colors = ['#FAD047', '#C57AFF', '#F06A57', '#6EC477', '#F56BA2'];
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const hasCustomFirstMessage = Boolean(newChatMessage.trim());
    const initialMsg =
      newChatMessage.trim() ||
      `Conversation started with ${clean}.`;
    const firstMsgId = `msg-${Date.now()}`;
    const newThread: SmsThread = {
      id: `thread-${Date.now()}`,
      recipientName: clean,
      avatarColor: colors[threads.length % colors.length],
      avatarType: 'initial',
      canReply: true,
      isPinned: false,
      unreadCount: 0,
      timeLabel: nowTime,
      messages: [
        {
          id: firstMsgId,
          direction: hasCustomFirstMessage ? 'outgoing' : 'incoming',
          status: hasCustomFirstMessage ? 'sent' : undefined,
          showTimestampBefore: nowTime,
          text: initialMsg,
          simLabel: '• 1: Safaricom',
        },
      ],
    };
    setThreads((prev) => {
      const next = [newThread, ...prev];
      saveThreadsToDb(next).catch(() => {});
      return next;
    });
    queueMutation(
      'thread:created',
      { recipientName: clean, initialMsg },
      newThread.id,
    );
    if (hasCustomFirstMessage) {
      scheduleReadReceiptProgression(newThread.id, firstMsgId);
    }
    setActiveThreadId(newThread.id);
    setNewChatName('');
    setNewChatMessage('');
    setNewChatOpen(false);
    setPageView('conversation');
  };

  const handleDeleteMessage = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        const remaining = t.messages.filter((m) => m.id !== id);
        return {
          ...t,
          messages:
            remaining.length > 0
              ? remaining
              : INITIAL_THREADS.find((it) => it.id === t.id)?.messages || t.messages,
        };
      }),
    );
    queueMutation('message:deleted', { messageId: id }, activeThread.id);
    setFocusedMsgId(null);
    showToast('Message deleted');
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        return {
          ...t,
          messages: t.messages.map((m) =>
            m.id === msgId
              ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
              : m,
          ),
        };
      }),
    );
    queueMutation('message:reacted', { msgId, emoji }, activeThread.id);
    setFocusedMsgId(null);
  };

  const handleResetConversation = () => {
    setThreads(INITIAL_THREADS);
    setActiveThreadId('thread-mpesa');
    setFocusedMsgId(null);
    setMenuOpen(false);
    setProfileSheetOpen(false);
    setFontScale(1);
    queueMutation('threads:reset', {});
    showToast('Conversations restored');
  };

  // Long-press handlers
  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  const handleBubblePointerDown = (msgId: string, e: React.PointerEvent) => {
    if (!longPressEnabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    cancelLongPress();
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      setFocusedMsgId(msgId);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(18);
        } catch {
          // Ignore
        }
      }
      longPressTimerRef.current = null;
    }, 420);
  };

  const handleBubblePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || !longPressTimerRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      cancelLongPress();
    }
  };

  // Two-finger pinch-to-zoom handlers
  const handleMessagesTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      cancelLongPress();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { startDist: dist || 1, startScale: fontScaleRef.current };
    }
  };

  const handleMessagesTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinchRef.current.startDist;
      const next = Math.min(1.85, Math.max(0.8, pinchRef.current.startScale * ratio));
      setFontScale(Number(next.toFixed(2)));
      revealZoomBadge();
    }
  };

  const handleMessagesTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  const handleMessagesWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.004;
      setFontScale((prev) => {
        const next = Math.min(1.85, Math.max(0.8, prev + delta));
        return Number(next.toFixed(2));
      });
      revealZoomBadge();
    }
  };

  // Swipe-to-dismiss handlers for notification popup
  const handleNotifPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    notifSwipeRef.current = { startX: e.clientX, startY: e.clientY };
    setNotifDrag({ x: 0, y: 0, dragging: true });
  };

  const handleNotifPointerMove = (e: React.PointerEvent) => {
    if (!notifSwipeRef.current) return;
    const dx = e.clientX - notifSwipeRef.current.startX;
    const dy = Math.min(20, e.clientY - notifSwipeRef.current.startY);
    setNotifDrag({ x: dx, y: dy, dragging: true });
  };

  const handleNotifPointerUp = () => {
    if (!notifSwipeRef.current) return;
    const swipedHorizontally = Math.abs(notifDrag.x) > 85;
    const swipedUp = notifDrag.y < -45;
    notifSwipeRef.current = null;

    if (swipedHorizontally || swipedUp) {
      setActiveNotification(null);
      setNotifDrag({ x: 0, y: 0, dragging: false });
    } else {
      setNotifDrag({ x: 0, y: 0, dragging: false });
    }
  };

  const lastMessageId = activeThread.messages[activeThread.messages.length - 1]?.id;
  const computedFontPx = Math.round(15 * fontScale);
  const isBlurActive = focusedMsgId !== null;

  const filteredHomeThreads = threads.filter((t) => {
    if (!homeSearch.trim()) return true;
    const q = homeSearch.toLowerCase();
    return (
      t.recipientName.toLowerCase().includes(q) ||
      t.draftText?.toLowerCase().includes(q) ||
      t.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="min-h-dvh w-full bg-[#121212] flex justify-center"
      onClick={() => {
        setMenuOpen(false);
        setFocusedMsgId(null);
      }}
    >
      {/* Mobile Android Viewport Shell (No status bar, no bottom Android navigation bar) */}
      <div className="w-full max-w-[460px] h-dvh bg-[#202020] text-[#E8EAED] flex flex-col overflow-hidden relative">
        {pageView === 'home' ? (
          /* ================= GOOGLE MESSAGES HOMEPAGE ================= */
          <div className="flex flex-col h-full bg-[#202020] relative">
            {/* Top Navigation (#202020) */}
            <header className="px-4 pt-2.5 pb-3 bg-[#202020] shrink-0">
              {homeSearchOpen ? (
                <div className="h-11 rounded-full bg-[#2D2E30] px-3.5 flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => {
                      setHomeSearchOpen(false);
                      setHomeSearch('');
                    }}
                    className="p-1.5 -ml-1 rounded-full text-[#E8EAED] hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    autoFocus
                    value={homeSearch}
                    onChange={(e) => setHomeSearch(e.target.value)}
                    placeholder="Search conversations"
                    className="flex-1 bg-transparent text-[15px] text-[#E8EAED] placeholder-[#9AA0A6] focus:outline-none"
                  />
                  {homeSearch && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setHomeSearch('')}
                      className="p-1.5 rounded-full text-[#9AA0A6] hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-11 flex items-center justify-between gap-3">
                  <h1 className="font-display text-[22px] leading-none tracking-[-0.015em] text-[#E8EAED] whitespace-nowrap">
                    <span className="font-medium text-[#F1F3F4]">Google</span>
                    <span className="font-normal text-[#E3E3E3]">Messages</span>
                  </h1>

                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      type="button"
                      aria-label="Search conversations"
                      onClick={() => setHomeSearchOpen(true)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#E8EAED] hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
                    >
                      <Search className="w-[22px] h-[22px] stroke-[2]" />
                    </button>

                    <button
                      type="button"
                      aria-label="Account profile"
                      onClick={() => setProfileSheetOpen(true)}
                      className="w-[34px] h-[34px] rounded-full overflow-hidden ring-1 ring-white/15 cursor-pointer shrink-0"
                    >
                      <img
                        src={userAvatar || profileAvatar}
                        alt="User profile avatar"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                </div>
              )}
            </header>

            {/* Non-intrusive Connectivity & Sync Indicator */}
            <OfflineIndicator
              isOnline={isOnline}
              isSyncing={isSyncing}
              pendingCount={pendingSyncCount}
            />

            {/* Rounded-top #121212 Conversation List Surface */}
            <div className="flex-1 bg-[#121212] rounded-t-[28px] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto pt-2.5 pb-28 messages-scroll">
                {filteredHomeThreads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
                    <div className="w-14 h-14 rounded-full bg-[#202020] flex items-center justify-center text-[#9AA0A6] mb-3.5">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-[15px] font-medium text-[#E8EAED]">
                      {homeSearch ? 'No matching conversations' : 'No conversations yet'}
                    </p>
                    <p className="text-xs text-[#9AA0A6] mt-1.5 max-w-[240px]">
                      {homeSearch
                        ? 'Try searching a different contact name or message keyword.'
                        : 'Tap Start chat to begin a new conversation.'}
                    </p>
                    {!homeSearch && (
                      <button
                        type="button"
                        onClick={handleResetConversation}
                        className="mt-4 px-4 py-2 rounded-full bg-[#202020] hover:bg-[#2A2A2A] text-xs font-medium text-[#F4A7B9] cursor-pointer"
                      >
                        Restore sample threads
                      </button>
                    )}
                  </div>
                ) : (
                  <ul>
                    {filteredHomeThreads.map((thread) => {
                      const last = thread.messages[thread.messages.length - 1];
                      const isUnread = thread.unreadCount > 0;
                      const previewText = thread.isDraft
                        ? `You: ${thread.draftText || ''}`
                        : last
                          ? `${last.direction === 'outgoing' ? 'You: ' : ''}${last.text.replace(/\n/g, ' ')}`
                          : '';

                      return (
                        <li key={thread.id}>
                          <button
                            type="button"
                            onClick={() => openThread(thread)}
                            className="w-full min-h-[76px] px-4 py-[11px] hover:bg-[#191919] active:bg-[#222222] flex items-center gap-4 text-left transition-colors cursor-pointer"
                          >
                            <ThreadAvatar thread={thread} size="home" />

                            <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-display text-[16px] truncate leading-[1.3] ${
                                    isUnread
                                      ? 'font-medium text-white'
                                      : 'font-normal text-[#E3E3E3]'
                                  }`}
                                >
                                  {thread.recipientName}
                                </div>

                                <p
                                  className={`text-[14px] leading-[1.35] line-clamp-2 mt-0.5 ${
                                    thread.isDraft
                                      ? 'italic text-[#B0B3B8]'
                                      : isUnread
                                        ? 'font-medium text-[#EFEFEF]'
                                        : 'font-normal text-[#B0B3B8]'
                                  }`}
                                >
                                  {previewText}
                                </p>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                                <span
                                  className={`font-roboto text-[12px] tabular-nums leading-none ${
                                    thread.isDraft
                                      ? 'italic text-[#9AA0A6]'
                                      : isUnread
                                        ? 'font-medium text-[#E8EAED]'
                                        : 'text-[#9AA0A6]'
                                  }`}
                                >
                                  {thread.timeLabel}
                                </span>

                                {(thread.isPinned || isUnread) && (
                                  <div className="flex items-center gap-2">
                                    {thread.isPinned && <UprightPinIcon />}
                                    {isUnread && (
                                      <span className="font-roboto min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#F2B8A2] text-[#1A1A1A] text-[11px] font-semibold flex items-center justify-center tabular-nums leading-none">
                                        {thread.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Bottom-Right Floating Action Buttons (Sparkle + Dark-Red Start Chat) */}
            <div className="absolute bottom-5 right-4 flex flex-col items-end gap-3 z-30">
              <button
                type="button"
                aria-label="Quick message templates"
                onClick={() => setSparkleSheetOpen(true)}
                className="w-[52px] h-[52px] rounded-[16px] bg-[#303134] hover:bg-[#3A3B3E] shadow-[0_6px_18px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <SparkleIcon />
              </button>

              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="h-[56px] pl-[18px] pr-[20px] rounded-[16px] bg-[#7D2B2B] hover:bg-[#8E3333] text-[#FCE8E6] shadow-[0_8px_22px_rgba(0,0,0,0.55)] flex items-center gap-3 text-[15px] font-medium transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <MessageSquareText className="w-[21px] h-[21px] text-[#FCE8E6] stroke-[2]" />
                <span>Start chat</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= CONVERSATION VIEW ================= */
          <div className="flex flex-col h-full bg-[#121212] relative">
            {/* Conversation Header */}
            <header
              className={`h-[58px] px-2 bg-[#121212] flex items-center justify-between shrink-0 relative z-20 transition-all duration-200 ${
                isBlurActive ? 'blur-[6px] opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  aria-label="Back to Google Messages"
                  onClick={() => {
                    setFocusedMsgId(null);
                    setPageView('home');
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#E8EAED] active:bg-white/10 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-[22px] h-[22px] stroke-[2]" />
                </button>

                <div className="flex items-center gap-3 min-w-0">
                  {/* Hidden receive-message trigger on avatar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setComposerOpen(true);
                    }}
                    aria-label="Contact avatar"
                    className="shrink-0 focus:outline-none"
                  >
                    <ThreadAvatar thread={activeThread} size="header" />
                  </button>

                  {/* Tap recipient name to customize it */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameDraft(activeThread.recipientName);
                      setRenameOpen(true);
                    }}
                    className="text-[19px] font-normal tracking-[-0.01em] text-[#E8EAED] truncate text-left hover:opacity-85 cursor-pointer"
                    title="Tap to customize recipient name"
                  >
                    {activeThread.recipientName}
                  </button>
                </div>
              </div>

              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  aria-label="More options"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#E8EAED] active:bg-white/10 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-[21px] h-[21px]" />
                </button>

                {menuOpen && (
                  <div className="absolute right-2 top-11 w-60 rounded-2xl bg-[#252525] border border-white/10 shadow-2xl py-1.5 z-40">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameDraft(activeThread.recipientName);
                        setRenameOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#E8EAED] hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-[#B0B3B8]" />
                      <span>Edit recipient name</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLongPressEnabled((v) => !v);
                        setMenuOpen(false);
                        showToast(
                          !longPressEnabled
                            ? 'Long-press focus enabled'
                            : 'Long-press focus disabled',
                        );
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#E8EAED] hover:bg-white/10 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span>Focus on long press</span>
                      <span className="text-xs text-[#F4A7B9]">
                        {longPressEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const last =
                          activeThread.messages[activeThread.messages.length - 1];
                        if (last) handleCopyText(last.text, 'Latest message copied');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#E8EAED] hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#B0B3B8]" />
                      <span>Copy latest message</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetConversation}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#E8EAED] hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#B0B3B8]" />
                      <span>Reset messages</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            <OfflineIndicator
              isOnline={isOnline}
              isSyncing={isSyncing}
              pendingCount={pendingSyncCount}
            />

            {/* Scrollable Conversation Body (Two-finger pinch-to-zoom enabled) */}
            <div
              className="flex-1 overflow-y-auto px-4 pt-3 pb-4 messages-scroll touch-pan-y"
              onTouchStart={handleMessagesTouchStart}
              onTouchMove={handleMessagesTouchMove}
              onTouchEnd={handleMessagesTouchEnd}
              onWheel={handleMessagesWheel}
            >
              {activeThread.messages.map((msg) => {
                const isFocused = focusedMsgId === msg.id;
                const shouldBlur = isBlurActive && !isFocused;
                const isLast = msg.id === lastMessageId;
                const isOutgoing = msg.direction === 'outgoing';

                return (
                  <div
                    key={msg.id}
                    className={`mb-1.5 relative ${isFocused ? 'z-40' : 'z-10'}`}
                  >
                    {msg.showTimestampBefore && (
                      <div
                        className={`my-4 flex justify-center transition-all duration-200 ${
                          isBlurActive ? 'blur-[6px] opacity-35' : ''
                        }`}
                      >
                        <span className="text-[12px] text-[#9AA0A6] tabular-nums">
                          {msg.showTimestampBefore}
                        </span>
                      </div>
                    )}

                    {/* Floating Reaction Picker when this message is long-press focused */}
                    {isFocused && (
                      <div
                        className={`mb-2 flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#2A2A2A] border border-white/15 shadow-2xl"
                        >
                          {FOCUS_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`w-8 h-8 rounded-full text-lg flex items-center justify-center hover:bg-white/10 active:scale-110 transition-transform cursor-pointer ${
                                msg.reaction === emoji ? 'bg-white/15' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-2.5 transition-all duration-200 ${
                        isOutgoing ? 'justify-end' : 'justify-start'
                      } ${
                        shouldBlur ? 'blur-[6px] opacity-35 pointer-events-none' : ''
                      }`}
                    >
                      <div
                        onPointerDown={(e) => handleBubblePointerDown(msg.id, e)}
                        onPointerMove={handleBubblePointerMove}
                        onPointerUp={cancelLongPress}
                        onPointerCancel={cancelLongPress}
                        onContextMenu={(e) => {
                          if (longPressEnabled) {
                            e.preventDefault();
                            setFocusedMsgId(msg.id);
                          }
                        }}
                        onClick={(e) => {
                          if (isFocused) {
                            e.stopPropagation();
                          }
                        }}
                        style={{
                          fontSize: `${computedFontPx}px`,
                          lineHeight: 1.42,
                        }}
                        className={`relative max-w-[85%] rounded-[20px] px-4 py-3 break-words select-text transition-transform duration-200 ${
                          isFocused
                            ? isOutgoing
                              ? 'bg-[#294B77] ring-1 ring-[#8AB4F8]/40 shadow-2xl scale-[1.01]'
                              : 'bg-[#2A2A2A] ring-1 ring-white/20 shadow-2xl scale-[1.01]'
                            : isOutgoing
                              ? 'bg-[#1D3557]'
                              : 'bg-[#202020]'
                        } text-[#E8EAED]`}
                      >
                        <p>
                          {renderLinkedSmsText(msg.text, (kind, value) =>
                            setEntitySheet({ kind, value }),
                          )}
                        </p>

                        {msg.reaction && (
                          <span className="absolute -bottom-2.5 right-3 px-1.5 py-0.5 rounded-full bg-[#2A2A2A] border border-white/15 text-xs shadow-md">
                            {msg.reaction}
                          </span>
                        )}
                      </div>

                      {!isOutgoing && isLast && !isFocused && (
                        <button
                          type="button"
                          aria-label="Forward message"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(msg.text, 'Message copied to forward');
                          }}
                          className="w-9 h-9 rounded-full border border-[#5F6368]/60 bg-[#202020]/70 text-[#B0B3B8] hover:text-white hover:border-[#9AA0A6] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <Forward className="w-[17px] h-[17px] stroke-[1.8]" />
                        </button>
                      )}
                    </div>

                    {/* Visual Delivery / Read Receipt Indicator for Sent Messages */}
                    {isOutgoing && (
                      <div
                        className={`mt-1 pr-1 flex items-center justify-end gap-1 transition-all duration-200 ${
                          shouldBlur ? 'blur-[6px] opacity-35' : ''
                        }`}
                      >
                        {msg.status === 'read' ? (
                          <>
                            <CheckCheck
                              className="w-3.5 h-3.5 text-[#8AB4F8] stroke-[2.2]"
                              aria-label="Read"
                            />
                            <span className="font-roboto text-[11px] font-medium text-[#8AB4F8]">
                              Read
                            </span>
                          </>
                        ) : msg.status === 'delivered' ? (
                          <>
                            <CheckCheck
                              className="w-3.5 h-3.5 text-[#9AA0A6] stroke-[2]"
                              aria-label="Delivered"
                            />
                            <span className="font-roboto text-[11px] text-[#9AA0A6]">
                              Delivered
                            </span>
                          </>
                        ) : (
                          <>
                            <Check
                              className="w-3.5 h-3.5 text-[#9AA0A6] stroke-[2]"
                              aria-label="Sent"
                            />
                            <span className="font-roboto text-[11px] text-[#9AA0A6]">
                              Sent
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {isFocused && (
                      <div
                        className={`mt-2.5 flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-[#2A2A2A] border border-white/15 shadow-2xl"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyText(msg.text);
                              setFocusedMsgId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs text-[#E8EAED] hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyText(msg.text, 'Message ready to forward');
                              setFocusedMsgId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs text-[#E8EAED] hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Forward className="w-3.5 h-3.5" />
                            <span>Forward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="px-3 py-1.5 rounded-xl text-xs text-[#F4A7B9] hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFocusedMsgId(null)}
                            aria-label="Close focus"
                            className="p-1.5 rounded-xl text-[#9AA0A6] hover:bg-white/10 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!isOutgoing && msg.simLabel && isLast && (
                      <div
                        className={`mt-1.5 pl-1 transition-all duration-200 ${
                          isBlurActive ? 'blur-[6px] opacity-35' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast('Received on SIM 1 · Safaricom');
                          }}
                          className="text-[12px] font-medium text-[#F4A7B9] hover:opacity-85 cursor-pointer tracking-tight"
                        >
                          {msg.simLabel}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={scrollEndRef} />
            </div>

            {/* Bottom Reply Section */}
            {activeThread.canReply ? (
              <form
                onSubmit={handleSendReply}
                className={`shrink-0 px-3 py-3 bg-[#121212] flex items-center gap-2 transition-all duration-200 ${
                  isBlurActive ? 'blur-[6px] opacity-40 pointer-events-none' : ''
                }`}
              >
                <input
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Text message"
                  className="flex-1 h-11 rounded-full bg-[#202020] px-4 text-sm text-[#E8EAED] placeholder-[#9AA0A6] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyDraft.trim()}
                  aria-label="Send SMS"
                  className="w-11 h-11 rounded-full bg-[#F4A7B9] disabled:opacity-35 text-[#121212] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div
                className={`shrink-0 bg-[#202020] rounded-t-[24px] px-6 pt-4 pb-5 text-center relative transition-all duration-200 ${
                  isBlurActive ? 'blur-[6px] opacity-40 pointer-events-none' : ''
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[13px] text-[#B0B3B8] leading-snug">
                  Sender can&apos;t accept replies. Contact them directly.
                </p>
                <button
                  type="button"
                  onClick={() => setLearnMoreOpen((v) => !v)}
                  className="mt-1 text-[13px] text-[#F4A7B9] underline underline-offset-2 cursor-pointer"
                >
                  Learn more
                </button>

                {/* Secondary subtle hidden hotspot */}
                <button
                  type="button"
                  aria-label="Receive new message"
                  onClick={() => setComposerOpen(true)}
                  className="absolute right-2 bottom-2 w-10 h-10 rounded-full opacity-0 cursor-default"
                />
              </div>
            )}
          </div>
        )}

        {/* Transient Pinch-to-Zoom Indicator */}
        {showZoomBadge && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#2A2A2A]/95 border border-white/10 text-xs text-[#E8EAED] tabular-nums shadow-lg z-40 pointer-events-none">
            Text size · {computedFontPx}px ({Math.round(fontScale * 100)}%)
          </div>
        )}

        {/* Persistent Heads-Up Notification Popup (stays until swiped away) */}
        {activeNotification && (
          <div
            onPointerDown={handleNotifPointerDown}
            onPointerMove={handleNotifPointerMove}
            onPointerUp={handleNotifPointerUp}
            onPointerCancel={handleNotifPointerUp}
            onClick={(e) => {
              e.stopPropagation();
              if (Math.abs(notifDrag.x) > 8 || Math.abs(notifDrag.y) > 8) return;
              setActiveThreadId(activeNotification.threadId);
              setPageView('conversation');
              setTimeout(() => {
                scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 60);
            }}
            style={{
              transform: `translate3d(${notifDrag.x}px, ${notifDrag.y}px, 0)`,
              opacity: Math.max(
                0.25,
                1 - Math.max(Math.abs(notifDrag.x) / 180, Math.abs(notifDrag.y) / 90),
              ),
              transition: notifDrag.dragging
                ? 'none'
                : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease',
            }}
            role="status"
            aria-live="polite"
            className="absolute top-3 left-3 right-3 z-50 rounded-[24px] bg-[#282828]/95 backdrop-blur-md border border-white/10 shadow-2xl p-3.5 cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base font-semibold text-[#121212]"
                  style={{ backgroundColor: activeNotification.avatarColor }}
                >
                  {activeNotification.avatarType === 'initial' ? (
                    activeNotification.senderName.trim().charAt(0).toUpperCase() || 'M'
                  ) : (
                    <PersonSilhouetteIcon />
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0B57D0] flex items-center justify-center ring-2 ring-[#282828]">
                  <MessageSquare className="w-2.5 h-2.5 text-white fill-current" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-[#9AA0A6]">
                  <span>Messages</span>
                  <span aria-hidden="true">·</span>
                  <span>Swipe to dismiss</span>
                </div>

                <p className="text-[14px] font-medium text-[#E8EAED] leading-snug">
                  {activeNotification.senderName}
                </p>
                <p className="text-[13px] text-[#C4C7C5] leading-snug line-clamp-2 mt-0.5">
                  {activeNotification.text}
                </p>

                <div className="mt-2.5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNotification(null);
                      showToast('Marked as read');
                    }}
                    className="text-xs font-medium text-[#F4A7B9] hover:opacity-85 cursor-pointer"
                  >
                    Mark as read
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeNotification.code) {
                        handleCopyText(
                          activeNotification.code,
                          `Copied code ${activeNotification.code}`,
                        );
                      } else {
                        handleCopyText(activeNotification.text);
                      }
                      setActiveNotification(null);
                    }}
                    className="text-xs font-medium text-[#F4A7B9] hover:opacity-85 cursor-pointer"
                  >
                    {activeNotification.code
                      ? `Copy "${activeNotification.code}"`
                      : 'Copy message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Android Toast */}
        {toast && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#303030] text-[#E8EAED] text-xs shadow-xl border border-white/10 whitespace-nowrap z-50 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#F4A7B9]" />
            <span>{toast}</span>
          </div>
        )}

        {/* Account Profile Sheet */}
        {profileSheetOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-5"
            onClick={() => setProfileSheetOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-3xl bg-[#202020] border border-white/10 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer group shrink-0">
                    <img
                      src={userAvatar || profileAvatar}
                      alt="Profile"
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-white/15"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#303134] border border-white/15 flex items-center justify-center text-[#E8EAED]">
                      <Camera className="w-2.5 h-2.5" />
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <div>
                    <p className="text-sm font-medium text-[#E8EAED]">Samuel</p>
                    <p className="font-roboto text-xs text-[#9AA0A6]">
                      {isOnline
                        ? pendingSyncCount > 0
                          ? `Online · ${pendingSyncCount} queued`
                          : lastSyncedAt
                            ? `IndexedDB · Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'IndexedDB · Offline ready'
                        : 'Offline · Saved locally'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileSheetOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#323232] text-left text-sm text-[#E8EAED] flex items-center justify-between cursor-pointer">
                  <span>Change profile photo</span>
                  <Camera className="w-4 h-4 text-[#9AA0A6]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {userAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserAvatar(undefined);
                      savePreferencesToDb({ userAvatar: '' }).catch(() => {});
                      showToast('Default photo restored');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#323232] text-left text-sm text-[#9AA0A6] cursor-pointer"
                  >
                    Use default profile photo
                  </button>
                )}
                <PWAInstallButton />
                {pendingSyncCount > 0 && isOnline && (
                  <button
                    type="button"
                    onClick={() => runSyncFlush(true)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D2838] hover:bg-[#243246] text-left text-sm text-[#A8C7FA] cursor-pointer"
                  >
                    Sync {pendingSyncCount} pending change
                    {pendingSyncCount === 1 ? '' : 's'} now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileSheetOpen(false);
                    setComposerOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#323232] text-left text-sm text-[#E8EAED] cursor-pointer"
                >
                  Simulate incoming SMS
                </button>
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#323232] text-left text-sm text-[#F4A7B9] cursor-pointer"
                >
                  Restore default conversations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sparkle Quick Message Sheet (100% Offline) */}
        {sparkleSheetOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/65 flex items-end"
            onClick={() => setSparkleSheetOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#202020] rounded-t-[24px] p-5 border-t border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparkleIcon />
                  <h2 className="text-base font-medium text-[#E8EAED]">Quick compose</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSparkleSheetOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#9AA0A6]">
                Start a new message or insert an offline M-PESA template into the active thread.
              </p>
              <div className="space-y-2">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setSparkleSheetOpen(false);
                      setDraftText(tpl.text);
                      setComposerOpen(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-[#2A2A2A] hover:bg-[#323232] text-left cursor-pointer"
                  >
                    <p className="text-sm font-medium text-[#E8EAED]">{tpl.label}</p>
                    <p className="text-xs text-[#9AA0A6] line-clamp-1 mt-0.5">{tpl.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Learn More Bottom Sheet */}
        {learnMoreOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/60 flex items-end"
            onClick={() => setLearnMoreOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#202020] rounded-t-[24px] p-6 border-t border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-medium text-[#E8EAED]">
                  Can&apos;t reply to {activeThread.recipientName}
                </h2>
                <button
                  type="button"
                  onClick={() => setLearnMoreOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#B0B3B8] leading-relaxed">
                This conversation uses an alphanumeric sender ID (
                <span className="text-[#E8EAED]">{activeThread.recipientName}</span>) configured
                for one-way transactional SMS alerts. Replies cannot be delivered to short-code
                or alphanumeric business senders.
              </p>
              <button
                type="button"
                onClick={() => setLearnMoreOpen(false)}
                className="mt-5 w-full h-11 rounded-full bg-[#F4A7B9] text-[#121212] text-sm font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Clickable Phone / Date / URL Action Sheet */}
        {entitySheet && (
          <div
            className="absolute inset-0 z-50 bg-black/60 flex items-end"
            onClick={() => setEntitySheet(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#202020] rounded-t-[24px] p-5 border-t border-white/10 space-y-2"
            >
              <p className="text-xs text-[#9AA0A6] px-2 truncate">{entitySheet.value}</p>
              {entitySheet.kind === 'phone' && (
                <a
                  href={`tel:${entitySheet.value}`}
                  className="w-full px-3 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3 text-sm text-[#E8EAED]"
                >
                  <Phone className="w-4 h-4 text-[#F4A7B9]" />
                  <span>Call {entitySheet.value}</span>
                </a>
              )}
              {entitySheet.kind === 'url' && (
                <a
                  href={entitySheet.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3 text-sm text-[#E8EAED]"
                >
                  <ExternalLink className="w-4 h-4 text-[#F4A7B9]" />
                  <span>Open link in browser</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  handleCopyText(entitySheet.value);
                  setEntitySheet(null);
                }}
                className="w-full px-3 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3 text-sm text-[#E8EAED] cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#B0B3B8]" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        )}

        {/* Edit Recipient Name Modal */}
        {renameOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-5"
            onClick={() => setRenameOpen(false)}
          >
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-3xl bg-[#202020] border border-white/10 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-[#E8EAED]">
                  Customize recipient name
                </h2>
                <button
                  type="button"
                  onClick={() => setRenameOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                placeholder="Enter recipient name"
                className="w-full h-11 rounded-xl bg-[#121212] border border-white/15 px-3.5 text-sm text-[#E8EAED] focus:outline-none focus:border-[#F4A7B9]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameDraft.trim()}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#F4A7B9] text-[#121212] disabled:opacity-40 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* New Chat Modal from Start Chat FAB */}
        {newChatOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-5"
            onClick={() => setNewChatOpen(false)}
          >
            <form
              onSubmit={handleCreateThread}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-3xl bg-[#202020] border border-white/10 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-[#E8EAED]">New conversation</h2>
                <button
                  type="button"
                  onClick={() => setNewChatOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Recipient name or phone number"
                className="w-full h-11 rounded-xl bg-[#121212] border border-white/15 px-3.5 text-sm text-[#E8EAED] focus:outline-none focus:border-[#F4A7B9]"
              />
              <textarea
                rows={3}
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Optional first message..."
                className="w-full rounded-xl bg-[#121212] border border-white/15 p-3 text-sm text-[#E8EAED] placeholder-[#747775] focus:outline-none focus:border-[#F4A7B9] resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewChatOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChatName.trim()}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#7D2B2B] text-[#FCE8E6] disabled:opacity-40 cursor-pointer"
                >
                  Start chat
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Hidden "Message Yourself" Sheet to Receive a New Message */}
        {composerOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/65 flex items-end"
            onClick={() => setComposerOpen(false)}
          >
            <form
              onSubmit={handleReceiveMessage}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1E1E1E] rounded-t-[24px] p-5 border-t border-white/10 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ThreadAvatar thread={activeThread} size="header" />
                  <h2 className="text-sm font-medium text-[#E8EAED]">
                    Receive message from {activeThread.recipientName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#B0B3B8] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-[#9AA0A6] mb-1">
                  Recipient name
                </label>
                <input
                  type="text"
                  value={activeThread.recipientName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setThreads((prev) =>
                      prev.map((t) =>
                        t.id === activeThread.id ? { ...t, recipientName: val } : t,
                      ),
                    );
                  }}
                  className="w-full h-9 rounded-xl bg-[#121212] border border-white/10 px-3 text-xs text-[#E8EAED] focus:outline-none focus:border-[#F4A7B9]/60"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setDraftText(tpl.text)}
                    className="px-3 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[#333333] text-xs text-[#E8EAED] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder={`Type an incoming SMS from ${activeThread.recipientName}...`}
                className="w-full rounded-2xl bg-[#121212] border border-white/10 p-3.5 text-sm text-[#E8EAED] placeholder-[#747775] focus:outline-none focus:border-[#F4A7B9]/60 resize-none"
              />

              <button
                type="submit"
                disabled={!draftText.trim()}
                className="w-full h-11 rounded-full bg-[#F4A7B9] hover:bg-[#F7BAC8] disabled:opacity-40 text-[#121212] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Receive SMS</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
