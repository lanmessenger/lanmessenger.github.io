// Sätteri mdast plugin: rewrite relative `*.md` links in /docs Markdown to
// the site's absolute `/docs/*` routes.
//
// Docs sources live in the lmc repo and are read on GitHub too, where
// `[text](other-page.md)` is the idiomatic working form — so sources keep
// the `.md` suffix and the rewrite happens here at render time.
// Absolute output (`/docs/build`, never `build`) also makes the index page
// robust: `/docs` (no trailing slash) resolves relative hrefs against `/`.
//
// Untouched: absolute URLs, anchors, `../` escapes (point outside /docs,
// GitHub-only), non-`.md` hrefs. No satteri import: the definition is
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

const docsMdLinks = {
  name: "docs-md-links",
  // `definition` covers reference-style links.
  link(node: MdNode) {
    return retarget(node);
  },
  definition(node: MdNode) {
    return retarget(node);
  },
};

export default docsMdLinks;
