import React, { useEffect, useState } from 'react';
import { QrCode, Lock, X, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from '../lib/constants';
interface QRLandingPageProps {
  onOperatorLogin: () => void;
  isAuthenticated?: boolean;
  onAlreadyAuthenticated?: () => void;
}
export function QRLandingPage({
  onOperatorLogin,
  isAuthenticated = false,
  onAlreadyAuthenticated
}: QRLandingPageProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const DEMO_PIN = '1234'; // Demo PIN for UI purposes
  useEffect(() => {
    if (isAuthenticated && onAlreadyAuthenticated) {
      onAlreadyAuthenticated();
    }
  }, [isAuthenticated, onAlreadyAuthenticated]);
  const handlePinSubmit = () => {
    setIsLoading(true);
    setError('');
    // Simulate verification delay
    setTimeout(() => {
      if (pin === DEMO_PIN) {
        onOperatorLogin();
      } else {
        setError('Geçersiz PIN kodu. Tekrar deneyin.');
        setPin('');
      }
      setIsLoading(false);
    }, 500);
  };
  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setError('');
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handlePinSubmit();
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-2">
                <img
                  src={POLVAK_LOGO_URL}
                  alt={ORG_SHORT_NAME}
                  className="w-full h-full object-contain" />

              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{ORG_NAME}</h1>
              <p className="text-white/60 mt-2">
                {ORG_SHORT_NAME} Bağış Toplama Sistemi
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] px-6 py-4">
              <h2 className="text-lg font-bold text-[#1e3a5f] text-center">
                Bu sistem masanızdaki QR ile çalışır
              </h2>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Instructions */}
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Bağış yapmak için masanızdaki QR kodu telefonunuzla okutun.
                </p>
                <p className="text-sm text-gray-400">
                  Her masa için özel QR kod bulunmaktadır.
                </p>
              </div>

              {/* QR Illustration Card */}
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center border-2 border-dashed border-gray-200">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border border-gray-100">
                  <QrCode className="w-20 h-20 text-[#1e3a5f]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">QR Kodu Okutun</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Telefonunuzun kamerasını kullanın
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-600">
                    Masanızdaki QR kodu telefonunuzla tarayın
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-600">
                    Açılan sayfada bağış adedini seçin
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-600">
                    Bağışınız onaylandıktan sonra ekrana yansıyacak
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Login Button */}
          <div className="text-center">
            <button
              onClick={() => setShowPinModal(true)}
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors">

              <Lock className="w-4 h-4" />
              Yetkili Girişi
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-white/30 text-xs">
        © {new Date().getFullYear()} {ORG_SHORT_NAME} - {ORG_NAME}
      </div>

      {/* PIN Modal */}
      {showPinModal &&
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold">Yetkili Girişi</h3>
              </div>
              <button
              onClick={() => {
                setShowPinModal(false);
                setPin('');
                setError('');
              }}
              className="text-white/70 hover:text-white">

                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <p className="text-gray-600 text-center text-sm">
                Yönetim paneline erişmek için 4 haneli PIN kodunuzu girin.
              </p>

              {/* PIN Input */}
              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((index) =>
                <div
                  key={index}
                  className={cn(
                    'w-14 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-colors',
                    pin.length > index ?
                    'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]' :
                    'border-gray-200 bg-gray-50 text-gray-300',
                    error && 'border-red-300 bg-red-50'
                  )}>

                      {pin[index] ? '•' : ''}
                    </div>
                )}
                </div>

                {/* Hidden actual input for keyboard */}
                <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="sr-only"
                autoFocus />


                {/* Visible input for mobile */}
                <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PIN kodunu girin"
                className="w-full px-4 py-3 border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                autoFocus />


                {/* Error Message */}
                {error &&
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
              }
              </div>

              {/* Demo Hint */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs text-amber-700">
                  <strong>Demo:</strong> PIN kodu{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                    1234
                  </code>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                  setError('');
                }}>

                  İptal
                </Button>
                <Button
                variant="primary"
                className="flex-1"
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
                isLoading={isLoading}>

                  Giriş
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}