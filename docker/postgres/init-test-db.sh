#!/bin/bash
# Runs once, the first time the Postgres volume is created.
# Creates a separate "<POSTGRES_DB>_test" database for pytest, which drops all
# tables after each test and must never touch the app database.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "${POSTGRES_DB}_test";
EOSQL
