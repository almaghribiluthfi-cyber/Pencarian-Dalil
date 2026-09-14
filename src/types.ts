export type DalilSourceType = 'all' | 'quran' | 'hadith';

export type VerificationStatus = 'Terverifikasi' | 'Perlu Verifikasi' | 'Tidak Ditemukan';

export type Category = 'Semua' | 'Akhlak' | 'Ibadah' | 'Pendidikan' | 'Keluarga' | 'Sosial' | 'Muamalah';

export interface ReferenceLink {
  title: string;
  url: string;
  sourceName?: string; // e.g. "Kemenag RI", "Sunnah.com", "Rumaysho", "Almanhaj", "TafsirWeb", "IslamQA", "NU Online"
}

export interface SourceAttribution {
  websiteName: string; // e.g. "Rumaysho.com", "Almanhaj.or.id", "Sunnah.com", "Kemenag RI", "TafsirWeb"
  authorOrScholar: string; // e.g. "Ustadz Muhammad Abduh Tuasikal, M.Sc.", "Al-Hafizh Ibnu Hajar Al-Asqalani", "Lajnah Daimah"
  description?: string; // e.g. "Kajian Fiqih Luqathah (Barang Temuan)", "Syarah Shahih Al-Bukhari"
  url?: string;
}

export interface DalilItem {
  id: string;
  type: 'quran' | 'hadith';
  reference: string; // e.g., "QS. Al-Isra [17]: 23-24" or "HR. Al-Bukhari no. 5971"
  surahName?: string;
  verseNumber?: string;
  narrator?: string; // e.g., "Abdullah bin Mas'ud", "Abu Hurairah"
  book?: string; // e.g., "Shahih Al-Bukhari", "Shahih Muslim"
  hadithNumber?: string;
  hadithGrade?: 'Shahih' | 'Hasan' | 'Muttafaq \'Alaih' | 'Hasan Shahih' | 'Dhaif (Perlu Dihindari)';
  arabicText: string;
  indonesianTranslation: string;
  relevance: string; // e.g., "Sangat Relevan (98%)" or thematic context
  shortExplanation: string; // Penjelasan singkat makna dalil
  sourceDetails: string; // Rincian kitab, bab, atau juz
  verificationStatus: VerificationStatus;
  category: Category;
  tags: string[];
  referenceLinks?: ReferenceLink[]; // Clickable URLs to credible source platforms
  scholarsReferences?: string[]; // E.g. "Tafsir Ibnu Katsir", "Fathul Bari Al-Asqalani", "Syarah Shahih Muslim An-Nawawi"
  sourceAttributions?: SourceAttribution[]; // Detailed website & scholar attribution
  _relevanceScore?: number; // Internal ranking score for prioritizing top results
}

export interface DalilExplanation {
  dalilId: string;
  reference: string;
  asbabunNuzulOrWurud?: string;
  tafsirSummary: string; // Penjelasan makna berdasarkan tafsir / syarah muktabar
  contextualRelevance: string; // Relevansi dengan kehidupan / pertanyaan santri/guru
  scholarsViews?: string; // Pandangan ulama secara proporsional
  salafScholarsViews?: string; // Penjelasan spesifik para sahabat (Ibnu Abbas, Ibnu Mas'ud) & ulama salafusshalih (Ibnu Katsir, An-Nawawi, dll)
  trustedUstadzNotes?: string; // Catatan bimbingan asatidz terpercaya
  practicalLessons: string[]; // Fawaid / Pelajaran praktis
  legalStatusNote: string; // "Penjelasan ini bersifat edukatif dan ilmiah, bukan fatwa hukum final."
  referenceLinks?: ReferenceLink[]; // Tautan langsung rujukan yang bisa diklik
  sourceAttributions?: SourceAttribution[]; // Web narasumber & ulama yang menjelaskan
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultsCount: number;
  category: Category;
  filter: DalilSourceType;
}

export interface SavedDalilItem {
  dalil: DalilItem;
  savedAt: number;
  notes?: string;
}
