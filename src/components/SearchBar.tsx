import React, { FormEvent } from 'react';
import { Search, X, Sparkles, Filter, BookOpen, ScrollText } from 'lucide-react';
import { DalilSourceType, Category } from '../types';
import { CATEGORIES_LIST, POPULAR_PROMPTS } from '../data/dalilDatabase';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sourceFilter: DalilSourceType;
  setSourceFilter: (filter: DalilSourceType) => void;
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  onSearch: (overrideQuery?: string) => void;
  isLoading: boolean;
  hasCustomKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  sourceFilter,
  setSourceFilter,
  selectedCategory,
  setSelectedCategory,
  onSearch,
  isLoading,
  hasCustomKey,
  onOpenApiKeyModal
}) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleSelectPrompt = (prompt: string) => {
    setSearchQuery(prompt);
    onSearch(prompt);
  };

  return (
    <div className="w-full bg-[#123f36] text-white pt-6 pb-8 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-b-[2.5rem] shadow-xl border-b-2 border-[#c49a45]/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Intro Tagline */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2a6b5c] text-[#e8dcc4] border border-[#c49a45]/40 mb-2.5">
            <span className="text-[#c49a45]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
            Temukan Dalil Al-Qur’an & Hadits
          </h2>
          <p className="text-sm sm:text-base text-[#e8dcc4]/85 max-w-2xl mx-auto">
            Gunakan bahasa sehari-hari untuk mencari ayat dan hadits terverifikasi lengkap dengan teks Arab, sanad, dan penjelasan ulama.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSubmit} className="relative mb-5">
          <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white border-2 border-[#c49a45] focus-within:ring-4 focus-within:ring-[#c49a45]/30 transition-all">
            <div className="pl-4 pr-2 text-[#2a6b5c]">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: dalil tentang menghormati orang tua, menuntut ilmu, adab bertetangga..."
              className="w-full py-3.5 sm:py-4 px-2 text-[#123f36] placeholder:text-gray-400 font-medium text-sm sm:text-base focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400 hover:text-[#123f36] transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="pr-1.5 sm:pr-2.5">
              <button
                type="submit"
                id="btn-submit-search"
                disabled={isLoading}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-[#2a6b5c] hover:bg-[#1f5448] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md active:scale-95 disabled:opacity-60 transition-all border border-[#c49a45]/40"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c49a45]" />
                    <span className="hidden xs:inline">Cari Dalil</span>
                    <span className="xs:hidden">Cari</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Source Filters: Semua, Al-Qur'an, Hadits */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-[#0d2e27] p-1 rounded-xl border border-[#2a6b5c]/50">
            <span className="text-[11px] sm:text-xs text-[#e8dcc4]/70 px-2 hidden sm:inline font-medium">Sumber:</span>
            
            <button
              type="button"
              id="filter-source-all"
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === 'all'
                  ? 'bg-[#c49a45] text-[#123f36] shadow-sm'
                  : 'text-[#e8dcc4] hover:bg-[#2a6b5c]/60'
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              id="filter-source-quran"
              onClick={() => setSourceFilter('quran')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === 'quran'
                  ? 'bg-[#c49a45] text-[#123f36] shadow-sm'
                  : 'text-[#e8dcc4] hover:bg-[#2a6b5c]/60'
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Al-Qur’an
            </button>

            <button
              type="button"
              id="filter-source-hadith"
              onClick={() => setSourceFilter('hadith')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === 'hadith'
                  ? 'bg-[#c49a45] text-[#123f36] shadow-sm'
                  : 'text-[#e8dcc4] hover:bg-[#2a6b5c]/60'
              }`}
            >
              <ScrollText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Hadits
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="text-[11px] sm:text-xs text-[#e8dcc4] hover:text-white flex items-center gap-1.5 bg-[#0d2e27]/80 hover:bg-[#2a6b5c] px-2.5 py-1 rounded-lg border border-[#2a6b5c]/40 hover:border-[#c49a45] transition-all cursor-pointer"
          >
            <span className={`inline-block w-2 h-2 rounded-full ${hasCustomKey ? 'bg-[#c49a45] animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>
              {hasCustomKey 
                ? 'Gemini AI Aktif (Live API)' 
                : 'Mode Database Lokal (Klik untuk set AI Key)'}
            </span>
          </button>
        </div>

        {/* Categories Chips: Akhlak, Ibadah, Pendidikan, Keluarga, Sosial, Muamalah */}
        <div className="pt-2 border-t border-[#2a6b5c]/40">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none text-xs">
            <span className="text-[#e8dcc4]/70 shrink-0 font-medium mr-1 flex items-center gap-1 text-[11px] sm:text-xs">
              <Filter className="w-3 h-3 text-[#c49a45]" /> Kategori:
            </span>
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat}
                type="button"
                id={`category-chip-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat as Category)}
                className={`shrink-0 px-3 py-1 rounded-full font-medium transition-all text-xs ${
                  selectedCategory === cat
                    ? 'bg-[#e8dcc4] text-[#123f36] font-bold shadow'
                    : 'bg-[#1a4d42]/70 text-[#e8dcc4] hover:bg-[#2a6b5c] border border-[#2a6b5c]/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Topic Suggestions */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none text-[11px] text-[#e8dcc4]/80">
          <span className="shrink-0 text-[#c49a45] font-medium">Contoh:</span>
          {POPULAR_PROMPTS.slice(0, 4).map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(p)}
              className="shrink-0 bg-[#0e352d]/90 hover:bg-[#2a6b5c] px-2.5 py-1 rounded-md border border-[#c49a45]/30 hover:border-[#c49a45] transition-all text-[#e8dcc4]"
            >
              "{p}"
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
