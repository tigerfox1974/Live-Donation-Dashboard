import React, { useEffect, useState, useRef } from 'react';
import { useEvent } from '../contexts/EventContext';
import { ProgressBar } from '../components/ProgressBar';
import {
  WifiOff,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Calendar,
  MapPin,
  Radio } from
'lucide-react';
import { cn } from '../lib/utils';
import { POLVAK_LOGO_URL, AUTO_TRANSITION_DELAY } from '../lib/constants';
import { EventStatusBadge } from '../components/ActiveEventBar';
import type { ActiveEventInfo } from '../App';
// Confetti component for celebration
function Confetti() {
  const colors = [
  '#f59e0b',
  '#1e3a5f',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'];

  const confettiPieces = Array.from(
    {
      length: 100
    },
    (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360
    })
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) =>
      <div
        key={piece.id}
        className="absolute animate-confetti"
        style={{
          left: `${piece.left}%`,
          top: '-20px',
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          transform: `rotate(${piece.rotation}deg)`
        }} />

      )}
    </div>);

}
interface DisplayScreenProps {
  activeEvent?: ActiveEventInfo | null;
}
export function DisplayScreen({ activeEvent }: DisplayScreenProps) {
  const {
    getActiveItem,
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    donations,
    participants,
    activeItemId,
    items,
    isTransitioning,
    setIsTransitioning,
    transitionCountdown,
    setTransitionCountdown,
    goToNextItem,
    goToPrevItem
  } = useEvent();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCelebratedTotal, setLastCelebratedTotal] = useState<number | null>(
    null
  );
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const activeItem = getActiveItem();
  const currentTotal = activeItem ? getItemTotal(activeItem.id) : 0;
  const initialTarget = activeItem ? activeItem.initial_target : 0;
  // Dynamic target: max of initial target and current total
  const displayTarget = Math.max(initialTarget, currentTotal);
  const isTargetReached = currentTotal >= initialTarget && currentTotal > 0;
  // Get current item index
  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  const currentItemIndex = sortedItems.findIndex((i) => i.id === activeItemId);
  const isLastItem = currentItemIndex === sortedItems.length - 1;
  // Clock and online check
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const onlineCheck = setInterval(() => setIsOnline(navigator.onLine), 5000);
    return () => {
      clearInterval(timer);
      clearInterval(onlineCheck);
    };
  }, []);
  // Handle target reached - trigger celebration and countdown
  // Sadece hedef TAM OLARAK ilk kez ulaşıldığında celebration göster
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  
  useEffect(() => {
    // Hedef henüz ulaşılmamışsa ve şimdi ulaşıldıysa
    if (
      isTargetReached &&
      !hasReachedTarget &&
      !isTransitioning
    ) {
      setShowCelebration(true);
      setHasReachedTarget(true);
      
      // Son item değilse otomatik geçiş başlat
      if (!isLastItem) {
        setIsTransitioning(true);
        setTransitionCountdown(AUTO_TRANSITION_DELAY / 1000);
      }
      
      // Celebration'u 5 saniye sonra kapat
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [
    currentTotal,
    isTargetReached,
    hasReachedTarget,
    isTransitioning,
    isLastItem
  ]);
  // Countdown timer - son item'da countdown çalışmasın
  useEffect(() => {
    // Son item'daysa countdown yapma
    if (isLastItem) {
      if (isTransitioning) {
        setIsTransitioning(false);
        setTransitionCountdown(0);
      }
      return;
    }
    
    if (isTransitioning && transitionCountdown > 0) {
      countdownRef.current = setTimeout(() => {
        setTransitionCountdown(transitionCountdown - 1);
      }, 1000);
    } else if (isTransitioning && transitionCountdown === 0) {
      goToNextItem();
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [isTransitioning, transitionCountdown, isLastItem]);
  // Reset celebration state when item changes
  useEffect(() => {
    setLastCelebratedTotal(null);
    setShowCelebration(false);
    setHasReachedTarget(false); // Yeni item için hedef durumunu sıfırla
  }, [activeItemId]);
  // Recent donations (last 5 approved)
  const recentDonations = [...donations].
  filter((d) => d.status === 'approved').
  sort((a, b) => b.timestamp - a.timestamp).
  slice(0, 5);
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
  slice(0, 5);
  if (!activeItem)
  return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white text-4xl">
        <img src={POLVAK_LOGO_URL} alt="POLVAK" className="w-32 h-32 mr-6" />
        Lütfen bir kalem seçiniz...
      </div>);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden flex flex-col font-sans">
      {/* Celebration Confetti */}
      {showCelebration && <Confetti />}

      {/* Active Event Bar */}
      {activeEvent &&
      <div className="bg-white/5 border-b border-white/10 px-12 py-2 flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">
              Projeksiyon Aktif
            </span>
          </div>
        </div>
      }

      {/* Top Bar */}
      <header className="h-24 bg-[#1e3a5f]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-12 z-10">
        <div className="flex items-center space-x-4">
          {/* POLVAK Logo */}
          <img
            src={POLVAK_LOGO_URL}
            alt="POLVAK"
            className="w-16 h-16 object-contain" />

          <div className="text-sm">
            <div className="font-bold text-white">POLVAK</div>
            <div className="text-white/60 text-xs">
              Kıbrıs Türk Polis
              <br />
              Güçlendirme Vakfı
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-lg uppercase tracking-widest font-medium">
            Gecenin Toplamı
          </span>
          <div className="text-3xl font-bold text-[#f59e0b]">
            {getGrandTotal()}{' '}
            <span className="text-white/50 text-xl">/ {getGrandTarget()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Item Navigation Indicator */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <button
              onClick={goToPrevItem}
              disabled={currentItemIndex === 0}
              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">

              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">
              {currentItemIndex + 1} / {sortedItems.length}
            </span>
            <button
              onClick={goToNextItem}
              disabled={isLastItem}
              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed">

              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-3xl font-mono font-bold leading-none">
              {currentTime.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleDateString('tr-TR')}
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-red-600/20 px-4 py-2 rounded-full border border-red-500/30">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-bold tracking-wider text-sm">
              CANLI
            </span>
          </div>
        </div>
      </header>

      {/* Transition Countdown Banner */}
      {isTransitioning &&
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 flex items-center justify-center gap-4 animate-pulse">
          <PartyPopper className="w-6 h-6" />
          <span className="text-xl font-bold">
            HEDEF TAMAMLANDI! Sonraki kaleme geçiliyor: {transitionCountdown}{' '}
            saniye
          </span>
          <PartyPopper className="w-6 h-6" />
        </div>
      }

      {/* Main Content */}
      <main className="flex-1 flex p-12 gap-12">
        {/* Left: Image */}
        <div className="w-1/3 flex flex-col justify-center">
          <div
            className={cn(
              'relative aspect-square rounded-3xl overflow-hidden border-4 shadow-2xl bg-black/20 transition-all duration-500',
              showCelebration ?
              'border-[#f59e0b] shadow-[#f59e0b]/30' :
              'border-white/10'
            )}>

            <img
              src={activeItem.image_url}
              alt={activeItem.name}
              className="w-full h-full object-cover" />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                {activeItem.name}
              </h2>
              <span className="text-[#f59e0b] text-xl font-medium tracking-wide uppercase">
                Aktif İhtiyaç Kalemi
              </span>
            </div>

            {/* Celebration Overlay */}
            {showCelebration &&
            <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/30 to-transparent flex items-center justify-center">
                <div className="text-center animate-bounce">
                  <PartyPopper className="w-24 h-24 text-[#f59e0b] mx-auto mb-4" />
                  <div className="text-4xl font-bold text-white drop-shadow-lg">
                    HEDEF TAMAMLANDI!
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        {/* Right: Stats & Progress */}
        <div className="w-2/3 flex flex-col justify-center space-y-16">
          <div className="grid grid-cols-2 gap-12">
            <div
              className={cn(
                'rounded-2xl p-8 border backdrop-blur-sm transition-all duration-500',
                showCelebration ?
                'bg-[#f59e0b]/20 border-[#f59e0b]/50' :
                'bg-white/5 border-white/10'
              )}>

              <div className="text-gray-400 text-2xl mb-2 uppercase tracking-wider">
                Bu Kalemde Toplam
              </div>
              <div
                className={cn(
                  'text-8xl font-bold tabular-nums tracking-tight transition-all duration-500',
                  showCelebration ?
                  'text-[#f59e0b] scale-110' :
                  'text-[#f59e0b]'
                )}>

                {currentTotal}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <div className="text-gray-400 text-2xl mb-2 uppercase tracking-wider">
                Bu Kalemde Hedef
              </div>
              <div className="text-8xl font-bold text-white tabular-nums tracking-tight">
                {displayTarget}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-medium text-gray-300">
                İlerleme Durumu
              </span>
              <span
                className={cn(
                  'text-3xl font-bold transition-colors',
                  isTargetReached ? 'text-green-400' : 'text-[#f59e0b]'
                )}>

                {isTargetReached ?
                '100%' :
                `${Math.round(currentTotal / displayTarget * 100)}%`}
                {isTargetReached && currentTotal > initialTarget &&
                <span className="text-lg text-green-400 ml-2">
                    (+{currentTotal - initialTarget} fazla!)
                  </span>
                }
              </span>
            </div>
            <ProgressBar
              current={currentTotal}
              target={displayTarget}
              height="xl" />

          </div>
        </div>
      </main>

      {/* Footer Stats */}
      <footer className="h-64 bg-[#0f172a] border-t border-white/10 grid grid-cols-2">
        {/* Recent Donations */}
        <div className="p-8 border-r border-white/10">
          <h3 className="text-xl font-semibold text-gray-400 mb-6 flex items-center">
            <span className="w-2 h-8 bg-[#f59e0b] mr-3 rounded-full"></span>
            SON BAĞIŞLAR
          </h3>
          <div className="space-y-4">
            {recentDonations.length === 0 ?
            <div className="text-gray-500 italic text-xl">
                İlk bağışı bekliyoruz...
              </div> :

            recentDonations.map((donation, index) => {
              const donor = participants.find(
                (p) => p.id === donation.participant_id
              );
              return (
                <div
                  key={donation.id}
                  className={cn(
                    'flex items-center justify-between',
                    index === 0 &&
                    'animate-in slide-in-from-left fade-in duration-500'
                  )}>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-[#f59e0b]">
                        {donation.quantity}
                      </div>
                      <span className="text-xl font-medium text-white">
                        {donor?.display_name || 'İsimsiz Bağışçı'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(donation.timestamp).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>);

            })
            }
          </div>
        </div>

        {/* Top Donors */}
        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-400 mb-6 flex items-center">
            <span className="w-2 h-8 bg-[#1e3a5f] mr-3 rounded-full"></span>
            TOP BAĞIŞÇILAR
          </h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {topDonors.map((item, idx) =>
            <div
              key={item.participant?.id}
              className="flex items-center justify-between border-b border-white/5 pb-2">

                <div className="flex items-center space-x-3">
                  <span
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded text-xs font-bold',
                    idx === 0 ?
                    'bg-[#f59e0b] text-black' :
                    idx === 1 ?
                    'bg-gray-300 text-black' :
                    idx === 2 ?
                    'bg-amber-700 text-white' :
                    'bg-white/10 text-gray-400'
                  )}>

                    {idx + 1}
                  </span>
                  <span className="text-lg text-white truncate max-w-[200px]">
                    {item.participant?.display_name}
                  </span>
                </div>
                <span className="text-[#f59e0b] font-bold text-xl">
                  {item.total} Adet
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Offline Overlay */}
      {!isOnline &&
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-red-600 text-white p-8 rounded-2xl flex flex-col items-center max-w-2xl text-center shadow-2xl animate-pulse">
            <WifiOff className="w-24 h-24 mb-6" />
            <h2 className="text-4xl font-bold mb-4">Bağlantı Kesildi</h2>
            <p className="text-2xl">
              Lütfen bekleyiniz, operatör kontrol ediyor.
            </p>
          </div>
        </div>
      }
    </div>);

}