import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'streetbite.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');

    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      dbInstance.exec(schemaSql);
    }
  }
  return dbInstance;
}

const db = new Proxy({} as any, {
  get(target, prop) {
    const instance = getDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export default db;
