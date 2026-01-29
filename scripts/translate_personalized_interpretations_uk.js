#!/usr/bin/env node
'use strict';

/**
 * Translate position-based personalized interpretations into Ukrainian.
 *
 * Source: data/personalized_interpretations.generated.js
 * Target: data/personalized_interpretations.uk.js (window.PERSONALIZED_INTERPRETATIONS_UK)
 *
 * Requires OPENAI_API_KEY in .env or environment variables.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC_PATH = path.join(ROOT, 'data', 'personalized_interpretations.generated.js');
const DEST_PATH = path.join(ROOT, 'data', 'personalized_interpretations.uk.js');
const CACHE_PATH = path.join(ROOT, 'data', 'translate_personalized_cache_uk.json');

function parseArgs(argv) {
  const args = {
    model: 'gpt-4o-mini',
    lang: 'uk',
    batchSize: 20,
    batchChars: 8000,
    sleep: 0.2,
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

function loadWindowVar(filePath, varName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const context = { window: {} };
  vm.runInNewContext(text, context, { timeout: 2000 });
  return context?.window?.[varName] || {};
}

function hashText(text) {
  return crypto.createHash('sha1').update(String(text || ''), 'utf8').digest('hex').slice(0, 12);
}

function flattenEntries(source, limit) {
  const items = [];
  let count = 0;
  for (const position of Object.keys(source || {})) {
    const byCard = source[position] || {};
    for (const cardName of Object.keys(byCard)) {
      const text = byCard[cardName];
      if (!text || typeof text !== 'string') continue;
      const key = `${position}||${cardName}`;
      items.push({ key, position, card: cardName, text });
      count += 1;
      if (limit && count >= limit) return items;
    }
  }
  return items;
}

function chunkItems(items, maxItems, maxChars) {
  const batches = [];
  let current = [];
  let chars = 0;

  for (const item of items) {
    const size = String(item.text || '').length;
    const overflow = current.length >= maxItems || (chars + size > maxChars && current.length > 0);
    if (overflow) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(item);
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
    'Echo each item "key" exactly as provided (do not translate or change it).',
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
                  key: { type: 'string' },
                  text: { type: 'string' },
                },
                required: ['key', 'text'],
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

function normalizeKey(value) {
  return String(value || '').toLowerCase();
}

function mergeTranslations(target, items) {
  for (const item of items) {
    if (!item || !item.position || !item.card) continue;
    if (!target[item.position]) target[item.position] = {};
    target[item.position][item.card] = item.text || '';
  }
}

function writeUkFile(filePath, ukData) {
  let prefix = '(() => {\n';
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    const marker = 'window.PERSONALIZED_INTERPRETATIONS_UK';
    const idx = current.indexOf(marker);
    if (idx !== -1) prefix = current.slice(0, idx);
  }

  const body = `window.PERSONALIZED_INTERPRETATIONS_UK = ${JSON.stringify(ukData, null, 2)};\n})();\n`;
  fs.writeFileSync(filePath, `${prefix}${body}`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  loadDotenv(path.join(ROOT, '.env'));

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY (set in .env or environment).');

  const source = loadWindowVar(SRC_PATH, 'PERSONALIZED_INTERPRETATIONS');
  const target = loadWindowVar(DEST_PATH, 'PERSONALIZED_INTERPRETATIONS_UK');

  const items = flattenEntries(source, args.limit);
  if (!items.length) {
    console.log('No personalized interpretations found.');
    return;
  }

  const cache = fs.existsSync(CACHE_PATH)
    ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
    : {};

  const pending = [];
  for (const item of items) {
    const key = `${args.lang}:${item.position}:${item.card}:${hashText(item.text)}`;
    if (cache[key]) {
      mergeTranslations(target, [{ position: item.position, card: item.card, text: cache[key] }]);
    } else {
      pending.push({ item, key });
    }
  }

  if (!pending.length) {
    console.log('All items found in cache. No API calls needed.');
  } else {
    const batches = chunkItems(
      pending.map((p) => p.item),
      args.batchSize,
      args.batchChars
    );

    console.log(`Translating ${pending.length} items in ${batches.length} batches...`);
    let batchIndex = 0;
    for (const batch of batches) {
      batchIndex += 1;
      console.log(`- Batch ${batchIndex}/${batches.length} (${batch.length} items)`);
      const translatedMap = new Map();
      let missing = batch.slice();
      let attempts = 0;

      while (missing.length > 0 && attempts < 3) {
        attempts += 1;
        const result = await openaiTranslate({
          apiKey,
          model: args.model,
          lang: args.lang,
          items: missing,
        });

        for (const item of result.items || []) {
          const key = normalizeKey(item.key);
          if (item.text) translatedMap.set(key, item.text);
        }

        missing = missing.filter((item) => !translatedMap.has(normalizeKey(item.key)));
        if (missing.length > 0 && attempts < 3) {
          console.warn(`  - Missing ${missing.length} items, retrying subset...`);
          await sleep(400);
        }
      }

      if (missing.length > 0) {
        const sample = missing
          .slice(0, 5)
          .map((i) => i.key)
          .join(', ');
        throw new Error(`Missing translation for ${sample}${missing.length > 5 ? '…' : ''}`);
      }

      for (const item of batch) {
        const key = normalizeKey(item.key);
        const translated = translatedMap.get(key);
        const cacheKey = `${args.lang}:${item.position}:${item.card}:${hashText(item.text)}`;
        cache[cacheKey] = translated;
        mergeTranslations(target, [{ position: item.position, card: item.card, text: translated }]);
      }

      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
      if (args.sleep) await sleep(args.sleep * 1000);
    }
  }

  if (args.apply) {
    writeUkFile(DEST_PATH, target);
    console.log(`Wrote Ukrainian personalized interpretations to ${DEST_PATH}`);
  } else {
    console.log('Dry run complete (no file written).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
