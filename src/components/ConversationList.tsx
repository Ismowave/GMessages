import { useState, useRef, useEffect } from 'react';
import {
  Archive,
  ArchiveRestore,
  BellOff,
  Check,
  MessageSquarePlus,
  Moon,
  MoreVertical,
  Pin,
  Search,
  Star,
  Sun,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  Conversation,
  FilterTab,
  Message,
  UserProfile,
} from '../types/messages';
import { CONVERSATION_THEMES } from '../utils/themes';
import { formatConversationTime } from '../utils/formatTime';
import { Avatar } from './Avatar';

interface ConversationListProps {
  conversations: Conversation[];
  messages: Message[];
  users: UserProfile[];
  currentUser: UserProfile;
  onlineUserIds: string[];
  typingMap: Record<string, string[]>;
  selectedConversationId: string | null;
  activeFilter: FilterTab;
  searchQuery: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchUser: (userId: string) => void;
  onSelectConversation: (id: string) => void;
  onFilterChange: (filter: FilterTab) => void;
  onSearchChange: (q: string) => void;
  onOpenNewChat: () => void;
  onUpdateConversation: (
    id: string,
    patch: Partial<Pick<Conversation, 'isPinned' | 'isMuted' | 'isArchived'>> & {
      markUnreadFor?: string;
    },
  ) => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  messages,
  users,
  currentUser,
  onlineUserIds,
  typingMap,
  selectedConversationId,
  activeFilter,
  searchQuery,
  isDark,
  onToggleTheme,
  onSwitchUser,
  onSelectConversation,
  onFilterChange,
  onSearchChange,
  onOpenNewChat,
  onUpdateConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      setMenuOpenId(null);
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const getLastMessage = (convId: string): Message | undefined => {
    const convMsgs = messages
      .filter((m) => m.conversationId === convId && m.status !== 'scheduled')
      .sort((a, b) => a.timestamp - b.timestamp);
    return convMsgs[convMsgs.length - 1];
  };

  const getPreviewText = (conv: Conversation, lastMsg?: Message): string => {
    const typingUsers = (typingMap[conv.id] || []).filter((uid) => uid !== currentUser.id);
    if (typingUsers.length > 0) {
      const typer = users.find((u) => u.id === typingUsers[0]);
      return conv.isGroup && typer ? `${typer.name.split(' ')[0]} is typing...` : 'Typing...';
    }
    if (!lastMsg) return conv.transport === 'rcs' ? 'RCS chat · Start messaging' : 'Text message';
    const prefix = lastMsg.senderId === currentUser.id ? 'You: ' : conv.isGroup ? `${lastMsg.senderName.split(' ')[0]}: ` : '';
    if (lastMsg.text) return `${prefix}${lastMsg.text}`;
    const att = lastMsg.attachments?.[0];
    if (att?.type === 'image') return `${prefix}Sent a photo`;
    if (att?.type === 'audio') return `${prefix}Voice message`;
    if (att?.type === 'location') return `${prefix}Shared a location`;
    if (att?.type === 'file') return `${prefix}Sent an attachment`;
    return `${prefix}Message`;
  };

  const starredMatches = messages.filter((m) => m.isStarred);

