// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import docsMdLinks from './src/lib/docs-md-links.ts';

export default defineConfig({
  // Canonical origin of the live site (lanmessenger.github.io serves the
  // domain root). Needed for sitemap/canonical later; harmless now.
  site: "https://lanmessenger.github.io",
  // Static output (default): `astro build` emits self-contained dist/ — serve it as-is.
  // No `base` set: local preview and domain root. Revisit when the deploy target is known.
  // docsMdLinks rewrites relative `*.md` links in /docs sources (which live
  // in the lmc repo, GitHub-readable form) to absolute `/docs/*` site routes.
  markdown: {
    processor: satteri({ mdastPlugins: [docsMdLinks] }),
  },
  // `host: true` binds 0.0.0.0 so plain `pnpm dev` / `pnpm preview`
  // are reachable from other machines on the LAN (no --host flag needed).
  server: {
    host: true,
    port: 4321,
  },
});
