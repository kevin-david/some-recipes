import { Hono } from "hono";
import { Bindings } from "../types";

const parse = new Hono<{ Bindings: Bindings }>();

// ISO 8601 duration parsing (e.g. PT1H30M -> 90 minutes)
const iso8601DurationRegex =
  /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;

function durationToMinutes(duration: string | undefined): number {
  if (!duration) {
    return 0;
  }
  const matches = duration.match(iso8601DurationRegex);
  if (!matches) {
    return 0;
  }
  let minutes = 0;
  minutes += parseInt(matches[7] || "0"); // minutes
  minutes += parseInt(matches[6] || "0") * 60; // hours
  minutes += parseInt(matches[5] || "0") * 60 * 24; // days
  minutes += parseInt(matches[4] || "0") * 60 * 24 * 7; // weeks
  return minutes;
}

// JSON-LD is arbitrary structured data from external sites — intentionally loose
// oxlint-disable-next-line typescript-eslint/no-explicit-any
type JsonLd = Record<string, any>; // eslint-disable-line

function isTypeRecipe(ld: JsonLd): boolean {
  const ldType = ld?.["@type"];
  if (!ldType) {
    return false;
  }
  if (typeof ldType === "string") {
    return ldType.toLowerCase() === "recipe";
  }
  if (Array.isArray(ldType)) {
    return ldType.some((e: string) => e.toLowerCase() === "recipe");
  }
  return false;
}

function prettyRecipe(recipe: JsonLd): JsonLd {
  const pretty: JsonLd = { ...recipe };

  // Normalize author
  if (pretty.author && typeof pretty.author !== "string") {
    pretty.author = (pretty.author as JsonLd)?.name || "";
  }

  // Normalize image
  if (typeof pretty.image !== "string" && Array.isArray(pretty.image)) {
    pretty.image = pretty.image[pretty.image.length - 1];
  }

  // Normalize instructions
  if (typeof pretty.recipeInstructions === "string") {
    pretty.recipeInstructions = [pretty.recipeInstructions];
  } else if (Array.isArray(pretty.recipeInstructions)) {
    pretty.recipeInstructions = pretty.recipeInstructions.map(
      (i: string | JsonLd) => (typeof i === "string" ? i : i.text) || "",
    );
  }

  if (pretty.recipeYield) {
    pretty.recipeYield = parseInt(pretty.recipeYield);
  }

  if (pretty.keywords && typeof pretty.keywords === "string") {
    pretty.keywords = pretty.keywords.split(",").map((k: string) => k.trim());
  }

  pretty.cookTime = durationToMinutes(pretty.cookTime);
  pretty.prepTime = durationToMinutes(pretty.prepTime);
  pretty.totalTime = durationToMinutes(pretty.totalTime);
  pretty.performTime = durationToMinutes(pretty.performTime);

  return pretty;
}

function findRecipeInLd(ld: JsonLd | JsonLd[]): JsonLd | null {
  if (!Array.isArray(ld) && isTypeRecipe(ld)) {
    return prettyRecipe(ld);
  }
  if (!Array.isArray(ld) && ld?.["@graph"]) {
    const graph = ld["@graph"];
    if (Array.isArray(graph)) {
      for (const item of graph) {
        if (isTypeRecipe(item)) {
          return prettyRecipe(item);
        }
      }
    }
  }
  if (Array.isArray(ld)) {
    for (const item of ld) {
      if (isTypeRecipe(item)) {
        return prettyRecipe(item);
      }
    }
  }
  return null;
}

// GET / — parse recipe from URL
parse.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: "url query parameter is required" }, 400);
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const html = await response.text();

    // Extract JSON-LD blocks using regex (no JSDOM in Workers)
    const regex =
      /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const ld = JSON.parse(match[1]);
        const recipe = findRecipeInLd(ld);
        if (recipe) {
          return c.json(recipe);
        }
      } catch {
        // skip malformed JSON-LD blocks
      }
    }

    const ldCount = (html.match(/application\/ld\+json/gi) || []).length;
    return c.json(
      {
        error: "no recipe found on page",
        debug: {
          status: response.status,
          ldBlocksFound: ldCount,
          htmlLength: html.length,
          body: html.length < 10000 ? html : undefined,
        },
      },
      404,
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return c.json({ error: `failed to fetch URL: ${message}` }, 400);
  }
});

export default parse;
