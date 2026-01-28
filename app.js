const isAuthRoute = ['/auth', '/forget-password', '/reset-password'].some((route) =>
  window.location.pathname.startsWith(route)
);

if (isAuthRoute) {
  fetch('/auth', { credentials: 'same-origin' })
    .then((response) => response.text())
    .then((html) => {
      document.open();
      document.write(html);
      document.close();
    });
} else {
  const SPREADS = {
  three: {
    id: 'three',
    name: 'Past / Present / Future',
    description: 'A quick read of your past, present, and future energy.',
    layout: 'three',
    positions: [
      { label: 'Past', detail: 'What shaped this moment.' },
      { label: 'Present', detail: 'Where you stand now.' },
      { label: 'Future', detail: 'What is gathering ahead.' },
    ],
  },
  // life: {
  //   id: 'life',
  //   name: 'Love / Career / Finance',
  //   description: 'A practical check-in on love, career, and money.',
  //   layout: 'three',
  //   positions: [
  //     { label: 'Love', detail: 'Matters of the heart.' },
  //     { label: 'Career', detail: 'Work, purpose, and momentum.' },
  //     { label: 'Finance', detail: 'Money flow and material stability.' },
  //   ],
  // },
  horseshoe: {
    id: 'horseshoe',
    name: 'Horseshoe',
    description: 'A seven-card arc that traces momentum and obstacles.',
    layout: 'horseshoe',
    positions: [
      { label: 'Past', detail: 'The roots of the situation.', offset: -18 },
      { label: 'Present', detail: 'The current energy.', offset: -12 },
      { label: 'Hidden', detail: 'What is unseen or unconscious.', offset: -4 },
      { label: 'Obstacles', detail: 'The tension to navigate.', offset: 6 },
      { label: 'External', detail: 'Influences around you.', offset: -4 },
      { label: 'Advice', detail: 'The best approach right now.', offset: -12 },
      { label: 'Outcome', detail: 'Where the path may lead.', offset: -18 },
    ],
  },
  celtic: {
    id: 'celtic',
    name: 'Celtic Cross',
    description: 'A ten-card classic for deeper insight and layered themes.',
    layout: 'celtic',
    positions: [
      { label: 'Present', detail: 'Situation at the center.', area: 'pos1' },
      { label: 'Crossing', detail: 'The challenge crossing you.', area: 'pos2' },
      { label: 'Conscious', detail: 'Crown or current focus.', area: 'pos3' },
      { label: 'Subconscious', detail: 'Foundation below.', area: 'pos4' },
      { label: 'Past', detail: 'What is leaving or behind.', area: 'pos5' },
      { label: 'Near Future', detail: 'What approaches next.', area: 'pos6' },
      { label: 'Self', detail: 'Where you are right now.', area: 'pos7' },
      { label: 'Environment', detail: 'External influences.', area: 'pos8' },
      { label: 'Hopes & Fears', detail: 'Inner tensions and wishes.', area: 'pos9' },
      { label: 'Outcome', detail: 'The likely resolution.', area: 'pos10' },
    ],
  },
};

const deckEl = document.getElementById('deck');
const deckHintEl = document.getElementById('deck-hint');
const tableEl = document.querySelector('.table');
const slotsEl = document.getElementById('slots');
const readingEl = document.getElementById('reading');
const readingGridEl = document.getElementById('reading-grid');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const beginBtn = document.getElementById('begin');
const revealAllBtn = document.getElementById('reveal-all');
const spreadDescEl = document.getElementById('spread-desc');
const spreadButtons = Array.from(document.querySelectorAll('[data-spread]'));
let currentSpread = SPREADS.three;
let slots = [];
let deck = [];
let drawn = [];
const allowReversed = false;
let hasDealt = false;
let isDealing = false;

const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const sentenceize = (text) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
};

const slugifyPosition = (label) =>
  String(label || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const getPersonalizedInterpretation = (positionLabel, cardName) => {
  const key = slugifyPosition(positionLabel);
  const byPos = window.PERSONALIZED_INTERPRETATIONS?.[key];
  if (!byPos) return '';

  if (byPos[cardName]) return byPos[cardName];
  const withoutThe = cardName.replace(/^the\s+/i, '');
  if (withoutThe !== cardName && byPos[withoutThe]) return byPos[withoutThe];

  const target = cardName.toLowerCase();
  const foundKey = Object.keys(byPos).find((k) => k.toLowerCase() === target);
  if (foundKey) return byPos[foundKey];

  const targetWithoutThe = withoutThe.toLowerCase();
  const foundKey2 = Object.keys(byPos).find((k) => k.toLowerCase() === targetWithoutThe);
  if (foundKey2) return byPos[foundKey2];

  return '';
};

const lowerFirst = (text) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : '');

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

const hasNegativeCue = (text) => {
  if (!text) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z\s-]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.some((token) => NEGATIVE_CUES.has(token));
};

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const parseKeywords = (text, maxItems = 3) => {
  if (!text) return [];
  const cleaned = text.replace(/\s+/g, ' ').replace(/[.]/g, '').trim();
  if (!cleaned) return [];
  const narrativePattern = /\b(he|she|his|her|him|you|your)\b/;
  const segments = cleaned
    .split(/[.;]/)
    .flatMap((segment) => segment.split(','))
    .map((segment) => segment.trim())
    .filter(Boolean);
  const keywords = [];
  for (const segment of segments) {
    if (narrativePattern.test(segment.toLowerCase())) continue;
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
      const candidate = token.charAt(0).toUpperCase() + token.slice(1);
      if (!keywords.includes(candidate)) {
        keywords.push(candidate);
      }
      if (keywords.length >= maxItems) break;
    }
  }
  return keywords.slice(0, maxItems);
};

const getKeywords = (interpretation) => {
  if (Array.isArray(interpretation.keywordsList) && interpretation.keywordsList.length) {
    return interpretation.keywordsList;
  }
  return parseKeywords(interpretation.keywords, 3);
};

const normalizeMeaningLead = (text) => {
  let cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  cleaned = cleaned.replace(/^also\s+/i, '');
  cleaned = cleaned.replace(/^it is a card of\s+/i, '');
  cleaned = cleaned.replace(/^it is\s+/i, '');
  cleaned = cleaned.replace(/^they are\s+/i, '');
  cleaned = cleaned.replace(/^(he|she) is\s+/i, '');
  cleaned = cleaned.replace(/^(it|this|there)\s+(signifies|indicates|suggests|denotes|means)\s+/i, '');
  cleaned = cleaned.replace(/^the card\s+(signifies|indicates|suggests|denotes|means)\s+/i, '');
  cleaned = cleaned.replace(/^the card\s+/i, '');
  cleaned = cleaned.replace(/^a card of\s+/i, '');
  const prefixPatterns = [
    /^(for once)\s+/i,
    /^(for|on|in|with|without|from|toward|towards|against|under|over)\s+/i,
    /^(almost|once)\s+/i,
  ];
  let trimmed = cleaned;
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const pattern of prefixPatterns) {
      if (pattern.test(trimmed)) {
        trimmed = trimmed.replace(pattern, '');
        stripped = true;
      }
    }
  }
  cleaned = trimmed.trim();
  return cleaned.trim();
};

const formatKeywordList = (keywords) => {
  if (!keywords.length) return '';
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  if (lowered.length === 1) return lowered[0];
  if (lowered.length === 2) return `${lowered[0]} and ${lowered[1]}`;
  return `${lowered.slice(0, -1).join(', ')}, and ${lowered[lowered.length - 1]}`;
};

const formatKeywordsForDisplay = (keywords, mode) => {
  if (mode !== 'shadow') return keywords;
  return keywords.map((keyword) =>
    hasNegativeCue(keyword) ? keyword : `Blocked ${keyword}`
  );
};

const buildReversedShadowNarrative = (card, positionLabel, keywords) => {
  const list = formatKeywordList(keywords);
  if (list) {
    return `${card.name} points to an imbalance around ${list}.`;
  }
  return `${card.name} signals an inward or blocked energy.`;
};

const buildAdviceForReading = (keywords, orientation, meaningText) => {
  const safeThemes = (keywords || []).filter((keyword) => !hasNegativeCue(keyword));
  const theme = safeThemes.length ? lowerFirst(safeThemes[0]) : '';
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
  return unique.length ? pickRandom(unique) : 'Take one small, grounded step today.';
};