  const filteredConversations = conversations
    .filter((conv) => {
      if (activeFilter === 'archived') {
        if (!conv.isArchived) return false;
      } else {
        if (conv.isArchived) return false;
        if (activeFilter === 'unread' && (conv.unreadBy[currentUser.id] || 0) === 0) {
          return false;
        }
        if (
          activeFilter === 'starred' &&
          !starredMatches.some((m) => m.conversationId === conv.id)
        ) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (conv.title.toLowerCase().includes(q)) return true;
      if (conv.phone?.toLowerCase().includes(q)) return true;
      return messages.some(
        (m) => m.conversationId === conv.id && m.text.toLowerCase().includes(q),
      );
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.lastMessageAt - a.lastMessageAt;
    });

  const unreadTotal = conversations.filter(
    (c) => !c.isArchived && (c.unreadBy[currentUser.id] || 0) > 0,
  ).length;
  const archivedTotal = conversations.filter((c) => c.isArchived).length;

  return (
    <aside className="relative flex flex-col h-full w-full lg:w-[376px] xl:w-[400px] shrink-0 bg-[#F8FAFD] dark:bg-[#111318] border-r border-[#E1E5EB] dark:border-[#262930]">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 h-16 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-white dark:text-[#062E6F] fill-current"
              aria-hidden="true"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
          <h1 className="font-display text-[21px] font-semibold tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3] whitespace-nowrap shrink-0">
            Messages
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6] dark:hover:bg-[#23262E] transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Active Profile Switcher for Multi-Device Testing */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileMenuOpen((v) => !v);
              }}
              aria-label="Switch active sender identity"
              title={`Signed in as ${currentUser.name}`}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:bg-[#E9EEF6] dark:hover:bg-[#23262E] transition-colors cursor-pointer"
            >
              <Avatar
                name={currentUser.name}
                initials={currentUser.initials}
                avatarUrl={currentUser.avatarUrl}
                avatarColor={currentUser.avatarColor}
                size="sm"
              />
            </button>

            {profileMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] shadow-xl py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-[#E1E5EB] dark:border-[#2E3138]">
                  <p className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">
                    Active profile
                  </p>
                  <p className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-[#747775] dark:text-[#8E918F] tabular-nums">
                    {currentUser.phone}
                  </p>
                </div>
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[11px] font-medium text-[#747775] dark:text-[#8E918F]">
                    Switch sender (test live sync across tabs)
                  </p>
                </div>
                <div className="max-h-56 overflow-y-auto messages-scroll">
                  {users
                    .filter((u) => u.phone !== '44281')
                    .map((u) => {
                      const active = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u.id);
                            setProfileMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 flex items-center gap-2.5 text-left hover:bg-[#F1F4F9] dark:hover:bg-[#2A2D35] transition-colors cursor-pointer"
                        >
                          <Avatar
                            name={u.name}
                            initials={u.initials}
                            avatarUrl={u.avatarUrl}
                            avatarColor={u.avatarColor}
                            isOnline={onlineUserIds.includes(u.id)}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                              {u.name}
                            </p>
                            <p className="text-xs text-[#747775] dark:text-[#8E918F] truncate tabular-nums">
                              {u.phone}
                            </p>
                          </div>
                          {active && (
                            <UserCheck className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 pb-2 shrink-0">
        <div className="relative flex items-center bg-[#E9EEF6] dark:bg-[#1E2025] rounded-full h-11 px-4 transition-colors focus-within:ring-2 focus-within:ring-[#0B57D0]/40 dark:focus-within:ring-[#A8C7FA]/40">
          <Search className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5] shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full bg-transparent text-sm text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#444746] dark:placeholder-[#8E918F] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadTotal > 0 ? `Unread (${unreadTotal})` : 'Unread' },
            { id: 'starred', label: 'Starred' },
            {
              id: 'archived',
              label: archivedTotal > 0 ? `Archived (${archivedTotal})` : 'Archived',
            },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF]'
                  : 'bg-transparent text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6] dark:hover:bg-[#1E2025]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto messages-scroll px-2 pb-24">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-12 h-12 rounded-full bg-[#E9EEF6] dark:bg-[#1E2025] flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] mb-3">
              {activeFilter === 'archived' ? (
                <Archive className="w-5 h-5" />
              ) : activeFilter === 'starred' ? (
                <Star className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
              {searchQuery
                ? 'No matching conversations'
                : activeFilter === 'unread'
                  ? 'All caught up'
                  : activeFilter === 'starred'
                    ? 'No starred messages yet'
                    : activeFilter === 'archived'
                      ? 'No archived conversations'
                      : 'No conversations yet'}
            </p>
            <p className="text-xs text-[#747775] dark:text-[#8E918F] mt-1 max-w-[240px]">
              {searchQuery
                ? 'Try searching by contact name, phone number, or message text.'
                : 'Tap Start chat to message a contact or create a group.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              const lastMsg = getLastMessage(conv.id);
              const unread = conv.unreadBy[currentUser.id] || 0;
              const theme = CONVERSATION_THEMES[conv.theme] || CONVERSATION_THEMES.blue;
              const otherParticipantId = conv.participantIds.find((id) => id !== currentUser.id);
              const otherUser = otherParticipantId
                ? users.find((u) => u.id === otherParticipantId)
                : undefined;
              const isOnline = !conv.isGroup && otherUser ? onlineUserIds.includes(otherUser.id) : false;
              const displayTitle = conv.isGroup ? conv.title : otherUser?.name || conv.title;
              const displayAvatarUrl = conv.isGroup ? undefined : otherUser?.avatarUrl || conv.avatarUrl;
              const displayInitials = conv.isGroup ? conv.initials : otherUser?.initials || conv.initials;
              const displayColor = conv.isGroup ? conv.avatarColor : otherUser?.avatarColor || conv.avatarColor;
              const isTyping =
                (typingMap[conv.id] || []).filter((uid) => uid !== currentUser.id).length > 0;

              return (
                <li key={conv.id} className="relative group">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectConversation(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectConversation(conv.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] ${
                      isSelected
                        ? 'bg-[#D3E3FD]/70 dark:bg-[#004A77]/45'
                        : 'hover:bg-[#EFF3F8] dark:hover:bg-[#1E2025]'
                    }`}
                  >
                    <Avatar
                      name={displayTitle}
                      initials={displayInitials}
                      avatarUrl={displayAvatarUrl}
                      avatarColor={displayColor}
                      isGroup={conv.isGroup}
                      isOnline={isOnline}
                      size="lg"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-[15px] truncate ${
                            unread > 0
                              ? 'font-semibold text-[#1F1F1F] dark:text-white'
                              : 'font-medium text-[#1F1F1F] dark:text-[#E3E3E3]'
                          }`}
                        >
                          {displayTitle}
                        </span>
                        <span
                          className={`text-[11px] shrink-0 tabular-nums ${
                            unread > 0
                              ? `font-semibold ${theme.accentText}`
                              : 'text-[#747775] dark:text-[#8E918F]'
                          }`}
                        >
                          {formatConversationTime(lastMsg?.timestamp || conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={`text-[13px] truncate ${
                            isTyping
                              ? `font-medium ${theme.accentText}`
                              : unread > 0
                                ? 'font-medium text-[#1F1F1F] dark:text-[#E3E3E3]'
                                : 'text-[#444746] dark:text-[#9AA0A6]'
                          }`}
                        >
                          {getPreviewText(conv, lastMsg)}
                        </p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {conv.isMuted && (
                            <BellOff className="w-3.5 h-3.5 text-[#747775] dark:text-[#8E918F]" />
                          )}
                          {conv.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-[#747775] dark:text-[#8E918F] rotate-45" />
                          )}
                          {unread > 0 && (
                            <span
                              className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center tabular-nums ${theme.unreadBadge}`}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row quick menu trigger */}
                    <button
                      type="button"
                      aria-label={`More options for ${displayTitle}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 transition-opacity shrink-0 cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {menuOpenId === conv.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-3 top-12 w-48 rounded-2xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] shadow-xl py-1.5 z-40"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConversation(conv.id, { isPinned: !conv.isPinned });
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2A2D35] flex items-center gap-2.5 cursor-pointer"
                      >
                        <Pin className="w-4 h-4" />
                        {conv.isPinned ? 'Unpin' : 'Pin to top'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConversation(conv.id, { isMuted: !conv.isMuted });
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2A2D35] flex items-center gap-2.5 cursor-pointer"
                      >
                        <BellOff className="w-4 h-4" />
                        {conv.isMuted ? 'Unmute notifications' : 'Mute notifications'}
                      </button>
                      {unread === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateConversation(conv.id, { markUnreadFor: currentUser.id });
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2A2D35] flex items-center gap-2.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Mark as unread
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConversation(conv.id, { isArchived: !conv.isArchived });
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F4F9] dark:hover:bg-[#2A2D35] flex items-center gap-2.5 cursor-pointer"
                      >
                        {conv.isArchived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                        {conv.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      <div className="my-1 border-t border-[#E1E5EB] dark:border-[#2E3138]" />
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteConversation(conv.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#F9DEDC]/40 dark:hover:bg-[#8C1D18]/20 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Material 3 Start Chat FAB */}
      <button
        type="button"
        onClick={onOpenNewChat}
        className="absolute bottom-5 right-5 h-14 px-5 rounded-2xl bg-[#C2E7FF] hover:bg-[#A8D8FA] dark:bg-[#004A77] dark:hover:bg-[#005B94] text-[#001D35] dark:text-[#C2E7FF] shadow-lg shadow-black/10 dark:shadow-black/40 flex items-center gap-2.5 font-display text-sm font-semibold transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span>Start chat</span>
      </button>
    </aside>
  );
}
