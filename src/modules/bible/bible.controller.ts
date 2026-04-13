import { Response } from 'express';
import axios from 'axios';
import type { AuthRequest } from '../../types';
import * as bibleReadService from './bible.read.service';

// Serviço em JavaScript (contrato solicitado): isolamento da API externa.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibleService = require('../../services/bibleService');

function mapBibleServiceError(err: unknown): { status: number; message: string } {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const msg =
      (err.response?.data && typeof err.response.data === 'object' && 'msg' in err.response.data
        ? String((err.response.data as { msg?: string }).msg)
        : null) || err.message;
    if (status === 404) return { status: 404, message: msg || 'Versículo não encontrado' };
    return { status: 502, message: msg || 'Erro ao consultar API bíblica' };
  }
  if (err instanceof Error) return { status: 502, message: err.message };
  return { status: 502, message: 'Erro desconhecido' };
}

class BibleController {
  /** Versículos já marcados como lidos no capítulo (por usuário e tradução). */
  getReadProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    const { version, book, chapter } = req.query;
    const userId = req.userId;
    if (userId == null) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!version || !book || chapter === undefined) {
      res.status(400).json({ error: 'Parâmetros obrigatórios: version, book, chapter' });
      return;
    }
    const ch = Number(chapter);
    if (!Number.isInteger(ch) || ch < 1) {
      res.status(400).json({ error: 'chapter inválido' });
      return;
    }
    try {
      const verses = await bibleReadService.listReadVersesInChapter(
        userId,
        String(version),
        String(book),
        ch
      );
      res.json({ verses });
    } catch (err) {
      console.error('[bible] getReadProgress', err);
      res.status(500).json({ error: 'Erro ao carregar progresso de leitura' });
    }
  };

  /** Por capítulo: quantos versículos já foram marcados como lidos no livro (mesma versão). */
  getReadProgressByBook = async (req: AuthRequest, res: Response): Promise<void> => {
    const { version, book } = req.query;
    const userId = req.userId;
    if (userId == null) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!version || !book) {
      res.status(400).json({ error: 'Parâmetros obrigatórios: version, book' });
      return;
    }
    try {
      const byChapter = await bibleReadService.countReadVersesByChapter(
        userId,
        String(version),
        String(book)
      );
      const verseTotals = bibleService.getVerseCountsByChapterArray(String(book)) ?? [];
      res.json({ byChapter, verseTotals });
    } catch (err) {
      console.error('[bible] getReadProgressByBook', err);
      res.status(500).json({ error: 'Erro ao carregar resumo de leitura' });
    }
  };

  /** Marca um versículo como lido (idempotente). */
  postReadProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (userId == null) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    const { version, book, chapter, verse } = req.body || {};
    if (!version || !book || chapter === undefined || verse === undefined) {
      res.status(400).json({ error: 'Corpo JSON: version, book, chapter, verse' });
      return;
    }
    const ch = Number(chapter);
    const vs = Number(verse);
    if (!Number.isInteger(ch) || ch < 1 || !Number.isInteger(vs) || vs < 1) {
      res.status(400).json({ error: 'chapter e verse devem ser inteiros positivos' });
      return;
    }
    try {
      await bibleReadService.markVerseRead(userId, String(version), String(book), ch, vs);
      res.status(204).send();
    } catch (err) {
      console.error('[bible] postReadProgress', err);
      res.status(500).json({ error: 'Erro ao salvar leitura' });
    }
  };

  /** Remove a marcação de lido. */
  deleteReadProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (userId == null) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    const { version, book, chapter, verse } = req.query;
    if (!version || !book || chapter === undefined || verse === undefined) {
      res.status(400).json({ error: 'Query: version, book, chapter, verse' });
      return;
    }
    const ch = Number(chapter);
    const vs = Number(verse);
    if (!Number.isInteger(ch) || ch < 1 || !Number.isInteger(vs) || vs < 1) {
      res.status(400).json({ error: 'chapter e verse inválidos' });
      return;
    }
    try {
      await bibleReadService.unmarkVerseRead(userId, String(version), String(book), ch, vs);
      res.status(204).send();
    } catch (err) {
      console.error('[bible] deleteReadProgress', err);
      res.status(500).json({ error: 'Erro ao atualizar leitura' });
    }
  };

  /** Proxy seguro para o versículo do dia (cache no serviço). */
  getVerseOfTheDay = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await bibleService.getVerseOfTheDay();
      res.json(data);
    } catch (err) {
      const { status, message } = mapBibleServiceError(err);
      res.status(status).json({ error: message });
    }
  };

  /** Busca um versículo por referência (query: version, book, chapter, verse). */
  getVerse = async (req: AuthRequest, res: Response): Promise<void> => {
    const { version, book, chapter, verse } = req.query;
    if (!version || !book || chapter === undefined || verse === undefined) {
      res.status(400).json({
        error: 'Parâmetros obrigatórios: version, book, chapter, verse',
      });
      return;
    }
    try {
      const data = await bibleService.getVerseByReference(
        String(version),
        String(book),
        Number(chapter),
        Number(verse)
      );
      res.json(data);
    } catch (err) {
      const { status, message } = mapBibleServiceError(err);
      res.status(status).json({ error: message });
    }
  };

  /** Capítulo inteiro: query version, book (abrev.), chapter */
  getChapter = async (req: AuthRequest, res: Response): Promise<void> => {
    const { version, book, chapter } = req.query;
    if (!version || !book || chapter === undefined) {
      res.status(400).json({
        error: 'Parâmetros obrigatórios: version, book, chapter',
      });
      return;
    }
    try {
      const data = await bibleService.getVersesByChapter(
        String(version),
        String(book),
        Number(chapter)
      );
      res.json(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'BibleValidationError') {
        res.status(400).json({ error: err.message });
        return;
      }
      const { status, message } = mapBibleServiceError(err);
      res.status(status).json({ error: message });
    }
  };

  /** Lista dos 66 livros (AT / NT) para referência na UI — dados estáticos do serviço. */
  getBooks = (_req: AuthRequest, res: Response): void => {
    try {
      const data = bibleService.getBooksCatalog();
      res.json(data);
    } catch (err) {
      const { status, message } = mapBibleServiceError(err);
      res.status(status).json({ error: message });
    }
  };

  /** Busca textual: repassa term (e version opcional) para POST na API externa. */
  search = async (req: AuthRequest, res: Response): Promise<void> => {
    const term = req.query.term;
    const version = req.query.version ? String(req.query.version) : 'nvi';
    if (term === undefined || String(term).trim() === '') {
      res.status(400).json({ error: 'Parâmetro term é obrigatório' });
      return;
    }
    try {
      const data = await bibleService.searchVerses(String(term).trim(), version);
      res.json(data);
    } catch (err) {
      const { status, message } = mapBibleServiceError(err);
      res.status(status).json({ error: message });
    }
  };
}

export default new BibleController();