const normalizeInlineSecondPerson = (text) =>
  text
    .replace(/\bYou['\u2019]s\b/g, 'your')
    .replace(/\bYour\b/g, 'your')
    .replace(/\bYou\b/g, 'you');

const normalizeSentenceSecondPerson = (text) =>
  text
    .replace(/\bYou['\u2019]s\b/g, 'your')
    .replace(
      /\b(by|to|for|with|from|of|about|against|into|over|under|upon|around|between)\s+You\b/g,
      (_, preposition) => `${preposition} you`
    );

const getPositionLead = (label) => {
  const key = (label || '').toLowerCase().trim();
  const map = new Map([
    ['past', 'In your past, '],
    ['present', 'Right now, '],
    ['future', 'Ahead, '],
    ['near future', 'In the near future, '],
    ['outcome', 'If the current path continues, '],
    ['conscious', 'On your mind, '],
    ['subconscious', 'Under the surface, '],
    ['crown', 'At the top of your mind, '],
    ['foundation', 'At the root of this, '],
    ['crossing', 'What is crossing you is that '],
    ['self', 'How you are showing up is that '],
    ['environment', 'Around you, '],
    ['hopes & fears', 'In your hopes and fears, '],
    ['advice', 'Your next best move is to notice that '],
    ['hidden', 'What is hidden is that '],
    ['obstacles', 'The obstacle here is that '],
    ['external', 'From outside influences, '],
    ['love', 'In love, '],
    ['career', 'In career matters, '],
    ['finance', 'With money and resources, '],
  ]);
  if (map.has(key)) return map.get(key);
  return key ? `In the ${key} position, ` : 'In this position, ';
};

const buildPositionAwareInterpretation = (
  card,
  positionLabel,
  orientation,
  meaningText,
  keywords,
  actionHint
) => {
  const lead = getPositionLead(positionLabel);
  const sentence = sentenceize(meaningText);
  const normalized = normalizeMeaningLead(sentence) || sentence;
  const softened = normalizeSentenceSecondPerson(normalized);
  const summary = normalizeInlineSecondPerson(lowerFirst(softened));

  // Ensure we get a grammatical continuation after leads like "is that ..."
  const lens = `${lead}${ensureClauseLead(summary)}`;

  const chosenAction =
    actionHint && String(actionHint).trim()
      ? String(actionHint).trim()
      : buildAdviceForReading(keywords, orientation, meaningText);
  const actionSentence = sentenceize(normalizeSentenceSecondPerson(chosenAction));

  return `${lens} ${actionSentence}`;
};

const ensureClauseLead = (text) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  if (/^(that|whether|if)\b/i.test(trimmed)) return trimmed;
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() || '';
  const needsThat = new Set([
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'has',
    'have',
    'had',
    'can',
    'could',
    'should',
    'would',
    'may',
    'might',
    'must',
    'will',
    'you',
    'do',
    'does',
    'did',
  ]);
  if (needsThat.has(firstWord)) return `that ${trimmed}`;
  return trimmed;
};

const stripDuplicateCardLead = (text, cardName) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const name = cardName.replace(/\s+/g, ' ').trim();
  if (!name) return trimmed;

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const allowLeadingThe = /^the\s+/i.test(name) ? '' : '(?:the\\s+)?';
  const pattern = new RegExp(
    `^${allowLeadingThe}${escaped}(?=\\b|\\s|[,:;.!?\\-–—])\\s*`,
    'i'
  );
  const withoutName = trimmed.replace(pattern, '');
  if (withoutName !== trimmed) {
    return withoutName.replace(/^[,.:;!?\\-–—]+\\s*/, '');
  }
  return trimmed;
};

const capitalizeFirst = (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const buildIntroText = (card, positionLabel, meaningText, keywords) => {
  const sentence = sentenceize(meaningText);
  if (!sentence) return '';
  const normalized = normalizeMeaningLead(sentence);
  const withoutLead = stripDuplicateCardLead(normalized || sentence, card.name);
  const softened = normalizeSentenceSecondPerson(withoutLead);
  const summary = normalizeInlineSecondPerson(softened);
  // Meaning should be position-independent; avoid injecting "in the past position..." phrasing.
  // Keep the original meaning's intent, lightly cleaned for readability.
  const cleaned = sentenceize(summary);
  return capitalizeFirst(cleaned);
};

const setStatus = (message) => {
  statusEl.textContent = message;
};

const updateRevealAllState = () => {
  if (!revealAllBtn) return;
  revealAllBtn.hidden = !hasDealt || isDealing;
  revealAllBtn.disabled = isDealing;
};

const revealAll = () => {
  if (!hasDealt || isDealing) return;
  // Reveal in spread order so status and final reading appear naturally.
  slots.forEach((slot) => revealSlot(slot));
};

const fitCelticToViewport = () => {
  if (!tableEl) return;
  if (currentSpread.layout !== 'celtic') return;

  // On roomy desktop viewports, keep the CSS-driven size (bigger cards).
  // Auto-fitting is mainly needed for smaller heights (laptops/tablets/mobile).
  if (window.matchMedia('(min-width: 1100px) and (min-height: 820px)').matches) {
    tableEl.style.removeProperty('--card-width');
    tableEl.style.removeProperty('--card-height');
    return;
  }

  // Ensure slots have celtic layout rules applied for measurements.
  slotsEl.className = `slots slots--${currentSpread.layout}`;

  const wasHidden = slotsEl.hidden;
  const prevVisibility = slotsEl.style.visibility;
  if (wasHidden) {
    slotsEl.hidden = false;
    slotsEl.style.visibility = 'hidden';
  }

  // Build a probe slot so we can measure title/label space with real fonts.
  const probeSlot = document.createElement('div');
  probeSlot.className = 'slot';
  probeSlot.style.position = 'absolute';
  probeSlot.style.left = '-9999px';
  probeSlot.style.top = '-9999px';
  probeSlot.style.visibility = 'hidden';
  probeSlot.style.pointerEvents = 'none';

  const probeCard = document.createElement('div');
  probeCard.className = 'card';
  const back = document.createElement('div');
  back.className = 'card-face card-back';
  const front = document.createElement('div');
  front.className = 'card-face card-front';
  const img = document.createElement('img');
  img.alt = '';
  img.src = '';
  front.appendChild(img);
  probeCard.appendChild(back);
  probeCard.appendChild(front);

  const title = document.createElement('div');
  title.className = 'slot-title';
  title.textContent = 'Queen of Pentacles (Reversed)';

  const label = document.createElement('div');
  label.className = 'slot-label';
  label.textContent = 'Hopes & Fears';

  probeSlot.appendChild(probeCard);
  probeSlot.appendChild(title);
  probeSlot.appendChild(label);
  slotsEl.appendChild(probeSlot);

  const cw = probeCard.offsetWidth;
  const ch = probeCard.offsetHeight;
  const extra = Math.max(0, probeSlot.offsetHeight - ch);
  probeSlot.remove();

  if (!cw || !ch) {
    if (wasHidden) {
      slotsEl.hidden = true;
      slotsEl.style.visibility = prevVisibility;
    }
    return;
  }

  const slotsStyle = window.getComputedStyle(slotsEl);
  const rowGap = Number.parseFloat(slotsStyle.rowGap || slotsStyle.gap) || 0;
  const rows = 4;

  const tableRect = tableEl.getBoundingClientRect();
  const available = Math.max(260, window.innerHeight - tableRect.top - 24);
  const ratio = ch / cw || 1.55;

  // Only shrink when necessary; otherwise keep the CSS-driven desktop size.
  const required = rows * (ch + extra) + (rows - 1) * rowGap;
  if (required <= available + 1) {
    tableEl.style.removeProperty('--card-width');
    tableEl.style.removeProperty('--card-height');
  } else {
    const maxCardH = Math.floor((available - (rows - 1) * rowGap - rows * extra) / rows);
    const maxCardWFromH = Math.floor(maxCardH / ratio);

    // Clamp shrink floor by breakpoint (restore phone sizing).
    // If still too tall at the floor, prefer overflow over micro-cards.
    const minW = window.matchMedia('(max-width: 540px)').matches
      ? 60
      : window.matchMedia('(max-width: 720px)').matches
        ? 72
        : 112;
    if (maxCardWFromH > 0) {
      const nextW = Math.max(minW, Math.min(maxCardWFromH, cw));
      tableEl.style.setProperty('--card-width', `${nextW}px`);
      tableEl.style.setProperty('--card-height', `${Math.round(nextW * ratio)}px`);
    }
  }

  if (wasHidden) {
    slotsEl.hidden = true;
    slotsEl.style.visibility = prevVisibility;
  }
};

const primeHorseshoeCardSize = () => {
  if (!tableEl) return;
  if (currentSpread.layout !== 'horseshoe') return;

  // Ensure slots have horseshoe padding rules applied for measurements.
  slotsEl.className = `slots slots--${currentSpread.layout}`;

  const wasHidden = slotsEl.hidden;
  const prevVisibility = slotsEl.style.visibility;
  if (wasHidden) {
    slotsEl.hidden = false;
    slotsEl.style.visibility = 'hidden';
  }

  const slotsStyle = window.getComputedStyle(slotsEl);
  const padL = Number.parseFloat(slotsStyle.paddingLeft) || 0;
  const padR = Number.parseFloat(slotsStyle.paddingRight) || 0;

  const n = currentSpread.positions.length || 7;
  const width = slotsEl.clientWidth || slotsEl.getBoundingClientRect().width;
  if (!width) {
    if (wasHidden) {
      slotsEl.hidden = true;
      slotsEl.style.visibility = prevVisibility;
    }
    return;
  }

  // Measure a probe `.card` so we get real px sizes even when custom properties use calc()/clamp().
  const probe = document.createElement('div');
  probe.className = 'card';
  probe.style.position = 'absolute';
  probe.style.left = '-9999px';
  probe.style.top = '-9999px';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  tableEl.appendChild(probe);
  const cwInitial = probe.offsetWidth;
  const chInitial = probe.offsetHeight;
  probe.remove();

  if (!cwInitial || !chInitial) {
    if (wasHidden) {
      slotsEl.hidden = true;
      slotsEl.style.visibility = prevVisibility;
    }
    return;
  }
  const ratio = chInitial / cwInitial || 1.65;
  let cw = cwInitial;

  // Mirror the overlap-shrinking logic so the deck is sized correctly
  // even before the first deal.
  for (let pass = 0; pass < 2; pass += 1) {
    const marginX = Math.max(12, Math.round(cw * 0.1));
    const left = padL + marginX;
    const right = width - padR - marginX - cw;
    const step = (right - left) / Math.max(1, n - 1);
    const minStep = cw * 0.6;
    if (step >= minStep - 0.5) break;

    const maxCardWidth = Math.floor(step / 0.6);
    if (maxCardWidth <= 0) break;
    cw = maxCardWidth;
  }

  const nextWidth = `${Math.round(cw)}px`;
  const nextHeight = `${Math.round(cw * ratio)}px`;
  tableEl.style.setProperty('--card-width', nextWidth);
  tableEl.style.setProperty('--card-height', nextHeight);

  if (wasHidden) {
    slotsEl.hidden = true;
    slotsEl.style.visibility = prevVisibility;
  }
};

const layoutHorseshoe = () => {
  if (currentSpread.layout !== 'horseshoe') return;
  if (!slots || slots.length !== currentSpread.positions.length) return;
  if (slotsEl.hidden) return;

  const n = slots.length;
  const probeSlot = slots[0];
  const probeCard = probeSlot?.querySelector('.card');
  if (!probeCard) return;

  const slotsStyle = window.getComputedStyle(slotsEl);
  const padL = Number.parseFloat(slotsStyle.paddingLeft) || 0;
  const padR = Number.parseFloat(slotsStyle.paddingRight) || 0;
  const padT = Number.parseFloat(slotsStyle.paddingTop) || 0;
  const padB = Number.parseFloat(slotsStyle.paddingBottom) || 0;

  const measureLabelSpace = () => {
    const titleEl = probeSlot.querySelector('.slot-title');
    const labelEl = probeSlot.querySelector('.slot-label');
    const titleH = titleEl ? titleEl.getBoundingClientRect().height : 0;
    const labelH = labelEl ? labelEl.getBoundingClientRect().height : 0;
    return titleH + labelH + 18;
  };

  const measure = () => {
    // Use layout metrics (exclude transforms) so CSS scaling doesn't change slot positions.
    // `getBoundingClientRect()` includes transforms, which would otherwise shift the arc layout.
    const cw = probeCard.offsetWidth;
    const ch = probeCard.offsetHeight;
    return {
      cw,
      ch,
      width: slotsEl.clientWidth,
    };
  };

  const initial = measure();
  if (!initial.cw || !initial.ch || !initial.width) return;
  const ratio = initial.ch / initial.cw || 1.65;

  // Iteratively shrink the horseshoe cards if the available width would cause >40% overlap.
  for (let pass = 0; pass < 2; pass += 1) {
    const { cw, width } = measure();
    if (!cw || !width) return;
    const marginX = Math.max(12, Math.round(cw * 0.1));
    const left = padL + marginX;
    const right = width - padR - marginX - cw;
    const step = (right - left) / Math.max(1, n - 1);
    const minStep = cw * 0.6; // >= 60% width visible => <= 40% overlap
    if (step >= minStep - 0.5) break;

    const maxCardWidth = Math.floor(step / 0.6);
    if (maxCardWidth <= 0) break;
    const nextWidth = `${maxCardWidth}px`;
    const nextHeight = `${Math.round(maxCardWidth * ratio)}px`;
    // Keep deck card size in sync with dealt cards.
    tableEl?.style.setProperty('--card-width', nextWidth);
    tableEl?.style.setProperty('--card-height', nextHeight);
    slotsEl.style.setProperty('--card-width', nextWidth);
    slotsEl.style.setProperty('--card-height', nextHeight);
  }

  const { cw, ch, width } = measure();
  if (!cw || !ch || !width) return;

  const labelSpace = measureLabelSpace();
  const marginX = Math.max(12, Math.round(cw * 0.1));
  const paddingTop = padT + Math.max(10, Math.round(ch * 0.08));
  const left = padL + marginX;
  const right = width - padR - marginX - cw;
  const step = (right - left) / Math.max(1, n - 1);

  const rx = (right - left) / 2;
  const cx = left + rx + cw / 2;
  const curveDepth = Math.max(Math.round(ch * 0.75), Math.round(cw * 0.55));

  const minHeight = paddingTop + curveDepth + ch + labelSpace + padB + 12;
  slotsEl.style.minHeight = `${Math.ceil(minHeight)}px`;

  slots.forEach((slot, i) => {
    const cardLeft = left + step * i;
    const cardCenterX = cardLeft + cw / 2;
    const dx = rx ? (cardCenterX - cx) / rx : 0;
    const arcPower = 1.2;
    const arcT = Math.min(1, Math.abs(dx));
    const yTop = paddingTop + curveDepth * (1 - arcT ** arcPower);

    slot.style.left = `${Math.round(cardLeft)}px`;
    slot.style.top = `${Math.round(yTop)}px`;
    slot.style.width = `${Math.round(cw)}px`;

    // Stack cards by height: higher cards on top, lower cards behind.
    slot.style.zIndex = String(1000 - Math.round(yTop) + i);
  });
};

const getDealTargets = () => {
  const deckCardEl = deckEl.querySelector('.deck-card');
  const deckRect = (deckCardEl || deckEl).getBoundingClientRect();
  const deckCenterX = deckRect.left + deckRect.width / 2;
  const deckCenterY = deckRect.top + deckRect.height / 2;
  return { deckCenterX, deckCenterY };
};

const renderSlots = () => {
  slotsEl.innerHTML = '';
  slotsEl.className = `slots slots--${currentSpread.layout}`;

  slots = currentSpread.positions.map((position, index) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = String(index);
    slot.tabIndex = -1;
    if (position.area) {
      slot.dataset.area = position.area;
    }
    if (typeof position.offset === 'number') {
      slot.style.setProperty('--offset', `${position.offset}px`);
    }

    const card = document.createElement('div');
    card.className = 'card';

    const back = document.createElement('div');
    back.className = 'card-face card-back';

    const front = document.createElement('div');
    front.className = 'card-face card-front';

    const img = document.createElement('img');
    img.src = '';
    img.alt = '';

    front.appendChild(img);
    card.appendChild(back);
    card.appendChild(front);

    const title = document.createElement('div');
    title.className = 'slot-title';

    const label = document.createElement('div');
    label.className = 'slot-label';
    label.textContent = position.label;

    slot.appendChild(card);
    slot.appendChild(title);
    slot.appendChild(label);

    slotsEl.appendChild(slot);
    return slot;
  });
};

const renderReading = () => {
  readingGridEl.innerHTML = '';
  drawn.forEach((entry, index) => {
    const { card, orientation, narrative, scene, detail, prediction, keywords, keywordsMode } =
      entry;
    const position = currentSpread.positions[index];
    const orientationLabel = orientation === 'reversed' ? 'Reversed' : '';
    const keywordTitle = keywordsMode === 'shadow' ? 'Keywords (Shadow)' : 'Keywords';
    const keywordList = formatKeywordsForDisplay(keywords, keywordsMode);
    const keywordChips = keywordList.length
      ? keywordList.map((keyword) => `<span class="keyword-chip">${keyword}</span>`).join('')
      : '';
    const keywordsBlock = keywordChips
      ? `
        <div class="reading-keywords">
          <p class="reading-keywords-title">${keywordTitle}</p>
          <div class="keyword-list">${keywordChips}</div>
        </div>
      `
      : '';
    const secondaryText = scene || detail || '';
    const isScene = Boolean(scene);
    const secondaryLabel = isScene
      ? orientation === 'reversed'
        ? 'Scene (Reversed lens): '
        : 'Scene: '
      : '';
    const secondaryClass =
      isScene && orientation === 'reversed'
        ? 'reading-paragraph reading-scene reading-scene--reversed'
        : 'reading-paragraph reading-scene';
    const labelSpan = secondaryLabel
      ? `<span class="reading-scene-label">${secondaryLabel}</span>`
      : '';
    const sceneBlock = secondaryText ? `<p class="${secondaryClass}">${labelSpan}${secondaryText}</p>` : '';
    const predictionText = prediction || '';
    const item = document.createElement('div');
    item.className = 'reading-item';
    if (orientation === 'reversed') {
      item.classList.add('is-reversed');
    }
    if (card.arcana) {
      item.classList.add(`reading-item--${card.arcana}`);
    }
    item.innerHTML = `
      <div class="reading-media">
        <img src="${card.image}" alt="${card.name}" />
      </div>
      <div class="reading-body">
        <h3>${position.label} (${card.name.toUpperCase()})</h3>
        <p class="reading-role">${position.detail}</p>
        ${orientationLabel ? `<p class="reading-orientation">${orientationLabel}</p>` : ''}
        <p class="reading-section-title">General Interpretation</p>
        <p class="reading-paragraph">${narrative}</p>
        ${sceneBlock}
        ${keywordsBlock}
        <div class="reading-advice">
          <h4>Personalized interpretation</h4>
          <p>${predictionText}</p>
        </div>
      </div>
    `;
    readingGridEl.appendChild(item);
  });

  readingEl.hidden = false;
};

const resetGame = () => {
  deck = shuffle(window.TAROT_CARDS);
  drawn = [];
  hasDealt = false;
  isDealing = false;
  slotsEl.classList.remove('is-stacked', 'is-dealing', 'is-collecting', 'is-unrevealing');
  slotsEl.style.removeProperty('--card-width');
  slotsEl.style.removeProperty('--card-height');
  slotsEl.style.removeProperty('min-height');
  tableEl?.style.removeProperty('--card-width');
  tableEl?.style.removeProperty('--card-height');
  slots = [];
  slotsEl.innerHTML = '';
  slotsEl.className = `slots slots--${currentSpread.layout}`;
  slotsEl.hidden = true;
  readingGridEl.innerHTML = '';
  readingEl.hidden = true;
  setStatus(`Tap the deck to deal ${currentSpread.positions.length} cards.`);
  deckHintEl.textContent = `Tap the deck to deal ${currentSpread.positions.length} cards`;
  deckEl.classList.add('ready');
  updateRevealAllState();
};

const buildDrawnEntry = (card, positionIndex) => {
  const position = currentSpread.positions[positionIndex];
  const orientation = allowReversed && Math.random() < 0.3 ? 'reversed' : 'upright';
  const interpretation = card[orientation];
  // Use canonical meaning text for the "meaning" paragraph (position-independent).
  // Some cards have AI-style entries in `meanings[]`; `full` stays canonical.
  const meaningText =
    (interpretation && typeof interpretation.full === 'string' && interpretation.full.trim()) ||
    (Array.isArray(interpretation?.meanings) ? interpretation.meanings.join(' ') : '') ||
    '';
  const meaning = meaningText;
  const reversedUsesShadow = orientation === 'reversed' && !hasNegativeCue(meaningText);
  const keywordSource = reversedUsesShadow ? card.upright : interpretation;
  const keywords = getKeywords(keywordSource);
  const keywordsMode = reversedUsesShadow ? 'shadow' : orientation;
  const narrative = reversedUsesShadow
    ? buildReversedShadowNarrative(card, position.label, keywords)
    : buildIntroText(card, position.label, meaningText, keywords);
  const prediction =
    getPersonalizedInterpretation(position.label, card.name) || sentenceize(meaningText);
  const scene = card.scene ? card.scene.trim() : '';
  const detail = card.detail ? card.detail.trim() : '';
  return {
    card,
    orientation,
    meaning,
    prediction,
    keywords,
    narrative,
    scene,
    detail,
    keywordsMode,
  };
};

const fillSlot = (slot, entry, dealIndex) => {
  const img = slot.querySelector('img');
  const title = slot.querySelector('.slot-title');
  const orientationLabel = entry.orientation === 'reversed' ? ' (Reversed)' : '';

  img.src = entry.card.image;
  img.alt = entry.card.name;
  title.textContent = `${entry.card.name}${orientationLabel}`;

  slot.classList.add('is-filled');
  slot.classList.toggle('is-reversed', entry.orientation === 'reversed');
  slot.classList.remove('revealed');
  slot.style.setProperty('--deal-index', String(dealIndex));
  slot.tabIndex = 0;

  if (entry.card.arcana) {
    slot.classList.add(`slot--${entry.card.arcana}`);
  }
};

const startDealAnimation = () => {
  const { deckCenterX, deckCenterY } = getDealTargets();
  slots.forEach((slot) => {
    const cardEl = slot.querySelector('.card');
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const dx = deckCenterX - cardCenterX;
    const dy = deckCenterY - cardCenterY;
    cardEl.style.setProperty('--deal-x', `${dx}px`);
    cardEl.style.setProperty('--deal-y', `${dy}px`);
  });

  slotsEl.classList.add('is-stacked');
  requestAnimationFrame(() => {
    slotsEl.classList.add('is-dealing');
    slotsEl.classList.remove('is-stacked');
  });

  const count = currentSpread.positions.length;
  const durationMs = 650;
  const staggerMs = 90;
  window.setTimeout(() => {
    slotsEl.classList.remove('is-dealing');
    isDealing = false;
    setStatus('Cards dealt. Tap each card to reveal (tap deck to shuffle).');
    deckHintEl.textContent = 'Tap cards to reveal — tap deck to shuffle';
    updateRevealAllState();
  }, durationMs + staggerMs * Math.max(0, count - 1) + 40);
};

const dealSpread = () => {
  if (hasDealt || isDealing) {
    return;
  }

  isDealing = true;
  updateRevealAllState();
  drawn = [];
  slotsEl.hidden = false;
  fitCelticToViewport();
  renderSlots();
  layoutHorseshoe();

  const count = currentSpread.positions.length;
  for (let i = 0; i < count; i += 1) {
    const card = deck.pop();
    const entry = buildDrawnEntry(card, i);
    drawn.push(entry);
    fillSlot(slots[i], entry, i);
  }

  hasDealt = true;
  deckEl.classList.remove('ready');
  setStatus('Dealing...');
  startDealAnimation();
};

const revealSlot = (slot) => {
  if (!slot || !hasDealt || isDealing) return;
  if (!slot.classList.contains('is-filled')) return;
  if (slot.classList.contains('revealed')) return;

  slot.classList.add('revealed');
  const revealedCount = slots.filter((s) => s.classList.contains('revealed')).length;
  const total = currentSpread.positions.length;
  if (revealedCount < total) {
    setStatus(`Revealed ${revealedCount} of ${total}. Keep going.`);
    return;
  }

  setStatus('Reading complete. Reflect on the pattern.');
  renderReading();
};

const shuffleAndReset = () => {
  if (isDealing) return;
  if (!hasDealt) {
    resetGame();
    return;
  }

  isDealing = true;
  setStatus('Shuffling...');
  deckHintEl.textContent = 'Shuffling...';

  const anyRevealed = slots.some((slot) => slot.classList.contains('revealed'));
  const unflipMs = anyRevealed ? 420 : 0;

  if (anyRevealed) {
    slotsEl.classList.add('is-unrevealing');
    slots.forEach((slot) => slot.classList.remove('revealed'));
    readingEl.hidden = true;
  }

  window.setTimeout(() => {
    slotsEl.classList.remove('is-unrevealing');

    // Ensure all transforms are up to date relative to the deck.
    const { deckCenterX, deckCenterY } = getDealTargets();
    slots.forEach((slot, index) => {
      const cardEl = slot.querySelector('.card');
      if (!cardEl) return;
      const rect = cardEl.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const dx = deckCenterX - cardCenterX;
      const dy = deckCenterY - cardCenterY;
      cardEl.style.setProperty('--deal-x', `${dx}px`);
      cardEl.style.setProperty('--deal-y', `${dy}px`);

      // Make the return feel like a "stack": last dealt returns last.
      const reverseIndex = Math.max(0, currentSpread.positions.length - 1 - index);
      slot.style.setProperty('--deal-index', String(reverseIndex));
    });

    slotsEl.classList.add('is-collecting');

    const count = currentSpread.positions.length;
    const durationMs = 520;
    const staggerMs = 55;
    window.setTimeout(() => {
      resetGame();
    }, durationMs + staggerMs * Math.max(0, count - 1) + 60);
  }, unflipMs + (anyRevealed ? 30 : 0));
};

const handleDeckActivate = () => {
  if (isDealing) return;
  if (!hasDealt) {
    dealSpread();
    return;
  }
  shuffleAndReset();
};

const setSpread = (spreadId) => {
  const nextSpread = SPREADS[spreadId];
  if (!nextSpread) {
    return;
  }
  currentSpread = nextSpread;
  if (tableEl) {
    tableEl.dataset.spread = currentSpread.layout;
  }
  spreadButtons.forEach((button) => {
    const isActive = button.dataset.spread === spreadId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  spreadDescEl.textContent = nextSpread.description;
  resetGame();
  // Defer measurement so layout is up to date (grid column widths, padding, etc).
  requestAnimationFrame(() => {
    primeHorseshoeCardSize();
    fitCelticToViewport();
  });
};

beginBtn.addEventListener('click', () => {
  document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
  setStatus(`Tap the deck to begin your ${currentSpread.name} reading.`);
});

spreadButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setSpread(button.dataset.spread);
  });
});

