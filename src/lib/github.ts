// Build-time GitHub metadata. Runs once during `astro build` (SSR/prerender),
// never in the browser. No fallback: any failure throws and breaks the build.
export interface RepoMeta {
  stars: number;
}

const API = "https://api.github.com/repos/lanmessenger/lanmessenger";

// In-memory cache: in `astro dev` the frontmatter re-runs on every page
// request, so without this each reload would pay a full API round-trip.
// Refreshed at most once per hour.
let cache: { at: number; value: RepoMeta } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function getRepoMeta(): Promise<RepoMeta> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const value = await fetchRepoMeta();
  cache = { at: Date.now(), value };
  return value;
}

async function fetchRepoMeta(): Promise<RepoMeta> {
  const res = await fetch(API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "lmc-site-build",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${API}`);
  const data: unknown = await res.json();
  const stars =
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).stargazers_count === "number"
      ? ((data as Record<string, unknown>).stargazers_count as number)
      : null;
  if (stars === null) throw new Error(`GitHub API: stargazers_count missing`);
  return { stars };
}

// 3400 -> "3.4k", 950 -> "950"
export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const v = (n / 1000).toFixed(1).replace(/\.0$/, "");
  return `${v}k`;
}

// --- Release assets -------------------------------------------------------
// Same build-time policy as stars: no fallback, any failure throws.
// The release is pinned by SITE.version (tag `v<version>`), so a new upstream
// release never silently swaps the binaries — the bump stays explicit.

// 49073356 -> "46.8 MB", 1688862 -> "1.61 MB"
export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const v = mb >= 10 ? mb.toFixed(1) : mb.toFixed(2);
  return `${v} MB`;
}

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
}

export interface ReleaseInfo {
  /** Version without the leading "v", e.g. "1.3.3". */
  version: string;
  assets: ReleaseAsset[];
}

let releaseCache: { at: number; value: ReleaseInfo } | null = null;

export async function getReleaseInfo(tag: string): Promise<ReleaseInfo> {
  if (releaseCache && Date.now() - releaseCache.at < TTL_MS)
    return releaseCache.value;
  const value = await fetchReleaseInfo(tag);
  releaseCache = { at: Date.now(), value };
  return value;
}

async function fetchReleaseInfo(tag: string): Promise<ReleaseInfo> {
  const url = `${API}/releases/tags/${tag}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "lmc-site-build",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null)
    throw new Error(`GitHub API: unexpected release payload`);
  const rec = data as Record<string, unknown>;
  const tagName = typeof rec.tag_name === "string" ? rec.tag_name : null;
  const rawAssets = Array.isArray(rec.assets) ? rec.assets : null;
  if (tagName === null || rawAssets === null)
    throw new Error(`GitHub API: release fields missing`);
  const assets: ReleaseAsset[] = [];
  for (const item of rawAssets) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.name !== "string" ||
      typeof r.size !== "number" ||
      typeof r.browser_download_url !== "string"
    )
      continue;
    assets.push({ name: r.name, size: r.size, url: r.browser_download_url });
  }
  return { version: tagName.replace(/^v/, ""), assets };
}
