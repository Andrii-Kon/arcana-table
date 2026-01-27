const fs = require('node:fs/promises');
const path = require('node:path');

const SOURCE_PATH = path.resolve(__dirname, '..', 'data', 'tarotapi.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'cards.js');

const pad2 = (value) => String(value).padStart(2, '0');
const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const sentenceize = (text) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if (/[.!?]$/.test(capitalized)) return capitalized;
  return `${capitalized}.`;
};

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

const STOP_WORDS = new Set([
  'a',
  'an',
  'all',
  'and',
  'any',
  'are',
  'as',
  'at',
  'both',
  'be',
  'been',
  'being',
  'but',
  'by',
  'each',
  'can',
  'could',
  'did',
  'do',
  'does',
  'either',
  'every',
  'for',
  'from',
  'had',
  'has',
  'have',
  'here',
  'how',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'many',
  'may',
  'more',
  'most',
  'much',
  'might',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'on',
  'only',
  'other',
  'or',
  'our',
  'over',
  'per',
  'shall',
  'should',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'under',
  'upon',
  'via',
  'very',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'with',
  'without',
  'would',
  'yet',
]);

const NOISE_WORDS = new Set([
  'card',
  'cards',
  'account',
  'accounts',
  'concerning',
  'connected',
  'certain',
  'querent',
  'person',
  'people',
  'man',
  'woman',
  'male',
  'female',
  'child',
  'children',
  'young',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'matter',
  'matters',
  'meaning',
  'meanings',
  'species',
  'surface',
  'position',
  'positions',
  'plane',
  'further',
  'however',
  'another',
  'others',
  'other',
  'same',
  'also',
  'again',
  'still',
  'even',
]);

const capitalizeWord = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const normalizeKeyword = (phrase) => {
  const cleaned = phrase
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  const tokens = cleaned.split(' ').filter(Boolean);
  const filtered = tokens.filter(
    (token) => !STOP_WORDS.has(token) && !NOISE_WORDS.has(token)
  );
  if (!filtered.length) return null;
  const sliced = filtered.length > 2 ? filtered.slice(-2) : filtered;
  const candidate = sliced.join(' ');
  if (candidate.length < 3) return null;
  return candidate
    .split(' ')
    .map((word) => capitalizeWord(word))
    .join(' ');
};

const extractListCandidates = (text) => {
  const segments = text
    .replace(/\s+/g, ' ')
    .split(/[.;]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const prioritized = [];
  const fallback = [];
  const markers = ['signifies', 'means', 'denotes', 'indicates', 'implies'];

  for (const segment of segments) {
    let working = segment;
    let prioritizedSegment = false;
    const lower = segment.toLowerCase();

    if (segment.includes('--')) {
      working = segment.split('--').pop();
      prioritizedSegment = true;
    }

    for (const marker of markers) {
      const index = lower.indexOf(marker);
      if (index !== -1) {
        working = segment.slice(index + marker.length);
        prioritizedSegment = true;
        break;
      }
    }

    const parts = working
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (prioritizedSegment) {
      prioritized.push(...parts);
    } else {
      fallback.push(...parts);
    }
  }

  return { prioritized, fallback };
};

const splitSentences = (text) => {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
  if (!cleaned) return [];
  const matches = cleaned.match(/[^.!?]+[.!?]+/g);
  if (matches) {
    return matches.map((sentence) => sentence.trim());
  }
  return [cleaned];
};

const buildSceneSnippet = (text, maxSentences = 2) => {
  const sentences = splitSentences(text);
  return sentences.slice(0, maxSentences).join(' ');
};

const splitSegments = (text) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.includes(';')) {
    return cleaned.split(';').map((part) => part.trim()).filter(Boolean);
  }
  if (cleaned.includes('.')) {
    return cleaned.split('.').map((part) => part.trim()).filter(Boolean);
  }
  return [cleaned];
};

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const clampWords = (text, maxWords, withEllipsis = true) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  const clipped = words.slice(0, maxWords).join(' ');
  return withEllipsis ? `${clipped}...` : clipped;
};

const buildKeywordList = (text, maxItems = 3) => {
  const cleaned = text.replace(/\s+/g, ' ').replace(/[.]/g, '').trim();
  if (!cleaned) return [];
  const { prioritized, fallback } = extractListCandidates(cleaned);
  const segments = [...prioritized, ...fallback];
  const keywords = [];
  for (const segment of segments) {
    const candidate = normalizeKeyword(segment);
    if (!candidate) continue;
    if (!keywords.includes(candidate)) {
      keywords.push(candidate);
    }
    if (keywords.length >= maxItems) break;
  }
  if (keywords.length < maxItems) {
    const tokens = cleaned
      .toLowerCase()
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    for (const token of tokens) {
      if (STOP_WORDS.has(token) || NOISE_WORDS.has(token)) continue;
      const candidate = capitalizeWord(token);
      if (!keywords.includes(candidate)) {
        keywords.push(candidate);
      }
      if (keywords.length >= maxItems) break;
    }
  }
  return keywords.slice(0, maxItems);
};

