import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Forward,
  MessageSquare,
  MoreVertical,
  Phone,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';

function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [659.25, 880]; // E5 -> A5 crisp Android notification chime
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

interface SmsMessage {
  id: string;
  text: string;
  timestampLabel?: string;
  showTimestampBefore?: string;
  simLabel?: string;
}

const INITIAL_MESSAGES: SmsMessage[] = [
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

const STORAGE_KEY = 'mpesa_sms_messages_v1';

/**
 * Automatically underlines Android-style SMS entities:
 * URLs, 10–12 digit phone/account numbers, and dd/mm/yy (optionally with "at hh:mm AM/PM").
 */
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
  const [messages, setMessages] = useState<SmsMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SmsMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_MESSAGES;
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [entitySheet, setEntitySheet] = useState<{
    kind: 'phone' | 'url' | 'date';
    value: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    text: string;
    timeLabel: string;
    code?: string;
  } | null>(null);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const notificationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setComposerOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (notificationTimerRef.current) window.clearTimeout(notificationTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopyText = (text: string, label = 'Copied to clipboard') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast(label);
  };

  const triggerIncomingNotification = (msg: SmsMessage, timeLabel: string) => {
    const codeMatch = msg.text.match(/\b([A-Z0-9]{10})\b/);
    setActiveNotification({
      id: msg.id,
      text: msg.text,
      timeLabel,
      code: codeMatch?.[1],
    });
    if (notificationTimerRef.current) window.clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = window.setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    playNotificationChime();

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          new Notification('MPESA', { body: msg.text });
        } catch {
          // Ignore browser notification errors in sandboxed iframes
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then((perm) => {
            if (perm === 'granted') {
              try {
                new Notification('MPESA', { body: msg.text });
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

    setMessages((prev) => [...prev, newMsg]);
    setDraftText('');
    setComposerOpen(false);
    triggerIncomingNotification(newMsg, timeStr);
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      return next.length > 0 ? next : INITIAL_MESSAGES;
    });
    setSelectedMsgId(null);
    showToast('Message deleted');
  };

  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setSelectedMsgId(null);
    setMenuOpen(false);
    showToast('Conversation reset');
  };

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <div
      className="min-h-dvh w-full bg-[#090909] flex justify-center"
      onClick={() => {
        setMenuOpen(false);
        setSelectedMsgId(null);
      }}
    >
      {/* Mobile Android Viewport Shell */}
      <div className="w-full max-w-[430px] h-dvh bg-[#121212] text-[#E8EAED] flex flex-col overflow-hidden relative">
        {/* 3. Conversation Header (Status bar hidden as requested) */}
        <header className="h-[58px] px-2 bg-[#121212] flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                if (selectedMsgId) {
                  setSelectedMsgId(null);
                } else {
                  showToast('MPESA · SMS conversation');
                }
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#E8EAED] active:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-[22px] h-[22px] stroke-[2]" />
            </button>

            {/* Hidden "message yourself" trigger disguised naturally as the MPESA avatar & title */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setComposerOpen(true);
              }}
              className="flex items-center gap-3 min-w-0 text-left focus:outline-none"
              aria-label="MPESA contact"
            >
              <div
                className="w-10 h-10 rounded-full bg-[#F5C518] flex items-center justify-center shrink-0 select-none"
                aria-hidden="true"
              >
                <span className="font-display text-[19px] font-medium text-[#121212] leading-none">
                  M
                </span>
              </div>
              <h1 className="text-[19px] font-normal tracking-[-0.01em] text-[#E8EAED] truncate">
                MPESA
              </h1>
            </button>
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
              <div className="absolute right-2 top-11 w-52 rounded-2xl bg-[#252525] border border-white/10 shadow-2xl py-1.5 z-40">
                <button
                  type="button"
                  onClick={() => {
                    const last = messages[messages.length - 1];
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
                  onClick={() => {
                    setMenuOpen(false);
                    setLearnMoreOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#E8EAED] hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-[#B0B3B8]" />
                  <span>Details</span>
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

        {/* Scrollable Conversation Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 messages-scroll">
          {messages.map((msg) => {
            const isSelected = selectedMsgId === msg.id;
            const isLast = msg.id === lastMessageId;

            return (
              <div key={msg.id} className="mb-1.5">
                {msg.showTimestampBefore && (
                  <div className="my-4 flex justify-center">
                    <span className="text-[12px] text-[#9AA0A6] tabular-nums">
                      {msg.showTimestampBefore}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMsgId(isSelected ? null : msg.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedMsgId(isSelected ? null : msg.id);
                      }
                    }}
                    className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[15px] leading-[1.42] break-words transition-colors cursor-pointer select-text ${
                      isSelected
                        ? 'bg-[#2E2E2E] ring-1 ring-[#F4A7B9]/60'
                        : 'bg-[#202020] hover:bg-[#252525]'
                    } text-[#E8EAED]`}
                  >
                    <p>
                      {renderLinkedSmsText(msg.text, (kind, value) =>
                        setEntitySheet({ kind, value }),
                      )}
                    </p>
                  </div>

                  {/* Circular outlined forwarding/share icon on the right of the latest bubble */}
                  {isLast && (
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

                {/* Inline message action bar when user taps a bubble */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#262626] border border-white/10 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyText(msg.text);
                        setSelectedMsgId(null);
                      }}
                      className="px-2.5 py-1 rounded-full text-xs text-[#E8EAED] hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="px-2.5 py-1 rounded-full text-xs text-[#F4A7B9] hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}

                {msg.simLabel && isLast && (
                  <div className="mt-1.5 pl-1">
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

        {/* 9. Bottom Reply Restriction Section */}
        <div
          className="shrink-0 bg-[#202020] rounded-t-[24px] px-6 pt-4 pb-5 text-center relative"
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

          {/* Secondary subtle hidden hotspot at bottom-right corner of the panel */}
          <button
            type="button"
            aria-label="Receive new message"
            onClick={() => setComposerOpen(true)}
            className="absolute right-2 bottom-2 w-10 h-10 rounded-full opacity-0 cursor-default"
          />
        </div>

        {/* 10. Android Gesture Navigation Bar */}
        <div className="h-[22px] bg-black flex items-center justify-center shrink-0">
          <div className="w-[108px] h-[4px] rounded-full bg-[#8E918F]" />
        </div>

        {/* Android Heads-Up Notification Banner */}
        {activeNotification && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setActiveNotification(null);
            }}
            role="status"
            aria-live="polite"
            className="absolute top-3 left-3 right-3 z-50 rounded-[24px] bg-[#282828]/95 backdrop-blur-md border border-white/10 shadow-2xl p-3.5 cursor-pointer transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#F5C518] flex items-center justify-center font-display text-base font-semibold text-[#121212]">
                  M
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
                    <span>now</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNotification(null);
                    }}
                    className="p-1 -mr-1 rounded-full text-[#9AA0A6] hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[14px] font-medium text-[#E8EAED] leading-snug">
                  MPESA
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
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#303030] text-[#E8EAED] text-xs shadow-xl border border-white/10 whitespace-nowrap z-50 flex items-center gap-1.5">
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
                  Can&apos;t reply to MPESA
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
                This conversation uses an alphanumeric sender ID (<span className="text-[#E8EAED]">MPESA</span>)
                configured for one-way transactional SMS alerts. Replies cannot be delivered to
                short-code or alphanumeric business senders.
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

        {/* Hidden "Message Yourself" Sheet to Receive a New Message from MPESA */}
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
                  <div className="w-7 h-7 rounded-full bg-[#F5C518] flex items-center justify-center text-xs font-semibold text-[#121212]">
                    M
                  </div>
                  <h2 className="text-sm font-medium text-[#E8EAED]">
                    Receive message from MPESA
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
                placeholder="Type an incoming MPESA SMS message..."
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
