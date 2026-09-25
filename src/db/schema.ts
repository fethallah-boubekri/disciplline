import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('discipline.db');
  }
  return dbInstance;
}

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  categoryId TEXT NOT NULL,
  goalId TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  startDate TEXT NOT NULL,
  startTime TEXT NOT NULL,
  durationMinutes INTEGER,
  recurrenceType TEXT NOT NULL DEFAULT 'once',
  recurrenceDaysOfWeek TEXT,
  recurrenceEndDate TEXT,
  reminderEnabled INTEGER NOT NULL DEFAULT 0,
  reminderRepetitions INTEGER NOT NULL DEFAULT 1,
  reminderIntervalMinutes INTEGER NOT NULL DEFAULT 5,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (categoryId) REFERENCES categories(id),
  FOREIGN KEY (goalId) REFERENCES goals(id)
);

CREATE TABLE IF NOT EXISTS occurrences (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  scheduledDate TEXT NOT NULL,
  scheduledTime TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completedAt TEXT,
  missedAt TEXT,
  snoozedUntil TEXT,
  result TEXT,
  note TEXT,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_occurrences_date ON occurrences(scheduledDate);
CREATE INDEX IF NOT EXISTS idx_occurrences_task ON occurrences(taskId);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

const DEFAULT_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: 'Physical Development', icon: 'dumbbell', color: '#FF4757' },
  { name: 'University', icon: 'book', color: '#4E8CFF' },
  { name: 'Programming', icon: 'code', color: '#7C5CFF' },
  { name: 'Basketball', icon: 'basketball', color: '#FFB020' },
  { name: 'Business', icon: 'briefcase', color: '#2ED573' },
  { name: 'Personal', icon: 'user', color: '#9A9AA5' },
];

export function initDb() {
  const db = getDb();
  db.execSync(SCHEMA_SQL);

  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (row && row.count === 0) {
    const now = new Date().toISOString();
    for (const c of DEFAULT_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (id, name, icon, color, createdAt) VALUES (?, ?, ?, ?, ?)',
        [cryptoRandomId(), c.name, c.icon, c.color, now]
      );
    }
  }
}

// Lightweight UUID-free id generator (avoids a native crypto dependency).
export function cryptoRandomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
