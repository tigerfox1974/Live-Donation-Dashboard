import React, { useEffect, useMemo, useRef, useState, cloneElement } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEvent } from '../contexts/EventContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ProgressBar';
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Package,
  FileBarChart,
  Check,
  X,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  MonitorPlay,
  Search,
  Plus,
  QrCode,
  FileDown,
  Printer,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Building2,
  User,
  Download,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Calendar,
  Radio,
  RefreshCw,
  ExternalLink,
  Tv,
  MapPin,
  WifiOff,
  Loader2 } from
'lucide-react';
import { cn } from '../lib/utils';
import { Participant, ParticipantType, DonationItem } from '../types';
import {
  EventStatusBadge,
  EventSelectorModal,
  NoEventEmptyState } from
'../components/ActiveEventBar';
import type { ActiveEventInfo } from '../App';
import type { EventRecord } from '../types';
interface OperatorPanelProps {
  onLogout?: () => void;
  events: EventRecord[];
  activeEvent?: ActiveEventInfo | null;
  onSetActiveEvent?: (event: ActiveEventInfo | null) => void;
  broadcastingEventId?: string | null;
  onSetBroadcasting?: (eventId: string | null) => void;
  onOpenEventDetail?: (eventId: string) => void;
  onGoToEvents?: () => void;
}
// Event context bar component - Enhanced version
function EventContextBar({
  event,
  onChangeEvent,
  onOpenEventDetail,
  isBroadcasting





}: {event: ActiveEventInfo;onChangeEvent: () => void;onOpenEventDetail?: () => void;isBroadcasting: boolean;}) {
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700">Etkinlik:</span>
          <span className="font-semibold text-blue-900">{event.name}</span>
          <EventStatusBadge status={event.status} />
        </div>
        {(event.date || event.venue) &&
        <div className="flex items-center gap-3 pl-3 border-l border-blue-200 text-blue-600">
            {event.date &&
          <span className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('tr-TR')}
              </span>
          }
            {event.venue &&
          <span className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {event.venue}
              </span>
          }
          </div>
        }
        {isBroadcasting &&
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-200">
            <Tv className="w-3 h-3 animate-pulse" /> PROJEKSİYONDA YAYINDA
          </span>
        }
      </div>
      <div className="flex items-center gap-3">
        {onOpenEventDetail &&
        <button
          onClick={onOpenEventDetail}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">

            <ExternalLink className="w-3 h-3" />
            Etkinliği Aç
          </button>
        }
        <button
          onClick={onChangeEvent}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100">

          <RefreshCw className="w-3 h-3" />
          Değiştir
        </button>
      </div>
    </div>);

}
export function OperatorPanel({
  onLogout,
  events,
  activeEvent,
  onSetActiveEvent,
  broadcastingEventId,
  onSetBroadcasting,
  onOpenEventDetail,
  onGoToEvents
}: OperatorPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'live' | 'queue' | 'participants' | 'items' | 'reports'>(
    'live');
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [keyAction, setKeyAction] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const keyActionTimeout = useRef<number | null>(null);
  const [forceCrash, setForceCrash] = useState(false);
  const showErrorTest = window.location.hostname === 'localhost';
  const {
    items,
    activeItemId,
    donations,
    participants,
    approveDonation,
    rejectDonation,
    undoLastApproval,
    setFinalScreen,
    goToNextItem,
    goToPrevItem,
    addParticipant,
    updateParticipant,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    getParticipantTotal
  } = useEvent();
  const pendingDonations = donations.
  filter((d) => d.status === 'pending').
  sort((a, b) => a.timestamp - b.timestamp);
  const activeItemIndex = items.findIndex((i) => i.id === activeItemId);
  const activeItem = items[activeItemIndex];
  const isBroadcasting = activeEvent?.id === broadcastingEventId;
  const handleNextItem = () => {
    goToNextItem();
  };
  const handlePrevItem = () => {
    goToPrevItem();
  };
  const notifyKeyAction = (message: string, type: 'success' | 'info' | 'error') => {
    setKeyAction({ message, type });
    if (keyActionTimeout.current) {
      window.clearTimeout(keyActionTimeout.current);
    }
    keyActionTimeout.current = window.setTimeout(() => {
      setKeyAction(null);
    }, 2000);
  };
  const handleGoToEvents = () => {
    if (onGoToEvents) {
      onGoToEvents();
    } else {
      window.location.hash = '#/events';
    }
  };
  const handleGoToPanelSelect = () => {
    window.location.hash = '#/panel-select';
  };
  const handleToggleBroadcast = () => {
    if (activeEvent && onSetBroadcasting) {
      if (isBroadcasting) {
        onSetBroadcasting(null);
      } else {
        onSetBroadcasting(activeEvent.id);
      }
    }
  };
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (event.code === 'Space') {
        const pending = donations.find((d) => d.status === 'pending');
        if (pending) {
          event.preventDefault();
          approveDonation(pending.id);
          notifyKeyAction('Bağış onaylandı.', 'success');
        } else {
          notifyKeyAction('Bekleyen bağış yok.', 'info');
        }
      }
      if (event.key.toLowerCase() === 'r') {
        const pending = donations.find((d) => d.status === 'pending');
        if (pending) {
          event.preventDefault();
          rejectDonation(pending.id);
          notifyKeyAction('Bağış reddedildi.', 'info');
        } else {
          notifyKeyAction('Bekleyen bağış yok.', 'info');
        }
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleNextItem();
        notifyKeyAction('Sonraki kaleme geçildi.', 'info');
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        handlePrevItem();
        notifyKeyAction('Önceki kaleme geçildi.', 'info');
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFinalScreen(true);
        window.location.hash = '#/final';
        notifyKeyAction('Final ekranına geçildi.', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [approveDonation, rejectDonation, donations, handleNextItem, handlePrevItem, setFinalScreen]);
  const handleSelectEvent = (event: ActiveEventInfo) => {
    if (onSetActiveEvent) {
      onSetActiveEvent(event);
    }
  };
  const handleOpenEventDetail = () => {
    if (activeEvent && onOpenEventDetail) {
      onOpenEventDetail(activeEvent.id);
    } else if (activeEvent) {
      window.location.hash = '#/events';
    }
  };
  if (forceCrash) {
    throw new Error('ErrorBoundary test');
  }
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#1e3a5f] text-white px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoToPanelSelect}
              className="w-8 h-8 bg-[#f59e0b] rounded flex items-center justify-center font-bold hover:bg-[#d97706] transition-colors"
              title="Panel Seçimine Dön">

              OP
            </button>
            <h1 className="text-lg font-bold">Operatör Paneli</h1>
          </div>

          {/* Active Event Indicator in Header */}
          {activeEvent &&
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">Aktif:</span>
                <span className="font-semibold text-sm">
                  {activeEvent.name}
                </span>
                <EventStatusBadge status={activeEvent.status} />
              </div>
              <button
              onClick={() => setShowEventSelector(true)}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs transition-colors">

                <RefreshCw className="w-3 h-3" />
                Değiştir
              </button>
            </div>
          }
        </div>

        <div className="flex items-center flex-wrap gap-2 text-sm">
          <span className="bg-white/10 px-3 py-1 rounded-full">
            Bekleyen: {pendingDonations.length}
          </span>
          <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Sistem Aktif
          </span>
          {showErrorTest && (
            <button
              onClick={() => setForceCrash(true)}
              className="bg-red-500/20 text-red-100 px-3 py-1 rounded-full border border-red-400/40 hover:bg-red-500/30">
              Test ErrorBoundary
            </button>
          )}
          {onLogout &&
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">

              <LogOut className="w-4 h-4" />
              <span>Çıkış</span>
            </button>
          }
        </div>
      </header>

      {keyAction && (
        <div className="px-4 md:px-6 pt-3">
          <div
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-sm',
              keyAction.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : keyAction.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
            )}
          >
            {keyAction.message}
          </div>
        </div>
      )}

      {/* No Event Selected State */}
      {!activeEvent ?
      <NoEventEmptyState
        onSelectEvent={() => setShowEventSelector(true)}
        onCreateEvent={handleGoToEvents} /> :


      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white border-r flex flex-col shrink-0">
            <nav className="p-4 space-y-2 flex-1">
              <TabButton
              active={activeTab === 'live'}
              onClick={() => setActiveTab('live')}
              icon={<LayoutDashboard size={20} />}
              label="Canlı Kontrol" />

              <TabButton
              active={activeTab === 'queue'}
              onClick={() => setActiveTab('queue')}
              icon={<ListChecks size={20} />}
              label="Onay Kuyruğu"
              badge={pendingDonations.length} />

              <TabButton
              active={activeTab === 'participants'}
              onClick={() => setActiveTab('participants')}
              icon={<Users size={20} />}
              label="Katılımcılar" />

              <TabButton
              active={activeTab === 'items'}
              onClick={() => setActiveTab('items')}
              icon={<Package size={20} />}
              label="İhtiyaç Kalemleri" />

              <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              icon={<FileBarChart size={20} />}
              label="Raporlar" />

            </nav>

            {/* Projection Control */}
            <div className="p-4 border-t space-y-3">
              <Button
              variant={isBroadcasting ? 'danger' : 'secondary'}
              className="w-full justify-start"
              onClick={handleToggleBroadcast}>

                <Tv
                className={cn(
                  'w-4 h-4 mr-2',
                  isBroadcasting && 'animate-pulse'
                )} />

                {isBroadcasting ? 'Yayını Durdur' : 'Projeksiyona Yansıt'}
              </Button>

              {isBroadcasting &&
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                  <div className="flex items-center gap-2 font-medium">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Bu etkinlik şu an projeksiyonda yayında
                  </div>
                </div>
            }
            </div>

            {/* Events Console Link */}
            <div className="p-4 border-t">
              <a
              href="#/events"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#1e3a5f] transition-colors">

                <Calendar size={20} className="opacity-70" />
                Etkinlik Konsolu
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Event Context Bar */}
            <EventContextBar
            event={activeEvent}
            onChangeEvent={() => setShowEventSelector(true)}
            onOpenEventDetail={handleOpenEventDetail}
            isBroadcasting={isBroadcasting} />


            <main className="flex-1 p-6 overflow-y-auto">
              {/* LIVE CONTROL TAB */}
              {activeTab === 'live' &&
            <LiveControlTab
              activeItem={activeItem}
              activeItemIndex={activeItemIndex}
              items={items}
              pendingDonations={pendingDonations}
              participants={participants}
              handlePrevItem={handlePrevItem}
              handleNextItem={handleNextItem}
              setFinalScreen={setFinalScreen}
              undoLastApproval={undoLastApproval}
              approveDonation={approveDonation}
              rejectDonation={rejectDonation}
              setActiveTab={setActiveTab}
              isBroadcasting={isBroadcasting}
              onToggleBroadcast={handleToggleBroadcast} />

            }

              {/* QUEUE TAB */}
              {activeTab === 'queue' &&
            <QueueTab
              pendingDonations={pendingDonations}
              participants={participants}
              items={items}
              approveDonation={approveDonation}
              rejectDonation={rejectDonation} />

            }

              {/* PARTICIPANTS TAB */}
              {activeTab === 'participants' &&
            <ParticipantsTab
              participants={participants}
              addParticipant={addParticipant}
              updateParticipant={updateParticipant}
              getParticipantTotal={getParticipantTotal} />

            }

              {/* ITEMS TAB */}
              {activeTab === 'items' &&
            <ItemsTab
              items={items}
              activeItemId={activeItemId}
              addItem={addItem}
              updateItem={updateItem}
              deleteItem={deleteItem}
              reorderItems={reorderItems}
              getItemTotal={getItemTotal}
              getGrandTotal={getGrandTotal}
              getGrandTarget={getGrandTarget} />

            }

              {/* REPORTS TAB */}
              {activeTab === 'reports' &&
            <ReportsTab
              donations={donations}
              participants={participants}
              items={items}
              getItemTotal={getItemTotal}
              getGrandTotal={getGrandTotal}
              getGrandTarget={getGrandTarget}
              getParticipantTotal={getParticipantTotal} />

            }
            </main>
          </div>
        </div>
      }

      {/* Event Selector Modal */}
      <EventSelectorModal
        isOpen={showEventSelector}
        onClose={() => setShowEventSelector(false)}
        onSelectEvent={handleSelectEvent}
        onCreateNew={handleGoToEvents}
        currentEventId={activeEvent?.id}
        events={events} />

      {!isOnline &&
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-red-600 text-white p-8 rounded-2xl flex flex-col items-center max-w-2xl text-center shadow-2xl animate-pulse">
            <WifiOff className="w-20 h-20 mb-6" />
            <h2 className="text-3xl font-bold mb-3">Bağlantı Kesildi</h2>
            <p className="text-lg">İnternet bağlantısı tekrar gelene kadar bekleyin.</p>
          </div>
        </div>
      }

    </div>);

}
// ============ TAB BUTTON ============
function TabButton({ active, onClick, icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
        active ?
        'bg-[#1e3a5f]/10 text-[#1e3a5f]' :
        'text-gray-600 hover:bg-gray-50'
      )}>

      <div className="flex items-center">
        {cloneElement(icon, {
          className: 'mr-3 opacity-70'
        })}
        {label}
      </div>
      {badge > 0 &&
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      }
    </button>);

}
// ============ KPI CARD ============
function KPICard({
  icon,
  label,
  value,
  color = 'blue'





}: {icon: React.ReactNode;label: string;value: string | number;color?: 'blue' | 'green' | 'amber' | 'gray';}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600'
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            colors[color]
          )}>

          {icon}
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </Card>);

}
// ============ LIVE CONTROL TAB ============
function LiveControlTab({
  activeItem,
  activeItemIndex,
  items,
  pendingDonations,
  participants,
  handlePrevItem,
  handleNextItem,
  setFinalScreen,
  undoLastApproval,
  approveDonation,
  rejectDonation,
  setActiveTab,
  isBroadcasting,
  onToggleBroadcast
}: any) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Broadcast Status Card */}
      <Card
        className={cn(
          'p-4',
          isBroadcasting ?
          'bg-gradient-to-r from-green-600 to-green-700 text-white' :
          'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
        )}>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                isBroadcasting ? 'bg-white/20' : 'bg-white/10'
              )}>

              <Tv
                className={cn('w-6 h-6', isBroadcasting && 'animate-pulse')} />

            </div>
            <div>
              <div className="font-bold text-lg">
                {isBroadcasting ? 'Projeksiyon Yayında' : 'Projeksiyon Kapalı'}
              </div>
              <div className="text-sm text-white/70">
                {isBroadcasting ?
                'Bu etkinlik şu an projeksiyon ekranında gösteriliyor' :
                'Etkinliği projeksiyona yansıtmak için butona tıklayın'}
              </div>
            </div>
          </div>
          <Button
            variant={isBroadcasting ? 'outline' : 'secondary'}
            onClick={onToggleBroadcast}
            className={
            isBroadcasting ? 'border-white text-white hover:bg-white/20' : ''
            }>

            <Tv className="w-4 h-4 mr-2" />
            {isBroadcasting ? 'Yayını Durdur' : 'Projeksiyona Yansıt'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktif Kalem Yönetimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeItem ?
            <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
                <img
                src={activeItem.image_url}
                alt={activeItem.name}
                className="w-32 h-32 object-cover rounded-lg mb-4 shadow-md" />

                <h3 className="text-xl font-bold text-[#1e3a5f]">
                  {activeItem.name}
                </h3>
                <p className="text-gray-500">
                  Hedef: {activeItem.initial_target} Adet
                </p>
              </div> :

            <div className="text-center p-8 text-gray-500">
                Seçili kalem yok
              </div>
            }
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevItem}
                disabled={activeItemIndex <= 0}
                className="flex-1">

                <ChevronLeft className="mr-2 h-4 w-4" /> Önceki
              </Button>
              <Button
                variant="primary"
                onClick={handleNextItem}
                disabled={activeItemIndex >= items.length - 1}
                className="flex-1">

                Sonraki <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => setFinalScreen(true)}>

              <MonitorPlay className="mr-2 h-4 w-4" />
              Final Ekranına Geç
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={undoLastApproval}>

              <RotateCcw className="mr-2 h-4 w-4" />
              Son Onayı Geri Al (Acil)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bekleyen Bağışlar ({pendingDonations.length})</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('queue')}>

            Tümünü Gör
          </Button>
        </CardHeader>
        <CardContent>
          {pendingDonations.length === 0 ?
          <div className="text-center py-8 text-gray-400 italic">
              Bekleyen bağış yok.
            </div> :

          <div className="space-y-3">
              {pendingDonations.slice(0, 3).map((donation: any) => {
              const donor = participants.find(
                (p: any) => p.id === donation.participant_id
              );
              const item = items.find((i: any) => i.id === donation.item_id);
              return (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">

                    <div>
                      <div className="font-bold text-[#1e3a5f]">
                        {donor?.display_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item?.name} • {donation.quantity} Adet
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                      size="sm"
                      variant="success"
                      onClick={() => approveDonation(donation.id)}>

                        Onayla
                      </Button>
                      <Button
                      size="sm"
                      variant="danger"
                      onClick={() => rejectDonation(donation.id)}>

                        Reddet
                      </Button>
                    </div>
                  </div>);

            })}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}
