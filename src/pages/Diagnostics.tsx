import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, RefreshCw, Database, Users, Package, Coins, CheckCircle2, XCircle } from 'lucide-react';
import type { Donation, DonationItem, EventRecord, Participant } from '../types';

const EVENTS_STORAGE_KEY = 'polvak_events';
const STORAGE_PREFIX = 'polvak_event_';

type StorageArrayResult<T> = {
  value: T[];
  error?: string;
};

type EventSnapshot = {
  eventId: string;
  name?: string;
  status?: string;
  hasEventRecord: boolean;
  items: StorageArrayResult<DonationItem>;
  participants: StorageArrayResult<Participant>;
  donations: StorageArrayResult<Donation>;
  activeItemId: string | null;
  participantTokenMissing: number;
  participantEventMismatch: number;
  warnings: string[];
};

const readArray = <T,>(key: string): StorageArrayResult<T> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { value: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { value: [], error: 'JSON array değil' };
    }
    return { value: parsed as T[] };
  } catch {
    return { value: [], error: 'JSON parse hatası' };
  }
};

const readValue = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const parseEventStorageKey = (key: string) => {
  if (!key.startsWith(STORAGE_PREFIX)) return null;
  const tail = key.slice(STORAGE_PREFIX.length);
  const lastUnderscore = tail.lastIndexOf('_');
  if (lastUnderscore === -1) return null;
  const eventId = tail.slice(0, lastUnderscore);
  const suffix = tail.slice(lastUnderscore + 1);
  if (!eventId || !suffix) return null;
  return { eventId, suffix };
};

const getStoredEvents = () => {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EventRecord[]) : [];
  } catch {
    return [];
  }
};

const buildKey = (eventId: string, suffix: string) =>
  `${STORAGE_PREFIX}${eventId}_${suffix}`;

const collectDiagnostics = (): {
  events: EventSnapshot[];
  orphanKeys: string[];
} => {
  const storedEvents = getStoredEvents();
  const eventMap = new Map(storedEvents.map((e) => [e.id, e]));

  const eventIds = new Set<string>(storedEvents.map((e) => e.id));
  const orphanKeys: string[] = [];
  const suffixes = new Set(['items', 'participants', 'donations', 'active_item']);

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const parsed = parseEventStorageKey(key);
    if (!parsed) continue;
    if (!suffixes.has(parsed.suffix)) {
      orphanKeys.push(key);
      continue;
    }
    eventIds.add(parsed.eventId);
  }

  const events: EventSnapshot[] = Array.from(eventIds).map((eventId) => {
    const eventRecord = eventMap.get(eventId);
    const items = readArray<DonationItem>(buildKey(eventId, 'items'));
    const participants = readArray<Participant>(
      buildKey(eventId, 'participants')
    );
    const donations = readArray<Donation>(buildKey(eventId, 'donations'));
    const activeItemId = readValue(buildKey(eventId, 'active_item'));

    const participantTokenMissing = participants.value.filter(
      (p) => !p.token
    ).length;
    const participantEventMismatch = participants.value.filter(
      (p) => p.eventId && p.eventId !== eventId
    ).length;

    const warnings: string[] = [];
    if (!eventRecord) {
      warnings.push('Etkinlik kaydı bulunamadı (polvak_events içinde yok).');
    }
    if (items.error) {
      warnings.push('Kalem verisi okunamadı.');
    } else if (items.value.length === 0) {
      warnings.push('Kalem listesi boş.');
    }
    if (participants.error) {
      warnings.push('Katılımcı verisi okunamadı.');
    } else if (participants.value.length === 0) {
      warnings.push('Katılımcı listesi boş.');
    }
    if (donations.error) {
      warnings.push('Bağış verisi okunamadı.');
    }
    if (participantTokenMissing > 0) {
      warnings.push('Token olmayan katılımcı var.');
    }
    if (participantEventMismatch > 0) {
      warnings.push('EventId uyumsuz katılımcı var.');
    }

    return {
      eventId,
      name: eventRecord?.name,
      status: eventRecord?.status,
      hasEventRecord: Boolean(eventRecord),
      items,
      participants,
      donations,
      activeItemId,
      participantTokenMissing,
      participantEventMismatch,
      warnings
    };
  });

  return { events, orphanKeys };
};

export function DiagnosticsPage() {
  const [snapshot, setSnapshot] = useState(collectDiagnostics);

  const summary = useMemo(() => {
    const totalEvents = snapshot.events.length;
    const missingEventRecords = snapshot.events.filter(
      (e) => !e.hasEventRecord
    ).length;
    const totalItems = snapshot.events.reduce(
      (sum, e) => sum + e.items.value.length,
      0
    );
    const totalParticipants = snapshot.events.reduce(
      (sum, e) => sum + e.participants.value.length,
      0
    );
    const totalDonations = snapshot.events.reduce(
      (sum, e) => sum + e.donations.value.length,
      0
    );
    return {
      totalEvents,
      missingEventRecords,
      totalItems,
      totalParticipants,
      totalDonations
    };
  }, [snapshot]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1e3a5f] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Diagnostics</h1>
            <p className="text-white/70 text-sm mt-1">
              LocalStorage bazlı veri kontrol paneli
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                window.location.hash = '#/events';
              }}
            >
              Etkinlik Konsolu
            </Button>
            <Button
              variant="secondary"
              className="bg-white text-[#1e3a5f] hover:bg-slate-100"
              onClick={() => setSnapshot(collectDiagnostics())}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Yenile
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Database className="w-4 h-4" /> Etkinlik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEvents}</div>
              {summary.missingEventRecords > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {summary.missingEventRecords} kayıt eksik
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Package className="w-4 h-4" /> Kalem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Katılımcı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Coins className="w-4 h-4" /> Bağış
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDonations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Şüpheli Anahtar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{snapshot.orphanKeys.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Etkinlik Bazlı Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.events.length === 0 && (
              <p className="text-sm text-gray-500">
                LocalStorage içinde etkinlik verisi bulunamadı.
              </p>
            )}
            {snapshot.events.map((event) => (
              <div
                key={event.eventId}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1e3a5f]">
                      {event.name || event.eventId}
                    </h3>
                    <p className="text-xs text-gray-500">ID: {event.eventId}</p>
                    {event.status && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        Durum: {event.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Package className="w-4 h-4" /> {event.items.value.length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4" /> {event.participants.value.length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4" /> {event.donations.value.length}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-xs text-gray-600">
                    <strong>Active Item:</strong>{' '}
                    {event.activeItemId || 'Yok'}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Token Eksik:</strong>{' '}
                    {event.participantTokenMissing}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>EventId Uyumsuz:</strong>{' '}
                    {event.participantEventMismatch}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Kayıt Durumu:</strong>{' '}
                    {event.hasEventRecord ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Tam
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> Eksik
                      </span>
                    )}
                  </div>
                </div>

                {event.warnings.length > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-2">
                      Uyarılar
                    </p>
                    <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                      {event.warnings.map((warn, idx) => (
                        <li key={`${event.eventId}-warn-${idx}`}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {snapshot.orphanKeys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Şüpheli LocalStorage Anahtarları</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                {snapshot.orphanKeys.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
