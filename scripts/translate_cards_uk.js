#!/usr/bin/env node
'use strict';

/**
 * Translate selected card fields in data/cards.uk.js from data/cards.js
 * using the OpenAI Responses API in batches.
 *
 * Fields translated:
 * - scene
 * - upright.full (General Interpretation)
 * - reversed.full (if enabled)
 * - upright.personalized_interpretation
 * - reversed.personalized_interpretation (if enabled)
 *
 * Requires OPENAI_API_KEY from .env or environment variables.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const CARDS_JS_PATH = path.join(ROOT, 'data', 'cards.js');
const CARDS_UK_PATH = path.join(ROOT, 'data', 'cards.uk.js');
const CACHE_PATH = path.join(ROOT, 'data', 'translate_cache_uk.json');

function parseArgs(argv) {
  const args = {
    model: 'gpt-4o-mini',
    lang: 'uk',
    batchSize: 12,
    batchChars: 8000,
    sleep: 0.2,
    includeReversed: true,
    limit: 0,
    apply: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--model') args.model = argv[++i] || args.model;
    else if (a === '--lang') args.lang = argv[++i] || args.lang;
    else if (a === '--batch-size') args.batchSize = Number(argv[++i] || args.batchSize);
    else if (a === '--batch-chars') args.batchChars = Number(argv[++i] || args.batchChars);
    else if (a === '--sleep') args.sleep = Number(argv[++i] || args.sleep);
    else if (a === '--limit') args.limit = Number(argv[++i] || 0);
    else if (a === '--no-reversed') args.includeReversed = false;
    else if (a === '--dry-run') args.apply = false;
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
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function loadCardsFromJs(filePath, varName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const context = { window: {} };
  vm.runInNewContext(text, context, { timeout: 2000 });
  const value = context?.window?.[varName];
  if (!value) {
    throw new Error(`Could not load window.${varName} from ${filePath}`);
  }
  return value;
}

function hashText(text) {
  return crypto.createHash('sha1').update(String(text || ''), 'utf8').digest('hex').slice(0, 12);
}

function buildJobs(cards, includeReversed, limit) {
  const jobs = [];
  let count = 0;

  const addItem = (id, field, index, text) => {
    if (typeof text !== 'string' || text.length === 0) return;
    jobs.push({ id, field, index: Number.isInteger(index) ? index : null, text });
  };

  for (const card of cards) {
    if (limit && count >= limit) break;
    const id = card?.id;
    if (!id) continue;

    addItem(id, 'scene', null, card.scene || '');

    const upright = card.upright || {};
    const upPi = upright.personalized_interpretation || [];
    addItem(id, 'upright.full', null, upright.full || '');
    for (let i = 0; i < upPi.length; i += 1) addItem(id, 'upright.personalized_interpretation', i, upPi[i]);

    if (includeReversed) {
      const reversed = card.reversed || {};
      const revPi = reversed.personalized_interpretation || [];
      addItem(id, 'reversed.full', null, reversed.full || '');
      for (let i = 0; i < revPi.length; i += 1) addItem(id, 'reversed.personalized_interpretation', i, revPi[i]);
    }

    count += 1;
  }

  return jobs;
}

function chunkJobs(jobs, maxItems, maxChars) {
  const batches = [];
  let current = [];
  let chars = 0;

  for (const job of jobs) {
    const size = String(job.text || '').length;
    const overflow = current.length >= maxItems || (chars + size > maxChars && current.length > 0);
    if (overflow) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(job);
    chars += size;
  }

  if (current.length) batches.push(current);
  return batches;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOutputText(response) {
  if (typeof response?.output_text === 'string' && response.output_text) return response.output_text;
  const output = response?.output || [];
  for (const item of output) {
    if (item?.type !== 'message') continue;
    const content = item?.content || [];
    for (const part of content) {
      if (part?.type === 'output_text') return part?.text || '';
    }
  }
  throw new Error('No output_text found in Responses API response');
}

async function openaiTranslate({ apiKey, model, lang, items }) {
  const system = [
    'You are a professional translator.',
    'Translate from English to Ukrainian.',
    'Use formal second-person address (formal "you").',
    'Do not add, remove, or summarize content.',
    'Preserve sentence count and punctuation as closely as possible.',
    'Keep card names in English if they appear.',
    'Return JSON only that matches the schema.',
  ].join('\n');

  const payload = {
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ targetLanguage: lang, items }) },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'translations',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  field: { type: 'string' },
                  index: { type: ['integer', 'null'] },
                  text: { type: 'string' },
                },
                required: ['id', 'field', 'index', 'text'],
              },
            },
          },
          required: ['items'],
        },
      },
    },
    temperature: 0.2,
  };

  const url = 'https://api.openai.com/v1/responses';
  const maxAttempts = 6;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        const retryable = [408, 409, 425, 429, 500, 502, 503, 504].includes(res.status);
        const err = new Error(`OpenAI error ${res.status}: ${text.slice(0, 600)}`);
        lastErr = err;
        if (!retryable || attempt === maxAttempts) throw err;
        const delay = Math.min(12000, 600 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
        console.warn(`  - OpenAI ${res.status} (attempt ${attempt}/${maxAttempts}); retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      const data = await res.json();
      const text = extractOutputText(data);
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) throw err;
      const delay = Math.min(12000, 600 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
      console.warn(`  - OpenAI request failed (attempt ${attempt}/${maxAttempts}); retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastErr || new Error('OpenAI request failed');
}

function applyTranslation(ukCards, item, text) {
  const card = ukCards[item.id] || (ukCards[item.id] = { upright: {}, reversed: {} });
  const index = Number.isInteger(item.index) ? item.index : null;

  if (item.field === 'scene') {
    card.scene = text;
    return;
  }

  if (item.field === 'upright.full') {
    card.upright = card.upright || {};
    card.upright.full = text;
    return;
  }

  if (item.field === 'reversed.full') {
    card.reversed = card.reversed || {};
    card.reversed.full = text;
    return;
  }

  if (item.field === 'upright.personalized_interpretation') {
    card.upright = card.upright || {};
    const arr = Array.isArray(card.upright.personalized_interpretation)
      ? card.upright.personalized_interpretation
      : [];
    while (arr.length <= index) arr.push('');
    arr[index] = text;
    card.upright.personalized_interpretation = arr;
    return;
  }

  if (item.field === 'reversed.personalized_interpretation') {
    card.reversed = card.reversed || {};
    const arr = Array.isArray(card.reversed.personalized_interpretation)
      ? card.reversed.personalized_interpretation
      : [];
    while (arr.length <= index) arr.push('');
    arr[index] = text;
    card.reversed.personalized_interpretation = arr;
  }
}

function writeCardsUkFile(filePath, ukCards) {
  let prefix = '(() => {\n';
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    const marker = 'window.TAROT_CARDS_UK';
    const idx = current.indexOf(marker);
    if (idx !== -1) {
      prefix = current.slice(0, idx);
    }
  }

  const body = `window.TAROT_CARDS_UK = ${JSON.stringify(ukCards, null, 2)};\n})();\n`;
  fs.writeFileSync(filePath, `${prefix}${body}`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  loadDotenv(path.join(ROOT, '.env'));

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY (set in .env or environment).');
  }

  const enCards = loadCardsFromJs(CARDS_JS_PATH, 'TAROT_CARDS');
  const ukCards = loadCardsFromJs(CARDS_UK_PATH, 'TAROT_CARDS_UK');

  const jobs = buildJobs(enCards, args.includeReversed, args.limit);
  if (!jobs.length) {
    console.log('No jobs found. Nothing to translate.');
    return;
  }

  const cache = fs.existsSync(CACHE_PATH)
    ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
    : {};

  const pending = [];
  for (const job of jobs) {
    const key = `${args.lang}:${job.id}:${job.field}:${job.index ?? 'null'}:${hashText(job.text)}`;
    if (cache[key]) {
      applyTranslation(ukCards, job, cache[key]);
    } else {
      pending.push({ job, key });
    }
  }

  if (!pending.length) {
    console.log('All items found in cache. No API calls needed.');
  } else {
    const batches = chunkJobs(
      pending.map((p) => p.job),
      args.batchSize,
      args.batchChars
    );

    console.log(`Translating ${pending.length} items in ${batches.length} batches...`);
    let batchIndex = 0;
    for (const batch of batches) {
      batchIndex += 1;
      console.log(`- Batch ${batchIndex}/${batches.length} (${batch.length} items)`);
      const result = await openaiTranslate({
        apiKey,
        model: args.model,
        lang: args.lang,
        items: batch,
      });

      const lookup = new Map();
      for (const item of result.items || []) {
        const key = `${item.id}:${item.field}:${item.index ?? 'null'}`;
        lookup.set(key, item.text);
      }

      for (const job of batch) {
        const lookupKey = `${job.id}:${job.field}:${job.index ?? 'null'}`;
        const translated = lookup.get(lookupKey);
        if (!translated) {
          throw new Error(`Missing translation for ${lookupKey}`);
        }
        const cacheKey = `${args.lang}:${job.id}:${job.field}:${job.index ?? 'null'}:${hashText(job.text)}`;
        cache[cacheKey] = translated;
        applyTranslation(ukCards, job, translated);
      }

      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
      if (args.sleep) await sleep(args.sleep * 1000);
    }
  }

  if (args.apply) {
    writeCardsUkFile(CARDS_UK_PATH, ukCards);
    console.log(`Wrote translated fields to ${CARDS_UK_PATH}`);
  } else {
    console.log('Dry run complete (no file written).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
