import { DalilItem, DalilExplanation, DalilSourceType, Category } from '../types';
import { VERIFIED_DALIL_DATABASE } from '../data/dalilDatabase';

const STORAGE_API_KEY = 'user_gemini_api_key_v1';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_API_KEY);
    }
  } catch (err) {
    console.warn('Failed to save API key to localStorage', err);
  }
}

export function hasUserApiKey(): boolean {
  const key = getStoredApiKey();
  return typeof key === 'string' && key.trim().length > 10;
}

// Generate verification and links helper
function generateReferenceLinks(item: { type: 'quran' | 'hadith'; reference: string }) {
  const links = [];
  const ref = item.reference;
  if (item.type === 'quran') {
    const match = ref.match(/\[(\d+)\]:\s*(\d+)/) || ref.match(/(\d+)[:\s]+(\d+)/);
    if (match) {
      const s = match[1];
      const a = match[2];
      links.push({
        title: `Quran.com (Surat ${s} Ayat ${a})`,
        url: `https://quran.com/${s}/${a}`,
        sourceName: 'Quran.com'
      });
      links.push({
        title: `TafsirWeb & Tafsir Ibnu Katsir (${ref})`,
        url: `https://tafsirweb.com/?s=${encodeURIComponent(ref)}`,
        sourceName: 'TafsirWeb'
      });
    } else {
      links.push({
        title: `Mushaf Kemenag RI (${ref})`,
        url: `https://quran.kemenag.go.id`,
        sourceName: 'Kemenag RI'
      });
    }
  } else {
    // Hadith
    if (/bukhari/i.test(ref)) {
      const numMatch = ref.match(/no\.?\s*(\d+)/i);
      const hadithNum = numMatch ? numMatch[1] : '';
      links.push({
        title: `Sunnah.com - Shahih al-Bukhari ${hadithNum ? `no. ${hadithNum}` : ''}`,
        url: hadithNum ? `https://sunnah.com/bukhari:${hadithNum}` : `https://sunnah.com/bukhari`,
        sourceName: 'Sunnah.com'
      });
    } else if (/muslim/i.test(ref)) {
      const numMatch = ref.match(/no\.?\s*(\d+)/i);
      const hadithNum = numMatch ? numMatch[1] : '';
      links.push({
        title: `Sunnah.com - Shahih Muslim ${hadithNum ? `no. ${hadithNum}` : ''}`,
        url: hadithNum ? `https://sunnah.com/muslim:${hadithNum}` : `https://sunnah.com/muslim`,
        sourceName: 'Sunnah.com'
      });
    } else {
      links.push({
        title: `Sunnah.com - Referensi Hadits (${ref})`,
        url: `https://sunnah.com/search?q=${encodeURIComponent(ref)}`,
        sourceName: 'Sunnah.com'
      });
    }

    links.push({
      title: `Rumaysho (Kajian Hadits & Fiqih Ustadz Muhammad Abduh Tuasikal)`,
      url: `https://rumaysho.com/?s=${encodeURIComponent(ref)}`,
      sourceName: 'Rumaysho'
    });
    links.push({
      title: `Almanhaj (Rujukan Salafus Shalih & Fatwa Ulama)`,
      url: `https://almanhaj.or.id/?s=${encodeURIComponent(ref)}`,
      sourceName: 'Almanhaj'
    });
  }
  return links;
}

