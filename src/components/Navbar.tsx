import React from 'react';
import { BookOpen, Bookmark, History, Search, ShieldCheck, Sparkles, Key } from 'lucide-react';

interface NavbarProps {
  activeTab: 'search' | 'favorites' | 'history';
  setActiveTab: (tab: 'search' | 'favorites' | 'history') => void;
  favoritesCount: number;
  historyCount: number;
  onOpenIntegrityGuide: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  historyCount,
  onOpenIntegrityGuide,
  onOpenApiKeyModal,
  hasCustomKey
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#123f36] text-[#e8dcc4] border-b border-[#2a6b5c]/50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Logo & App Name */}
          <div 
            id="brand-logo"
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0 mr-1 sm:mr-2"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#2a6b5c] to-[#123f36] border border-[#c49a45]/60 flex items-center justify-center shadow-inner group-hover:border-[#c49a45] transition-colors shrink-0">
              <span className="text-[#c49a45] font-arabic text-lg sm:text-2xl font-bold">📖</span>
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-[#c49a45] transition-colors font-sans truncate">
                  <span className="sm:hidden">Dalil Cepat</span>
                  <span className="hidden sm:inline">Pencarian Dalil Cepat</span>
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium bg-[#2a6b5c]/70 text-[#e8dcc4] px-2 py-0.5 rounded-full border border-[#c49a45]/40 shrink-0">
                  <Sparkles className="w-3 h-3 text-[#c49a45]" /> AI Terverifikasi
                </span>
              </div>
              <p className="text-[11px] text-[#e8dcc4]/80 hidden sm:block truncate">
                Rujukan Al-Qur'an & Hadits Shahih untuk Santri, Guru & Umat
              </p>
            </div>
          </div>

          {/* Nav Tabs & Action */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <nav className="flex items-center bg-[#0d2e27] p-0.5 sm:p-1 rounded-xl border border-[#2a6b5c]/40">
              <button
                id="tab-search"
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'search'
                    ? 'bg-[#2a6b5c] text-white shadow-sm border border-[#c49a45]/40'
                    : 'text-[#e8dcc4]/80 hover:text-white hover:bg-[#123f36]'
                }`}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c49a45]" />
                <span className="text-[11px] sm:text-sm">Cari</span>
              </button>

              <button
                id="tab-favorites"
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                  activeTab === 'favorites'
                    ? 'bg-[#2a6b5c] text-white shadow-sm border border-[#c49a45]/40'
                    : 'text-[#e8dcc4]/80 hover:text-white hover:bg-[#123f36]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c49a45]" />
                <span className="text-[11px] sm:text-sm">Favorit</span>
                {favoritesCount > 0 && (
                  <span className="ml-0.5 px-1 sm:px-1.5 py-0.2 bg-[#c49a45] text-[#123f36] text-[9px] sm:text-[10px] font-bold rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <button
                id="tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#2a6b5c] text-white shadow-sm border border-[#c49a45]/40'
                    : 'text-[#e8dcc4]/80 hover:text-white hover:bg-[#123f36]'
                }`}
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c49a45]" />
                <span className="text-[11px] sm:text-sm">Riwayat</span>
                {historyCount > 0 && (
                  <span className="hidden sm:inline-block ml-0.5 px-1.5 py-0.2 bg-[#2a6b5c] text-[#e8dcc4] text-[10px] rounded-full">
                    {historyCount}
                  </span>
                )}
              </button>
            </nav>

            {/* API Key Modal Trigger */}
            <button
              id="btn-api-key"
              onClick={onOpenApiKeyModal}
              title="Pengaturan API Key Google Gemini AI"
              className={`flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium border transition-all ${
                hasCustomKey 
                  ? 'bg-[#c49a45] text-[#123f36] border-[#c49a45] font-bold shadow-sm' 
                  : 'bg-[#1a4d42] hover:bg-[#225e51] text-[#e8dcc4] border-[#c49a45]/30 hover:border-[#c49a45]'
              }`}
            >
              <Key className={`w-4 h-4 ${hasCustomKey ? 'text-[#123f36]' : 'text-[#c49a45]'}`} />
              <span className="hidden md:inline ml-1.5">
                {hasCustomKey ? 'AI Aktif' : 'Set API Key'}
              </span>
            </button>

            {/* Integrity / Guidance Modal Trigger */}
            <button
              id="btn-integrity-rules"
              onClick={onOpenIntegrityGuide}
              title="Pedoman & Aturan Keabsahan Dalil AI"
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-[#1a4d42] hover:bg-[#225e51] text-[#e8dcc4] border border-[#c49a45]/30 hover:border-[#c49a45] transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#c49a45]" />
              <span className="hidden md:inline ml-1.5">Aturan AI</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
