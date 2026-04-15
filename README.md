# Some Recipes

A recipe site for sharing with friends and family. Import recipes from the web or add your own.

Live at [some-recipes.pages.dev](https://some-recipes.pages.dev)

## Stack

- **Frontend**: React + TypeScript, built with Vite
- **API**: Hono on Cloudflare Workers (Pages Functions)
- **Database**: Cloudflare D1 (SQLite)
- **Infrastructure**: OpenTofu (`infra/`)
- **Tooling**: oxfmt, oxlint, tsgo

## Development

```bash
npm install
cp .dev.vars.example .dev.vars  # set JWT_SECRET for local dev

# Set up local D1 database
npx wrangler d1 migrations apply some-recipes-db --local

npm run dev       # local dev (wrangler + vite)
```

## Scripts

```bash
npm run check     # format check + lint + typecheck
npm run deploy    # check + build + deploy to Cloudflare Pages
npm run fmt       # auto-format
npm run lint      # lint only
npm run typecheck # type-check only
```

## Project Structure

```
src/                  # React frontend
functions/api/        # Hono API routes + D1 data layer
  routes/             # HTTP route handlers
  db/                 # Database queries
  middleware/         # Auth middleware
infra/                # OpenTofu (Cloudflare resources)
migrations/           # D1 schema migrations (wrangler d1 migrations)
```
