import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/cloudflare-pages";

import recipes from "./routes/recipes";
import users from "./routes/users";
import login from "./routes/login";
import lists from "./routes/lists";
import search from "./routes/search";
import parse from "./routes/parse";
import upload from "./routes/upload";
import { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/recipes", recipes);
app.route("/users", users);
app.route("/login", login);
app.route("/lists", lists);
app.route("/search", search);
app.route("/parse", parse);
app.route("/upload", upload);

export const onRequest = handle(app);
