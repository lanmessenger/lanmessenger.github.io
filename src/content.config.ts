import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { DOCS_DIR } from "./lib/site";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: DOCS_DIR }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { docs };