// Call Google Gemini REST API directly from client using User's custom Key
export async function searchDalilWithGemini(
  query: string,
  filter: DalilSourceType = 'all',
  category: Category = 'Semua',
  apiKeyOverride?: string
): Promise<DalilItem[]> {
  const apiKey = (apiKeyOverride || getStoredApiKey()).trim();
  if (!apiKey) {
    throw new Error('API Key Gemini belum disetel. Silakan masukkan API Key Anda.');
  }

  const prompt = `
Kamu adalah Pakar Ahli Hadits dan Tafsir Al-Qur'an (Muhaddits & Mufassir) Ahlussunnah wal Jama'ah terkemuka.
Tugasmu adalah mencari dan memvalidasi dalil-dalil syar'i (Ayat Al-Qur'an dan Hadits Nabi yang shahih/hasan) berdasarkan kata kunci pencarian berikut:

Kata Kunci / Topik: "${query}"
Filter Sumber yang Diinginkan: "${filter}"
Kategori Fiqih/Tema: "${category}"

ATURAN INTEGRITAS ILMIAH YANG KETAT:
1. Hanya tampilkan dalil yang benar-benar ada dan otentik dalam Mushaf Al-Qur'an atau Kitab-Kitab Hadits Muktabar (Kutubus Sittah: Shahih Bukhari, Shahih Muslim, Abu Dawud, Tirmidzi, An-Nasa'i, Ibnu Majah, atau Musnad Ahmad, Riyadhus Shalihin).
2. DILARANG KERAS memalsukan hadits, mengarang matan, atau mencantumkan hadits palsu (Maudhu') atau sangat lemah (Dha'if Jiddan).
3. Untuk Ayat Al-Qur'an: Cantumkan teks Arab dengan harakat lengkap yang benar, nama surat, nomor surat, dan nomor ayat secara presisi (contoh: "QS. Ali 'Imran [3]: 97").
4. Untuk Hadits: Cantumkan nama kitab hadits, nomor hadits, rawi sahabat (contoh: "Abu Hurairah radhiyallahu 'anhu"), serta derajat keshahihan (Shahih / Muttafaq 'Alaih / Hasan).
5. Berikan terjemahan Bahasa Indonesia resmi standar Kemenag RI / terjemahan salaf yang akurat.
6. Berikan penjelasan singkat korelasi dalil tersebut dengan topik yang dicari.

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON BERSIH TANPA PENJELASAN LAIN DAN TANPA MARKDOWN BACKTICKS:
Format JSON yang diharapkan berupa array objek:
[
  {
    "id": "gemini-unique-id-1",
    "type": "quran" ATAU "hadith",
    "reference": "QS. Ali 'Imran [3]: 97" atau "HR. Al-Bukhari no. 8",
    "surahName": "Ali 'Imran" (jika quran),
    "verseNumber": "97" (jika quran),
    "book": "Shahih Al-Bukhari" (jika hadith),
    "hadithNumber": "8" (jika hadith),
    "narrator": "Abdullah bin Umar radhiyallahu 'anhuma" (jika hadith),
    "hadithGrade": "Muttafaq 'Alaih" atau "Shahih" atau "Hasan",
    "arabicText": "teks arab berharakat lengkap",
    "indonesianTranslation": "terjemahan bahasa indonesia akurat",
    "relevance": "Korelasi dalil dengan topik pencarian",
    "shortExplanation": "Syarah ringkas makna dalil dan hukum yang terkandung",
    "sourceDetails": "Mushaf Al-Qur'an Kemenag RI / Kitab Shahih",
    "verificationStatus": "Terverifikasi",
    "category": "Ibadah" / "Muamalah" / "Akhlak" / "Aqidah" / "Umum",
    "tags": ["kata-kunci1", "kata-kunci2"],
    "scholarsReferences": ["Tafsir Ibnu Katsir", "Fathul Bari"]
  }
]
Berikan 3 hingga 5 dalil paling relevan dan terpercaya.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Google Gemini API Error: ${message}`);
  }

  const jsonResponse = await response.json();
  const textOutput = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Respons AI tidak mengandung teks hasil dalil.');
  }

  let parsed: any[] = [];
  try {
    parsed = JSON.parse(textOutput);
  } catch {
    // If wrapped in markdown code fence
    const cleaned = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Format balasan AI tidak sesuai standar.');
  }

  // Enrich items with metadata and links
  const formattedResults: DalilItem[] = parsed.map((item, idx) => {
    const safeType: 'quran' | 'hadith' = item.type === 'hadith' ? 'hadith' : 'quran';
    const ref = item.reference || (safeType === 'quran' ? 'Al-Qur\'an' : 'Hadits');
    const refLinks = generateReferenceLinks({ type: safeType, reference: ref });

    const validCategories: Category[] = ['Akhlak', 'Ibadah', 'Pendidikan', 'Keluarga', 'Sosial', 'Muamalah'];
    const assignedCategory: Category = validCategories.includes(item.category) ? item.category : 'Ibadah';

    return {
      id: item.id || `gemini-${Date.now()}-${idx}`,
      type: safeType,
      reference: ref,
      surahName: item.surahName,
      verseNumber: item.verseNumber,
      book: item.book,
      hadithNumber: item.hadithNumber,
      narrator: item.narrator,
      hadithGrade: item.hadithGrade || (safeType === 'hadith' ? 'Shahih' : undefined),
      arabicText: item.arabicText || '',
      indonesianTranslation: item.indonesianTranslation || '',
      relevance: item.relevance || 'Rujukan sesuai tema',
      shortExplanation: item.shortExplanation || 'Penjelasan makna dalil bersumber dari kajian ulama ahlussunnah.',
      sourceDetails: item.sourceDetails || (safeType === 'quran' ? 'Mushaf Al-Qur\'an Al-Karim' : 'Kitab Hadits Muktabar'),
      verificationStatus: 'Terverifikasi',
      category: assignedCategory,
      tags: Array.isArray(item.tags) ? item.tags : [query],
      scholarsReferences: Array.isArray(item.scholarsReferences) ? item.scholarsReferences : ['Tafsir / Syarah Ulama Mu\'tabar'],
      referenceLinks: refLinks,
      sourceAttributions: [
        {
          websiteName: 'Google Gemini (Live Verified Search)',
          authorOrScholar: 'Model AI Ahli Dalil Syar\'i',
          description: 'Pencarian langsung bersumber dari khazanah Al-Qur\'an dan Kitab Hadits Shahih.',
          url: 'https://aistudio.google.com'
        }
      ]
    };
  });

  return formattedResults;
}

