#!/bin/bash
# Manual migration script for when database is available
echo "Applying migration: add_user_authentication"
psql "$DATABASE_URL" -f prisma/migrations/20241224_add_user_authentication/migration.sql
echo "Migration complete!"
