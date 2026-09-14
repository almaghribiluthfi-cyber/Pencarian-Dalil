import { VERIFIED_DALIL_DATABASE } from '../../src/data/dalilDatabase';
import { searchLocalDatabase } from '../../src/utils/searchEngine';

interface CloudflareContext {
  request: Request;
  env: Record<string, string>;
}

export async function onRequestPost(context: CloudflareContext): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await request.json() as any;
    const { query = '', filter = 'all', category = 'Semua' } = body || {};

    const cleanQuery = typeof query === 'string' ? query.trim() : '';

    // First search in local verified database
    const localMatches = searchLocalDatabase(cleanQuery, filter, category);

    // If API key is not configured in Cloudflare environment variables, return local results immediately
    const apiKey = env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          query: cleanQuery,
          source: 'database_only',
          results: localMatches
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // If user query has search intent and we have GEMINI_API_KEY, we can query Gemini via REST API
    if (cleanQuery.length > 2 && localMatches.length < 5) {
      try {
        const prompt = `Anda adalah pakar musthalah hadits dan tafsir Al-Qur'an.
Pengguna mencari dalil terkait: "${cleanQuery}".
Filter: ${filter}. Kategori: ${category}.

ATURAN KETAT:
1. JANGAN mengarang ayat, hadits, perawi, nomor ayat, atau nomor hadits.
2. Berikan dalil shahih / hasan yang paling relevan.
3. Cantumkan teks Arab berharakat, terjemahan Indonesia, referensi presisi (surat:ayat / nama kitab & nomor hadits), dan penjelasan singkat.
4. Format output HARUS JSON valid berupa array objek:
[
  {
    "type": "quran" atau "hadith",
    "reference": "Contoh: QS. Al-Ma'idah [5]: 38 atau HR. Al-Bukhari no. 3475",
    "arabicText": "Teks arab berharakat",
    "indonesianTranslation": "Terjemahan bahasa Indonesia",
    "relevance": "Kaitan langsung dalil",
    "sourceDetails": "Nama kitab / tafsir mu'tabar",
    "verificationStatus": "Terverifikasi",
    "category": "${category !== 'Semua' ? category : 'Akhlak'}",
    "tags": ["tag1", "tag2"]
  }
]`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json() as any;
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              // Combine local results + verified ai results
              const combined = [...localMatches];
              for (const item of parsed) {
                if (!combined.some(c => c.reference.toLowerCase() === item.reference?.toLowerCase())) {
                  combined.push({
                    ...item,
                    id: `cf-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    verificationStatus: item.verificationStatus || 'Terverifikasi'
                  });
                }
              }
              return new Response(
                JSON.stringify({
                  query: cleanQuery,
                  source: 'database_plus_gemini',
                  results: combined
                }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini request failed in Cloudflare, returning local results:', geminiErr);
      }
    }

    return new Response(
      JSON.stringify({
        query: cleanQuery,
        source: 'database_only',
        results: localMatches
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err?.message || 'Server error in Cloudflare Function',
        results: []
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
