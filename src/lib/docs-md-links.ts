// Sätteri mdast plugin: rewrite relative `*.md` links in /docs Markdown to
// the site's absolute `/docs/*` routes, and relative `images/*` image URLs
// to the absolute `/docs-images/*` served path.
//
// Docs sources live in the lmc repo and are read on GitHub too, where
// `[text](other-page.md)` and `![](images/shot.jpg)` (images next to the
// Markdown in `images/`) are the idiomatic working forms — so sources keep
// the relative form and the rewrite happens here at render time.
// The `images/` folder itself is copied from SITE_DOCS_DIR to the served
// path at build/dev startup (see astro.config.mjs).
// Absolute output (`/docs/build`, never `build`) also makes the index page
// robust: `/docs` (no trailing slash) resolves relative hrefs against `/`.
//
// Untouched: absolute URLs, anchors, `../` escapes (point outside /docs,
// GitHub-only), non-asset hrefs, raw HTML <img> (markdown-only rewrite,
// case-sensitive `images/` prefix). No satteri import: the definition is
// structural, so this module stays dependency-free.
interface MdNode {
  type?: string;
  url?: string;
  children?: MdNode[];
}

function rewrite(url: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) return url;
  const m = url.match(/^([^?#]*?)\.md([?#].*)?$/);
  if (!m) return url;
  const segs = m[1].split("/").filter((s) => s !== "" && s !== ".");
  if (segs.length === 0 || segs.some((s) => s === "..")) return url;
  const name = segs.join("/");
  const suffix = m[2] ?? "";
  return name === "index" ? `/docs/${suffix}` : `/docs/${name}${suffix}`;
}

function retarget(node: MdNode): MdNode | undefined {
  if (typeof node.url !== "string") return undefined;
  const url = rewrite(node.url);
  // Sätteri runs visitors on a native handle: in-place mutation is dropped,
  // only a returned replacement node is applied.
  return url === node.url ? undefined : { ...node, url };
}

// Docs images (`images/shot.jpg` next to the Markdown) are served at
// `/docs-images/` — see astro.config.mjs.
function rewriteImage(url: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) return url;
  const m = url.match(/^(?:\.\/)?images\/([^?#]+)([?#].*)?$/);
  if (!m || m[1].split("/").some((s) => s === "" || s === "." || s === "..")) return url;
  const suffix = m[2] ?? "";
  return `/docs-images/${m[1]}${suffix}`;
}

function retargetImage(node: MdNode): MdNode | undefined {
  if (typeof node.url !== "string") return undefined;
  const url = rewriteImage(node.url);
  return url === node.url ? undefined : { ...node, url };
}

const docsMdLinks = {
  name: "docs-md-links",
  // `definition` covers reference-style links.
  link(node: MdNode) {
    return retarget(node);
  },
  image(node: MdNode) {
    return retargetImage(node);
  },
  definition(node: MdNode) {
    return retarget(node) ?? retargetImage(node);
  },
};

export default docsMdLinks;
