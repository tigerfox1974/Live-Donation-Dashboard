import React from 'react';
import { useEvent } from '../contexts/EventContext';
import { ProgressBar } from '../components/ProgressBar';
import { cn } from '../lib/utils';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from '../lib/constants';
import { Calendar, MapPin } from 'lucide-react';
import { EventStatusBadge } from '../components/ActiveEventBar';
import type { ActiveEventInfo } from '../App';
interface FinalScreenProps {
  activeEvent?: ActiveEventInfo | null;
}
export function FinalScreen({ activeEvent }: FinalScreenProps) {
  const {
    items,
    donations,
    participants,
    getGrandTotal,
    getGrandTarget,
    getItemTotal
  } = useEvent();
  const grandTotal = getGrandTotal();
  const grandTarget = getGrandTarget();
  // Top donors logic
  const donorStats = new Map<string, number>();
  donations.
  filter((d) => d.status === 'approved').
  forEach((d) => {
    const current = donorStats.get(d.participant_id) || 0;
    donorStats.set(d.participant_id, current + d.quantity);
  });
  const topDonors = Array.from(donorStats.entries()).
  map(([id, total]) => ({
    participant: participants.find((p) => p.id === id),
    total
  })).
  filter((item) => item.participant).
  sort((a, b) => b.total - a.total).
  slice(0, 10);
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e3a5f]/40 via-[#0f172a] to-[#0f172a] -z-10" />

      {/* Active Event Bar - Fixed at top */}
      {activeEvent &&
      <div className="fixed top-0 left-0 right-0 bg-white/5 border-b border-white/10 px-12 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/60" />
              <span className="text-white/70">Etkinlik:</span>
              <span className="font-semibold text-white">
                {activeEvent.name}
              </span>
              <EventStatusBadge status={activeEvent.status} />
            </div>
            {(activeEvent.date || activeEvent.venue) &&
          <div className="flex items-center gap-3 pl-3 border-l border-white/20 text-white/50">
                {activeEvent.date &&
            <span className="text-xs">
                    {new Date(activeEvent.date).toLocaleDateString('tr-TR')}
                  </span>
            }
                {activeEvent.venue &&
            <span className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    {activeEvent.venue}
                  </span>
            }
              </div>
          }
          </div>
          <div className="text-xs text-white/40">Final Ekranı</div>
        </div>
      }

      <div
        className={cn(
          'max-w-7xl w-full mx-auto space-y-16',
          activeEvent && 'pt-8'
        )}>

        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-8">
            <img
              src={POLVAK_LOGO_URL}
              alt={ORG_SHORT_NAME}
              className="w-32 h-32 object-contain" />

          </div>
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Teşekkür Ederiz
          </h1>
          <p className="text-2xl text-gray-400">
            {activeEvent ?
            activeEvent.name :
            `${ORG_SHORT_NAME} Dayanışma Gecesi`}
          </p>
        </div>

        {/* Grand Total Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-sm text-center transform hover:scale-105 transition-transform duration-500">
          <div className="text-gray-400 text-2xl uppercase tracking-widest mb-4">
            Gecenin Toplam Bağışı
          </div>
          <div className="flex items-baseline justify-center space-x-4">
            <span className="text-9xl font-bold text-[#f59e0b] drop-shadow-2xl">
              {grandTotal}
            </span>
            <span className="text-4xl text-gray-500 font-medium">
              / {grandTarget} Adet
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Item Summary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-300 border-b border-white/10 pb-4">
              İhtiyaç Kalemleri Özeti
            </h2>
            <div className="space-y-6">
              {items.map((item) => {
                const total = getItemTotal(item.id);
                const percent = Math.round(
                  total / Math.max(item.initial_target, total) * 100
                );
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="font-bold text-white">
                        {total} / {item.initial_target}
                      </span>
                    </div>
                    <ProgressBar
                      current={total}
                      target={item.initial_target}
                      height="sm" />

                  </div>);

              })}
            </div>
          </div>

          {/* Top Donors */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-300 border-b border-white/10 pb-4">
              Gecenin Yıldızları
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {topDonors.map((item, idx) =>
              <div
                key={item.participant?.id}
                className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">

                  <div className="flex items-center space-x-4">
                    <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm',
                      idx === 0 ?
                      'bg-[#f59e0b] text-black' :
                      idx === 1 ?
                      'bg-gray-300 text-black' :
                      idx === 2 ?
                      'bg-amber-700 text-white' :
                      'bg-white/10 text-gray-400'
                    )}>

                      {idx + 1}
                    </div>
                    <span className="text-lg font-medium">
                      {item.participant?.display_name}
                    </span>
                  </div>
                  <span className="text-[#f59e0b] font-bold">
                    {item.total} Adet
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center pt-12">
          <div className="inline-flex items-center space-x-2 text-gray-500 bg-white/5 px-4 py-2 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Raporlar sisteme kaydedildi</span>
          </div>
        </div>
      </div>
    </div>);

}