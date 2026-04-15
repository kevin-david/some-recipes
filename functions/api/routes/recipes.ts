import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { Env } from "../types";
import * as recipeDb from "../db/recipes";
import { addRecipeToList } from "../db/lists";

const recipes = new Hono<Env>();

recipes.get("/", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50", 10);
  return c.json(await recipeDb.listRecipes(c.env.DB, limit));
});

recipes.get("/:id", async (c) => {
  const recipe = await recipeDb.getRecipeById(c.env.DB, c.req.param("id"));
  if (!recipe) {
    return c.json({ error: "recipe not found" }, 404);
  }
  return c.json(recipe);
});

recipes.post("/", authMiddleware, async (c) => {
  const body = await c.req.json();
  const userId = c.get("userId");
  const id = crypto.randomUUID();

  await recipeDb.createRecipe(c.env.DB, id, userId, body);
  await addRecipeToList(c.env.DB, userId, "Uploads", id);

  return c.json(await recipeDb.getRecipeById(c.env.DB, id), 201);
});

recipes.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const owner = await recipeDb.getRecipeOwner(c.env.DB, id);
  if (!owner) {
    return c.json({ error: "recipe not found" }, 404);
  }
  if (owner.user_id !== c.get("userId")) {
    return c.json({ error: "not authorized" }, 401);
  }

  const body = await c.req.json();
  await recipeDb.updateRecipe(c.env.DB, id, body.recipe || body);

  return c.json(await recipeDb.getRecipeById(c.env.DB, id));
});

recipes.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const owner = await recipeDb.getRecipeOwner(c.env.DB, id);
  if (!owner) {
    return c.json({ error: "recipe not found" }, 404);
  }
  if (owner.user_id !== c.get("userId")) {
    return c.json({ error: "not authorized" }, 401);
  }

  await recipeDb.deleteRecipe(c.env.DB, id);
  return c.json({ message: "deleted recipe" });
});

export default recipes;