const buildShortVariants = (text, minWords, maxWords) => {
  const segments = splitSegments(text);
  const variants = [];
  for (let i = 0; i < segments.length && variants.length < 3; i += 1) {
    let combined = segments[i];
    if (wordCount(combined) < minWords && segments[i + 1]) {
      combined = `${combined}; ${segments[i + 1]}`;
    }
    const trimmed = clampWords(combined, maxWords);
    const finalized = sentenceize(trimmed);
    if (finalized) variants.push(finalized);
  }
  if (!variants.length && text.trim()) {
    variants.push(sentenceize(clampWords(text, maxWords)));
  }
  return Array.from(new Set(variants)).slice(0, 3);
};

const cleanPredictionBase = (text) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();
  if (/^(it|this|there)\s+(is|are|was|were|has|have|had)\b/.test(lower)) return '';
  if (/^(on|for|who|where|when|while)\b/.test(lower)) return '';
  return cleaned;
};

const buildPredictionsFromShort = (shortText, keywords) => {
  const base = cleanPredictionBase(clampWords(shortText.replace(/[.!?]+$/, ''), 12, false));
  const baseLower = base ? lowerFirst(base) : '';
  const [first, second, third] = keywords.map((keyword) => keyword.toLowerCase());
  const templates = [
    first ? `Lean into ${first} and steady ${second || 'your focus'}.` : null,
    first ? `Let ${first} set the tone for what comes next.` : null,
    second ? `Keep ${second} close as you choose your next move.` : null,
    third ? `Give ${third} room to unfold without forcing outcomes.` : null,
    baseLower ? `This points toward ${baseLower}.` : null,
    baseLower ? `Expect ${baseLower} to color the next step.` : null,
  ].filter(Boolean);
  return templates.length ? templates : [sentenceize(base)];
};

const rankLabel = (valueInt) => {
  if (valueInt === 1) return 'Ace';
  if (valueInt === 11) return 'Page';
  if (valueInt === 12) return 'Knight';
  if (valueInt === 13) return 'Queen';
  if (valueInt === 14) return 'King';
  return String(valueInt);
};

const imageSlugForRank = (valueInt) => {
  if (valueInt >= 2 && valueInt <= 10) {
    return String(valueInt);
  }
  return slugify(rankLabel(valueInt));
};

const buildCard = (card) => {
  const uprightMeanings = buildShortVariants(card.meaning_up, 10, 18);
  const reversedMeanings = buildShortVariants(card.meaning_rev, 10, 18);

  const uprightKeywords = buildKeywordList(card.meaning_up);
  const reversedKeywords = buildKeywordList(card.meaning_rev);
  const scene = buildSceneSnippet(card.desc || '');

  const upright = {
    keywords: uprightMeanings.length ? uprightMeanings[0].replace(/\.$/, '') : '',
    keywordsList: uprightKeywords,
    meanings: uprightMeanings.length ? uprightMeanings : [sentenceize(card.meaning_up)],
    predictions: buildPredictionsFromShort(
      uprightMeanings[0] || sentenceize(card.meaning_up),
      uprightKeywords
    ),
    full: card.meaning_up,
  };

  const reversed = {
    keywords: reversedMeanings.length ? reversedMeanings[0].replace(/\.$/, '') : '',
    keywordsList: reversedKeywords,
    meanings: reversedMeanings.length ? reversedMeanings : [sentenceize(card.meaning_rev)],
    predictions: buildPredictionsFromShort(
      reversedMeanings[0] || sentenceize(card.meaning_rev),
      reversedKeywords
    ),
    full: card.meaning_rev,
  };

  if (card.type === 'major') {
    return {
      id: `major-${pad2(card.value_int)}`,
      arcana: 'major',
      name: card.name,
      suit: null,
      rank: card.value_int,
      upright,
      reversed,
      scene,
      image: `assets/cards/major-${pad2(card.value_int)}-${slugify(card.name)}.jpg`,
    };
  }

  const imageSlug = imageSlugForRank(card.value_int);
  return {
    id: `${card.suit}-${pad2(card.value_int)}`,
    arcana: 'minor',
    name: card.name,
    suit: card.suit,
    rank: card.value_int,
    upright,
    reversed,
    scene,
    image: `assets/cards/${card.suit}-${pad2(card.value_int)}-${imageSlug}.jpg`,
  };
};

async function main() {
  const raw = await fs.readFile(SOURCE_PATH, 'utf8');
  const data = JSON.parse(raw);
  const cards = data.cards.map(buildCard);

  const output = `(() => {\n  window.TAROT_CARDS = ${JSON.stringify(cards, null, 2)};\n})();\n`;
  await fs.writeFile(OUTPUT_PATH, output);
  console.log(`Wrote ${cards.length} cards to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});