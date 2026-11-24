import type { APIRoute } from "astro";
import { getLatestReleaseInfo } from "../lib/github";

export const GET: APIRoute = async () => {
  const { version } = await getLatestReleaseInfo();
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<lmcmessage>\n` +
    ` <head>\n` +
    `  <type>version</type>\n` +
    ` </head>\n` +
    ` <body>\n` +
    `  <winVersion>${version}</winVersion>\n` +
    `  <linVersion>${version}</linVersion>\n` +
    `  <macVersion>${version}</macVersion>\n` +
    ` </body>\n` +
    `</lmcmessage>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
