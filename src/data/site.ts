// Pinned release version: single source of truth — bump only the VERSION
// line below for a new release. The GitHub release tag and all download
// URLs derive from it (tag `v<version>`, assets via the release API at
// build time, see src/lib/github.ts); repo links are static.
const VERSION = "1.3.7" as const;
const TAG = `v${VERSION}`;

export const SITE = {
  version: VERSION,
  repo: "https://github.com/lanmessenger/lanmessenger",
  issues: "https://github.com/lanmessenger/lanmessenger/issues",
  releaseTag: `https://github.com/lanmessenger/lanmessenger/releases/tag/${TAG}`,
  licenseUrl:
    "https://github.com/lanmessenger/lanmessenger/blob/master/LICENSE",
} as const;
