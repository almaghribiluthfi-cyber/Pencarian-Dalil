import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  SearchBar 
} from './components/SearchBar';
import { 
  DalilCard 
} from './components/DalilCard';
import { 
  DalilDetailModal 
} from './components/DalilDetailModal';
import { 
  FavoritesView 
} from './components/FavoritesView';
import { 
  HistoryView 
} from './components/HistoryView';
import { 
  IntegrityModal 
} from './components/IntegrityModal';
import { 
  DalilItem, 
  DalilSourceType, 
  Category, 
  SavedDalilItem, 
  SearchHistoryItem,
  DalilExplanation 
} from './types';
import { VERIFIED_DALIL_DATABASE } from './data/dalilDatabase';
import { searchLocalDatabase } from './utils/searchEngine';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Bookmark, 
  History,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

const STORAGE_SAVED_KEY = 'pencarian_dalil_saved_v1';
const STORAGE_HISTORY_KEY = 'pencarian_dalil_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'history'>('search');
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<DalilSourceType>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  
  // Results & Loading
  const [results, setResults] = useState<DalilItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSourceNote, setSearchSourceNote] = useState<string>('');

  // Modals & Active Dalil
  const [selectedDalil, setSelectedDalil] = useState<DalilItem | null>(null);
  const [initialExplanation, setInitialExplanation] = useState<DalilExplanation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);

  // Persistence
  const [savedItems, setSavedItems] = useState<SavedDalilItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedItems));
    } catch (e) {
      console.error(e);
    }
  }, [savedItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch (e) {
      console.error(e);
    }
  }, [searchHistory]);

  // Initial Load: Show featured verified dalil database
  useEffect(() => {
    const initialList = VERIFIED_DALIL_DATABASE.slice(0, 6);
    setResults(initialList);
  }, []);

  // Perform search action
  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const queryToUse = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToUse,
          filter: sourceFilter,
          category: selectedCategory
        })
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi server pencarian dalil.');
      }

      const data = await res.json();
      const searchResults: DalilItem[] = data.results || [];
      setResults(searchResults);
      setSearchSourceNote(data.source === 'database_plus_gemini' 
        ? 'Ditelusuri menggunakan integrasi database shahih & verifikasi model AI.'
        : 'Ditelusuri dari database terverifikasi.');

      // Record in history if query is meaningful
      if (queryToUse.trim().length > 1) {
        const newHistoryItem: SearchHistoryItem = {
          id: `hist-${Date.now()}`,
          query: queryToUse.trim(),
          timestamp: Date.now(),
          resultsCount: searchResults.length,
          category: selectedCategory,
          filter: sourceFilter
        };

        setSearchHistory(prev => {
          // Remove duplicate previous query if exists
          const filtered = prev.filter(h => h.query.toLowerCase() !== queryToUse.trim().toLowerCase());
          return [newHistoryItem, ...filtered].slice(0, 30);
        });
      }
    } catch (err: any) {
      console.warn('Backend search unreachable, running client search engine:', err);
      
      // Smart fallback using local search engine
      let localFiltered: DalilItem[] = [];
      if (queryToUse.trim().length > 0) {
        localFiltered = searchLocalDatabase(queryToUse, sourceFilter, selectedCategory);
      } else {
        localFiltered = VERIFIED_DALIL_DATABASE.filter(item => {
          if (sourceFilter !== 'all' && item.type !== sourceFilter) return false;
          if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
          return true;
        });
      }

      setResults(localFiltered);
      setSearchSourceNote('Menampilkan dalil terverifikasi dari rujukan database lokal.');
      
      if (queryToUse.trim().length > 0) {
        if (localFiltered.length > 0) {
          showToast(`Ditemukan ${localFiltered.length} dalil terverifikasi dari database.`);
        } else {
          showToast('Tidak ditemukan dalil yang cocok di database lokal untuk kata kunci tersebut.');
        }

        // Record history even on offline/static hosting
        const newHistoryItem: SearchHistoryItem = {
          id: `hist-${Date.now()}`,
          query: queryToUse.trim(),
          timestamp: Date.now(),
          resultsCount: localFiltered.length,
          category: selectedCategory,
          filter: sourceFilter
        };

        setSearchHistory(prev => {
          const filtered = prev.filter(h => h.query.toLowerCase() !== queryToUse.trim().toLowerCase());
          return [newHistoryItem, ...filtered].slice(0, 30);
        });
      } else {
        showToast('Menampilkan rujukan database lokal terverifikasi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sourceFilter, selectedCategory]);

  // Re-run search whenever filter or category changes if already searched
  useEffect(() => {
    if (hasSearched || selectedCategory !== 'Semua' || sourceFilter !== 'all') {
      handleSearch();
    }
  }, [sourceFilter, selectedCategory]);

  // Toggle bookmark save
  const handleToggleSave = (dalil: DalilItem) => {
    const exists = savedItems.some(item => item.dalil.id === dalil.id);
    if (exists) {
      setSavedItems(prev => prev.filter(item => item.dalil.id !== dalil.id));
      showToast(`Dihapus dari daftar Favorit.`);
    } else {
      setSavedItems(prev => [{ dalil, savedAt: Date.now() }, ...prev]);
      showToast(`Dalil berhasil disimpan ke Favorit.`);
    }
  };

  const handleViewDetail = (dalil: DalilItem) => {
    setSelectedDalil(dalil);
    setInitialExplanation(null);
    setIsDetailModalOpen(true);
  };

  // Direct "Jelaskan Dalil" action from card
  const handleExplainDalil = async (dalil: DalilItem) => {
    setSelectedDalil(dalil);
    setInitialExplanation(null);
    setIsDetailModalOpen(true);

    // Auto-fetch explanation inside modal
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dalil,
          userTopic: searchQuery || dalil.category
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInitialExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Auto explain error:', err);
    }
  };

  // Handle select from History
  const handleSelectHistory = (q: string, cat: string, filter: string) => {
    setSearchQuery(q);
    setSelectedCategory(cat as Category);
    setSourceFilter(filter as DalilSourceType);
    setActiveTab('search');
    handleSearch(q);
  };

  const isDalilSaved = (id: string) => savedItems.some(item => item.dalil.id === id);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f7f2] text-[#1c2826] font-sans selection:bg-[#c49a45]/30">
      
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={savedItems.length}
        historyCount={searchHistory.length}
        onOpenIntegrityGuide={() => setIsIntegrityModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <div>
            {/* Search Bar & Filters Section */}
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSearch={handleSearch}
              isLoading={isLoading}
            />

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* Results Header Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[#e8dcc4]">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#123f36] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#c49a45]" />
                    {hasSearched ? 'Hasil Pencarian Dalil' : 'Dalil Pilihan & Rujukan Pokok'}
                    <span className="text-sm font-semibold bg-[#2a6b5c] text-white px-2.5 py-0.5 rounded-full">
                      {results.length}
                    </span>
                  </h3>
                  {searchSourceNote && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {searchSourceNote}
                    </p>
                  )}
                </div>

                {/* Filter tags currently applied */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Kategori: <strong>{selectedCategory}</strong></span>
                  <span>•</span>
                  <span className="text-gray-500">Sumber: <strong>{sourceFilter === 'all' ? 'Semua' : sourceFilter === 'quran' ? "Al-Qur'an" : 'Hadits'}</strong></span>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-[#2a6b5c] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-base font-bold text-[#123f36]">
                    Sedang mencari dalil Al-Qur'an dan Hadits...
                  </p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Mencocokkan nash ayat dan hadits shahih berdasarkan pertanyaan Anda.
                  </p>
                </div>
              )}

              {/* No Results Found */}
              {!isLoading && results.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-[#e8dcc4] p-8 max-w-lg mx-auto shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-[#123f36] mb-1">
                    Dalil Tidak Ditemukan
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-sm mx-auto leading-relaxed">
                    Sesuai kaidah amanah ilmiah kami, sistem <strong>tidak mengarang dalil</strong> bila tidak ditemukan nash yang shahih atau relevan dengan kata kunci tersebut.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                        setSourceFilter('all');
                        handleSearch('');
                      }}
                      className="px-4 py-2 bg-[#123f36] text-white rounded-xl text-xs font-semibold hover:bg-[#1f5448] transition-colors"
                    >
                      Reset Pencarian
                    </button>
                    <button
                      onClick={() => {
                        const prompt = "dalil tentang menghormati orang tua";
                        setSearchQuery(prompt);
                        handleSearch(prompt);
                      }}
                      className="px-4 py-2 bg-[#f2ede2] text-[#123f36] rounded-xl text-xs font-semibold hover:bg-[#e8dcc4] transition-colors border border-[#c49a45]/30"
                    >
                      Coba: "Menghormati Orang Tua"
                    </button>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              {!isLoading && results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {results.map((dalil) => (
                    <DalilCard
                      key={dalil.id}
                      dalil={dalil}
                      isSaved={isDalilSaved(dalil.id)}
                      onToggleSave={handleToggleSave}
                      onViewDetail={handleViewDetail}
                      onExplainDalil={handleExplainDalil}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            savedItems={savedItems}
            onRemoveFavorite={(id) => {
              setSavedItems(prev => prev.filter(i => i.dalil.id !== id));
              showToast('Dalil dihapus dari favorit.');
            }}
            onViewDetail={handleViewDetail}
            onExplainDalil={handleExplainDalil}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyItems={searchHistory}
            onSelectHistory={handleSelectHistory}
            onClearHistory={() => {
              setSearchHistory([]);
              showToast('Riwayat pencarian telah dibersihkan.');
            }}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#123f36] text-[#e8dcc4] border-t border-[#2a6b5c] mt-12 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-xl">🕌</span>
            <div>
              <p className="font-bold text-white text-sm">Pencarian Dalil Cepat</p>
              <p className="text-[#e8dcc4]/70">Khidmat rujukan Al-Qur'an & Sunnah Shahihah untuk dunia santri dan pengajar</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#e8dcc4]/80">
            <button 
              onClick={() => setIsIntegrityModalOpen(true)}
              className="hover:text-white underline transition-colors"
            >
              Pedoman Keabsahan Dalil
            </button>
            <span>•</span>
            <span className="text-[#c49a45] font-arabic text-base">وَقُل رَّبِّ زِدْنِي عِلْمًا</span>
          </div>
        </div>
      </footer>

      {/* Dalil Detail & AI Explanation Modal */}
      <DalilDetailModal
        dalil={selectedDalil}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDalil(null);
          setInitialExplanation(null);
        }}
        isSaved={selectedDalil ? isDalilSaved(selectedDalil.id) : false}
        onToggleSave={handleToggleSave}
        initialExplanation={initialExplanation}
        userTopic={searchQuery || selectedDalil?.category}
      />

      {/* Integrity & Rules Modal */}
      <IntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#123f36] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#c49a45] flex items-center gap-2 text-xs font-medium animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-[#c49a45]" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
