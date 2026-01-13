/**
 * Generate position-aware "Personalized interpretation" strings offline.
 *
 * Output:
 * - data/personalized_interpretations.generated.json (resume/cache)
 * - data/personalized_interpretations.generated.js   (browser-loadable)
 *
 * Usage:
 *   node scripts/generate_personalized_interpretations.js
 *   node scripts/generate_personalized_interpretations.js --resume
 *   node scripts/generate_personalized_interpretations.js --positions past,present,future
 *   node scripts/generate_personalized_interpretations.js --chunk 20
 *
 * Requires:
 *   OPENAI_API_KEY in .env or environment variables.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CARDS_JS_PATH = path.join(ROOT, 'data', 'cards.js');
const APP_JS_PATH = path.join(ROOT, 'app.js');
const OUT_JSON_PATH = path.join(ROOT, 'data', 'personalized_interpretations.generated.json');
const OUT_JS_PATH = path.join(ROOT, 'data', 'personalized_interpretations.generated.js');

// Minimal stop-word set for overlap checks (kept small & stable).
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'his',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'me',
  'my',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'she',
  'so',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'to',
  'too',
  'was',
  'were',
  'with',
  'you',
  'your',
]);

function parseArgs(argv) {
  const args = { resume: false, positions: null, chunk: 18, fixAdvice: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--resume') args.resume = true;
    else if (a === '--chunk') args.chunk = Number.parseInt(argv[++i], 10) || args.chunk;
    else if (a === '--positions') args.positions = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--fix-advice') args.fixAdvice = true;
  }
  return args;
}

function loadDotenv(dotenvPath) {
  if (!fs.existsSync(dotenvPath)) return;
  const text = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function slugifyPosition(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function shortenMeaning(text, max = 140) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function extractSpreadsFromAppJs(appJsText) {
  const startIdx = appJsText.indexOf('const SPREADS');
  if (startIdx === -1) throw new Error('Could not find SPREADS in app.js');
  const afterStart = appJsText.slice(startIdx);
  const endMarker = '\n};\n\nconst deckEl';
  const endIdx = afterStart.indexOf(endMarker);
  if (endIdx === -1) throw new Error('Could not locate end of SPREADS block in app.js');
  const block = afterStart.slice(0, endIdx + '\n};'.length);
  const code = `(function(){ ${block}\n return SPREADS; })()`;
  return vm.runInNewContext(code, {}, { timeout: 1000 });
}

function loadCardsFromCardsJs(cardsJsPath) {
  const text = fs.readFileSync(cardsJsPath, 'utf8');
  const context = { window: {} };
  vm.runInNewContext(text, context, { timeout: 2000 });
  const cards = context?.window?.TAROT_CARDS;
  if (!Array.isArray(cards) || !cards.length) {
    throw new Error(`Could not load window.TAROT_CARDS from ${cardsJsPath}`);
  }
  return cards;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openaiJson({ apiKey, model, messages }) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const maxAttempts = 6;
  const timeoutMs = 60_000;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages,
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        const retryable = [408, 409, 425, 429, 500, 502, 503, 504].includes(res.status);
        const err = new Error(`OpenAI error ${res.status}: ${text.slice(0, 600)}`);
        lastErr = err;
        if (!retryable || attempt === maxAttempts) throw err;

        const base = 600 * 2 ** (attempt - 1);
        const delay = Math.min(12000, base) + Math.floor(Math.random() * 250);
        console.warn(`  - OpenAI ${res.status} (attempt ${attempt}/${maxAttempts}); retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in response');
      return JSON.parse(content);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) throw err;
      const base = 600 * 2 ** (attempt - 1);
      const delay = Math.min(12000, base) + Math.floor(Math.random() * 250);
      console.warn(`  - OpenAI request failed (attempt ${attempt}/${maxAttempts}); retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastErr || new Error('OpenAI request failed');
}

/**
 * We ban "advice-y" / imperative coaching language.
 * Note: we DO NOT ban "pause" anymore, because it's legitimate tarot phrasing (e.g., Four of Swords).
 */
function looksAdvisory(text) {
  const t = String(text || '').toLowerCase();
  const banned = [
    /\bshould\b/,
    /\btry\b/,
    /\bconsider\b/,
    /\bfocus\b/,
    /\bremember\b/,
    /\bavoid\b/,
    /\bmake sure\b/,
    /\bit's time to\b/,
    /\byou can\b/,
    /\byou might\b/,
    /\bdo this\b/,
    /\bneed to\b/,
    /\bmust\b/,
  ];
  return banned.some((re) => re.test(t));
}

