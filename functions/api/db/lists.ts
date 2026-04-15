import { getRecipesByIds } from "./recipes";

interface ListRow {
  id: string;
  title: string;
  user_id: string;
  recipes: string;
}

export async function getListsByUserId(db: D1Database, userId: string) {
  const { results } = await db
    .prepare("SELECT id, title, user_id, recipes FROM recipe_lists WHERE user_id = ?")
    .bind(userId)
    .all<ListRow>();
  return results.map((l) => ({
    id: l.id,
    title: l.title,
    userId: l.user_id,
    recipes: JSON.parse(l.recipes || "[]"),
  }));
}

export async function getPopulatedListsByUserId(db: D1Database, userId: string) {
  const { results: lists } = await db
    .prepare("SELECT id, title, recipes FROM recipe_lists WHERE user_id = ?")
    .bind(userId)
    .all<ListRow>();

  return Promise.all(
    lists.map(async (list) => {
      const recipeIds: string[] = JSON.parse(list.recipes || "[]");
      const recipes = await getRecipesByIds(db, recipeIds);
      return { id: list.id, title: list.title, recipes };
    }),
  );
}

export async function getAllLists(db: D1Database) {
  const { results } = await db
    .prepare("SELECT id, title, user_id, recipes FROM recipe_lists")
    .all<ListRow>();
  return results.map((l) => ({
    id: l.id,
    title: l.title,
    userId: l.user_id,
    recipes: JSON.parse(l.recipes || "[]"),
  }));
}

export async function getListById(db: D1Database, id: string) {
  return db
    .prepare("SELECT id, title, user_id, recipes FROM recipe_lists WHERE id = ?")
    .bind(id)
    .first<ListRow>();
}

export async function getListOwner(db: D1Database, id: string) {
  return db
    .prepare("SELECT user_id FROM recipe_lists WHERE id = ?")
    .bind(id)
    .first<{ user_id: string }>();
}

export async function createList(db: D1Database, userId: string, title: string) {
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO recipe_lists (id, user_id, title, recipes) VALUES (?, ?, ?, '[]')")
    .bind(id, userId, title)
    .run();
  return { id, title, userId, recipes: [] };
}

export async function updateListRecipes(db: D1Database, id: string, recipeIds: string[]) {
  await db
    .prepare("UPDATE recipe_lists SET recipes = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(JSON.stringify(recipeIds), id)
    .run();
}

export async function addRecipeToList(
  db: D1Database,
  userId: string,
  listTitle: string,
  recipeId: string,
) {
  const list = await db
    .prepare("SELECT id, recipes FROM recipe_lists WHERE user_id = ? AND title = ?")
    .bind(userId, listTitle)
    .first<{ id: string; recipes: string }>();
  if (!list) {
    return;
  }
  const ids: string[] = JSON.parse(list.recipes || "[]");
  ids.push(recipeId);
  await updateListRecipes(db, list.id, ids);
}
