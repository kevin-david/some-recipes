const RECIPE_WITH_USER_SQL =
  "SELECT r.*, u.username, u.name as user_name FROM recipes r LEFT JOIN users u ON r.user_id = u.id";

interface RecipeRow {
  id: string;
  title: string;
  description: string;
  author: string;
  link: string;
  image_url: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  ingredients: string;
  directions: string;
  tags: string;
  notes: string;
  user_id: string;
  username?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export function parseRecipeRow(row: RecipeRow | null) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: row.author,
    link: row.link,
    imageURL: row.image_url,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    totalTime: row.total_time,
    ingredients: JSON.parse(row.ingredients || "[]"),
    directions: JSON.parse(row.directions || "[]"),
    tags: JSON.parse(row.tags || "[]"),
    notes: JSON.parse(row.notes || "[]"),
    userId: row.user_id,
    user: row.username
      ? { id: row.user_id, username: row.username, name: row.user_name }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRecipes(db: D1Database, limit: number) {
  const { results } = await db
    .prepare(`${RECIPE_WITH_USER_SQL} ORDER BY r.created_at DESC LIMIT ?`)
    .bind(limit)
    .all<RecipeRow>();
  return results.map(parseRecipeRow);
}

export async function getRecipeById(db: D1Database, id: string) {
  const row = await db
    .prepare(`${RECIPE_WITH_USER_SQL} WHERE r.id = ?`)
    .bind(id)
    .first<RecipeRow>();
  return parseRecipeRow(row);
}

export async function getRecipesByIds(db: D1Database, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await db
    .prepare(`${RECIPE_WITH_USER_SQL} WHERE r.id IN (${placeholders})`)
    .bind(...ids)
    .all<RecipeRow>();
  return results.map(parseRecipeRow);
}

export async function getRecipeOwner(db: D1Database, id: string) {
  return db
    .prepare("SELECT user_id FROM recipes WHERE id = ?")
    .bind(id)
    .first<{ user_id: string }>();
}

interface RecipeInput {
  title?: string;
  description?: string;
  author?: string;
  link?: string;
  imageURL?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  ingredients?: string[];
  directions?: string[];
  tags?: string[];
  notes?: string[];
}

export async function createRecipe(db: D1Database, id: string, userId: string, input: RecipeInput) {
  await db
    .prepare(
      `INSERT INTO recipes (id, user_id, title, description, author, link, image_url, prep_time, cook_time, total_time, ingredients, directions, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      input.title || "",
      input.description || "",
      input.author || "",
      input.link || "",
      input.imageURL || "",
      input.prepTime || 0,
      input.cookTime || 0,
      input.totalTime || 0,
      JSON.stringify(input.ingredients || []),
      JSON.stringify(input.directions || []),
      JSON.stringify(input.tags || []),
      JSON.stringify(input.notes || []),
    )
    .run();
}

export async function updateRecipe(db: D1Database, id: string, input: RecipeInput) {
  await db
    .prepare(
      `UPDATE recipes SET title = ?, description = ?, author = ?, link = ?, image_url = ?,
       prep_time = ?, cook_time = ?, total_time = ?,
       ingredients = ?, directions = ?, tags = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      input.title || "",
      input.description || "",
      input.author || "",
      input.link || "",
      input.imageURL || "",
      input.prepTime || 0,
      input.cookTime || 0,
      input.totalTime || 0,
      JSON.stringify(input.ingredients || []),
      JSON.stringify(input.directions || []),
      JSON.stringify(input.tags || []),
      JSON.stringify(input.notes || []),
      id,
    )
    .run();
}

export async function deleteRecipe(db: D1Database, id: string) {
  await db.prepare("DELETE FROM recipes WHERE id = ?").bind(id).run();
}

export async function searchByTitle(db: D1Database, terms: string) {
  const { results } = await db
    .prepare("SELECT * FROM recipes WHERE title LIKE ? LIMIT 50")
    .bind(`%${terms}%`)
    .all<RecipeRow>();
  return results.map(parseRecipeRow);
}

export async function searchByTags(db: D1Database, tags: string[]) {
  const placeholders = tags.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT DISTINCT r.* FROM recipes r, json_each(r.tags) je
       WHERE LOWER(je.value) IN (${placeholders}) LIMIT 50`,
    )
    .bind(...tags.map((t) => t.toLowerCase()))
    .all<RecipeRow>();
  return results.map(parseRecipeRow);
}
