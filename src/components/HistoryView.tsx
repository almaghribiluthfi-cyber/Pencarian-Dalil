import React from 'react';
import { History, Search, Trash2, ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface HistoryViewProps {
  historyItems: SearchHistoryItem[];
  onSelectHistory: (query: string, category: string, filter: string) => void;
  onClearHistory: () => void;
  onNavigateToSearch: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onSelectHistory,
  onClearHistory,
  onNavigateToSearch
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e8dcc4]">
        <div>
          <h2 className="text-2xl font-bold text-[#123f36] flex items-center gap-2">
            <History className="w-6 h-6 text-[#c49a45]" />
            Riwayat Pencarian Dalil ({historyItems.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Daftar pertanyaan dan topik yang baru saja Anda telusuri untuk memudahkan kajian berkala.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Riwayat</span>
          </button>
        )}
      </div>

      {/* Content */}
      {historyItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#e8dcc4] p-8 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#f2ede2] text-[#2a6b5c] flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#123f36] mb-1">
            Belum Ada Riwayat Pencarian
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Setiap pencarian topik dalil yang Anda ketik akan dicatat di sini untuk memudahkan pencarian kembali.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-5 py-2.5 bg-[#2a6b5c] hover:bg-[#1f5448] text-white font-semibold rounded-xl text-xs sm:text-sm shadow transition-all border border-[#c49a45]/40"
          >
            Cari Dalil Pertama Anda
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectHistory(item.query, item.category, item.filter)}
              className="group bg-white p-4 rounded-2xl border border-[#e8dcc4] hover:border-[#c49a45] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f2ede2] text-[#2a6b5c] group-hover:bg-[#2a6b5c] group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-0.5">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#123f36] group-hover:text-[#2a6b5c] transition-colors">
                    "{item.query}"
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                    <span>•</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      Kategori: {item.category}
                    </span>
                    <span>•</span>
                    <span className="bg-[#2a6b5c]/10 text-[#2a6b5c] px-2 py-0.5 rounded font-medium">
                      Filter: {item.filter === 'all' ? 'Semua' : item.filter === 'quran' ? "Al-Qur'an" : 'Hadits'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-[#c49a45] hidden sm:inline">
                  {item.resultsCount} Dalil
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#f2ede2] text-[#123f36] group-hover:bg-[#c49a45] group-hover:text-[#123f36] flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
