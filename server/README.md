# ClientFlow Server

## Optional demo seed data

`server/sql/seed.sql` loads **optional local demo data** for portfolio screenshots and walkthroughs.

- It creates one dedicated demo account and workspace.
- Re-running it replaces only that dedicated demo workspace/account data.
- It does **not** truncate global tables or reset unrelated users/workspaces.
- Normal newly registered accounts still start empty.
- This demo data is local/dev only and must not be treated as production data.

### Demo login (local only)

- Email: `demo@clientflow.local`
- Password: `password`

### Run order

From a MySQL client connected to your local database:

1. Run `server/sql/schema.sql` (fresh schema).
2. Run `server/sql/seed.sql` (optional demo workspace/account only).

Example:

```bash
mysql -u <db_user> -p < server/sql/schema.sql
mysql -u <db_user> -p < server/sql/seed.sql
```
