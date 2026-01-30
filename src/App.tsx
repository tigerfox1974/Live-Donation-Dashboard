import React, { useEffect, useMemo, useState } from 'react';
import { EventProvider, useEvent } from './contexts/EventContext';
import { DisplayScreen } from './pages/DisplayScreen';
import { DonorScreen } from './pages/DonorScreen';
import { OperatorPanel } from './pages/OperatorPanel';
import { FinalScreen } from './pages/FinalScreen';
import { QRLandingPage } from './pages/QRLandingPage';
import { EventsConsole } from './pages/EventsConsole';
import { PanelSelector } from './pages/PanelSelector';
import { ProjectionEventSelector } from './pages/ProjectionEventSelector';
import { MOCK_PARTICIPANTS } from './data/mockData';
import { Monitor, Settings, Users, FlaskConical } from 'lucide-react';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from './lib/constants';
// Extended active event type with metadata
export interface ActiveEventInfo {
  id: string;
  name: string;
  status: 'draft' | 'live' | 'closed' | 'archived';
  date?: string;
  venue?: string;
}
const AUTH_STORAGE_KEY = 'polvak_auth';
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';
const PROTECTED_ROUTE_PREFIXES = [
  '#/panel-select',
  '#/projection-select',
  '#/operator',
  '#/display',
  '#/final',
  '#/events',
  '#/event-console'
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
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  children: React.ReactNode;
}
function ProtectedRoute({ isAuthenticated, onLogin, children }: ProtectedRouteProps) {
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
function AppContent() {
  const [hash, setHash] = useState(window.location.hash);
  const [isLoggedIn, setIsLoggedIn] = useState(() => getStoredAuth());
  const [activeEvent, setActiveEvent] = useState<ActiveEventInfo | null>({
    id: 'evt-1',
    name: '2024 Yılsonu Bağış Gecesi',
    status: 'live',
    date: '2024-12-15',
    venue: 'Lefkoşa Merit Hotel'
  });
  // Broadcasting event - the event currently being shown on projection
  const [broadcastingEventId, setBroadcastingEventId] = useState<string | null>(
    'evt-1'
  );
  // Projection event - the event selected for projection display
  const [projectionEvent, setProjectionEvent] =
  useState<ActiveEventInfo | null>(null);
  const { isFinalScreen } = useEvent();
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
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
    setProjectionEvent(event);
    window.location.hash = '#/display';
  };
  const handleSetBroadcasting = (eventId: string | null) => {
    setBroadcastingEventId(eventId);
  };
  const handleOpenEventDetail = (eventId: string) => {
    window.location.hash = '#/events';
  };
  const handleGoToEvents = () => {
    window.location.hash = '#/events';
  };
  useEffect(() => {
    if (isLoggedIn && (hash === '' || hash === '#' || hash === '#/')) {
      handleAlreadyAuthenticatedRedirect();
    }
  }, [hash, isLoggedIn]);
  // Router
  // #/ -> QR Landing Page (public)
  // #/panel-select -> Panel Selector (after login)
  // #/projection-select -> Projection Event Selector
  // #/display -> DisplayScreen (Projection)
  // #/p/:token -> DonorScreen (QR direct access - production route)
  // #/donor/:id -> DonorScreen (legacy/demo route)
  // #/operator -> OperatorPanel (requires login)
  // #/final -> FinalScreen
  // #/events -> EventsConsole (hidden, URL-only access)
  // #/demo -> Demo/Admin Landing (hidden, for testing)
  // Panel Selector - after login
  if (hash.startsWith('#/panel-select')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <PanelSelector
          onSelectOperator={handleSelectOperator}
          onSelectProjection={handleSelectProjection}
          onLogout={handleLogout} />
      </ProtectedRoute>);


  }
  // Projection Event Selector
  if (hash.startsWith('#/projection-select')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <ProjectionEventSelector
          onBack={() => window.location.hash = '#/panel-select'}
          onSelectEvent={handleStartProjection}
          broadcastingEventId={broadcastingEventId} />
      </ProtectedRoute>);


  }
  // Display screen (projection) - public access
  if (hash.startsWith('#/display')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        {isFinalScreen ?
        <FinalScreen activeEvent={activeEvent} /> :

        <DisplayScreen activeEvent={activeEvent} />}
      </ProtectedRoute>);

  }
  // Production donor route: #/p/:token (direct QR access)
  if (hash.startsWith('#/p/')) {
    const token = hash.split('/')[2];
    if (token) {
      return <DonorScreen participantId={token} activeEvent={activeEvent} />;
    }
  }
  // Legacy/demo donor route: #/donor/:id
  if (hash.startsWith('#/donor/')) {
    const parts = hash.split('/');
    const participantId = parts[2];
    if (participantId) {
      return (
        <DonorScreen participantId={participantId} activeEvent={activeEvent} />);

    }
  }
  if (hash.startsWith('#/final')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <FinalScreen activeEvent={activeEvent} />
      </ProtectedRoute>);
  }
  // Events Console - hidden, URL-only access (no menu link)
  if (hash.startsWith('#/events') || hash.startsWith('#/event-console')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <EventsConsole
          onSwitchToOperator={handleSwitchToOperator}
          onSwitchToProjection={handleSwitchToProjection}
          onSwitchToFinal={handleSwitchToFinal}
          activeEventId={activeEvent?.id || null} />
      </ProtectedRoute>);


  }
  // Operator panel - requires login
  if (hash.startsWith('#/operator')) {
    return (
      <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
        <OperatorPanel
          onLogout={handleLogout}
          activeEvent={activeEvent}
          onSetActiveEvent={handleSetActiveEvent}
          broadcastingEventId={broadcastingEventId}
          onSetBroadcasting={handleSetBroadcasting}
          onOpenEventDetail={handleOpenEventDetail}
          onGoToEvents={handleGoToEvents} />
      </ProtectedRoute>);


  }
  // Demo page (hidden, for testing) - #/demo
  if (hash.startsWith('#/demo')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6">
          {/* Demo Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold border border-amber-200">
              <FlaskConical className="w-4 h-4" />
              DEMO / TEST PANELİ
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#1e3a5f] rounded-2xl flex items-center justify-center overflow-hidden p-2">
                <img
                  src={POLVAK_LOGO_URL}
                  alt={ORG_SHORT_NAME}
                  className="w-full h-full object-contain" />

              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{ORG_NAME}</h1>
            <p className="text-gray-500 text-sm">
              {ORG_SHORT_NAME} Bağış Toplama Sistemi - Test Ortamı
            </p>
          </div>

          {/* Main Actions */}
          <div className="space-y-3">
            <a
              href="#/panel-select"
              onClick={() => setAuth(true)}
              className="flex items-center gap-4 w-full p-4 bg-[#1e3a5f] hover:bg-[#152a45] text-white rounded-xl transition-colors group">

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
              className="flex items-center gap-4 w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors group">

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

          {/* Donor Test Section */}
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
                {MOCK_PARTICIPANTS.slice(0, 4).map((p) =>
                <a
                  key={p.id}
                  href={`#/p/${p.id}`}
                  className="block p-3 text-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors">

                    {p.display_name}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-center text-gray-400 pt-2 space-y-1">
            <p>Bu sayfa yalnızca test amaçlıdır.</p>
            <p>
              <a href="#/" className="text-[#1e3a5f] hover:underline">
                Ana sayfaya dön
              </a>
            </p>
          </div>
        </div>
      </div>);

  }
  // Default: QR Landing Page (root route #/ or empty)
  return (
    <QRLandingPage
      onOperatorLogin={handleLogin}
      isAuthenticated={isLoggedIn}
      onAlreadyAuthenticated={handleAlreadyAuthenticatedRedirect} />);
}
export function App() {
  return (
    <EventProvider>
      <AppContent />
    </EventProvider>);

}