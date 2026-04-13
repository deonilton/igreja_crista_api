/**
 * Integração com Bible SuperSearch API — https://api.biblesupersearch.com/api
 *
 * Documentação resumida:
 * - Passagens: GET .../api?bible={modulo}&reference={ref}&data_format=minimal
 * - Busca:     GET .../api?bible={modulo}&search={termo}&data_format=minimal
 * - Metadados (livros): GET .../api/statics → results.books (id, name, shortname)
 *
 * A resposta traz `results.{modulo}` como array de { id, book, chapter, verse, text }.
 * Convertemos para o formato legado do frontend: { book: { name, abbrev }, chapter, number, text }.
 *
 * Fallback (opcional): bible-api.com se SuperSearch falhar (domínio público).
 */

const axios = require('axios');

const SUPERSEARCH_API = 'https://api.biblesupersearch.com/api';
const FALLBACK_BIBLE_API = 'https://bible-api.com';

/** Timeout por tentativa à SuperSearch (evita esperar 25s+ antes do fallback). */
const SUPERSEARCH_TIMEOUT_MS = 10000;
/** /statics só enriquece nomes dos livros (fundo); timeout curto — mapa local já cobre o fluxo. */
const SUPERSEARCH_STATICS_TIMEOUT_MS = 2500;
/** Capítulo inteiro costuma ser payload maior / mais lento — margem extra antes do fallback. */
const SUPERSEARCH_CHAPTER_TIMEOUT_MS = 18000;
const FALLBACK_HTTP_TIMEOUT_MS = 20000;
/** Poucas tentativas: host lento/bloqueado deve cair logo para bible-api.com ou mapa local. */
const NETWORK_RETRY_ATTEMPTS = 2;
const NETWORK_RETRY_DELAY_MS = 400;
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 100;

/**
 * Nomes dos 66 livros (ids 1–66) alinhados à Bible SuperSearch quando /api/statics não responde (ETIMEDOUT, etc.).
 */
const FALLBACK_BOOK_NAMES = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
];

const FALLBACK_BOOK_SHORTNAMES = [
  'Gen',
  'Exo',
  'Lev',
  'Num',
  'Deu',
  'Jos',
  'Jdg',
  'Rut',
  '1Sa',
  '2Sa',
  '1Ki',
  '2Ki',
  '1Ch',
  '2Ch',
  'Ezr',
  'Neh',
  'Est',
  'Job',
  'Psa',
  'Pro',
  'Ecc',
  'Sng',
  'Isa',
  'Jer',
  'Lam',
  'Ezk',
  'Dan',
  'Hos',
  'Joe',
  'Amo',
  'Oba',
  'Jon',
  'Mic',
  'Nah',
  'Hab',
  'Zep',
  'Hag',
  'Zec',
  'Mal',
  'Mat',
  'Mrk',
  'Luk',
  'Jhn',
  'Act',
  'Rom',
  '1Co',
  '2Co',
  'Gal',
  'Eph',
  'Php',
  'Col',
  '1Th',
  '2Th',
  '1Ti',
  '2Ti',
  'Tit',
  'Phm',
  'Heb',
  'Jam',
  '1Pe',
  '2Pe',
  '1Jo',
  '2Jo',
  '3Jo',
  'Jud',
  'Rev',
];

/** Versões do app → módulos reais na SuperSearch (ver /api/statics → results.bibles). */
const VERSION_TO_MODULE = {
  nvi: 'almeida_ra',
  ra: 'almeida_ra',
  acf: 'almeida_rc',
  almeida_ra: 'almeida_ra',
  almeida_rc: 'almeida_rc',
  kjv: 'kjv',
  kjv_strongs: 'kjv_strongs',
  bbe: 'bbe',
  web: 'web',
  asv: 'asv',
  rvr: 'rv_1909',
  rv_1909: 'rv_1909',
};

