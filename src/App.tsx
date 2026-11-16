import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Forward,
  MessageSquare,
  MessageSquarePlus,
  MoreVertical,
  Phone,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';

interface SmsMessage {
  id: string;
  text: string;
  showTimestampBefore?: string;
  simLabel?: string;
  reaction?: string;
}

interface SmsThread {
  id: string;
  recipientName: string;
  avatarColor: string;
  canReply: boolean;
  messages: SmsMessage[];
}

const INITIAL_THREADS: SmsThread[] = [
  {
    id: 'thread-mpesa',
    recipientName: 'MPESA',
    avatarColor: '#F5C518',
    canReply: false,
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
    id: 'thread-safaricom',
    recipientName: 'Safaricom',
    avatarColor: '#36B34A',
    canReply: false,
    messages: [
      {
        id: 'msg-s1',
        showTimestampBefore: 'Yesterday',
        text: 'Dear Customer, your 1.5GB daily data bundle is active and valid until 11:59 PM. Dial *544# to check balance.',
        simLabel: '• 1: Safaricom',
      },
    ],
  },
  {
    id: 'thread-abdisalan',
    recipientName: 'Abdisalan Ahmed',
    avatarColor: '#8AB4F8',
    canReply: true,
    messages: [
      {
        id: 'msg-a1',
        showTimestampBefore: '15/11/26',
        text: 'Received, thank you! Let me confirm on my end.',
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
const STORAGE_KEY = 'mpesa_sms_threads_v2';
const FONT_SCALE_KEY = 'mpesa_sms_font_scale_v1';

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
    // Ignore audio context errors
  }
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
  const [threads, setThreads] = useState<SmsThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SmsThread[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('thread-mpesa');
  const [pageView, setPageView] = useState<'conversation' | 'home'>('conversation');
  const [homeSearch, setHomeSearch] = useState('');

  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_SCALE_KEY));
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
  const [replyDraft, setReplyDraft] = useState('');

  // Long-press focus & blur state
  const [longPressEnabled, setLongPressEnabled] = useState(true);
  const [focusedMsgId, setFocusedMsgId] = useState<string | null>(null);

  const [entitySheet, setEntitySheet] = useState<{
    kind: 'phone' | 'url' | 'date';
    value: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Persistent notification popup state (stays until swiped away!)
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    threadId: string;
    senderName: string;
    avatarColor: string;
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
    threads.find((t) => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // Ignore storage errors
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    } catch {
      // Ignore storage errors
    }
  }, [fontScale]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setComposerOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setFocusedMsgId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (zoomBadgeTimerRef.current) window.clearTimeout(zoomBadgeTimerRef.current);
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
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

  const triggerIncomingNotification = (thread: SmsThread, msg: SmsMessage) => {
    const codeMatch = msg.text.match(/\b([A-Z0-9]{10})\b/);
    setNotifDrag({ x: 0, y: 0, dragging: false });
    setActiveNotification({
      id: msg.id,
      threadId: thread.id,
      senderName: thread.recipientName,
      avatarColor: thread.avatarColor,
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
      messages: [...activeThread.messages, newMsg],
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? updatedThread : t)),
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
      showTimestampBefore: timeStr,
      text: clean,
      simLabel: '• 1: Safaricom',
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id ? { ...t, messages: [...t.messages, newMsg] } : t,
      ),
    );
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
    setRenameOpen(false);
    showToast(`Renamed to ${nextName}`);
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChatName.trim();
    if (!clean) return;
    const colors = ['#F5C518', '#36B34A', '#8AB4F8', '#F4A7B9', '#A8C7FA'];
    const newThread: SmsThread = {
      id: `thread-${Date.now()}`,
      recipientName: clean,
      avatarColor: colors[threads.length % colors.length],
      canReply: true,
      messages: [
        {
          id: `msg-${Date.now()}`,
          showTimestampBefore: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          text: `Conversation started with ${clean}. Tap the avatar to receive a simulated SMS.`,
          simLabel: '• 1: Safaricom',
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setNewChatName('');
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
    setFocusedMsgId(null);
  };

  const handleResetConversation = () => {
    setThreads(INITIAL_THREADS);
    setActiveThreadId('thread-mpesa');
    setFocusedMsgId(null);
    setMenuOpen(false);
    setFontScale(1);
    showToast('Conversation reset');
  };

  // Long-press handlers for message bubbles
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

  // Swipe-to-dismiss handlers for the persistent notification popup
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

  const avatarInitial = activeThread.recipientName.trim().charAt(0).toUpperCase() || 'M';
  const lastMessageId = activeThread.messages[activeThread.messages.length - 1]?.id;
  const computedFontPx = Math.round(15 * fontScale);
  const isBlurActive = focusedMsgId !== null;

  const filteredHomeThreads = threads.filter((t) => {
    if (!homeSearch.trim()) return true;
    const q = homeSearch.toLowerCase();
    return (
      t.recipientName.toLowerCase().includes(q) ||
      t.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="min-h-dvh w-full bg-[#090909] flex justify-center"
      onClick={() => {
        setMenuOpen(false);
        setFocusedMsgId(null);
      }}
    >
      {/* Mobile Android Viewport Shell (no bottom Android navigation bar) */}
      <div className="w-full max-w-[430px] h-dvh bg-[#121212] text-[#E8EAED] flex flex-col overflow-hidden relative">
        {pageView === 'home' ? (
          /* ================= HOME MESSAGES PAGE ================= */
          <div className="flex flex-col h-full bg-[#121212] relative">
            <header className="h-[60px] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#8AB4F8] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#121212] fill-current" />
                </div>
                <h1 className="text-[20px] font-medium tracking-tight text-[#E8EAED]">
                  Messages
                </h1>
              </div>

              <button
                type="button"
                aria-label="Reset conversations"
                onClick={handleResetConversation}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#9AA0A6] hover:bg-white/10 cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </header>

            <div className="px-4 pb-3 shrink-0">
              <div className="h-11 rounded-full bg-[#202020] px-4 flex items-center gap-3">
                <Search className="w-4 h-4 text-[#9AA0A6] shrink-0" />
                <input
                  type="text"
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full bg-transparent text-sm text-[#E8EAED] placeholder-[#9AA0A6] focus:outline-none"
                />
                {homeSearch && (
                  <button
                    type="button"
                    onClick={() => setHomeSearch('')}
                    className="p-1 text-[#9AA0A6] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-24 messages-scroll">
              {filteredHomeThreads.map((thread) => {
                const last = thread.messages[thread.messages.length - 1];
                const initial = thread.recipientName.trim().charAt(0).toUpperCase() || 'M';
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setPageView('conversation');
                      setFocusedMsgId(null);
                    }}
                    className="w-full px-3 py-3 rounded-2xl hover:bg-[#1E1E1E] active:bg-[#252525] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-display text-lg font-medium text-[#121212]"
                      style={{ backgroundColor: thread.avatarColor }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[15px] font-medium text-[#E8EAED] truncate">
                          {thread.recipientName}
                        </span>
                        <span className="text-[11px] text-[#9AA0A6] shrink-0 tabular-nums">
                          {last?.showTimestampBefore || 'Now'}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#9AA0A6] truncate mt-0.5">
                        {last?.text.replace(/\n/g, ' ') || 'No messages'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Start chat FAB */}
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="absolute bottom-5 right-5 h-14 px-5 rounded-2xl bg-[#004A77] hover:bg-[#005B94] text-[#C2E7FF] shadow-xl flex items-center gap-2.5 text-sm font-medium cursor-pointer"
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span>Start chat</span>
            </button>
          </div>
        ) : (
          /* ================= CONVERSATION VIEW ================= */
          <>
            {/* Conversation Header */}
            <header
              className={`h-[58px] px-2 bg-[#121212] flex items-center justify-between shrink-0 relative z-20 transition-all duration-200 ${
                isBlurActive ? 'blur-[6px] opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  aria-label="Back to messages home"
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
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 select-none focus:outline-none"
                    style={{ backgroundColor: activeThread.avatarColor }}
                  >
                    <span className="font-display text-[19px] font-medium text-[#121212] leading-none">
                      {avatarInitial}
                    </span>
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
                        onClick={(e) => e.stopPropagation()}
                        className="mb-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#2A2A2A] border border-white/15 shadow-2xl"
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
                    )}

                    <div
                      className={`flex items-center gap-2.5 transition-all duration-200 ${
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
                            ? 'bg-[#2A2A2A] ring-1 ring-white/20 shadow-2xl scale-[1.01]'
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

                      {/* Circular outlined forwarding icon on latest message */}
                      {isLast && !isFocused && (
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

                    {/* Focused Action Bar below focused message */}
                    {isFocused && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2.5 inline-flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-[#2A2A2A] border border-white/15 shadow-2xl"
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
                    )}

                    {msg.simLabel && isLast && (
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

            {/* Bottom Reply Section (no navigation bar beneath) */}
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
          </>
        )}

        {/* Transient Pinch-to-Zoom Indicator */}
        {showZoomBadge && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#2A2A2A]/95 border border-white/10 text-xs text-[#E8EAED] tabular-nums shadow-lg z-40 pointer-events-none">
            Text size · {computedFontPx}px ({Math.round(fontScale * 100)}%)
          </div>
        )}

        {/* Persistent Heads-Up Notification Popup (stays until swiped away or dismissed) */}
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
                  {activeNotification.senderName.trim().charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0B57D0] flex items-center justify-center ring-2 ring-[#282828]">
                  <MessageSquare className="w-2.5 h-2.5 text-white fill-current" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9AA0A6]">
                    <span>Messages</span>
                    <span aria-hidden="true">·</span>
                    <span>Swipe to dismiss</span>
                  </div>
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

        {/* Subtle Android Toast / Snackbar */}
        {toast && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#303030] text-[#E8EAED] text-xs shadow-xl border border-white/10 whitespace-nowrap z-50 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#F4A7B9]" />
            <span>{toast}</span>
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

        {/* New Chat Modal from Home Page */}
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
                <h2 className="text-base font-medium text-[#E8EAED]">New message</h2>
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
                placeholder="Recipient name or number"
                className="w-full h-11 rounded-xl bg-[#121212] border border-white/15 px-3.5 text-sm text-[#E8EAED] focus:outline-none focus:border-[#F4A7B9]"
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
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#8AB4F8] text-[#121212] disabled:opacity-40 cursor-pointer"
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
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-[#121212]"
                    style={{ backgroundColor: activeThread.avatarColor }}
                  >
                    {avatarInitial}
                  </div>
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

              {/* Editable recipient name right inside the sheet too */}
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
