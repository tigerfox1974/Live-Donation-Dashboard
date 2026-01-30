import React, { useMemo, useState, cloneElement, Fragment } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ProgressBar';
import { cn } from '../lib/utils';
import {
  Search,
  Plus,
  Upload,
  Download,
  Calendar,
  MapPin,
  Users,
  Package,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Copy,
  Play,
  Square,
  Archive,
  FileText,
  Trash2,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Eye,
  Edit2,
  QrCode,
  Printer,
  FileSpreadsheet,
  Trophy,
  Activity,
  Settings,
  History,
  ChevronLeft,
  Radio,
  FileDown,
  Check,
  ArrowUpDown,
  Building2,
  User,
  ChevronUp,
  GripVertical,
  Monitor,
  AlertTriangle,
  Headphones,
  FileUp,
  RefreshCw,
  Loader2 } from
'lucide-react';
import type { ActiveEventInfo } from '../App';
// ============ TYPES ============
type EventStatus = 'draft' | 'live' | 'closed' | 'archived';
interface EventRecord {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description?: string;
  status: EventStatus;
  participantCount: number;
  itemCount: number;
  totalTarget: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  lastUpdated: number;
  createdAt: number;
}
interface AuditLogEntry {
  id: string;
  eventId: string;
  timestamp: number;
  user: string;
  action: string;
  details: string;
}
interface EventsConsoleProps {
  onSwitchToOperator?: (event: ActiveEventInfo) => void;
  onSwitchToProjection?: (event: ActiveEventInfo) => void;
  onSwitchToFinal?: (event: ActiveEventInfo) => void;
  activeEventId?: string | null;
}
// ============ MOCK DATA ============
const MOCK_EVENTS: EventRecord[] = [
{
  id: 'evt-1',
  name: '2024 Yılsonu Bağış Gecesi',
  date: '2024-12-15',
  startTime: '19:00',
  endTime: '23:00',
  venue: 'Lefkoşa Merit Hotel',
  description: 'Yıllık ana bağış etkinliği',
  status: 'live',
  participantCount: 150,
  itemCount: 5,
  totalTarget: 168,
  totalApproved: 89,
  totalPending: 12,
  totalRejected: 3,
  lastUpdated: Date.now() - 300000,
  createdAt: Date.now() - 86400000 * 30
},
{
  id: 'evt-2',
  name: '2024 Bahar Dayanışma Gecesi',
  date: '2024-04-20',
  startTime: '19:30',
  endTime: '22:30',
  venue: 'Girne Acapulco Resort',
  status: 'closed',
  participantCount: 120,
  itemCount: 4,
  totalTarget: 100,
  totalApproved: 95,
  totalPending: 0,
  totalRejected: 5,
  lastUpdated: Date.now() - 86400000 * 200,
  createdAt: Date.now() - 86400000 * 250
},
{
  id: 'evt-3',
  name: '2025 Yeni Yıl Etkinliği',
  date: '2025-01-10',
  startTime: '20:00',
  endTime: '00:00',
  venue: 'Lefkoşa Büyük Han',
  status: 'draft',
  participantCount: 0,
  itemCount: 3,
  totalTarget: 50,
  totalApproved: 0,
  totalPending: 0,
  totalRejected: 0,
  lastUpdated: Date.now() - 3600000,
  createdAt: Date.now() - 86400000 * 5
},
{
  id: 'evt-4',
  name: '2023 Sonbahar Gecesi',
  date: '2023-10-15',
  startTime: '19:00',
  endTime: '22:00',
  venue: 'Gazimağusa Palm Beach',
  status: 'archived',
  participantCount: 80,
  itemCount: 3,
  totalTarget: 60,
  totalApproved: 58,
  totalPending: 0,
  totalRejected: 2,
  lastUpdated: Date.now() - 86400000 * 400,
  createdAt: Date.now() - 86400000 * 450
}];

const MOCK_AUDIT_LOG: AuditLogEntry[] = [
{
  id: 'log-1',
  eventId: 'evt-1',
  timestamp: Date.now() - 300000,
  user: 'admin',
  action: 'Bağış onaylandı',
  details: 'Kıbrıs Türk T.O. - 5 adet Motosiklet'
},
{
  id: 'log-2',
  eventId: 'evt-1',
  timestamp: Date.now() - 600000,
  user: 'admin',
  action: 'Kalem sırası değişti',
  details: 'Motosiklet → 1. sıra'
},
{
  id: 'log-3',
  eventId: 'evt-1',
  timestamp: Date.now() - 86400000,
  user: 'admin',
  action: 'Etkinlik canlıya alındı',
  details: ''
},
{
  id: 'log-4',
  eventId: 'evt-1',
  timestamp: Date.now() - 86400000 * 2,
  user: 'admin',
  action: 'Katılımcılar içe aktarıldı',
  details: '150 katılımcı eklendi'
},
{
  id: 'log-5',
  eventId: 'evt-1',
  timestamp: Date.now() - 86400000 * 30,
  user: 'admin',
  action: 'Etkinlik oluşturuldu',
  details: ''
}];

// Mock Data for Tabs
const MOCK_PARTICIPANTS = [
{
  id: 'p-1',
  type: 'ORG',
  display_name: 'Kıbrıs Türk Ticaret Odası',
  table_no: 'A1',
  status: 'active',
  qr_generated: true,
  total_donations: 15000
},
{
  id: 'p-2',
  type: 'ORG',
  display_name: 'Limasol Bankası',
  table_no: 'A2',
  status: 'active',
  qr_generated: true,
  total_donations: 25000
},
{
  id: 'p-3',
  type: 'PERSON',
  display_name: 'Ahmet Yılmaz',
  table_no: 'B1',
  seat_label: '1',
  status: 'active',
  qr_generated: true,
  total_donations: 5000
},
{
  id: 'p-4',
  type: 'PERSON',
  display_name: 'Mehmet Demir',
  table_no: 'B1',
  seat_label: '2',
  status: 'inactive',
  qr_generated: false,
  total_donations: 0
},
{
  id: 'p-5',
  type: 'ORG',
  display_name: 'Creditwest Bank',
  table_no: 'A3',
  status: 'active',
  qr_generated: true,
  total_donations: 50000
}];

