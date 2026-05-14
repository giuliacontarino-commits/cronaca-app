// api/news.js — Serverless function su Vercel
// Recupera i feed RSS di alcune testate italiane e li restituisce come JSON

const FEEDS = {
  italia: [
    { nome: 'ANSA', url: 'https://www.ansa.it/sito/ansait_rss.xml' },
    { nome: 'Repubblica', url: 'https://www.repubblica.it/rss/cronaca/rss2.0.xml' },
    { nome: 'Corriere', url: 'https://xml2.corriereobjects.it/rss/cronache.xml' },
    { nome: 'Il Sole 24 Ore', url: 'https://www.ilsole24ore.com/rss/italia.xml' },
  ],
  estero: [
    { nome: 'ANSA Mondo', url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml' },
    { nome: 'Repubblica Esteri', url: 'https://www.repubblica.it/rss/esteri/rss2.0.xml' },
  ],
};

// Estrae il contenuto di un tag XML semplice
function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';
  // Rimuove eventuali CDATA
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

// Parser RSS minimale (senza dipendenze esterne)
function parseRSS(xml, fonte) {
  const items = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];

  for (const itemXml of matches) {
    const titolo = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const descrizione = extractTag(itemXml, 'description')
      .replace(/<[^>]+>/g, '') // rimuove tag HTML dalla descrizione
      .trim();
    const data = extractTag(itemXml, 'pubDate');

    if (titolo && link) {
      items.push({ titolo, link, descrizione, data, fonte });
    }
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CronacaApp/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feed.nome);
  } catch (err) {
    console.error(`Errore feed ${feed.nome}:`, err.message);
    return [];
  }
}

export default async function handler(req, res) {
  const categoria = (req.query.categoria || 'tutte').toLowerCase();

  let feedDaCaricare = [];
  if (categoria === 'italia') feedDaCaricare = FEEDS.italia;
  else if (categoria === 'estero') feedDaCaricare = FEEDS.estero;
  else feedDaCaricare = [...FEEDS.italia, ...FEEDS.estero];

  const risultati = await Promise.all(feedDaCaricare.map(fetchFeed));
  const tutteLeNotizie = risultati.flat();

  // Ordina per data, più recenti prima
  tutteLeNotizie.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Cache di 10 minuti su Vercel (riduce le chiamate ai feed)
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  res.status(200).json({ notizie: tutteLeNotizie });
}
