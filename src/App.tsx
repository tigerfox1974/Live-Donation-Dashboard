import React, { useEffect, useMemo, useState } from 'react';
import { EventProvider, useEvent } from './contexts/EventContext';
import { DisplayScreen } from './pages/DisplayScreen';
import { DonorScreen } from './pages/DonorScreen';
import { OperatorPanel } from './pages/OperatorPanel';
import { FinalScreen } from './pages/FinalScreen';
import { QRLandingPage } from './pages/QRLandingPage';
import { EventsConsole } from './pages/EventsConsole';
import { DiagnosticsPage } from './pages/Diagnostics.tsx';
import { PanelSelector } from './pages/PanelSelector';
import { ProjectionEventSelector } from './pages/ProjectionEventSelector';
import { MOCK_EVENTS } from './data/mockEvents';
import type { CreateEventInput, EventData, EventRecord, EventStatus } from './types';
import { Monitor, Settings, Users, FlaskConical } from 'lucide-react';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from './lib/constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import * as serviceWorkerRegistration from './lib/serviceWorkerRegistration';
import { syncManager } from './lib/syncManager';

// Extended active event type with metadata
export interface ActiveEventInfo {
  id: string;
  name: string;
  status: EventStatus;
  date?: string;
  venue?: string;
}

const AUTH_STORAGE_KEY = 'polvak_auth';
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';
const EVENTS_STORAGE_KEY = 'polvak_events';
const AUDIT_LOG_KEY = 'polvak_audit_log';

const PROTECTED_ROUTE_PREFIXES = [
  '#/panel-select',
  '#/projection-select',
  '#/operator',
  '#/display',
  '#/final',
  '#/events',
  '#/event-console',
  '#/diagnostics'
];

