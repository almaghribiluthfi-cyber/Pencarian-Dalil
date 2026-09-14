import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/geminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStoredApiKey('');
      onKeySaved('');
      setStatusMessage('API Key berhasil dihapus. Aplikasi menggunakan database offline terverifikasi.');
      return;
    }

    if (!trimmed.startsWith('AIzaSy') && trimmed.length < 20) {
      setStatusMessage('Peringatan: Format API Key Google biasanya diawali dengan "AIzaSy...". Pastikan kuncinya benar.');
    } else {
      setStatusMessage('API Key tersimpan dengan aman di browser lokal Anda!');
    }

    setStoredApiKey(trimmed);
    onKeySaved(trimmed);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
    onKeySaved('');
    setStatusMessage('API Key dihapus.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#123f36] border border-[#c49a45]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#123f36] text-[#e8dcc4] px-6 py-4 flex items-center justify-between border-b border-[#2a6b5c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a6b5c] border border-[#c49a45]/50 flex items-center justify-center text-[#c49a45]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-sans">Pengaturan API Key Google AI</h3>
              <p className="text-xs text-[#e8dcc4]/80">Aktifkan pencarian cerdas Al-Qur'an & Hadits tak terbatas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#e8dcc4]/70 hover:text-white hover:bg-[#2a6b5c]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-[#123f36] dark:text-[#f7f4ed]">
          
          <div className="p-3.5 bg-[#fbf9f4] dark:bg-[#0d2e27] rounded-xl border border-[#c49a45]/30 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#123f36] dark:text-[#c49a45]">
              <ShieldCheck className="w-4 h-4 text-[#c49a45]" />
              <span>100% Aman & Terlindungi (Client-Side Storage)</span>
            </div>
            <p className="text-[#3b5e54] dark:text-[#e8dcc4]/80 text-xs leading-relaxed">
              API Key Anda disimpan <strong>hanya di dalam LocalStorage browser Anda sendiri</strong>. Kunci tidak pernah diunggah ke GitHub, tidak disimpan di server pihak ketiga, dan tidak dapat diakses oleh pengunjung lain.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3b5e54] dark:text-[#c49a45] mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#2a6b5c]/40 dark:border-[#2a6b5c] bg-white dark:bg-[#0d2e27] text-sm text-[#123f36] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c49a45] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#2a6b5c]/40">
            <h4 className="text-xs font-bold text-gray-700 dark:text-[#e8dcc4]">Cara Mendapatkan API Key Gratis:</h4>
            <ol className="text-xs text-gray-600 dark:text-[#e8dcc4]/80 space-y-1.5 list-decimal pl-4">
              <li>
                Buka portal resmi{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#c49a45] font-semibold underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Login dengan akun Google Anda.</li>
              <li>Klik tombol <strong>"Create API key"</strong>.</li>
              <li>Salin (*copy*) kunci yang muncul lalu tempelkan (*paste*) pada kolom di atas.</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#0d2e27] border-t border-gray-200 dark:border-[#2a6b5c] flex items-center justify-between gap-3">
          {apiKey ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Hapus Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-[#e8dcc4]/80 hover:bg-gray-100 dark:hover:bg-[#123f36] transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#c49a45] hover:bg-[#b08738] text-[#123f36] shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Simpan & Aktifkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