const MOCK_ITEMS = [
{
  id: 'item-1',
  name: 'Polis Motosikleti',
  initial_target: 10,
  current: 4,
  image_url:
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
  order: 1,
  status: 'active'
},
{
  id: 'item-2',
  name: 'Devriye Aracı',
  initial_target: 5,
  current: 2,
  image_url:
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
  order: 2,
  status: 'active'
},
{
  id: 'item-3',
  name: 'Çelik Yelek Seti',
  initial_target: 50,
  current: 15,
  image_url:
  'https://images.unsplash.com/photo-1595759622382-747a835d3268?auto=format&fit=crop&q=80&w=800',
  order: 3,
  status: 'active'
}];

// ============ MAIN COMPONENT ============
export function EventsConsole({
  onSwitchToOperator,
  onSwitchToProjection,
  onSwitchToFinal,
  activeEventId
}: EventsConsoleProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<
    'date' | 'name' | 'totalApproved' | 'participantCount'>(
    'date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  // New Modals State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportEventsModal, setShowImportEventsModal] = useState(false);
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [statusChangeType, setStatusChangeType] = useState<
    'live' | 'close' | 'archive' | null>(
    null);
  const [showReportDownloadModal, setShowReportDownloadModal] = useState(false);
  const selectedEvent = MOCK_EVENTS.find((e) => e.id === selectedEventId);
  // Stats
  const stats = useMemo(() => {
    const total = MOCK_EVENTS.length;
    const live = MOCK_EVENTS.filter((e) => e.status === 'live').length;
    const draft = MOCK_EVENTS.filter((e) => e.status === 'draft').length;
    const archived = MOCK_EVENTS.filter(
      (e) => e.status === 'closed' || e.status === 'archived'
    ).length;
    const totalDonations = MOCK_EVENTS.reduce(
      (sum, e) => sum + e.totalApproved,
      0
    );
    return {
      total,
      live,
      draft,
      archived,
      totalDonations
    };
  }, []);
  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    let result = [...MOCK_EVENTS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.date.includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date')
      cmp = new Date(a.date).getTime() - new Date(b.date).getTime();else
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);else
      if (sortBy === 'totalApproved')
      cmp = a.totalApproved - b.totalApproved;else
      if (sortBy === 'participantCount')
      cmp = a.participantCount - b.participantCount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [searchQuery, statusFilter, sortBy, sortDir]);
  const toggleRowSelection = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);else
    newSet.add(id);
    setSelectedRows(newSet);
  };
  const toggleAllRows = () => {
    if (selectedRows.size === filteredEvents.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredEvents.map((e) => e.id)));
    }
  };
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };
  const handleStatusChange = (type: 'live' | 'close' | 'archive') => {
    setStatusChangeType(type);
    setShowConfirmStatusModal(true);
  };
  const handleSwitchToOperator = (event: EventRecord) => {
    if (onSwitchToOperator) {
      onSwitchToOperator({
        id: event.id,
        name: event.name,
        status: event.status,
        date: event.date,
        venue: event.venue
      });
    }
  };
  const handleSwitchToProjection = (event: EventRecord) => {
    if (onSwitchToProjection) {
      onSwitchToProjection({
        id: event.id,
        name: event.name,
        status: event.status,
        date: event.date,
        venue: event.venue
      });
    }
  };
  const handleSwitchToFinal = (event: EventRecord) => {
    if (onSwitchToFinal) {
      onSwitchToFinal({
        id: event.id,
        name: event.name,
        status: event.status,
        date: event.date,
        venue: event.venue
      });
    }
  };
  // If an event is selected, show detail view
  if (selectedEvent) {
    return (
      <EventDetailView
        event={selectedEvent}
        onBack={() => setSelectedEventId(null)}
        auditLog={MOCK_AUDIT_LOG.filter((l) => l.eventId === selectedEvent.id)}
        onSwitchToOperator={() => handleSwitchToOperator(selectedEvent)}
        onSwitchToProjection={() => handleSwitchToProjection(selectedEvent)}
        onSwitchToFinal={() => handleSwitchToFinal(selectedEvent)}
        isActiveEvent={activeEventId === selectedEvent.id} />);


  }
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Etkinlik Konsolu</h1>
              <p className="text-white/60 text-sm mt-1">
                Çoklu bağış gecesi yönetimi ve arşiv
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Etkinlik ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30" />

              </div>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowImportEventsModal(true)}>

                <Upload className="w-4 h-4 mr-2" /> İçe Aktar
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowExportModal(true)}>

                <Download className="w-4 h-4 mr-2" /> Dışa Aktar
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewEventModal(true)}>

                <Plus className="w-4 h-4 mr-2" /> Yeni Etkinlik
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard
            icon={<Calendar />}
            label="Toplam Etkinlik"
            value={stats.total}
            color="blue" />

          <KPICard
            icon={<Radio />}
            label="Canlı Etkinlik"
            value={stats.live}
            color="green" />

          <KPICard
            icon={<Edit2 />}
            label="Taslak"
            value={stats.draft}
            color="amber" />

          <KPICard
            icon={<Archive />}
            label="Kapalı/Arşiv"
            value={stats.archived}
            color="gray" />

          <KPICard
            icon={<TrendingUp />}
            label="Toplam Bağış"
            value={`${stats.totalDonations} Adet`}
            color="green" />

        </div>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}>

                <Filter className="w-4 h-4 mr-2" /> Filtreler
              </Button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

                <option value="all">Tüm Durumlar</option>
                <option value="draft">Taslak</option>
                <option value="live">Canlı</option>
                <option value="closed">Kapalı</option>
                <option value="archived">Arşiv</option>
              </select>
            </div>

            {selectedRows.size > 0 &&
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedRows.size} seçili
                </span>
                <Button
                size="sm"
                variant="ghost"
                className="text-blue-700"
                onClick={() => handleStatusChange('archive')}>

                  <Archive className="w-4 h-4 mr-1" /> Toplu Arşivle
                </Button>
                <Button
                size="sm"
                variant="ghost"
                className="text-blue-700"
                onClick={() => setShowExportModal(true)}>

                  <Download className="w-4 h-4 mr-1" /> Dışa Aktar
                </Button>
              </div>
            }
          </div>

          {/* Filter Panel */}
          {showFilters &&
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Tarih Aralığı
                </label>
                <div className="flex gap-2">
                  <input
                  type="date"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" />

                  <input
                  type="date"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" />

                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Mekân
                </label>
                <input
                type="text"
                placeholder="Mekân ara..."
                className="w-full px-3 py-2 border rounded-lg text-sm" />

              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Özel Filtreler
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  Sadece problemli etkinlikler
                </label>
              </div>
              <div className="flex items-end">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowFilters(false);
                  setSearchQuery('');
                  setStatusFilter('all');
                }}>

                  Filtreleri Temizle
                </Button>
              </div>
            </div>
          }
        </Card>

        {/* Events Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={
                      selectedRows.size === filteredEvents.length &&
                      filteredEvents.length > 0
                      }
                      onChange={toggleAllRows}
                      className="rounded" />

                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-900">

                      Etkinlik Adı <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-900">

                      Tarih <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Mekân
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort('participantCount')}
                      className="flex items-center gap-1 hover:text-gray-900">

                      Katılımcı <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Hedef
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort('totalApproved')}
                      className="flex items-center gap-1 hover:text-gray-900">

                      Onaylı <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Bekleyen
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEvents.map((event) =>
                <tr
                  key={event.id}
                  className={cn(
                    'hover:bg-gray-50',
                    selectedRows.has(event.id) && 'bg-blue-50'
                  )}>

                    <td className="px-4 py-3">
                      <input
                      type="checkbox"
                      checked={selectedRows.has(event.id)}
                      onChange={() => toggleRowSelection(event.id)}
                      className="rounded" />

                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                      onClick={() => setSelectedEventId(event.id)}
                      className="font-medium text-[#1e3a5f] hover:underline text-left">

                        {event.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString('tr-TR')}
                      <span className="text-gray-400 ml-2">
                        {event.startTime}-{event.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {event.venue}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {event.participantCount}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {event.totalTarget}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-green-600">
                        {event.totalApproved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {event.totalPending > 0 ?
                    <span className="font-semibold text-amber-600">
                          {event.totalPending}
                        </span> :

                    <span className="text-gray-400">0</span>
                    }
                    </td>
                    <td className="px-4 py-3">
                      <RowActionsMenu
                      event={event}
                      onView={() => setSelectedEventId(event.id)}
                      onClone={() => setShowCloneModal(true)}
                      onDelete={() => handleDeleteClick(event.id)}
                      onSwitchToOperator={() => handleSwitchToOperator(event)}
                      onSwitchToProjection={() =>
                      handleSwitchToProjection(event)
                      }
                      onSwitchToFinal={() => handleSwitchToFinal(event)}
                      onStatusChange={handleStatusChange}
                      onExport={() => setShowExportModal(true)}
                      onReport={() => setShowReportDownloadModal(true)} />

                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 &&
          <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Etkinlik bulunamadı.</p>
            </div>
          }
        </Card>
      </main>

      {/* Modals */}
      {showNewEventModal &&
      <NewEventModal onClose={() => setShowNewEventModal(false)} />
      }

      {showCloneModal &&
      <CloneEventModal onClose={() => setShowCloneModal(false)} />
      }

      {showDeleteModal &&
      <DeleteConfirmModal
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // Handle delete
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }} />

      }

      {showExportModal &&
      <ExportModal onClose={() => setShowExportModal(false)} />
      }

      {showImportEventsModal &&
      <ImportEventsModal onClose={() => setShowImportEventsModal(false)} />
      }

      {showConfirmStatusModal && statusChangeType &&
      <ConfirmStatusChangeModal
        type={statusChangeType}
        onClose={() => setShowConfirmStatusModal(false)}
        onConfirm={() => {
          // Handle status change
          setShowConfirmStatusModal(false);
        }} />

      }

      {showReportDownloadModal &&
      <ReportDownloadModal
        onClose={() => setShowReportDownloadModal(false)} />

      }
    </div>);

}
// ============ HELPER COMPONENTS ============
function KPICard({
  icon,
  label,
  value,
  color





}: {icon: React.ReactNode;label: string;value: string | number;color: 'blue' | 'green' | 'amber' | 'gray';}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-100 text-gray-600'
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            colors[color]
          )}>

          {cloneElement(icon as React.ReactElement, {
            size: 20
          })}
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </Card>);

}
function StatusBadge({ status }: {status: EventStatus;}) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    live: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-blue-100 text-blue-700 border-blue-200',
    archived: 'bg-gray-100 text-gray-500 border-gray-200'
  };
  const labels = {
    draft: 'TASLAK',
    live: 'CANLI',
    closed: 'KAPALI',
    archived: 'ARŞİV'
  };
  const icons = {
    draft: <Edit2 className="w-3 h-3" />,
    live: <Radio className="w-3 h-3" />,
    closed: <Square className="w-3 h-3" />,
    archived: <Archive className="w-3 h-3" />
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border',
        styles[status]
      )}>

      {icons[status]} {labels[status]}
    </span>);

}
function RowActionsMenu({
  event,
  onView,
  onClone,
  onDelete,
  onSwitchToOperator,
  onSwitchToProjection,
  onSwitchToFinal,
  onStatusChange,
  onExport,
  onReport











}: {event: EventRecord;onView: () => void;onClone: () => void;onDelete: () => void;onSwitchToOperator?: () => void;onSwitchToProjection?: () => void;onSwitchToFinal?: () => void;onStatusChange: (type: 'live' | 'close' | 'archive') => void;onExport: () => void;onReport: () => void;}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-gray-100 rounded-lg">

        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {open &&
      <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border z-20 py-1">
            <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

              <Eye className="w-4 h-4" /> Aç (Detay)
            </button>

            {/* Quick Navigation Section */}
            {(event.status === 'live' || event.status === 'draft') &&
          <>
                <div className="border-t my-1" />
                <div className="px-4 py-1 text-xs text-gray-400 uppercase font-medium">
                  Hızlı Geçiş
                </div>
                {onSwitchToOperator &&
            <button
              onClick={() => {
                onSwitchToOperator();
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700">

                    <Headphones className="w-4 h-4" /> Operatöre Geç
                  </button>
            }
                {onSwitchToProjection && event.status === 'live' &&
            <button
              onClick={() => {
                onSwitchToProjection();
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 text-indigo-700">

                    <Monitor className="w-4 h-4" /> Projeksiyonu Aç
                  </button>
            }
                {onSwitchToFinal && event.status === 'live' &&
            <button
              onClick={() => {
                onSwitchToFinal();
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-700">

                    <Trophy className="w-4 h-4" /> Final Ekranı Aç
                  </button>
            }
              </>
          }

            <div className="border-t my-1" />
            <button
            onClick={() => {
              onClone();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

              <Copy className="w-4 h-4" /> Kopyala / Klonla
            </button>
            {event.status === 'draft' &&
          <button
            onClick={() => {
              onStatusChange('live');
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600">

                <Play className="w-4 h-4" /> Canlıya Al
              </button>
          }
            {event.status === 'live' &&
          <button
            onClick={() => {
              onStatusChange('close');
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

                <Square className="w-4 h-4" /> Kapat
              </button>
          }
            {event.status === 'closed' &&
          <button
            onClick={() => {
              onStatusChange('archive');
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

                <Archive className="w-4 h-4" /> Arşivle
              </button>
          }
            <button
            onClick={() => {
              onReport();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

              <FileText className="w-4 h-4" /> Raporlar
            </button>
            <button
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">

              <Download className="w-4 h-4" /> Dışa Aktar
            </button>
            {event.status === 'draft' &&
          <>
                <div className="border-t my-1" />
                <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">

                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              </>
          }
          </div>
        </>
      }
    </div>);

}
// ============ EVENT DETAIL VIEW ============
function EventDetailView({
  event,
  onBack,
  auditLog,
  onSwitchToOperator,
  onSwitchToProjection,
  onSwitchToFinal,
  isActiveEvent








}: {event: EventRecord;onBack: () => void;auditLog: AuditLogEntry[];onSwitchToOperator?: () => void;onSwitchToProjection?: () => void;onSwitchToFinal?: () => void;isActiveEvent?: boolean;}) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participants' | 'items' | 'transactions' | 'reports' | 'audit'>(
    'overview');
  // Modals for Detail View
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [statusChangeType, setStatusChangeType] = useState<
    'live' | 'close' | 'archive' | null>(
    null);
  const [showReportDownloadModal, setShowReportDownloadModal] = useState(false);
  const [showImportParticipantsModal, setShowImportParticipantsModal] =
  useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const handleStatusChange = (type: 'live' | 'close' | 'archive') => {
    setStatusChangeType(type);
    setShowConfirmStatusModal(true);
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-3 text-sm">

            <ChevronLeft className="w-4 h-4" /> Etkinlik Listesine Dön
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <StatusBadge status={event.status} />
              {isActiveEvent &&
              <span className="bg-[#f59e0b] text-white px-2 py-1 rounded text-xs font-bold">
                  AKTİF ETKİNLİK
                </span>
              }
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Operatör Moduna Geç Button */}
              {onSwitchToOperator &&
              <Button
                variant="secondary"
                onClick={onSwitchToOperator}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-0">

                  <Headphones className="w-4 h-4 mr-2" />
                  Operatör
                </Button>
              }

              {event.status === 'draft' &&
              <Button
                variant="secondary"
                onClick={() => handleStatusChange('live')}>

                  <Play className="w-4 h-4 mr-2" /> Canlıya Al
                </Button>
              }
              {event.status === 'live' &&
              <>
                  {onSwitchToProjection &&
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={onSwitchToProjection}>

                      <Monitor className="w-4 h-4 mr-2" /> Projeksiyon
                    </Button>
                }
                  {onSwitchToFinal &&
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={onSwitchToFinal}>

                      <Trophy className="w-4 h-4 mr-2" /> Final
                    </Button>
                }
                  <Button
                  variant="danger"
                  onClick={() => handleStatusChange('close')}>

                    <Square className="w-4 h-4 mr-2" /> Kapat
                  </Button>
                </>
              }
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowReportDownloadModal(true)}>

                <Download className="w-4 h-4 mr-2" /> Raporlar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Operation Strip - Status-based CTAs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(event.date).toLocaleDateString('tr-TR')}</span>
              <span className="text-gray-300">•</span>
              <Clock className="w-4 h-4" />
              <span>
                {event.startTime} - {event.endTime}
              </span>
              <span className="text-gray-300">•</span>
              <MapPin className="w-4 h-4" />
              <span>{event.venue}</span>
            </div>

            {/* Status-based Operation CTAs */}
            <div className="flex flex-wrap items-center gap-2">
              {event.status === 'draft' &&
              <>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportParticipantsModal(true)}>

                    <Users className="w-4 h-4 mr-1" /> Katılımcı Yükle
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('items')}>

                    <Package className="w-4 h-4 mr-1" /> Kalemleri Düzenle
                  </Button>
                  <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange('live')}>

                    <Play className="w-4 h-4 mr-1" /> Etkinliği Canlıya Al
                  </Button>
                </>
              }
              {event.status === 'live' &&
              <>
                  {onSwitchToOperator &&
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSwitchToOperator}>

                      <Headphones className="w-4 h-4 mr-1" /> Operatör Modu
                    </Button>
                }
                  {onSwitchToProjection &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSwitchToProjection}>

                      <Monitor className="w-4 h-4 mr-1" /> Projeksiyon
                    </Button>
                }
                  {onSwitchToFinal &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSwitchToFinal}>

                      <Trophy className="w-4 h-4 mr-1" /> Final
                    </Button>
                }
                  <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleStatusChange('close')}>

                    <Square className="w-4 h-4 mr-1" /> Kapat
                  </Button>
                </>
              }
              {(event.status === 'closed' || event.status === 'archived') &&
              <>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportDownloadModal(true)}>

                    <Download className="w-4 h-4 mr-1" /> Raporları İndir
                  </Button>
                  <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCloneModal(true)}>

                    <Copy className="w-4 h-4 mr-1" /> Kopyala (Yeni Etkinlik)
                  </Button>
                </>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {[
            {
              id: 'overview',
              label: 'Genel Bakış',
              icon: <Eye size={16} />
            },
            {
              id: 'participants',
              label: 'Katılımcılar',
              icon: <Users size={16} />
            },
            {
              id: 'items',
              label: 'İhtiyaç Kalemleri',
              icon: <Package size={16} />
            },
            {
              id: 'transactions',
              label: 'Bağış İşlemleri',
              icon: <Activity size={16} />
            },
            {
              id: 'reports',
              label: 'Raporlar',
              icon: <FileText size={16} />
            },
            {
              id: 'audit',
              label: 'Denetim Kaydı',
              icon: <History size={16} />
            }].
            map((tab) =>
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id ?
                'border-[#1e3a5f] text-[#1e3a5f]' :
                'border-transparent text-gray-500 hover:text-gray-700'
              )}>

                {tab.icon} {tab.label}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' &&
        <OverviewTab
          event={event}
          onSwitchToOperator={onSwitchToOperator}
          onSwitchToProjection={onSwitchToProjection}
          onSwitchToFinal={onSwitchToFinal} />

        }
        {activeTab === 'participants' && <ParticipantsTab />}
        {activeTab === 'items' && <ItemsTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'audit' && <AuditTab auditLog={auditLog} />}
      </main>

      {/* Detail View Modals */}
      {showConfirmStatusModal && statusChangeType &&
      <ConfirmStatusChangeModal
        type={statusChangeType}
        onClose={() => setShowConfirmStatusModal(false)}
        onConfirm={() => setShowConfirmStatusModal(false)} />

      }
      {showReportDownloadModal &&
      <ReportDownloadModal
        onClose={() => setShowReportDownloadModal(false)} />

      }
      {showImportParticipantsModal &&
      <ImportParticipantsModal
        onClose={() => setShowImportParticipantsModal(false)} />

      }
      {showCloneModal &&
      <CloneEventModal onClose={() => setShowCloneModal(false)} />
      }
    </div>);

}
function OverviewTab({
  event,
  onSwitchToOperator,
  onSwitchToProjection,
  onSwitchToFinal





}: {event: EventRecord;onSwitchToOperator?: () => void;onSwitchToProjection?: () => void;onSwitchToFinal?: () => void;}) {
  return (
    <div className="space-y-6">
      {/* Quick Actions Card - Only for live events */}
      {event.status === 'live' &&
      <Card className="p-4 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="font-bold">Etkinlik Canlı</div>
                <div className="text-sm text-white/70">
                  Bu etkinlik için canlı operasyonlara geçin
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onSwitchToOperator &&
            <Button
              variant="secondary"
              onClick={onSwitchToOperator}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-0">

                  <Headphones className="w-4 h-4 mr-2" />
                  Operatör
                </Button>
            }
              {onSwitchToProjection &&
            <Button
              variant="outline"
              onClick={onSwitchToProjection}
              className="border-white/30 text-white hover:bg-white/10">

                  <Monitor className="w-4 h-4 mr-2" />
                  Projeksiyon
                </Button>
            }
              {onSwitchToFinal &&
            <Button
              variant="outline"
              onClick={onSwitchToFinal}
              className="border-white/30 text-white hover:bg-white/10">

                  <Trophy className="w-4 h-4 mr-2" />
                  Final
                </Button>
            }
            </div>
          </div>
        </Card>
      }

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPICard
          icon={<Target />}
          label="Toplam Hedef"
          value={event.totalTarget}
          color="blue" />

        <KPICard
          icon={<CheckCircle2 />}
          label="Onaylı Bağış"
          value={event.totalApproved}
          color="green" />

        <KPICard
          icon={<Clock />}
          label="Bekleyen"
          value={event.totalPending}
          color="amber" />

        <KPICard
          icon={<XCircle />}
          label="Reddedilen"
          value={event.totalRejected}
          color="gray" />

        <KPICard
          icon={<Users />}
          label="Katılımcı"
          value={event.participantCount}
          color="blue" />

        <KPICard
          icon={<Package />}
          label="Kalem Sayısı"
          value={event.itemCount}
          color="blue" />

      </div>

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Etkinlik Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Tarih</div>
                <div className="font-medium">
                  {new Date(event.date).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Saat</div>
                <div className="font-medium">
                  {event.startTime} - {event.endTime}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Mekân</div>
                <div className="font-medium">{event.venue}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İlerleme Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Toplam İlerleme</span>
                <span className="font-semibold">
                  {Math.round(event.totalApproved / event.totalTarget * 100)}%
                </span>
              </div>
              <ProgressBar
                current={event.totalApproved}
                target={event.totalTarget}
                height="md" />

            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {event.totalApproved}
                </div>
                <div className="text-xs text-gray-500">Onaylı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {event.totalPending}
                </div>
                <div className="text-xs text-gray-500">Bekleyen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {event.totalRejected}
                </div>
                <div className="text-xs text-gray-500">Reddedilen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Zaman İçinde Bağış Adedi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              <TrendingUp className="w-8 h-8 mr-2" /> Grafik Alanı (Line Chart)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kalem Bazında Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              <Package className="w-8 h-8 mr-2" /> Grafik Alanı (Bar Chart)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}
function ParticipantsTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkQRModal, setShowBulkQRModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [search, setSearch] = useState('');
  const handleEdit = (participant: any) => {
    setSelectedParticipant(participant);
    setShowEditModal(true);
  };
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Katılımcı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />

            </div>
            <select className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">
              <option>Tüm Tipler</option>
              <option>Kurum</option>
              <option>Kişi</option>
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">
              <option>Tüm Durumlar</option>
              <option>Aktif</option>
              <option>Pasif</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}>

              <Upload className="w-4 h-4 mr-2" /> CSV/XLSX İçe Aktar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkQRModal(true)}>

              <QrCode className="w-4 h-4 mr-2" /> QR Üret
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Etiket PDF özelliği yakında eklenecek.')}>

              <Printer className="w-4 h-4 mr-2" /> Etiket PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}>

              <Plus className="w-4 h-4 mr-2" /> Katılımcı Ekle
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  QR
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  İsim
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tip
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Masa/Koltuk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Toplam Bağış
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Durum
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_PARTICIPANTS.map((p) =>
              <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {p.qr_generated ?
                  <QrCode className="w-5 h-5 text-green-600" /> :

                  <QrCode className="w-5 h-5 text-gray-300" />
                  }
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.display_name}
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
                    {p.table_no} {p.seat_label && ` / ${p.seat_label}`}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1e3a5f]">
                    {p.total_donations > 0 ? `${p.total_donations} TL` : '-'}
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(p)}>

                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => alert('QR üretiliyor...')}>

                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {showAddModal &&
      <ParticipantFormModal
        mode="add"
        onClose={() => setShowAddModal(false)} />

      }
      {showEditModal && selectedParticipant &&
      <ParticipantFormModal
        mode="edit"
        initialData={selectedParticipant}
        onClose={() => {
          setShowEditModal(false);
          setSelectedParticipant(null);
        }} />

      }
      {showImportModal &&
      <ImportParticipantsModal onClose={() => setShowImportModal(false)} />
      }
      {showBulkQRModal &&
      <BulkQRModal
        onClose={() => setShowBulkQRModal(false)}
        count={MOCK_PARTICIPANTS.length} />

      }
    </div>);

}
function ItemsTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };
  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteConfirmModal(true);
  };
  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (isLocked) return;
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    // Add a slight delay to show the dragging state
    setTimeout(() => {
      const element = document.getElementById(`item-${itemId}`);
      if (element) element.classList.add('opacity-50');
    }, 0);
  };
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverItem(null);
    // Remove opacity from all items
    items.forEach((item) => {
      const element = document.getElementById(`item-${item.id}`);
      if (element) element.classList.remove('opacity-50');
    });
  };
  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (isLocked || draggedItem === itemId) return;
    setDragOverItem(itemId);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverItem(null);
  };
  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    if (isLocked || !draggedItem || draggedItem === targetItemId) return;
    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedItems.findIndex((i) => i.id === draggedItem);
    const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    // Reorder items
    const newItems = [...sortedItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    setItems(updatedItems);
    setDraggedItem(null);
    setDragOverItem(null);
  };
  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}>

              <Upload className="w-4 h-4 mr-2" /> CSV İçe Aktar
            </Button>
            <Button
              variant={isLocked ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsLocked(!isLocked)}>

              <Settings className="w-4 h-4 mr-2" />
              {isLocked ? 'Sıralama Kilitli' : 'Sıralamayı Kilitle'}
            </Button>
            {!isLocked &&
            <span className="text-xs text-gray-500 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                Sıralamak için sürükle-bırak yapın
              </span>
            }
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}>

            <Plus className="w-4 h-4 mr-2" /> Kalem Ekle
          </Button>
        </div>
      </Card>

      {/* Items List */}
      <Card className="overflow-hidden">
        <div className="divide-y">
          {sortedItems.map((item, index) =>
          <div
            key={item.id}
            id={`item-${item.id}`}
            draggable={!isLocked}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            className={cn(
              'flex items-center gap-4 p-4 hover:bg-gray-50 group transition-all duration-200',
              dragOverItem === item.id &&
              'bg-blue-50 border-t-2 border-blue-400',
              draggedItem === item.id && 'opacity-50',
              !isLocked && 'cursor-move'
            )}>

              {/* Drag Handle */}
              <div
              className={cn(
                'text-gray-400 transition-colors',
                isLocked ?
                'opacity-30 cursor-not-allowed' :
                'cursor-grab active:cursor-grabbing hover:text-gray-600'
              )}>

                <GripVertical className="w-5 h-5" />
              </div>

              {/* Order Number */}
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                {item.image_url ?
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover" /> :


              <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-6 h-6" />
                  </div>
              }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    item.status === 'active' ?
                    'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  )}>

                    {item.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Hedef: <strong>{item.initial_target}</strong>
                  </span>
                  <span>
                    Mevcut: <strong>{item.current || 0}</strong>
                  </span>
                </div>
                <div className="mt-2 max-w-xs">
                  <ProgressBar
                  current={item.current || 0}
                  target={item.initial_target}
                  height="sm" />

                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(item)}>

                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(item)}>

                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      {showAddModal &&
      <ItemFormModal mode="add" onClose={() => setShowAddModal(false)} />
      }
      {showEditModal && selectedItem &&
      <ItemFormModal
        mode="edit"
        initialData={selectedItem}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }} />

      }
      {showImportModal &&
      <ImportItemsModal onClose={() => setShowImportModal(false)} />
      }
      {showDeleteConfirmModal && selectedItem &&
      <DeleteItemConfirmModal
        itemName={selectedItem.name}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setSelectedItem(null);
        }}
        onConfirm={() => {
          // Handle delete
          setItems(items.filter((i) => i.id !== selectedItem.id));
          setShowDeleteConfirmModal(false);
          setSelectedItem(null);
        }} />

      }
    </div>);

}
function TransactionsTab() {
  const [showExportModal, setShowExportModal] = useState(false);
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Tüm Durumlar</option>
              <option>Onaylı</option>
              <option>Bekleyen</option>
              <option>Reddedilen</option>
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Tüm Kalemler</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border rounded-lg text-sm" />

            <input
              type="date"
              className="px-3 py-2 border rounded-lg text-sm" />

          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}>

            <Download className="w-4 h-4 mr-2" /> Seçilenleri Dışa Aktar
          </Button>
        </div>
      </Card>

      {/* Transactions Table Placeholder */}
      <Card>
        <div className="p-8 text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>İşlem tablosu burada görüntülenecek.</p>
          <p className="text-sm text-gray-400 mt-2">
            timestamp, katılımcı, kalem, adet, status, onaylayan, not
          </p>
        </div>
      </Card>

      {showExportModal &&
      <ExportModal onClose={() => setShowExportModal(false)} />
      }
    </div>);

}
function ReportsTab() {
  const [showReportDownloadModal, setShowReportDownloadModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(
    null
  );
  const handleDownloadReport = (type: string) => {
    setSelectedReportType(type);
    setShowReportDownloadModal(true);
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
        {
          id: 'transactions-csv',
          icon: <FileSpreadsheet />,
          label: 'Tüm İşlemler CSV',
          desc: 'Tüm bağış işlemlerini CSV olarak indir'
        },
        {
          id: 'transactions-xlsx',
          icon: <FileSpreadsheet />,
          label: 'Tüm İşlemler XLSX',
          desc: 'Tüm bağış işlemlerini Excel olarak indir'
        },
        {
          id: 'summary',
          icon: <FileText />,
          label: 'Özet Rapor',
          desc: 'Etkinlik özet raporu (PDF)'
        },
        {
          id: 'top-donors',
          icon: <Trophy />,
          label: 'Top Bağışçılar',
          desc: 'En çok bağış yapanlar listesi'
        },
        {
          id: 'items-summary',
          icon: <Package />,
          label: 'Kalem Bazında Özet',
          desc: 'Her kalem için ayrı özet'
        },
        {
          id: 'participants-list',
          icon: <Users />,
          label: 'Katılımcı Listesi',
          desc: 'Tüm katılımcılar ve bağışları'
        }].
        map((report, i) =>
        <Card
          key={i}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleDownloadReport(report.id)}>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                {report.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">{report.label}</div>
                <div className="text-xs text-gray-500 mt-1">{report.desc}</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {showReportDownloadModal &&
      <ReportDownloadModal
        onClose={() => setShowReportDownloadModal(false)} />

      }
    </div>);

}
function AuditTab({ auditLog }: {auditLog: AuditLogEntry[];}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="divide-y">
          {auditLog.map((entry) =>
          <div key={entry.id} className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <History className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {entry.action}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{entry.user}</span>
                </div>
                {entry.details &&
              <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
              }
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(entry.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>);

}
// ============ MODALS ============
function NewEventModal({ onClose }: {onClose: () => void;}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '19:00',
    endTime: '23:00',
    venue: '',
    description: '',
    template: 'empty'
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Yeni Etkinlik Oluştur</h3>
            <p className="text-white/60 text-sm">Adım {step} / 3</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) =>
            <Fragment key={s}>
                <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  s <= step ?
                  'bg-[#1e3a5f] text-white' :
                  'bg-gray-200 text-gray-500'
                )}>

                  {s}
                </div>
                {s < 3 &&
              <div
                className={cn(
                  'flex-1 h-1 rounded',
                  s < step ? 'bg-[#1e3a5f]' : 'bg-gray-200'
                )} />

              }
              </Fragment>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 &&
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                Temel Bilgiler
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etkinlik Adı *
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
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Örn: 2025 Bahar Bağış Gecesi" />

              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih *
                  </label>
                  <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value
                  })
                  }
                  className="w-full px-3 py-2 border rounded-lg" />

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç
                  </label>
                  <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    startTime: e.target.value
                  })
                  }
                  className="w-full px-3 py-2 border rounded-lg" />

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş
                  </label>
                  <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    endTime: e.target.value
                  })
                  }
                  className="w-full px-3 py-2 border rounded-lg" />

                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mekân
                </label>
                <input
                type="text"
                value={formData.venue}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  venue: e.target.value
                })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Örn: Lefkoşa Merit Hotel" />

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                value={formData.description}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value
                })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2} />

              </div>
            </div>
          }

          {step === 2 &&
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                Başlangıç Verisi
              </h4>
              <div className="space-y-3">
                {[
              {
                id: 'empty',
                label: 'Boş Etkinlik',
                desc: 'Sıfırdan başla, katılımcı ve kalem ekle'
              },
              {
                id: 'template',
                label: 'Şablondan Oluştur',
                desc: 'Önceki bir etkinliği temel al'
              },
              {
                id: 'import',
                label: 'CSV/XLSX ile İçe Aktar',
                desc: 'Katılımcı ve kalem listesi yükle'
              }].
              map((opt) =>
              <label
                key={opt.id}
                className={cn(
                  'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                  formData.template === opt.id ?
                  'border-[#1e3a5f] bg-blue-50' :
                  'hover:bg-gray-50'
                )}>

                    <input
                  type="radio"
                  name="template"
                  value={opt.id}
                  checked={formData.template === opt.id}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    template: e.target.value
                  })
                  }
                  className="mt-1" />

                    <div>
                      <div className="font-medium text-gray-900">
                        {opt.label}
                      </div>
                      <div className="text-sm text-gray-500">{opt.desc}</div>
                    </div>
                  </label>
              )}
              </div>
            </div>
          }

          {step === 3 &&
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Onay</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Etkinlik Adı</span>
                  <span className="font-medium">{formData.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarih</span>
                  <span className="font-medium">{formData.date || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mekân</span>
                  <span className="font-medium">{formData.venue || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Başlangıç Verisi</span>
                  <span className="font-medium">
                    {formData.template === 'empty' ?
                  'Boş' :
                  formData.template === 'template' ?
                  'Şablon' :
                  'İçe Aktar'}
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Not:</strong> Etkinlik taslak olarak oluşturulacak.
                  Canlıya almadan önce katılımcı ve kalem ekleyebilirsiniz.
                </p>
              </div>
            </div>
          }
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}>

            {step === 1 ? 'İptal' : 'Geri'}
          </Button>
          <Button
            variant="primary"
            onClick={step === 3 ? onClose : () => setStep(step + 1)}
            disabled={step === 1 && !formData.name}>

            {step === 3 ? 'Taslak Oluştur' : 'İleri'}
          </Button>
        </div>
      </div>
    </div>);

}
function CloneEventModal({ onClose }: {onClose: () => void;}) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    copyParticipants: true,
    copyItems: true,
    copyOrder: true,
    copyTargets: true
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Etkinliği Klonla</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Etkinlik Adı *
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
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Örn: 2025 Bahar Gecesi (Kopya)" />

          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Tarih
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg" />

          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Kopyalanacak Veriler
            </label>
            <div className="space-y-2">
              {[
              {
                key: 'copyParticipants',
                label: 'Katılımcıları kopyala'
              },
              {
                key: 'copyItems',
                label: 'Kalemleri kopyala'
              },
              {
                key: 'copyOrder',
                label: 'Sıralamayı kopyala'
              },
              {
                key: 'copyTargets',
                label: 'Hedefleri kopyala'
              }].
              map((opt) =>
              <label key={opt.key} className="flex items-center gap-2">
                  <input
                  type="checkbox"
                  checked={(formData as any)[opt.key]}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    [opt.key]: e.target.checked
                  })
                  }
                  className="rounded" />

                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" disabled={!formData.name}>
            <Copy className="w-4 h-4 mr-2" /> Klonla
          </Button>
        </div>
      </div>
    </div>);

}
function DeleteConfirmModal({
  onClose,
  onConfirm



}: {onClose: () => void;onConfirm: () => void;}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Etkinliği Sil
          </h3>
          <p className="text-gray-600 text-sm">
            Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 mr-2" /> Sil
          </Button>
        </div>
      </div>
    </div>);

}
// ============ NEW MODALS ============
function ParticipantFormModal({
  mode,
  initialData,
  onClose




}: {mode: 'add' | 'edit';initialData?: any;onClose: () => void;}) {
  const [formData, setFormData] = useState({
    type: 'PERSON',
    display_name: '',
    table_no: '',
    seat_label: '',
    notes: '',
    status: 'active',
    ...initialData
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {mode === 'add' ? 'Yeni Katılımcı Ekle' : 'Katılımcı Düzenle'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tip *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value
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
              placeholder="İsim Soyisim veya Kurum Adı"
              required />

          </div>
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Örn: A1" />

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
                placeholder="Örn: 1" />

            </div>
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
                status: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
          <div>
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
              rows={3}
              placeholder="Opsiyonel notlar..." />

          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={onClose}
            disabled={!formData.display_name}>

            {mode === 'add' ? 'Ekle' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>);

}
function ImportParticipantsModal({ onClose }: {onClose: () => void;}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Katılımcı İçe Aktar (CSV/XLSX)</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-gray-500 mt-2">
              CSV veya Excel (.xlsx) dosyaları desteklenir
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Örnek Format</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono text-gray-600 overflow-x-auto">
              display_name, type, table_no, seat_label, status
              <br />
              Ahmet Yılmaz, PERSON, A1, 1, active
              <br />
              Kıbrıs Türk Ticaret Odası, ORG, B2, , active
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              İçe aktarma işlemi mevcut katılımcı listesine ekleme yapacaktır.
              Aynı isimli kayıtlar için uyarı verilecektir.
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" disabled>
            İçe Aktar
          </Button>
        </div>
      </div>
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
function ItemFormModal({
  mode,
  initialData,
  onClose




}: {mode: 'add' | 'edit';initialData?: any;onClose: () => void;}) {
  const [formData, setFormData] = useState({
    name: '',
    initial_target: 10,
    image_url: '',
    status: 'active',
    notes: '',
    ...initialData
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {mode === 'add' ? 'Yeni Kalem Ekle' : 'Kalem Düzenle'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
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
              placeholder="Örn: Polis Motosikleti"
              required />

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
              min="1"
              required />

          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görsel URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  image_url: e.target.value
                })
                }
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                placeholder="https://..." />

              {formData.image_url &&
              <div className="w-10 h-10 rounded border overflow-hidden shrink-0">
                  <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover" />

                </div>
              }
            </div>
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
                status: e.target.value
              })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
          <div>
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
              rows={3}
              placeholder="Opsiyonel notlar..." />

          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={onClose}
            disabled={!formData.name || formData.initial_target <= 0}>

            {mode === 'add' ? 'Ekle' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>);

}
function ImportItemsModal({ onClose }: {onClose: () => void;}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Kalem Listesi İçe Aktar (CSV)</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Sadece CSV dosyaları desteklenir
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Örnek Format</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono text-gray-600 overflow-x-auto">
              name, initial_target, image_url, status
              <br />
              Polis Motosikleti, 10, https://..., active
              <br />
              Devriye Aracı, 5, , active
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" disabled>
            İçe Aktar
          </Button>
        </div>
      </div>
    </div>);

}
// ============ NEWLY ADDED MODALS ============
function ExportModal({ onClose }: {onClose: () => void;}) {
  const [format, setFormat] = useState('csv');
  const [scope, setScope] = useState('all');
  const handleDownload = () => {
    // Simulate download
    setTimeout(() => {
      onClose();
    }, 1000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Dışa Aktar</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['csv', 'xlsx', 'pdf'].map((f) =>
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  'p-3 border rounded-lg text-sm text-center uppercase transition-colors',
                  format === f ?
                  'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-medium' :
                  'hover:bg-gray-50'
                )}>

                  {f}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Veri Kapsamı
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="text-[#1e3a5f]" />

                <span>Tüm Veriler</span>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'selected'}
                  onChange={() => setScope('selected')}
                  className="text-[#1e3a5f]" />

                <span>Sadece Seçili Satırlar</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> İndir
          </Button>
        </div>
      </div>
    </div>);

}
function ImportEventsModal({ onClose }: {onClose: () => void;}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Etkinlik İçe Aktar</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Yedek dosyasını buraya sürükleyin
            </p>
            <p className="text-sm text-gray-500 mt-2">
              .json veya .zip formatında yedek dosyaları
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" disabled>
            İçe Aktar
          </Button>
        </div>
      </div>
    </div>);

}
function ConfirmStatusChangeModal({
  type,
  onClose,
  onConfirm




}: {type: 'live' | 'close' | 'archive';onClose: () => void;onConfirm: () => void;}) {
  const config = {
    live: {
      title: 'Etkinliği Canlıya Al',
      message:
      'Bu etkinlik canlı duruma geçecek. Operatör paneli ve projeksiyon ekranları aktif olacak.',
      icon: <Play className="w-8 h-8 text-green-600" />,
      color: 'bg-green-100',
      btnVariant: 'success' as const,
      btnText: 'Canlıya Al'
    },
    close: {
      title: 'Etkinliği Kapat',
      message:
      'Etkinlik kapatılacak. Yeni bağış girişi yapılamayacak ancak raporlara erişilebilecek.',
      icon: <Square className="w-8 h-8 text-red-600" />,
      color: 'bg-red-100',
      btnVariant: 'danger' as const,
      btnText: 'Etkinliği Kapat'
    },
    archive: {
      title: 'Etkinliği Arşivle',
      message: 'Bu etkinlik arşive taşınacak. Ana listede görünmeyecek.',
      icon: <Archive className="w-8 h-8 text-gray-600" />,
      color: 'bg-gray-100',
      btnVariant: 'secondary' as const,
      btnText: 'Arşivle'
    }
  }[type];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              config.color
            )}>

            {config.icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {config.title}
          </h3>
          <p className="text-gray-600 text-sm">{config.message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant={config.btnVariant} onClick={onConfirm}>
            {config.btnText}
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
function DeleteItemConfirmModal({
  itemName,
  onClose,
  onConfirm




}: {itemName: string;onClose: () => void;onConfirm: () => void;}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Kalemi Sil</h3>
          <p className="text-gray-600 text-sm">
            <strong>{itemName}</strong> adlı kalemi silmek istediğinizden emin
            misiniz?
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 mr-2" /> Sil
          </Button>
        </div>
      </div>
    </div>);

}