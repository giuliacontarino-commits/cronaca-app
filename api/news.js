// api/news.js — Serverless function su Vercel
// Recupera feed RSS di testate italiane e li restituisce nel formato atteso dal frontend.

const FEEDS = [
  // === ITALIA / CRONACA ===
  { source: 'ANSA',              area: 'italia', url: 'https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml' },
  { source: 'Repubblica',        area: 'italia', url: 'https://www.repubblica.it/rss/cronaca/rss2.0.xml' },
  { source: 'Corriere',          area: 'italia', url: 'https://xml2.corriereobjects.it/rss/cronache.xml' },
  { source: 'Il Sole 24 Ore',    area: 'italia', url: 'https://www.ilsole24ore.com/rss/italia.xml' },
  { source: 'La Stampa',         area: 'italia', url: 'https://www.lastampa.it/rss/cronaca.rss' },
  { source: 'Il Fatto Quotidiano',area: 'italia',url: 'https://www.ilfattoquotidiano.it/cronaca/feed/' },
  { source: 'Il Messaggero',     area: 'italia', url: 'https://www.ilmessaggero.it/rss/cronaca.xml' },
  { source: 'Il Giornale',       area: 'italia', url: 'https://www.ilgiornale.it/feed/sezione/cronache.xml' },
  { source: 'TGCom24',           area: 'italia', url: 'https://www.tgcom24.mediaset.it/rss/cronaca.xml' },
  { source: 'Sky TG24',          area: 'italia', url: 'https://tg24.sky.it/rss/cronaca.xml' },
  { source: 'Rai News',          area: 'italia', url: 'https://www.rainews.it/rss/cronaca' },
  { source: 'Adnkronos',         area: 'italia', url: 'https://www.adnkronos.com/RSS_Cronaca.xml' },

  // === ESTERO ===
  { source: 'ANSA',              area: 'estero', url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml' },
  { source: 'Repubblica',        area: 'estero', url: 'https://www.repubblica.it/rss/esteri/rss2.0.xml' },
  { source: 'Corriere',          area: 'estero', url: 'https://xml2.corriereobjects.it/rss/esteri.xml' },
  { source: 'La Stampa',         area: 'estero', url: 'https://www.lastampa.it/rss/esteri.rss' },
  { source: 'Il Sole 24 Ore',    area: 'estero', url: 'https://www.ilsole24ore.com/rss/mondo.xml' },
  { source: 'Sky TG24',          area: 'estero', url: 'https://tg24.sky.it/rss/mondo.xml' },
  { source: 'Rai News',          area: 'estero', url: 'https://www.rainews.it/rss/mondo' },
  { source: 'Adnkronos',         area: 'estero', url: 'https://www.adnkronos.com/RSS_Esteri.xml' },
];

// Parole chiave per identificare notizie relative al caso Garlasco
const GARLASCO_KEYWORDS = [
  'garlasco',
  'chiara poggi',
  'alberto stasi',
  'andrea sempio',
  'sempio',
];

// Timeout per singolo fetch (millisecondi)
const FETCH_TIMEOUT_MS = 5000;

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function parseRSS(xml, source, area) {
  const items = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const summary = extractTag(itemXml, 'description')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);
    const pubDate = extractTag(itemXml, 'pubDate') || new Date().toISOString();
    if (title && link) {
      items.push({ area, source, title, summary, link, pubDate });
    }
  }
  return items;
}

function isGarlascoNews(item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return GARLASCO_KEYWORDS.some(kw => haystack.includes(kw));
}

// Deduplica notizie identiche provenienti da fonti diverse (basandosi sul titolo normalizzato)
function dedupe(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CronacaApp/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`Feed ${feed.source} (${feed.area}) ha risposto ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseRSS(xml, feed.source, feed.area);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`Errore feed ${feed.source} (${feed.area}):`, err.message);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    let allNews = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    if (allNews.length === 0) {
      console.error('Nessun feed ha restituito notizie');
      res.status(200).json({ news: [], error: 'Nessuna notizia disponibile al momento' });
      return;
    }

    // Deduplica notizie identiche da fonti diverse
    allNews = dedupe(allNews);

    // Ordina dal più recente al più vecchio
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Estrai notizie sul caso Garlasco (su tutte le notizie, anche oltre il top 80)
    const garlascoNews = allNews
      .filter(isGarlascoNews)
      .map(item => ({ ...item, area: 'garlasco' }));

    // Notizie generali: top 80 (più fonti → alzo il limite)
    const generalNews = allNews.slice(0, 80);

    const news = [...generalNews, ...garlascoNews];

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    res.status(200).json({
      news,
      meta: {
        total: news.length,
        garlascoCount: garlascoNews.length,
        feedsOk: settled.filter(r => r.status === 'fulfilled' && r.value.length > 0).length,
        feedsTotal: FEEDS.length,
      },
    });
  } catch (err) {
    console.error('Errore handler:', err);
    res.status(500).json({ news: [], error: 'Errore interno: ' + err.message });
  }
}