deckEl.addEventListener('click', handleDeckActivate);

deckEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleDeckActivate();
  }
});

resetBtn.addEventListener('click', shuffleAndReset);
revealAllBtn?.addEventListener('click', () => {
  if (!hasDealt || isDealing) return;
  revealAll();
});

setSpread('three');

slotsEl.addEventListener('click', (event) => {
  const slot = event.target.closest('.slot');
  if (!slot) return;
  if (currentSpread.layout === 'celtic' && slot.dataset.area === 'pos2') {
    const centerSlot = slots.find((candidate) => candidate.dataset.area === 'pos1');
    if (slot.classList.contains('revealed') && centerSlot && !centerSlot.classList.contains('revealed')) {
      revealSlot(centerSlot);
      return;
    }
  }
  revealSlot(slot);
});

slotsEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const slot = event.target.closest('.slot');
  if (!slot) return;
  event.preventDefault();
  if (currentSpread.layout === 'celtic' && slot.dataset.area === 'pos2') {
    const centerSlot = slots.find((candidate) => candidate.dataset.area === 'pos1');
    if (slot.classList.contains('revealed') && centerSlot && !centerSlot.classList.contains('revealed')) {
      revealSlot(centerSlot);
      return;
    }
  }
  revealSlot(slot);
});

window.addEventListener('resize', () => {
  requestAnimationFrame(() => {
    if (currentSpread.layout === 'horseshoe') {
      primeHorseshoeCardSize();
      if (hasDealt) layoutHorseshoe();
    }
    if (currentSpread.layout === 'celtic') {
      fitCelticToViewport();
    }
  });
});

