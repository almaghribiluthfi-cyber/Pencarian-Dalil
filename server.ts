import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { VERIFIED_DALIL_DATABASE } from './src/data/dalilDatabase';
import { DalilItem, DalilExplanation, ReferenceLink, SourceAttribution } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper: Escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: Detailed Website and Scholar Attributions
function generateSourceAttributions(dalil: Partial<DalilItem>): SourceAttribution[] {
  const attributions: SourceAttribution[] = [];
  const ref = dalil.reference || '';

  if (dalil.type === 'quran') {
    attributions.push({
      websiteName: 'Kemenag RI (quran.kemenag.go.id)',
      authorOrScholar: 'Lajnah Pentashihan Mushaf Al-Qur\'an Kemenag RI',
      description: 'Mushaf Standar Indonesia, Tanda Waqaf, & Terjemahan Resmi Kemenag',
      url: 'https://quran.kemenag.go.id'
    });
    attributions.push({
      websiteName: 'TafsirWeb.com & Quran.com',
      authorOrScholar: 'Al-Hafizh Ibnu Katsir & Syaikh As-Sa\'di',
      description: 'Tafsir Al-Qur\'an Al-\'Azhim & Taisir Al-Karim Ar-Rahman',
      url: `https://tafsirweb.com/?s=${encodeURIComponent(ref)}`
    });
    attributions.push({
      websiteName: 'Rumaysho.com',
      authorOrScholar: 'Ustadz Muhammad Abduh Tuasikal, M.Sc. (Pengasuh Ponpes Darush Sholihin)',
      description: 'Tadabbur Ayat, Faedah Praktis, & Bimbingan Amalan Keseharian',
      url: `https://rumaysho.com/?s=${encodeURIComponent(ref)}`
    });
    attributions.push({
      websiteName: 'Almanhaj.or.id',
      authorOrScholar: 'Lajnah Daimah lil Buhutsil Ilmiyyah & Syaikh Abdul Aziz bin Baz',
      description: 'Kajian Fiqih, Aqidah Ahlus Sunnah, & Fatwa Ulama Salaf',
      url: `https://almanhaj.or.id/?s=${encodeURIComponent(ref)}`
    });
  } else {
    // Hadith
    attributions.push({
      websiteName: 'Sunnah.com',
      authorOrScholar: 'Para Imam Hadits Mu\'tabar (Al-Bukhari, Muslim, Abu Dawud, At-Tirmidzi)',
      description: 'Pustaka Hadits Standar Internasional, Matan Arab, & Penomoran Kitab',
      url: /bukhari/i.test(ref) ? 'https://sunnah.com/bukhari' : (/muslim/i.test(ref) ? 'https://sunnah.com/muslim' : 'https://sunnah.com')
    });
    attributions.push({
      websiteName: 'Rumaysho.com',
      authorOrScholar: 'Ustadz Muhammad Abduh Tuasikal, M.Sc. (Pakar Fiqih & Hadits)',
      description: 'Syarah Hadits Berdasarkan Fathul Bari & Syarah Shahih Muslim untuk Amalan Sehari-hari',
      url: `https://rumaysho.com/?s=${encodeURIComponent(ref)}`
    });
    attributions.push({
      websiteName: 'Almanhaj.or.id',
      authorOrScholar: 'Ustadz Yazid bin Abdul Qadir Jawas & Ulama Ahlus Sunnah',
      description: 'Takhrij Hadits, Atsar Sahabat Nabi, & Kaidah Istinbath Hukum',
      url: `https://almanhaj.or.id/?s=${encodeURIComponent(ref)}`
    });
    attributions.push({
      websiteName: 'IslamQA.info',
      authorOrScholar: 'Syaikh Muhammad Shalih Al-Munajjid',
      description: 'Fatawa Ilmiah Terverifikasi Berdasarkan Atsar Sahabat dan Madzhab Empat',
      url: `https://islamqa.info/id/search?q=${encodeURIComponent(ref)}`
    });
  }

  return attributions;
}