/** Abreviações PT (como em rotas antigas) → nome do livro aceito em `reference` com Almeida. */
const PT_ABBREV_TO_BOOK_NAME = {
  gn: 'Gênesis',
  ex: 'Êxodo',
  lv: 'Levítico',
  nm: 'Números',
  nb: 'Números',
  dt: 'Deuteronômio',
  js: 'Josué',
  jz: 'Juízes',
  rt: 'Rute',
  '1sm': '1 Samuel',
  '2sm': '2 Samuel',
  '1rs': '1 Reis',
  '2rs': '2 Reis',
  '1cr': '1 Crônicas',
  '2cr': '2 Crônicas',
  ed: 'Esdras',
  ne: 'Neemias',
  et: 'Ester',
  jó: 'Jó',
  job: 'Jó',
  sl: 'Salmos',
  pv: 'Provérbios',
  ec: 'Eclesiastes',
  ct: 'Cânticos',
  is: 'Isaías',
  jr: 'Jeremias',
  lm: 'Lamentações',
  ez: 'Ezequiel',
  dn: 'Daniel',
  os: 'Oséias',
  jl: 'Joel',
  am: 'Amós',
  ob: 'Obadias',
  jn: 'Jonas',
  mq: 'Miquéias',
  na: 'Naum',
  hc: 'Habacuque',
  sf: 'Sofonias',
  ag: 'Ageu',
  zc: 'Zacarias',
  ml: 'Malaquias',
  mt: 'Mateus',
  mc: 'Marcos',
  lc: 'Lucas',
  jo: 'João',
  at: 'Atos',
  rm: 'Romanos',
  '1co': '1 Coríntios',
  '2co': '2 Coríntios',
  gl: 'Gálatas',
  ef: 'Efésios',
  fp: 'Filipenses',
  cl: 'Colossenses',
  '1ts': '1 Tessalonicenses',
  '2ts': '2 Tessalonicenses',
  '1tm': '1 Timóteo',
  '2tm': '2 Timóteo',
  tt: 'Tito',
  fm: 'Filemom',
  hb: 'Hebreus',
  tg: 'Tiago',
  '1pe': '1 Pedro',
  '2pe': '2 Pedro',
  '1jo': '1 João',
  '2jo': '2 João',
  '3jo': '3 João',
  jd: 'Judas',
  ap: 'Apocalipse',
};

/** Ordem canônica protestante: 39 livros do Antigo Testamento. */
const OT_ABBREV_ORDER = [
  'gn',
  'ex',
  'lv',
  'nm',
  'dt',
  'js',
  'jz',
  'rt',
  '1sm',
  '2sm',
  '1rs',
  '2rs',
  '1cr',
  '2cr',
  'ed',
  'ne',
  'et',
  'jó',
  'sl',
  'pv',
  'ec',
  'ct',
  'is',
  'jr',
  'lm',
  'ez',
  'dn',
  'os',
  'jl',
  'am',
  'ob',
  'jn',
  'mq',
  'na',
  'hc',
  'sf',
  'ag',
  'zc',
  'ml',
];

/** Novo Testamento: 27 livros. */
const NT_ABBREV_ORDER = [
  'mt',
  'mc',
  'lc',
  'jo',
  'at',
  'rm',
  '1co',
  '2co',
  'gl',
  'ef',
  'fp',
  'cl',
  '1ts',
  '2ts',
  '1tm',
  '2tm',
  'tt',
  'fm',
  'hb',
  'tg',
  '1pe',
  '2pe',
  '1jo',
  '2jo',
  '3jo',
  'jd',
  'ap',
];

/**
 * Número de capítulos por abreviação PT (canônico protestante) — evita pedir cap. 72 em Gênesis, etc.
 */
const CHAPTERS_BY_ABBREV = {
  gn: 50,
  ex: 40,
  lv: 27,
  nm: 36,
  dt: 34,
  js: 24,
  jz: 21,
  rt: 4,
  '1sm': 31,
  '2sm': 24,
  '1rs': 22,
  '2rs': 25,
  '1cr': 29,
  '2cr': 36,
  ed: 10,
  ne: 13,
  et: 10,
  jó: 42,
  sl: 150,
  pv: 31,
  ec: 12,
  ct: 8,
  is: 66,
  jr: 52,
  lm: 5,
  ez: 48,
  dn: 12,
  os: 14,
  jl: 3,
  am: 9,
  ob: 1,
  jn: 4,
  mq: 7,
  na: 3,
  hc: 3,
  sf: 3,
  ag: 2,
  zc: 14,
  ml: 4,
  mt: 28,
  mc: 16,
  lc: 24,
  jo: 21,
  at: 28,
  rm: 16,
  '1co': 16,
  '2co': 13,
  gl: 6,
  ef: 6,
  fp: 4,
  cl: 4,
  '1ts': 5,
  '2ts': 3,
  '1tm': 6,
  '2tm': 4,
  tt: 3,
  fm: 1,
  hb: 13,
  tg: 5,
  '1pe': 5,
  '2pe': 3,
  '1jo': 5,
  '2jo': 1,
  '3jo': 1,
  jd: 1,
  ap: 22,
};

