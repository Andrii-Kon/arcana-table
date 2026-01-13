const fs = require('node:fs/promises');
const path = require('node:path');

const SOURCE_PATH = path.resolve(__dirname, '..', 'data', 'howlcode_cards.json');
const SCENE_PATH = path.resolve(__dirname, '..', 'data', 'tarotapi.json');
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
const SMALL_WORDS = new Set(['of', 'the', 'and']);
const titleizeSlug = (slug) =>
  slug
    .split('-')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

const titleizePhrase = (phrase) =>
  phrase
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

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
  'after',
  'against',
  'among',
  'across',
  'before',
  'behind',
  'beside',
  'between',
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
  'he',
  'her',
  'hers',
  'had',
  'has',
  'have',
  'him',
  'his',
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
  'me',
  'might',
  'mine',
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
  'ours',
  'over',
  'per',
  'shall',
  'should',
  'she',
  'so',
  'some',
  'such',
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
  'toward',
  'towards',
  'under',
  'upon',
  'us',
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
  'within',
  'with',
  'without',
  'would',
  'you',
  'your',
  'yours',
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
  'church',
  'churches',
  'countryman',
  'countrywoman',
  'dark',
  'fair',
  'direction',
  'directions',
  'help',
  'otherwise',
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
  'remain',
  'remains',
  'remaining',
  'shews',
  'shows',
  'side',
  'symbolise',
  'symbolised',
  'symbolises',
  'symbolize',
  'symbolizes',
  'view',
  'case',
  'tending',
  'unaltered',
  'species',
  'thing',
  'things',
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

const NEGATIVE_CUES = new Set([
  'adversity',
  'anxiety',
  'bad',
  'betrayal',
  'block',
  'blocks',
  'burden',
  'conflict',
  'corruption',
  'crisis',
  'cruelty',
  'danger',
  'deceit',
  'death',
  'delay',
  'destruction',
  'disappointment',
  'discord',
  'doubt',
  'embarrassment',
  'embarrassments',
  'end',
  'ending',
  'evil',
  'failure',
  'false',
  'fear',
  'guilt',
  'grief',
  'hostility',
  'illness',
  'indecision',
  'inertia',
  'instability',
  'jealousy',
  'lethargy',
  'loss',
  'losses',
  'misfortune',
  'mortality',
  'obstacle',
  'obstacles',
  'oppression',
  'pain',
  'perplexity',
  'petrifaction',
  'poverty',
  'privation',
  'regret',
  'risk',
  'ruin',
  'sadness',
  'sickness',
  'sleep',
  'somnambulism',
  'sorrow',
  'strife',
  'trouble',
  'war',
  'weakness',
  'wrath',
  'worry',
]);

