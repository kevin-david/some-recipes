import { Hono } from "hono";
import { Bindings } from "../types";
import * as userDb from "../db/users";
import { getPopulatedListsByUserId } from "../db/lists";

const users = new Hono<{ Bindings: Bindings }>();

users.get("/:username", async (c) => {
  const user = await userDb.getUserByUsername(c.env.DB, c.req.param("username"));
  if (!user) {
    return c.json({ error: "user not found" }, 404);
  }

  const lists = await getPopulatedListsByUserId(c.env.DB, user.id);

  return c.json({
    id: user.id,
    username: user.username,
    name: user.name,
    lists,
    createdAt: user.created_at,
  });
});

users.post("/", async (c) => {
  const body = await c.req.json();

  // Verify Turnstile token
  if (!body.turnstileToken) {
    return c.json({ error: "CAPTCHA verification required" }, 400);
  }
  const turnstileResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: c.env.TURNSTILE_SECRET,
        response: body.turnstileToken,
      }),
    },
  );
  const turnstileResult = await turnstileResponse.json<{ success: boolean }>();
  if (!turnstileResult.success) {
    return c.json({ error: "CAPTCHA verification failed" }, 400);
  }

  if (!body.password || body.password.length < 3) {
    return c.json({ error: "password must be at least 3 characters long" }, 400);
  }
  if (!body.username) {
    return c.json({ error: "username is required" }, 400);
  }
  if (!body.email) {
    return c.json({ error: "email is required" }, 400);
  }

  try {
    const result = await userDb.createUser(c.env.DB, {
      username: body.username,
      name: body.name || "",
      email: body.email,
      password: body.password,
    });
    return c.json(result, 201);
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("UNIQUE")) {
      return c.json({ error: "username or email already exists" }, 400);
    }
    throw e;
  }
});

export default users;