const CANON_ABBREVS_IN_ORDER = [...OT_ABBREV_ORDER, ...NT_ABBREV_ORDER];

/** id numérico do livro na SuperSearch (1..66, ordem protestante) → nome em português para a UI. */
const BOOK_ID_TO_PT_DISPLAY = {};
CANON_ABBREVS_IN_ORDER.forEach((abbrev, i) => {
  const nm = PT_ABBREV_TO_BOOK_NAME[abbrev];
  if (nm) BOOK_ID_TO_PT_DISPLAY[String(i + 1)] = nm;
});

function getMaxChaptersForBookKey(book) {
  if (book === null || book === undefined) return null;
  const s = String(book).trim();
  const lower = s.toLowerCase();
  if (CHAPTERS_BY_ABBREV[lower]) return CHAPTERS_BY_ABBREV[lower];
  if (/^\d+$/.test(s)) {
    const idx = Number(s);
    if (idx >= 1 && idx <= 66) {
      const abbrev = CANON_ABBREVS_IN_ORDER[idx - 1];
      return abbrev ? CHAPTERS_BY_ABBREV[abbrev] : null;
    }
  }
  for (const [ab, name] of Object.entries(PT_ABBREV_TO_BOOK_NAME)) {
    if (String(name).toLowerCase() === lower) return CHAPTERS_BY_ABBREV[ab];
  }
  return null;
}

/**
 * Catálogo estático para a UI (sem chamada HTTP): nomes em PT alinhados às abreviações usadas nas rotas.
 * @returns {{ oldTestament: Array<{order:number, abbrev:string, name:string, chapters:number}>, newTestament: Array<...> }}
 */
function getBooksCatalog() {
  const mapList = (orderArr) =>
    orderArr.map((abbrev, i) => ({
      order: i + 1,
      abbrev,
      name: PT_ABBREV_TO_BOOK_NAME[abbrev],
      chapters: CHAPTERS_BY_ABBREV[abbrev] ?? 1,
    }));
  return {
    oldTestament: mapList(OT_ABBREV_ORDER),
    newTestament: mapList(NT_ABBREV_ORDER),
  };
}

/** USFM → bible-api.com (fallback por capítulo/versículo). */
const PT_ABBREV_TO_USFM = {
  gn: 'GEN',
  ex: 'EXO',
  lv: 'LEV',
  nm: 'NUM',
  nb: 'NUM',
  dt: 'DEU',
  js: 'JOS',
  jz: 'JDG',
  rt: 'RUT',
  '1sm': '1SA',
  '2sm': '2SA',
  '1rs': '1KI',
  '2rs': '2KI',
  '1cr': '1CH',
  '2cr': '2CH',
  ed: 'EZR',
  ne: 'NEH',
  et: 'EST',
  jó: 'JOB',
  job: 'JOB',
  sl: 'PSA',
  pv: 'PRO',
  ec: 'ECC',
  ct: 'SNG',
  is: 'ISA',
  jr: 'JER',
  lm: 'LAM',
  ez: 'EZK',
  dn: 'DAN',
  os: 'HOS',
  jl: 'JOE',
  am: 'AMO',
  ob: 'OBA',
  jn: 'JON',
  mq: 'MIC',
  na: 'NAM',
  hc: 'HAB',
  sf: 'ZEP',
  ag: 'HAG',
  zc: 'ZEC',
  ml: 'MAL',
  mt: 'MAT',
  mc: 'MRK',
  lc: 'LUK',
  jo: 'JHN',
  at: 'ACT',
  rm: 'ROM',
  '1co': '1CO',
  '2co': '2CO',
  gl: 'GAL',
  ef: 'EPH',
  fp: 'PHP',
  cl: 'COL',
  '1ts': '1TH',
  '2ts': '2TH',
  '1tm': '1TI',
  '2tm': '2TI',
  tt: 'TIT',
  fm: 'PHM',
  hb: 'HEB',
  tg: 'JAS',
  '1pe': '1PE',
  '2pe': '2PE',
  '1jo': '1JN',
  '2jo': '2JN',
  '3jo': '3JN',
  jd: 'JUD',
  ap: 'REV',
};

