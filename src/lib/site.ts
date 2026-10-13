// Where the /docs pages read their Markdown from — docs live next to the
// code in the lmc repo (lmc/docs/, frontmatter: title + optional description).
// Locally the lmc checkout sits next to this project, so the relative default
// works for dev/build; site CI checks out lmc into ./lmc and sets
// SITE_DOCS_DIR=lmc/docs (see .github/workflows/deploy.yml in the site repo).
export const DOCS_DIR = process.env.SITE_DOCS_DIR ?? "../lmc/docs";
