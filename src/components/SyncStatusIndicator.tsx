import { useState, useEffect } from 'react';
import { useSyncState, type SyncStatus } from '../lib/syncManager';
import { cn } from '../lib/utils';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  WifiOff,
  Shield,
  ShieldOff
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<SyncStatus, {
  icon: typeof Cloud;
  color: string;
  bgColor: string;
  text: string;
  animate?: boolean;
}> = {
  idle: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    text: 'Senkronize'
  },
  syncing: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    text: 'Senkronize ediliyor...',
    animate: true
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    text: 'Senkronizasyon hatası'
  },
  offline: {
    icon: WifiOff,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    text: 'Çevrimdışı'
  }
};

const sizeConfig = {
  sm: {
    iconSize: 'w-4 h-4',
    textSize: 'text-xs',
    padding: 'px-2 py-1',
    gap: 'gap-1'
  },
  md: {
    iconSize: 'w-5 h-5',
    textSize: 'text-sm',
    padding: 'px-3 py-1.5',
    gap: 'gap-2'
  },
  lg: {
    iconSize: 'w-6 h-6',
    textSize: 'text-base',
    padding: 'px-4 py-2',
    gap: 'gap-2'
  }
};

export function SyncStatusIndicator({
  className,
  showDetails = false,
  size = 'md'
}: SyncStatusIndicatorProps) {
  const { status, isOnline, pendingOperations, failedOperations, lastSyncTime, sync } = useSyncState();
  const [swActive, setSwActive] = useState<boolean | null>(null);

  // Check Service Worker controller status
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwActive(false);
      return;
    }

    const checkSW = () => {
      setSwActive(!!navigator.serviceWorker.controller);
    };

    checkSW();

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', checkSW);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', checkSW);
    };
  }, []);

  const effectiveStatus: SyncStatus = !isOnline ? 'offline' : status;
  const config = statusConfig[effectiveStatus];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Hiç senkronize edilmedi';
    
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  return (
    <div className={cn('flex items-center', sizes.gap, className)}>
      {/* Status Badge */}
      <button
        onClick={() => isOnline && sync()}
        disabled={!isOnline || status === 'syncing'}
        className={cn(
          'flex items-center rounded-full transition-colors',
          sizes.padding,
          sizes.gap,
          config.bgColor,
          'hover:opacity-90 disabled:cursor-default'
        )}
        title={isOnline ? 'Şimdi senkronize et' : 'Çevrimdışı'}
      >
        <Icon 
          className={cn(
            sizes.iconSize,
            config.color,
            config.animate && 'animate-spin'
          )} 
        />
        <span className={cn(sizes.textSize, config.color, 'font-medium')}>
          {config.text}
        </span>
      </button>

      {/* Pending Count Badge */}
      {pendingOperations > 0 && (
        <span className={cn(
          'flex items-center rounded-full bg-amber-100 text-amber-700',
          sizes.padding,
          sizes.gap,
          sizes.textSize,
          'font-medium'
        )}>
          <RefreshCw className={cn(sizes.iconSize, 'opacity-60')} />
          {pendingOperations} bekliyor
        </span>
      )}

      {/* Failed Count Badge */}
      {failedOperations > 0 && (
        <span className={cn(
          'flex items-center rounded-full bg-red-100 text-red-700',
          sizes.padding,
          sizes.gap,
          sizes.textSize,
          'font-medium'
        )}>
          <AlertCircle className={cn(sizes.iconSize, 'opacity-60')} />
          {failedOperations} başarısız
        </span>
      )}

      {/* Service Worker Status Badge */}
      {swActive !== null && (
        <span
          className={cn(
            'flex items-center rounded-full',
            sizes.padding,
            sizes.gap,
            sizes.textSize,
            'font-medium',
            swActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          )}
          title={swActive ? 'Service Worker aktif' : 'Service Worker pasif'}
        >
          {swActive ? (
            <Shield className={cn(sizes.iconSize, 'opacity-60')} />
          ) : (
            <ShieldOff className={cn(sizes.iconSize, 'opacity-60')} />
          )}
          {swActive ? 'SW aktif' : 'SW pasif'}
        </span>
      )}

      {/* Details Tooltip */}
      {showDetails && (
        <div className="text-xs text-gray-500">
          Son senkronizasyon: {formatLastSync(lastSyncTime)}
        </div>
      )}
    </div>
  );
}

// ============ Compact Version ============

export function SyncStatusDot({ className }: { className?: string }) {
  const { status, isOnline } = useSyncState();
  const effectiveStatus: SyncStatus = !isOnline ? 'offline' : status;
  const config = statusConfig[effectiveStatus];

  return (
    <div 
      className={cn(
        'w-2.5 h-2.5 rounded-full',
        config.color.replace('text-', 'bg-'),
        config.animate && 'animate-pulse',
        className
      )}
      title={config.text}
    />
  );
}

// ============ Offline Banner ============

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, pendingOperations } = useSyncState();

  if (isOnline) return null;

  return (
    <div className={cn(
      'fixed bottom-0 inset-x-0 bg-amber-500 text-white py-2 px-4 z-50',
      'flex items-center justify-center gap-2 text-sm font-medium',
      className
    )}>
      <WifiOff className="w-4 h-4" />
      <span>Çevrimdışı çalışıyorsunuz</span>
      {pendingOperations > 0 && (
        <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
          {pendingOperations} işlem bekliyor
        </span>
      )}
    </div>
  );
}

// ============ Sync Progress Modal ============

interface SyncProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncProgressModal({ isOpen, onClose }: SyncProgressModalProps) {
  const { status, pendingOperations, failedOperations, error, sync } = useSyncState();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Senkronizasyon Durumu</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <SyncStatusIndicator showDetails />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-amber-50 text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingOperations}</div>
              <div className="text-xs text-amber-600">Bekleyen</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-center">
              <div className="text-2xl font-bold text-red-600">{failedOperations}</div>
              <div className="text-xs text-red-600">Başarısız</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <strong>Hata:</strong> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => sync()}
              disabled={status === 'syncing'}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {status === 'syncing' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Senkronize ediliyor...
                </span>
              ) : (
                'Şimdi Senkronize Et'
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