const viewButtons = Array.from(document.querySelectorAll('[data-view]'));
const viewSections = new Map(
  viewButtons
    .map((button) => button.dataset.view)
    .map((viewId) => [viewId, document.getElementById(viewId)])
    .filter(([, section]) => section)
);

const setActiveView = (viewId) => {
  viewSections.forEach((section, id) => {
    const isActive = id === viewId;
    section.hidden = !isActive;
  });

  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === viewId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

const syncViewFromHash = () => {
  const hashView = window.location.hash.replace('#', '');
  if (viewSections.has(hashView)) {
    setActiveView(hashView);
    return;
  }
  setActiveView(viewSections.has('tarot') ? 'tarot' : viewSections.keys().next().value);
};

if (viewButtons.length > 0) {
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const viewId = button.dataset.view;
      setActiveView(viewId);
      if (viewId) {
        history.replaceState(null, '', `#${viewId}`);
      }
    });
  });

  window.addEventListener('hashchange', syncViewFromHash);
  syncViewFromHash();
}

const setBodyModalState = () => {
  const hasOpenModal = document.querySelector('.modal:not([hidden])');
  document.body.classList.toggle('modal-open', Boolean(hasOpenModal));
};

const openModal = (modal) => {
  if (!modal) return;
  modal.hidden = false;
  setBodyModalState();
};

const closeModal = (modal) => {
  if (!modal) return;
  modal.hidden = true;
  setBodyModalState();
};

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hashString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
};

const pickFromList = (list, seed) => {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[seed % list.length];
};

const getDailyInterpretation = (card, variant, seed) => {
  const presentText = getPersonalizedInterpretation('Present', card.name);
  if (presentText) return sentenceize(presentText);

  const personalizedList = variant.personalized_interpretation;
  if (Array.isArray(personalizedList) && personalizedList.length > 0) {
    return sentenceize(pickFromList(personalizedList, seed));
  }

  if (variant.full) return sentenceize(variant.full);

  const meaning = pickFromList(variant.meanings, seed) || card.detail;
  return sentenceize(meaning);
};

const getDailyCardData = () => {
  const cards = window.TAROT_CARDS || [];
  if (!Array.isArray(cards) || cards.length === 0) return null;
  const dateKey = getLocalDateKey();
  const baseSeed = hashString(dateKey);
  const card = cards[baseSeed % cards.length];
  const orientationSeed = hashString(`${dateKey}:orientation`);
  const isReversed = orientationSeed % 5 === 0;
  const orientation = isReversed ? 'reversed' : 'upright';
  const variant = card[orientation] || card.upright || {};
  const keywordText =
    (variant.keywordsList && variant.keywordsList.join(', ')) || variant.keywords || '';
  const message = pickFromList(variant.meanings, baseSeed) || card.detail || '';
  const guidance =
    pickFromList(variant.advice, orientationSeed) ||
    pickFromList(card.upright?.advice, baseSeed) ||
    'Choose one grounded action that honors your focus.';
  const interpretation = getDailyInterpretation(card, variant, baseSeed);

  return {
    dateKey,
    card,
    orientation,
    keywordText,
    message,
    guidance,
    interpretation,
  };
};

const dailyModal = document.getElementById('dailyCardModal');
const dailyTriggers = Array.from(document.querySelectorAll('[data-daily-trigger]'));

