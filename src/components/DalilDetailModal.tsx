import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  ScrollText, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Lightbulb, 
  Scale, 
  ShieldAlert, 
  Info,
  ExternalLink,
  Globe,
  GraduationCap,
  Users
} from 'lucide-react';
import { DalilItem, DalilExplanation, VerificationStatus } from '../types';
import { hasUserApiKey, explainDalilWithGemini } from '../utils/geminiClient';

interface DalilDetailModalProps {
  dalil: DalilItem | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (dalil: DalilItem) => void;
  initialExplanation?: DalilExplanation | null;
  userTopic?: string;
}

export const DalilDetailModal: React.FC<DalilDetailModalProps> = ({
  dalil,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  initialExplanation,
  userTopic
}) => {
  const [explanation, setExplanation] = useState<DalilExplanation | null>(initialExplanation || null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialExplanation) {
      setExplanation(initialExplanation);
    } else {
      setExplanation(null);
    }
    setExplainError(null);
  }, [initialExplanation, dalil]);

  if (!isOpen || !dalil) return null;

  const fetchExplanation = async () => {
    setLoadingExplanation(true);
    setExplainError(null);

    // If user has supplied their own API Key, directly call Google Gemini client-side
    if (hasUserApiKey()) {
      try {
        const geminiExp = await explainDalilWithGemini(dalil, userTopic || dalil.category);
        setExplanation(geminiExp);
        setLoadingExplanation(false);
        return;
      } catch (geminiErr: any) {
        console.warn('Direct Gemini explain call failed, trying server / fallback:', geminiErr);
      }
    }

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dalil,
          userTopic: userTopic || dalil.category
        })
      });

      if (!res.ok) {
        throw new Error('Gagal memuat penjelasan AI.');
      }

      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err: any) {
      console.warn('Explain endpoint unreachable, using verified database explanation fallback:', err);
      // Fallback explanation derived from verified database
      const fallbackExplanation: DalilExplanation = {
        dalilId: dalil.id,
        reference: dalil.reference,
        tafsirSummary: dalil.shortExplanation || `Penjelasan mengenai ${dalil.reference} berkenaan dengan tema ${dalil.relevance}.`,
        asbabunNuzulOrWurud: dalil.sourceDetails || 'Rujukan kitab tafsir/hadits mu\'tabar.',
        contextualRelevance: `Relevansi kontekstual: ${dalil.relevance}. Menjadi pedoman berharga bagi umat Islam dalam mengamalkan ajaran syariat.`,
        scholarsViews: (dalil.scholarsReferences && dalil.scholarsReferences.length > 0)
          ? dalil.scholarsReferences.join(' • ')
          : 'Merujuk pada syarah dan pemahaman para ulama salafusshalih.',
        practicalLessons: [
          `Menjadikan ${dalil.reference} sebagai pedoman utama.`,
          'Mengamalkan nilai-nilai kebaikan dan menjauhi apa yang dilarang dalam syariat.',
          'Mengkaji lebih lanjut melalui syarah asatidz dan ulama terpercaya.'
        ],
        legalStatusNote: 'Disarikan dari database rujukan terverifikasi. Untuk fatwa hukum spesifik, rujuklah kepada para asatidz dan ulama.',
        referenceLinks: dalil.referenceLinks || [],
        sourceAttributions: dalil.sourceAttributions && dalil.sourceAttributions.length > 0 
          ? dalil.sourceAttributions 
          : [
              {
                websiteName: 'Rumaysho.com',
                authorOrScholar: 'Ustadz Muhammad Abduh Tuasikal, M.Sc.',
                description: 'Kajian Fiqih & Sunnah Praktis',
                url: 'https://rumaysho.com'
              },
              {
                websiteName: 'Almanhaj.or.id',
                authorOrScholar: 'Lajnah Daimah & Dewan Ilmiah',
                description: 'Fatwa, Fiqih, & Aqidah Ahlussunnah',
                url: 'https://almanhaj.or.id'
              }
            ]
      };
      setExplanation(fallbackExplanation);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleCopyFull = () => {
    let fullText = `【 ${dalil.type === 'quran' ? "Al-Qur'an" : "Hadits Nabi"} 】
Referensi: ${dalil.reference}
Sumber: ${dalil.sourceDetails}
Status Verifikasi: ${dalil.verificationStatus}

TEKS ARAB:
${dalil.arabicText}

TERJEMAHAN:
"${dalil.indonesianTranslation}"

RELEVANSI:
${dalil.relevance}

PENJELASAN RINGKAS:
${dalil.shortExplanation}
`;

    if (explanation) {
      fullText += `\n--- PENJELASAN MENDALAM (AI TAFSIR & SYARAH) ---
${explanation.asbabunNuzulOrWurud ? `Konteks/Asbab: ${explanation.asbabunNuzulOrWurud}\n` : ''}
Ringkasan Tafsir: ${explanation.tafsirSummary}
Relevansi Kontekstual: ${explanation.contextualRelevance}
Pandangan Ulama: ${explanation.scholarsViews || '-'}

Pelajaran Praktis:
${explanation.practicalLessons.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Catatan: ${explanation.legalStatusNote}
`;

      const attributions = explanation.sourceAttributions || dalil.sourceAttributions;
      if (attributions && attributions.length > 0) {
        fullText += `\nNarasumber & Web Rujukan:\n`;
        attributions.forEach((attr) => {
          fullText += `• ${attr.websiteName} (${attr.authorOrScholar}): ${attr.description} ${attr.url ? `- ${attr.url}` : ''}\n`;
        });
      }
    }

    fullText += `\n(Disalin dari Aplikasi "Pencarian Dalil Cepat")`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Terverifikasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Terverifikasi (Nash Shahih/Qath'i)
          </span>
        );
      case 'Perlu Verifikasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Perlu Verifikasi Lanjutan
          </span>
        );
      case 'Tidak Ditemukan':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <HelpCircle className="w-4 h-4 text-rose-700" />
            Tidak Ditemukan
          </span>
        );
      default:
        return null;
    }
  };

  const isQuran = dalil.type === 'quran';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#f9f7f2] w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-[#c49a45]/60 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#123f36] text-white p-3.5 sm:p-6 flex items-center justify-between border-b-2 border-[#c49a45] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2a6b5c] border border-[#c49a45]/60 flex items-center justify-center shrink-0">
              {isQuran ? (
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#c49a45]" />
              ) : (
                <ScrollText className="w-4 h-4 sm:w-5 sm:h-5 text-[#c49a45]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#c49a45] truncate">
                  Detail Dalil {isQuran ? "Al-Qur'an" : "Hadits Nabawi"}
                </span>
                <span className="text-[9px] sm:text-[10px] bg-[#2a6b5c] px-1.5 py-0.5 rounded text-[#e8dcc4] shrink-0">
                  {dalil.category}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-white font-sans truncate">
                {dalil.reference}
              </h3>
            </div>
          </div>

          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-[#e8dcc4] hover:text-white hover:bg-[#2a6b5c] transition-colors shrink-0 ml-2"
            title="Tutup"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Status and Source Header Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e8dcc4] shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 font-medium block mb-1">Status Keabsahan Sumber:</span>
                {renderStatusBadge(dalil.verificationStatus)}
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium block mb-1">Kitab / Takhrij:</span>
                <span className="text-xs sm:text-sm font-semibold text-[#123f36] bg-[#f2ede2] px-3 py-1 rounded-lg inline-block">
                  {dalil.sourceDetails}
                </span>
              </div>
            </div>

            {/* Scholars citation tags */}
            {dalil.scholarsReferences && dalil.scholarsReferences.length > 0 && (
              <div className="pt-2 border-t border-[#f2ede2] flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#123f36] flex items-center gap-1 mr-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2a6b5c]" /> Rujukan Ulama:
                </span>
                {dalil.scholarsReferences.map((sch, idx) => (
                  <span key={idx} className="text-[11px] bg-[#f9f7f2] text-gray-700 px-2 py-0.5 rounded-md border border-[#e8dcc4]">
                    {sch}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Arabic Text Display */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e8dcc4] shadow-sm relative">
            <div className="flex items-center justify-between mb-3 border-b border-[#f2ede2] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2a6b5c] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#c49a45]" /> Teks Arab (Al-Matsur)
              </span>
              <span className="text-xs text-gray-400 font-serif">Khat Mushaf</span>
            </div>

            <p 
              dir="rtl" 
              lang="ar" 
              className="font-arabic text-2xl sm:text-3xl lg:text-4xl leading-[2.2] sm:leading-[2.4] text-[#123f36] text-right font-normal tracking-wide select-text py-2"
            >
              {dalil.arabicText}
            </p>
          </div>

          {/* Translation */}
          <div className="bg-white p-5 rounded-2xl border border-[#e8dcc4]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2a6b5c] mb-2">
              Terjemahan Bahasa Indonesia Resmi:
            </h4>
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-sans italic border-l-4 border-[#c49a45] pl-4 py-1">
              "{dalil.indonesianTranslation}"
            </p>
          </div>

          {/* Relevance & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
              <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-700" /> Relevansi Tematik
              </h5>
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                {dalil.relevance}
              </p>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" /> Intisari Dalil
              </h5>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                {dalil.shortExplanation}
              </p>
            </div>
          </div>

          {/* AI Explanation Section ("Jelaskan Dalil") */}
          <div className="bg-white rounded-2xl border-2 border-[#c49a45]/50 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2ede2] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#123f36] rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#c49a45]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#123f36]">
                    Penjelasan Mendalam AI (Tafsir & Konteks)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Berdasarkan rujukan tafsir & syarah ulama mu'tabar
                  </p>
                </div>
              </div>

              {!explanation && !loadingExplanation && (
                <button
                  type="button"
                  id="btn-fetch-explanation-modal"
                  onClick={fetchExplanation}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2a6b5c] hover:bg-[#1f5448] text-white rounded-xl text-xs font-semibold shadow-sm transition-all border border-[#c49a45]/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c49a45]" />
                  <span>Jelaskan Sekarang</span>
                </button>
              )}
            </div>

            {loadingExplanation && (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#2a6b5c] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-[#123f36]">
                  Sedang menelaah kitab tafsir dan syarah hadits...
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  AI memastikan rujukan sesuai manhaj keilmuan Islam dan membedakan antara teks sumber dengan penjelasan.
                </p>
              </div>
            )}

            {explainError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                <span>{explainError}</span>
                <button 
                  onClick={fetchExplanation} 
                  className="font-semibold underline ml-2 hover:text-rose-950"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {explanation && (
              <div className="space-y-4 text-xs sm:text-sm text-gray-700 animate-fadeIn">
                
                {/* Asbabun Nuzul / Asbabul Wurud */}
                {explanation.asbabunNuzulOrWurud && (
                  <div className="bg-[#f9f7f2] p-4 rounded-xl border border-[#e8dcc4]">
                    <span className="font-bold text-[#123f36] block mb-1">
                      {isQuran ? "Asbabun Nuzul (Sebab Turunnya Ayat):" : "Asbabul Wurud (Konteks Hadits):"}
                    </span>
                    <p className="leading-relaxed text-gray-800">
                      {explanation.asbabunNuzulOrWurud}
                    </p>
                  </div>
                )}

                {/* Tafsir / Syarah Summary */}
                <div>
                  <span className="font-bold text-[#123f36] block mb-1 text-sm">
                    Ringkasan Makna Tafsir & Syarah:
                  </span>
                  <p className="leading-relaxed text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    {explanation.tafsirSummary}
                  </p>
                </div>

                {/* Contextual Relevance */}
                <div>
                  <span className="font-bold text-[#123f36] block mb-1 text-sm">
                    Relevansi Bagi Santri, Guru, & Masyarakat:
                  </span>
                  <p className="leading-relaxed text-gray-800 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                    {explanation.contextualRelevance}
                  </p>
                </div>

                {/* Scholars' Views / Ikhtilaf Proporsional */}
                {explanation.scholarsViews && (
                  <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-950 block mb-1 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-800" /> Pandangan & Perbandingan Ulama:
                    </span>
                    <p className="leading-relaxed text-gray-800">
                      {explanation.scholarsViews}
                    </p>
                  </div>
                )}

                {/* Riwayat Para Sahabat & Ulama Salafus Shalih */}
                {explanation.salafScholarsViews && (
                  <div className="bg-[#f7f5ed] p-4 rounded-xl border border-[#c49a45]/40 shadow-xs">
                    <span className="font-bold text-[#123f36] block mb-1.5 flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-[#c49a45]" /> Atsar Sahabat & Ulama Salafus Shalih:
                    </span>
                    <p className="leading-relaxed text-gray-800 text-xs sm:text-sm">
                      {explanation.salafScholarsViews}
                    </p>
                  </div>
                )}

                {/* Bimbingan Asatidz Terpercaya */}
                {explanation.trustedUstadzNotes && (
                  <div className="bg-[#123f36]/5 p-4 rounded-xl border border-[#2a6b5c]/25">
                    <span className="font-bold text-[#123f36] block mb-1.5 flex items-center gap-1.5 text-sm">
                      <GraduationCap className="w-4 h-4 text-[#2a6b5c]" /> Bimbingan Ilmiah Asatidz Terpercaya:
                    </span>
                    <p className="leading-relaxed text-gray-800 text-xs sm:text-sm">
                      {explanation.trustedUstadzNotes}
                    </p>
                  </div>
                )}

                {/* Narasumber & Web Rujukan Penjelasan */}
                {((explanation.sourceAttributions && explanation.sourceAttributions.length > 0) || (dalil.sourceAttributions && dalil.sourceAttributions.length > 0)) && (
                  <div className="bg-[#fcfbf7] p-4 rounded-xl border border-[#c49a45]/40 shadow-xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#e8dcc4] pb-2">
                      <span className="font-bold text-[#123f36] flex items-center gap-1.5 text-xs sm:text-sm">
                        <Globe className="w-4 h-4 text-[#2a6b5c]" /> Narasumber & Web Rujukan Penjelasan:
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">Berdasarkan web & kajian asatidz mu'tabar</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {(explanation.sourceAttributions || dalil.sourceAttributions || []).map((source, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-white border border-[#e8dcc4] hover:border-[#c49a45] transition-all shadow-xs flex flex-col justify-between space-y-1.5"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-block px-2 py-0.5 bg-[#123f36] text-[#e8dcc4] text-[10px] font-bold rounded">
                                {source.websiteName}
                              </span>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#2a6b5c] hover:text-[#123f36] font-semibold inline-flex items-center gap-1 hover:underline"
                                >
                                  <span>Kunjungi Web</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#123f36] mt-1.5">
                              {source.authorOrScholar}
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-snug">
                            {source.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tautan Rujukan Konkret & Search Engine Grounding (Clickable Links) */}
                {((explanation.referenceLinks && explanation.referenceLinks.length > 0) || (dalil.referenceLinks && dalil.referenceLinks.length > 0)) && (
                  <div className="bg-white p-4 rounded-xl border border-[#e8dcc4] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#123f36] flex items-center gap-1.5 text-sm">
                        <Globe className="w-4 h-4 text-[#2a6b5c]" /> Tautan Rujukan & Penelusuran Terbuka:
                      </span>
                      <span className="text-[11px] text-gray-400">Klik untuk langsung membaca rujukan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {(explanation.referenceLinks || dalil.referenceLinks || []).map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#fdfcf9] hover:bg-[#f2ede2] border border-[#e8dcc4] text-[#123f36] hover:text-[#2a6b5c] transition-all text-xs group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate text-[12px] group-hover:underline">
                              {link.title}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {link.sourceName || 'Kajian Ilmiah'}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2a6b5c] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Lessons (Fawaid 'Amaliyyah) */}
                {explanation.practicalLessons && explanation.practicalLessons.length > 0 && (
                  <div className="bg-[#123f36]/5 p-4 rounded-xl border border-[#123f36]/15">
                    <span className="font-bold text-[#123f36] block mb-2 text-sm flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#c49a45]" /> Fawaid & Pelajaran Praktis (Amaliyyah):
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-800 pl-1">
                      {explanation.practicalLessons.map((lesson, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Legal Note & Disclaimer */}
                <div className="p-3 bg-[#e8dcc4]/40 rounded-xl border border-[#c49a45]/30 text-xs text-[#123f36]/90 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#c49a45] shrink-0 mt-0.5" />
                  <p className="italic font-medium">
                    {explanation.legalStatusNote}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-5 bg-white border-t border-[#e8dcc4] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Copy Full Button */}
            <button
              type="button"
              id="btn-copy-full-modal"
              onClick={handleCopyFull}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#f2ede2] hover:bg-[#e8dcc4] text-[#123f36]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#2a6b5c]" />
                  <span>Salin Lengkap</span>
                </>
              )}
            </button>

            {/* Save / Favorite Toggle */}
            <button
              type="button"
              id="btn-save-modal"
              onClick={() => onToggleSave(dalil)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSaved
                  ? 'bg-[#c49a45] text-[#123f36] shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-[#123f36]" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-gray-500" />
                  <span>Favorit</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl text-xs font-semibold bg-[#123f36] hover:bg-[#1f5448] text-white transition-colors ml-auto sm:ml-0"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
