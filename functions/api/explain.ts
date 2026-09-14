interface CloudflareContext {
  request: Request;
  env: Record<string, string>;
}

export async function onRequestPost(context: CloudflareContext): Promise<Response> {
  try {
    const { request, env } = context;
    const dalil = await request.json() as any;

    if (!dalil || !dalil.reference) {
      return new Response(
        JSON.stringify({ error: 'Data dalil tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    if (!apiKey) {
      // Fallback explanation if API key is not set in Cloudflare
      return new Response(
        JSON.stringify({
          tafsirSummary: `Penjelasan mengenai ${dalil.reference}: Dalil ini membahas tentang ${dalil.relevance}. ${dalil.shortExplanation}`,
          asbabunNuzulOrWurud: dalil.sourceDetails || 'Rujukan kitab mu\'tabar',
          contextualRelevance: `Relevansi: ${dalil.relevance}. Memberikan panduan praktis bagi kaum muslimin dalam kehidupan sehari-hari.`,
          scholarsViews: (dalil.scholarsReferences && dalil.scholarsReferences.length > 0)
            ? dalil.scholarsReferences.join('; ')
            : 'Merujuk pada penjelasan para ulama salafusshalih dan asatidz ahlussunnah.',
          practicalLessons: [
            `Memahami dan mengamalkan kandungan ${dalil.reference}.`,
            'Menjadikan dalil sebagai pedoman syariat dalam perkataan dan perbuatan.',
            'Mempelajari rujukan dari kitab syarah dan tafsir terpercaya.'
          ],
          legalStatusNote: 'Disarikan dari database rujukan terverifikasi. Untuk fatwa hukum spesifik, konsultasikan kepada ulama atau asatidz terpercaya.',
          referenceLinks: dalil.referenceLinks || [],
          sourceAttributions: dalil.sourceAttributions || [
            {
              websiteName: 'Rumaysho.com',
              authorOrScholar: 'Ustadz Muhammad Abduh Tuasikal, M.Sc.',
              description: 'Kajian sunnah & fiqih tematik terpercaya',
              url: 'https://rumaysho.com'
            },
            {
              websiteName: 'Almanhaj.or.id',
              authorOrScholar: 'Dewan Pakar Lajnah Ilmiah',
              description: 'Fatwa, aqidah, dan syarah hadits salafusshalih',
              url: 'https://almanhaj.or.id'
            }
          ]
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Anda adalah seorang ulama tafsir Al-Qur'an dan musthalah hadits yang amanah dan berilmu.
Jelaskan dalil berikut dengan bahasa santun, mendalam, dan terstruktur:

Jenis: ${dalil.type}
Referensi: ${dalil.reference}
Teks Arab: ${dalil.arabicText}
Terjemahan: ${dalil.indonesianTranslation}
Relevansi: ${dalil.relevance}
Sumber: ${dalil.sourceDetails}

Kembalikan output DALAM FORMAT JSON SAJA:
{
  "tafsirSummary": "Penjelasan tafsir atau syarah hadits secara ringkas dan padat",
  "asbabunNuzulOrWurud": "Sebab turunnya ayat atau sebab disabdakannya hadits jika ada",
  "contextualRelevance": "Relevansi kontekstual dalil ini dengan problematika zaman sekarang",
  "scholarsViews": "Pandangan ulama salafusshalih dan asatidz terpercaya",
  "practicalLessons": ["Poin fawaid praktis 1", "Poin fawaid praktis 2", "Poin fawaid praktis 3"],
  "legalStatusNote": "Catatan status hukum atau kehati-hatian",
  "sourceAttributions": [
    {
      "websiteName": "Contoh: Rumaysho.com / Almanhaj.or.id / TafsirWeb.com / Sunnah.com",
      "authorOrScholar": "Nama ustadz atau ulama pensyarah",
      "description": "Topik kajian rujukan",
      "url": "https://..."
    }
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
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
        return new Response(JSON.stringify(parsed), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    throw new Error('Gagal memproses penjelasan AI di Cloudflare');
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error di Cloudflare' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
