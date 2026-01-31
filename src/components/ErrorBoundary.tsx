import React from 'react';
import { Button } from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">
              Beklenmeyen Hata
            </h1>
            <p className="text-gray-600 text-sm">
              Uygulama çalışırken bir hata oluştu. Yeniden yükleyip tekrar
              deneyebilirsiniz.
            </p>
            {this.state.message && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                {this.state.message}
              </p>
            )}
            <div className="flex justify-center">
              <Button variant="primary" onClick={this.handleReload}>
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
