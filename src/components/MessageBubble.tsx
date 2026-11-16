import { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Copy,
  FileText,
  Lock,
  MapPin,
  Pause,
  Play,
  Reply,
  SmilePlus,
  Star,
  Trash2,
} from 'lucide-react';
import type { Message, UserProfile } from '../types/messages';
import type { ThemePalette } from '../utils/themes';
import { formatDuration, formatMessageTimestamp } from '../utils/formatTime';
import { Avatar } from './Avatar';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGroup: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showSenderName: boolean;
  sender?: UserProfile;
  replyToMessage?: Message;
  theme: ThemePalette;
  currentUserId: string;
  showDeliveryStatus: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onToggleStar: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onOpenImage: (url: string, caption?: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

function AudioAttachmentPlayer({
  url,
  durationSec = 0,
  isOwn,
}: {
  url: string;
  durationSec?: number;
  isOwn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 min-w-[210px] py-0.5">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio) return;
          setCurrentTime(audio.currentTime);
          const total = audio.duration || durationSec || 1;
          setProgress(Math.min(100, (audio.currentTime / total) * 100));
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30 dark:bg-black/15 dark:hover:bg-black/25'
            : 'bg-[#0B57D0]/12 hover:bg-[#0B57D0]/20 text-[#0B57D0] dark:bg-[#A8C7FA]/20 dark:text-[#A8C7FA]'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-0.5 h-5">
          {[35, 65, 90, 50, 80, 45, 70, 95, 60, 40, 75, 55, 85, 50, 65, 40].map((h, i) => {
            const filled = (i / 16) * 100 <= progress;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  filled
                    ? 'bg-current opacity-100'
                    : 'bg-current opacity-35'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <span className="text-[11px] opacity-80 tabular-nums">
          {isPlaying ? formatDuration(currentTime) : formatDuration(durationSec)}
        </span>
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  isOwn,
  isGroup,
  isFirstInGroup,
  isLastInGroup,
  showSenderName,
  sender,
  replyToMessage,
  theme,
  currentUserId,
  showDeliveryStatus,
  onReact,
  onReply,
  onToggleStar,
  onDelete,
  onOpenImage,
  onJumpToMessage,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasReactions = Object.keys(message.reactions || {}).length > 0;
  const isRcs = message.transport === 'rcs';

  // Authentic Google Messages grouped bubble corner geometry
  const bubbleRadius = isOwn
    ? [
        'rounded-l-[20px]',
        isFirstInGroup ? 'rounded-tr-[20px]' : 'rounded-tr-[6px]',
        isLastInGroup ? 'rounded-br-[20px]' : 'rounded-br-[6px]',
      ].join(' ')
    : [
        'rounded-r-[20px]',
        isFirstInGroup ? 'rounded-tl-[20px]' : 'rounded-tl-[6px]',
        isLastInGroup ? 'rounded-bl-[20px]' : 'rounded-bl-[6px]',
      ].join(' ');

  const bubbleColors = isOwn
    ? isRcs
      ? `${theme.outgoingRcsBg} ${theme.outgoingRcsText}`
      : `${theme.outgoingSmsBg} ${theme.outgoingSmsText}`
    : 'bg-[#E9EEF6] text-[#1F1F1F] dark:bg-[#2B2E35] dark:text-[#E3E3E3]';

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${
        isFirstInGroup ? 'mt-3' : 'mt-0.5'
      } ${hasReactions ? 'mb-3' : ''}`}
      onMouseLeave={() => setShowPicker(false)}
    >
      {showSenderName && !isOwn && isGroup && (
        <span className="text-[11px] font-medium text-[#444746] dark:text-[#9AA0A6] ml-11 mb-1">
          {message.senderName}
        </span>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[72%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar slot for incoming group/last-in-group messages */}
        {!isOwn && (
          <div className="w-8 shrink-0">
            {isLastInGroup && (
              <Avatar
                name={sender?.name || message.senderName}
                initials={sender?.initials || message.senderName.slice(0, 2).toUpperCase()}
                avatarUrl={sender?.avatarUrl}
                avatarColor={sender?.avatarColor || '#0B57D0'}
                size="sm"
              />
            )}
          </div>
        )}

        {/* Bubble + Floating Reaction Anchor */}
        <div className="relative">
          <div
            className={`px-4 py-2.5 text-[15px] leading-[1.45] break-words transition-colors ${bubbleRadius} ${bubbleColors} ${
              message.status === 'scheduled' ? 'opacity-80 border border-dashed border-current/40' : ''
            }`}
          >
            {/* Quoted Reply Block */}
            {replyToMessage && (
              <button
                type="button"
                onClick={() => onJumpToMessage(replyToMessage.id)}
                className={`w-full text-left mb-2 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isOwn
                    ? 'bg-black/10 dark:bg-black/15 hover:bg-black/15'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                }`}
              >
                <p className="font-semibold truncate opacity-90">
                  {replyToMessage.senderId === currentUserId ? 'You' : replyToMessage.senderName}
                </p>
                <p className="truncate opacity-75">
                  {replyToMessage.text || 'Attachment'}
                </p>
              </button>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2 mb-1.5">
                {message.attachments.map((att) => {
                  if (att.type === 'image') {
                    return (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => onOpenImage(att.url, message.text)}
                        className="block overflow-hidden rounded-xl cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <img
                          src={att.url}
                          alt={att.name || 'Shared photo'}
                          referrerPolicy="no-referrer"
                          className="max-h-64 max-w-full rounded-xl object-cover"
                        />
                      </button>
                    );
                  }
                  if (att.type === 'audio') {
                    return (
                      <AudioAttachmentPlayer
                        key={att.id}
                        url={att.url}
                        durationSec={att.durationSec}
                        isOwn={isOwn}
                      />
                    );
                  }
                  if (att.type === 'location') {
                    return (
                      <div
                        key={att.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl ${
                          isOwn ? 'bg-black/10' : 'bg-black/5 dark:bg-white/10'
                        }`}
                      >
                        <MapPin className="w-5 h-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {att.locationLabel || 'Shared Location'}
                          </p>
                          {att.coordinates && (
                            <p className="text-[11px] opacity-80 font-mono tabular-nums">
                              {att.coordinates}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={att.id}
                      href={att.url}
                      download={att.name || 'attachment'}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl ${
                        isOwn ? 'bg-black/10 hover:bg-black/15' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                      }`}
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{att.name || 'File'}</p>
                        {att.size && (
                          <p className="text-[11px] opacity-75 tabular-nums">
                            {Math.max(1, Math.round(att.size / 1024))} KB
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Message Text */}
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

            {/* Scheduled badge inside bubble */}
            {message.status === 'scheduled' && message.scheduledFor && (
              <div className="flex items-center gap-1 mt-1 text-[11px] opacity-85 tabular-nums">
                <Clock className="w-3 h-3" />
                <span>Scheduled for {formatMessageTimestamp(message.scheduledFor)}</span>
              </div>
            )}

            {/* Starred indicator */}
            {message.isStarred && (
              <span
                title="Starred message"
                className="inline-flex items-center gap-1 mt-1 text-[11px] opacity-80"
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Starred</span>
              </span>
            )}
          </div>

          {/* Floating Emoji Reactions */}
          {hasReactions && (
            <div
              className={`absolute -bottom-3.5 ${
                isOwn ? 'left-2' : 'right-2'
              } flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white dark:bg-[#23262E] border border-[#E1E5EB] dark:border-[#363942] shadow-sm z-10`}
            >
              {Object.entries(message.reactions).map(([emoji, userIds]) => {
                const reactedByMe = userIds.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(message.id, emoji)}
                    className={`px-1 rounded-full text-xs flex items-center gap-0.5 transition-colors cursor-pointer ${
                      reactedByMe ? 'bg-[#D3E3FD]/70 dark:bg-[#004A77]' : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <span>{emoji}</span>
                    {userIds.length > 1 && (
                      <span className="text-[10px] font-medium text-[#444746] dark:text-[#C4C7C5] tabular-nums">
                        {userIds.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover Action Toolbar */}
        <div
          className={`relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            aria-label="Add reaction"
            title="React"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#747775] dark:text-[#9AA0A6] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] cursor-pointer"
          >
            <SmilePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply"
            title="Reply"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#747775] dark:text-[#9AA0A6] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] cursor-pointer"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleStar(message.id)}
            aria-label={message.isStarred ? 'Unstar message' : 'Star message'}
            title={message.isStarred ? 'Unstar' : 'Star'}
            className={`w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] cursor-pointer ${
              message.isStarred
                ? 'text-[#E37400] dark:text-[#FDD663]'
                : 'text-[#747775] dark:text-[#9AA0A6]'
            }`}
          >
            <Star className={`w-4 h-4 ${message.isStarred ? 'fill-current' : ''}`} />
          </button>
          {message.text && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy text"
              title={copied ? 'Copied' : 'Copy'}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#747775] dark:text-[#9AA0A6] hover:bg-[#EFF3F8] dark:hover:bg-[#23262E] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#146C2E]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            aria-label="Delete message"
            title="Delete"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#747775] dark:text-[#9AA0A6] hover:text-[#B3261E] hover:bg-[#F9DEDC]/50 dark:hover:bg-[#8C1D18]/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {showPicker && (
            <div
              className={`absolute bottom-9 ${
                isOwn ? 'right-0' : 'left-0'
              } flex items-center gap-1 px-2 py-1.5 rounded-full bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] shadow-xl z-30`}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowPicker(false);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-[#EFF3F8] dark:hover:bg-[#2A2D35] hover:scale-110 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delivery receipt + timestamp on the last message of a group */}
      {showDeliveryStatus && isLastInGroup && (
        <div
          className={`flex items-center gap-1.5 mt-1 text-[11px] text-[#747775] dark:text-[#8E918F] tabular-nums ${
            isOwn ? 'pr-1' : 'pl-10'
          }`}
        >
          <span>{formatMessageTimestamp(message.timestamp)}</span>
          {isOwn && (
            <>
              <span aria-hidden="true">·</span>
              {isRcs && <Lock className="w-2.5 h-2.5" aria-label="End-to-end encrypted" />}
              <span className="flex items-center gap-0.5">
                {message.status === 'read' ? (
                  <>
                    <span>Read</span>
                    <CheckCheck className={`w-3.5 h-3.5 ${theme.accentText}`} />
                  </>
                ) : message.status === 'delivered' ? (
                  <>
                    <span>Delivered</span>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </>
                ) : message.status === 'scheduled' ? (
                  <span>Scheduled</span>
                ) : (
                  <>
                    <span>Sent</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                )}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