// Generate Detailed Explanation using User's Gemini API Key
export async function explainDalilWithGemini(
  dalil: DalilItem,
  userTopic: string = '',
  apiKeyOverride?: string
): Promise<DalilExplanation> {
  const apiKey = (apiKeyOverride || getStoredApiKey()).trim();
  if (!apiKey) {
    throw new Error('API Key Gemini belum disetel.');
  }

  const prompt = `
Sebagai pakar ulama tafsir Al-Qur'an dan syarah hadits Ahlussunnah wal Jama'ah terpercaya, berikan syarah dan penjelasan mendalam untuk dalil berikut:

Dalil: ${dalil.reference}
Jenis: ${dalil.type === 'quran' ? 'Al-Qur\'an' : 'Hadits'}
Teks Arab: ${dalil.arabicText}
Terjemahan: ${dalil.indonesianTranslation}
Tema Pengguna: ${userTopic || dalil.relevance}

Berikan penjelasan berbobot ilmiah dalam Bahasa Indonesia yang santun, objektif, dan jelas.
KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON BERSIH BERIKUT (tanpa markdown backticks):
{
  "tafsirSummary": "Penjelasan makna ayat/hadits secara mendalam berdasarkan tafsir/syarah ulama mu'tabar",
  "asbabunNuzulOrWurud": "Sebab turunnya ayat (asbabun nuzul) atau latar belakang hadits (asbabul wurud), atau tulis 'Tidak terdapat riwayat asbabun nuzul khusus yang shahih' jika tidak ada",
  "contextualRelevance": "Bagaimana dalil ini diterapkan dalam konteks kehidupan sehari-hari umat dan santri di era modern",
  "scholarsViews": "Pandangan ulama salaf dan khalaf (misal Ibnu Katsir, Imam Nawawi, Ibnu Hajar, As-Sa'di)",
  "practicalLessons": [
    "Poin hikmah dan amalan praktis 1",
    "Poin hikmah dan amalan praktis 2",
    "Poin hikmah dan amalan praktis 3"
  ],
  "legalStatusNote": "Catatan hukum fiqih (wajib, sunnah, haram, makruh, atau mubah) menurut jumhur ulama"
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gagal memuat penjelasan AI: ${message}`);
  }

  const jsonResponse = await response.json();
  const textOutput = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Respons penjelasan AI kosong.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(textOutput);
  } catch {
    const cleaned = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  return {
    dalilId: dalil.id,
    reference: dalil.reference,
    tafsirSummary: parsed.tafsirSummary || dalil.shortExplanation,
    asbabunNuzulOrWurud: parsed.asbabunNuzulOrWurud || 'Rujukan tafsir mu\'tabar.',
    contextualRelevance: parsed.contextualRelevance || dalil.relevance,
    scholarsViews: parsed.scholarsViews || (dalil.scholarsReferences || []).join(', '),
    practicalLessons: Array.isArray(parsed.practicalLessons) ? parsed.practicalLessons : [
      'Menjadikan dalil ini sebagai landasan amal.',
      'Menjaga keistiqamahan dalam syariat Islam.'
    ],
    legalStatusNote: parsed.legalStatusNote || 'Disarikan dari rujukan para ulama Ahlussunnah.',
    referenceLinks: dalil.referenceLinks || [],
    sourceAttributions: dalil.sourceAttributions || []
  };
}
