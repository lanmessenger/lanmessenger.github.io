// Single source of truth for pinned metadata: version (selects the GitHub
// release tag), repo links. Binary file names, sizes and URLs come from the
// GitHub release API at build time (see src/lib/github.ts).
export const SITE = {
  version: "1.3.3",
  repo: "https://github.com/lanmessenger/lanmessenger",
  issues: "https://github.com/lanmessenger/lanmessenger/issues",
  releaseTag:
    "https://github.com/lanmessenger/lanmessenger/releases/tag/v1.3.3",
  licenseUrl:
    "https://github.com/lanmessenger/lanmessenger/blob/master/LICENSE",
} as const;
