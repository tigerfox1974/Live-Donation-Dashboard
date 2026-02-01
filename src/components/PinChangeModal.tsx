/**
 * PIN Change Modal Component
 * 
 * Allows administrators to change the operator PIN.
 * Requires admin PIN verification before allowing changes.
 */

import { useState } from 'react';
import { X, Lock, Shield, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { 
  changeOperatorPin, 
  resetOperatorPin,
  isRateLimited, 
  recordAttempt,
  getRemainingAttempts,
  getCsrfToken,
  validateCsrfToken
} from '../lib/security';
import { logger } from '../lib/logger';

interface PinChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PinChangeModal({ isOpen, onClose, onSuccess }: PinChangeModalProps) {
  const [step, setStep] = useState<'admin' | 'change'>('admin');
  const [adminPin, setAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken] = useState(() => getCsrfToken());

  const resetForm = () => {
    setStep('admin');
    setAdminPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAdminVerify = async () => {
    setError('');
    
    // Check rate limiting
    const rateLimit = isRateLimited('admin_pin');
    if (rateLimit.limited) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000);
      setError(`Çok fazla hatalı deneme. ${minutes} dakika sonra tekrar deneyin.`);
      return;
    }

    // Validate CSRF
    if (!validateCsrfToken(csrfToken)) {
      setError('Güvenlik tokeni geçersiz. Sayfayı yenileyin.');
      logger.warn('CSRF validation failed on admin PIN verification');
      return;
    }

    setIsLoading(true);

    // Verify admin PIN by attempting a dummy change
    const result = await changeOperatorPin(adminPin, '0000');
    
    if (result.error === 'Geçersiz admin PIN') {
      recordAttempt('admin_pin', false);
      const remaining = getRemainingAttempts('admin_pin');
      setError(`Geçersiz admin PIN. ${remaining} deneme hakkınız kaldı.`);
      setAdminPin('');
      setIsLoading(false);
      return;
    }

    // Admin PIN is correct, move to change step
    // Reset the dummy change we just made
    resetOperatorPin(adminPin);
    recordAttempt('admin_pin', true);
    setStep('change');
    setIsLoading(false);
  };

  const handlePinChange = async () => {
    setError('');

    // Validate new PIN
    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN 4 haneli rakamlardan oluşmalıdır');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PIN kodları eşleşmiyor');
      return;
    }

    // Weak PIN check
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '3210'];
    if (weakPins.includes(newPin)) {
      setError('Bu PIN çok zayıf. Daha güçlü bir PIN seçin.');
      return;
    }

    setIsLoading(true);

    const result = await changeOperatorPin(adminPin, newPin);
    
    if (result.success) {
      setSuccess(true);
      logger.info('Operator PIN changed successfully');
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } else {
      setError(result.error || 'PIN değiştirilemedi');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Operatör PIN Değiştir</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">PIN Başarıyla Değiştirildi</h3>
              <p className="text-gray-500 mt-2">Yeni PIN kodu aktif edildi.</p>
            </div>
          ) : step === 'admin' ? (
            <>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  PIN değiştirmek için önce admin PIN kodunu girin.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin PIN (6 haneli)
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPin}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setAdminPin(cleaned);
                        setError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && adminPin.length === 6) {
                          handleAdminVerify();
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-center text-2xl tracking-[1em] rounded-lg border-2 transition-colors",
                        error ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="••••••"
                      maxLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAdminPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleAdminVerify}
                  disabled={adminPin.length !== 6 || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Doğrulanıyor...' : 'Devam Et'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-600">
                  Admin doğrulandı. Yeni operatör PIN kodunu girin.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni PIN (4 haneli)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setNewPin(cleaned);
                        setError('');
                      }}
                      className="w-full px-4 py-3 text-center text-2xl tracking-[1em] rounded-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
                      placeholder="••••"
                      maxLength={4}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Tekrar
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmPin(cleaned);
                      setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPin.length === 4 && confirmPin.length === 4) {
                        handlePinChange();
                      }
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-center text-2xl tracking-[1em] rounded-lg border-2 transition-colors",
                      confirmPin && newPin !== confirmPin ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                    )}
                    placeholder="••••"
                    maxLength={4}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('admin');
                      setNewPin('');
                      setConfirmPin('');
                      setError('');
                    }}
                    className="flex-1"
                  >
                    Geri
                  </Button>
                  <Button
                    onClick={handlePinChange}
                    disabled={newPin.length !== 4 || confirmPin.length !== 4 || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Kaydediliyor...' : 'PIN Değiştir'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Hidden CSRF token */}
          <input type="hidden" name="_csrf" value={csrfToken} />
        </div>
      </div>
    </div>
  );
}
