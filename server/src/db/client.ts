import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { DATABASE_URL } from '../config';
import * as schema from './schema';

const serverRoot = path.resolve(__dirname, '../..');
const dbPath = path.isAbsolute(DATABASE_URL)
  ? DATABASE_URL
  : path.resolve(serverRoot, DATABASE_URL);

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

migrate(db, {
  migrationsFolder: path.join(serverRoot, 'src/db/migrations'),
});
