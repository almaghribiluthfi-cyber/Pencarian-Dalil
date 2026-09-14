import React, { useState } from 'react';
import { Bookmark, Search, Trash2, BookOpen, ScrollText, ChevronRight, Copy, Check } from 'lucide-react';
import { SavedDalilItem, DalilItem, Category } from '../types';
import { CATEGORIES_LIST } from '../data/dalilDatabase';

interface FavoritesViewProps {
  savedItems: SavedDalilItem[];
  onRemoveFavorite: (id: string) => void;
  onViewDetail: (dalil: DalilItem) => void;
  onExplainDalil: (dalil: DalilItem) => void;
  onNavigateToSearch: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  savedItems,
  onRemoveFavorite,
  onViewDetail,
  onExplainDalil,
  onNavigateToSearch
}) => {
  const [filterCategory, setFilterCategory] = useState<Category>('Semua');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = savedItems.filter(item => {
    if (filterCategory !== 'Semua' && item.dalil.category !== filterCategory) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match = 
        item.dalil.reference.toLowerCase().includes(q) ||
        item.dalil.indonesianTranslation.toLowerCase().includes(q) ||
        item.dalil.relevance.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCopy = (dalil: DalilItem) => {
    const text = `【 ${dalil.reference} 】
${dalil.arabicText}

"${dalil.indonesianTranslation}"
Sumber: ${dalil.sourceDetails}`;

    navigator.clipboard.writeText(text);
    setCopiedId(dalil.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e8dcc4]">
        <div>
          <h2 className="text-2xl font-bold text-[#123f36] flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[#c49a45]" />
            Daftar Dalil Tersimpan ({savedItems.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Kumpulan dalil Al-Qur'an dan Hadits pilihan yang Anda simpan untuk referensi cepat santri dan pengajar.
          </p>
        </div>

        {savedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari dalam favorit..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e8dcc4] rounded-lg focus:outline-none focus:border-[#2a6b5c]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        )}
      </div>

      {/* Category filter tabs */}
      {savedItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 scrollbar-none text-xs">
          <span className="text-gray-500 font-medium shrink-0 mr-1">Filter Kategori:</span>
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as Category)}
              className={`shrink-0 px-3 py-1 rounded-full font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-[#123f36] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-[#e8dcc4]/50 border border-[#e8dcc4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {savedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#e8dcc4] p-8 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#f2ede2] text-[#c49a45] flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#123f36] mb-1">
            Belum Ada Dalil yang Disimpan
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Klik tombol "Simpan" pada setiap card dalil hasil pencarian untuk menyimpannya ke daftar ini.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-5 py-2.5 bg-[#2a6b5c] hover:bg-[#1f5448] text-white font-semibold rounded-xl text-xs sm:text-sm shadow transition-all border border-[#c49a45]/40"
          >
            Mulai Cari Dalil
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-sm text-gray-500">Tidak ada dalil tersimpan yang sesuai dengan filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredItems.map(({ dalil, savedAt }) => {
            const isQuran = dalil.type === 'quran';
            return (
              <div 
                key={dalil.id}
                className="bg-white rounded-2xl border border-[#e8dcc4] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        isQuran ? 'bg-[#123f36] text-[#e8dcc4]' : 'bg-[#2a6b5c] text-white'
                      }`}>
                        {isQuran ? <BookOpen className="w-3 h-3" /> : <ScrollText className="w-3 h-3" />}
                        {isQuran ? "Al-Qur'an" : "Hadits"}
                      </span>
                      <span className="text-[10px] bg-[#f2ede2] text-[#123f36] px-2 py-0.5 rounded font-medium">
                        {dalil.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveFavorite(dalil.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus dari favorit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-bold text-base text-[#123f36] mb-1">
                    {dalil.reference}
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">{dalil.sourceDetails}</p>

                  <div className="bg-[#f9f7f2] p-3.5 rounded-xl border border-[#e8dcc4]/80 mb-3">
                    <p dir="rtl" className="font-arabic text-lg sm:text-xl leading-[2] text-[#123f36] text-right">
                      {dalil.arabicText}
                    </p>
                  </div>

                  <p className="text-xs text-gray-700 italic line-clamp-3 mb-2">
                    "{dalil.indonesianTranslation}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f2ede2] flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] text-gray-400">
                    Disimpan: {new Date(savedAt).toLocaleDateString('id-ID')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(dalil)}
                      className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-1"
                    >
                      {copiedId === dalil.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === dalil.id ? "Tersalin" : "Salin"}</span>
                    </button>

                    <button
                      onClick={() => onViewDetail(dalil)}
                      className="px-3 py-1 text-xs bg-[#2a6b5c] hover:bg-[#1f5448] text-white rounded-lg font-semibold flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