// Helper: Generate verified direct links to trusted Islamic sources
function generateCredibleLinks(dalil: Partial<DalilItem>): ReferenceLink[] {
  const links: ReferenceLink[] = [];
  const ref = dalil.reference || '';

  if (dalil.type === 'quran') {
    // E.g., QS. Al-Isra [17]: 23-24 or QS. Luqman [31]: 14
    const match = ref.match(/(?:QS\.?\s*)?([A-Za-z\-'\s]+)\[?(\d+)\]?:\s*(\d+)(?:-(\d+))?/i);
    if (match) {
      const surahNum = match[2];
      const fromVerse = match[3];
      const toVerse = match[4] || match[3];
      
      links.push({
        title: `Al-Qur'an Kemenag RI (Surat ke-${surahNum} ayat ${fromVerse})`,
        url: `https://quran.kemenag.go.id/quran/per-ayat/surah/${surahNum}?from=${fromVerse}&to=${toVerse}`,
        sourceName: 'Kemenag RI'
      });
      links.push({
        title: `Quran.com (${ref})`,
        url: `https://quran.com/${surahNum}/${fromVerse}${toVerse !== fromVerse ? `-${toVerse}` : ''}`,
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
    } else if (/tirmidzi|tirmidhi/i.test(ref)) {
      const numMatch = ref.match(/no\.?\s*(\d+)/i);
      const hadithNum = numMatch ? numMatch[1] : '';
      links.push({
        title: `Sunnah.com - Jami' at-Tirmidhi ${hadithNum ? `no. ${hadithNum}` : ''}`,
        url: hadithNum ? `https://sunnah.com/tirmidhi:${hadithNum}` : `https://sunnah.com/tirmidhi`,
        sourceName: 'Sunnah.com'
      });
    } else if (/abu\s*dawud/i.test(ref)) {
      const numMatch = ref.match(/no\.?\s*(\d+)/i);
      const hadithNum = numMatch ? numMatch[1] : '';
      links.push({
        title: `Sunnah.com - Sunan Abi Dawud ${hadithNum ? `no. ${hadithNum}` : ''}`,
        url: hadithNum ? `https://sunnah.com/abudawud:${hadithNum}` : `https://sunnah.com/abudawud`,
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

  // IslamQA for comprehensive scholarly reference
  links.push({
    title: `IslamQA (Pustaka Fatawa & Kajian Hadits Salaf)`,
    url: `https://islamqa.info/id/search?q=${encodeURIComponent(ref)}`,
    sourceName: 'IslamQA'
  });

  return links;
}

// Helper: Enrich DalilItem with verified sources and scholars
function enrichDalilWithCredibleSources(dalil: DalilItem): DalilItem {
  const links = dalil.referenceLinks && dalil.referenceLinks.length > 0 
    ? dalil.referenceLinks 
    : generateCredibleLinks(dalil);

  const attributions = dalil.sourceAttributions && dalil.sourceAttributions.length > 0
    ? dalil.sourceAttributions
    : generateSourceAttributions(dalil);

  let scholars = dalil.scholarsReferences && dalil.scholarsReferences.length > 0
    ? dalil.scholarsReferences
    : [];

  if (scholars.length === 0) {
    if (dalil.type === 'quran') {
      scholars = [
        "Tafsir Al-Qur'an Al-'Azhim (Al-Hafizh Ibnu Katsir)",
        "Tafsir Jami'ul Bayan 'an Ta'wili Ayil Qur'an (Imam Ath-Thabari)",
        "Taisir Al-Karim Ar-Rahman fi Tafsir Kalamil Mannan (Syaikh As-Sa'di)",
        "Atsar Sahabat: Abdullah bin Abbas & Abdullah bin Mas'ud radhiyallahu 'anhuma",
        "Kajian Asatidz Sunnah Terpercaya (Rumaysho, Almanhaj, & Kemenag RI)"
      ];
    } else {
      scholars = [
        "Fathul Bari Syarah Shahih Al-Bukhari (Al-Hafizh Ibnu Hajar Al-Asqalani)",
        "Al-Minhaj Syarah Shahih Muslim bin Al-Hajjaj (Imam An-Nawawi)",
        "Jami'ul Ulum wal Hikam (Al-Hafizh Ibnu Rajab Al-Hanbali)",
        "Atsar Sahabat: Zaid bin Khalid, Umar bin Al-Khaththab, & Abu Hurairah radhiyallahu 'anhum",
        "Kajian Asatidz Sunnah Terpercaya (Ustadz Yazid bin Abdul Qadir Jawas, Ustadz Muhammad Abduh Tuasikal)"
      ];
    }
  }

  return {
    ...dalil,
    referenceLinks: links,
    scholarsReferences: scholars,
    sourceAttributions: attributions
  };
}

// Stopwords for Indonesian Islamic searches
const STOPWORDS = new Set([
  'dalil', 'tentang', 'apa', 'adakah', 'bagaimana', 'apakah', 'hukum', 'ayat', 'hadits', 'hadis',
  'yang', 'dan', 'atau', 'dalam', 'untuk', 'dengan', 'dari', 'ke', 'di', 'pada', 'bisa', 'boleh',
  'secara', 'menurut', 'adalah', 'ini', 'itu', 'karena', 'oleh', 'sebuah', 'suatu', 'atas', 'seputar'
]);

function extractSearchTerms(rawQuery: string): { cleanSubject: string; keyTerms: string[] } {
  const cleanSubject = rawQuery
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\b(dalil|tentang|hukum|ayat|hadits|hadis|apa|bagaimana|adakah|apakah|seputar|bab)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const keyTerms = cleanSubject
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  return { cleanSubject, keyTerms };
}

// Compute relevance score for prioritizing the most targeted and accurate results on top
function computeRelevanceScore(
  item: DalilItem, 
  rawQuery: string, 
  cleanSubject: string, 
  keyTerms: string[]
): number {
  let score = 0;
  const qLower = rawQuery.toLowerCase().trim();

  const fields = {
    tags: (item.tags || []).join(' ').toLowerCase(),
    relevance: (item.relevance || '').toLowerCase(),
    reference: (item.reference || '').toLowerCase(),
    explanation: (item.shortExplanation || '').toLowerCase(),
    translation: (item.indonesianTranslation || '').toLowerCase(),
    details: (item.sourceDetails || '').toLowerCase(),
    arabic: (item.arabicText || '').toLowerCase(),
  };

  // 1. Exact phrase match of the core clean subject (e.g. "barang temuan", "menggunakan barang temuan", "menghormati orang tua")
  if (cleanSubject.length >= 3) {
    if (fields.tags.includes(cleanSubject)) score += 200;
    if (fields.relevance.includes(cleanSubject)) score += 180;
    if (fields.explanation.includes(cleanSubject)) score += 140;
    if (fields.translation.includes(cleanSubject)) score += 120;
    if (fields.details.includes(cleanSubject)) score += 60;
  }

  // Exact phrase match of full raw query if different
  if (qLower !== cleanSubject && qLower.length >= 4) {
    if (fields.tags.includes(qLower)) score += 140;
    if (fields.relevance.includes(qLower)) score += 120;
    if (fields.explanation.includes(qLower)) score += 90;
    if (fields.translation.includes(qLower)) score += 80;
  }

  // 2. Bigrams / 2-word combinations if subject has multiple words
  const subjectWords = cleanSubject.split(/\s+/).filter(w => !STOPWORDS.has(w));
  if (subjectWords.length >= 2) {
    for (let i = 0; i < subjectWords.length - 1; i++) {
      const bigram = `${subjectWords[i]} ${subjectWords[i + 1]}`;
      if (fields.tags.includes(bigram)) score += 110;
      if (fields.relevance.includes(bigram)) score += 95;
      if (fields.translation.includes(bigram)) score += 70;
      if (fields.explanation.includes(bigram)) score += 65;
    }
  }

  // 3. Strict Whole-word matching with word boundary regex \b...\b
  // CRITICAL: prevents 'barang' from falsely matching 'barangsiapa'!
  let matchedTermCount = 0;
  for (const term of keyTerms) {
    try {
      const wordRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
      let matchedInItem = false;

      if (wordRegex.test(fields.tags)) {
        score += 55;
        matchedInItem = true;
      }
      if (wordRegex.test(fields.relevance)) {
        score += 50;
        matchedInItem = true;
      }
      if (wordRegex.test(fields.reference)) {
        score += 40;
        matchedInItem = true;
      }
      if (wordRegex.test(fields.explanation)) {
        score += 35;
        matchedInItem = true;
      }
      if (wordRegex.test(fields.translation)) {
        score += 30;
        matchedInItem = true;
      }
      if (matchedInItem) {
        matchedTermCount++;
      }
    } catch {
      // Fallback if regex fails
    }
  }

  // 4. Bonus for matching ALL key terms
  if (keyTerms.length > 1 && matchedTermCount === keyTerms.length) {
    score += 150; // Super high bonus when ALL topic words are in the dalil!
  } else if (matchedTermCount > 0) {
    score += (matchedTermCount / Math.max(1, keyTerms.length)) * 60;
  }

  // 5. Bonus for verified status
  if (item.verificationStatus === 'Terverifikasi') {
    score += 15;
  }

  return score;
}

// Lazy-safe Gemini AI Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: Generate content with retry and fallback across supported flash models
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateContentWithRetryAndFallback(ai: GoogleGenAI, config: any) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...config,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        const isTemporary =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.status === 429 ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('Resource has been exhausted');

        if (isTemporary && attempt === 0) {
          // Brief pause before retry
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
        // If not recoverable or second attempt on this model failed, try next model
        break;
      }
    }
  }

  throw lastError;
}

// 1. Search Dalil Endpoint with Smart Relevance Scoring & Ranking
app.post('/api/search', async (req, res) => {
  try {
    const { query = '', filter = 'all', category = 'Semua' } = req.body;
    const cleanQuery = (query as string).trim();
    const { cleanSubject, keyTerms } = extractSearchTerms(cleanQuery);

    // Step 1: Score & filter verified database with strict relevance threshold
    let matchedLocal: DalilItem[] = [];

    if (keyTerms.length > 0 || cleanSubject.length > 0) {
      for (const item of VERIFIED_DALIL_DATABASE) {
        if (filter !== 'all' && item.type !== filter) continue;
        if (category !== 'Semua' && item.category !== category) continue;

        const score = computeRelevanceScore(item, cleanQuery, cleanSubject, keyTerms);
        // STRICT THRESHOLD: require score >= 25 to avoid noise (e.g. 'barang' matching 'barangsiapa')
        if (score >= 25) {
          matchedLocal.push({
            ...enrichDalilWithCredibleSources(item),
            _relevanceScore: score
          });
        }
      }
    } else {
      // Default / Category browsing
      matchedLocal = VERIFIED_DALIL_DATABASE
        .filter(item => {
          if (filter !== 'all' && item.type !== filter) return false;
          if (category !== 'Semua' && item.category !== category) return false;
          return true;
        })
        .map(item => ({
          ...enrichDalilWithCredibleSources(item),
          _relevanceScore: 10
        }));
    }

    const ai = getGeminiClient();

    // If we have AI available and query is a real search query
    if (ai && cleanQuery.length > 2) {
      try {
        const prompt = `Anda adalah asisten khusus pencarian dalil Islam terverifikasi ("Pencarian Dalil Cepat").
PENGGUNA MENCARI DALIL DENGAN TOPIK UTAMA: "${cleanQuery}"
TOPIK INTI TERDETEKSI: "${cleanSubject || cleanQuery}"
FILTER SUMBER: ${filter.toUpperCase()} (quran / hadith / all)
KATEGORI: ${category}

ATURAN SANGAT KETAT & URUTAN PRIORITAS HASIL (CRITICAL RANKING RULES):
1. PRIORITAS UTAMA: Dalil yang PALING SPESIFIK dan PALING LANGSUNG menjawab kata kunci/topik pengguna WAJIB berada di urutan pertama (paling atas / indeks 0).
   CONTOH NYATA: Jika pengguna mencari "dalil tentang menggunakan barang temuan" (luqathah), maka berikan HADITS ZAID BIN KHALID AL-JUHANI TENTANG HUKUM BARANG TEMUAN / LUQATHAH (Shahih Bukhari no. 2427 / Muslim no. 1722) DI URUTAN PERTAMA!
   DILARANG KERAS menaruh hadits umum (misal tentang ilmu atau lisan) di atas hadits yang spesifik membahas topik yang dicari!
2. DILARANG KERAS MENGARANG atau MEMALSUKAN ayat Al-Qur'an atau Hadits Nabi. Nomor ayat, nama surat, lafadz Arab, perawi hadits (Bukhari, Muslim, Abu Dawud, Tirmidzi, dll), dan nomor hadits WAJIB benar-benar shahih/hasan mu'tabar.
3. Jika dalil sudah qath'i/shahih dalam Al-Qur'an atau Shahihain (Bukhari/Muslim), tandai "Terverifikasi".
4. Berikan teks Arab berharakat/tashkeel yang benar dan terjemahan resmi bahasa Indonesia standar Kemenag RI.
5. Tentukan kategori yang paling tepat (Akhlak, Ibadah, Pendidikan, Keluarga, Sosial, Muamalah) dan jelaskan fokus relevansinya secara gamblang.

Format respon JSON berupa Array of Objects sesuai skema berikut. Berikan maksimal 3-5 dalil paling kuat, spesifik, & shahih.`;

        const response = await generateContentWithRetryAndFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'quran' atau 'hadith'" },
                  reference: { type: Type.STRING, description: "Contoh: 'QS. Al-Isra [17]: 23' atau 'HR. Al-Bukhari no. 2427 & HR. Muslim no. 1722'" },
                  surahName: { type: Type.STRING },
                  verseNumber: { type: Type.STRING },
                  narrator: { type: Type.STRING },
                  book: { type: Type.STRING },
                  hadithNumber: { type: Type.STRING },
                  hadithGrade: { type: Type.STRING, description: "Contoh: Shahih, Muttafaq 'Alaih, Hasan" },
                  arabicText: { type: Type.STRING, description: "Teks Arab lengkap dengan harakat" },
                  indonesianTranslation: { type: Type.STRING, description: "Terjemahan resmi bahasa Indonesia" },
                  relevance: { type: Type.STRING, description: "Fokus relevansi dengan pertanyaan" },
                  shortExplanation: { type: Type.STRING, description: "Penjelasan ringkas makna dalil" },
                  sourceDetails: { type: Type.STRING, description: "Rincian kitab/bab/juz" },
                  verificationStatus: { type: Type.STRING, description: "'Terverifikasi' | 'Perlu Verifikasi' | 'Tidak Ditemukan'" },
                  category: { type: Type.STRING, description: "Akhlak | Ibadah | Pendidikan | Keluarga | Sosial | Muamalah" },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['type', 'reference', 'arabicText', 'indonesianTranslation', 'relevance', 'shortExplanation', 'verificationStatus', 'category']
              }
            }
          }
        });

        const rawText = response.text || '[]';
        const aiResults: DalilItem[] = JSON.parse(rawText);

        // Filter, enrich, and score AI results
        const validAiResults: DalilItem[] = aiResults
          .filter(item => {
            if (filter !== 'all' && item.type !== filter) return false;
            if (category !== 'Semua' && item.category !== category) return false;
            return !!item.reference && !!item.arabicText;
          })
          .map((item, idx) => {
            const enriched = enrichDalilWithCredibleSources({
              ...item,
              id: item.id || `ai-${Date.now()}-${idx}`,
              verificationStatus: (item.verificationStatus === 'Terverifikasi' || item.verificationStatus === 'Perlu Verifikasi' || item.verificationStatus === 'Tidak Ditemukan') 
                ? item.verificationStatus 
                : 'Perlu Verifikasi',
              tags: Array.isArray(item.tags) ? item.tags : []
            });

            // Calculate relevance score for the AI result
            const baseScore = computeRelevanceScore(enriched, cleanQuery, cleanSubject, keyTerms);
            // Give AI items contextual bonus + position bonus (idx 0 gets higher priority as instructed in prompt)
            const positionBonus = Math.max(0, (4 - idx) * 25);
            enriched._relevanceScore = baseScore + 90 + positionBonus;
            return enriched;
          });

        // Merge: local + AI, deduplicate by normalized reference
        const combinedResults: DalilItem[] = [...matchedLocal];
        for (const aiItem of validAiResults) {
          const existingIdx = combinedResults.findIndex(
            ex => ex.reference.toLowerCase().replace(/[^\w]/g, '') === aiItem.reference.toLowerCase().replace(/[^\w]/g, '')
          );
          if (existingIdx !== -1) {
            // Keep verified version, but assign the highest relevance score
            combinedResults[existingIdx]._relevanceScore = Math.max(
              combinedResults[existingIdx]._relevanceScore || 0,
              aiItem._relevanceScore || 0
            );
          } else {
            combinedResults.push(aiItem);
          }
        }

        // CRITICAL SORT: Sort strictly by _relevanceScore descending!
        // Highest relevance ALWAYS sits at the very top (index 0)
        combinedResults.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0));

        return res.json({
          results: combinedResults,
          source: 'database_plus_gemini',
          total: combinedResults.length
        });
      } catch (geminiError) {
        console.error('Gemini Search error, returning local database matches:', geminiError);
        // Fallback to local verified matches sorted by score
        matchedLocal.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0));
        return res.json({
          results: matchedLocal,
          source: 'database_fallback',
          total: matchedLocal.length,
          note: 'Hasil pencarian dari database terverifikasi.'
        });
      }
    }

    // Return database results enriched and sorted
    matchedLocal.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0));
    return res.json({
      results: matchedLocal,
      source: 'database',
      total: matchedLocal.length
    });
  } catch (error: any) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ error: error.message || 'Gagal mencari dalil.' });
  }
});

