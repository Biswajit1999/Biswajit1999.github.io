# Biswajit Jana — public research index

This repository powers the account-level GitHub Pages index at
`https://biswajit1999.github.io/`.

The site provides one searchable, crawlable entry point for all public
repositories and all enabled GitHub Pages projects. A scheduled GitHub Action
refreshes the catalog, repository count, live-project count, and XML sitemap
from the public GitHub API every day.

## Refresh locally

```bash
npm run build
```

The generated files are `index.html`, `catalog.json`, `sitemap.xml`, and
`robots.txt`.