/** USFM (ex.: PSA, PRO) → abreviação PT usada nas rotas (`sl`, `pv`). */
const USFM_TO_PT_ABBREV = {};
for (const [ptAb, usfm] of Object.entries(PT_ABBREV_TO_USFM)) {
  USFM_TO_PT_ABBREV[String(usfm).toUpperCase()] = ptAb;
}

function bookDisplayNamePtFromUsfmId(bookIdRaw) {
  if (bookIdRaw == null || bookIdRaw === '') return null;
  const k = String(bookIdRaw).toUpperCase().trim();
  const ptAb = USFM_TO_PT_ABBREV[k];
  return ptAb ? PT_ABBREV_TO_BOOK_NAME[ptAb] : null;
}

const VOTD_REFERENCES = [
  'João 3:16',
  'Salmos 23:1',
  'Romanos 8:28',
  'Filipenses 4:13',
  'Isaías 41:10',
  'Provérbios 3:5',
  'Jeremias 29:11',
  'Miqueias 6:8',
  'Mateus 11:28',
  'Lucas 6:31',
  '2 Coríntios 5:17',
  'Gálatas 5:22',
  'Efésios 2:8',
  'Hebreus 11:1',
  'Tiago 1:5',
  '1 Pedro 5:7',
  'Apocalipse 3:20',
];

let verseOfTheDayCache = { dateKey: null, payload: null };
/** @type {boolean} */
let staticsBackgroundFetchStarted = false;
/** @type {Map<string, { name: string, shortname: string }>|null} */
let booksById = null;

const responseCache = new Map();

function cacheGet(key) {
  const row = responseCache.get(key);
  if (!row) return null;
  if (Date.now() > row.exp) {
    responseCache.delete(key);
    return null;
  }
  return row.val;
}

function cacheSet(key, val) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const first = responseCache.keys().next().value;
    responseCache.delete(first);
  }
  responseCache.set(key, { val, exp: Date.now() + CACHE_TTL_MS });
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayOfYearUtc() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

