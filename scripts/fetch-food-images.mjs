import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const UPLOADS_DIR = fileURLToPath(new URL('../uploads/', import.meta.url));
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const env = (() => {
  const out = { DB_HOST: '127.0.0.1', DB_USER: 'root', DB_PASSWORD: '', DB_NAME: 'gidieats' };
  if (fs.existsSync(new URL('../.env', import.meta.url))) {
    const text = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
})();

const BAD_WORDS = ['map', 'diagram', 'illustration', 'logo', 'flag', 'chart', 'poster', 'icon', 'drawing', 'cartoon', 'symbol', 'anime', 'cosplay', 'statue', 'coin', 'stamp', 'banknote', 'selfie', 'blueprint', 'texture'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const cache = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const API_MIN_INTERVAL = 650;
let lastApiAt = 0;

async function throttle() {
  const wait = Math.max(0, lastApiAt + API_MIN_INTERVAL - Date.now());
  if (wait) await sleep(wait);
  lastApiAt = Date.now();
}

async function findImage(query, must = []) {
  const key = query + '|' + must.join(',');
  if (cache.has(key)) return cache.get(key);
  let attempt = 0;
  let lastErr = null;
  while (attempt < 6) {
    try {
      await throttle();
      const url =
        'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
        `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=15&maxlag=15` +
        '&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=900';
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'GidiEatsDev/1.0 (demo image fetch; contact: dev@gidieats.ng)' }
      });
      if (res.status === 429) {
        const wait = 1000 * 2 ** attempt + 3000;
        lastErr = new Error(`429 (retrying in ${wait}ms)`);
        await sleep(wait);
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      const candidates = Object.values(pages)
        .filter((p) => p.imageinfo?.[0])
        .map((p) => ({ title: p.title, info: p.imageinfo[0] }))
        .filter(({ info }) => ALLOWED_MIME.includes(info.mime) && info.size >= 25000 && info.thumburl)
        .filter(({ title }) => !BAD_WORDS.some((w) => title.toLowerCase().includes(w)))
        .filter(({ title }) => must.every((t) => title.toLowerCase().includes(t)));
      const best = candidates[0] ?? null;
      cache.set(key, best);
      return best;
    } catch (e) {
      lastErr = e;
      attempt++;
      await sleep(500 * attempt);
    }
  }
  console.warn(`  !! search failed for "${query}": ${lastErr?.message ?? 'unknown'}`);
  cache.set(key, null);
  return null;
}