const dailyCardDate = document.getElementById('dailyCardDate');
const dailyCardImage = document.getElementById('dailyCardImage');
const dailyCardMedia = document.getElementById('dailyCardMedia');
const dailyCardName = document.getElementById('dailyCardName');
const dailyCardArcana = document.getElementById('dailyCardArcana');
const dailyCardKeywords = document.getElementById('dailyCardKeywords');
const dailyCardMessage = document.getElementById('dailyCardMessage');
const dailyCardGuidance = document.getElementById('dailyCardGuidance');
const dailyCardInterpretation = document.getElementById('dailyCardInterpretation');
const dailyCardInterpretationLabel = document.getElementById('dailyCardInterpretationLabel');

const setDailyCardContent = () => {
  const data = getDailyCardData();
  if (!data) return;

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (dailyCardDate) dailyCardDate.textContent = dateLabel;
  if (dailyCardName) {
    dailyCardName.textContent = `${data.card.name}${data.orientation === 'reversed' ? ' (Reversed)' : ''}`;
  }
  if (dailyCardArcana) {
    dailyCardArcana.textContent = data.card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana';
  }
  if (dailyCardKeywords) {
    dailyCardKeywords.textContent = data.keywordText || 'A quiet focus for today.';
  }
  if (dailyCardMessage) {
    dailyCardMessage.textContent = data.message || 'Let today be a gentle reset.';
  }
  if (dailyCardGuidance) {
    dailyCardGuidance.textContent = data.guidance;
  }
  if (dailyCardInterpretation) {
    dailyCardInterpretation.textContent = data.interpretation;
  }
  if (dailyCardInterpretationLabel) {
    dailyCardInterpretationLabel.textContent = 'Personalized interpretation';
  }
  if (dailyCardImage) {
    const mediaFigure = dailyCardImage.closest('figure');
    if (data.card.image) {
      dailyCardImage.src = data.card.image;
      dailyCardImage.alt = data.card.name;
      if (mediaFigure) mediaFigure.hidden = false;
    } else if (mediaFigure) {
      mediaFigure.hidden = true;
    }
  }
  if (dailyCardMedia) {
    dailyCardMedia.classList.remove('daily-card__media--major', 'daily-card__media--minor');
    dailyCardMedia.classList.add(
      data.card.arcana === 'major' ? 'daily-card__media--major' : 'daily-card__media--minor'
    );
  }
};

const openDailyModal = () => {
  if (!dailyModal) return;
  setDailyCardContent();
  openModal(dailyModal);
};

const closeDailyModal = () => {
  if (!dailyModal) return;
  closeModal(dailyModal);
};

if (dailyModal) {
  const closeTargets = dailyModal.querySelectorAll('[data-daily-close]');
  closeTargets.forEach((target) => {
    target.addEventListener('click', closeDailyModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dailyModal.hidden) {
      closeDailyModal();
    }
  });
}

const DAILY_SEEN_KEY = 'dailyCardSeen';

const markDailySeen = () => {
  try {
    localStorage.setItem(DAILY_SEEN_KEY, '1');
  } catch (error) {
    // Ignore storage errors.
  }
};

const hasSeenDaily = () => {
  try {
    return localStorage.getItem(DAILY_SEEN_KEY) === '1';
  } catch (error) {
    return false;
  }
};

if (dailyTriggers.length) {
  if (!hasSeenDaily()) {
    dailyTriggers.forEach((trigger) => trigger.classList.add('daily-trigger--attention'));
  }

  dailyTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      markDailySeen();
      dailyTriggers.forEach((item) => item.classList.remove('daily-trigger--attention'));
      openDailyModal();
    });
  });
}

const MAGIC_RESPONSES = [
  'Yes, but give it time.',
  'No, and that is protection.',
  'Lean into the next step.',
  'Trust your instinct.',
  'Wait for clearer signals.',
  'A small yes opens a bigger door.',
  'Choose the simpler path.',
  'Now is not the moment.',
  'Ask again after you rest.',
  'Follow the spark, ignore the noise.',
  'The answer is already near.',
  'Let it unfold without force.',
  'A shift is underway.',
  'Release what is heavy.',
  'Move gently, but move.',
  'Protect your energy first.',
  'A helpful ally appears soon.',
  'You already know the answer.',
  'Say no to protect the yes.',
  'This is a good omen.',
  'A pause will reveal more.',
  'Listen, then act.',
  'Take the risk with care.',
  'Begin with the smallest action.',
];

const MAGIC_DEFAULT_ANSWER = 'Focus your question.';
const MAGIC_DEFAULT_STATUS = 'Shake your phone or tap the orb to reveal a message.';
const MAGIC_SHAKE_THRESHOLD = 18;
const MAGIC_SHAKE_COOLDOWN = 900;
const MAGIC_REVEAL_DELAY = 520;
const MAGIC_PENDING_STATUS = 'The orb is listening...';

const magicModal = document.getElementById('magicModal');
const magicTriggers = Array.from(document.querySelectorAll('[data-magic-trigger]'));
const magicOrb = document.getElementById('magicOrb');
const magicOrb3d = document.getElementById('magicOrb3d');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const siteNav = document.getElementById('siteNav');
const magicAnswerBox = document.getElementById('magicAnswerBox');
const magicAnswerLines = document.getElementById('magicAnswerLines');
const magicAnswerLive = document.getElementById('magicAnswerLive');
const magicStatus = document.getElementById('magicStatus');
const magicReset = document.getElementById('magicReset');
const magicEnableMotion = document.getElementById('magicEnableMotion');

let magicMotionActive = false;
let lastMagicShake = 0;
let lastMagicAccel = null;
let magicRevealTimer = null;
let magicAnswerResizeRaf = null;
let magicAnswerMeasure = null;
let magicOrb3dState = null;

const MAGIC_TRIANGLE_METRICS = {
  topRatio: 0.04,
  baseRatio: 0.92,
  baseWidthRatio: 0.84,
};

const getMagicBoxMetrics = () => {
  if (!magicAnswerBox) return null;
  const rect = magicAnswerBox.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    width: rect.width,
    height: rect.height,
  };
};

const initMagicOrb3d = () => {
  if (!magicOrb3d || !window.THREE) return;
  if (magicOrb3dState) return;
  const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  magicOrb3d.appendChild(renderer.domElement);

  const scene = new window.THREE.Scene();
  const camera = new window.THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 3.2;

  const geometry = new window.THREE.SphereGeometry(1, 64, 64);
  const material = new window.THREE.MeshPhysicalMaterial({
    color: 0x3a3562,
    roughness: 0.35,
    metalness: 0.08,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    transmission: 0.06,
    thickness: 1.1,
  });
  const mesh = new window.THREE.Mesh(geometry, material);
  scene.add(mesh);

  const ambient = new window.THREE.AmbientLight(0xffffff, 0.55);
  const key = new window.THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(2.2, 2.8, 4);
  const rim = new window.THREE.PointLight(0x7a66b6, 0.65);
  rim.position.set(-3, -2, 2);
  scene.add(ambient, key, rim);

  magicOrb3dState = {
    renderer,
    scene,
    camera,
    mesh,
    rafId: null,
    lastTime: 0,
    spinUntil: 0,
  };
  resizeMagicOrb3d();
  renderMagicOrb3d();
};

const resizeMagicOrb3d = () => {
  if (!magicOrb3dState || !magicOrb3d) return;
  const rect = magicOrb3d.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  magicOrb3dState.renderer.setSize(rect.width, rect.height, false);
  magicOrb3dState.camera.aspect = rect.width / rect.height;
  magicOrb3dState.camera.updateProjectionMatrix();
  renderMagicOrb3d();
};

const renderMagicOrb3d = () => {
  if (!magicOrb3dState) return;
  magicOrb3dState.renderer.render(magicOrb3dState.scene, magicOrb3dState.camera);
};

const pulseMagicOrb3d = (duration = 700) => {
  initMagicOrb3d();
  if (!magicOrb3dState) return;
  magicOrb3dState.spinUntil = Math.max(
    magicOrb3dState.spinUntil,
    (window.performance?.now() || Date.now()) + duration
  );
  if (magicOrb3dState.rafId) return;
  const animate = (time) => {
    if (!magicOrb3dState) return;
    const now = time || Date.now();
    const delta = magicOrb3dState.lastTime ? now - magicOrb3dState.lastTime : 16;
    magicOrb3dState.lastTime = now;
    if (now <= magicOrb3dState.spinUntil) {
      const speed = 0.0022;
      magicOrb3dState.mesh.rotation.y += speed * delta;
      magicOrb3dState.mesh.rotation.x += speed * 0.4 * delta;
      renderMagicOrb3d();
      magicOrb3dState.rafId = window.requestAnimationFrame(animate);
      return;
    }
    magicOrb3dState.rafId = null;
    magicOrb3dState.lastTime = 0;
    renderMagicOrb3d();
  };
  magicOrb3dState.rafId = window.requestAnimationFrame(animate);
};

const stopMagicOrb3d = () => {
  if (!magicOrb3dState) return;
  if (magicOrb3dState.rafId) {
    window.cancelAnimationFrame(magicOrb3dState.rafId);
  }
  magicOrb3dState.rafId = null;
  magicOrb3dState.lastTime = 0;
  magicOrb3dState.spinUntil = 0;
};

const ensureMagicAnswerMetrics = () => {
  if (!magicAnswerLines) return;
  const prevFontSize = magicAnswerLines.style.fontSize;
  const prevLetterSpacing = magicAnswerLines.style.letterSpacing;
  if (prevFontSize) magicAnswerLines.style.fontSize = '';
  if (prevLetterSpacing) magicAnswerLines.style.letterSpacing = '';

  const style = window.getComputedStyle(magicAnswerLines);
  const fontKey = `${style.fontStyle}|${style.fontWeight}|${style.fontFamily}|${style.fontSize}|${style.letterSpacing}|${style.lineHeight}`;
  if (magicAnswerMeasure && magicAnswerMeasure.fontKey === fontKey) {
    if (prevFontSize) magicAnswerLines.style.fontSize = prevFontSize;
    if (prevLetterSpacing) magicAnswerLines.style.letterSpacing = prevLetterSpacing;
    return;
  }

  const baseSizePx = parseFloat(style.fontSize) || 0;
  const baseSpacingPx = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing) || 0;
  const lineHeightPx = parseFloat(style.lineHeight) || (baseSizePx ? baseSizePx * 1.3 : 16);
  const lineHeightRatio = baseSizePx ? Math.max(1.3, lineHeightPx / baseSizePx) : 1.3;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  magicAnswerMeasure = {
    baseSizePx,
    baseSpacingPx,
    lineHeightRatio,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight || '400',
    fontStyle: style.fontStyle || 'normal',
    fontKey,
    ctx,
  };

  if (prevFontSize) magicAnswerLines.style.fontSize = prevFontSize;
  if (prevLetterSpacing) magicAnswerLines.style.letterSpacing = prevLetterSpacing;
};

