# Search Console checklist — V0.66.5

After Production deploy:

- `View Source` on `/dong-ho-nam`: robots must be `index, follow...`, canonical must be the same URL, and the prerender marker should contain `data-seo-prerender="v0.66.5"`.
- Search Console → URL inspection → `/dong-ho-nam` → **Test live URL**. Confirm **Crawl allowed: Yes**, **Page fetch: Successful**, **Indexing allowed: Yes**.
- Do not repeatedly request indexing while daily quota is exhausted. Sitemap discovery is sufficient for the catalog.
- Search Console → Sitemaps: resubmit `sitemap.xml` if the old row still says *Couldn't fetch*. A previously failed row can remain stale until Google fetches it again.
- Keep `image-sitemap.xml` and the Merchant feed; both are separate from the main page-indexing sitemap.
