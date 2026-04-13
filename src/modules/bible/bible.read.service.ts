import type { RowDataPacket } from 'mysql2';
import pool from '../../shared/database/connection';

function normVersion(v: string): string {
  return String(v).trim().toLowerCase();
}

function normBook(b: string): string {
  return String(b).trim().toLowerCase();
}

export async function listReadVersesInChapter(
  userId: number,
  version: string,
  bookAbbrev: string,
  chapter: number
): Promise<number[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT verse FROM bible_verse_reads
     WHERE user_id = ? AND version = ? AND book_abbrev = ? AND chapter = ?
     ORDER BY verse ASC`,
    [userId, normVersion(version), normBook(bookAbbrev), chapter]
  );
  return rows.map((r) => Number(r.verse));
}

export async function markVerseRead(
  userId: number,
  version: string,
  bookAbbrev: string,
  chapter: number,
  verse: number
): Promise<void> {
  await pool.execute(
    `INSERT INTO bible_verse_reads (user_id, version, book_abbrev, chapter, verse)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
    [userId, normVersion(version), normBook(bookAbbrev), chapter, verse]
  );
}

export async function unmarkVerseRead(
  userId: number,
  version: string,
  bookAbbrev: string,
  chapter: number,
  verse: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM bible_verse_reads
     WHERE user_id = ? AND version = ? AND book_abbrev = ? AND chapter = ? AND verse = ?`,
    [userId, normVersion(version), normBook(bookAbbrev), chapter, verse]
  );
}

/** Quantidade de versículos marcados como lidos por capítulo (para indicadores na grade). */
export async function countReadVersesByChapter(
  userId: number,
  version: string,
  bookAbbrev: string
): Promise<Record<number, number>> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT chapter, COUNT(*) AS cnt
     FROM bible_verse_reads
     WHERE user_id = ? AND version = ? AND book_abbrev = ?
     GROUP BY chapter`,
    [userId, normVersion(version), normBook(bookAbbrev)]
  );
  const out: Record<number, number> = {};
  for (const r of rows) {
    out[Number(r.chapter)] = Number(r.cnt);
  }
  return out;
}
