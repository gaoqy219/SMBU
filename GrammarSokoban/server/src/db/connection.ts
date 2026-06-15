import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve('server/data/grammar.db');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function closeDb(): void {
  if (db) { saveDb(); db.close(); db = null; }
}

let saveInterval: ReturnType<typeof setInterval> | null = null;
export function startAutoSave(ms = 30000): void {
  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(saveDb, ms);
}
