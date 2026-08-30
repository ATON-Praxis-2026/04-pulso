import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "pulso.db");

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec("PRAGMA journal_mode = WAL;");
  }
  return _db;
}

// node:sqlite devolve linhas com protótipo `null`. React recusa passá-las de um
// Server Component para um Client Component ("Only plain objects... can be
// passed"). Normalizar aqui, uma vez, evita o erro em todo gráfico.
const plano = <T,>(r: unknown): T => ({ ...(r as object) }) as T;

export function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db().prepare(sql).all(...(params as never[])).map((r) => plano<T>(r));
}

export function one<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined {
  const r = db().prepare(sql).get(...(params as never[]));
  return r === undefined ? undefined : plano<T>(r);
}
