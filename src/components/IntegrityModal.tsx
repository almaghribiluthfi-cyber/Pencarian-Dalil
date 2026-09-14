import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Scale, BookOpen, ScrollText, AlertCircle } from 'lucide-react';

interface IntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrityModal: React.FC<IntegrityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-[#c49a45] overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#123f36] text-white p-5 sm:p-6 flex items-center justify-between border-b-2 border-[#c49a45]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a6b5c] border border-[#c49a45]/60 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#c49a45]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-sans text-white">
                Prinsip Integritas Keilmuan & AI Dalil
              </h3>
              <p className="text-xs text-[#e8dcc4]/85">
                Standar ilmiah syariah dalam aplikasi "Pencarian Dalil Cepat"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#e8dcc4] hover:text-white hover:bg-[#2a6b5c] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 md:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700">
          
          <div className="p-4 bg-[#f9f7f2] rounded-2xl border border-[#e8dcc4]">
            <p className="leading-relaxed text-[#123f36] font-medium">
              Aplikasi ini dirancang untuk menjaga amanah ilmiah yang sangat luhur dalam pengutipan ayat suci Al-Qur'an dan Sunnah Nabawiyyah. Sistem kami mematuhi 6 pilar keilmuan mutlak:
            </p>
          </div>

          {/* 6 Principles */}
          <div className="space-y-3">
            
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  1. Nol Halusinasi & Larangan Mengarang Dalil
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Sistem dilarang keras mengarang lafadz Arab, nomor surat, nomor ayat, sanad, nama perawi, kitab, maupun derajat hadits. Seluruh teks bersumber dari mushaf standar dan kutubus sittah/kutubut tis'ah mu'tabar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <BookOpen className="w-5 h-5 text-[#2a6b5c] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#123f36] text-sm">
                  2. Prioritas Database Terverifikasi
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Hasil pencarian memprioritaskan database shahih yang telah diteliti oleh para asatidz dan pentashih sebelum dipadukan dengan model AI Gemini.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  3. Transparansi Status Sumber
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Setiap card menampilkan status: <strong className="text-emerald-700">Terverifikasi</strong> (nash qath'i/shahihain), <strong className="text-amber-700">Perlu Verifikasi</strong> (hadits hasan/riwayat khusus), atau <strong className="text-rose-700">Tidak Ditemukan</strong> jika tidak terdapat nash yang valid.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <ScrollText className="w-5 h-5 text-[#c49a45] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#123f36] text-sm">
                  4. Pemisahan Tegas Teks Sumber vs Penjelasan AI
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Lafadz Arab matan dan terjemahan resmi disajikan dalam wadah tersendiri tanpa distorsi. Penjelasan tafsir dan analisis relevansi AI diposisikan secara terpisah.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
              <Scale className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-950 text-sm">
                  5. Proporsionalitas Ikhtilaf Ulama
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Bila terdapat perbedaan penafsiran di antara para imam mazhab atau muhadditsin, penjelasan menyajikan pandangan-pandangan tersebut secara adil dan berimbang tanpa sikap fanatik.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#e8dcc4]/40 border border-[#c49a45]/40">
              <AlertTriangle className="w-5 h-5 text-[#c49a45] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#123f36] text-sm">
                  6. Penafian Fatwa Hukum Final (Bukan Lembaga Fatwa)
                </h4>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  Aplikasi ini merupakan sarana bantu riset dan edukasi rujukan dalil. Penjelasan AI tidak dapat dianggap sebagai fatwa hukum final atau putusan mufti. Untuk hukum syariah kasus khusus, disarankan berkonsultasi kepada ulama terpercaya.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#f9f7f2] border-t border-[#e8dcc4] text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#123f36] hover:bg-[#1f5448] text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Saya Memahami
          </button>
        </div>

      </div>
    </div>
  );
};
