# Rules

## Database Migrations

- Always test migrations locally (`--local`) before applying to production (`--remote`)
- Wrap table recreation in `PRAGMA foreign_keys=OFF` / `ON` to prevent cascade deletes
- Check row counts before and after applying destructive migrations
- Never drop a table that has foreign key references without disabling foreign keys first
