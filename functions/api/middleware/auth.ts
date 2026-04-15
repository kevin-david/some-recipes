import { MiddlewareHandler } from "hono";
import { jwtVerify } from "jose";
import { Env } from "../types";

export const authMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "missing or invalid authorization header" }, 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    c.set("userId", payload.id as string);
    c.set("username", payload.username as string);
    await next();
  } catch {
    return c.json({ error: "invalid or expired token" }, 401);
  }
};
