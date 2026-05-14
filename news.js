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
// Match case-insensitive su titolo + sommario
const GARLASCO_KEYWORDS = [
  'garlasco',
  'chiara poggi',
  'alberto stasi',
  'andrea sempio',
  'sempio',
];

// Estrae il contenuto di un singolo tag XML
function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

// Parser RSS minimale (niente dipendenze)
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

// Controlla se una notizia riguarda il caso Garlasco
function isGarlascoNews(item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return GARLASCO_KEYWORDS.some(kw => haystack.includes(kw));
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CronacaApp/1.0)' },
    });
    if (!res.ok) {
      console.error(`Feed ${feed.source} ha risposto ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseRSS(xml, feed.source, feed.area);
  } catch (err) {
    console.error(`Errore feed ${feed.source}:`, err.message);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const allNews = results.flat();

    // Ordina dal più recente al più vecchio
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Estrai notizie sul caso Garlasco e marcale con area dedicata
    const garlascoNews = allNews
      .filter(isGarlascoNews)
      .map(item => ({ ...item, area: 'garlasco' }));

    // Notizie generali (escluso eventuali duplicati Garlasco): top 60
    const generalNews = allNews.slice(0, 60);

    // Unisci: prima le notizie generali, poi quelle dello speciale
    // Il frontend può filtrare per `area === 'garlasco'`
    const news = [...generalNews, ...garlascoNews];

    // Cache 10 minuti su Vercel
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    res.status(200).json({
      news,
      meta: {
        total: news.length,
        garlascoCount: garlascoNews.length,
      },
    });
  } catch (err) {
    console.error('Errore handler:', err);
    res.status(500).json({ news: [], error: 'Errore interno' });
  }
}
