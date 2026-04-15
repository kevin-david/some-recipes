import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { Env } from "../types";
import * as listDb from "../db/lists";
import { getRecipesByIds } from "../db/recipes";

const lists = new Hono<Env>();

lists.get("/", async (c) => {
  const userId = c.req.query("user");
  return c.json(
    userId ? await listDb.getListsByUserId(c.env.DB, userId) : await listDb.getAllLists(c.env.DB),
  );
});

lists.get("/:id", async (c) => {
  const list = await listDb.getListById(c.env.DB, c.req.param("id"));
  if (!list) {
    return c.json({ error: "list not found" }, 404);
  }

  const recipeIds: string[] = JSON.parse(list.recipes || "[]");
  const recipes = await getRecipesByIds(c.env.DB, recipeIds);

  return c.json({ id: list.id, title: list.title, userId: list.user_id, recipes });
});

lists.post("/", authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await listDb.createList(c.env.DB, c.get("userId"), body.title || "");
  return c.json(result, 201);
});

lists.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const owner = await listDb.getListOwner(c.env.DB, id);
  if (!owner) {
    return c.json({ error: "list not found" }, 404);
  }
  if (owner.user_id !== c.get("userId")) {
    return c.json({ error: "not authorized" }, 401);
  }

  const body = await c.req.json();
  const recipeIds = (body.recipes || []).map((r: string | { id: string }) =>
    typeof r === "string" ? r : r.id,
  );

  await listDb.updateListRecipes(c.env.DB, id, recipeIds);
  return c.json({ id, recipes: recipeIds });
});

export default lists;
