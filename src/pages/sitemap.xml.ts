import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

// Sitemap generated from the same docs collection as the /docs routes, so it
// can never list a stale URL. Landing ("/") plus one entry per doc page
// (index.md -> "/docs", not "/docs/index" — same mapping as [...slug].astro).
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("astro.config `site` is required for sitemap.xml");
  const docs = await getCollection("docs");
  const paths = [
    "/",
    ...docs.map((d) => (d.id === "index" ? "/docs" : `/docs/${d.id}`)),
  ];
  const urls = [...new Set(paths)]
    .map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`)
    .join("\n");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
