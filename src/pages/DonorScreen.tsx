import React, { useEffect, useState } from 'react';
import { useEvent } from '../contexts/EventContext';
import { Stepper } from '../components/Stepper';
import { Button } from '../components/ui/Button';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Shield,
  WifiOff } from
'lucide-react';
import { cn } from '../lib/utils';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from '../lib/constants';
import { EventStatusBadge } from '../components/ActiveEventBar';
import type { ActiveEventInfo } from '../App';
interface DonorScreenProps {
  participantId: string;
  activeEvent?: ActiveEventInfo | null;
}
export function DonorScreen({ participantId, activeEvent }: DonorScreenProps) {
  const {
    getActiveItem,
    addDonation,
    participants,
    activeItemId,
    canAcceptDonations,
    isTransitioning
  } = useEvent();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'blocked'>(
    'idle');
  const [lastActiveId, setLastActiveId] = useState<string | null>(activeItemId);
  const [isOnline, setIsOnline] = useState(true);
  const participant = participants.find((p) => p.id === participantId);
  const activeItem = getActiveItem();
  // Reset state when active item changes
  useEffect(() => {
    if (activeItemId !== lastActiveId) {
      setLastActiveId(activeItemId);
      setStatus('idle');
      setQuantity(1);
    }
  }, [activeItemId, lastActiveId]);
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
  const handleSubmit = async () => {
    if (!participant || !activeItem) return;
    // Check if donations are blocked (during transition)
    if (!canAcceptDonations) {
      setStatus('blocked');
      return;
    }
    setStatus('submitting');
    // Simulate network delay
    setTimeout(() => {
      const success = addDonation(participant.id, quantity);
      if (success) {
        setStatus('success');
      } else {
        setStatus('blocked');
      }
    }, 800);
  };
  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Geçersiz QR Kodu</h2>
          <p className="text-gray-500 mt-2">
            Lütfen görevliden yardım isteyiniz.
          </p>
        </div>
      </div>);

  }
  if (!activeItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <img
            src={POLVAK_LOGO_URL}
            alt={ORG_SHORT_NAME}
            className="w-20 h-20 mx-auto mb-4"
            loading="lazy" />

          <h2 className="text-xl font-bold text-gray-900">
            Etkinlik Bekleniyor
          </h2>
          <p className="text-gray-500 mt-2">
            Şu anda aktif bir bağış kalemi bulunmamaktadır.
          </p>
        </div>
      </div>);

  }
  // Blocked state - during transition
  if (status === 'blocked' || isTransitioning && status !== 'success') {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-amber-900 mb-2">
          Lütfen Bekleyin
        </h2>
        <p className="text-amber-700 text-lg mb-8">
          Şu anda bağış kalemi değiştiriliyor.
          <br />
          <span className="text-sm opacity-75">
            Birkaç saniye içinde tekrar deneyebilirsiniz.
          </span>
        </p>
        <Button
          variant="outline"
          className="w-full max-w-xs border-amber-600 text-amber-700 hover:bg-amber-100"
          onClick={() => setStatus('idle')}>

          Tekrar Dene
        </Button>
      </div>);

  }
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-green-900 mb-2">Teşekkürler!</h2>
        <p className="text-green-700 text-lg mb-8">
          {quantity} adet {activeItem.name} bağış talebiniz alındı.
          <br />
          <span className="text-sm opacity-75">
            Operatör onayından sonra ekrana yansıyacaktır.
          </span>
        </p>
        <Button
          variant="outline"
          className="w-full max-w-xs border-green-600 text-green-700 hover:bg-green-100"
          onClick={() => setStatus('idle')}>

          Yeni Bağış Yap
        </Button>
      </div>);

  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Active Event Header */}
      {activeEvent &&
      <div className="bg-[#1e3a5f] text-white px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-white/70">Etkinlik:</span>
            <span className="font-semibold">{activeEvent.name}</span>
            <EventStatusBadge status={activeEvent.status} />
          </div>
        </div>
      }

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold text-center mb-1">
          Bağışçı
        </p>
        <h1 className="text-lg font-bold text-[#1e3a5f] text-center truncate">
          {participant.display_name}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {/* Active Item Card */}
          <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="aspect-video relative bg-gray-100">
              <img
                src={activeItem.image_url}
                alt={activeItem.name}
                className="w-full h-full object-cover"
                loading="lazy" />

              <div className="absolute top-4 right-4 bg-[#f59e0b] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                AKTİF KALEM
              </div>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeItem.name}
              </h2>
              <p className="text-gray-500 text-sm">
                Lütfen bağışlamak istediğiniz adedi seçiniz.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-8">
            <div className="flex justify-center">
              <Stepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={99} />

            </div>

            <Button
              size="xl"
              className="w-full rounded-2xl shadow-xl shadow-blue-900/20 text-xl py-8"
              onClick={handleSubmit}
              isLoading={status === 'submitting'}
              disabled={!canAcceptDonations}>

              {canAcceptDonations ? 'Bağışı Gönder' : 'Lütfen Bekleyin...'}
            </Button>
          </div>
        </div>

        {/* Footer with Security Message */}
        <div className="mt-8 space-y-4">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Bu bağlantı kişiye özeldir ve seçili etkinlik ile senkron çalışır.
              {activeEvent &&
              <span className="block mt-1 text-blue-600">
                  Etkinlik: {activeEvent.name}
                </span>
              }
            </p>
          </div>

          {/* Logo and Copyright */}
          <div className="text-center flex flex-col items-center">
            <img
              src={POLVAK_LOGO_URL}
              alt={ORG_SHORT_NAME}
              className="w-12 h-12 mb-2"
              loading="lazy" />

            <p className="text-xs text-gray-400">
              {ORG_SHORT_NAME} - {ORG_NAME} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {!isOnline &&
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-red-600 text-white p-8 rounded-2xl flex flex-col items-center max-w-2xl text-center shadow-2xl animate-pulse">
            <WifiOff className="w-20 h-20 mb-6" />
            <h2 className="text-3xl font-bold mb-3">Bağlantı Kesildi</h2>
            <p className="text-lg">Lütfen bağlantı geri gelince tekrar deneyin.</p>
          </div>
        </div>
      }
    </div>);

}