function normalizeForCompare(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text) {
  const tokens = normalizeForCompare(text)
    .split(' ')
    .filter(Boolean)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

function jaccard(a, b) {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (!aSet.size || !bSet.size) return 0;
  let inter = 0;
  for (const t of aSet) if (bSet.has(t)) inter += 1;
  const union = aSet.size + bSet.size - inter;
  return union ? inter / union : 0;
}

function hasNgramOverlap(a, b, n = 4) {
  const aTokens = normalizeForCompare(a).split(' ').filter(Boolean);
  const bTokens = normalizeForCompare(b).split(' ').filter(Boolean);
  if (aTokens.length < n || bTokens.length < n) return false;
  const grams = new Set();
  for (let i = 0; i <= aTokens.length - n; i += 1) {
    grams.add(aTokens.slice(i, i + n).join(' '));
  }
  for (let i = 0; i <= bTokens.length - n; i += 1) {
    if (grams.has(bTokens.slice(i, i + n).join(' '))) return true;
  }
  return false;
}

function looksDuplicative(generalMeaning, personalized) {
  const a = String(generalMeaning || '').trim();
  const b = String(personalized || '').trim();
  if (!a || !b) return false;

  // For very short meanings, allow overlap (hard to avoid).
  const aTokens = normalizeForCompare(a).split(' ').filter(Boolean);
  if (aTokens.length < 10) return false;

  // Strong signal: direct phrase overlap.
  if (hasNgramOverlap(a, b, 4)) return true;

  // Softer signal: high content-word overlap.
  return jaccard(a, b) >= 0.62;
}

/** Normalize label for mapping */
function normalizeLabel(label) {
  return String(label || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Explicit mapping for ALL known positions (Three, Horseshoe, Celtic Cross).
 * This avoids fuzzy heuristics and keeps behavior stable.
 */
const POSITION_ROLE_MAP = {
  past: {
    role: 'temporal_past',
    guidance:
      'Describe past influences or prior developments that shaped the current situation. Write in past tense. No advice.',
  },
  present: {
    role: 'temporal_present',
    guidance:
      'Describe the current state, dynamics, or conditions as they are now unfolding. Write in present tense. No advice.',
  },
  future: {
    role: 'temporal_future',
    guidance:
      'Describe a longer-term tendency or phase likely to unfold. Frame it as a continuation of what has already developed. No advice.',
  },
  'near future': {
    role: 'temporal_near_future',
    guidance:
      'Describe what is beginning to emerge or take shape in the near future. Keep it transitional, not final. No advice.',
  },
  hidden: {
    role: 'hidden_influence',
    guidance:
      'Describe influences, factors, or dynamics that are not immediately visible or consciously recognized.',
  },
  obstacles: {
    role: 'obstacle',
    guidance:
      'Describe resistance, blockage, or tension that complicates progress. Focus on the nature of the obstacle, not solutions.',
  },
  crossing: {
    role: 'crossing_influence',
    guidance:
      'Describe a force that intersects with or challenges the main situation, creating friction, contrast, or pressure.',
  },
  conscious: {
    role: 'conscious_mind',
    guidance:
      'Describe what is consciously understood, intended, or aimed for. Reflect awareness, goals, or deliberate focus.',
  },
  subconscious: {
    role: 'subconscious_layer',
    guidance:
      'Describe underlying motivations, instincts, or emotional patterns operating beneath conscious awareness.',
  },
  self: {
    role: 'self_position',
    guidance:
      'Describe the querent’s internal stance, attitude, or emotional posture toward the situation.',
  },
  environment: {
    role: 'environment',
    guidance:
      'Describe surrounding circumstances, people, or external conditions influencing the situation.',
  },
  external: {
    role: 'external_influence',
    guidance:
      'Describe outside forces, social dynamics, or external pressures acting upon the querent.',
  },
  'hopes & fears': {
    role: 'hopes_fears',
    guidance:
      'Describe emotional ambivalence, mixed expectations, or simultaneous hope and anxiety regarding outcomes.',
  },
  advice: {
    role: 'advice_symbolic',
    guidance:
      'Describe the underlying lesson, theme, or pattern revealed by the card WITHOUT giving advice or instructions.',
  },
  outcome: {
    role: 'outcome',
    guidance:
      'Describe the likely resolution or direction the situation moves toward if current dynamics remain unchanged.',
  },
};

function getPositionRole(label) {
  const key = normalizeLabel(label);
  if (POSITION_ROLE_MAP[key]) return POSITION_ROLE_MAP[key];
  return {
    role: 'generic',
    guidance: 'Describe how this card manifests in this specific position within the spread. No advice.',
  };
}

function writeOutputs(data) {
  fs.writeFileSync(OUT_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  const js = `// AUTO-GENERATED FILE. DO NOT EDIT BY HAND.\n// Generated by scripts/generate_personalized_interpretations.js\n\nwindow.PERSONALIZED_INTERPRETATIONS = ${JSON.stringify(
    data,
    null,
    2
  )};\n`;
  fs.writeFileSync(OUT_JS_PATH, js, 'utf8');
}

function unwrapMapping(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.interpretations && typeof result.interpretations === 'object') return result.interpretations;
  if (result.results && typeof result.results === 'object') return result.results;
  if (result.output && typeof result.output === 'object') return result.output;
  const keys = Object.keys(result);
  if (keys.length === 1) {
    const v = result[keys[0]];
    if (v && typeof v === 'object') return v;
  }
  return result;
}

const CARD_NAME_ALIASES = new Map([
  ['Fortitude', ['Strength']],
  ['Strength', ['Fortitude']],
  ['The Last Judgment', ['Judgement', 'Judgment', 'Last Judgment']],
  ['Judgement', ['The Last Judgment', 'Judgment']],
  ['Judgment', ['The Last Judgment', 'Judgement']],
]);

function getFromResult(result, cardName) {
  const mapping = unwrapMapping(result);
  if (!mapping || typeof mapping !== 'object') return null;

  const keys = Object.keys(mapping);
  const lowerKeyMap = new Map(keys.map((k) => [k.toLowerCase(), k]));

  const candidates = [];
  const add = (name) => {
    if (!name) return;
    const s = String(name).trim();
    if (!s) return;
    if (!candidates.includes(s)) candidates.push(s);
  };

  add(cardName);
  const withoutThe = cardName.replace(/^the\s+/i, '');
  if (withoutThe !== cardName) add(withoutThe);

  const aliases = CARD_NAME_ALIASES.get(cardName) || [];
  for (const a of aliases) {
    add(a);
    const aWithoutThe = String(a).replace(/^the\s+/i, '');
    if (aWithoutThe !== a) add(aWithoutThe);
  }

  for (const cand of candidates) {
    if (typeof mapping[cand] === 'string') return mapping[cand];
    const foundKey = lowerKeyMap.get(cand.toLowerCase());
    if (foundKey && typeof mapping[foundKey] === 'string') return mapping[foundKey];
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  loadDotenv(path.join(ROOT, '.env'));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY (set it in .env)');

  const deck = loadCardsFromCardsJs(CARDS_JS_PATH);
  const cards = deck.map((c) => ({
    name: c.name,
    type: c.arcana,
    // Use the same "General meaning" text as the UI (canonical, not shortened).
    meaning_up: String(c?.upright?.full || '').trim(),
  }));
  if (!cards.length) throw new Error('No cards found in data/cards.js');
  if (cards.some((c) => !c.meaning_up)) {
    const firstMissing = cards.find((c) => !c.meaning_up);
    throw new Error(`Missing upright.full for card: ${firstMissing?.name || '(unknown)'}`);
  }

  const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');
  const spreads = extractSpreadsFromAppJs(appJs);
  const labels = Object.values(spreads)
    .flatMap((spread) => spread.positions || [])
    .map((p) => p.label)
    .filter(Boolean);
  const uniqueLabels = Array.from(new Set(labels));

  const requested = args.positions
    ? uniqueLabels.filter((l) => args.positions.includes(slugifyPosition(l)) || args.positions.includes(l))
    : uniqueLabels;

  let data = {};
  if (args.resume && fs.existsSync(OUT_JSON_PATH)) {
    data = JSON.parse(fs.readFileSync(OUT_JSON_PATH, 'utf8'));
  }

  // Keep your model as-is; this will work fine with improved prompting.
  const model = 'gpt-4.1-mini';
  const chunkSize = Math.max(6, Math.min(30, args.chunk));

  console.log(`Cards: ${cards.length}`);
  console.log(`Positions: ${requested.length} (${requested.map(slugifyPosition).join(', ')})`);
  console.log(`Model: ${model}`);
  console.log(`Chunk size: ${chunkSize}`);
  console.log(`Resume: ${args.resume ? 'yes' : 'no'}`);
  console.log(`Fix advice: ${args.fixAdvice ? 'yes' : 'no'}`);
  console.log('');

  for (const positionLabel of requested) {
    const positionKey = slugifyPosition(positionLabel);
    if (!data[positionKey]) data[positionKey] = {};

    const roleInfo = getPositionRole(positionLabel);
    let safetyIters = 0;

    while (true) {
      const missingNow = cards.filter((c) => !data[positionKey][c.name]);
      if (!missingNow.length) {
        console.log(`[${positionKey}] done`);
        break;
      }
      if (safetyIters > 400) {
        throw new Error(`[${positionKey}] exceeded safety iteration limit; still missing ${missingNow.length}`);
      }
      safetyIters += 1;

      const batch = missingNow.slice(0, chunkSize);
      const batchSpec = batch.map((c) => ({
        name: c.name,
        arcana: c.type,
        generalMeaning: c.meaning_up,
      }));

      const sys = [
        'You write concise but narrative tarot interpretations for a web app.',
        'Interpretations must feel personal, contextual, and psychologically grounded.',
        'Each interpretation must match the semantic role of the card position.',
        'Explain WHY a state, tension, or phase exists — not just WHAT it is.',
        'Return ONLY valid JSON.',
        'Output format:',
        '- Return a SINGLE JSON object.',
        '- Top-level keys must be EXACTLY the provided card names.',
        '- Values must be the interpretation strings (no nesting, no extra keys).',
        'Constraints:',
        '- English.',
        '- 1–2 sentences (up to 3 only if necessary).',
        '- Second person.',
        '- Mention the card name exactly once.',
        '- STRICTLY match the requested position role/timeframe.',
        '- Where appropriate, subtly connect the interpretation to a preceding phase or outcome.',
        '- NO advice, NO imperatives, NO instructions.',
        '- Avoid coaching or self-help language.',
        '- Do NOT repeat or closely paraphrase the provided General meaning.',
        '- Do NOT copy phrases from General meaning (avoid reusing 4+ consecutive words).',
        '- The interpretation should add position-specific context, not restate the meaning.',
        '- Do not include extra keys beyond the requested mapping.',
      ].join('\n');

      const user = {
        positionLabel,
        positionRole: roleInfo.role,
        positionGuidance: roleInfo.guidance,
        cards: batchSpec,
        output: {
          format: 'JSON object mapping cardName -> interpretation string',
          example: {
            'Four of Swords':
              'The Four of Swords suggests that a quieter phase unfolds as a natural response to recent intensity. This period reflects withdrawal and recovery rather than an ending.',
          },
        },
      };

      const result = await openaiJson({
        apiKey,
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: JSON.stringify(user) },
        ],
      });

      for (const card of batch) {
        const text = getFromResult(result, card.name);
        if (!text || typeof text !== 'string') {
          console.warn(`  - Missing for "${card.name}"`);
          continue;
        }
        const cleaned = String(text).trim();
        data[positionKey][card.name] = cleaned;
        if (looksAdvisory(text)) {
          console.warn(`  - Advisory language detected: [${positionKey}] ${card.name}`);
        }
      }

      // Retry missing cards from this batch (usually caused by malformed/nested JSON or omitted keys).
      const missingInBatch = batch.filter((c) => !data[positionKey][c.name]);
      if (missingInBatch.length) {
        console.warn(`  - Retrying ${missingInBatch.length} missing cards in smaller batches...`);
        const retryChunk = Math.min(8, missingInBatch.length);
        for (let r = 0; r < missingInBatch.length; r += retryChunk) {
          const retryBatch = missingInBatch.slice(r, r + retryChunk);
          const retrySpec = retryBatch.map((c) => ({
            name: c.name,
            arcana: c.type,
            generalMeaning: c.meaning_up,
          }));
          const retryUser = { ...user, cards: retrySpec };
          const retryResult = await openaiJson({
            apiKey,
            model,
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: JSON.stringify(retryUser) },
            ],
          });
          for (const card of retryBatch) {
            const text = getFromResult(retryResult, card.name);
            if (!text || typeof text !== 'string') continue;
            data[positionKey][card.name] = String(text).trim();
          }
        }
      }

      // Rewrite entries that are too close to General meaning.
      const dupes = batch.filter((c) => looksDuplicative(c.meaning_up, data[positionKey][c.name]));
      if (dupes.length) {
        console.warn(`  - Found ${dupes.length} overly-similar interpretations; rewriting...`);
        const rewriteSpec = dupes.map((c) => ({
          name: c.name,
          arcana: c.type,
          generalMeaning: c.meaning_up,
          current: data[positionKey][c.name],
        }));

        const rewriteSys = [
          'You rewrite tarot interpretations for a web app.',
          'Return ONLY valid JSON.',
          'Rewrite each provided interpretation so it is clearly DISTINCT from the provided General meaning.',
          'Output format:',
          '- Return a SINGLE JSON object.',
          '- Top-level keys must be EXACTLY the provided card names.',
          '- Values must be the rewritten interpretation strings (no nesting, no extra keys).',
          'Constraints:',
          '- English.',
          '- 1–2 sentences.',
          '- Second person.',
          '- Mention the card name exactly once.',
          '- STRICTLY match the requested position role/timeframe.',
          '- NO advice/imperatives/instructions; avoid coaching language.',
          '- Do NOT repeat or closely paraphrase the General meaning.',
          '- Do NOT reuse 4+ consecutive words from General meaning.',
          '- Keep the meaning consistent, but add position-specific context.',
          '- Do not include extra keys.',
        ].join('\n');

        const rewriteUser = {
          positionLabel,
          positionRole: roleInfo.role,
          positionGuidance: roleInfo.guidance,
          cards: rewriteSpec,
          output: { format: 'JSON object mapping cardName -> rewritten interpretation string' },
        };

        const rewritten = await openaiJson({
          apiKey,
          model,
          messages: [
            { role: 'system', content: rewriteSys },
            { role: 'user', content: JSON.stringify(rewriteUser) },
          ],
        });

        for (const card of dupes) {
          const text = getFromResult(rewritten, card.name);
          if (!text || typeof text !== 'string') continue;
          data[positionKey][card.name] = String(text).trim();
        }
      }

      writeOutputs(data);
      console.log(`  wrote ${positionKey}: ${Object.keys(data[positionKey]).length}/${cards.length}`);
    }
  }

  if (args.fixAdvice) {
    console.log('\nFixing advisory entries...');
    for (const positionLabel of requested) {
      const positionKey = slugifyPosition(positionLabel);
      const roleInfo = getPositionRole(positionLabel);
      const byPos = data[positionKey] || {};
      const flagged = cards.filter((c) => byPos[c.name] && looksAdvisory(byPos[c.name]));
      if (!flagged.length) continue;

      console.log(`[${positionKey}] role=${roleInfo.role} flagged ${flagged.length}`);

      for (let i = 0; i < flagged.length; i += chunkSize) {
        const batch = flagged.slice(i, i + chunkSize);
        const batchSpec = batch.map((c) => ({
          name: c.name,
          arcana: c.type,
          generalMeaning: c.meaning_up,
          current: byPos[c.name],
        }));

        const sys = [
          'You rewrite tarot interpretations for a web app.',
          'Return ONLY valid JSON.',
          'Rewrite each provided interpretation to satisfy constraints:',
          'Output format:',
          '- Return a SINGLE JSON object.',
          '- Top-level keys must be EXACTLY the provided card names.',
          '- Values must be the rewritten interpretation strings (no nesting, no extra keys).',
          '- English.',
          '- 1–2 sentences.',
          '- Second person.',
          '- Mention the card name exactly once.',
          '- STRICTLY match the requested position role/timeframe.',
          '- Remove ALL advice/imperatives/instructions; avoid coaching language.',
          '- Keep the meaning consistent with the General meaning.',
          '- Do NOT repeat or closely paraphrase the provided General meaning.',
          '- Do not include extra keys.',
        ].join('\n');

        const user = {
          positionLabel,
          positionRole: roleInfo.role,
          positionGuidance: roleInfo.guidance,
          cards: batchSpec,
          output: { format: 'JSON object mapping cardName -> rewritten interpretation string' },
        };

        const result = await openaiJson({
          apiKey,
          model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: JSON.stringify(user) },
          ],
        });

        for (const card of batch) {
          const text = getFromResult(result, card.name);
          if (!text || typeof text !== 'string') continue;
          byPos[card.name] = String(text).trim();
        }

        data[positionKey] = byPos;
        writeOutputs(data);
      }
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});