const getMagicAnswerText = () => {
  if (!magicAnswerLines) return '';
  if (magicAnswerLines.dataset.magicText !== undefined) {
    return magicAnswerLines.dataset.magicText;
  }
  return magicAnswerLines.textContent || '';
};

const setMagicAnswerText = (text) => {
  if (!magicAnswerLines) return;
  magicAnswerLines.dataset.magicText = text;
  if (magicAnswerLive) magicAnswerLive.textContent = text;
};

const measureMagicTextWidthPx = (text, fontSizePx, letterSpacingPx) => {
  if (!magicAnswerMeasure || !magicAnswerMeasure.ctx) return 0;
  const ctx = magicAnswerMeasure.ctx;
  ctx.font = `${magicAnswerMeasure.fontStyle} ${magicAnswerMeasure.fontWeight} ${fontSizePx}px ${magicAnswerMeasure.fontFamily}`;
  const width = ctx.measureText(text).width;
  const spacing = letterSpacingPx ? letterSpacingPx * Math.max(0, text.length - 1) : 0;
  return width + spacing;
};

const computeMagicLetterSpacingPx = (fontSizePx) => {
  if (!magicAnswerMeasure) return 0;
  const { baseSizePx, baseSpacingPx } = magicAnswerMeasure;
  if (!baseSizePx || !baseSpacingPx) return 0;
  const ratio = Math.min(1, fontSizePx / baseSizePx);
  return baseSpacingPx * ratio;
};

const getTriangleMetrics = (boxWidth, boxHeight) => {
  const top = boxHeight * MAGIC_TRIANGLE_METRICS.topRatio;
  const base = boxHeight * MAGIC_TRIANGLE_METRICS.baseRatio;
  return {
    top,
    base,
    height: base - top,
    baseWidth: boxWidth * MAGIC_TRIANGLE_METRICS.baseWidthRatio,
  };
};

const getTriangleWidthAtY = (centerY, metrics) => {
  if (centerY <= metrics.top || centerY >= metrics.base) return 0;
  const t = (centerY - metrics.top) / metrics.height;
  return metrics.baseWidth * t;
};

// Wraps words into line boxes that fit inside the triangle at each line's vertical band.
const wrapMagicAnswerLines = (text, fontSizePx, letterSpacingPx, lineHeightPx, boxWidth, boxHeight) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length || !boxWidth || !boxHeight) return null;

  const metrics = getTriangleMetrics(boxWidth, boxHeight);
  const availableHeight = metrics.height;
  const maxLines = Math.max(1, Math.floor(availableHeight / lineHeightPx));
  const spaceWidth = measureMagicTextWidthPx(' ', fontSizePx, letterSpacingPx);
  const gutter = Math.max(6, fontSizePx * 0.4);
  const safeWidthAt = (centerY) => Math.max(0, getTriangleWidthAtY(centerY, metrics) - gutter);
  const minOffsetForWidth = (lineIndex, width) => {
    const neededWidth = width + gutter;
    const requiredY = metrics.top + (neededWidth / metrics.baseWidth) * metrics.height;
    return requiredY - metrics.top - (lineIndex + 0.5) * lineHeightPx;
  };

  const buildLines = (topOffset) => {
    const lines = [];
    let current = '';
    let currentWidth = 0;
    let lineIndex = 0;

    for (const word of words) {
      const wordUpper = word.toUpperCase();
      const wordWidth = measureMagicTextWidthPx(wordUpper, fontSizePx, letterSpacingPx);
      const centerY = metrics.top + topOffset + (lineIndex + 0.5) * lineHeightPx;
      const allowedWidth = safeWidthAt(centerY);
      if (!current) {
        if (wordWidth > allowedWidth) {
          return { lines: null, requiredOffset: minOffsetForWidth(lineIndex, wordWidth) };
        }
        current = wordUpper;
        currentWidth = wordWidth;
        continue;
      }
      const candidateWidth = currentWidth + spaceWidth + wordWidth;
      if (candidateWidth <= allowedWidth) {
        current = `${current} ${wordUpper}`;
        currentWidth = candidateWidth;
        continue;
      }
      lines.push({ text: current, width: currentWidth });
      lineIndex += 1;
      if (lineIndex >= maxLines) {
        return { lines: null, requiredOffset: Number.POSITIVE_INFINITY };
      }
      const nextCenterY = metrics.top + topOffset + (lineIndex + 0.5) * lineHeightPx;
      const nextAllowedWidth = safeWidthAt(nextCenterY);
      if (wordWidth > nextAllowedWidth) {
        return { lines: null, requiredOffset: minOffsetForWidth(lineIndex, wordWidth) };
      }
      current = wordUpper;
      currentWidth = wordWidth;
    }

    if (current) lines.push({ text: current, width: currentWidth });
    return { lines, requiredOffset: topOffset };
  };

  let topOffset = 0;
  let lines = null;
  for (let i = 0; i < 6; i += 1) {
    const result = buildLines(topOffset);
    if (!result) return null;
    if (!result.lines) {
      if (!Number.isFinite(result.requiredOffset)) return null;
      const nextOffset = Math.max(topOffset, result.requiredOffset);
      if (nextOffset <= topOffset + 0.1) return null;
      topOffset = nextOffset;
      continue;
    }
    lines = result.lines;
    const centeredOffset = Math.max(0, (availableHeight - lines.length * lineHeightPx) / 2);
    topOffset = Math.max(topOffset, centeredOffset);
    break;
  }

  if (!lines || !lines.length || lines.length > maxLines) return null;
  if (topOffset + lines.length * lineHeightPx > availableHeight) return null;

  const allowedWidths = lines.map((_, index) => {
    const centerY = metrics.top + topOffset + (index + 0.5) * lineHeightPx;
    return safeWidthAt(centerY);
  });

  const fits = lines.every((line, index) => line.width + gutter <= allowedWidths[index] + 0.01);
  if (!fits) return null;

  return {
    lines,
    topOffset,
    lineHeight: lineHeightPx,
    allowedWidths,
    fontSize: fontSizePx,
    letterSpacing: letterSpacingPx,
    metrics,
  };
};

const renderMagicAnswerLines = (layout) => {
  if (!magicAnswerLines || !layout) return;
  magicAnswerLines.style.fontSize = `${layout.fontSize.toFixed(3)}px`;
  magicAnswerLines.style.letterSpacing = `${layout.letterSpacing.toFixed(3)}px`;
  magicAnswerLines.style.lineHeight = `${layout.lineHeight.toFixed(3)}px`;
  magicAnswerLines.style.top = '0px';
  magicAnswerLines.style.height = '100%';
  while (magicAnswerLines.firstChild) {
    magicAnswerLines.removeChild(magicAnswerLines.firstChild);
  }
  layout.lines.forEach((line, index) => {
    const span = document.createElement('span');
    span.className = 'magic-layer__answer-line';
    span.style.width = `${Math.max(0, layout.allowedWidths[index]).toFixed(2)}px`;
    span.style.height = `${layout.lineHeight.toFixed(2)}px`;
    span.style.lineHeight = `${layout.lineHeight.toFixed(2)}px`;
    span.style.top = `${(layout.metrics.top + layout.topOffset + index * layout.lineHeight).toFixed(2)}px`;
    span.textContent = line.text;
    magicAnswerLines.appendChild(span);
  });
};