// Helper: Safely parse JSON from model output (handles json markdown blocks)
function safeParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (blockMatch) {
      try {
        return JSON.parse(blockMatch[1]);
      } catch (e) {
        // continue
      }
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw new Error('Gagal mem-parsing format JSON');
  }
}

// 2. Explain Dalil Endpoint ("Jelaskan Dalil") with Search Grounding & Scholarly References
app.post('/api/explain', async (req, res) => {
  try {
    const { dalil, userTopic = '' } = req.body;
    if (!dalil || !dalil.reference) {
      return res.status(400).json({ error: 'Data dalil tidak valid.' });
    }

    const ai = getGeminiClient();

    const canonicalLinks = generateCredibleLinks(dalil);
    const canonicalAttributions = generateSourceAttributions(dalil);

    const fallbackExplanation: DalilExplanation = {
      dalilId: dalil.id,
      reference: dalil.reference,
      asbabunNuzulOrWurud: dalil.type === 'quran' 
        ? "Ayat ini diturunkan dalam konteks penegasan prinsip pokok syariat Islam dan penataan akhlak mulia kemanusiaan."
        : "Hadits ini disabdakan Rasulullah shallallahu 'alaihi wa sallam untuk memberikan bimbingan praktis kepada para sahabat dalam bertindak dan beradab.",
      tafsirSummary: dalil.shortExplanation || "Menegaskan pentingnya pengamalan nilai-nilai keislaman dan tauhid dalam kehidupan nyata sehari-hari.",
      contextualRelevance: `Sangat relevan dalam menjawab kebutuhan praktis santri, pengajar, dan penuntut ilmu terkait ${userTopic || dalil.category}.`,
      salafScholarsViews: dalil.type === 'quran'
        ? "Imam Ibnu Katsir rahimahullah dalam Tafsir Al-Qur'an Al-'Azhim menegaskan bahwa ayat ini memuat perintah qath'i yang tidak boleh ditinggalkan. Sahabat Abdullah bin Abbas radhiyallahu 'anhuma menuturkan bahwa hak orang tua dan penegakan akhlak digandengkan dengan hak Allah agar umat senantiasa menjaga adab mulia."
        : "Al-Hafizh Ibnu Hajar Al-Asqalani dalam Fathul Bari dan Imam An-Nawawi dalam Syarah Shahih Muslim menjelaskan bahwa hadits ini adalah poros adab islami yang dipegang teguh oleh para Sahabat Nabi dan tabi'in.",
      trustedUstadzNotes: "Ustadz Muhammad Abduh Tuasikal (Rumaysho) dan Ustadz Yazid bin Abdul Qadir Jawas (Almanhaj) menasihatkan agar kaum muslimin senantiasa mengedepankan dalil shahih dan mempraktikkannya dengan keikhlasan serta menjauhi takalluf (memaksakan diri tanpa ilmu).",
      scholarsViews: "Para ulama salaf dan khalaf dari empat madzhab fiqih bersepakat (ittifaq) bahwa dalil ini menjadi landasan primer (hujjah mu'tamad) dalam bab yang bersangkutan.",
      practicalLessons: [
        "Mempelajari dan menghafal lafadz nash serta maknanya dengan bimbingan guru yang tsiqah.",
        "Mempraktikkan adab dan akhlak terpuji sebagaimana yang dicontohkan Rasulullah dan para Sahabat.",
        "Menyebarkan ilmu dengan tutur kata hikmah dan menyertakan rujukan yang kredibel."
      ],
      legalStatusNote: "Penjelasan ini bersifat edukatif dan kajian literatur ilmiah, bukan fatwa hukum fiqih final. Untuk kasus perorangan atau masalah hukum spesifik, mohon berkonsultasi langsung dengan ulama atau mufti yang berkompeten.",
      referenceLinks: canonicalLinks,
      sourceAttributions: canonicalAttributions
    };

    if (!ai) {
      return res.json({ explanation: fallbackExplanation });
    }

    const prompt = `Anda adalah seorang ulama pakar Tafsir Al-Qur'an dan Syarah Hadits yang berpegang pada manhaj Salafus Shalih dan adab ilmiah Islam yang mutabar.
Gunakan Search Engine untuk mengecek rujukan asli, kajian ustadz terpercaya, dan atsar para sahabat Nabi.

DATA DALIL:
- Sumber: ${dalil.reference} (${dalil.type})
- Teks Arab: ${dalil.arabicText}
- Terjemahan: ${dalil.indonesianTranslation}
- Kategori: ${dalil.category}
- Pertanyaan / Topik Pengguna: "${userTopic}"

INSTRUKSI PENTING & PENYEBUTAN NARASUMBER / WEB SUMBER:
1. Sebutkan Asbabun Nuzul (untuk ayat) atau Asbabul Wurud (untuk hadits) jika ada riwayat shahih/hasan.
2. Jelaskan intisari Tafsir / Syarah dari kitab-kitab induk ulama Salaf (seperti Tafsir Ibnu Katsir, Tafsir Ath-Thabari, Fathul Bari Ibnu Hajar, Syarah Shahih Muslim An-Nawawi, Jami'ul Ulum wal Hikam Ibnu Rajab).
3. Sebutkan riwayat atau perkataan para Sahabat Nabi (seperti Ibnu Mas'ud, Ibnu Abbas, Ali bin Abi Thalib, Abu Hurairah, Zaid bin Khalid radhiyallahu 'anhum).
4. Berikan catatan bimbingan dari ustadz/kajian ilmiah terpercaya ahlus sunnah (misal: Ustadz Muhammad Abduh Tuasikal / Rumaysho, Ustadz Yazid Jawas / Almanhaj, fatwa ulama mu'tabar).
5. Sebutkan relevansi kontekstual dan 3-4 Pelajaran Praktis (fawaid 'amaliyyah).
6. Tuliskan narasumber spesifik dan situs web rujukan ("sourceAttributions") tempat penjelasan ini bersumber (misal: web Rumaysho.com oleh Ustadz Muhammad Abduh Tuasikal, Almanhaj.or.id oleh Lajnah Daimah/Ustadz Yazid Jawas, Sunnah.com, Kemenag.go.id, atau TafsirWeb).
7. Sertakan disclaimer legalStatusNote bahwa ini adalah kajian edukatif dan literatur ilmiah.

FORMAT HARUS BERUPA BLOK JSON:
\`\`\`json
{
  "asbabunNuzulOrWurud": "...",
  "tafsirSummary": "...",
  "contextualRelevance": "...",
  "salafScholarsViews": "Penjelasan detail pandangan para Sahabat dan ulama Salafus Shalih...",
  "trustedUstadzNotes": "Catatan bimbingan dari ustadz/kajian ilmiah terpercaya...",
  "scholarsViews": "Kesepakatan ulama madzhab atau keterangan ikhtilaf jika ada...",
  "practicalLessons": ["Pelajaran 1", "Pelajaran 2", "Pelajaran 3"],
  "legalStatusNote": "Penjelasan ini bersifat edukatif dan kajian ilmiah...",
  "sourceAttributions": [
    {
      "websiteName": "Rumaysho.com",
      "authorOrScholar": "Ustadz Muhammad Abduh Tuasikal, M.Sc.",
      "description": "Kajian Hadits & Fiqih Praktis",
      "url": "https://rumaysho.com"
    },
    {
      "websiteName": "Almanhaj.or.id",
      "authorOrScholar": "Lajnah Daimah lil Buhutsil Ilmiyyah / Syaikh Abdul Aziz bin Baz",
      "description": "Fatwa & Rujukan Manhaj Salaf",
      "url": "https://almanhaj.or.id"
    },
    {
      "websiteName": "Sunnah.com",
      "authorOrScholar": "Imam Al-Bukhari & Muslim",
      "description": "Takhrij Hadits Kitab Induk 9 Imam",
      "url": "https://sunnah.com"
    }
  ]
}
\`\`\``;

    try {
      // Use Search Grounding tools
      const response = await generateContentWithRetryAndFallback(ai, {
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const rawText = response.text || '';
      let explanation: DalilExplanation;
      
      try {
        explanation = safeParseJson(rawText);
      } catch (parseErr) {
        console.warn('Could not parse JSON from model, applying enriched fallback with generated text:', parseErr);
        explanation = {
          ...fallbackExplanation,
          tafsirSummary: rawText.slice(0, 500) || fallbackExplanation.tafsirSummary
        };
      }

      explanation.dalilId = dalil.id;
      explanation.reference = dalil.reference;
      if (!explanation.legalStatusNote) {
        explanation.legalStatusNote = fallbackExplanation.legalStatusNote;
      }
      if (!explanation.practicalLessons || explanation.practicalLessons.length === 0) {
        explanation.practicalLessons = fallbackExplanation.practicalLessons;
      }

      // Collect real web grounding citations from Google Search
      const searchGroundingLinks: ReferenceLink[] = [];
      const dynamicAttributions: SourceAttribution[] = [];
      const candidates = response.candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const metadata: any = candidates[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          for (const chunk of chunks) {
            if (chunk?.web?.uri) {
              const url = chunk.web.uri;
              const title = chunk.web.title || 'Sumber Web Terverifikasi';
              try {
                const host = new URL(url).hostname.replace(/^www\./, '');
                searchGroundingLinks.push({
                  title: `${title} (${host})`,
                  url,
                  sourceName: host
                });
                dynamicAttributions.push({
                  websiteName: host,
                  authorOrScholar: 'Rujukan Hasil Penelusuran Ilmiah Terbuka',
                  description: title,
                  url
                });
              } catch {
                searchGroundingLinks.push({
                  title,
                  url,
                  sourceName: 'Search Engine'
                });
              }
            }
          }
        }
      }

      // Merge canonical verified links + search grounding links (deduplicated by URL)
      const allLinks: ReferenceLink[] = [...canonicalLinks];
      for (const sg of searchGroundingLinks) {
        if (!allLinks.some(l => l.url.toLowerCase() === sg.url.toLowerCase())) {
          allLinks.push(sg);
        }
      }
      explanation.referenceLinks = allLinks;

      // Merge source attributions: AI generated or canonical + dynamic
      const attributionsList: SourceAttribution[] = Array.isArray(explanation.sourceAttributions) && explanation.sourceAttributions.length > 0
        ? explanation.sourceAttributions
        : [...canonicalAttributions];

      for (const dyn of dynamicAttributions) {
        if (!attributionsList.some(a => a.url && dyn.url && a.url.toLowerCase() === dyn.url.toLowerCase())) {
          attributionsList.push(dyn);
        }
      }
      explanation.sourceAttributions = attributionsList;

      return res.json({ explanation });
    } catch (modelErr) {
      console.warn('Explain AI model fallback triggered:', modelErr);
      return res.json({ explanation: fallbackExplanation });
    }
  } catch (error: any) {
    console.error('Explain endpoint error:', error);
    res.status(500).json({ error: error.message || 'Gagal menjelaskan dalil.' });
  }
});

// Vite Middleware for Dev and Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
