# Database Migrations

This directory contains SQL migration scripts for database schema changes.

## Running Migrations

### Using psql (PostgreSQL command line):

```bash
psql -U postgres -d pet_ai_model -f migrations/add_settings_column.sql
```

### Using Python script:

You can also run migrations programmatically using the database connection.

## Migration Files

- `add_settings_column.sql` - Adds the `settings` JSONB column to the `users` table