// Finds the largest font size that still allows the text to fit inside the triangle.
const fitMagicAnswer = () => {
  if (!magicAnswerLines || !magicAnswerBox) return;
  if (magicModal && magicModal.hidden) return;
  ensureMagicAnswerMetrics();
  if (!magicAnswerMeasure || !magicAnswerMeasure.baseSizePx) return;

  const rawText = getMagicAnswerText();
  const text = rawText.trim();
  if (!text) return;
  setMagicAnswerText(text);

  const boxMetrics = getMagicBoxMetrics();
  if (!boxMetrics) return;

  const baseSizePx = magicAnswerMeasure.baseSizePx;
  const minSizePx = Math.max(8, Math.round(baseSizePx * 0.45));
  const maxSizePx = baseSizePx;
  let low = minSizePx;
  let high = maxSizePx;
  let bestLayout = null;

  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    const letterSpacingPx = computeMagicLetterSpacingPx(mid);
    const lineHeightPx = magicAnswerMeasure.lineHeightRatio * mid;
    const layout = wrapMagicAnswerLines(
      text,
      mid,
      letterSpacingPx,
      lineHeightPx,
      boxMetrics.width,
      boxMetrics.height
    );
    if (layout) {
      bestLayout = layout;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (!bestLayout) {
    const letterSpacingPx = computeMagicLetterSpacingPx(minSizePx);
    const lineHeightPx = magicAnswerMeasure.lineHeightRatio * minSizePx;
    bestLayout = wrapMagicAnswerLines(
      text,
      minSizePx,
      letterSpacingPx,
      lineHeightPx,
      boxMetrics.width,
      boxMetrics.height
    );
  }

  if (!bestLayout) {
    while (magicAnswerLines.firstChild) {
      magicAnswerLines.removeChild(magicAnswerLines.firstChild);
    }
    const fallbackLineHeight = magicAnswerMeasure.lineHeightRatio * minSizePx;
    const metrics = getTriangleMetrics(boxMetrics.width, boxMetrics.height);
    const span = document.createElement('span');
    span.className = 'magic-layer__answer-line';
    span.style.width = `${metrics.baseWidth.toFixed(2)}px`;
    span.style.height = `${fallbackLineHeight.toFixed(2)}px`;
    span.style.lineHeight = `${fallbackLineHeight.toFixed(2)}px`;
    span.style.top = `${(metrics.top + (metrics.height - fallbackLineHeight) / 2).toFixed(2)}px`;
    span.textContent = text.toUpperCase();
    magicAnswerLines.style.fontSize = `${minSizePx}px`;
    magicAnswerLines.style.letterSpacing = `${computeMagicLetterSpacingPx(minSizePx)}px`;
    magicAnswerLines.style.lineHeight = `${fallbackLineHeight.toFixed(3)}px`;
    magicAnswerLines.style.top = '0px';
    magicAnswerLines.style.height = '100%';
    magicAnswerLines.appendChild(span);
    return;
  }

  renderMagicAnswerLines(bestLayout);
};

const scheduleMagicAnswerFit = () => {
  if (!magicAnswerLines) return;
  if (magicAnswerResizeRaf) {
    window.cancelAnimationFrame(magicAnswerResizeRaf);
  }
  magicAnswerResizeRaf = window.requestAnimationFrame(() => {
    magicAnswerResizeRaf = null;
    fitMagicAnswer();
  });
};
const setMagicStatus = (message) => {
  if (magicStatus) magicStatus.textContent = message;
};

const setMagicAnswer = (text) => {
  if (magicAnswerLines) {
    setMagicAnswerText(text);
    scheduleMagicAnswerFit();
    magicAnswerLines.classList.remove('is-appearing');
    void magicAnswerLines.offsetHeight;
    magicAnswerLines.classList.add('is-appearing');
  }
};

const resetMagicLayer = () => {
  if (magicRevealTimer) {
    window.clearTimeout(magicRevealTimer);
    magicRevealTimer = null;
  }
  setMagicAnswer(MAGIC_DEFAULT_ANSWER);
  setMagicStatus(MAGIC_DEFAULT_STATUS);
  if (magicOrb) {
    magicOrb.classList.remove('is-revealed');
    magicOrb.classList.remove('is-revealing');
    magicOrb.classList.remove('is-shaking');
  }
};

const animateMagicOrb = () => {
  if (!magicOrb) return;
  magicOrb.classList.remove('is-revealed');
  magicOrb.classList.remove('is-revealing');
  magicOrb.classList.remove('is-shaking');
  void magicOrb.offsetWidth;
  magicOrb.classList.add('is-shaking');
  pulseMagicOrb3d(700);
  window.setTimeout(() => {
    if (magicOrb) magicOrb.classList.remove('is-shaking');
  }, 650);
};

const revealMagicAnswer = (source) => {
  const now = Date.now();
  if (now - lastMagicShake < MAGIC_SHAKE_COOLDOWN) return;
  lastMagicShake = now;
  if (magicRevealTimer) {
    window.clearTimeout(magicRevealTimer);
    magicRevealTimer = null;
  }
  animateMagicOrb();
  setMagicStatus(MAGIC_PENDING_STATUS);
  if (magicOrb) magicOrb.classList.add('is-revealing');
  magicRevealTimer = window.setTimeout(() => {
    magicRevealTimer = null;
    if (magicOrb) {
      magicOrb.classList.remove('is-revealing');
      magicOrb.classList.add('is-revealed');
    }
    setMagicAnswer(pickRandom(MAGIC_RESPONSES));
    setMagicStatus(
      source === 'shake' ? 'The orb shifts. Ask again when ready.' : 'Ask again when ready.'
    );
  }, MAGIC_REVEAL_DELAY);
};

const supportsMotion = () => typeof window !== 'undefined' && 'DeviceMotionEvent' in window;

const handleMagicMotion = (event) => {
  if (!magicModal || magicModal.hidden) return;
  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  if (!acceleration) return;
  const { x, y, z } = acceleration;
  
  // Check if values are valid numbers
  if (x === null || x === undefined || y === null || y === undefined || z === null || z === undefined) {
    return;
  }
  
  if (lastMagicAccel === null) {
    lastMagicAccel = { x, y, z };
    return;
  }
  
  const delta =
    Math.abs(x - lastMagicAccel.x) +
    Math.abs(y - lastMagicAccel.y) +
    Math.abs(z - lastMagicAccel.z);
  
  // Check if delta is a valid number
  if (isNaN(delta) || !isFinite(delta)) {
    lastMagicAccel = { x, y, z };
    return;
  }
  
  lastMagicAccel = { x, y, z };
  if (delta > MAGIC_SHAKE_THRESHOLD) {
    revealMagicAnswer('shake');
  }
};

const attachMagicMotion = () => {
  if (!supportsMotion() || magicMotionActive) return;
  // Remove any existing listener first to avoid duplicates
  window.removeEventListener('devicemotion', handleMagicMotion);
  window.addEventListener('devicemotion', handleMagicMotion, { passive: true });
  magicMotionActive = true;
  lastMagicAccel = null; // Reset acceleration tracking
};

const detachMagicMotion = () => {
  if (!supportsMotion() || !magicMotionActive) return;
  window.removeEventListener('devicemotion', handleMagicMotion);
  magicMotionActive = false;
  lastMagicAccel = null;
};

const requestMagicMotionPermission = async () => {
  if (!supportsMotion()) return false;
  if (typeof DeviceMotionEvent.requestPermission !== 'function') return true;
  try {
    const result = await DeviceMotionEvent.requestPermission();
    return result === 'granted';
  } catch (error) {
    return false;
  }
};

const initMagicMotion = async () => {
  if (!supportsMotion()) {
    setMagicStatus('Tap the orb to reveal a message.');
    if (magicEnableMotion) magicEnableMotion.hidden = true;
    return;
  }
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    // Check if permission was already granted (iOS 13+)
    try {
      // Note: requestPermission can only be called from user gesture
      // So we show the button and let user click it
      setMagicStatus('Enable motion or tap the orb to reveal a message.');
      if (magicEnableMotion) magicEnableMotion.hidden = false;
      return;
    } catch (error) {
      // Fall through to attach motion if check fails
    }
  }
  attachMagicMotion();
  setMagicStatus(MAGIC_DEFAULT_STATUS);
  if (magicEnableMotion) magicEnableMotion.hidden = true;
};

const openMagicModal = () => {
  if (!magicModal) return;
  resetMagicLayer();
  openModal(magicModal);
  initMagicMotion();
  initMagicOrb3d();
  scheduleMagicAnswerFit();
};

const setMobileMenuOpen = (isOpen) => {
  if (!siteNav || !mobileMenuToggle) return;
  siteNav.classList.toggle('is-open', isOpen);
  mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
};

const closeMagicModal = () => {
  if (!magicModal) return;
  closeModal(magicModal);
  detachMagicMotion();
  stopMagicOrb3d();
  resetMagicLayer();
};

if (magicTriggers.length) {
  magicTriggers.forEach((trigger) => {
    trigger.addEventListener('click', openMagicModal);
  });
}

if (magicModal) {
  const closeTargets = magicModal.querySelectorAll('[data-magic-close]');
  closeTargets.forEach((target) => {
    target.addEventListener('click', closeMagicModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !magicModal.hidden) {
      closeMagicModal();
    }
  });
}

if (mobileMenuToggle && siteNav) {
  mobileMenuToggle.addEventListener('click', () => {
    setMobileMenuOpen(!siteNav.classList.contains('is-open'));
  });
  siteNav.addEventListener('click', (event) => {
    const target = event.target.closest('button, a');
    if (target) setMobileMenuOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (siteNav.contains(event.target) || mobileMenuToggle.contains(event.target)) return;
    setMobileMenuOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 560) setMobileMenuOpen(false);
  });
}

if (magicOrb) {
  magicOrb.addEventListener('click', () => revealMagicAnswer('tap'));
  magicOrb.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      revealMagicAnswer('tap');
    }
  });
}

if (magicAnswerLines && magicAnswerBox) {
  scheduleMagicAnswerFit();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      magicAnswerMeasure = null;
      scheduleMagicAnswerFit();
    });
  }
  window.addEventListener('resize', () => {
    if (!magicModal || magicModal.hidden) return;
    scheduleMagicAnswerFit();
    resizeMagicOrb3d();
  });
}

if (magicReset) {
  magicReset.addEventListener('click', () => {
    resetMagicLayer();
  });
}

if (magicEnableMotion) {
  magicEnableMotion.addEventListener('click', async () => {
    const granted = await requestMagicMotionPermission();
    if (granted) {
      // Reset acceleration tracking when enabling motion
      lastMagicAccel = null;
      attachMagicMotion();
      setMagicStatus(MAGIC_DEFAULT_STATUS);
      magicEnableMotion.hidden = true;
      return;
    }
    setMagicStatus('Motion access is off. Tap the orb to reveal a message.');
    magicEnableMotion.hidden = true;
  });
}

const authModal = document.getElementById('authModal');
const authTrigger = document.getElementById('authTrigger');
const authCard = document.querySelector('.auth-card');
const authForm = document.getElementById('authForm');
const authEmailInput = document.getElementById('authEmail');
const authStatus = document.getElementById('authStatus');
const authDisplayName = document.getElementById('authDisplayName');
const authDisplayEmail = document.getElementById('authDisplayEmail');
const authSignOut = document.getElementById('authSignOut');
const authPasswordInput = document.getElementById('authPassword');
const authNameWrap = document.querySelector('[data-auth-name]');
const authNameInput = document.getElementById('authName');
const authHint = document.querySelector('[data-auth-hint]');
const authTitle = document.getElementById('authTitle');
const authVerify = document.getElementById('authVerify');
const authVerifyEmail = document.getElementById('authVerifyEmail');
const authResend = document.querySelector('[data-auth-resend]');
const authReset = document.getElementById('authReset');
const authResetEmail = document.getElementById('authResetEmail');
const authForgot = document.querySelector('[data-auth-forgot]');
const authResetSend = document.querySelector('[data-auth-reset-send]');

const soulmatePanel = document.getElementById('soulmatePanel');
const soulmateImage = document.getElementById('soulmateImage');
const soulmateStatus = document.getElementById('soulmateStatus');
const soulmateModal = document.getElementById('soulmateModal');
const soulmateTriggers = Array.from(document.querySelectorAll('[data-soulmate-trigger]'));
let soulmateRequested = false;

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT =
  window.SUPABASE_REDIRECT || `${window.location.origin}/auth/callback`;

const hasSupabaseConfig = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

const supabaseClient =
  window.supabase && hasSupabaseConfig()
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          flowType: 'pkce',
        },
      })
    : null;

const setAuthStatus = (message) => {
  if (!authStatus) return;
  authStatus.textContent = message || '';
};

const syncServerSession = async (accessToken) => {
  if (!accessToken) return;
  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch (error) {
    // Ignore network errors.
  }
};

