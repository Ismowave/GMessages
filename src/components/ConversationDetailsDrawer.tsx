import {
  Archive,
  BellOff,
  Check,
  Lock,
  Palette,
  Pin,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Conversation,
  ConversationTheme,
  Message,
  TransportType,
  UserProfile,
} from '../types/messages';
import { CONVERSATION_THEMES } from '../utils/themes';
import { Avatar } from './Avatar';

interface ConversationDetailsDrawerProps {
  conversation: Conversation;
  messages: Message[];
  users: UserProfile[];
  currentUserId: string;
  onClose: () => void;
  onUpdateConversation: (
    patch: Partial<
      Pick<Conversation, 'isPinned' | 'isMuted' | 'isArchived' | 'theme' | 'transport'>
    >,
  ) => void;
  onDeleteConversation: () => void;
  onOpenImage: (url: string, caption?: string) => void;
}

export function ConversationDetailsDrawer({
  conversation,
  messages,
  users,
  currentUserId,
  onClose,
  onUpdateConversation,
  onDeleteConversation,
  onOpenImage,
}: ConversationDetailsDrawerProps) {
  const participants = users.filter((u) => conversation.participantIds.includes(u.id));
  const otherUsers = participants.filter((u) => u.id !== currentUserId);
  const primaryOther = otherUsers[0];
  const displayTitle = conversation.isGroup
    ? conversation.title
    : primaryOther?.name || conversation.title;
  const displayAvatarUrl = conversation.isGroup
    ? undefined
    : primaryOther?.avatarUrl || conversation.avatarUrl;
  const displayInitials = conversation.isGroup
    ? conversation.initials
    : primaryOther?.initials || conversation.initials;
  const displayColor = conversation.isGroup
    ? conversation.avatarColor
    : primaryOther?.avatarColor || conversation.avatarColor;

  const sharedImages = messages.flatMap((m) =>
    (m.attachments || [])
      .filter((a) => a.type === 'image')
      .map((a) => ({ ...a, caption: m.text })),
  );
  const starredMessages = messages.filter((m) => m.isStarred);

  return (
    <aside className="w-full sm:w-80 lg:w-84 shrink-0 h-full bg-[#F8FAFD] dark:bg-[#111318] border-l border-[#E1E5EB] dark:border-[#262930] flex flex-col z-30 fixed inset-y-0 right-0 lg:static">
      <header className="h-16 px-4 flex items-center justify-between border-b border-[#E1E5EB] dark:border-[#262930] shrink-0">
        <h3 className="font-display text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
          Details
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6] dark:hover:bg-[#23262E] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto messages-scroll p-4 space-y-6">
        {/* Profile Summary */}
        <div className="flex flex-col items-center text-center pt-2">
          <Avatar
            name={displayTitle}
            initials={displayInitials}
            avatarUrl={displayAvatarUrl}
            avatarColor={displayColor}
            isGroup={conversation.isGroup}
            size="xl"
          />
          <h4 className="font-display text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mt-3">
            {displayTitle}
          </h4>
          {!conversation.isGroup && (primaryOther?.phone || conversation.phone) && (
            <p className="text-xs text-[#747775] dark:text-[#9AA0A6] tabular-nums mt-0.5">
              {primaryOther?.phone || conversation.phone}
            </p>
          )}
        </div>

        {/* Transport Selector (RCS vs SMS) */}
        <div>
          <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2">
            Messaging protocol
          </p>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#E9EEF6] dark:bg-[#1E2025]">
            {(
              [
                { id: 'rcs', label: 'RCS chat' },
                { id: 'sms', label: 'SMS text' },
              ] as { id: TransportType; label: string }[]
            ).map((mode) => {
              const active = conversation.transport === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdateConversation({ transport: mode.id })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#2B2E35] text-[#1F1F1F] dark:text-white shadow-xs'
                      : 'text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Material You Theme Color Picker */}
        <div>
          <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>Chat color</span>
          </p>
          <div className="flex items-center gap-2.5">
            {(Object.keys(CONVERSATION_THEMES) as ConversationTheme[]).map((key) => {
              const palette = CONVERSATION_THEMES[key];
              const selected = conversation.theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={palette.label}
                  aria-label={`Set chat color to ${palette.label}`}
                  onClick={() => onUpdateConversation({ theme: key })}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    selected ? 'ring-2 ring-offset-2 ring-[#1F1F1F] dark:ring-white dark:ring-offset-[#111318] scale-105' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: palette.swatch }}
                >
                  {selected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="space-y-1 border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
          <button
            type="button"
            onClick={() => onUpdateConversation({ isPinned: !conversation.isPinned })}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[#EFF3F8] dark:hover:bg-[#1E2025] flex items-center justify-between text-sm text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Pin className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5]" />
              <span>{conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateConversation({ isMuted: !conversation.isMuted })}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[#EFF3F8] dark:hover:bg-[#1E2025] flex items-center justify-between text-sm text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <BellOff className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5]" />
              <span>{conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateConversation({ isArchived: !conversation.isArchived })}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[#EFF3F8] dark:hover:bg-[#1E2025] flex items-center justify-between text-sm text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Archive className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5]" />
              <span>{conversation.isArchived ? 'Unarchive' : 'Archive'}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onDeleteConversation}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[#F9DEDC]/60 dark:hover:bg-[#8C1D18]/30 flex items-center justify-between text-sm text-[#B3261E] dark:text-[#F2B8B5] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Trash2 className="w-4 h-4" />
              <span>Delete conversation</span>
            </span>
          </button>
        </div>

        {/* Group Participants */}
        {conversation.isGroup && (
          <div className="border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
            <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2.5">
              People ({participants.length})
            </p>
            <ul className="space-y-2">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5">
                  <Avatar
                    name={p.name}
                    initials={p.initials}
                    avatarUrl={p.avatarUrl}
                    avatarColor={p.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                      {p.id === currentUserId ? `${p.name} (You)` : p.name}
                    </p>
                    <p className="text-xs text-[#747775] dark:text-[#8E918F] tabular-nums">
                      {p.phone}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shared Media */}
        {sharedImages.length > 0 && (
          <div className="border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
            <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2.5">
              Shared media ({sharedImages.length})
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {sharedImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onOpenImage(img.url, img.caption)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#E9EEF6] dark:bg-[#1E2025] cursor-zoom-in"
                >
                  <img
                    src={img.url}
                    alt={img.name || 'Shared photo'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Starred Messages */}
        {starredMessages.length > 0 && (
          <div className="border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
            <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              <span>Starred messages ({starredMessages.length})</span>
            </p>
            <div className="space-y-2">
              {starredMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138]"
                >
                  <p className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">
                    {m.senderName}
                  </p>
                  <p className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3] mt-0.5 line-clamp-2">
                    {m.text || 'Attachment'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E2EE Verification */}
        {conversation.transport === 'rcs' && conversation.encryptionCode && (
          <div className="border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138]">
              <p className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#146C2E] dark:text-[#82E09A]" />
                <span>End-to-end encryption</span>
              </p>
              <p className="text-[11px] text-[#747775] dark:text-[#9AA0A6] mt-1">
                Verification code for this RCS conversation:
              </p>
              <p className="mt-2 font-mono text-xs text-[#444746] dark:text-[#C4C7C5] tabular-nums leading-relaxed">
                {conversation.encryptionCode}
              </p>
            </div>
          </div>
        )}

        {conversation.transport === 'sms' && (
          <div className="border-t border-[#E1E5EB] dark:border-[#262930] pt-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#747775] shrink-0 mt-0.5" />
              <p className="text-xs text-[#747775] dark:text-[#9AA0A6]">
                Messages in SMS mode are not end-to-end encrypted. Switch to RCS chat above for encrypted delivery and read receipts.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
