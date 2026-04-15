import { Hono } from "hono";
import { Bindings } from "../types";
import { searchByTitle, searchByTags } from "../db/recipes";

const search = new Hono<{ Bindings: Bindings }>();

search.get("/", async (c) => {
  const type = c.req.query("type")?.toLowerCase();
  const terms = c.req.query("terms");

  if (!terms) {
    return c.json({ error: "no specified terms" }, 400);
  }

  if (type === "title") {
    return c.json(await searchByTitle(c.env.DB, terms));
  }

  if (type === "tag" || type === "tags") {
    return c.json(await searchByTags(c.env.DB, [terms]));
  }

  return c.json({ error: "invalid search type, use 'title' or 'tag'" }, 400);
});

export default search;