const setSoulmateStatus = (message) => {
  if (!soulmateStatus) return;
  soulmateStatus.textContent = message || '';
  soulmateStatus.hidden = !message;
};

const requestSoulmateGeneration = async () => {
  if (soulmateRequested) return;
  soulmateRequested = true;
  try {
    await fetch('/api/soulmate/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({}),
    });
  } catch (error) {
    // Ignore generation errors.
  }
};

const loadSoulmate = async () => {
  if (!soulmatePanel) return false;
  try {
    const response = await fetch('/api/soulmate', { credentials: 'same-origin' });
    if (!response.ok) {
      soulmatePanel.hidden = true;
      return false;
    }
    const data = await response.json();
    if (data.status === 'no_quiz') {
      soulmatePanel.hidden = false;
      if (soulmateImage) soulmateImage.hidden = true;
      setSoulmateStatus('Complete the quiz to unlock your soulmate portrait.');
      return true;
    }
    soulmatePanel.hidden = false;
    if (data.status === 'ready' && data.image_url) {
      if (soulmateImage) {
        soulmateImage.hidden = false;
        soulmateImage.src = data.image_url;
      }
      setSoulmateStatus('');
      return true;
    }
    if (soulmateImage) soulmateImage.hidden = true;
    if (data.status === 'processing') {
      setSoulmateStatus('Your soulmate portrait is being prepared...');
      return true;
    }
    setSoulmateStatus('We are preparing your soulmate portrait.');
    await requestSoulmateGeneration();
    return true;
  } catch (error) {
    soulmatePanel.hidden = true;
    return false;
  }
};

const openSoulmateModal = async () => {
  if (!soulmateModal) return;
  openModal(soulmateModal);
  if (soulmatePanel) {
    soulmatePanel.hidden = false;
  }
  if (soulmateImage) {
    soulmateImage.hidden = true;
  }
  setSoulmateStatus('Loading your soulmate portrait...');
  const isReady = await loadSoulmate();
  if (!isReady) {
    closeModal(soulmateModal);
  }
};

const closeSoulmateModal = () => {
  if (!soulmateModal) return;
  closeModal(soulmateModal);
};

if (soulmateModal) {
  const closeTargets = soulmateModal.querySelectorAll('[data-soulmate-close]');
  closeTargets.forEach((target) => {
    target.addEventListener('click', closeSoulmateModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !soulmateModal.hidden) {
      closeSoulmateModal();
    }
  });
}

if (soulmateTriggers.length) {
  soulmateTriggers.forEach((trigger) => {
    trigger.addEventListener('click', openSoulmateModal);
  });
}

const refreshAuthUI = async () => {
  if (!authTrigger) return;
  if (window.location.pathname.startsWith('/auth')) return;
  if (window.location.pathname.startsWith('/forget-password')) return;
  if (window.location.pathname.startsWith('/reset-password')) return;
  if (!supabaseClient) {
    authTrigger.textContent = 'Sign in';
    authTrigger.disabled = true;
    setAuthStatus('Supabase keys are missing.');
    return;
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    const email = session.user.email || '';
    const fullName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      'Account';
    authTrigger.textContent = 'Account';
    authTrigger.classList.add('is-authenticated');
    if (authCard) authCard.classList.add('is-authenticated');
    if (authTitle) authTitle.textContent = 'Account';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      line.hidden = true;
    });
    setAuthStatus('');
    if (authDisplayName) {
      authDisplayName.hidden = false;
      authDisplayName.textContent = fullName;
    }
    if (authDisplayEmail) {
      authDisplayEmail.hidden = false;
      authDisplayEmail.textContent = email;
    }
    if (authSignOut) authSignOut.hidden = false;
    await syncServerSession(session.access_token);
    document.body.classList.remove('auth-locked');
    closeAuthModal();
    await loadSoulmate();
  } else {
    authTrigger.textContent = 'Sign in';
    authTrigger.classList.remove('is-authenticated');
    if (authCard) authCard.classList.remove('is-authenticated');
    if (authTitle) authTitle.textContent = 'Login your account';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      if (line.classList.contains('auth-switch--signup')) {
        line.hidden = true;
      }
      if (line.classList.contains('auth-switch--signin')) {
        line.hidden = false;
      }
    });
    if (authDisplayName) authDisplayName.hidden = true;
    if (authDisplayEmail) authDisplayEmail.hidden = true;
    setAuthStatus('');
    if (authSignOut) authSignOut.hidden = true;
    window.location.href = '/auth';
  }
};

const handleAuthRedirect = async () => {
  if (!supabaseClient) return;
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);

  if (url.searchParams.get('code')) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(currentUrl);
    if (!error) {
      window.history.replaceState({}, document.title, '/');
    }
    return;
  }

  if (window.location.hash.includes('access_token=')) {
    if (supabaseClient.auth.getSessionFromUrl) {
      await supabaseClient.auth.getSessionFromUrl();
    }
    window.history.replaceState({}, document.title, '/');
  }
};

const openAuthModal = () => {
  if (!authModal) {
    window.location.href = '/auth';
    return;
  }
  if (!authTrigger || !authTrigger.classList.contains('is-authenticated')) {
    window.location.href = '/auth';
    return;
  }
  setAuthStatus('');
  openModal(authModal);
};

const closeAuthModal = () => {
  if (!authModal) return;
  if (document.body.classList.contains('auth-locked')) return;
  closeModal(authModal);
};

if (authModal) {
  const closeTargets = authModal.querySelectorAll('[data-auth-close]');
  closeTargets.forEach((target) => {
    target.addEventListener('click', closeAuthModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !authModal.hidden) {
      closeAuthModal();
    }
  });
}

if (authTrigger) {
  authTrigger.addEventListener('click', openAuthModal);
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-auth-open]');
  if (!trigger) return;
  openAuthModal();
});

if (authForm) {
  let authAction = 'signin';
  const setMode = (mode) => {
    authAction = mode;
    const showName = mode === 'signup';
    if (authNameWrap) authNameWrap.hidden = !showName;
    if (authHint) authHint.hidden = !showName;
    if (authVerify) authVerify.hidden = true;
    if (authReset) authReset.hidden = true;
    if (authForm) authForm.hidden = false;
    if (!showName && authNameInput) authNameInput.value = '';
    if (authTitle) authTitle.textContent = showName ? 'Create an account' : 'Login your account';
    const submitBtn = authForm.querySelector('.auth-submit');
    if (submitBtn) submitBtn.textContent = showName ? 'Sign up' : 'Login';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      if (line.classList.contains('auth-switch--signup')) {
        line.hidden = !showName;
      }
      if (line.classList.contains('auth-switch--signin')) {
        line.hidden = showName;
      }
    });
  };

  setMode('signin');

  document.addEventListener('click', (event) => {
    const modeTarget = event.target.closest('[data-auth-mode]');
    if (!modeTarget) return;
    const mode = modeTarget.getAttribute('data-auth-mode');
    if (mode) setMode(mode);
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      setAuthStatus('Supabase keys are missing.');
      return;
    }

    const email = authEmailInput?.value.trim();
    const password = authPasswordInput?.value || '';
    const name = authNameInput?.value.trim() || '';
    if (!email || !password) {
      setAuthStatus('Enter a valid email and password.');
      return;
    }

    if (authAction === 'signup') {
      if (!name) {
        setAuthStatus('Enter your name to create an account.');
        return;
      }
      setAuthStatus('Creating your account...');
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: SUPABASE_REDIRECT,
        },
      });

      if (error) {
        setAuthStatus(error.message);
        return;
      }

      if (data?.session?.access_token) {
        await syncServerSession(data.session.access_token);
        return;
      }

      if (authVerifyEmail) authVerifyEmail.textContent = maskEmail(email);
      if (authVerify) authVerify.hidden = false;
      authForm.hidden = true;
      setAuthStatus('Check your email to confirm your account.');
      return;
    }

    setAuthStatus('Signing you in...');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    if (data?.session?.access_token) {
      await syncServerSession(data.session.access_token);
    }
  });
}

if (authForgot) {
  authForgot.addEventListener('click', () => {
    if (authReset) authReset.hidden = false;
    if (authVerify) authVerify.hidden = true;
    if (authForm) authForm.hidden = true;
    if (authHint) authHint.hidden = true;
    if (authTitle) authTitle.textContent = 'Reset your password';
  });
}

if (authSignOut) {
  authSignOut.addEventListener('click', async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/auth';
  });
}

if (supabaseClient) {
  handleAuthRedirect().then(refreshAuthUI);
  supabaseClient.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });
} else {
  refreshAuthUI();
}

document.querySelectorAll('[data-auth-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (!authPasswordInput) return;
    const isHidden = authPasswordInput.type === 'password';
    authPasswordInput.type = isHidden ? 'text' : 'password';
  });
});

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`;
};

if (authResend) {
  authResend.addEventListener('click', async () => {
    const email = authEmailInput?.value.trim();
    if (!email || !supabaseClient) return;
    setAuthStatus('Resending verification link...');
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: SUPABASE_REDIRECT },
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus('Verification link resent.');
  });
}

if (authResetSend) {
  authResetSend.addEventListener('click', async () => {
    const email = authResetEmail?.value.trim() || authEmailInput?.value.trim();
    if (!email || !supabaseClient) {
      setAuthStatus('Enter your email to reset the password.');
      return;
    }
    setAuthStatus('Sending reset link...');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: SUPABASE_REDIRECT,
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus('Password reset link sent. Check your email.');
  });
}

const preludeModal = document.getElementById('preludeModal');

const openPreludeModal = () => {
  openModal(preludeModal);
};

const closePreludeModal = () => {
  closeModal(preludeModal);
};

if (preludeModal) {
  const closeTargets = preludeModal.querySelectorAll('[data-modal-close]');
  closeTargets.forEach((target) => {
    target.addEventListener('click', closePreludeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !preludeModal.hidden) {
      closePreludeModal();
    }
  });

  const beginButton = document.getElementById('begin');
  if (beginButton) {
    beginButton.addEventListener('click', () => {
      if (!preludeModal.hidden) {
        closePreludeModal();
      }
    });
  }

  const hashView = window.location.hash.replace('#', '');
  if (!hashView || hashView === 'tarot') {
    openPreludeModal();
  }
}
}