const getStoredAuth = () => {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const setStoredAuth = (value: boolean) => {
  try {
    if (value) {
      localStorage.setItem(AUTH_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // no-op
  }
};

const getRedirectAfterLogin = () => {
  try {
    return localStorage.getItem(REDIRECT_STORAGE_KEY);
  } catch {
    return null;
  }
};

const setRedirectAfterLogin = (hash: string) => {
  try {
    localStorage.setItem(REDIRECT_STORAGE_KEY, hash);
  } catch {
    // no-op
  }
};

const clearRedirectAfterLogin = () => {
  try {
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch {
    // no-op
  }
};

const getSafeRedirectHash = (hash: string | null) => {
  if (!hash || !hash.startsWith('#/')) return null;
  if (PROTECTED_ROUTE_PREFIXES.some((prefix) => hash.startsWith(prefix))) {
    return hash;
  }
  return null;
};

const getStoredEvents = () => {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as EventRecord[];
    }
    return null;
  } catch {
    return null;
  }
};

const setStoredEvents = (events: EventRecord[]) => {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // no-op
  }
};

const readAuditLog = () => {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const appendAuditLog = (entry: {
  eventId: string;
  user: string;
  action: string;
  details?: string;
}) => {
  try {
    const current = readAuditLog();
    const next = [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: entry.eventId,
        timestamp: Date.now(),
        user: entry.user,
        action: entry.action,
        details: entry.details || ''
      },
      ...current
    ];
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
};

const toActiveEventInfo = (event: EventRecord): ActiveEventInfo => ({
  id: event.id,
  name: event.name,
  status: event.status,
  date: event.date,
  venue: event.venue
});

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  children: React.ReactNode;
}

function ProtectedRoute({
  isAuthenticated,
  onLogin,
  children
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!isAuthenticated) {
      const currentHash = window.location.hash || '#/';
      const safeTarget = getSafeRedirectHash(currentHash);
      if (safeTarget) {
        setRedirectAfterLogin(safeTarget);
      }
      if (currentHash !== '#/') {
        window.location.hash = '#/';
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <QRLandingPage onOperatorLogin={onLogin} />;
  }

  return <>{children}</>;
}

interface AppRoutesProps {
  hash: string;
  isLoggedIn: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  handleAlreadyAuthenticatedRedirect: () => void;
  handleSetActiveEvent: (event: ActiveEventInfo | null) => void;
  handleSwitchToOperator: (event: ActiveEventInfo) => void;
  handleSwitchToProjection: (event: ActiveEventInfo) => void;
  handleSwitchToFinal: (event: ActiveEventInfo) => void;
  handleSelectOperator: () => void;
  handleSelectProjection: () => void;
  handleStartProjection: (event: ActiveEventInfo) => void;
  handleSetBroadcasting: (eventId: string | null) => void;
  handleOpenEventDetail: (eventId: string) => void;
  handleGoToEvents: () => void;
  handleCreateEvent: (input: CreateEventInput) => void;
  handleUpdateEventStatus: (eventIds: string[], status: EventStatus) => void;
  handleDeleteEvents: (eventIds: string[]) => void;
  handleImportEvents: (payload: {events: EventRecord[];eventData?: EventData[]}) => void;
  handleUpdateEventStats: (eventId: string, patch: Partial<EventRecord>) => void;
  activeEvent: ActiveEventInfo | null;
  broadcastingEventId: string | null;
  events: EventRecord[];
  eventDataMap: Map<string, EventData>;
}

function AppRoutes({
  hash,
  isLoggedIn,
  handleLogin,
  handleLogout,
  handleAlreadyAuthenticatedRedirect,
  handleSetActiveEvent,
  handleSwitchToOperator,
  handleSwitchToProjection,
  handleSwitchToFinal,
  handleSelectOperator,
  handleSelectProjection,
  handleStartProjection,
  handleSetBroadcasting,
  handleOpenEventDetail,
  handleGoToEvents,
  handleCreateEvent,
  handleUpdateEventStatus,
  handleDeleteEvents,
  handleImportEvents,
  handleUpdateEventStats,
  activeEvent,
  broadcastingEventId,
  events,
  eventDataMap
}: AppRoutesProps) {
  const { isFinalScreen, participants, isHydrating } = useEvent();

  const shouldShowLoader =
    isHydrating &&
    (hash.startsWith('#/operator') ||
      hash.startsWith('#/display') ||
      hash.startsWith('#/final') ||
      hash.startsWith('#/events') ||
      hash.startsWith('#/event-console') ||
      hash.startsWith('#/projection-select') ||
      hash.startsWith('#/p/'));

  if (shouldShowLoader) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isLoggedIn && (hash === '' || hash === '#' || hash === '#/')) {
      handleAlreadyAuthenticatedRedirect();
    }
  }, [hash, isLoggedIn, handleAlreadyAuthenticatedRedirect]);

  if (hash.startsWith('#/panel-select')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <PanelSelector
          onSelectOperator={handleSelectOperator}
          onSelectProjection={handleSelectProjection}
          onLogout={handleLogout}
        />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/projection-select')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <ProjectionEventSelector
          onBack={() => {
            window.location.hash = '#/panel-select';
          }}
          onSelectEvent={handleStartProjection}
          broadcastingEventId={broadcastingEventId}
          events={events}
        />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/display')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        {isFinalScreen ? (
          <FinalScreen activeEvent={activeEvent} />
        ) : (
          <DisplayScreen activeEvent={activeEvent} />
        )}
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/p/')) {
    const token = hash.split('/')[2];
    if (token) {
      // Önce aktif event katılımcılarında ara
      let participantByToken = participants.find((p) => p.token === token);
      let matchedEvent: ActiveEventInfo | null = activeEvent;

      // Aktif eventte bulunamadıysa, tüm eventlerde ara
      if (!participantByToken) {
        // eventDataMap'te ara
        for (const [eventId, eventData] of eventDataMap.entries()) {
          const found = eventData.participants?.find((p) => p.token === token);
          if (found) {
            participantByToken = found;
            const eventRecord = events.find((e) => e.id === eventId);
            if (eventRecord) {
              matchedEvent = {
                id: eventRecord.id,
                name: eventRecord.name,
                status: eventRecord.status,
                date: eventRecord.date,
                venue: eventRecord.venue
              };
              // Event'i aktif yap
              handleSetActiveEvent(matchedEvent);
            }
            break;
          }
        }
        
        // eventDataMap'te bulunamadıysa, localStorage'dan ara
        if (!participantByToken) {
          for (const event of events) {
            try {
              const key = `polvak_event_${event.id}_participants`;
              const raw = localStorage.getItem(key);
              if (raw) {
                const storedParticipants = JSON.parse(raw);
                if (Array.isArray(storedParticipants)) {
                  const found = storedParticipants.find((p: any) => p.token === token);
                  if (found) {
                    participantByToken = found;
                    matchedEvent = {
                      id: event.id,
                      name: event.name,
                      status: event.status,
                      date: event.date,
                      venue: event.venue
                    };
                    // Event'i aktif yap
                    handleSetActiveEvent(matchedEvent);
                    break;
                  }
                }
              }
            } catch {
              // localStorage hatası, devam et
            }
          }
        }
      }

      if (participantByToken) {
        // If we switched to a different event, wait for context to rehydrate
        // Check if the matched event is different from current active event
        const needsRehydration = matchedEvent && activeEvent && matchedEvent.id !== activeEvent.id;
        
        if (needsRehydration || isHydrating) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Bağış ekranı hazırlanıyor...</p>
              </div>
            </div>
          );
        }
        
        return (
          <DonorScreen
            participantId={participantByToken.id}
            activeEvent={matchedEvent}
          />
        );
      }

      // Katılımcı hiçbir yerde bulunamadı - geçersiz QR
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Geçersiz QR Kodu</h2>
            <p className="text-gray-600 mb-4">Bu QR kodu geçerli bir katılımcıya ait değil veya süresi dolmuş olabilir.</p>
            <p className="text-sm text-gray-500">Lütfen organizatörle iletişime geçin.</p>
          </div>
        </div>
      );
    }
  }

  if (hash.startsWith('#/final')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <FinalScreen activeEvent={activeEvent} />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/events') || hash.startsWith('#/event-console')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <EventsConsole
          onSwitchToOperator={handleSwitchToOperator}
          onSwitchToProjection={handleSwitchToProjection}
          onSwitchToFinal={handleSwitchToFinal}
          activeEventId={activeEvent?.id || null}
          events={events}
          onCreateEvent={handleCreateEvent}
          onUpdateEventStatus={handleUpdateEventStatus}
          onDeleteEvents={handleDeleteEvents}
          onImportEvents={handleImportEvents}
          onUpdateEventStats={handleUpdateEventStats}
        />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/diagnostics')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <DiagnosticsPage />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/operator')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <OperatorPanel
          onLogout={handleLogout}
          events={events}
          activeEvent={activeEvent}
          onSetActiveEvent={handleSetActiveEvent}
          broadcastingEventId={broadcastingEventId}
          onSetBroadcasting={handleSetBroadcasting}
          onOpenEventDetail={handleOpenEventDetail}
          onGoToEvents={handleGoToEvents}
        />
      </ProtectedRoute>
    );
  }

  if (hash.startsWith('#/demo')) {
    const demoParticipants = participants.filter((p) => p.token).slice(0, 4);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
              <FlaskConical className="w-4 h-4" />
              DEMO / TEST PANELİ
            </div>
          </div>

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#1e3a5f] rounded-2xl flex items-center justify-center overflow-hidden p-2">
                <img
                  src={POLVAK_LOGO_URL}
                  alt={ORG_SHORT_NAME}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{ORG_NAME}</h1>
            <p className="text-gray-500 text-sm">
              {ORG_SHORT_NAME} Bağış Toplama Sistemi - Test Ortamı
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="#/panel-select"
              onClick={handleLogin}
              className="flex items-center gap-4 w-full p-4 bg-[#1e3a5f] hover:bg-[#152a45] text-white rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold">Yönetim Panelleri</div>
                <div className="text-sm text-white/70">
                  Operatör veya Projeksiyon seçimi
                </div>
              </div>
            </a>

            <a
              href="#/display"
              className="flex items-center gap-4 w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-indigo-900">
                  Projeksiyon Ekranı (Direkt)
                </div>
                <div className="text-sm text-indigo-700">
                  Canlı etkinlik görünümü
                </div>
              </div>
            </a>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">
              <Users className="w-4 h-4" />
              Bağışçı Simülasyonu (Test Amaçlı)
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500">
                Gerçek kullanımda bağışçılar QR kod ile{' '}
                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-[#1e3a5f]">
                  #/p/TOKEN
                </code>{' '}
                adresine yönlendirilir.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {demoParticipants.map((p) => (
                  <a
                    key={p.id}
                    href={`#/p/${p.token}`}
                    className="block p-3 text-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors"
                  >
                    {p.display_name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-center text-gray-400 pt-2 space-y-1">
            <p>Bu sayfa yalnızca test amaçlıdır.</p>
            <p>
              <a href="#/" className="text-[#1e3a5f] hover:underline">
                Ana sayfaya dön
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QRLandingPage
      onOperatorLogin={handleLogin}
      isAuthenticated={isLoggedIn}
      onAlreadyAuthenticated={handleAlreadyAuthenticatedRedirect}
    />
  );
}

function AppContent() {
  const [hash, setHash] = useState(window.location.hash);
  const [isLoggedIn, setIsLoggedIn] = useState(() => getStoredAuth());
  const [eventDataMap, setEventDataMap] = useState<Map<string, EventData>>(
    () => new Map()
  );
  const [events, setEvents] = useState<EventRecord[]>(() => {
    const stored = getStoredEvents();
    return stored && stored.length > 0 ? stored : MOCK_EVENTS;
  });
  const [activeEvent, setActiveEvent] = useState<ActiveEventInfo | null>(() => {
    const stored = getStoredEvents();
    const list = stored && stored.length > 0 ? stored : MOCK_EVENTS;
    const seed = list.find((event) => event.status === 'live') || list[0];
    return seed ? toActiveEventInfo(seed) : null;
  });
  const [broadcastingEventId, setBroadcastingEventId] = useState<string | null>(
    () => activeEvent?.id || null
  );

  // Register Service Worker for offline support
  useEffect(() => {
    serviceWorkerRegistration.register({
      onSuccess: (_reg) => {
        console.log('[App] SW ready');
        syncManager.sync();
      },
      onUpdate: (_reg) => {
        console.log('[App] SW updated');
      },
      onOffline: () => {
        console.log('[App] Offline');
      },
      onOnline: () => {
        console.log('[App] Online');
        syncManager.sync();
      }
    });
  }, []);

  // Initialize eventDataMap from localStorage for all events
  useEffect(() => {
    const loadEventDataFromStorage = () => {
      const newMap = new Map<string, EventData>();
      
      for (const event of events) {
        try {
          const itemsKey = `polvak_event_${event.id}_items`;
          const participantsKey = `polvak_event_${event.id}_participants`;
          const donationsKey = `polvak_event_${event.id}_donations`;
          
          const itemsRaw = localStorage.getItem(itemsKey);
          const participantsRaw = localStorage.getItem(participantsKey);
          const donationsRaw = localStorage.getItem(donationsKey);
          
          const items = itemsRaw ? JSON.parse(itemsRaw) : [];
          const participants = participantsRaw ? JSON.parse(participantsRaw) : [];
          const donations = donationsRaw ? JSON.parse(donationsRaw) : [];
          
          // Only add to map if there's actual data
          if (items.length > 0 || participants.length > 0 || donations.length > 0) {
            newMap.set(event.id, {
              eventId: event.id,
              items: Array.isArray(items) ? items : [],
              participants: Array.isArray(participants) ? participants : [],
              donations: Array.isArray(donations) ? donations : []
            });
          }
        } catch {
          // Ignore parse errors for individual events
        }
      }
      
      if (newMap.size > 0) {
        setEventDataMap((prev) => {
          const merged = new Map(prev);
          for (const [key, value] of newMap) {
            const existing = merged.get(key);
            
            if (!existing) {
              // No existing entry, use the new value
              merged.set(key, value);
            } else {
              // Merge each data type separately - use localStorage data if it has more entries
              const mergedEntry = {
                eventId: key,
                items: (value.items.length > 0 && (existing.items.length === 0 || value.items.length >= existing.items.length))
                  ? value.items
                  : existing.items,
                participants: (value.participants.length > 0 && (existing.participants.length === 0 || value.participants.length >= existing.participants.length))
                  ? value.participants
                  : existing.participants,
                donations: (value.donations.length > 0 && (existing.donations.length === 0 || value.donations.length >= existing.donations.length))
                  ? value.donations
                  : existing.donations
              };
              merged.set(key, mergedEntry);
            }
          }
          return merged;
        });
      }
    };
    
    loadEventDataFromStorage();
  }, [events]);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setStoredEvents(events);
  }, [events]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      
      // Handle events list sync
      if (event.key === EVENTS_STORAGE_KEY) {
        const next = getStoredEvents();
        if (next && next.length > 0) {
          setEvents(next);
        }
        return;
      }
      
      // Handle event-specific data sync (items, participants, donations)
      const eventDataKeyPattern = /^polvak_event_([^_]+)_(items|participants|donations)$/;
      const match = event.key.match(eventDataKeyPattern);
      if (match) {
        const eventId = match[1];
        const dataType = match[2] as 'items' | 'participants' | 'donations';
        
        try {
          const raw = event.newValue;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setEventDataMap((prev) => {
                const next = new Map(prev);
                const existing = next.get(eventId) || {
                  eventId,
                  items: [],
                  participants: [],
                  donations: []
                };
                next.set(eventId, {
                  ...existing,
                  [dataType]: parsed
                });
                return next;
              });
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!activeEvent && events.length > 0) {
      const seed = events.find((event) => event.status === 'live') || events[0];
      setActiveEvent(seed ? toActiveEventInfo(seed) : null);
      return;
    }
    if (activeEvent && !events.some((event) => event.id === activeEvent.id)) {
      setActiveEvent(null);
    }
  }, [events, activeEvent]);

  const setAuth = (value: boolean) => {
    setIsLoggedIn(value);
    setStoredAuth(value);
    if (!value) {
      clearRedirectAfterLogin();
    }
  };

  const redirectAfterLogin = useMemo(
    () => getSafeRedirectHash(getRedirectAfterLogin()),
    [hash]
  );

  const handleLogin = () => {
    setAuth(true);
    if (redirectAfterLogin) {
      clearRedirectAfterLogin();
      window.location.hash = redirectAfterLogin;
      return;
    }
    window.location.hash = '#/panel-select';
  };

  const handleLogout = () => {
    setAuth(false);
    window.location.hash = '#/';
  };

  const handleAlreadyAuthenticatedRedirect = () => {
    if (redirectAfterLogin) {
      clearRedirectAfterLogin();
      window.location.hash = redirectAfterLogin;
      return;
    }
    window.location.hash = '#/panel-select';
  };

  const handleSetActiveEvent = (event: ActiveEventInfo | null) => {
    setActiveEvent(event);
  };

  const handleSwitchToOperator = (event: ActiveEventInfo) => {
    setActiveEvent(event);
    setAuth(true);
    window.location.hash = '#/operator';
  };

  const handleSwitchToProjection = (event: ActiveEventInfo) => {
    setActiveEvent(event);
    setBroadcastingEventId(event.id);
    window.location.hash = '#/display';
  };

  const handleSwitchToFinal = (event: ActiveEventInfo) => {
    setActiveEvent(event);
    window.location.hash = '#/final';
  };

  const handleSelectOperator = () => {
    window.location.hash = '#/operator';
  };

  const handleSelectProjection = () => {
    window.location.hash = '#/projection-select';
  };

  const handleStartProjection = (event: ActiveEventInfo) => {
    setActiveEvent(event);
    setBroadcastingEventId(event.id);
    window.location.hash = '#/display';
  };

  const handleSetBroadcasting = (eventId: string | null) => {
    setBroadcastingEventId(eventId);
  };

  const handleOpenEventDetail = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (event) {
      setActiveEvent(toActiveEventInfo(event));
    }
    window.location.hash = '#/events';
  };

  const handleGoToEvents = () => {
    window.location.hash = '#/events';
  };

  const handleCreateEvent = (input: CreateEventInput) => {
    const now = Date.now();
    const safeDate = input.date || new Date().toISOString().slice(0, 10);
    const eventId = input.id || `evt-${now}`;
    const newEvent: EventRecord = {
      id: eventId,
      name: input.name.trim(),
      date: safeDate,
      startTime: input.startTime || '19:00',
      endTime: input.endTime || '23:00',
      venue: input.venue || '-',
      description: input.description,
      status: 'draft',
      participantCount: 0,
      itemCount: 0,
      totalTarget: 0,
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
      lastUpdated: now,
      createdAt: now
    };
    setEvents((prev) => [newEvent, ...prev]);
    appendAuditLog({
      eventId: newEvent.id,
      user: 'admin',
      action: 'Etkinlik oluşturuldu',
      details: newEvent.name
    });
  };

  const handleDeleteEvents = (eventIds: string[]) => {
    if (eventIds.length === 0) return;
    eventIds.forEach((eventId) => {
      appendAuditLog({
        eventId,
        user: 'admin',
        action: 'Etkinlik silindi'
      });
    });
    setEvents((prev) => prev.filter((event) => !eventIds.includes(event.id)));
    if (activeEvent && eventIds.includes(activeEvent.id)) {
      setActiveEvent(null);
    }
  };

  const handleImportEvents = (payload: {
    events: EventRecord[];
    eventData?: EventData[];
  }) => {
    setEvents((prev) => {
      const map = new Map(prev.map((event) => [event.id, event]));
      payload.events.forEach((event) => {
        map.set(event.id, event);
        appendAuditLog({
          eventId: event.id,
          user: 'admin',
          action: 'Etkinlik içe aktarıldı',
          details: event.name
        });
      });
      return Array.from(map.values());
    });
    if (payload.eventData && payload.eventData.length > 0) {
      payload.eventData.forEach((data) => {
        try {
          localStorage.setItem(
            `polvak_event_${data.eventId}_items`,
            JSON.stringify(data.items)
          );
          localStorage.setItem(
            `polvak_event_${data.eventId}_participants`,
            JSON.stringify(data.participants)
          );
          localStorage.setItem(
            `polvak_event_${data.eventId}_donations`,
            JSON.stringify(data.donations)
          );
        } catch {
          // no-op
        }
      });
    }
  };

  const handleUpdateEventStatus = (eventIds: string[], status: EventStatus) => {
    const now = Date.now();
    eventIds.forEach((eventId) => {
      appendAuditLog({
        eventId,
        user: 'admin',
        action: 'Etkinlik durumu güncellendi',
        details: status
      });
    });
    setEvents((prev) =>
      prev.map((event) =>
        eventIds.includes(event.id)
          ? {
              ...event,
              status,
              lastUpdated: now
            }
          : event
      )
    );
    if (activeEvent && eventIds.includes(activeEvent.id)) {
      setActiveEvent({
        ...activeEvent,
        status,
        date: activeEvent.date,
        venue: activeEvent.venue
      });
    }
  };

  const handleUpdateEventStats = (
    eventId: string,
    patch: Partial<EventRecord>
  ) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...patch,
              lastUpdated: Date.now()
            }
          : event
      )
    );
  };

  const handleEventDataChange = (eventData: EventData) => {
    const totalTarget = eventData.items.reduce(
      (sum, item) => sum + item.initial_target,
      0
    );
    const totals = eventData.donations.reduce(
      (acc, donation) => {
        if (donation.status === 'approved') {
          acc.approved += donation.quantity;
        } else if (donation.status === 'pending') {
          acc.pending += donation.quantity;
        } else {
          acc.rejected += donation.quantity;
        }
        return acc;
      },
      { approved: 0, pending: 0, rejected: 0 }
    );
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventData.eventId
          ? {
              ...event,
              participantCount: eventData.participants.length,
              itemCount: eventData.items.length,
              totalTarget,
              totalApproved: totals.approved,
              totalPending: totals.pending,
              totalRejected: totals.rejected,
              lastUpdated: Date.now()
            }
          : event
      )
    );
  };

  return (
    <EventProvider
      activeEventId={activeEvent?.id || null}
      eventDataMap={eventDataMap}
      onEventDataMapChange={setEventDataMap}
      onEventDataChange={handleEventDataChange}
    >
      <ErrorBoundary>
        <AppRoutes
          hash={hash}
          isLoggedIn={isLoggedIn}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          handleAlreadyAuthenticatedRedirect={handleAlreadyAuthenticatedRedirect}
          handleSetActiveEvent={handleSetActiveEvent}
          handleSwitchToOperator={handleSwitchToOperator}
          handleSwitchToProjection={handleSwitchToProjection}
          handleSwitchToFinal={handleSwitchToFinal}
          handleSelectOperator={handleSelectOperator}
          handleSelectProjection={handleSelectProjection}
          handleStartProjection={handleStartProjection}
          handleSetBroadcasting={handleSetBroadcasting}
          handleOpenEventDetail={handleOpenEventDetail}
          handleGoToEvents={handleGoToEvents}
          handleCreateEvent={handleCreateEvent}
          handleUpdateEventStatus={handleUpdateEventStatus}
          handleDeleteEvents={handleDeleteEvents}
          handleImportEvents={handleImportEvents}
          handleUpdateEventStats={handleUpdateEventStats}
          activeEvent={activeEvent}
          broadcastingEventId={broadcastingEventId}
          events={events}
          eventDataMap={eventDataMap}
        />
      </ErrorBoundary>
    </EventProvider>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}