import bcrypt from "bcryptjs";

export async function getUserByEmail(db: D1Database, email: string) {
  return db
    .prepare("SELECT id, username, name, email, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{
      id: string;
      username: string;
      name: string;
      email: string;
      password_hash: string;
    }>();
}

export async function getUserByUsername(db: D1Database, username: string) {
  return db
    .prepare("SELECT id, username, name, created_at FROM users WHERE username = ?")
    .bind(username)
    .first<{
      id: string;
      username: string;
      name: string;
      created_at: string;
    }>();
}

export async function createUser(
  db: D1Database,
  input: { username: string; name: string; email: string; password: string },
) {
  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(input.password, 10);

  await db
    .prepare("INSERT INTO users (id, username, name, email, password_hash) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, input.username, input.name, input.email, passwordHash)
    .run();

  // Create default lists
  const favId = crypto.randomUUID();
  const uploadId = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        "INSERT INTO recipe_lists (id, user_id, title, recipes) VALUES (?, ?, 'Favorites', '[]')",
      )
      .bind(favId, userId),
    db
      .prepare(
        "INSERT INTO recipe_lists (id, user_id, title, recipes) VALUES (?, ?, 'Uploads', '[]')",
      )
      .bind(uploadId, userId),
  ]);

  return {
    id: userId,
    username: input.username,
    name: input.name,
    lists: [
      { id: favId, title: "Favorites", recipes: [] },
      { id: uploadId, title: "Uploads", recipes: [] },
    ],
  };
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