const capitalizeWord = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const parseKeywordList = (text, maxItems = 3) => {
  if (!text) return [];
  const keywords = text
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((phrase) => titleizePhrase(phrase))
    .filter(Boolean);
  return Array.from(new Set(keywords)).slice(0, maxItems);
};

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
  const narrativePattern = /\b(he|she|his|her|him|you|your)\b/;

  for (const segment of segments) {
    let working = segment;
    let prioritizedSegment = false;
    const lower = segment.toLowerCase();

    if (narrativePattern.test(lower)) {
      continue;
    }

    for (const marker of markers) {
      const index = lower.indexOf(marker);
      if (index !== -1) {
        working = segment.slice(index + marker.length);
        prioritizedSegment = true;
        break;
      }
    }

    if (working.includes('--')) {
      working = working.split('--').pop();
      prioritizedSegment = true;
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

const SCENE_REJECT =
  /\b(card|reader|meaning|means|indicates|signifies|suggests|symbol|interpretation|traditional|corresponding|description|moral|principle|spiritual|analogy|desirable|election|occult|mystic|mystical|science|magic|explanation|explained|account|proposes|called|represents|representation|canon|criticism|doctrine|supernatural|destiny|spirit)\b|there is little to say|reader is referred/gi;
const SCENE_ACCEPT =
  /\b(figure|man|woman|youth|child|children|king|queen|knight|page|angel|horse|dog|lion|bird|cup|cups|sword|swords|pentacle|pentacles|wand|wands|staff|staves|throne|crown|river|sea|mountain|tower|castle|sun|moon|star|boat|ship|garden|forest|tree|door|gate|arch|path|road|pillars?|scales?|altar|goat|chains?|horns?|torch|wings?|bat)\b/gi;

const countMatches = (regex, text) => {
  regex.lastIndex = 0;
  const matches = text.match(regex);
  regex.lastIndex = 0;
  return matches ? matches.length : 0;
};

const SCENE_TRIM_MARKERS = [
  /\s+and\s+on\s+this\s+account\b/i,
  /\s+on\s+this\s+account\b/i,
  /\s+it\s+is\s+to\s+be\s+understood\b/i,
  /\s+compare\s+the\s+design\b/i,
  /\s+in\s+conclusion\b/i,
];

const trimSceneSentence = (sentence) => {
  let trimmed = sentence.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  trimmed = trimmed.replace(/\bHigh\s+P(?=[\s,;:.!?]|$)/g, 'High Priestess');
  trimmed = trimmed.replace(/^in\s+conclusion,\s*/i, '');
  trimmed = trimmed.replace(/^it\s+will\s+be\s+seen,?\s+however,?\s+that\s+/i, '');
  trimmed = trimmed.replace(/^it\s+will\s+be\s+seen\s+that\s+/i, '');
  if (trimmed.length > 180) {
    for (const marker of SCENE_TRIM_MARKERS) {
      const match = marker.exec(trimmed);
      if (match) {
        trimmed = trimmed.slice(0, match.index).trim();
        break;
      }
    }
  }
  trimmed = trimmed.replace(/[,:;\\-–—]+$/, '').trim();
  return sentenceize(trimmed);
};

const buildSceneSnippet = (text, maxSentences = 2) => {
  const sentences = splitSentences(text);
  const scored = sentences
    .map((sentence, index) => {
      const acceptCount = countMatches(SCENE_ACCEPT, sentence);
      if (!acceptCount) return null;
      const rejectCount = countMatches(SCENE_REJECT, sentence);
      return { sentence, index, score: acceptCount * 2 - rejectCount };
    })
    .filter(Boolean);
  if (scored.length) {
    const picked = scored
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map((item) => trimSceneSentence(item.sentence))
      .filter(Boolean);
    return picked.join(' ').trim().replace(/\bHigh\s+P\./g, 'High Priestess.');
  }
  return sentences
    .slice(0, maxSentences)
    .map((sentence) => trimSceneSentence(sentence))
    .filter(Boolean)
    .join(' ')
    .trim()
    .replace(/\bHigh\s+P\./g, 'High Priestess.');
};

const buildPredictionVariants = (text) => {
  const sentences = splitSentences(text);
  if (!sentences.length) return [];
  const variants = [];
  const firstSentence = sentenceize(sentences[0]);
  if (firstSentence) variants.push(firstSentence);
  if (sentences.length > 1) {
    const combined = sentenceize(`${sentences[0]} ${sentences[1]}`);
    if (combined) variants.push(combined);
  }
  return Array.from(new Set(variants)).slice(0, 2);
};

const buildDetailText = (fullMeaning, summary) => {
  const fullVariants = buildPredictionVariants(fullMeaning || '');
  if (!fullVariants.length) return '';
  if (summary) {
    const summaryVariant = buildPredictionVariants(summary)[0];
    if (summaryVariant && fullVariants[0] === summaryVariant && fullVariants[1]) {
      return fullVariants[1];
    }
  }
  return fullVariants[0];
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

const hasNegativeCue = (text) => {
  if (!text) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z\s-]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.some((token) => NEGATIVE_CUES.has(token));
};

const formatAdviceTheme = (keyword) => keyword.toLowerCase();

const buildAdvice = (keywords, orientation, meaningText) => {
  const safeThemes = (keywords || []).filter((keyword) => !hasNegativeCue(keyword));
  const theme = safeThemes.length ? formatAdviceTheme(safeThemes[0]) : '';
  const caution = !safeThemes.length && hasNegativeCue(meaningText);

  const withTheme = (templates) =>
    templates.map((template) => template.replace('{theme}', theme));

  const positiveTemplates = theme
    ? withTheme([
        'Choose one small step today that supports {theme}.',
        'Let {theme} guide one practical decision this week.',
        'Anchor {theme} with a simple, concrete action.',
        'Commit to a steady action that strengthens {theme}.',
      ])
    : [];

  const reversedTemplates = theme
    ? withTheme([
        'Rebalance {theme} by setting one clear boundary.',
        'Ground {theme} with one small, steady action.',
        'Bring {theme} back to basics with a simple next step.',
      ])
    : [];

  const neutralTemplates = [
    'Choose one small, concrete step and do it today.',
    'Pick the simplest next action and follow through.',
    'Name what matters most, then take one grounded step.',
  ];

  const cautionTemplates = [
    'Pause, simplify, and focus on what you can control.',
    'Create a boundary, then take one stabilizing step.',
    'Name the pressure you feel and soften it with one small action.',
  ];

  let pool = [];
  if (orientation === 'reversed') {
    pool = pool.concat(reversedTemplates, neutralTemplates);
  } else {
    pool = pool.concat(positiveTemplates, neutralTemplates);
  }
  if (caution) {
    pool = pool.concat(cautionTemplates);
  }

  const unique = Array.from(new Set(pool));
  return unique.length ? unique : ['Take one small, grounded step today.'];
};

const formatKeywordList = (keywords) => {
  if (!keywords.length) return '';
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  if (lowered.length === 1) return lowered[0];
  if (lowered.length === 2) return `${lowered[0]} and ${lowered[1]}`;
  return `${lowered.slice(0, -1).join(', ')}, and ${lowered[lowered.length - 1]}`;
};

const buildUprightMeanings = (summary, fullMeaning) => {
  const variants = buildPredictionVariants(summary || '');
  if (variants.length) return variants;
  return buildPredictionVariants(fullMeaning || '');
};

const buildReversedMeanings = (keywords) => {
  const list = formatKeywordList(keywords);
  if (!list) {
    return [
      'A blocked or delayed version of this energy.',
      'An inward or stalled expression of this card.',
      'A pause before the energy can flow freely.',
    ];
  }
  return [
    sentenceize(`A focus on ${list}, often bringing delay or block`),
    sentenceize(`Themes of ${list} surface with delay or block`),
    sentenceize(`Expect ${list} when momentum meets delay or block`),
  ];
};

const buildReversedPredictions = (summary, reversedFallback) => {
  const baseVariants = buildPredictionVariants(summary || '');
  if (baseVariants.length) {
    return baseVariants
      .map((variant) => {
        const trimmed = variant.replace(/[.!?]$/, '');
        return sentenceize(`Reversed, ${trimmed}`);
      })
      .slice(0, 3);
  }
  return reversedFallback.length ? reversedFallback : [];
};

const MINOR_RANKS = {
  ace: { number: 1, slug: 'ace' },
  two: { number: 2, slug: '2' },
  three: { number: 3, slug: '3' },
  four: { number: 4, slug: '4' },
  five: { number: 5, slug: '5' },
  six: { number: 6, slug: '6' },
  seven: { number: 7, slug: '7' },
  eight: { number: 8, slug: '8' },
  nine: { number: 9, slug: '9' },
  ten: { number: 10, slug: '10' },
  page: { number: 11, slug: 'page' },
  knight: { number: 12, slug: 'knight' },
  queen: { number: 13, slug: 'queen' },
  king: { number: 14, slug: 'king' },
};

const TEXT_OVERRIDES = {
  'two-of-swords': {
    summary:
      'Two of Swords points to a stand-off or a decision held in pause. You may be avoiding a direct conversation or delaying a choice while you wait for more clarity. Take time to gather missing information before you decide.',
    fullMeaning:
      'Two of Swords highlights a blocked decision and emotional guardedness. It suggests a need to pause, weigh both sides, and wait for clarity before acting.',
  },
  temperance: {
    fullMeaning:
      'Temperance emphasizes balance, patience, and integration. Blend opposites, avoid extremes, and move steadily toward harmony.',
  },
  justice: {
    summary:
      'Justice points to a fair decision or clear truth taking shape. Be precise, honest, and keep things documented.',
    fullMeaning:
      'Justice emphasizes accountability, truth, and measured decisions. Weigh the evidence, keep good records, and let fairness guide the outcome.',
  },
  'the-devil': {
    summary:
      'The Devil highlights a strong temptation or unhealthy attachment. Set boundaries and choose freedom over short-term comfort.',
    fullMeaning:
      'The Devil points to patterns of control or dependency. Naming them clearly helps loosen their hold so you can choose a steadier path.',
  },
};

const PREDICTION_OVERRIDES = {
  'nine-of-cups': {
    upright: ['These good times are a validation of your commitment; enjoy.'],
  },
};

const KEYWORD_OVERRIDES = {
  'the-devil': {
    upright: ['Attachment', 'Temptation', 'Bondage'],
  },
};

const SCENE_ALIASES = {
  judgement: 'the-last-judgment',
  judgment: 'the-last-judgment',
};

const SOFTEN_REPLACEMENTS = [
  [/addictive and self-?destructive behaviours?/gi, 'a strong temptation or an unhealthy attachment'],
  [/self-?destructive/gi, 'unhelpful'],
  [/addictive/gi, 'tempting'],
  [/shameful/gi, 'uncomfortable'],
  [/you’re not doing much to properly address/gi, 'you may be avoiding a direct conversation or delaying a decision'],
  [/you're not doing much to properly address/gi, 'you may be avoiding a direct conversation or delaying a decision'],
];

const softenText = (text) => {
  const hadSubject = /\bSubject\b/i.test(text);
  let result = text.replace(/\s+/g, ' ').trim();
  if (!result) return '';
  result = result.replace(/\bThe Subject is\b/gi, 'You are');
  result = result.replace(/\bThe Subject was\b/gi, 'You were');
  result = result.replace(/\bThe Subject has\b/gi, 'You have');
  result = result.replace(/\bThe Subject may\b/gi, 'You may');
  result = result.replace(/\bThe Subject should\b/gi, 'You should');
  result = result.replace(/\bThe Subject will\b/gi, 'You may');
  result = result.replace(/\bThe Subject\b/gi, 'You');
  result = result.replace(/\bSubject is\b/g, 'you are');
  result = result.replace(/\bSubject was\b/g, 'you were');
  result = result.replace(/\bSubject has\b/g, 'you have');
  result = result.replace(/\bSubject may\b/g, 'you may');
  result = result.replace(/\bSubject should\b/g, 'you should');
  result = result.replace(/\bSubject will\b/g, 'you may');
  result = result.replace(/\bSubject\b/g, 'you');
  if (hadSubject) {
    result = result.replace(/(^|[.!?]\s+)(They|Their|Them|Theirs|Themselves)\b/g, (match, lead, pronoun) => {
      const mapped = {
        They: 'You',
        Their: 'Your',
        Them: 'You',
        Theirs: 'Yours',
        Themselves: 'Yourself',
      }[pronoun];
      return mapped ? `${lead}${mapped}` : match;
    });
    result = result.replace(/(^|[.!?]\s+)(they|their|them|theirs|themselves)\b/g, (match, lead, pronoun) => {
      const mapped = {
        they: 'you',
        their: 'your',
        them: 'you',
        theirs: 'yours',
        themselves: 'yourself',
      }[pronoun];
      return mapped ? `${lead}${mapped}` : match;
    });
    result = result.replace(
      /(\byou\b[^.?!]{0,220})\bwhat they want\b/gi,
      '$1what you want'
    );
    result = result.replace(
      /(\byou\b[^.?!]{0,220})\bthey have\b/gi,
      '$1you have'
    );
    result = result.replace(
      /(\byou\b[^.?!]{0,220})\bthey are\b/gi,
      '$1you are'
    );
    result = result.replace(
      /(\byou\b[^.?!]{0,220})\bthey['\u2019]re\b/gi,
      '$1you’re'
    );
    result = result.replace(/(\byou\b[^.?!]{0,220})\btheir\b/gi, '$1your');
    result = result.replace(/\band they['\u2019]re\b/gi, 'and you’re');
    result = result.replace(/\band they are\b/gi, 'and you are');
    result = result.replace(/\bhow they['\u2019]ll\b/gi, 'how you’ll');
    result = result.replace(/\bhow they will\b/gi, 'how you will');
  }
  const replaceThirdPerson = (value) => {
    let updated = value;
    updated = updated.replace(/\bthey['\u2019]re\b/gi, 'you are');
    updated = updated.replace(/\bthey are\b/gi, 'you are');
    updated = updated.replace(/\bthey were\b/gi, 'you were');
    updated = updated.replace(/\bthey have\b/gi, 'you have');
    updated = updated.replace(/\bthey need to\b/gi, 'you need to');
    updated = updated.replace(/\bthey need\b/gi, 'you need');
    updated = updated.replace(/\bthemselves\b/gi, 'yourself');
    updated = updated.replace(/\btheirs\b/gi, 'yours');
    updated = updated.replace(/\btheir\b/gi, 'your');
    updated = updated.replace(/\bthem\b/gi, 'you');
    updated = updated.replace(/\bthey\b/gi, 'you');
    updated = updated.replace(/\byour lives\b/gi, 'your life');
    return updated;
  };
  const sentences = splitSentences(result);
  if (sentences.length) {
    result = sentences
      .map((sentence) => {
        if (!/\b(you|your|yours|yourself|yourselves)\b/i.test(sentence)) {
          return sentence;
        }
        return replaceThirdPerson(sentence);
      })
      .join(' ');
  }
  if (/\b(you|your|yours|yourself|yourselves)\b/i.test(result) && /\b(they|their|them|theirs|themselves)\b/i.test(result)) {
    result = replaceThirdPerson(result);
  }
  result = result.replace(/\bYou['\u2019]s\b/g, 'Your');
  result = result.replace(/\byou['\u2019]s\b/g, 'your');
  result = result.replace(/\bThe Reader\b/gi, 'You');
  result = result.replace(/\bReader\b/gi, 'you');
  for (const [pattern, replacement] of SOFTEN_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\bYou seek\b/gi, 'You may be seeking');
  result = result.replace(/\bYou want\b/gi, 'You may want');
  result = result.replace(/\bYou need to\b/gi, 'You may need to');
  result = result.replace(/\bYou need\b/gi, 'You may need');
  result = result.replace(/\bYou should be feeling\b/gi, 'You may be feeling');
  result = result.replace(/\bYou should feel\b/gi, 'You may feel');
  result = result.replace(/\bYou should\b/gi, 'It may help to');
  result = result.replace(/\bYou must\b/gi, 'You may need to');
  result = result.replace(/\bYou will\b/gi, 'You may');
  result = result.replace(/\bYou are\b/gi, 'You may be');
  result = result.replace(/\bYou['\u2019]re\b/gi, 'You may be');
  result = result.replace(/\bDon['\u2019]t\b/gi, 'Try not to');
  result = result.replace(/\bDo not\b/gi, 'Try not to');
  result = result.replace(/\bThis card indicates\b/gi, 'This card suggests');
  result = result.replace(/\bThis card points to\b/gi, 'This card may point to');
  result = result.replace(/\bThis card shows\b/gi, 'This card suggests');
  result = result.replace(/\bThis is a time to\b/gi, 'This can be a time to');
  result = result.replace(/\bThis is likely to be\b/gi, 'This may be');
  result = result.replace(/\bIt is time to\b/gi, 'It may be time to');
  result = result.replace(/\blong term\b/gi, 'long-term');
  result = result.replace(/\bYou is\b/gi, 'You may be');
  result = result.replace(/\bYou isn['\u2019]t\b/gi, 'You may not be');
  result = result.replace(/\bYou aren['\u2019]t\b/gi, 'You may not be');
  result = result.replace(/\bYou was\b/gi, 'You were');
  result = result.replace(/\bYou has\b/gi, 'You have');
  result = result.replace(/\bYou does\b/gi, 'You do');
  result = result.replace(/\bYou needs\b/gi, 'You need');
  result = result.replace(/\bYou wants\b/gi, 'You want');
  result = result.replace(/\bYou feels\b/gi, 'You feel');
  result = result.replace(/\bYou thinks\b/gi, 'You think');
  result = result.replace(
    /\bshows you ([^.?!]{0,160})\band feel\b/gi,
    'shows you $1and feeling'
  );
  result = result.replace(/\bthem selves\b/gi, 'yourselves');
  result = result.replace(/\bthem self\b/gi, 'yourself');
  result = result.replace(/\bthemself\b/gi, 'yourself');
  result = result.replace(/([a-z0-9,;:])\s+You\b/g, '$1 you');
  result = result.replace(/([a-z0-9,;:])\s+Your\b/g, '$1 your');
  return result;
};

const normalizeLeadPhrases = (text, cardTitle) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  let result = trimmed;
  result = result.replace(
    /^(this)\s+(knight|king|queen|page)\s+(represents)\b/i,
    `The ${cardTitle} $3`
  );
  result = result.replace(/^this\s+ace\s+(represents)\b/i, `The ${cardTitle} $1`);
  result = result.replace(/^this\s+card\b/i, `The ${cardTitle}`);
  result = result.replace(/^all\s+the\s+fives\s+represent\b/i, `The ${cardTitle} represents`);
  return result;
};

const MAJOR_BY_SLUG = {
  'the-fool': 0,
  'the-magician': 1,
  'the-high-priestess': 2,
  'the-empress': 3,
  'the-emperor': 4,
  'the-hierophant': 5,
  'the-lovers': 6,
  'the-chariot': 7,
  strength: 8,
  'the-hermit': 9,
  'wheel-of-fortune': 10,
  justice: 11,
  'the-hanged-man': 12,
  death: 13,
  temperance: 14,
  'the-devil': 15,
  'the-tower': 16,
  'the-star': 17,
  'the-moon': 18,
  'the-sun': 19,
  judgement: 20,
  'the-world': 21,
};

const MAJOR_IMAGE_OVERRIDES = {
  judgement: 'major-20-judgement.jpg',
};

const buildCard = (card, sceneLookup) => {
  const slug = card.name;
  const override = TEXT_OVERRIDES[slug] || {};
  const title = titleizeSlug(slug);
  const summaryText = softenText(normalizeLeadPhrases(override.summary || card.summary || '', title));
  const fullMeaningText = softenText(
    normalizeLeadPhrases(override.fullMeaning || card.full_meaning || '', title)
  );
  const sceneKey = SCENE_ALIASES[slug] || slug;
  const scene = buildSceneSnippet(sceneLookup.get(sceneKey) || '');
  const keywordOverride = KEYWORD_OVERRIDES[slug] || {};
  const uprightKeywords = keywordOverride.upright || parseKeywordList(card.upright);
  const reversedKeywords = keywordOverride.reversed || parseKeywordList(card.reversed);
  const summaryVariants = buildPredictionVariants(summaryText || '');
  const uprightMeanings = summaryVariants.length
    ? summaryVariants
    : buildUprightMeanings(summaryText, fullMeaningText);
  const reversedMeanings = buildReversedMeanings(reversedKeywords);
  const uprightFull = fullMeaningText || summaryText;
  const detail = buildDetailText(uprightFull, summaryText);
  const reversedFull = reversedMeanings[0] || 'A blocked or delayed version of this energy.';
  const fullVariants = buildPredictionVariants(fullMeaningText || '');
  const filteredFullVariants = fullVariants.filter((variant) => !summaryVariants.includes(variant));
  const uprightPredictions = filteredFullVariants.length
    ? filteredFullVariants
    : detail && !summaryVariants.includes(detail)
      ? [detail]
      : [];
  const reversedPredictions = buildReversedPredictions(summaryText, reversedMeanings);
  const predictionOverride = PREDICTION_OVERRIDES[slug] || {};
  const uprightPredictionFinal = predictionOverride.upright
    ? predictionOverride.upright.map((entry) => sentenceize(entry))
    : uprightPredictions;
  const reversedPredictionFinal = predictionOverride.reversed
    ? predictionOverride.reversed.map((entry) => sentenceize(entry))
    : reversedPredictions;
  const uprightAdvice = buildAdvice(uprightKeywords, 'upright', uprightFull);
  const reversedAdvice = buildAdvice(reversedKeywords, 'reversed', reversedFull);

  const upright = {
    keywords: uprightKeywords.join(', '),
    keywordsList: uprightKeywords,
    meanings: uprightMeanings.length ? uprightMeanings : [sentenceize(uprightFull)],
    personalized_interpretation: uprightPredictionFinal.length
      ? uprightPredictionFinal
      : uprightFull
        ? [sentenceize(uprightFull)]
        : [],
    advice: uprightAdvice,
    full: uprightFull,
  };

  const reversed = {
    keywords: reversedKeywords.join(', '),
    keywordsList: reversedKeywords,
    meanings: reversedMeanings,
    personalized_interpretation: reversedPredictionFinal.length
      ? reversedPredictionFinal
      : reversedMeanings,
    advice: reversedAdvice,
    full: reversedFull,
  };

  const majorNumber = MAJOR_BY_SLUG[slug];
  if (majorNumber !== undefined) {
    const overrideImage = MAJOR_IMAGE_OVERRIDES[slug];
    return {
      id: `major-${pad2(majorNumber)}`,
      arcana: 'major',
      name: title,
      suit: null,
      rank: majorNumber,
      upright,
      reversed,
      scene,
      detail,
      image: overrideImage
        ? `assets/cards_webp/${overrideImage.replace(/\.jpg$/i, '.webp')}`
        : `assets/cards_webp/major-${pad2(majorNumber)}-${slug}.webp`,
    };
  }

  const [rankKey, suit] = slug.split('-of-');
  const rankMeta = MINOR_RANKS[rankKey];
  if (!rankMeta || !suit) {
    throw new Error(`Unknown minor arcana slug: ${slug}`);
  }
  return {
    id: `${suit}-${pad2(rankMeta.number)}`,
    arcana: 'minor',
    name: title,
    suit,
    rank: rankMeta.number,
    upright,
    reversed,
    scene,
    detail,
    image: `assets/cards_webp/${suit}-${pad2(rankMeta.number)}-${rankMeta.slug}.webp`,
  };
};

async function main() {
  const [raw, sceneRaw] = await Promise.all([
    fs.readFile(SOURCE_PATH, 'utf8'),
    fs.readFile(SCENE_PATH, 'utf8'),
  ]);
  const data = JSON.parse(raw);
  const sceneData = JSON.parse(sceneRaw);
  const sceneLookup = new Map(
    (sceneData.cards || []).map((card) => [slugify(card.name), card.desc || ''])
  );
  const cards = data.map((card) => buildCard(card, sceneLookup));

  const output = `(() => {\n  window.TAROT_CARDS = ${JSON.stringify(cards, null, 2)};\n})();\n`;
  await fs.writeFile(OUTPUT_PATH, output);
  console.log(`Wrote ${cards.length} cards to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
