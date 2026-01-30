import React, { useMemo, useState } from 'react';
import {
  Monitor,
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  Target,
  CheckCircle2,
  Clock,
  Radio,
  Play,
  Search,
  AlertCircle } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ProgressBar';
import { cn } from '../lib/utils';
import { POLVAK_LOGO_URL, ORG_SHORT_NAME } from '../lib/constants';
import type { ActiveEventInfo } from '../App';
import type { EventRecord } from '../types';
interface ProjectionEventSelectorProps {
  onBack: () => void;
  onSelectEvent: (event: ActiveEventInfo) => void;
  broadcastingEventId: string | null;
  events: EventRecord[];
}
export function ProjectionEventSelector({
  onBack,
  onSelectEvent,
  broadcastingEventId,
  events
}: ProjectionEventSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // Filter to show only live events, but also show broadcasting event if it exists
  const availableEvents = useMemo(() => {
    let filtered = events.filter((e) => e.status === 'live');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
        e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [events, searchQuery]);
  const broadcastingEvent = events.find(
    (e) => e.id === broadcastingEventId
  );
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const handleStartProjection = () => {
    if (selectedEventId) {
      const event = events.find((e) => e.id === selectedEventId);
      if (event) {
        onSelectEvent({
          id: event.id,
          name: event.name,
          status: event.status
        });
      }
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-900 text-white px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-3 text-sm">

            <ChevronLeft className="w-4 h-4" /> Panel Seçimine Dön
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden p-1">
                <img
                  src={POLVAK_LOGO_URL}
                  alt={ORG_SHORT_NAME}
                  className="w-full h-full object-contain" />

              </div>
              <div>
                <h1 className="text-2xl font-bold">Projeksiyon Paneli</h1>
                <p className="text-white/60 text-sm">
                  Yayınlanacak etkinliği seçin
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Broadcasting Event Alert */}
        {broadcastingEvent &&
        <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-green-600 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm text-green-600 font-medium">
                    Şu An Yayında
                  </div>
                  <div className="font-bold text-green-900">
                    {broadcastingEvent.name}
                  </div>
                </div>
              </div>
              <Button
              variant="primary"
              onClick={() =>
              onSelectEvent({
                id: broadcastingEvent.id,
                name: broadcastingEvent.name,
                status: broadcastingEvent.status
              })
              }
              className="bg-green-600 hover:bg-green-700">

                <Play className="w-4 h-4 mr-2" />
                Yayına Devam Et
              </Button>
            </div>
          </Card>
        }

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Etkinlik ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />

          </div>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-500" />
            Canlı Etkinlikler
          </h2>

          {availableEvents.length === 0 ?
          <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Canlı Etkinlik Bulunamadı
              </h3>
              <p className="text-gray-500 text-sm">
                Şu anda yayınlanabilecek canlı etkinlik bulunmamaktadır.
                <br />
                Operatör panelinden bir etkinliği canlıya alabilirsiniz.
              </p>
            </Card> :

          <div className="grid gap-4">
              {availableEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              const isBroadcasting = broadcastingEventId === event.id;
              const progressPercent = Math.round(
                event.totalApproved / event.totalTarget * 100
              );
              return (
                <Card
                  key={event.id}
                  className={cn(
                    'p-6 cursor-pointer transition-all duration-200',
                    isSelected && 'ring-2 ring-indigo-500 bg-indigo-50',
                    isBroadcasting && 'ring-2 ring-green-500 bg-green-50',
                    !isSelected &&
                    !isBroadcasting &&
                    'hover:shadow-lg hover:border-gray-300'
                  )}
                  onClick={() => setSelectedEventId(event.id)}>

                    <div className="flex items-start justify-between gap-6">
                      {/* Event Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">
                                {event.name}
                              </h3>
                              {isBroadcasting &&
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                  <Radio className="w-3 h-3 animate-pulse" />{' '}
                                  YAYINDA
                                </span>
                            }
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-200">
                                <Radio className="w-3 h-3" /> CANLI
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.date).toLocaleDateString(
                                'tr-TR'
                              )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.startTime} - {event.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.venue}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                              <Users className="w-3 h-3" /> Katılımcı
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {event.participantCount}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                              <Target className="w-3 h-3" /> Hedef
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {event.totalTarget}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
                              <CheckCircle2 className="w-3 h-3" /> Onaylı
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {event.totalApproved}
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                              <Clock className="w-3 h-3" /> Bekleyen
                            </div>
                            <div className="text-lg font-bold text-amber-700">
                              {event.totalPending}
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">İlerleme</span>
                            <span className="font-semibold text-gray-900">
                              {progressPercent}%
                            </span>
                          </div>
                          <ProgressBar
                          current={event.totalApproved}
                          target={event.totalTarget}
                          height="sm" />

                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-2 transition-colors',
                        isSelected ?
                        'border-indigo-500 bg-indigo-500' :
                        'border-gray-300'
                      )}>

                        {isSelected &&
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      }
                      </div>
                    </div>
                  </Card>);

            })}
            </div>
          }
        </div>

        {/* Action Bar */}
        {selectedEventId &&
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Seçili Etkinlik</div>
                <div className="font-bold text-gray-900">
                  {selectedEvent?.name}
                </div>
              </div>
              <Button
              variant="primary"
              size="lg"
              onClick={handleStartProjection}
              className="bg-indigo-600 hover:bg-indigo-700">

                <Play className="w-5 h-5 mr-2" />
                Projeksiyonu Başlat
              </Button>
            </div>
          </div>
        }
      </main>
    </div>);

}