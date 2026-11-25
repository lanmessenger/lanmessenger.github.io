import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { SITE } from "../data/site";

// llms.txt generated from the same docs collection as the /docs routes and
// sitemap.xml, so titles/descriptions track frontmatter and can never drift.
// "index" is excluded on purpose: the /docs overview is already linked under
// Key pages (same duplicate-free rule as the static version before this).
const DOCS_ORDER = [
  "install-windows",
  "install-macos",
  "install-linux",
  "build",
  "build-prerequisites",
  "build-linux",
  "build-macos",
  "build-windows",
  "ini-file",
  "themes",
] as const;

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("astro.config `site` is required for llms.txt");
  const docs = await getCollection("docs");
  const byId = new Map(docs.map((d) => [d.id, d]));
  const ordered = DOCS_ORDER.filter((id) => byId.has(id));
  // Stale DOCS_ORDER entries (renamed/removed docs) are skipped instead of
  // breaking the build; the warn tells the curator to clean them up.
  const missing = DOCS_ORDER.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    console.warn(
      `[llms.txt] DOCS_ORDER entries missing from docs collection, skipped: ${missing.join(", ")}`,
    );
  }
  // Docs missing from DOCS_ORDER are appended alphabetically instead of
  // silently dropped; the warn tells the curator to place them explicitly.
  const known = new Set<string>(ordered);
  const extra = [...byId.keys()]
    .filter((id) => id !== "index" && !known.has(id))
    .sort();
  if (extra.length > 0) {
    console.warn(
      `[llms.txt] docs missing from DOCS_ORDER, appended: ${extra.join(", ")}`,
    );
  }
  const docLines = [...ordered, ...extra].map((id) => {
    const entry = byId.get(id)!;
    const url = new URL(`/docs/${id}`, site).href;
    const desc = entry.data.description ? `: ${entry.data.description}` : "";
    return `- [${entry.data.title}](${url})${desc}`;
  });
  // Root and section URLs derive from `site` (like sitemap.xml); GitHub URLs
  // reuse SITE so a domain/repo move needs a single edit. `site.origin` keeps
  // Home slash-free, matching the canonical style used below.
  const home = site.origin;
  const docsUrl = new URL("/docs", site).href;
  const privacyUrl = new URL("/privacy", site).href;
  const versionUrl = new URL("/version", site).href;
  const body = `# LAN Messenger

> LAN Messenger is a free, open-source instant messaging app for Windows, macOS and Linux. Chat and transfer files over your local network without a central server or internet connection.

## Key pages

- [Home](${home}): overview, features, screenshots, downloads
- [Documentation](${docsUrl}): install guides, build guides, configuration reference
- [Privacy Policy](${privacyUrl}): no accounts, no central servers, no telemetry
- [Version](${versionUrl}): machine-readable current release versions (XML)
- [Source code](${SITE.repo})
- [Releases](${SITE.releases}): current version and per-platform installers/packages
- [Issue tracker](${SITE.issues})
- [Discussions](${SITE.discussions})
- [License: GPL-3.0](${SITE.licenseUrl}): distributed under the GNU General Public License v3.0

## Docs

${docLines.join("\n")}

## Notes

- The app works over the local network, with or without internet access; there are no accounts, no central servers, and no cloud services. Typical uses are offices, classrooms and labs.
- For the current version and downloads, use the Releases page — do not quote a version from memory.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
