// @ts-check
import { cp, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import docsMdLinks from './src/lib/docs-md-links.ts';
import { DOCS_DIR } from './src/lib/site.ts';

// Docs images live next to the Markdown in the lmc repo (`images/` folder,
// GitHub-readable relative form). The site serves them at `/docs-images/`:
// copy them into `public/` (gitignored) at dev/build startup so both
// `astro dev` and `astro build` pick them up. Single source of truth stays
// in the lmc repo — no duplicated binaries in the site repo.
//
// Paths anchor at this config file (import.meta.dirname, Node >= 20.11),
// not at the working directory, so dev/build work from any cwd.
// Error policy: a missing `images/` folder is legitimate (skip, warn);
// any other copy failure throws in `build` (fail the deploy) and only
// warns in `dev` (keep iterating locally).
const docsImages = {
  name: 'docs-images',
  hooks: {
    'astro:config:setup': async () => {
      const src = path.resolve(import.meta.dirname, DOCS_DIR, 'images');
      const dest = path.resolve(import.meta.dirname, 'public/docs-images');
      const isBuild = process.argv.includes('build');
      await rm(dest, { recursive: true, force: true });
      try {
        if ((await readdir(src)).length === 0) {
          console.warn(`[docs-images] empty ${src}, skipping`);
          return;
        }
        await cp(src, dest, { recursive: true });
      } catch (e) {
        // Narrowed without NodeJS types: `in` adds `Record<'code', unknown>`.
        const code = e instanceof Error && 'code' in e ? e.code : undefined;
        if (code === 'ENOENT') {
          console.warn(`[docs-images] no images/ in ${DOCS_DIR}, skipping`);
          return;
        }
        const msg = `[docs-images] copy failed: ${e instanceof Error ? e.message : e}`;
        if (isBuild) throw new Error(msg, { cause: e });
        console.warn(`${msg} (dev mode, continuing)`);
      }
    },
  },
};

export default defineConfig({
  integrations: [docsImages],
  // Canonical origin of the live site (lanmessenger.github.io serves the
  // domain root). Needed for sitemap/canonical later; harmless now.
  site: "https://lanmessenger.github.io",
  // Static output (default): `astro build` emits self-contained dist/ — serve it as-is.
  // No `base` set: local preview and domain root. Revisit when the deploy target is known.
  // docsMdLinks rewrites relative `*.md` links and `images/*` image URLs
  // in /docs sources (which live in the lmc repo, GitHub-readable form)
  // to absolute site routes (`/docs/*`, `/docs-images/*`).
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
