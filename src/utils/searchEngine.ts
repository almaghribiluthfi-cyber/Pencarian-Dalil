import { DalilItem, DalilSourceType } from '../types';
import { VERIFIED_DALIL_DATABASE } from '../data/dalilDatabase';

// Stopwords for Indonesian Islamic searches
const STOPWORDS = new Set([
  'dalil', 'tentang', 'apa', 'adakah', 'bagaimana', 'apakah', 'hukum', 'ayat', 'hadits', 'hadis',
  'yang', 'dan', 'atau', 'dalam', 'untuk', 'dengan', 'dari', 'ke', 'di', 'pada', 'bisa', 'boleh',
  'secara', 'menurut', 'adalah', 'ini', 'itu', 'karena', 'oleh', 'sebuah', 'suatu', 'atas', 'seputar'
]);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSearchTerms(rawQuery: string): { cleanSubject: string; keyTerms: string[] } {
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

export function computeRelevanceScore(
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

  // 1. Exact phrase match of the core clean subject (e.g. "mencuri", "barang temuan", "menghormati orang tua")
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
      // Fallback
    }
  }

  // 4. Bonus for matching ALL key terms
  if (keyTerms.length > 1 && matchedTermCount === keyTerms.length) {
    score += 150;
  } else if (matchedTermCount > 0) {
    score += (matchedTermCount / Math.max(1, keyTerms.length)) * 60;
  }

  // 5. Bonus for verified status
  if (item.verificationStatus === 'Terverifikasi') {
    score += 15;
  }

  return score;
}

export function searchLocalDatabase(
  rawQuery: string, 
  filter: DalilSourceType = 'all', 
  category: string = 'Semua'
): DalilItem[] {
  const cleanQuery = rawQuery.trim();
  const { cleanSubject, keyTerms } = extractSearchTerms(cleanQuery);

  if (keyTerms.length === 0 && cleanSubject.length === 0) {
    return VERIFIED_DALIL_DATABASE.filter(item => {
      if (filter !== 'all' && item.type !== filter) return false;
      if (category !== 'Semua' && item.category !== category) return false;
      return true;
    });
  }

  const scored: { item: DalilItem; score: number }[] = [];

  for (const item of VERIFIED_DALIL_DATABASE) {
    if (filter !== 'all' && item.type !== filter) continue;
    if (category !== 'Semua' && item.category !== category) continue;

    const score = computeRelevanceScore(item, cleanQuery, cleanSubject, keyTerms);
    if (score >= 25) {
      scored.push({
        item: { ...item, _relevanceScore: score },
        score
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.item);
}
