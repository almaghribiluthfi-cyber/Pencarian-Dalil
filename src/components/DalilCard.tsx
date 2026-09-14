import React, { useState } from 'react';
import { 
  BookOpen, 
  ScrollText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  ChevronRight,
  Info,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { DalilItem, VerificationStatus } from '../types';

interface DalilCardProps {
  dalil: DalilItem;
  isSaved: boolean;
  onToggleSave: (dalil: DalilItem) => void;
  onViewDetail: (dalil: DalilItem) => void;
  onExplainDalil: (dalil: DalilItem) => void;
}

export const DalilCard: React.FC<DalilCardProps> = ({
  dalil,
  isSaved,
  onToggleSave,
  onViewDetail,
  onExplainDalil
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `【 ${dalil.type === 'quran' ? "Al-Qur'an" : "Hadits Nabi"} 】
Referensi: ${dalil.reference}
Sumber: ${dalil.sourceDetails}
Status: ${dalil.verificationStatus}

Teks Arab:
${dalil.arabicText}

Terjemahan:
"${dalil.indonesianTranslation}"

Relevansi:
${dalil.relevance}

Penjelasan:
${dalil.shortExplanation}

Disalin dari Aplikasi "Pencarian Dalil Cepat"`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Terverifikasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Terverifikasi
          </span>
        );
      case 'Perlu Verifikasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Perlu Verifikasi
          </span>
        );
      case 'Tidak Ditemukan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            Tidak Ditemukan
          </span>
        );
      default:
        return null;
    }
  };

  const isQuran = dalil.type === 'quran';

  return (
    <article 
      id={`dalil-card-${dalil.id}`}
      className="bg-white rounded-2xl border border-[#e8dcc4] hover:border-[#c49a45]/70 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      {/* Card Header: Source Type, Reference, Status Badge */}
      <div className="p-4 sm:p-5 border-b border-[#f2ede2] bg-[#fdfcf9]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Source Type Pill */}
            <span 
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                isQuran 
                  ? 'bg-[#123f36] text-[#e8dcc4]' 
                  : 'bg-[#2a6b5c] text-white'
              }`}
            >
              {isQuran ? <BookOpen className="w-3.5 h-3.5 text-[#c49a45]" /> : <ScrollText className="w-3.5 h-3.5 text-[#c49a45]" />}
              {isQuran ? "Al-Qur'an" : "Hadits"}
            </span>

            {/* Category Tag */}
            <span className="text-[11px] font-medium text-[#123f36]/80 bg-[#e8dcc4]/50 px-2 py-0.5 rounded-md border border-[#c49a45]/20">
              {dalil.category}
            </span>

            {dalil.hadithGrade && (
              <span className="text-[11px] font-semibold text-[#c49a45] bg-[#c49a45]/10 px-2 py-0.5 rounded-md border border-[#c49a45]/30">
                {dalil.hadithGrade}
              </span>
            )}
          </div>

          {/* Verification Status */}
          <div>
            {renderStatusBadge(dalil.verificationStatus)}
          </div>
        </div>

        {/* Reference Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#123f36] mt-2.5 tracking-tight flex items-center gap-1.5">
          {dalil.reference}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <Info className="w-3 h-3 text-[#2a6b5c]" />
          <span>{dalil.sourceDetails}</span>
        </p>
      </div>

      {/* Card Body: Arabic Text, Translation, Relevance, Short Explanation */}
      <div className="p-4 sm:p-6 space-y-4 flex-1">
        
        {/* Arabic Text Block */}
        <div className="bg-[#f9f7f2] p-4 sm:p-5 rounded-xl border border-[#e8dcc4]/80 shadow-inner">
          <p 
            dir="rtl" 
            lang="ar" 
            className="font-arabic text-xl sm:text-2xl lg:text-[26px] leading-[2.2] sm:leading-[2.3] text-[#123f36] text-right font-normal tracking-wide select-text"
          >
            {dalil.arabicText}
          </p>
        </div>

        {/* Indonesian Translation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2a6b5c] mb-1">
            Terjemahan Indonesia:
          </h4>
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-sans italic bg-white p-2 rounded-lg border-l-3 border-[#c49a45]">
            "{dalil.indonesianTranslation}"
          </p>
        </div>

        {/* Relevance Note */}
        <div className="bg-[#2a6b5c]/5 p-3 rounded-lg border border-[#2a6b5c]/15">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-[#123f36] shrink-0 mt-0.5">Relevansi:</span>
            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-normal">
              {dalil.relevance}
            </p>
          </div>
        </div>

        {/* Short Explanation */}
        <div className="text-xs sm:text-sm text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
          <span className="font-semibold text-[#123f36] block mb-0.5">Penjelasan Ringkas:</span>
          <p className="leading-relaxed">{dalil.shortExplanation}</p>
        </div>

        {/* Scholars References & Clickable Links */}
        {((dalil.scholarsReferences && dalil.scholarsReferences.length > 0) || (dalil.referenceLinks && dalil.referenceLinks.length > 0)) && (
          <div className="pt-2 border-t border-[#f2ede2] space-y-2 text-xs">
            {/* Scholars Citation */}
            {dalil.scholarsReferences && dalil.scholarsReferences.length > 0 && (
              <div className="flex items-start gap-1.5 text-gray-600">
                <GraduationCap className="w-3.5 h-3.5 text-[#2a6b5c] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-[#123f36]">Narasumber & Rujukan: </span>
                  <span className="text-[11px] text-gray-600">
                    {dalil.scholarsReferences.slice(0, 3).join(' • ')}
                  </span>
                </div>
              </div>
            )}

            {/* Source Website & Scholar Attribution Badge */}
            {dalil.sourceAttributions && dalil.sourceAttributions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400 font-medium mr-1">Web Rujukan:</span>
                {dalil.sourceAttributions.slice(0, 2).map((attr, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#123f36]/5 text-[#123f36] text-[11px] font-semibold border border-[#123f36]/15"
                    title={`${attr.authorOrScholar}: ${attr.description}`}
                  >
                    <span className="text-[#c49a45]">●</span>
                    <span>{attr.websiteName}</span>
                    <span className="text-[10px] text-gray-500 font-normal">({attr.authorOrScholar.split(',')[0].slice(0, 18)})</span>
                  </span>
                ))}
              </div>
            )}

            {/* Clickable Direct Links */}
            {dalil.referenceLinks && dalil.referenceLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400 font-medium mr-1">Tautan Sumber:</span>
                {dalil.referenceLinks.slice(0, 3).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f2ede2] hover:bg-[#e8dcc4] text-[#123f36] text-[11px] font-medium border border-[#c49a45]/30 transition-colors"
                    title={link.title}
                  >
                    <span>{link.sourceName || link.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#2a6b5c]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Card Footer: Action Buttons */}
      <div className="px-3 sm:px-6 py-3 bg-[#fcfbf8] border-t border-[#f2ede2] flex flex-wrap items-center justify-between gap-2">
        
        {/* Left Actions: Copy & Save */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Copy Button */}
          <button
            type="button"
            id={`btn-copy-${dalil.id}`}
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title="Salin teks lengkap dan referensi"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Salin</span>
              </>
            )}
          </button>

          {/* Bookmark / Simpan Button */}
          <button
            type="button"
            id={`btn-save-${dalil.id}`}
            onClick={() => onToggleSave(dalil)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSaved
                ? 'bg-[#c49a45]/20 text-[#123f36] border border-[#c49a45]'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title={isSaved ? "Hapus dari Favorit" : "Simpan ke Favorit"}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-[#c49a45]" />
                <span className="font-semibold text-[#123f36]">Tersimpan</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>

        {/* Right Actions: Jelaskan Dalil & Lihat Detail */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jelaskan Dalil (AI) Button */}
          <button
            type="button"
            id={`btn-explain-${dalil.id}`}
            onClick={() => onExplainDalil(dalil)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#2a6b5c] hover:bg-[#1f5448] text-white rounded-lg text-xs font-semibold shadow-sm transition-all border border-[#c49a45]/40 active:scale-95"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#c49a45]" />
            <span className="text-[11px] sm:text-xs">Jelaskan Dalil</span>
          </button>

          {/* Lihat Detail Button */}
          <button
            type="button"
            id={`btn-detail-${dalil.id}`}
            onClick={() => onViewDetail(dalil)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-[#e8dcc4]/30 text-[#123f36] rounded-lg text-xs font-semibold border border-[#123f36]/20 transition-all"
          >
            <span className="text-[11px] sm:text-xs">Detail</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#2a6b5c]" />
          </button>
        </div>

      </div>
    </article>
  );
};
