import { getDb } from './connection.js';

export async function initSchema(): Promise<void> {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS grammar_structures (
      id TEXT PRIMARY KEY,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
      template TEXT NOT NULL,
      description_zh TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sentences (
      id TEXT PRIMARY KEY,
      structure_id TEXT NOT NULL REFERENCES grammar_structures(id),
      english TEXT,
      difficulty INTEGER NOT NULL,
      full_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sentence_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sentence_id TEXT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL,
      pinyin TEXT,
      role TEXT NOT NULL,
      UNIQUE(sentence_id, position)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sen_structure ON sentences(structure_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_comp_sentence ON sentence_components(sentence_id)`);
}
