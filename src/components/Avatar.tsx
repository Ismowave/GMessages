import { useState } from 'react';
import { Users } from 'lucide-react';

interface AvatarProps {
  name: string;
  initials: string;
  avatarUrl?: string;
  avatarColor: string;
  isGroup?: boolean;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({
  name,
  initials,
  avatarUrl,
  avatarColor,
  isGroup = false,
  isOnline = false,
  size = 'md',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative shrink-0 ${SIZE_CLASSES[size]} select-none`}>
      {avatarUrl && !imgError && !isGroup ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover bg-[#E9EEF6] dark:bg-[#2B2E35]"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-display font-semibold text-white tracking-tight"
          style={{ backgroundColor: avatarColor }}
          aria-label={name}
        >
          {isGroup ? <Users className="w-1/2 h-1/2 stroke-[2]" /> : initials}
        </div>
      )}

      {isOnline && (
        <span
          title="Connected live"
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#146C2E] dark:bg-[#82E09A] ring-2 ring-white dark:ring-[#16181D]"
        />
      )}
    </div>
  );
}
