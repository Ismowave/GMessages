import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  isSyncing,
  pendingCount,
}) => {
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mx-4 mb-2 px-3.5 py-2 rounded-2xl flex items-center justify-between gap-2 text-[12px] font-medium transition-colors ${
        !isOnline
          ? 'bg-[#2C2220] text-[#F2A89B] border border-[#F2A89B]/20'
          : 'bg-[#1D2838] text-[#A8C7FA] border border-[#669DF6]/25'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {!isOnline ? (
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <RefreshCw
            className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
          />
        )}
        <span className="truncate">
          {!isOnline
            ? pendingCount > 0
              ? `Offline · ${pendingCount} change${pendingCount === 1 ? '' : 's'} saved locally`
              : 'Offline mode · Working locally'
            : isSyncing
              ? `Syncing ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}...`
              : `${pendingCount} change${pendingCount === 1 ? '' : 's'} saved locally`}
        </span>
      </div>
      {!isOnline && (
        <span className="text-[11px] text-[#E8EAED]/75 shrink-0">Local</span>
      )}
    </div>
  );
};
