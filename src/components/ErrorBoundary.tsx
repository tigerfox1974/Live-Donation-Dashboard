import React from 'react';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle2 } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
  stack?: string;
  copied: boolean;
}

// Kullanıcı dostu hata mesajları
const getUserFriendlyMessage = (message?: string): string => {
  if (!message) return 'Beklenmeyen bir hata oluştu.';
  
  // Yaygın hata türlerini kullanıcı dostu mesajlara çevir
  if (message.includes('Network') || message.includes('fetch')) {
    return 'İnternet bağlantısı ile ilgili bir sorun oluştu. Lütfen bağlantınızı kontrol edin.';
  }
  if (message.includes('localStorage') || message.includes('storage')) {
    return 'Tarayıcı depolama alanına erişilemedi. Gizli mod kullanıyorsanız normal moda geçin.';
  }
  if (message.includes('JSON') || message.includes('parse')) {
    return 'Veri okuma hatası. Yerel veriler bozulmuş olabilir.';
  }
  if (message.includes('undefined') || message.includes('null')) {
    return 'Uygulama beklenmeyen bir durumla karşılaştı.';
  }
  if (message.includes('Maximum call stack')) {
    return 'Uygulama döngüsel bir hata ile karşılaştı.';
  }
  
  // Mesaj çok uzunsa kısalt
  if (message.length > 150) {
    return message.slice(0, 150) + '...';
  }
  
  return message;
};

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallbackComponent?: React.ReactNode }>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, copied: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message, stack: error.stack };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
    // Burada hata izleme servisine (Sentry, LogRocket vb.) gönderilebilir
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  handleClearData = () => {
    if (window.confirm('Tüm yerel veriler silinecek. Devam etmek istiyor musunuz?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.hash = '#/';
        window.location.reload();
      } catch {
        window.location.reload();
      }
    }
  };

  handleCopyError = async () => {
    const errorInfo = `Hata: ${this.state.message}\n\nStack:\n${this.state.stack || 'Yok'}\n\nURL: ${window.location.href}\nTarih: ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(errorInfo);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard API başarısız
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const friendlyMessage = getUserFriendlyMessage(this.state.message);

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
          <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-lg w-full text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bir Sorun Oluştu
              </h1>
              <p className="text-gray-600">
                {friendlyMessage}
              </p>
            </div>

            {/* Technical Details (collapsible) */}
            {this.state.message && (
              <details className="text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <Bug className="w-4 h-4 inline mr-1" />
                  Teknik Detaylar
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all font-mono max-h-32 overflow-auto">
                    {this.state.message}
                  </pre>
                  <button
                    onClick={this.handleCopyError}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {this.state.copied ? (
                      <><CheckCircle2 className="w-3 h-3" /> Kopyalandı</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Hatayı Kopyala</>
                    )}
                  </button>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button variant="primary" onClick={this.handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yeniden Dene
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </div>

            {/* Clear Data Option */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={this.handleClearData}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Sorun devam ediyorsa verileri temizle
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