function logFailure(context, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[bibleService] ${context}:`, msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Erros típicos de rede/firewall que costumam se recuperar com nova tentativa. */
function isRetryableNetworkError(err) {
  if (!err) return false;
  const code = err.code;
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'EHOSTUNREACH'
  ) {
    return true;
  }
  if (axios.isAxiosError(err) && !err.response && err.request) {
    return true;
  }
  return false;
}

/**
 * Executa `fn` até `attempts` vezes em falhas de rede recuperáveis (ex.: ETIMEDOUT).
 */
async function axiosWithRetry(fn, { attempts = NETWORK_RETRY_ATTEMPTS } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1 && isRetryableNetworkError(err)) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(NETWORK_RETRY_DELAY_MS * (i + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function buildFallbackBooksMapFromStatic() {
  const m = new Map();
  for (let i = 0; i < 66; i += 1) {
    m.set(String(i + 1), {
      name: FALLBACK_BOOK_NAMES[i],
      shortname: FALLBACK_BOOK_SHORTNAMES[i],
    });
  }
  return m;
}

function resolveBibleModule(version) {
  const key = String(version || 'nvi').toLowerCase();
  return VERSION_TO_MODULE[key] || 'almeida_ra';
}

/**
 * Garante mapa id→nome dos livros para normalizar respostas da SuperSearch.
 * Usa imediatamente o mapa local de 66 livros (sem esperar rede) e tenta /statics uma vez em segundo plano
 * para nomes oficiais da API — evita atrasar capítulos/buscas quando /statics está lento ou bloqueado.
 */
async function ensureBooksIndex() {
  if (!booksById) {
    booksById = buildFallbackBooksMapFromStatic();
  }
  if (staticsBackgroundFetchStarted) {
    return;
  }
  staticsBackgroundFetchStarted = true;
  (async () => {
    try {
      const { data } = await axiosWithRetry(
        () =>
          axios.get(`${SUPERSEARCH_API}/statics`, {
            timeout: SUPERSEARCH_STATICS_TIMEOUT_MS,
            headers: { Accept: 'application/json', 'User-Agent': 'IgrejaCrista-Pastoral/1.0' },
            validateStatus: (s) => s < 500,
          }),
        { attempts: 1 }
      );
      const list = data?.results?.books;
      if (!Array.isArray(list)) {
        throw new Error('Statics inválidos: falta results.books');
      }
      const map = new Map();
      for (const b of list) {
        map.set(String(b.id), { name: b.name, shortname: b.shortname || b.name });
      }
      booksById = map;
    } catch (e) {
      // Esperado quando a API está lenta, bloqueada ou sem rota — leitura já usa mapa local em memória.
      const dbg = process.env.BIBLE_DEBUG === '1' || process.env.BIBLE_DEBUG === 'true';
      if (dbg) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[bibleService] /statics (opcional) falhou — mapa local mantido:', msg);
      }
    }
  })();
}

/**
 * Converte identificador de livro (abrev PT, nome, ou id numérico) para string usada em `reference`.
 */
function resolveBookLabel(book, booksMap) {
  if (book === null || book === undefined) {
    throw new Error('Livro é obrigatório');
  }
  if (typeof book === 'number' || /^\d+$/.test(String(book))) {
    const id = String(book);
    const meta = booksMap.get(id);
    if (!meta) throw new Error(`Livro id ${id} desconhecido`);
    return meta.name;
  }
  const s = String(book).trim();
  const lower = s.toLowerCase();
  if (PT_ABBREV_TO_BOOK_NAME[lower]) {
    return PT_ABBREV_TO_BOOK_NAME[lower];
  }
  return s;
}

function buildReference(bookInput, chapter, verse, booksMap) {
  const name = resolveBookLabel(bookInput, booksMap);
  const ch = Number(chapter);
  if (Number.isNaN(ch)) throw new Error('Capítulo inválido');
  if (verse === undefined || verse === null) {
    return `${name} ${ch}`;
  }
  const v = Number(verse);
  if (Number.isNaN(v)) throw new Error('Versículo inválido');
  return `${name} ${ch}:${v}`;
}

function assertSupersearchOk(data, context) {
  if (!data || typeof data !== 'object') {
    throw new Error(`${context}: corpo inválido`);
  }
  if (Array.isArray(data.errors) && data.errors.length && data.error_level >= 4) {
    throw new Error(data.errors.join('; '));
  }
  if (data.results === false) {
    throw new Error((data.errors && data.errors.join('; ')) || 'Sem resultados');
  }
}

/**
 * Requisição GET à SuperSearch com cache curto e validação do envelope.
 * @param {object} [opts] opts.timeoutMs — timeout por tentativa (ex.: capítulo inteiro).
 */
async function supersearchGet(extraParams, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? SUPERSEARCH_TIMEOUT_MS;
  const params = {
    ...extraParams,
    data_format: 'minimal',
  };
  const cacheKey = `ss|${JSON.stringify(params)}|t${timeoutMs}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const { data } = await axiosWithRetry(() =>
    axios.get(SUPERSEARCH_API, {
      params,
      timeout: timeoutMs,
      headers: { Accept: 'application/json', 'User-Agent': 'IgrejaCrista-Pastoral/1.0' },
      validateStatus: (s) => s < 500,
    })
  );
  assertSupersearchOk(data, 'Bible SuperSearch');
  cacheSet(cacheKey, data);
  return data;
}

function rowsForModule(data, module) {
  const block = data.results[module];
  return Array.isArray(block) ? block : [];
}

/**
 * Formato legado consumido pelo React (Evita breaking change: `number` = nº do versículo).
 */
