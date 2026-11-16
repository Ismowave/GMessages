import { useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import type { UserProfile } from '../types/messages';
import { Avatar } from './Avatar';

interface NewChatModalProps {
  users: UserProfile[];
  currentUserId: string;
  onClose: () => void;
  onCreateConversation: (payload: {
    title: string;
    phone?: string;
    participantIds?: string[];
  }) => Promise<void>;
}

export function NewChatModal({
  users,
  currentUserId,
  onClose,
  onCreateConversation,
}: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const availableContacts = users.filter(
    (u) => u.id !== currentUserId && u.phone !== '44281',
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleStartDirect = async (contact: UserProfile) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onCreateConversation({
        title: contact.name,
        phone: contact.phone,
        participantIds: [currentUserId, contact.id],
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (mode === 'direct') {
      if (!nameInput.trim()) return;
      setSubmitting(true);
      try {
        await onCreateConversation({
          title: nameInput.trim(),
          phone: phoneInput.trim() || undefined,
        });
        onClose();
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!nameInput.trim() || selectedIds.length < 2) return;
      setSubmitting(true);
      try {
        await onCreateConversation({
          title: nameInput.trim(),
          participantIds: [currentUserId, ...selectedIds],
        });
        onClose();
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1E2025] border border-[#E1E5EB] dark:border-[#2E3138] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#E1E5EB] dark:border-[#2E3138]">
          <h2 className="font-display text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
            New conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EFF3F8] dark:hover:bg-[#2A2D35] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFF3F8] dark:bg-[#262930]">
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === 'direct'
                  ? 'bg-white dark:bg-[#1E2025] text-[#1F1F1F] dark:text-white shadow-xs'
                  : 'text-[#444746] dark:text-[#9AA0A6]'
              }`}
            >
              Direct message
            </button>
            <button
              type="button"
              onClick={() => setMode('group')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'group'
                  ? 'bg-white dark:bg-[#1E2025] text-[#1F1F1F] dark:text-white shadow-xs'
                  : 'text-[#444746] dark:text-[#9AA0A6]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Create group</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateCustom} className="p-6 space-y-4 overflow-y-auto messages-scroll">
          <div>
            <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1.5">
              {mode === 'direct' ? 'Recipient name' : 'Group name'}
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={mode === 'direct' ? 'e.g. Jordan Patel' : 'e.g. Weekend Trip'}
              className="w-full h-11 px-4 rounded-xl bg-[#F8FAFD] dark:bg-[#16181D] border border-[#E1E5EB] dark:border-[#363942] text-sm text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40"
            />
          </div>

          {mode === 'direct' && (
            <div>
              <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1.5">
                Phone number (optional)
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+1 (415) 555-0199"
                className="w-full h-11 px-4 rounded-xl bg-[#F8FAFD] dark:bg-[#16181D] border border-[#E1E5EB] dark:border-[#363942] text-sm text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 tabular-nums"
              />
            </div>
          )}

          {mode === 'direct' && nameInput.trim() && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#062E6F] text-sm font-semibold transition-colors cursor-pointer"
            >
              Start chat with {nameInput.trim()}
            </button>
          )}

          <div>
            <p className="text-xs font-medium text-[#747775] dark:text-[#9AA0A6] mb-2">
              {mode === 'direct'
                ? 'Or pick a contact'
                : `Select at least 2 participants (${selectedIds.length} selected)`}
            </p>
            <ul className="space-y-1">
              {availableContacts.map((contact) => {
                const checked = selectedIds.includes(contact.id);
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() =>
                        mode === 'direct'
                          ? handleStartDirect(contact)
                          : toggleMember(contact.id)
                      }
                      className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        checked
                          ? 'bg-[#D3E3FD]/60 dark:bg-[#004A77]/50'
                          : 'hover:bg-[#EFF3F8] dark:hover:bg-[#262930]'
                      }`}
                    >
                      <Avatar
                        name={contact.name}
                        initials={contact.initials}
                        avatarUrl={contact.avatarUrl}
                        avatarColor={contact.avatarColor}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-[#747775] dark:text-[#8E918F] tabular-nums">
                          {contact.phone}
                        </p>
                      </div>
                      {mode === 'group' && (
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            checked
                              ? 'bg-[#0B57D0] border-[#0B57D0] dark:bg-[#A8C7FA] dark:border-[#A8C7FA] text-white dark:text-[#062E6F]'
                              : 'border-[#747775] dark:border-[#8E918F]'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {mode === 'group' && (
            <button
              type="submit"
              disabled={submitting || !nameInput.trim() || selectedIds.length < 2}
              className="w-full h-11 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#062E6F] text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            >
              Create group chat
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
