import { Hono } from "hono";
import { SignJWT } from "jose";
import { Bindings } from "../types";
import * as userDb from "../db/users";
import { getPopulatedListsByUserId } from "../db/lists";

const login = new Hono<{ Bindings: Bindings }>();

login.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.email || !body.password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  const user = await userDb.getUserByEmail(c.env.DB, body.email);
  if (!user) {
    return c.json({ error: "invalid username or password" }, 401);
  }

  if (!userDb.verifyPassword(body.password, user.password_hash)) {
    return c.json({ error: "invalid username or password" }, 401);
  }

  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  const lists = await getPopulatedListsByUserId(c.env.DB, user.id);

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      lists,
    },
  });
});

export default login;
