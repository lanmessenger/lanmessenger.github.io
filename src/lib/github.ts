// Build-time GitHub metadata. Runs once during `astro build` (SSR/prerender),
// never in the browser. No fallback: any failure throws and breaks the build.
export interface RepoMeta {
  stars: number;
}

const API = "https://api.github.com/repos/lanmessenger/lanmessenger";

// Anonymous CI calls hit GitHub rate limits (shared runner IPs). Retry fast,
// but never wait out a long primary-limit reset: fail loud, rerun picks it up.
const FETCH_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1500;
const MAX_WAIT_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const at = Date.parse(value);
  if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  return null;
}

function rateLimitResetWaitMs(res: Response): number | null {
  const reset = parseResetMs(res.headers.get("x-ratelimit-reset"));
  if (reset === null) return null;
  return Math.max(0, reset - Date.now());
}

function parseResetMs(raw: string | null): number | null {
  if (!raw) return null;
  const ms = Number(raw) * 1000;
  return Number.isFinite(ms) ? ms : null;
}

function rateLimitDetail(res: Response): string {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  const retryAfter = res.headers.get("retry-after");
  const parts = [`status ${res.status}`];
  if (remaining !== null) parts.push(`remaining=${remaining}`);
  if (reset !== null) {
    const ms = parseResetMs(reset);
    parts.push(ms === null ? `reset=${reset}` : `reset=${new Date(ms).toISOString()}`);
  }
  if (retryAfter !== null) parts.push(`retry-after=${retryAfter}`);
  return parts.join(" ");
}

async function fetchGitHubApi(url: string): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "lmc-site-build",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (e) {
      lastError = e;
      if (attempt === MAX_ATTEMPTS) break;
      const wait = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 500;
      console.warn(
        `[github] ${url} attempt ${attempt}/${MAX_ATTEMPTS} network error, retry in ${Math.round(wait)}ms: ${e}`,
      );
      await sleep(wait);
      continue;
    }
    if (res.ok) return res;
    const retryAfterMs = parseRetryAfterMs(res.headers.get("retry-after"));
    const resetWaitMs = rateLimitResetWaitMs(res);
    const detail = rateLimitDetail(res);
    // 403 without rate-limit signals is permanent: fail immediately.
    const retryable =
      res.status === 429 ||
      res.status >= 500 ||
      (res.status === 403 &&
        (retryAfterMs !== null || res.headers.get("x-ratelimit-remaining") === "0"));
    await res.arrayBuffer().catch(() => undefined);
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`GitHub API ${detail}: ${url}`);
    }
    const fallbackWait = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 500;
    const wait = Math.max(retryAfterMs ?? 0, resetWaitMs ?? 0, fallbackWait, 1000);
    if (wait > MAX_WAIT_MS) {
      throw new Error(
        `GitHub API ${detail}: ${url} (wait ${Math.round(wait / 1000)}s exceeds ${MAX_WAIT_MS / 1000}s cap, rerun later)`,
      );
    }
    console.warn(
      `[github] ${url} attempt ${attempt}/${MAX_ATTEMPTS} ${detail}, retry in ${Math.round(wait)}ms`,
    );
    await sleep(wait);
  }
  throw new Error(`GitHub API network failure: ${url}`, { cause: lastError });
}

// In-memory cache: in `astro dev` the frontmatter re-runs on every page
// request, so without this each reload would pay a full API round-trip.
// Refreshed at most once per hour. The in-flight promise is shared too,
// so parallel renders (index + version endpoint during `astro build`)
// collapse into a single request instead of racing two fetches.
let cache: { at: number; value: RepoMeta } | null = null;
let pendingCache: { at: number; promise: Promise<RepoMeta> } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function getRepoMeta(): Promise<RepoMeta> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  if (pendingCache && now - pendingCache.at < TTL_MS) return pendingCache.promise;
  const promise = fetchRepoMeta().then(
    (value) => {
      cache = { at: Date.now(), value };
      return value;
    },
    (e) => {
      if (pendingCache?.promise === promise) pendingCache = null;
      throw e;
    },
  );
  pendingCache = { at: now, promise };
  return promise;
}

async function fetchRepoMeta(): Promise<RepoMeta> {
  const res = await fetchGitHubApi(API);
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
// The version is resolved from the latest stable upstream release
// (tag `v<version>`) at build time, so a new lmc release is picked up
// on the next site build without a manual VERSION bump.

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
let releaseCacheKey: string | null = null;
// Same race as above: index.astro + version.ts render in parallel,
// so share the in-flight promise per key ("latest" or explicit tag).
const pendingReleases = new Map<string, { at: number; promise: Promise<ReleaseInfo> }>();

async function getCachedRelease(key: string, fetchArg: string): Promise<ReleaseInfo> {
  const now = Date.now();
  if (releaseCache && releaseCacheKey === key && now - releaseCache.at < TTL_MS)
    return releaseCache.value;
  const pending = pendingReleases.get(key);
  if (pending && now - pending.at < TTL_MS) return pending.promise;
  const promise = fetchReleaseInfo(fetchArg).then(
    (value) => {
      releaseCache = { at: Date.now(), value };
      releaseCacheKey = key;
      return value;
    },
    (e) => {
      if (pendingReleases.get(key)?.promise === promise) pendingReleases.delete(key);
      throw e;
    },
  );
  pendingReleases.set(key, { at: now, promise });
  return promise;
}

export async function getReleaseInfo(tag: string): Promise<ReleaseInfo> {
  return getCachedRelease(tag, tag);
}

// Latest stable release (drafts and prereleases excluded by the API).
// SITE_VERSION env overrides the lookup with a pinned tag `v<version>`
// for local debugging of an older release.
export async function getLatestReleaseInfo(): Promise<ReleaseInfo> {
  const pinned = process.env.SITE_VERSION;
  if (pinned) return getReleaseInfo(`v${pinned}`);
  return getCachedRelease("latest", "latest");
}

async function fetchReleaseInfo(tagOrLatest: string): Promise<ReleaseInfo> {
  const url =
    tagOrLatest === "latest"
      ? `${API}/releases/latest`
      : `${API}/releases/tags/${encodeURIComponent(tagOrLatest)}`;
  const res = await fetchGitHubApi(url);
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null)
    throw new Error(`GitHub API: unexpected release payload`);
  const rec = data as Record<string, unknown>;
  const tagName = typeof rec.tag_name === "string" ? rec.tag_name : null;
  const rawAssets = Array.isArray(rec.assets) ? rec.assets : null;
  if (tagName === null || rawAssets === null)
    throw new Error(`GitHub API: release fields missing`);
  if (!/^v\d+\.\d+\.\d+$/.test(tagName))
    throw new Error(`GitHub API: unexpected tag_name ${tagName}`);
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
