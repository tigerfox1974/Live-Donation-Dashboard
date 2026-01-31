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
  activeEvent: ActiveEventInfo | null;
  broadcastingEventId: string | null;
  events: EventRecord[];
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
  activeEvent,
  broadcastingEventId,
  events
}: AppRoutesProps) {
  const { isFinalScreen, participants } = useEvent();

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
      return <DonorScreen participantId={token} activeEvent={activeEvent} />;
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

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setStoredEvents(events);
  }, [events]);

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
    const newEvent: EventRecord = {
      id: `evt-${now}`,
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
  };

  const handleUpdateEventStatus = (eventIds: string[], status: EventStatus) => {
    const now = Date.now();
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

  return (
    <EventProvider
      activeEventId={activeEvent?.id || null}
      eventDataMap={eventDataMap}
      onEventDataMapChange={setEventDataMap}
    >
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
        activeEvent={activeEvent}
        broadcastingEventId={broadcastingEventId}
        events={events}
      />
    </EventProvider>
  );
}

export function App() {
  return <AppContent />;
}