// ============ QUEUE TAB ============
function QueueTab({
  pendingDonations,
  participants,
  items,
  approveDonation,
  rejectDonation
}: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Onay Kuyruğu</h2>
      <div className="space-y-4">
        {pendingDonations.length === 0 ?
        <Card className="p-12 text-center text-gray-500">
            <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">
              Şu an onay bekleyen bağış bulunmamaktadır.
            </p>
          </Card> :

        pendingDonations.map((donation: any) => {
          const donor = participants.find(
            (p: any) => p.id === donation.participant_id
          );
          const item = items.find((i: any) => i.id === donation.item_id);
          return (
            <Card key={donation.id} className="overflow-hidden">
                <div className="flex items-center p-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-bold text-lg text-[#1e3a5f]">
                        {donor?.display_name}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {new Date(donation.timestamp).toLocaleTimeString(
                        'tr-TR'
                      )}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium text-black">
                        {donation.quantity} Adet
                      </span>{' '}
                      {item?.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                    variant="danger"
                    onClick={() => rejectDonation(donation.id)}
                    className="w-24">

                      <X className="w-4 h-4 mr-1" /> Reddet
                    </Button>
                    <Button
                    variant="success"
                    onClick={() => approveDonation(donation.id)}
                    className="w-32">

                      <Check className="w-4 h-4 mr-1" /> Onayla
                    </Button>
                  </div>
                </div>
              </Card>);

        })
        }
      </div>
    </div>);

}
// ============ PARTICIPANTS TAB ============
function ParticipantsTab({
  participants,
  addParticipant,
  updateParticipant,
  getParticipantTotal
}: any) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ORG' | 'PERSON'>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'>(
    'all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Participant>>({
    type: 'PERSON',
    display_name: '',
    table_no: '',
    seat_label: '',
    notes: '',
    status: 'active',
    qr_generated: false
  });
  const [showBulkQRModal, setShowBulkQRModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrParticipant, setQrParticipant] = useState<Participant | null>(null);
  const stats = useMemo(() => {
    const total = participants.length;
    const active = participants.filter(
      (p: Participant) => p.status === 'active'
    ).length;
    const inactive = participants.filter(
      (p: Participant) => p.status === 'inactive'
    ).length;
    const qrGenerated = participants.filter(
      (p: Participant) => p.qr_generated
    ).length;
    return {
      total,
      active,
      inactive,
      qrGenerated
    };
  }, [participants]);
  const filteredParticipants = useMemo(() => {
    return participants.filter((p: Participant) => {
      const matchesSearch =
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.table_no.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || p.type === filterType;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [participants, search, filterType, filterStatus]);
  const handleSubmit = () => {
    if (!formData.display_name) return;
    if (editingId) {
      updateParticipant(editingId, formData);
    } else {
      addParticipant(formData as Omit<Participant, 'id'>);
    }
    resetForm();
  };
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      type: 'PERSON',
      display_name: '',
      table_no: '',
      seat_label: '',
      notes: '',
      status: 'active',
      qr_generated: false
    });
  };
  const handleEdit = (p: Participant) => {
    setFormData(p);
    setEditingId(p.id);
    setShowForm(true);
  };
  const handleGenerateQR = (participant: Participant) => {
    updateParticipant(participant.id, {
      qr_generated: true
    });
    setQrParticipant({
      ...participant,
      qr_generated: true
    });
    setShowQRModal(true);
  };
  const handleDownloadLabels = () => {
    alert("Etiket PDF'i indiriliyor...");
  };
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Users size={20} />}
          label="Toplam Katılımcı"
          value={stats.total}
          color="blue" />

        <KPICard
          icon={<CheckCircle2 size={20} />}
          label="Aktif"
          value={stats.active}
          color="green" />

        <KPICard
          icon={<XCircle size={20} />}
          label="Pasif"
          value={stats.inactive}
          color="gray" />

        <KPICard
          icon={<QrCode size={20} />}
          label="QR Üretilmiş"
          value={stats.qrGenerated}
          color="amber" />

      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="İsim veya masa ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />

          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

            <option value="all">Tüm Tipler</option>
            <option value="ORG">Kurum</option>
            <option value="PERSON">Kişi</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Katılımcı Ekle
          </Button>
        </div>
      </Card>

      {/* Add/Edit Form */}
      {showForm &&
      <Card className="p-6">
          <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">
            {editingId ? 'Katılımcı Düzenle' : 'Yeni Katılımcı Ekle'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tip *
              </label>
              <select
              value={formData.type}
              onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as ParticipantType
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

                <option value="PERSON">Kişi</option>
                <option value="ORG">Kurum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görünen İsim *
              </label>
              <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
              setFormData({
                ...formData,
                display_name: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              placeholder="İsim veya kurum adı" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Masa No
              </label>
              <input
              type="text"
              value={formData.table_no}
              onChange={(e) =>
              setFormData({
                ...formData,
                table_no: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              placeholder="A1, B2, vb." />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koltuk
              </label>
              <input
              type="text"
              value={formData.seat_label}
              onChange={(e) =>
              setFormData({
                ...formData,
                seat_label: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              placeholder="1, 2, 3..." />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
              value={formData.status}
              onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as any
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
              value={formData.notes}
              onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              rows={2}
              placeholder="Opsiyonel notlar..." />

            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={resetForm}>
              İptal
            </Button>
            <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!formData.display_name}>

              Kaydet
            </Button>
          </div>
        </Card>
      }

      {/* Participants Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  QR
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İsim
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Masa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Toplam Bağış
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParticipants.map((p: Participant) =>
              <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {p.qr_generated ?
                  <QrCode className="w-5 h-5 text-green-600" /> :

                  <QrCode className="w-5 h-5 text-gray-300" />
                  }
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {p.display_name}
                    </div>
                    {p.notes &&
                  <div className="text-xs text-gray-500">{p.notes}</div>
                  }
                  </td>
                  <td className="px-4 py-3">
                    <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      p.type === 'ORG' ?
                      'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    )}>

                      {p.type === 'ORG' ?
                    <Building2 className="w-3 h-3" /> :

                    <User className="w-3 h-3" />
                    }
                      {p.type === 'ORG' ? 'Kurum' : 'Kişi'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.table_no}
                    {p.seat_label && `-${p.seat_label}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#1e3a5f]">
                      {getParticipantTotal(p.id)} Adet
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      p.status === 'active' ?
                      'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    )}>

                      {p.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(p)}
                      aria-label="Katılımcı düzenle">

                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateQR(p)}
                      aria-label="QR kod üret">

                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                      updateParticipant(p.id, {
                        status:
                        p.status === 'active' ? 'inactive' : 'active'
                      })
                      }
                      aria-label="Katılımcı durum değiştir">

                        {p.status === 'active' ?
                      <XCircle className="w-4 h-4 text-gray-500" /> :

                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      }
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QR Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => setShowBulkQRModal(true)}>

              <QrCode className="w-4 h-4 mr-2" /> Toplu QR Üret
            </Button>
            <Button variant="outline" onClick={handleDownloadLabels}>
              <Printer className="w-4 h-4 mr-2" /> PDF İndir (Etiket)
            </Button>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
            <div className="w-16 h-10 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <QrCode className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-xs text-gray-500">
              <div className="font-medium">Etiket Önizleme</div>
              <div>60×40mm</div>
            </div>
          </div>
        </div>
      </Card>

      {showBulkQRModal &&
      <BulkQRModal
        onClose={() => setShowBulkQRModal(false)}
        count={participants.length} />

      }
      {showQRModal && qrParticipant &&
      <ParticipantQRModal
        participant={qrParticipant}
        onClose={() => {
          setShowQRModal(false);
          setQrParticipant(null);
        }} />

      }
    </div>);

}
// ============ ITEMS TAB ============
function ItemsTab({
  items,
  activeItemId,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
  getItemTotal,
  getGrandTotal,
  getGrandTarget
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DonationItem>>({
    name: '',
    initial_target: 10,
    image_url: '',
    status: 'active',
    notes: '',
    order: items.length + 1
  });
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.order - b.order);
  }, [items]);
  const stats = useMemo(() => {
    const total = items.length;
    const activeCount = items.filter(
      (i: DonationItem) => i.status === 'active'
    ).length;
    const grandTarget = getGrandTarget();
    const grandTotal = getGrandTotal();
    return {
      total,
      activeCount,
      grandTarget,
      grandTotal
    };
  }, [items, getGrandTarget, getGrandTotal]);
  const handleSubmit = () => {
    if (!formData.name) return;
    if (editingId) {
      updateItem(editingId, formData);
    } else {
      addItem({
        ...formData,
        order: items.length + 1
      } as Omit<DonationItem, 'id'>);
    }
    resetForm();
  };
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      initial_target: 10,
      image_url: '',
      status: 'active',
      notes: '',
      order: items.length + 1
    });
  };
  const handleEdit = (item: DonationItem) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };
  const nextItem = useMemo(() => {
    const activeIndex = sortedItems.findIndex(
      (i: DonationItem) => i.id === activeItemId
    );
    if (activeIndex >= 0 && activeIndex < sortedItems.length - 1) {
      return sortedItems[activeIndex + 1];
    }
    return null;
  }, [sortedItems, activeItemId]);
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Package size={20} />}
          label="Toplam Kalem"
          value={stats.total}
          color="blue" />

        <KPICard
          icon={<Target size={20} />}
          label="Aktif Kalem"
          value={stats.activeCount}
          color="green" />

        <KPICard
          icon={<TrendingUp size={20} />}
          label="Toplam Hedef"
          value={stats.grandTarget}
          color="amber" />

        <KPICard
          icon={<CheckCircle2 size={20} />}
          label="Toplam Bağış"
          value={stats.grandTotal}
          color="green" />

      </div>

      {/* Queue Indicator */}
      <Card className="p-4 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-white/70">Sıradaki Kalem</div>
              <div className="text-xl font-bold">
                {nextItem ? nextItem.name : 'Son kalem aktif'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">Otomatik Sonraki</span>
            <button className="w-12 h-6 bg-white/20 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>
      </Card>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Kalem Ekle
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm &&
      <Card className="p-6">
          <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">
            {editingId ? 'Kalem Düzenle' : 'Yeni Kalem Ekle'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kalem Adı *
              </label>
              <input
              type="text"
              value={formData.name}
              onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              placeholder="Örn: Polis Motosikleti" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Adet *
              </label>
              <input
              type="number"
              value={formData.initial_target}
              onChange={(e) =>
              setFormData({
                ...formData,
                initial_target: parseInt(e.target.value) || 0
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              min={1} />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görsel URL
              </label>
              <input
              type="text"
              value={formData.image_url}
              onChange={(e) =>
              setFormData({
                ...formData,
                image_url: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              placeholder="https://..." />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
              value={formData.status}
              onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as any
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
              value={formData.notes}
              onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              rows={2} />

            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={resetForm}>
              İptal
            </Button>
            <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!formData.name}>

              Kaydet
            </Button>
          </div>
        </Card>
      }

      {/* Items List */}
      <Card className="overflow-hidden">
        <div className="divide-y">
          {sortedItems.map((item: DonationItem, index: number) => {
            const total = getItemTotal(item.id);
            const isActive = item.id === activeItemId;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 p-4',
                  isActive && 'bg-amber-50 border-l-4 border-l-[#f59e0b]'
                )}>

                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => reorderItems(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">

                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reorderItems(item.id, 'down')}
                    disabled={index === sortedItems.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">

                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {item.image_url ?
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover" /> :


                  <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h4>
                    {isActive &&
                    <span className="px-2 py-0.5 bg-[#f59e0b] text-white text-xs font-bold rounded">
                        AKTİF
                      </span>
                    }
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Hedef: {item.initial_target} • Bağış: {total}
                  </div>
                  <div className="mt-2 max-w-xs">
                    <ProgressBar
                      current={total}
                      target={item.initial_target}
                      height="sm" />

                  </div>
                </div>

                {/* Status */}
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium shrink-0',
                    item.status === 'active' ?
                    'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  )}>

                  {item.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    aria-label="Kalem düzenle">

                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteItem(item.id)}
                    aria-label="Kalem sil">

                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>);

          })}
        </div>
      </Card>
    </div>);

}
// ============ REPORTS TAB ============
function ReportsTab({
  donations,
  participants,
  items,
  getItemTotal,
  getGrandTotal,
  getGrandTarget
}: any) {
  const [showReportDownloadModal, setShowReportDownloadModal] = useState(false);
  const [, setSelectedReportType] = useState<string | null>(null);
  const approvedDonations = donations.filter(
    (d: any) => d.status === 'approved'
  );
  const stats = useMemo(() => {
    const grandTotal = getGrandTotal();
    const grandTarget = getGrandTarget();
    // Top donor
    const donorTotals = new Map<string, number>();
    approvedDonations.forEach((d: any) => {
      const current = donorTotals.get(d.participant_id) || 0;
      donorTotals.set(d.participant_id, current + d.quantity);
    });
    let topDonorId = '';
    let topDonorAmount = 0;
    donorTotals.forEach((amount, id) => {
      if (amount > topDonorAmount) {
        topDonorAmount = amount;
        topDonorId = id;
      }
    });
    const topDonor = participants.find((p: any) => p.id === topDonorId);
    // Most donated item
    let topItemId = '';
    let topItemAmount = 0;
    items.forEach((item: any) => {
      const total = getItemTotal(item.id);
      if (total > topItemAmount) {
        topItemAmount = total;
        topItemId = item.id;
      }
    });
    const topItem = items.find((i: any) => i.id === topItemId);
    return {
      grandTotal,
      grandTarget,
      topDonor,
      topDonorAmount,
      topItem,
      topItemAmount
    };
  }, [
  approvedDonations,
  participants,
  items,
  getGrandTotal,
  getGrandTarget,
  getItemTotal]
  );
  const topDonors = useMemo(() => {
    const donorTotals = new Map<string, number>();
    approvedDonations.forEach((d: any) => {
      const current = donorTotals.get(d.participant_id) || 0;
      donorTotals.set(d.participant_id, current + d.quantity);
    });
    return Array.from(donorTotals.entries()).
    map(([id, total]) => ({
      participant: participants.find((p: any) => p.id === id),
      total
    })).
    filter((item) => item.participant).
    sort((a, b) => b.total - a.total).
    slice(0, 10);
  }, [approvedDonations, participants]);
  const recentDonations = useMemo(() => {
    return [...donations].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }, [donations]);
  const handleDownloadReport = (type: string) => {
    setSelectedReportType(type);
    setShowReportDownloadModal(true);
  };
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<TrendingUp size={20} />}
          label="Toplam Bağış"
          value={`${stats.grandTotal} Adet`}
          color="green" />

        <KPICard
          icon={<Target size={20} />}
          label="Toplam Hedef"
          value={`${stats.grandTarget} Adet`}
          color="blue" />

        <KPICard
          icon={<Trophy size={20} />}
          label="Top Bağışçı"
          value={stats.topDonor?.display_name || '-'}
          color="amber" />

        <KPICard
          icon={<Package size={20} />}
          label="En Çok Bağış Alan"
          value={stats.topItem?.name || '-'}
          color="blue" />

      </div>

      {/* Export Buttons */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleDownloadReport('csv')}>
            <Download className="w-4 h-4 mr-2" /> Tüm İşlemler CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownloadReport('xlsx')}>

            <FileDown className="w-4 h-4 mr-2" /> Tüm İşlemler XLSX
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleDownloadReport('summary')}>

            <FileBarChart className="w-4 h-4 mr-2" /> Özet Rapor
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#f59e0b]" />
              Top Bağışçılar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDonors.map((item, index) =>
              <div
                key={item.participant.id}
                className="flex items-center gap-3">

                  <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0 ?
                    'bg-[#f59e0b] text-white' :
                    index === 1 ?
                    'bg-gray-300 text-gray-700' :
                    index === 2 ?
                    'bg-amber-700 text-white' :
                    'bg-gray-100 text-gray-600'
                  )}>

                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.participant.display_name}
                    </div>
                  </div>
                  <div className="font-bold text-[#1e3a5f]">
                    {item.total} Adet
                  </div>
                </div>
              )}
              {topDonors.length === 0 &&
              <div className="text-center py-8 text-gray-400">
                  Henüz bağış yok
                </div>
              }
            </div>
          </CardContent>
        </Card>

        {/* Per-Item Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1e3a5f]" />
              Kalem Bazında Toplamlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item: DonationItem) => {
                const total = getItemTotal(item.id);
                const percent = Math.round(
                  total / Math.max(item.initial_target, total) * 100
                );
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                      <span className="text-gray-600">
                        {total} / {item.initial_target} ({percent}%)
                      </span>
                    </div>
                    <ProgressBar
                      current={total}
                      target={item.initial_target}
                      height="sm" />

                  </div>);

              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Son İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Zaman
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Bağışçı
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Kalem
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Adet
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentDonations.map((d: any) => {
                  const donor = participants.find(
                    (p: any) => p.id === d.participant_id
                  );
                  const item = items.find((i: any) => i.id === d.item_id);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(d.timestamp).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {donor?.display_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1e3a5f]">
                        {d.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            d.status === 'approved' ?
                            'bg-green-100 text-green-700' :
                            d.status === 'pending' ?
                            'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          )}>

                          {d.status === 'approved' ?
                          <CheckCircle2 className="w-3 h-3" /> :
                          d.status === 'pending' ?
                          <AlertCircle className="w-3 h-3" /> :

                          <XCircle className="w-3 h-3" />
                          }
                          {d.status === 'approved' ?
                          'Onaylı' :
                          d.status === 'pending' ?
                          'Bekliyor' :
                          'Reddedildi'}
                        </span>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showReportDownloadModal &&
      <ReportDownloadModal
        onClose={() => setShowReportDownloadModal(false)} />

      }
    </div>);

}
function BulkQRModal({
  onClose,
  count



}: {onClose: () => void;count: number;}) {
  const [format, setFormat] = useState('pdf');
  const [size, setSize] = useState('60x40');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Toplu QR Üret</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              {count} Katılımcı İçin QR
            </h4>
            <p className="text-sm text-gray-500">
              Seçili katılımcılar için QR kodları üretilecek
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiket Boyutu
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSize('60x40')}
                  className={cn(
                    'p-3 border rounded-lg text-sm text-center transition-colors',
                    size === '60x40' ?
                    'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-medium' :
                    'hover:bg-gray-50'
                  )}>

                  60mm x 40mm
                  <div className="text-xs text-gray-400 mt-1">
                    Standart Yaka Kartı
                  </div>
                </button>
                <button
                  onClick={() => setSize('80x50')}
                  className={cn(
                    'p-3 border rounded-lg text-sm text-center transition-colors',
                    size === '80x50' ?
                    'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-medium' :
                    'hover:bg-gray-50'
                  )}>

                  80mm x 50mm
                  <div className="text-xs text-gray-400 mt-1">Büyük Boy</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çıktı Formatı
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                    className="text-[#1e3a5f]" />

                  <span>PDF (Baskıya Hazır)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'zip'}
                    onChange={() => setFormat('zip')}
                    className="text-[#1e3a5f]" />

                  <span>ZIP (PNG Dosyaları)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={onClose}>
            <Printer className="w-4 h-4 mr-2" /> Üret ve İndir
          </Button>
        </div>
      </div>
    </div>);

}
function ReportDownloadModal({ onClose }: {onClose: () => void;}) {
  const [loading, setLoading] = useState(false);
  const handleDownload = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Rapor İndir</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rapor Tipi
            </label>
            <select className="w-full px-3 py-2 border rounded-lg">
              <option>Özet Rapor</option>
              <option>Detaylı İşlem Dökümü</option>
              <option>Top Bağışçılar Listesi</option>
              <option>Kalem Bazında Analiz</option>
              <option>Katılımcı Listesi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="format" defaultChecked /> PDF
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="format" /> Excel (XLSX)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="format" /> CSV
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleDownload} disabled={loading}>
            {loading ?
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{' '}
                Hazırlanıyor...
              </> :

            <>
                <Download className="w-4 h-4 mr-2" /> İndir
              </>
            }
          </Button>
        </div>
      </div>
    </div>);

}
function ParticipantQRModal({
  participant,
  onClose
}: {participant: Participant;onClose: () => void;}) {
  const token = participant.token;
  const url = token ? `${window.location.origin}/#/p/${token}` : '';
  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert('Bağlantı panoya kopyalandı.');
    } catch {
      alert('Kopyalama başarısız.');
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">QR Kod</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <h4 className="text-lg font-bold text-gray-900">
              {participant.display_name}
            </h4>
            <p className="text-sm text-gray-500">Masa: {participant.table_no}</p>
          </div>

          <div className="flex items-center justify-center">
            {token ? (
              <div className="bg-white p-4 border rounded-xl">
                <QRCodeCanvas value={url} size={200} includeMargin />
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Token bulunamadı. Lütfen katılımcıyı güncelleyin.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Bağlantı
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-gray-50"
              />
              <Button variant="outline" onClick={handleCopy} disabled={!url}>
                Kopyala
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}