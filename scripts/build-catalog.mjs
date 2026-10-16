import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OWNER = "Biswajit1999";
const ROOT = `https://${OWNER.toLowerCase()}.github.io/`;
const PORTFOLIO = `${ROOT}Biswajit_Jana.github.io/`;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeXml = (value = "") => escapeHtml(value);

async function fetchRepositories() {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(
      `https://api.github.com/users/${OWNER}/repos?per_page=100&page=${page}&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `${OWNER}-research-catalog`
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
    }
    const batch = await response.json();
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  return repositories.filter((repo) => !repo.private && !repo.archived && !repo.disabled);
}

function pageUrl(repo) {
  const homepage = String(repo.homepage || "").trim();
  if (repo.has_pages && homepage.startsWith(ROOT)) {
    return homepage.endsWith("/") ? homepage : `${homepage}/`;
  }
  return repo.has_pages ? `${ROOT}${repo.name}/` : null;
}

function category(repo) {
  const haystack = `${repo.name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
  if (/exoplanet|transit|radial.velocity|spectro|doppler|habitable|atmosphere/.test(haystack)) return "Exoplanets & spectroscopy";
  if (/cosmolog|dark.matter|lensing|supernova|galaxy|euclid|hubble/.test(haystack)) return "Cosmology & galaxies";
  if (/pulsar|gravitational|frb|radio|21cm|technosignature/.test(haystack)) return "Time-domain & radio astronomy";
  if (/optics|detector|instrument|control|interfer|wavefront|telescope/.test(haystack)) return "Instrumentation";
  if (/machine.learning|deep.learning|data|simulation|python|visual/.test(haystack)) return "Scientific computing";
  return "Other research & software";
}

function buildCard(repo) {
  const live = pageUrl(repo);
  const topics = (repo.topics || []).slice(0, 5);
  return `
    <article class="project" data-search="${escapeHtml(`${repo.name} ${repo.description || ""} ${topics.join(" ")} ${category(repo)}`.toLowerCase())}" data-kind="${live ? "site" : "repository"}">
      <div class="project__meta">
        <span>${escapeHtml(category(repo))}</span>
        <span>${escapeHtml(repo.language || "Multi-language")}</span>
      </div>
      <h2>${escapeHtml(repo.name.replaceAll("-", " ").replaceAll("_", " "))}</h2>
      <p>${escapeHtml(repo.description || "Public research software and supporting materials.")}</p>
      ${topics.length ? `<ul class="topics">${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>` : ""}
      <div class="project__links">
        ${live ? `<a href="${escapeHtml(live)}">Open live project</a>` : ""}
        <a href="${escapeHtml(repo.html_url)}">Source & documentation</a>
      </div>
    </article>`;
}

function buildHtml(repositories) {
  const liveCount = repositories.filter((repo) => repo.has_pages).length;
  const updated = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date());
  const cards = repositories.map(buildCard).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Biswajit Jana — Astronomy Research Software",
    url: ROOT,
    dateModified: new Date().toISOString(),
    mainEntity: {
      "@type": "Person",
      name: "Biswajit Jana",
      url: PORTFOLIO,
      sameAs: [`https://github.com/${OWNER}`]
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Biswajit Jana — Astronomy Research Software and Scientific Projects</title>
  <meta name="description" content="A searchable index of Biswajit Jana's public astronomy research software, interactive scientific laboratories, exoplanet reports, instrumentation studies, and reproducible analyses.">
  <meta name="author" content="Biswajit Jana">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${ROOT}">
  <link rel="sitemap" type="application/xml" href="${ROOT}sitemap.xml">
  <link rel="stylesheet" href="style.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>
</head>
<body>
  <header class="masthead">
    <a class="identity" href="${PORTFOLIO}">Biswajit Jana</a>
    <nav aria-label="Primary">
      <a href="${PORTFOLIO}">Portfolio</a>
      <a href="${PORTFOLIO}atlas.html">Research atlas</a>
      <a href="https://github.com/${OWNER}">GitHub</a>
    </nav>
  </header>

  <main>
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">PUBLIC RESEARCH INDEX · AUTOMATICALLY SYNCHRONISED</p>
      <h1 id="page-title">Astronomy research,<br>built to be inspected.</h1>
      <p class="lede">A machine-readable and human-searchable gateway to public work across exoplanets, astronomical instrumentation, time-domain astronomy, cosmology, and scientific computing.</p>
      <dl class="summary">
        <div><dt>${repositories.length}</dt><dd>public repositories</dd></div>
        <div><dt>${liveCount}</dt><dd>live research sites</dd></div>
        <div><dt>Daily</dt><dd>catalog refresh</dd></div>
      </dl>
      <p class="updated">Catalog generated ${escapeHtml(updated)} from the public GitHub API.</p>
    </section>

    <section class="catalog" aria-labelledby="catalog-title">
      <div class="catalog__header">
        <div>
          <p class="eyebrow">RESEARCH CATALOG</p>
          <h2 id="catalog-title">Find a project by subject or method</h2>
        </div>
        <div class="controls">
          <label for="search">Search the catalog</label>
          <input id="search" type="search" placeholder="e.g. dark matter, radial velocity, JWST">
          <div class="filters" role="group" aria-label="Filter projects">
            <button class="active" type="button" data-filter="all">All</button>
            <button type="button" data-filter="site">Live sites</button>
            <button type="button" data-filter="repository">Repositories</button>
          </div>
        </div>
      </div>
      <p id="result-count" aria-live="polite"></p>
      <div id="projects" class="projects">${cards}
      </div>
    </section>
  </main>

  <footer>
    <p>Biswajit Jana · Astronomy, instrumentation, and scientific computing</p>
    <p><a href="sitemap.xml">XML sitemap</a> · <a href="catalog.json">Catalog data</a></p>
  </footer>

  <script>
    const projects = [...document.querySelectorAll('.project')];
    const search = document.querySelector('#search');
    const resultCount = document.querySelector('#result-count');
    const buttons = [...document.querySelectorAll('[data-filter]')];
    let filter = 'all';
    function update() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      projects.forEach((project) => {
        const matchesText = !query || project.dataset.search.includes(query);
        const matchesFilter = filter === 'all' || project.dataset.kind === filter;
        const show = matchesText && matchesFilter;
        project.hidden = !show;
        if (show) visible += 1;
      });
      resultCount.textContent = visible + ' project' + (visible === 1 ? '' : 's') + ' shown';
    }
    search.addEventListener('input', update);
    buttons.forEach((button) => button.addEventListener('click', () => {
      filter = button.dataset.filter;
      buttons.forEach((item) => item.classList.toggle('active', item === button));
      update();
    }));
    update();
  </script>
</body>
</html>`;
}

function buildSitemap(repositories) {
  const urls = [
    { loc: ROOT, lastmod: new Date().toISOString().slice(0, 10), priority: "1.0" },
    ...repositories
      .filter((repo) => repo.has_pages)
      .map((repo) => ({
        loc: pageUrl(repo),
        lastmod: String(repo.pushed_at || repo.updated_at).slice(0, 10),
        priority: "0.8"
      }))
  ];
  const unique = [...new Map(urls.map((item) => [item.loc, item])).values()]
    .sort((a, b) => a.loc.localeCompare(b.loc));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((item) => `  <url>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join("\n")}
</urlset>\n`;
}

const repositories = (await fetchRepositories())
  .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

const catalog = repositories.map((repo) => ({
  name: repo.name,
  description: repo.description,
  category: category(repo),
  language: repo.language,
  topics: repo.topics || [],
  repository_url: repo.html_url,
  live_url: pageUrl(repo),
  updated_at: repo.updated_at,
  pushed_at: repo.pushed_at
}));

await Promise.all([
  writeFile(path.join(rootDir, "index.html"), buildHtml(repositories)),
  writeFile(path.join(rootDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  writeFile(path.join(rootDir, "sitemap.xml"), buildSitemap(repositories)),
  writeFile(path.join(rootDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ROOT}sitemap.xml\n`)
]);

console.log(`Built catalog for ${repositories.length} public repositories and ${repositories.filter((repo) => repo.has_pages).length} live sites.`);
