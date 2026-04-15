export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
};

export type Env = {
  Bindings: Bindings;
  Variables: { userId: string; username: string };
};