async function fetchBytes(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { 'User-Agent': 'GidiEatsDev/1.0 (demo image fetch; contact: dev@gidieats.ng)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('file too small');
  return buf;
}

function slugify(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function ensureImage(name, query, must = []) {
  const slug = slugify(name);
  const file = path.join(UPLOADS_DIR, `${slug}.jpg`);
  if (fs.existsSync(file)) return { file, slug };

  const hit = await findImage(query, must);
  if (!hit) {
    console.warn(`  !! no image found for "${name}" -> keeping placeholder`);
    return { file: null, slug };
  }
  const bytes = await fetchBytes(hit.info.thumburl);
  fs.writeFileSync(file, bytes);
  console.log(`  ok  ${name}  <=  ${hit.title}`);
  return { file, slug };
}

const FOOD_QUERIES = {
  'Chicken Jollof Rice': { q: 'Jollof rice', must: ['jollof'] },
  'Nigeria Fried Rice': { q: 'Nigerian fried rice', must: ['fried rice'] },
  'Ofada Rice & Ayamase': { q: 'Ayamase sauce', must: ['ayamase'] },
  'Coconut Rice': { q: 'coconut rice', must: ['rice'] },
  'White Rice & Stew': { q: 'Nigerian white rice stew', must: ['rice'] },
  'Amala & Ewedu with Beef': { q: 'amala ewedu', must: ['amala'] },
  'Egusi Soup & Pounded Yam': { q: 'egusi soup', must: ['egusi', 'soup'] },
  'Oha Soup with Semo': { q: 'oha soup', must: ['oha'] },
  'Efo Riro & Eba': { q: 'efo riro', must: ['efo'] },
  'Moi Moi (2 pieces)': { q: 'moi moi', must: ['moi'] },
  'Asun (500g)': { q: 'asun', must: ['asun'] },
  'Boiled Plantain & Sauce': { q: 'boiled plantain', must: ['plantain'] },
  'Nkwobi (300g)': { q: 'nkwobi', must: ['nkwobi'] },
  'Suya (10 pcs)': { q: 'suya kebab', must: ['suya'] },
  'Chicken Suya (6 pcs)': { q: 'chicken suya', must: ['suya'] },
  'Kilishi (100g)': { q: 'kilishi', must: ['kilishi'] },
  'Grilled Peppered Chicken Quarter': { q: 'peppered chicken', must: ['chicken'] },
  'Smoke Grilled Croaker': { q: 'croaker fish', must: ['croaker'] },
  'Grilled Tilapia & Chips': { q: 'grilled tilapia', must: ['tilapia'] },
  'Pepper Soup & Bread': { q: 'Nigerian pepper soup', must: ['pepper soup'] },
  'Grilled Sausages (4 pcs)': { q: 'grilled sausages', must: ['sausage'] },
  'Coleslaw Bowl': { q: 'coleslaw', must: ['coleslaw'] },
  'Ponmo (Cow Skin)': { q: 'ponmo', must: ['ponmo'] },
  'Efo Riro Rice Plate': { q: 'efo riro', must: ['efo'] },
  'Beef Pizza (Large)': { q: 'pizza', must: ['pizza'] },
  'Chicken Pizza (Large)': { q: 'chicken pizza', must: ['pizza'] },
  'Pepperoni Pizza (Large)': { q: 'pepperoni pizza', must: ['pepperoni'] },
  'Veggie Pizza (Medium)': { q: 'vegetarian pizza', must: ['vegetarian'] },
  'Margherita Pizza (Medium)': { q: 'margherita pizza', must: ['margherita'] },
  'Spaghetti Bolognese': { q: 'spaghetti bolognese', must: ['spaghetti'] },
  'Penne Alfredo': { q: 'fettuccine alfredo', must: ['fettuccine'] },
  'Garlic Bread': { q: 'garlic bread', must: ['garlic'] },
  'Chicken Wings (6 pc)': { q: 'chicken wings', must: ['wings'] },
  'Tiramisu': { q: 'tiramisu', must: ['tiramisu'] },
  'Strawberry Milkshake': { q: 'strawberry milkshake', must: ['milkshake'] },
  'Classic Beef Burger': { q: 'hamburger', must: ['burger'] },
  'Cheese Burger': { q: 'cheeseburger', must: ['cheese'] },
  'BBQ Chicken Burger': { q: 'chicken burger', must: ['burger'] },
  'Spicy Double Burger': { q: 'burger', must: ['burger'] },
  'Veggie Burger': { q: 'vegetarian burger', must: ['vegetarian'] },
  'Large Fries': { q: 'french fries', must: ['fries'] },
  'Loaded Fries': { q: 'loaded fries', must: ['fries'] },
  'Chicken Nuggets (8 pc)': { q: 'chicken nuggets', must: ['nugget'] },
  'Onion Rings': { q: 'onion rings', must: ['onion'] },
  'Vanilla Shake': { q: 'milkshake', must: ['milkshake'] },
  'Chocolate Shake': { q: 'chocolate milkshake', must: ['milkshake'] },
  'Sundae': { q: 'sundae', must: ['sundae'] },
  'Chicken Shawarma': { q: 'chicken shawarma', must: ['shawarma'] },
  'Beef Shawarma': { q: 'beef shawarma', must: ['shawarma'] },
  'Mixed Shawarma': { q: 'shawarma', must: ['shawarma'] },
  'Chicken Wrap': { q: 'chicken wrap', must: ['wrap'] },
  'Tofu Shawarma': { q: 'tofu', must: ['tofu'] },
  'Mango Smoothie': { q: 'mango smoothie', must: ['mango'] },
  'Watermelon Juice': { q: 'watermelon juice', must: ['watermelon'] },
  'Chapman': { q: 'chapman drink', must: ['chapman', 'drink'] },
  'Zobo': { q: 'hibiscus drink', must: ['hibiscus', 'drink'] },
  'Spring Rolls (6 pc)': { q: 'spring rolls', must: ['spring roll'] },
  'Samosa (4 pc)': { q: 'samosa', must: ['samosa'] },
  'Doughnut (2 pc)': { q: 'doughnuts', must: ['doughnut'] }
};

const RESTAURANT_QUERIES = {
  'Pecancity Restaurant & Game Lounge': { q: 'jollof rice', must: ['jollof'] },
  'B-B Treats': { q: 'fried chicken french fries', must: ['chicken'] },
  'The Cooks Restaurant': { q: 'african food', must: ['food'] },
  'TAYBAH Restaurant': { q: 'shawarma kebab', must: ['shawarma'] },
  'Frenchies Restaurant': { q: 'pizza', must: ['pizza'] },
  'Anisa Restaurant and Lounge': { q: 'burger', must: ['burger'] },
  'KFC Kabuga (BUK / Kano 2)': { q: 'fried chicken', must: ['chicken'] },
  'Royal Taste Restaurant': { q: 'beef kebab suya', must: ['kebab'] },
  'Dee_Royale Eatery N Restaurant': { q: 'fried rice chicken', must: ['rice'] },
  'Katforex Restaurant': { q: 'chicken wings', must: ['wings'] }
};

async function main() {
  const db = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
  });

  console.log('\n== Food items ==');
  const [items] = await db.query('SELECT id, name FROM food_items');
  let updatedFood = 0;
  for (const row of items) {
    const spec = FOOD_QUERIES[row.name];
    if (!spec) {
      console.warn(`  -- no query mapped for "${row.name}"`);
      continue;
    }
    try {
      const { file, slug } = await ensureImage(row.name, spec.q, spec.must);
      if (file) {
        await db.query('UPDATE food_items SET image = ? WHERE id = ?', [`/uploads/${slug}.jpg`, row.id]);
        updatedFood++;
      }
    } catch (e) {
      console.warn(`  !! failed "${row.name}": ${e.message}`);
    }
  }

  console.log('\n== Restaurants ==');
  const [restaurants] = await db.query('SELECT id, name FROM restaurants');
  for (const row of restaurants) {
    const spec = RESTAURANT_QUERIES[row.name];
    if (!spec) continue;
    try {
      const { file, slug } = await ensureImage(`cover-${row.name}`, spec.q, spec.must);
      if (file) {
        await db.query('UPDATE restaurants SET logo = ?, cover_image = ? WHERE id = ?', [`/uploads/${slug}.jpg`, `/uploads/${slug}.jpg`, row.id]);
        console.log(`  cover ok ${row.name}`);
      }
    } catch (e) {
      console.warn(`  !! failed "${row.name}": ${e.message}`);
    }
  }

  console.log(`\nDone. Food images updated: ${updatedFood}/${items.length}`);
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});