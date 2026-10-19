// Release version is resolved at build time from the latest stable lmc
// release (see getLatestReleaseInfo in src/lib/github.ts), not pinned here.
// Repo links below are static; per-release URLs derive from the resolved
// version via releaseTagFor().
export const SITE = {
  repo: "https://github.com/lanmessenger/lanmessenger",
  issues: "https://github.com/lanmessenger/lanmessenger/issues",
  releases: "https://github.com/lanmessenger/lanmessenger/releases",
  licenseUrl:
    "https://github.com/lanmessenger/lanmessenger/blob/master/LICENSE",
} as const;

export function releaseTagFor(version: string): string {
  return `https://github.com/lanmessenger/lanmessenger/releases/tag/v${version}`;
}
