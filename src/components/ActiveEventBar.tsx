import React, { useState, Component } from 'react';
import {
  Calendar,
  MapPin,
  ChevronDown,
  Radio,
  Edit2,
  Square,
  Archive,
  ExternalLink,
  Search,
  Clock,
  Plus } from
'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import type { EventRecord, EventStatus as EventStatusType } from '../types';
export type EventStatus = EventStatusType;
export interface ActiveEventData {
  id: string;
  name: string;
  status: EventStatus;
  date?: string;
  venue?: string;
}
interface ActiveEventBarProps {
  event: ActiveEventData | null;
  onChangeEvent?: () => void;
  onOpenEventDetail?: () => void;
  variant?: 'light' | 'dark';
  showMeta?: boolean;
  compact?: boolean;
}
// Status badge component
export function EventStatusBadge({
  status,
  size = 'sm'



}: {status: EventStatus;size?: 'sm' | 'md';}) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    live: 'bg-green-100 text-green-700 border-green-300',
    closed: 'bg-blue-100 text-blue-700 border-blue-300',
    archived: 'bg-gray-100 text-gray-500 border-gray-300'
  };
  const darkStyles = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    live: 'bg-green-500/20 text-green-300 border-green-500/30',
    closed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  const labels = {
    draft: 'TASLAK',
    live: 'CANLI',
    closed: 'KAPALI',
    archived: 'ARŞİV'
  };
  const icons = {
    draft: <Edit2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
    live:
    <Radio
      className={cn(
        size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
        status === 'live' && 'animate-pulse'
      )} />,


    closed: <Square className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
    archived: <Archive className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border font-bold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        styles[status]
      )}>

      {icons[status]} {labels[status]}
    </span>);

}
export function ActiveEventBar({
  event,
  onChangeEvent,
  onOpenEventDetail,
  variant = 'light',
  showMeta = true,
  compact = false
}: ActiveEventBarProps) {
  if (!event) return null;
  const isDark = variant === 'dark';
  return (
    <div
      className={cn(
        'px-4 py-2 flex items-center justify-between border-b',
        isDark ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'
      )}>

      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar
            className={cn(
              'w-4 h-4',
              isDark ? 'text-white/60' : 'text-blue-600'
            )} />

          <span className={isDark ? 'text-white/70' : 'text-blue-700'}>
            Etkinlik:
          </span>
          <span
            className={cn(
              'font-semibold',
              isDark ? 'text-white' : 'text-blue-900'
            )}>

            {event.name}
          </span>
          <EventStatusBadge status={event.status} />
        </div>

        {showMeta && (event.date || event.venue) &&
        <div
          className={cn(
            'flex items-center gap-3 pl-3 border-l',
            isDark ?
            'border-white/20 text-white/50' :
            'border-blue-200 text-blue-600'
          )}>

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
      </div>

      <div className="flex items-center gap-2">
        {onOpenEventDetail &&
        <button
          onClick={onOpenEventDetail}
          className={cn(
            'text-xs flex items-center gap-1 hover:underline',
            isDark ?
            'text-white/60 hover:text-white' :
            'text-blue-600 hover:text-blue-800'
          )}>

            <ExternalLink className="w-3 h-3" />
            Etkinliği Aç
          </button>
        }
        {onChangeEvent &&
        <button
          onClick={onChangeEvent}
          className={cn(
            'text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors',
            isDark ?
            'text-white/60 hover:text-white hover:bg-white/10' :
            'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
          )}>

            <ChevronDown className="w-3 h-3" />
            Değiştir
          </button>
        }
      </div>
    </div>);

}
// Event Selector Modal/Dropdown Component
interface EventSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: ActiveEventData) => void;
  onCreateNew?: () => void;
  currentEventId?: string | null;
  events: EventRecord[];
}
export function EventSelectorModal({
  isOpen,
  onClose,
  onSelectEvent,
  onCreateNew,
  currentEventId,
  events
}: EventSelectorProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  if (!isOpen) return null;
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
    e.name.toLowerCase().includes(search.toLowerCase()) || (
    e.venue?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4">
          <h3 className="font-bold text-lg">Etkinlik Seç</h3>
          <p className="text-white/60 text-sm">
            Çalışmak istediğiniz etkinliği seçin
          </p>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Etkinlik ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />

            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">

              <option value="all">Tüm Durumlar</option>
              <option value="live">Canlı</option>
              <option value="draft">Taslak</option>
              <option value="closed">Kapalı</option>
              <option value="archived">Arşiv</option>
            </select>
          </div>
        </div>

        {/* Event List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ?
          <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Etkinlik bulunamadı.</p>
            </div> :

          <div className="divide-y">
              {filteredEvents.map((event) =>
            <button
              key={event.id}
              onClick={() => {
                onSelectEvent(event);
                onClose();
              }}
              className={cn(
                'w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between',
                currentEventId === event.id &&
                'bg-blue-50 border-l-4 border-l-[#1e3a5f]'
              )}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {event.name}
                      </span>
                      <EventStatusBadge status={event.status} />
                      {currentEventId === event.id &&
                  <span className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded">
                          AKTİF
                        </span>
                  }
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {event.date &&
                  <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('tr-TR')}
                        </span>
                  }
                      {event.venue &&
                  <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </span>
                  }
                      <span>{event.participantCount} katılımcı</span>
                      <span className="text-green-600">
                        {event.totalApproved} onaylı
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
                </button>
            )}
            </div>
          }
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          {onCreateNew &&
          <Button
            variant="primary"
            onClick={() => {
              onCreateNew();
              onClose();
            }}>

              <Plus className="w-4 h-4 mr-2" /> Yeni Etkinlik
            </Button>
          }
        </div>
      </div>
    </div>);

}
// No Event Selected Empty State
interface NoEventEmptyStateProps {
  onSelectEvent: () => void;
  onCreateEvent: () => void;
  title?: string;
  description?: string;
}
export function NoEventEmptyState({
  onSelectEvent,
  onCreateEvent,
  title = 'Aktif Etkinlik Seçilmedi',
  description = 'Bu ekranlar seçili etkinliğe göre çalışır. Lütfen bir etkinlik seçin veya yeni etkinlik oluşturun.'
}: NoEventEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-6">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={onSelectEvent}>
            <Calendar className="w-4 h-4 mr-2" />
            Etkinlik Seç
          </Button>
          <Button variant="outline" onClick={onCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Etkinlik Oluştur
          </Button>
        </div>
      </div>
    </div>);

}