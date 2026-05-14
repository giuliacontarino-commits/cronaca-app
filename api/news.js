// api/news.js — Serverless function su Vercel
// Recupera feed RSS di testate italiane e li restituisce nel formato atteso dal frontend.

const FEEDS = [
  { source: 'ANSA',              area: 'italia', url: 'https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml' },
  { source: 'Repubblica',        area: 'italia', url: 'https://www.repubblica.it/rss/cronaca/rss2.0.xml' },
  { source: 'Corriere',          area: 'italia', url: 'https://xml2.corriereobjects.it/rss/cronache.xml' },
  { source: 'Il Sole 24 Ore',    area: 'italia', url: 'https://www.ilsole24ore.com/rss/italia.xml' },
  { source: 'ANSA',              area: 'estero', url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml' },
  { source: 'Repubblica',        area: 'estero', url: 'https://www.repubblica.it/rss/esteri/rss2.0.xml' },
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

// Fetch con timeout: se un feed è troppo lento, viene abbandonato
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
    // Promise.allSettled: anche se alcuni feed falliscono, continuiamo con gli altri
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const allNews = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    if (allNews.length === 0) {
      console.error('Nessun feed ha restituito notizie');
      res.status(200).json({ news: [], error: 'Nessuna notizia disponibile al momento' });
      return;
    }

    // Ordina dal più recente al più vecchio
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Estrai notizie sul caso Garlasco
    const garlascoNews = allNews
      .filter(isGarlascoNews)
      .map(item => ({ ...item, area: 'garlasco' }));

    // Notizie generali: top 60
    const generalNews = allNews.slice(0, 60);

    // Unisci
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