function toLegacyVerse(row, booksMap, versionQuery) {
  const id = String(row.book);
  const meta = booksMap.get(id);
  const idx = Number(row.book);
  const ptName =
    (idx >= 1 && idx <= 66 ? BOOK_ID_TO_PT_DISPLAY[id] : null) ||
    (meta ? meta.name : null) ||
    `Livro ${row.book}`;
  const ptAbbrev = idx >= 1 && idx <= 66 ? CANON_ABBREVS_IN_ORDER[idx - 1] : null;
  const enShort = meta ? meta.shortname : ptAbbrev || id;
  return {
    book: {
      name: ptName,
      abbrev: { pt: ptAbbrev || enShort, en: enShort },
      version: String(versionQuery).toLowerCase(),
    },
    chapter: row.chapter,
    number: row.verse,
    text: String(row.text || '')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

function bibleApiTranslationForFallback(version) {
  const m = resolveBibleModule(version);
  if (m === 'kjv' || String(version).toLowerCase() === 'kjv') return 'kjv';
  if (String(version).toLowerCase() === 'bbe') return 'bbe';
  return 'almeida';
}

function ptAbbrevToUsfm(book) {
  const key = String(book).toLowerCase().trim();
  return PT_ABBREV_TO_USFM[key] || key.toUpperCase();
}

async function fallbackSingleVerse(version, book, chapter, verse) {
  const tl = bibleApiTranslationForFallback(version);
  const usfm = ptAbbrevToUsfm(book);
  const path = `${usfm}+${chapter}:${verse}`;
  const { data } = await axiosWithRetry(() =>
    axios.get(`${FALLBACK_BIBLE_API}/${encodeURI(path)}`, {
      params: { translation: tl },
      timeout: FALLBACK_HTTP_TIMEOUT_MS,
      headers: { Accept: 'application/json', 'User-Agent': 'IgrejaCrista-Pastoral/1.0' },
      validateStatus: (s) => s < 500,
    })
  );
  if (data.error || !data.verses || !data.verses[0]) {
    throw new Error(data.error || 'Fallback bible-api.com sem dados');
  }
  const first = data.verses[0];
  const ptAb = USFM_TO_PT_ABBREV[String(first.book_id || '').toUpperCase().trim()];
  const ptName = bookDisplayNamePtFromUsfmId(first.book_id) || first.book_name;
  return {
    book: {
      name: ptName,
      abbrev: { pt: ptAb || null, en: first.book_id },
      version: String(version).toLowerCase(),
    },
    chapter: first.chapter,
    number: first.verse,
    text: String(first.text || '')
      .replace(/\s+/g, ' ')
      .trim(),
    _meta: {
      provider: 'bible-api.com',
      translation_used: data.translation_id,
      translation_name: data.translation_name,
      note: 'Bible SuperSearch indisponível; texto via bible-api.com (domínio público).',
    },
  };
}

/**
 * Capítulo completo via bible-api.com (USFM+cap), quando SuperSearch falha ou estoura timeout.
 */
async function fallbackVersesByChapter(version, book, chapter) {
  const tl = bibleApiTranslationForFallback(version);
  const usfm = ptAbbrevToUsfm(book);
  const path = `${usfm}+${chapter}`;
  const { data } = await axiosWithRetry(() =>
    axios.get(`${FALLBACK_BIBLE_API}/${encodeURI(path)}`, {
      params: { translation: tl },
      timeout: FALLBACK_HTTP_TIMEOUT_MS,
      headers: { Accept: 'application/json', 'User-Agent': 'IgrejaCrista-Pastoral/1.0' },
      validateStatus: (s) => s < 500,
    })
  );
  if (data.error || !Array.isArray(data.verses)) {
    throw new Error(data.error || 'Capítulo não disponível no provedor alternativo');
  }
  const ch = Number(chapter);
  const meta = {
    provider: 'bible-api.com',
    translation_used: data.translation_id,
    translation_name: data.translation_name,
    note: 'Bible SuperSearch indisponível ou lenta; capítulo via bible-api.com (domínio público).',
  };
  const verses = data.verses.map((v) => {
    const ptAb = USFM_TO_PT_ABBREV[String(v.book_id || '').toUpperCase().trim()];
    const ptName = bookDisplayNamePtFromUsfmId(v.book_id) || v.book_name;
    return {
      book: {
        name: ptName,
        abbrev: { pt: ptAb || null, en: v.book_id },
        version: String(version).toLowerCase(),
      },
      chapter: v.chapter,
      number: v.verse,
      text: String(v.text || '')
        .replace(/\s+/g, ' ')
        .trim(),
      _meta: meta,
    };
  });
  return {
    version: String(version).toLowerCase(),
    chapter: ch,
    verses,
  };
}

/**
 * Versículo do dia: passagem fixa por dia (UTC) + cache em memória; alterna lista se precisar.
 */
async function getVerseOfTheDay() {
  const key = utcDateKey();
  if (verseOfTheDayCache.dateKey === key && verseOfTheDayCache.payload) {
    return verseOfTheDayCache.payload;
  }

  const module = resolveBibleModule('nvi');
  const ref = VOTD_REFERENCES[dayOfYearUtc() % VOTD_REFERENCES.length];

  try {
    await ensureBooksIndex();
    const data = await supersearchGet({ bible: module, reference: ref });
    const rows = rowsForModule(data, module);
    const row = rows[0];
    if (!row) throw new Error('Versículo do dia vazio');
    const legacy = toLegacyVerse(row, booksById, 'nvi');
    verseOfTheDayCache = { dateKey: key, payload: legacy };
    return legacy;
  } catch (e) {
    logFailure('getVerseOfTheDay SuperSearch', e);
    try {
      const legacy = await fallbackSingleVerse('nvi', 'jo', 3, 16);
      verseOfTheDayCache = { dateKey: key, payload: legacy };
      return legacy;
    } catch (e2) {
      logFailure('getVerseOfTheDay fallback', e2);
      throw e;
    }
  }
}

/**
 * @param {string} version - parâmetro legado da rota (nvi, kjv, …)
 * @param {string|number} book - abrev PT, nome ou id numérico
 */
async function getVerseByReference(version, book, chapter, verse) {
  await ensureBooksIndex();
  const module = resolveBibleModule(version);
  const ref = buildReference(book, chapter, verse, booksById);

  try {
    const data = await supersearchGet({ bible: module, reference: ref });
    const rows = rowsForModule(data, module);
    const wantC = Number(chapter);
    const wantV = Number(verse);
    const row = rows.find((r) => r.chapter === wantC && r.verse === wantV) || rows[0];
    if (!row) throw new Error('Versículo não encontrado');
    return toLegacyVerse(row, booksById, version);
  } catch (e) {
    logFailure('getVerseByReference', e);
    try {
      return await fallbackSingleVerse(version, book, chapter, verse);
    } catch (e2) {
      logFailure('getVerseByReference fallback', e2);
      throw e;
    }
  }
}

/**
 * Capítulo inteiro → lista no formato legado (um objeto por versículo).
 */
async function getVersesByChapter(version, book, chapter) {
  await ensureBooksIndex();
  const chNum = Number(chapter);
  const maxC = getMaxChaptersForBookKey(book);
  if (maxC && (Number.isNaN(chNum) || chNum < 1 || chNum > maxC)) {
    const label = resolveBookLabel(book, booksById);
    const err = new Error(`${label} tem ${maxC} capítulo(s). Use um número entre 1 e ${maxC}.`);
    err.name = 'BibleValidationError';
    throw err;
  }
  const module = resolveBibleModule(version);
  const ref = buildReference(book, chapter, undefined, booksById);

  try {
    const data = await supersearchGet(
      { bible: module, reference: ref },
      { timeoutMs: SUPERSEARCH_CHAPTER_TIMEOUT_MS }
    );
    const rows = rowsForModule(data, module);
    return {
      version: String(version).toLowerCase(),
      chapter: Number(chapter),
      verses: rows.map((r) => toLegacyVerse(r, booksById, version)),
    };
  } catch (e) {
    logFailure('getVersesByChapter SuperSearch', e);
    try {
      return await fallbackVersesByChapter(version, book, chapter);
    } catch (e2) {
      logFailure('getVersesByChapter fallback', e2);
      throw e;
    }
  }
}

/**
 * Busca por palavra — retorno legado: { occurrence, version, verses }.
 */
async function searchVerses(keyword, version = 'nvi') {
  await ensureBooksIndex();
  const module = resolveBibleModule(version);
  const term = String(keyword || '').trim();
  if (!term) {
    throw new Error('Termo de busca vazio');
  }

  try {
    const data = await supersearchGet({ bible: module, search: term, page: 1 });
    const rows = rowsForModule(data, module);
    const total = data.paging && typeof data.paging.total === 'number' ? data.paging.total : rows.length;
    return {
      occurrence: total,
      version: String(version).toLowerCase(),
      verses: rows.map((r) => toLegacyVerse(r, booksById, version)),
    };
  } catch (e) {
    logFailure('searchVerses', e);
    throw e;
  }
}

/** Contagem de versículos por capítulo (numeração protestante usual). Índice 0 = capítulo 1. */
const VERSE_COUNTS_BY_BOOK = require('../data/bibleChapterVerseCounts.json');

/**
 * @param {string} bookAbbrev - ex.: gn, 1sm, jo, jó
 * @returns {number[] | null}
 */
function getVerseCountsByChapterArray(bookAbbrev) {
  const raw = String(bookAbbrev || '')
    .trim()
    .toLowerCase();
  let key = raw;
  if (!VERSE_COUNTS_BY_BOOK[key] && raw === 'nb') {
    key = 'nm';
  }
  const arr = VERSE_COUNTS_BY_BOOK[key];
  return Array.isArray(arr) ? arr : null;
}

module.exports = {
  getVerseOfTheDay,
  getVerseByReference,
  getVersesByChapter,
  searchVerses,
  getBooksCatalog,
  getVerseCountsByChapterArray,
};
