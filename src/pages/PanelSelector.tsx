import React from 'react';
import { Settings, Monitor, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { POLVAK_LOGO_URL, ORG_NAME, ORG_SHORT_NAME } from '../lib/constants';
interface PanelSelectorProps {
  onSelectOperator: () => void;
  onSelectProjection: () => void;
  onLogout: () => void;
}
export function PanelSelector({
  onSelectOperator,
  onSelectProjection,
  onLogout
}: PanelSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-2">
                <img
                  src={POLVAK_LOGO_URL}
                  alt={ORG_SHORT_NAME}
                  className="w-full h-full object-contain" />

              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {ORG_SHORT_NAME} Yönetim Sistemi
              </h1>
              <p className="text-white/60 mt-2">
                Lütfen kullanmak istediğiniz paneli seçin
              </p>
            </div>
          </div>

          {/* Panel Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Panel Card */}
            <button
              onClick={onSelectOperator}
              className="group bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] text-left">

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-[#1e3a5f] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1e3a5f]">
                    Operatör Paneli
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Bağış onaylama, katılımcı yönetimi ve etkinlik kontrolü
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-gray-100">
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Canlı bağış onay kuyruğu</li>
                    <li>• Katılımcı ve kalem yönetimi</li>
                    <li>• Raporlar ve istatistikler</li>
                  </ul>
                </div>
              </div>
            </button>

            {/* Projection Panel Card */}
            <button
              onClick={onSelectProjection}
              className="group bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] text-left">

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">
                    Projeksiyon Paneli
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Canlı etkinlik görüntüleme ve salon ekranı yönetimi
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-gray-100">
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Canlı bağış akışı görüntüleme</li>
                    <li>• Etkinlik seçimi ve yönetimi</li>
                    <li>• Tam ekran projeksiyon modu</li>
                  </ul>
                </div>
              </div>
            </button>
          </div>

          {/* Logout Button */}
          <div className="text-center pt-4">
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors">

              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-white/30 text-xs">
        © {new Date().getFullYear()} {ORG_SHORT_NAME} - {ORG_NAME}
      </div>
    </div>);

}