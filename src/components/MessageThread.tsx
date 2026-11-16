import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  Mic,
  Paperclip,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Conversation,
  Message,
  MessageAttachment,
  UserProfile,
} from '../types/messages';
import { CONVERSATION_THEMES } from '../utils/themes';
import { formatDateDivider, formatDuration } from '../utils/formatTime';
import { Avatar } from './Avatar';
import { MessageBubble } from './MessageBubble';

const EMOJI_BANK = [
  '😀', '😂', '🥹', '😊', '😍', '🥰', '😎', '🤔',
  '🙌', '👏', '👍', '👎', '❤️', '🔥', '✨', '🎉',
  '💯', '🙏', '☕', '🚀', '🌿', '🎧', '📸', '📍',
];

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  users: UserProfile[];
  currentUser: UserProfile;
  onlineUserIds: string[];
  typingUserIds: string[];
  onBackMobile: () => void;
  onOpenDetails: () => void;
  onSendMessage: (payload: {
    text: string;
    attachments?: MessageAttachment[];
    replyToId?: string;
    scheduledFor?: number;
  }) => Promise<void>;
  onReact: (messageId: string, emoji: string) => void;
  onToggleStar: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onOpenImage: (url: string, caption?: string) => void;
}

export function MessageThread({
  conversation,
  messages,
  users,
  currentUser,
  onlineUserIds,
  typingUserIds,
  onBackMobile,
  onOpenDetails,
  onSendMessage,
  onReact,
  onToggleStar,
  onDeleteMessage,
  onTypingChange,
  onOpenImage,
}: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInput, setScheduleInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);

  const theme = CONVERSATION_THEMES[conversation.theme] || CONVERSATION_THEMES.blue;

  const otherParticipantId = conversation.participantIds.find((id) => id !== currentUser.id);
  const otherUser = otherParticipantId
    ? users.find((u) => u.id === otherParticipantId)
    : undefined;
  const displayTitle = conversation.isGroup
    ? conversation.title
    : otherUser?.name || conversation.title;
  const displayAvatarUrl = conversation.isGroup
    ? undefined
    : otherUser?.avatarUrl || conversation.avatarUrl;
  const displayInitials = conversation.isGroup
    ? conversation.initials
    : otherUser?.initials || conversation.initials;
  const displayColor = conversation.isGroup
    ? conversation.avatarColor
    : otherUser?.avatarColor || conversation.avatarColor;
  const isOnline =
    !conversation.isGroup && otherUser ? onlineUserIds.includes(otherUser.id) : false;

  const activeTypers = typingUserIds.filter((id) => id !== currentUser.id);

  const sortedMessages = [...messages]
    .filter((m) =>
      threadSearch.trim()
        ? m.text.toLowerCase().includes(threadSearch.toLowerCase())
        : true,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.id, sortedMessages.length, activeTypers.length]);

  useEffect(() => {
    setDraft('');
    setReplyTo(null);
    setAttachments([]);
    setSearchOpen(false);
    setThreadSearch('');
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
    setMicError(null);
  }, [conversation.id]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const handleDraftChange = (val: string) => {
    setDraft(val);
    onTypingChange(val.trim().length > 0);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    if (val.trim().length > 0) {
      typingTimeoutRef.current = window.setTimeout(() => {
        onTypingChange(false);
      }, 2200);
    }
  };

  const handleSubmit = async (scheduledFor?: number) => {
    if (sending) return;
    if (!draft.trim() && attachments.length === 0) return;

    setSending(true);
    onTypingChange(false);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    try {
      await onSendMessage({
        text: draft.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        replyToId: replyTo?.id,
        scheduledFor,
      });
      setDraft('');
      setAttachments([]);
      setReplyTo(null);
      setShowScheduleModal(false);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) return;
        const isImage = file.type.startsWith('image/');
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: isImage ? 'image' : 'file',
            url: result,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleAttachLocation = () => {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      setAttachments((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}`,
          type: 'location',
          url: '#',
          locationLabel: 'San Francisco, CA',
          coordinates: '37.7749° N, 122.4194° W',
        },
      ]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}`,
            type: 'location',
            url: `https://maps.google.com/?q=${lat},${lng}`,
            locationLabel: 'Current Location',
            coordinates: `${lat}, ${lng}`,
          },
        ]);
      },
      () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}`,
            type: 'location',
            url: '#',
            locationLabel: 'Ferry Building, Embarcadero',
            coordinates: '37.7955° N, 122.3937° W',
          },
        ]);
      },
      { timeout: 4000 },
    );
  };

  const startVoiceRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 250);
    } catch {
      setMicError('Microphone access was denied.');
    }
  };

  const stopVoiceRecording = (shouldSend: boolean) => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setIsRecording(false);
      return;
    }
    const duration = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));

    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      if (shouldSend && audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const url = typeof reader.result === 'string' ? reader.result : '';
          if (url) {
            await onSendMessage({
              text: '',
              attachments: [
                {
                  id: `att-${Date.now()}`,
                  type: 'audio',
                  url,
                  durationSec: duration,
                  mimeType: blob.type,
                  name: 'Voice message',
                },
              ],
            });
          }
        };
        reader.readAsDataURL(blob);
      }
      setIsRecording(false);
      setRecordSeconds(0);
    };
    recorder.stop();
  };

  const jumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#0B57D0]/50', 'rounded-2xl');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0B57D0]/50', 'rounded-2xl');
      }, 1400);
    }
  };

  const openScheduleModal = () => {
    setShowAttachMenu(false);
    const future = new Date(Date.now() + 15 * 60 * 1000);
    const localIso = new Date(future.getTime() - future.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduleInput(localIso);
    setShowScheduleModal(true);
  };

  const latestOwnMessageId = [...sortedMessages]
    .reverse()
    .find((m) => m.senderId === currentUser.id)?.id;

  return (
    <section className="flex flex-col flex-1 h-full min-w-0 bg-white dark:bg-[#16181D]">
      {/* Thread Header */}
      <header className="flex items-center justify-between gap-3 px-3 sm:px-5 h-16 shrink-0 border-b border-[#E1E5EB] dark:border-[#262930] bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackMobile}
            aria-label="Back to conversations"
            className="lg:hidden min-w-[44px] min-h-[44px] -ml-1 rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Avatar
            name={displayTitle}
            initials={displayInitials}
            avatarUrl={displayAvatarUrl}
            avatarColor={displayColor}
            isGroup={conversation.isGroup}
            isOnline={isOnline}
            size="md"
          />

          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
              {displayTitle}
            </h2>
            <p className="text-xs text-[#747775] dark:text-[#9AA0A6] flex items-center gap-1.5 truncate">
              {activeTypers.length > 0 ? (
                <span className={`font-medium ${theme.accentText}`}>
                  {conversation.isGroup
                    ? `${users.find((u) => u.id === activeTypers[0])?.name.split(' ')[0] || 'Someone'} is typing...`
                    : 'Typing...'}
                </span>
              ) : conversation.transport === 'rcs' ? (
                <>
                  <Lock className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {conversation.isGroup
                      ? `${conversation.participantIds.length} participants · RCS`
                      : `RCS · ${otherUser?.phone || conversation.phone || 'End-to-end encrypted'}`}
                  </span>
                </>
              ) : (
                <span className="truncate">
                  SMS · {otherUser?.phone || conversation.phone || 'Text message'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search in conversation"
            title="Search in thread"
            className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              searchOpen
                ? `${theme.accentBgSoft}`
                : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E]'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label="Conversation details"
            title="Details & theme"
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] transition-colors cursor-pointer"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* In-Thread Search Bar */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-[#E1E5EB] dark:border-[#262930] bg-[#F8FAFD] dark:bg-[#111318] flex items-center gap-2 shrink-0">
          <Search className="w-4 h-4 text-[#747775] shrink-0" />
          <input
            type="text"
            autoFocus
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            placeholder="Find in this conversation..."
            className="flex-1 bg-transparent text-sm text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] focus:outline-none"
          />
          {threadSearch && (
            <span className="text-xs text-[#747775] tabular-nums">
              {sortedMessages.length} found
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setThreadSearch('');
            }}
            aria-label="Close thread search"
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#C4C7C5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Canvas */}
      <div className="flex-1 overflow-y-auto messages-scroll px-3 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Encryption Notice */}
          <div className="flex flex-col items-center text-center py-6 mb-2">
            <Avatar
              name={displayTitle}
              initials={displayInitials}
              avatarUrl={displayAvatarUrl}
              avatarColor={displayColor}
              isGroup={conversation.isGroup}
              size="xl"
            />
            <h3 className="font-display text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mt-3">
              {displayTitle}
            </h3>
            <p className="text-xs text-[#747775] dark:text-[#9AA0A6] mt-0.5 flex items-center gap-1.5">
              {conversation.transport === 'rcs' ? (
                <>
                  <Lock className="w-3 h-3" />
                  <span>RCS chat · End-to-end encrypted</span>
                </>
              ) : (
                <span>Standard SMS / MMS conversation</span>
              )}
            </p>
          </div>

          {sortedMessages.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#747775] dark:text-[#8E918F]">
              {threadSearch ? 'No messages match your search.' : 'Say hello to start the conversation.'}
            </div>
          ) : (
            sortedMessages.map((msg, idx) => {
              const prev = idx > 0 ? sortedMessages[idx - 1] : undefined;
              const next = idx < sortedMessages.length - 1 ? sortedMessages[idx + 1] : undefined;

              const showDateDivider =
                !prev || msg.timestamp - prev.timestamp > 45 * 60 * 1000;

              const isGroupedWithPrev =
                prev &&
                !showDateDivider &&
                prev.senderId === msg.senderId &&
                msg.timestamp - prev.timestamp < 3 * 60 * 1000;

              const isGroupedWithNext =
                next &&
                next.timestamp - msg.timestamp <= 45 * 60 * 1000 &&
                next.senderId === msg.senderId &&
                next.timestamp - msg.timestamp < 3 * 60 * 1000;

              const isFirstInGroup = !isGroupedWithPrev;
              const isLastInGroup = !isGroupedWithNext;
              const isOwn = msg.senderId === currentUser.id;
              const senderProfile = users.find((u) => u.id === msg.senderId);
              const replyToMessage = msg.replyToId
                ? messages.find((m) => m.id === msg.replyToId)
                : undefined;

              return (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-5">
                      <span className="text-[11px] font-medium text-[#747775] dark:text-[#8E918F] tabular-nums">
                        {formatDateDivider(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    isGroup={conversation.isGroup}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    showSenderName={isFirstInGroup}
                    sender={senderProfile}
                    replyToMessage={replyToMessage}
                    theme={theme}
                    currentUserId={currentUser.id}
                    showDeliveryStatus={
                      msg.id === latestOwnMessageId || isLastInGroup
                    }
                    onReact={onReact}
                    onReply={(m) => {
                      setReplyTo(m);
                      textareaRef.current?.focus();
                    }}
                    onToggleStar={onToggleStar}
                    onDelete={onDeleteMessage}
                    onOpenImage={onOpenImage}
                    onJumpToMessage={jumpToMessage}
                  />
                </div>
              );
            })
          )}

          {/* Live Typing Indicator Bubble */}
          {activeTypers.length > 0 && (
            <div className="flex items-end gap-2 mt-3">
              <div className="w-8 shrink-0">
                <Avatar
                  name={displayTitle}
                  initials={displayInitials}
                  avatarUrl={displayAvatarUrl}
                  avatarColor={displayColor}
                  size="sm"
                />
              </div>
              <div className="px-4 py-3 rounded-[20px] bg-[#E9EEF6] dark:bg-[#2B2E35] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#747775] dark:bg-[#9AA0A6] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#747775] dark:bg-[#9AA0A6] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#747775] dark:bg-[#9AA0A6] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Composer Area */}
      <div className="shrink-0 px-3 sm:px-6 pb-4 pt-2 bg-white dark:bg-[#16181D]">
        <div className="max-w-3xl mx-auto">
          {micError && (
            <div className="mb-2 px-4 py-2 rounded-xl bg-[#F9DEDC] dark:bg-[#8C1D18]/40 text-[#410E0B] dark:text-[#F9DEDC] text-xs flex items-center justify-between">
              <span>{micError}</span>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="p-1 hover:opacity-70 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reply Bar */}
          {replyTo && (
            <div className="mb-2 px-4 py-2.5 rounded-2xl bg-[#F0F4F9] dark:bg-[#1E2025] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${theme.accentText}`}>
                  Replying to {replyTo.senderId === currentUser.id ? 'yourself' : replyTo.senderName}
                </p>
                <p className="text-xs text-[#444746] dark:text-[#C4C7C5] truncate">
                  {replyTo.text || 'Attachment'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#C4C7C5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Attachments */}
          {attachments.length > 0 && (
            <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative shrink-0 rounded-2xl bg-[#F0F4F9] dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] overflow-hidden"
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.url}
                      alt={att.name || 'Preview'}
                      className="w-20 h-20 object-cover"
                    />
                  ) : (
                    <div className="h-20 px-3 flex items-center gap-2 max-w-[180px]">
                      {att.type === 'location' ? (
                        <MapPin className="w-4 h-4 shrink-0 text-[#0B57D0] dark:text-[#A8C7FA]" />
                      ) : (
                        <FileText className="w-4 h-4 shrink-0 text-[#0B57D0] dark:text-[#A8C7FA]" />
                      )}
                      <span className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                        {att.locationLabel || att.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                    }
                    aria-label="Remove attachment"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice Recording Active Bar OR Pill Composer */}
          {isRecording ? (
            <div className="flex items-center justify-between gap-3 h-13 px-4 rounded-full bg-[#F9DEDC] dark:bg-[#8C1D18]/35 text-[#410E0B] dark:text-[#F9DEDC]">
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                aria-label="Discard voice message"
                className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center hover:bg-black/10 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B3261E] animate-pulse" />
                <span className="text-sm font-medium tabular-nums">
                  Recording {formatDuration(recordSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                aria-label="Send voice message"
                className="h-9 px-4 rounded-full bg-[#B3261E] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Send</span>
              </button>
            </div>
          ) : (
            <div className="relative flex items-end gap-1.5 bg-[#EFF3F8] dark:bg-[#1E2025] rounded-[28px] px-2 py-1.5 border border-transparent focus-within:border-[#C2E7FF] dark:focus-within:border-[#004A77]">
              {/* Hidden File Picker */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* + Attachment Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu((v) => !v);
                    setShowEmojiPicker(false);
                  }}
                  aria-label="Add attachment"
                  title="Attach"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Plus className={`w-5 h-5 transition-transform ${showAttachMenu ? 'rotate-45' : ''}`} />
                </button>

                {showAttachMenu && (
                  <div className="absolute bottom-13 left-0 w-56 rounded-2xl bg-white dark:bg-[#23262E] border border-[#E1E5EB] dark:border-[#363942] shadow-xl py-1.5 z-40">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2E3138] flex items-center gap-3 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
                      <span>Photo or image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2E3138] flex items-center gap-3 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4 text-[#146C2E] dark:text-[#82E09A]" />
                      <span>Document or file</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAttachLocation}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2E3138] flex items-center gap-3 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#B3261E] dark:text-[#F2B8B5]" />
                      <span>Share location</span>
                    </button>
                    <button
                      type="button"
                      onClick={openScheduleModal}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2E3138] flex items-center gap-3 cursor-pointer"
                    >
                      <CalendarClock className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                      <span>Schedule send</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Emoji Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((v) => !v);
                    setShowAttachMenu(false);
                  }}
                  aria-label="Open emoji picker"
                  title="Emoji"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-13 left-0 w-72 p-3 rounded-2xl bg-white dark:bg-[#23262E] border border-[#E1E5EB] dark:border-[#363942] shadow-xl z-40">
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_BANK.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleDraftChange(draft + emoji)}
                          className="h-9 rounded-xl text-xl flex items-center justify-center hover:bg-[#EFF3F8] dark:hover:bg-[#2E3138] transition-transform active:scale-90 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-growing Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  conversation.transport === 'rcs' ? 'RCS message' : 'Text message'
                }
                aria-label="Message composer"
                className="flex-1 bg-transparent py-2.5 px-1 text-[15px] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] dark:placeholder-[#8E918F] resize-none focus:outline-none max-h-[140px] leading-5"
              />

              {/* Send or Voice Button */}
              {draft.trim().length > 0 || attachments.length > 0 ? (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => handleSubmit()}
                  aria-label="Send message"
                  title="Send"
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                    conversation.transport === 'rcs'
                      ? `${theme.outgoingRcsBg} ${theme.outgoingRcsText}`
                      : `${theme.outgoingSmsBg} ${theme.outgoingSmsText}`
                  }`}
                >
                  <SendHorizontal className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  aria-label="Record voice message"
                  title="Voice message"
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Send Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
              Schedule send
            </h3>
            <p className="text-xs text-[#747775] dark:text-[#9AA0A6] mt-1">
              Choose when this message will be delivered automatically.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={!draft.trim() && attachments.length === 0}
                onClick={() => handleSubmit(Date.now() + 10 * 1000)}
                className="w-full px-4 py-2.5 rounded-xl text-left text-sm bg-[#F8FAFD] dark:bg-[#262930] hover:bg-[#E9EEF6] dark:hover:bg-[#2E3138] text-[#1F1F1F] dark:text-[#E3E3E3] disabled:opacity-40 cursor-pointer"
              >
                In 10 seconds (quick test)
              </button>
              <button
                type="button"
                disabled={!draft.trim() && attachments.length === 0}
                onClick={() => handleSubmit(Date.now() + 30 * 60 * 1000)}
                className="w-full px-4 py-2.5 rounded-xl text-left text-sm bg-[#F8FAFD] dark:bg-[#262930] hover:bg-[#E9EEF6] dark:hover:bg-[#2E3138] text-[#1F1F1F] dark:text-[#E3E3E3] disabled:opacity-40 cursor-pointer"
              >
                In 30 minutes
              </button>
              <div className="pt-2">
                <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1.5">
                  Pick date and time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E5EB] dark:border-[#363942] bg-transparent text-sm text-[#1F1F1F] dark:text-[#E3E3E3]"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-full text-sm font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EFF3F8] dark:hover:bg-[#2A2D35] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  (!draft.trim() && attachments.length === 0) ||
                  !scheduleInput ||
                  new Date(scheduleInput).getTime() <= Date.now()
                }
                onClick={() => handleSubmit(new Date(scheduleInput).getTime())}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[#0B57D0] text-white dark:bg-[#A8C7FA] dark:text-[#062E6F] disabled:opacity-40 cursor-pointer"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
