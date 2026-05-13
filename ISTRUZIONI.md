<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1a1a1a">
  <title>Cronaca — Notizie dall'Italia e dal mondo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #faf8f5;
      --surface: #ffffff;
      --ink: #1a1a1a;
      --ink-soft: #4a4a4a;
      --ink-faded: #8a8a8a;
      --line: #e8e3db;
      --accent: #8b0000;
      --tag-italia-bg: #f0ebe1;
      --tag-italia-ink: #5a4a2a;
      --tag-estero-bg: #e8e1d8;
      --tag-estero-ink: #3a3a3a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: var(--bg);
      color: var(--ink);
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    header {
      border-bottom: 2px solid var(--ink);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .masthead {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    h1 {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-size: clamp(32px, 7vw, 48px);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .date {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--ink-soft);
      font-weight: 500;
      white-space: nowrap;
    }
    .tagline {
      margin-top: 8px;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 15px;
      color: var(--ink-soft);
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filters {
      display: flex;
      gap: 4px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 3px;
    }
    .filter-btn {
      background: transparent;
      border: none;
      padding: 7px 16px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-soft);
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { color: var(--ink); }
    .filter-btn.active {
      background: var(--ink);
      color: var(--bg);
    }
    .refresh-btn {
      background: transparent;
      border: 1px solid var(--line);
      padding: 8px 14px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-soft);
      border-radius: 999px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .refresh-btn:hover { color: var(--ink); border-color: var(--ink); }
    .refresh-btn.loading svg { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status {
      font-size: 12px;
      color: var(--ink-faded);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }
    .news-list { display: flex; flex-direction: column; }
    .news-item {
      padding: 22px 0;
      border-bottom: 1px solid var(--line);
      cursor: pointer;
      display: block;
      color: inherit;
      text-decoration: none;
      transition: background 0.15s;
      margin: 0 -20px;
      padding-left: 20px;
      padding-right: 20px;
    }
    .news-item:hover { background: rgba(0,0,0,0.02); }
    .news-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .tag {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 3px 10px;
      border-radius: 3px;
    }
    .tag-italia { background: var(--tag-italia-bg); color: var(--tag-italia-ink); }
    .tag-estero { background: var(--tag-estero-bg); color: var(--tag-estero-ink); }
    .source {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .time {
      font-size: 12px;
      color: var(--ink-faded);
    }
    .news-title {
      font-family: 'Fraunces', serif;
      font-weight: 600;
      font-size: clamp(18px, 4vw, 22px);
      line-height: 1.25;
      letter-spacing: -0.01em;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .news-summary {
      font-size: 14px;
      line-height: 1.55;
      color: var(--ink-soft);
    }
    .loading, .empty, .error {
      text-align: center;
      padding: 60px 20px;
      color: var(--ink-faded);
    }
    .error { color: var(--accent); }
    .skeleton {
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 50% { opacity: 0.5; } }
    .skel-item { padding: 22px 0; border-bottom: 1px solid var(--line); }
    .skel-line {
      height: 12px;
      background: var(--line);
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .skel-line.short { width: 30%; }
    .skel-line.title { height: 22px; width: 85%; }
    .skel-line.summary { width: 100%; }
    footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid var(--line);
      text-align: center;
      font-size: 12px;
      color: var(--ink-faded);
      line-height: 1.6;
    }
    footer a { color: var(--ink-soft); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="masthead">
        <h1>Cronaca</h1>
        <div class="date" id="today-date"></div>
      </div>
      <p class="tagline">Notizie di cronaca dall'Italia e dal mondo, raccolte in tempo reale</p>
    </header>

    <div class="controls">
      <div class="filters" role="tablist">
        <button class="filter-btn active" data-filter="all">Tutte</button>
        <button class="filter-btn" data-filter="italia">Italia</button>
        <button class="filter-btn" data-filter="estero">Estero</button>
      </div>
      <button class="refresh-btn" id="refresh-btn" aria-label="Aggiorna notizie">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
        Aggiorna
      </button>
    </div>

    <div class="status" id="status">Caricamento in corso…</div>

    <div class="news-list" id="news-list">
      <div class="skeleton">
        <div class="skel-item"><div class="skel-line short"></div><div class="skel-line title"></div><div class="skel-line summary"></div></div>
        <div class="skel-item"><div class="skel-line short"></div><div class="skel-line title"></div><div class="skel-line summary"></div></div>
        <div class="skel-item"><div class="skel-line short"></div><div class="skel-line title"></div><div class="skel-line summary"></div></div>
      </div>
    </div>

    <footer>
      Le notizie sono raccolte automaticamente dai feed pubblici delle testate originali.<br>
      Per leggere l'articolo completo, clicca sulla notizia e verrai portato al sito della testata.
    </footer>
  </div>

  <script>
    // ===== Data fonti =====
    // L'app chiama l'endpoint /api/news che fa la raccolta lato server
    // Cosi' evitiamo problemi di CORS leggendo i feed dal browser
    const NEWS_ENDPOINT = '/api/news';

    // ===== Stato =====
    let allNews = [];
    let currentFilter = 'all';

    // ===== Utility =====
    function formatDate() {
      const d = new Date();
      const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return d.toLocaleDateString('it-IT', opts);
    }

    function timeAgo(dateString) {
      const date = new Date(dateString);
      const seconds = Math.floor((Date.now() - date) / 1000);
      if (seconds < 60) return 'pochi secondi fa';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min fa`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} h fa`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} g fa`;
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ===== Render =====
    function render() {
      const list = document.getElementById('news-list');
      const status = document.getElementById('status');

      const filtered = currentFilter === 'all'
        ? allNews
        : allNews.filter(n => n.area === currentFilter);

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty">Nessuna notizia trovata.</div>';
        status.textContent = '0 notizie';
        return;
      }

      status.textContent = `${filtered.length} notizie · ultimo aggiornamento ${timeAgo(new Date().toISOString())}`;

      list.innerHTML = filtered.map(n => `
        <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer" class="news-item">
          <div class="news-meta">
            <span class="tag tag-${n.area}">${n.area === 'italia' ? 'Italia' : 'Estero'}</span>
            <span class="source">${escapeHtml(n.source)}</span>
            <span class="time">${timeAgo(n.pubDate)}</span>
          </div>
          <h2 class="news-title">${escapeHtml(n.title)}</h2>
          ${n.summary ? `<p class="news-summary">${escapeHtml(n.summary)}</p>` : ''}
        </a>
      `).join('');
    }

    function showError(msg) {
      const list = document.getElementById('news-list');
      list.innerHTML = `<div class="error">${escapeHtml(msg)}</div>`;
      document.getElementById('status').textContent = 'Errore di caricamento';
    }

    // ===== Fetch =====
    async function loadNews() {
      try {
        const res = await fetch(NEWS_ENDPOINT);
        if (!res.ok) throw new Error('Errore del server');
        const data = await res.json();
        allNews = data.news || [];
        render();
      } catch (err) {
        console.error(err);
        showError('Impossibile caricare le notizie. Riprova fra qualche istante.');
      }
    }

    // ===== Eventi =====
    document.getElementById('today-date').textContent = formatDate();

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
      });
    });

    document.getElementById('refresh-btn').addEventListener('click', async () => {
      const btn = document.getElementById('refresh-btn');
      btn.classList.add('loading');
      await loadNews();
      btn.classList.remove('loading');
    });

    // Avvio
    loadNews();

    // Aggiornamento automatico ogni 5 minuti
    setInterval(loadNews, 5 * 60 * 1000);
  </script>
</body>
</html>
