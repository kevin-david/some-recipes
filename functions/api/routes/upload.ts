import { Hono } from "hono";
import { Env } from "../types";

const upload = new Hono<Env>();

// TODO: Implement R2 upload routes
upload.all("/*", (c) => {
  return c.json({ error: "upload routes not yet implemented" }, 501);
});

export default upload;
