const fs = require('node:fs/promises');
const path = require('node:path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets', 'cards');

const majors = [
  { num: 0, name: 'The Fool', file: 'RWS Tarot 00 Fool.jpg' },
  { num: 1, name: 'The Magician', file: 'RWS Tarot 01 Magician.jpg' },
  { num: 2, name: 'The High Priestess', file: 'RWS Tarot 02 High Priestess.jpg' },
  { num: 3, name: 'The Empress', file: 'RWS Tarot 03 Empress.jpg' },
  { num: 4, name: 'The Emperor', file: 'RWS Tarot 04 Emperor.jpg' },
  { num: 5, name: 'The Hierophant', file: 'RWS Tarot 05 Hierophant.jpg' },
  { num: 6, name: 'The Lovers', file: 'RWS Tarot 06 Lovers.jpg' },
  { num: 7, name: 'The Chariot', file: 'RWS Tarot 07 Chariot.jpg' },
  { num: 8, name: 'Strength', file: 'RWS Tarot 08 Strength.jpg' },
  { num: 9, name: 'The Hermit', file: 'RWS Tarot 09 Hermit.jpg' },
  { num: 10, name: 'Wheel of Fortune', file: 'RWS Tarot 10 Wheel of Fortune.jpg' },
  { num: 11, name: 'Justice', file: 'RWS Tarot 11 Justice.jpg' },
  { num: 12, name: 'The Hanged Man', file: 'RWS Tarot 12 Hanged Man.jpg' },
  { num: 13, name: 'Death', file: 'RWS Tarot 13 Death.jpg' },
  { num: 14, name: 'Temperance', file: 'RWS Tarot 14 Temperance.jpg' },
  { num: 15, name: 'The Devil', file: 'RWS Tarot 15 Devil.jpg' },
  { num: 16, name: 'The Tower', file: 'RWS Tarot 16 Tower.jpg' },
  { num: 17, name: 'The Star', file: 'RWS Tarot 17 Star.jpg' },
  { num: 18, name: 'The Moon', file: 'RWS Tarot 18 Moon.jpg' },
  { num: 19, name: 'The Sun', file: 'RWS Tarot 19 Sun.jpg' },
  { num: 20, name: 'Judgement', file: 'RWS Tarot 20 Judgement.jpg' },
  { num: 21, name: 'The World', file: 'RWS Tarot 21 World.jpg' },
];

const suits = [
  {
    suit: 'Wands',
    prefix: 'Wands',
    specials: { 9: 'Tarot Nine of Wands.jpg' },
  },
  {
    suit: 'Cups',
    prefix: 'Cups',
    specials: {},
  },
  {
    suit: 'Swords',
    prefix: 'Swords',
    specials: {},
  },
  {
    suit: 'Pentacles',
    prefix: 'Pents',
    specials: {},
  },
];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(fileName, outputName, attempt = 1) {
  const outputPath = path.join(OUTPUT_DIR, outputName);
  try {
    await fs.access(outputPath);
    return outputName;
  } catch {
    // continue downloading
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429 && attempt <= 8) {
      const delay = 1000 * attempt;
      await sleep(delay);
      return downloadFile(fileName, outputName, attempt + 1);
    }
    throw new Error(`Failed to download ${fileName}: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(OUTPUT_DIR, outputName), buffer);
  return outputName;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const downloads = [];

  for (const card of majors) {
    const output = `major-${pad2(card.num)}-${slugify(card.name)}.jpg`;
    downloads.push(() => downloadFile(card.file, output));
  }

  for (const suit of suits) {
    for (let i = 1; i <= 14; i += 1) {
      const special = suit.specials[i];
      const fileName = special || `${suit.prefix}${pad2(i)}.jpg`;
      const rankName = i === 1 ? 'Ace'
        : i === 11 ? 'Page'
        : i === 12 ? 'Knight'
        : i === 13 ? 'Queen'
        : i === 14 ? 'King'
        : String(i);

      const output = `${suit.suit.toLowerCase()}-${pad2(i)}-${slugify(rankName)}.jpg`;
      downloads.push(() => downloadFile(fileName, output));
    }
  }

  const concurrency = 1;
  let index = 0;
  let completed = 0;

  async function runNext() {
    while (index < downloads.length) {
      const current = index;
      index += 1;
      await downloads[current]();
      await sleep(500);
      completed += 1;
      if (completed % 10 === 0 || completed === downloads.length) {
        console.log(`Downloaded ${completed}/${downloads.length}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => runNext());
  await Promise.all(workers);
  console.log('Downloaded', downloads.length, 'cards to', OUTPUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
