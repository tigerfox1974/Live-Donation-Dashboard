// ============ AUDIT LOG UTILITIES ============

export interface AuditLogEntry {
  id: string;
  eventId: string;
  timestamp: number;
  user: string;
  action: string;
  details: string;
}

const AUDIT_LOG_KEY = 'polvak_audit_log';

export const readAuditLog = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const appendAuditLog = (entry: {
  eventId: string;
  user?: string;
  action: string;
  details?: string;
}): void => {
  try {
    const current = readAuditLog();
    const next = [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: entry.eventId,
        timestamp: Date.now(),
        user: entry.user || 'admin',
        action: entry.action,
        details: entry.details || ''
      },
      ...current
    ];
    // Keep only last 1000 entries
    const trimmed = next.slice(0, 1000);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // no-op
  }
};

export const clearAuditLog = (): void => {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
  } catch {
    // no-op
  }
};

// ============ AUDIT LOG ACTIONS ============

export const AuditActions = {
  // Event actions
  EVENT_CREATED: 'Etkinlik oluşturuldu',
  EVENT_UPDATED: 'Etkinlik güncellendi',
  EVENT_DELETED: 'Etkinlik silindi',
  EVENT_CLONED: 'Etkinlik klonlandı',
  EVENT_STATUS_CHANGED: 'Etkinlik durumu değişti',
  EVENT_LIVE: 'Etkinlik canlıya alındı',
  EVENT_CLOSED: 'Etkinlik kapatıldı',
  EVENT_ARCHIVED: 'Etkinlik arşivlendi',
  
  // Participant actions
  PARTICIPANT_ADDED: 'Katılımcı eklendi',
  PARTICIPANT_UPDATED: 'Katılımcı güncellendi',
  PARTICIPANT_DELETED: 'Katılımcı silindi',
  PARTICIPANTS_IMPORTED: 'Katılımcılar içe aktarıldı',
  PARTICIPANT_QR_GENERATED: 'QR kodu üretildi',
  
  // Item actions
  ITEM_ADDED: 'Kalem eklendi',
  ITEM_UPDATED: 'Kalem güncellendi',
  ITEM_DELETED: 'Kalem silindi',
  ITEMS_IMPORTED: 'Kalemler içe aktarıldı',
  ITEMS_REORDERED: 'Kalem sırası değişti',
  
  // Donation actions
  DONATION_RECEIVED: 'Bağış alındı',
  DONATION_APPROVED: 'Bağış onaylandı',
  DONATION_REJECTED: 'Bağış reddedildi',
  DONATION_UNDONE: 'Bağış geri alındı',
  
  // Export actions
  DATA_EXPORTED: 'Veri dışa aktarıldı',
  REPORT_GENERATED: 'Rapor oluşturuldu',
  QR_CODES_GENERATED: 'QR kodları toplu üretildi',
  
  // System actions
  BROADCAST_STARTED: 'Yayın başlatıldı',
  BROADCAST_STOPPED: 'Yayın durduruldu'
} as const;

// ============ AUDIT LOG SEARCH & FILTER ============

export interface AuditLogFilter {
  eventId?: string;
  user?: string;
  action?: string;
  searchQuery?: string;
  startDate?: number;
  endDate?: number;
}

export const filterAuditLog = (
  logs: AuditLogEntry[],
  filter: AuditLogFilter
): AuditLogEntry[] => {
  return logs.filter(log => {
    // Event filter
    if (filter.eventId && log.eventId !== filter.eventId) {
      return false;
    }
    
    // User filter
    if (filter.user && log.user !== filter.user) {
      return false;
    }
    
    // Action filter
    if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) {
      return false;
    }
    
    // Search query (searches in action and details)
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesAction = log.action.toLowerCase().includes(query);
      const matchesDetails = log.details.toLowerCase().includes(query);
      const matchesUser = log.user.toLowerCase().includes(query);
      if (!matchesAction && !matchesDetails && !matchesUser) {
        return false;
      }
    }
    
    // Date range filter
    if (filter.startDate && log.timestamp < filter.startDate) {
      return false;
    }
    if (filter.endDate && log.timestamp > filter.endDate) {
      return false;
    }
    
    return true;
  });
};

export const getUniqueActions = (logs: AuditLogEntry[]): string[] => {
  const actions = new Set(logs.map(log => log.action));
  return Array.from(actions).sort();
};

export const getUniqueUsers = (logs: AuditLogEntry[]): string[] => {
  const users = new Set(logs.map(log => log.user));
  return Array.from(users).sort();
};
