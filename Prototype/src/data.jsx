/* Seed data for the migration tool */

const TENANT = 'KDB Bank';

/* DDL state on each project: { asis, tobe } where each side is either null
   (not yet imported) or metadata describing the imported DDL file.
   Demonstrates all four import states across the seeded project list. */
const ddlMeta = (filename, date, tables, columns) => ({ filename, uploadedAt: date, tables, columns });

/* Connection state — TO-BE only (JDBC). AS-IS 측은 더 이상 직접 접속하지 않고
   CSV → DuckDB staging 으로 처리한다. Mocked — real tool would test TCP/DB protocol. */
const connMeta = (status, opts = {}) => ({
  status, // 'ok' | 'failed' | 'stale' | 'untested' | 'testing'
  lastTestedAt: opts.lastTestedAt ?? (status === 'ok' ? '2 hr ago' : status === 'stale' ? '3 days ago' : status === 'failed' ? '5 min ago' : null),
  latencyMs: opts.latencyMs ?? (status === 'ok' ? 23 : null),
  detectedTables: opts.detectedTables ?? null,
  error: opts.error ?? (status === 'failed' ? 'Timeout after 30s (mock)' : null),
  credentials: {
    username: opts.username ?? 'app_ops',
    authMethod: opts.authMethod ?? 'password',
    passwordSet: opts.passwordSet !== false,
    lastRotated: opts.lastRotated ?? '2026-03-15',
  },
});

/* CSV source descriptor — 야간 추출 파일 메타. delimiter='FB' 면 메인프레임
   고정-블록(record length) 파일, 그 외에는 일반 텍스트 구분자. */
const csvMeta = (opts = {}) => ({
  filename: opts.filename ?? 'extract.csv',
  encoding: opts.encoding ?? 'UTF-8',
  delimiter: opts.delimiter ?? ',',
  recordLength: opts.recordLength ?? null,
  hasHeader: opts.hasHeader ?? false,
  arrivedAt: opts.arrivedAt ?? null,
  parseStatus: opts.parseStatus ?? 'untested',  // 'ok' | 'failed' | 'pending' | 'untested'
  recordCount: opts.recordCount ?? null,
  parseError: opts.parseError ?? null,
});

/* Staging descriptor — 도구 내장 DuckDB. 외부 host/port 같은 인프라 설정은
   사용자에게 노출하지 않는다 (도구가 알아서 처리). */
const stagingMeta = (opts = {}) => ({
  store: opts.store ?? null,
  storeSizeBytes: opts.storeSizeBytes ?? null,
  tables: opts.tables ?? 0,
  loaded: opts.loaded ?? false,
  loadedAt: opts.loadedAt ?? null,
  schemaMatch: opts.schemaMatch ?? 'pending',  // 'ok' | 'mismatch' | 'pending'
  schemaMismatchDetail: opts.schemaMismatchDetail ?? null,
  /* dbReady — 적재된 AS-IS DB 가 *현재* 읽을 수 있는 상태인지.
     'ok' = 파일 열기·메타테이블 조회 OK
     'failed' = 파일 손상·잠금·권한 등 접근 실패 (운영 트러블 시)
     'pending' = 아직 적재 안 됨 (loaded=false 일 때 자동) */
  dbReady: opts.dbReady ?? (opts.loaded ? 'ok' : 'pending'),
  dbReadyDetail: opts.dbReadyDetail ?? null,
});

/* Project lifecycle phase — reflects the 6-phase real-world migration flow.
   planning → analysis → rehearsal → sign-off → cutover → hypercare → done
   The legacy `status` field (running/waiting/done) is kept for backwards
   compat (dashboard stats etc.) but phase is the new source of truth. */
/* Phase color tokens — 사용자 합의된 톤. 배지 텍스트/테두리(color) + 옅은 배경(bg).
   이 배열이 단일 진실이며 app.jsx · sidebar.jsx 등 모든 phase 뱃지가 이걸 참조한다. */
const PHASES = [
  { k: 'planning',  l: 'Planning',   color: '#A78BFA', bg: '#EDE9FE', desc: '아이디어·구상 단계, 차분한 시작' },
  { k: 'analysis',  l: 'Analysis',   color: '#38BDF8', bg: '#E0F2FE', desc: '데이터 분석, 논리적·기술적' },
  { k: 'rehearsal', l: 'Rehearsal',  color: '#FB923C', bg: '#FFEDD5', desc: '반복 훈련, 에너지·진행감' },
  { k: 'sign-off',  l: 'Sign-off',   color: '#FACC15', bg: '#FEF9C3', desc: '대기 중, 주의·보류 상태' },
  { k: 'cutover',   l: 'Cutover',    color: '#F87171', bg: '#FEE2E2', desc: '고긴장 구간, 즉각 인지 필요' },
  { k: 'hypercare', l: 'Hypercare',  color: '#4ADE80', bg: '#DCFCE7', desc: '안정화 중, 회복·모니터링' },
  { k: 'done',      l: 'Done',       color: '#94A3B8', bg: '#F1F5F9', desc: '종료·아카이브, 조용히 마무리' },
];

const cutoverMeta = (dday, freezeHours, rollbackSla) => ({ dday, freezeHours, rollbackSla });

const PROJECTS = [
  { id: 'p1', name: '계정원장',           client: TENANT, tables: 142, status: 'waiting', phase: 'analysis',  src: 'Mainframe (EBCDIC)', tgt: 'PostgreSQL 15',  updated: '2 min ago',
    ddl: { asis: ddlMeta('core-legacy.ddl',      '2026-04-18 14:22', 142, 1820), tobe: ddlMeta('core-target.sql',     '2026-04-19 09:05', 138, 1740) },
    csvSource: csvMeta({ filename: 'core_extract_2026-04-22.csv', encoding: 'EBCDIC-KANA', delimiter: 'FB', recordLength: 512, hasHeader: false, arrivedAt: '2026-04-22 03:15', parseStatus: 'ok', recordCount: 18_442_331 }),
    staging: stagingMeta({ store: 'data/staging/p1.duckdb', storeSizeBytes: 1_200_000_000, tables: 142, loaded: true, loadedAt: '2026-04-22 04:20', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 18, detectedTables: 138 }) },
    cutover: cutoverMeta('2026-05-15 22:00 KST', 24, 15) },
  { id: 'p2', name: '수신원장',           client: TENANT, tables: 87,  status: 'waiting', phase: 'sign-off',  src: 'Oracle 11g',         tgt: 'PostgreSQL 15',  updated: '8 min ago',
    ddl: { asis: ddlMeta('deposit-ora11.sql',    '2026-04-10 11:30',  87,  942), tobe: ddlMeta('deposit-pg15.sql',    '2026-04-10 17:18',  85,  880) },
    csvSource: csvMeta({ filename: 'deposit_extract_2026-04-21.csv', encoding: 'UTF-8', delimiter: ',', hasHeader: true, arrivedAt: '2026-04-21 02:48', parseStatus: 'ok', recordCount: 9_412_330 }),
    staging: stagingMeta({ store: 'data/staging/p2.duckdb', storeSizeBytes: 612_000_000, tables: 87, loaded: true, loadedAt: '2026-04-21 03:55', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 22, detectedTables: 85 }) },
    cutover: cutoverMeta('2026-05-17 22:00 KST', 24, 20) },
  { id: 'p3', name: '외환',               client: TENANT, tables: 34,  status: 'waiting', phase: 'analysis',  src: 'Mainframe (EBCDIC)', tgt: 'Linux / UTF-8',  updated: '1 hr ago',
    ddl: { asis: ddlMeta('fx-mainframe.ddl',     '2026-04-20 10:11',  34,  412), tobe: null },
    csvSource: csvMeta({ filename: 'fx_extract_2026-04-22.dat', encoding: 'EBCDIC-KANA', delimiter: 'FB', recordLength: 384, hasHeader: false, arrivedAt: '2026-04-22 03:08', parseStatus: 'pending' }),
    staging: stagingMeta({ store: 'data/staging/p3.duckdb', loaded: false, schemaMatch: 'pending' }),
    connections: { tobe: connMeta('untested') },
    cutover: cutoverMeta('2026-06-14 20:00 KST', 12, 30) },
  { id: 'p4', name: '여신',               client: TENANT, tables: 61,  status: 'waiting', phase: 'analysis',  src: 'Oracle 12c',         tgt: 'PostgreSQL 15',  updated: '3 hr ago',
    ddl: { asis: null,                                                           tobe: ddlMeta('loan-pg-target.sql',  '2026-04-21 16:02',  58,  726) },
    csvSource: csvMeta({ filename: 'loan_extract_2026-04-22.csv', encoding: 'UTF-8', delimiter: ',', hasHeader: true, arrivedAt: null, parseStatus: 'untested' }),
    staging: stagingMeta({ store: 'data/staging/p4.duckdb', loaded: false, schemaMatch: 'pending' }),
    connections: { tobe: connMeta('ok', { latencyMs: 15, detectedTables: 58 }) },
    cutover: cutoverMeta('2026-06-28 22:00 KST', 24, 30) },
  { id: 'p5', name: '카드승인',           client: TENANT, tables: 28,  status: 'done',    phase: 'hypercare', src: 'Mainframe (EBCDIC)', tgt: 'PostgreSQL 14',  updated: 'Mar 14',
    ddl: { asis: ddlMeta('card-mf.ddl',          '2026-02-28 09:00',  28,  312), tobe: ddlMeta('card-pg14.sql',       '2026-03-01 14:40',  28,  310) },
    csvSource: csvMeta({ filename: 'card_extract_2026-03-01.dat', encoding: 'EBCDIC-KANA', delimiter: 'FB', recordLength: 256, hasHeader: false, arrivedAt: '2026-03-01 02:50', parseStatus: 'ok', recordCount: 142_882_004 }),
    staging: stagingMeta({ store: 'data/staging/p5.duckdb', storeSizeBytes: 8_400_000_000, tables: 28, loaded: true, loadedAt: '2026-03-01 04:12', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 19, detectedTables: 28 }) },
    cutover: cutoverMeta('2026-03-14 22:00 KST', 24, 15) },
  { id: 'p6', name: '총계정원장',         client: TENANT, tables: 113, status: 'done',    phase: 'done',      src: 'Oracle 11g',         tgt: 'PostgreSQL 15',  updated: 'Feb 28',
    ddl: { asis: ddlMeta('gl-ora.sql',           '2026-02-08 10:20', 113, 1240), tobe: ddlMeta('gl-pg.sql',           '2026-02-08 15:55', 110, 1180) },
    csvSource: csvMeta({ filename: 'gl_extract_2026-02-08.csv', encoding: 'UTF-8', delimiter: ',', hasHeader: true, arrivedAt: '2026-02-08 02:35', parseStatus: 'ok', recordCount: 101_102_421 }),
    staging: stagingMeta({ store: 'data/staging/p6.duckdb', storeSizeBytes: 4_800_000_000, tables: 113, loaded: true, loadedAt: '2026-02-08 03:42', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 20, detectedTables: 110 }) },
    cutover: cutoverMeta('2026-02-28 20:00 KST', 18, 20) },
  { id: 'p7', name: '무역금융',           client: TENANT, tables: 19,  status: 'done',    phase: 'done',      src: 'Mainframe (EBCDIC)', tgt: 'Linux / UTF-8',  updated: 'Feb 02',
    ddl: { asis: ddlMeta('trade-mf.ddl',         '2026-01-24 13:15',  19,  208), tobe: ddlMeta('trade-flat.yaml',     '2026-01-24 18:40',  19,  208) },
    csvSource: csvMeta({ filename: 'trade_extract_2026-01-24.dat', encoding: 'EUC-KR', delimiter: 'FB', recordLength: 512, hasHeader: false, arrivedAt: '2026-01-24 03:01', parseStatus: 'ok', recordCount: 4_280_115 }),
    staging: stagingMeta({ store: 'data/staging/p7.duckdb', storeSizeBytes: 280_000_000, tables: 19, loaded: true, loadedAt: '2026-01-24 03:48', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 24, detectedTables: 19 }) },
    cutover: cutoverMeta('2026-02-02 22:00 KST', 12, 20) },
  { id: 'p8', name: '송금허브',           client: TENANT, tables: 0,   status: 'waiting', phase: 'planning',  src: 'Oracle 19c',         tgt: 'PostgreSQL 16',  updated: 'just now',  isNew: true,
    ddl: { asis: null, tobe: null },
    csvSource: null,
    staging: null,
    connections: { tobe: connMeta('untested') },
    cutover: cutoverMeta('TBD', 24, 30) },
  { id: 'p9', name: '인터넷뱅킹',         client: TENANT, tables: 52,  status: 'running', phase: 'cutover',   src: 'WebSphere · DB2',    tgt: 'Spring Boot · PostgreSQL 15', updated: 'just now',
    ddl: { asis: ddlMeta('ib-db2.sql',            '2026-04-12 09:30',  52,  712), tobe: ddlMeta('ib-pg15.sql',         '2026-04-12 14:15',  52,  712) },
    csvSource: csvMeta({ filename: 'ib_extract_2026-04-12.csv', encoding: 'UTF-8', delimiter: ',', hasHeader: true, arrivedAt: '2026-04-12 02:55', parseStatus: 'ok', recordCount: 24_882_440 }),
    staging: stagingMeta({ store: 'data/staging/p9.duckdb', storeSizeBytes: 1_900_000_000, tables: 52, loaded: true, loadedAt: '2026-04-12 04:08', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 17, detectedTables: 52 }) },
    cutover: cutoverMeta('2026-05-08 22:00 KST', 24, 30) },
  { id: 'p10', name: '신용평가',          client: TENANT, tables: 38, status: 'running', phase: 'rehearsal', src: 'Oracle 12c', tgt: 'PostgreSQL 15', updated: 'just now',
    ddl: { asis: ddlMeta('credit-ora12.sql', '2026-04-25 10:00', 38, 462), tobe: ddlMeta('credit-pg15.sql', '2026-04-26 14:20', 38, 462) },
    csvSource: csvMeta({ filename: 'credit_extract_2026-04-25.csv', encoding: 'UTF-8', delimiter: ',', hasHeader: true, arrivedAt: '2026-04-25 02:42', parseStatus: 'ok', recordCount: 6_184_220 }),
    staging: stagingMeta({ store: 'data/staging/p10.duckdb', storeSizeBytes: 540_000_000, tables: 38, loaded: true, loadedAt: '2026-04-25 03:30', schemaMatch: 'ok' }),
    connections: { tobe: connMeta('ok', { latencyMs: 14, detectedTables: 38 }) },
    cutover: cutoverMeta('2026-06-05 22:00 KST', 24, 25) },
];

/* Dashboard tables — per-project run-progress mock used by ExportTab/Artifacts.
   Keep p1 array as the original demo data; other projects mirror their domain
   tables and SCHEMA_DIFF coverage. */
const TABLES_P1 = [
  { name: 'ACCT_MASTER',        rows: 18_442_331, done: 18_442_331, pct: 100, status: 'ok',      rule: 42, issues: 0,  updated: '09:41:02', schema: 'PROD_CORE' },
  { name: 'TXN_JOURNAL_2023',   rows: 284_003_117, done: 201_554_440, pct: 70.9, status: 'running', rule: 87, issues: 2,  updated: '09:41:08', schema: 'PROD_CORE' },
  { name: 'TXN_JOURNAL_2024',   rows: 312_889_001, done: 218_995_337, pct: 70.0, status: 'running', rule: 87, issues: 0,  updated: '09:41:08', schema: 'PROD_CORE' },
  { name: 'CUST_PROFILE',       rows: 2_118_774,  done: 2_118_774, pct: 100, status: 'ok',      rule: 31, issues: 0,  updated: '09:12:41', schema: 'PROD_CORE' },
  { name: 'CUST_CONTACT',       rows: 4_882_091,  done: 4_882_091, pct: 100, status: 'ok',      rule: 14, issues: 0,  updated: '09:14:03', schema: 'PROD_CORE' },
  { name: 'ADDR_HIST',          rows: 9_014_220,  done: 6_102_334, pct: 67.7, status: 'running', rule: 9,  issues: 0,  updated: '09:41:01', schema: 'PROD_CORE' },
  { name: 'KYC_DOCUMENT',       rows: 1_204_553,  done: 0,          pct: 0,   status: 'blocked', rule: 23, issues: 1,  updated: '09:02:18', schema: 'PROD_RISK' },
  { name: 'LOAN_APPLICATION',   rows: 884_112,    done: 884_112,    pct: 100, status: 'ok',      rule: 55, issues: 0,  updated: '08:54:22', schema: 'PROD_LOAN' },
  { name: 'LOAN_DISBURSEMENT',  rows: 612_004,    done: 612_004,    pct: 100, status: 'ok',      rule: 48, issues: 0,  updated: '08:57:10', schema: 'PROD_LOAN' },
  { name: 'LOAN_REPAYMENT',     rows: 5_412_889,  done: 2_118_332,  pct: 39.1, status: 'running', rule: 48, issues: 0,  updated: '09:41:04', schema: 'PROD_LOAN' },
  { name: 'CARD_MASTER',        rows: 3_002_114,  done: 0,          pct: 0,   status: 'queued',  rule: 17, issues: 0,  updated: '—',        schema: 'PROD_CARD' },
  { name: 'CARD_AUTH_LOG',      rows: 812_004_552, done: 0,         pct: 0,   status: 'queued',  rule: 22, issues: 0,  updated: '—',        schema: 'PROD_CARD' },
  { name: 'FX_RATE_DAILY',      rows: 44_211,     done: 44_211,     pct: 100, status: 'ok',      rule: 6,  issues: 0,  updated: 'yesterday',schema: 'PROD_FX' },
  { name: 'FX_POSITION',        rows: 120_554,    done: 120_554,    pct: 100, status: 'ok',      rule: 11, issues: 0,  updated: 'yesterday',schema: 'PROD_FX' },
  { name: 'GL_BALANCE',         rows: 2_881_009,  done: 2_881_009,  pct: 100, status: 'ok',      rule: 19, issues: 0,  updated: 'yesterday',schema: 'PROD_GL' },
  { name: 'GL_ENTRY',           rows: 98_221_412, done: 51_104_331, pct: 52.0, status: 'warn',    rule: 35, issues: 4,  updated: '09:40:55', schema: 'PROD_GL' },
  { name: 'BRANCH_MASTER',      rows: 1_814,      done: 1_814,      pct: 100, status: 'ok',      rule: 8,  issues: 0,  updated: 'Mar 30',  schema: 'PROD_ORG' },
  { name: 'EMPLOYEE',           rows: 22_104,     done: 22_104,     pct: 100, status: 'ok',      rule: 12, issues: 0,  updated: 'Mar 30',  schema: 'PROD_ORG' },
];

/* p2 - 수신원장 sign-off — all tables migrated successfully */
const TABLES_P2 = [
  { name: 'DEPOSIT_ACCOUNT',     rows: 8_412_330,   done: 8_412_330,   pct: 100, status: 'ok', rule: 11, issues: 0, updated: 'yesterday', schema: 'PROD_DEPOSIT' },
  { name: 'DEPOSIT_TRANSACTION', rows: 142_881_004, done: 142_881_004, pct: 100, status: 'ok', rule: 7,  issues: 0, updated: 'yesterday', schema: 'PROD_DEPOSIT' },
  { name: 'INTEREST_PAYMENT',    rows: 18_004_551,  done: 18_004_551,  pct: 100, status: 'ok', rule: 6,  issues: 0, updated: 'yesterday', schema: 'PROD_DEPOSIT' },
];

/* p3 - 외환 analysis — no run yet */
const TABLES_P3 = [];

/* p4 - 여신 analysis — no run yet */
const TABLES_P4 = [];

/* p5 - 카드승인 hypercare — completed, all OK */
const TABLES_P5 = [
  { name: 'CARD_MASTER',   rows: 3_002_114,   done: 3_002_114,   pct: 100, status: 'ok', rule: 10, issues: 0, updated: 'Mar 14', schema: 'PROD_CARD' },
  { name: 'CARD_AUTH_LOG', rows: 812_004_552, done: 812_004_552, pct: 100, status: 'ok', rule: 8,  issues: 0, updated: 'Mar 14', schema: 'PROD_CARD' },
  { name: 'MERCHANT',      rows: 124_882,     done: 124_882,     pct: 100, status: 'ok', rule: 6,  issues: 0, updated: 'Mar 14', schema: 'PROD_CARD' },
];

/* p6 - 총계정원장 done — completed long ago */
const TABLES_P6 = [
  { name: 'GL_ACCOUNT', rows: 18_442,     done: 18_442,     pct: 100, status: 'ok', rule: 6, issues: 0, updated: 'Feb 28', schema: 'PROD_GL' },
  { name: 'GL_JOURNAL', rows: 98_221_412, done: 98_221_412, pct: 100, status: 'ok', rule: 7, issues: 0, updated: 'Feb 28', schema: 'PROD_GL' },
  { name: 'GL_BALANCE', rows: 2_881_009,  done: 2_881_009,  pct: 100, status: 'ok', rule: 5, issues: 0, updated: 'Feb 28', schema: 'PROD_GL' },
];

/* p7 - 무역금융 done */
const TABLES_P7 = [
  { name: 'LC_MASTER',   rows: 88_412,  done: 88_412,  pct: 100, status: 'ok', rule: 9, issues: 0, updated: 'Feb 02', schema: 'PROD_TRADE' },
  { name: 'EXPORT_BILL', rows: 142_551, done: 142_551, pct: 100, status: 'ok', rule: 7, issues: 0, updated: 'Feb 02', schema: 'PROD_TRADE' },
];

/* p8 - 송금허브 planning — empty */
const TABLES_P8 = [];

/* p9 - 인터넷뱅킹 cutover in progress — mix of ok / running / queued */
const TABLES_P9 = [
  { name: 'IB_USER',     rows: 4_212_881,     done: 4_212_881,     pct: 100,  status: 'ok',      rule: 8, issues: 0, updated: '22:18:04', schema: 'PROD_IB' },
  { name: 'IB_SESSION',  rows: 88_412_551,    done: 24_118_204,    pct: 27.3, status: 'running', rule: 7, issues: 0, updated: '22:42:31', schema: 'PROD_IB' },
  { name: 'IB_TRANSFER', rows: 412_882_104,   done: 0,             pct: 0,    status: 'queued',  rule: 8, issues: 0, updated: '—',        schema: 'PROD_IB' },
  { name: 'IB_AUDIT',    rows: 1_204_882_551, done: 0,             pct: 0,    status: 'queued',  rule: 7, issues: 0, updated: '—',        schema: 'PROD_IB' },
];

/* p10 - 신용평가 rehearsal in progress — 2 ok / 1 running / 1 queued */
const TABLES_P10 = [
  { name: 'CREDIT_APPLICATION', rows: 2_412_881,  done: 2_412_881,  pct: 100,  status: 'ok',      rule: 14, issues: 0, updated: '10:24:18', schema: 'PROD_CREDIT' },
  { name: 'CREDIT_SCORE',       rows: 18_004_551, done: 18_004_551, pct: 100,  status: 'ok',      rule: 9,  issues: 0, updated: '10:25:42', schema: 'PROD_CREDIT' },
  { name: 'CREDIT_HISTORY',     rows: 88_412_551, done: 31_482_004, pct: 35.6, status: 'running', rule: 11, issues: 0, updated: '10:29:14', schema: 'PROD_CREDIT' },
  { name: 'CREDIT_DECISION',    rows: 1_842_004,  done: 0,          pct: 0,    status: 'queued',  rule: 8,  issues: 0, updated: '—',        schema: 'PROD_CREDIT' },
];

const TABLES_BY_PROJECT = {
  p1: TABLES_P1, p2: TABLES_P2, p3: TABLES_P3, p4: TABLES_P4, p5: TABLES_P5,
  p6: TABLES_P6, p7: TABLES_P7, p8: TABLES_P8, p9: TABLES_P9, p10: TABLES_P10,
};
const getTablesByProject = (projectId) => TABLES_BY_PROJECT[projectId] || [];

/* Active TABLES — re-bound by setActiveDataProject. Legacy global readers
   (app.jsx tab-count, ExportTab/Artifacts) see the active project's data. */
let TABLES = TABLES_P1;

/* Mapping rows (source → target) */
const MAPPING = [
  { src: 'ACCT-NO',           srcType: 'CHAR(16)',      tgt: 'account_no',          tgtType: 'VARCHAR(16)',   rule: 'auto', status: 'ok',   pk: true,  note: '' },
  { src: 'CUST-ID',           srcType: 'CHAR(10)',      tgt: 'customer_id',         tgtType: 'VARCHAR(10)',   rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'BR-CODE',           srcType: 'CHAR(4)',       tgt: 'branch_code',         tgtType: 'CHAR(4)',       rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'ACCT-TYPE',         srcType: 'CHAR(2)',       tgt: 'account_type',        tgtType: 'SMALLINT',      rule: 'rule', status: 'ok',   pk: false, note: 'LOOKUP(acct_type_dict)' },
  { src: 'CURRENCY-CD',       srcType: 'CHAR(3)',       tgt: 'currency_code',       tgtType: 'CHAR(3)',       rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'BAL-AMT',           srcType: 'COMP-3 S9(13)V99', tgt: 'balance_amount',   tgtType: 'NUMERIC(15,2)', rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'AVAIL-AMT',         srcType: 'COMP-3 S9(13)V99', tgt: 'available_amount', tgtType: 'NUMERIC(15,2)', rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'HOLD-AMT',          srcType: 'COMP-3 S9(13)V99', tgt: 'hold_amount',      tgtType: 'NUMERIC(15,2)', rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'OPEN-DT',           srcType: 'CHAR(8) YYYYMMDD', tgt: 'opened_at',        tgtType: 'DATE',          rule: 'rule', status: 'ok',   pk: false, note: 'TO_DATE(?, \'YYYYMMDD\')' },
  { src: 'LAST-TXN-TS',       srcType: 'CHAR(14)',      tgt: 'last_txn_at',         tgtType: 'TIMESTAMP',     rule: 'rule', status: 'warn', pk: false, note: 'NULLIF(\'00000000000000\')' },
  { src: 'STATUS-FLG',        srcType: 'CHAR(1)',       tgt: 'status',              tgtType: 'VARCHAR(12)',   rule: 'rule', status: 'ok',   pk: false, note: "MAP A→'ACTIVE', C→'CLOSED', D→'DORMANT'" },
  { src: 'RISK-SCORE',        srcType: 'COMP S9(4)',    tgt: 'risk_score',          tgtType: 'SMALLINT',      rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'KYC-LEVEL',         srcType: 'CHAR(1)',       tgt: 'kyc_level',           tgtType: 'SMALLINT',      rule: 'rule', status: 'ok',   pk: false, note: 'CAST' },
  { src: 'ACCT-NAME-KANJI',   srcType: 'CHAR(40) EBCDIC-KANA', tgt: 'account_name', tgtType: 'VARCHAR(80)',   rule: 'rule', status: 'warn', pk: false, note: 'ICONV ebcdic-kana → utf-8' },
  { src: 'ACCT-NAME-KANA',    srcType: 'CHAR(40) EBCDIC-KANA', tgt: 'account_name_kana', tgtType: 'VARCHAR(80)', rule: 'rule', status: 'ok', pk: false, note: 'ICONV ebcdic-kana → utf-8' },
  { src: 'PRODUCT-CD',        srcType: 'CHAR(6)',       tgt: 'product_code',        tgtType: 'VARCHAR(6)',    rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'OFFICER-ID',        srcType: 'CHAR(8)',       tgt: 'officer_id',          tgtType: 'VARCHAR(8)',    rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'INTEREST-RT',       srcType: 'COMP-3 S9(3)V9(6)', tgt: 'interest_rate',   tgtType: 'NUMERIC(9,6)',  rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'FILLER-01',         srcType: 'CHAR(20)',      tgt: '—',                   tgtType: '—',             rule: 'skip', status: 'skip', pk: false, note: 'padding, discard' },
  { src: 'RSRV-FLAG',         srcType: 'CHAR(1)',       tgt: '—',                   tgtType: '—',             rule: 'skip', status: 'skip', pk: false, note: 'reserved, legacy' },
  { src: 'UPD-USER',          srcType: 'CHAR(8)',       tgt: 'updated_by',          tgtType: 'VARCHAR(8)',    rule: 'auto', status: 'ok',   pk: false, note: '' },
  { src: 'UPD-TS',            srcType: 'CHAR(14)',      tgt: 'updated_at',          tgtType: 'TIMESTAMP',     rule: 'rule', status: 'err',  pk: false, note: 'invalid in 1,204 rows — recovery required' },
  { src: '—',                 srcType: '—',             tgt: 'tenant_id',           tgtType: 'UUID',          rule: 'added', status: 'ok',  pk: false, note: 'no AS-IS source · default = gen_random_uuid()' },
  { src: '—',                 srcType: '—',             tgt: 'created_at',          tgtType: 'TIMESTAMPTZ',   rule: 'added', status: 'ok',  pk: false, note: 'no AS-IS source · default = now()' },
  { src: '—',                 srcType: '—',             tgt: 'data_classification', tgtType: 'VARCHAR(16)',   rule: 'added', status: 'warn', pk: false, note: 'no AS-IS source · default literal required before run' },
];

/* Execution pipeline stages */
const STAGES = [
  { id: 'extract',  name: 'Extract',            sub: 'read EBCDIC dataset',      pct: 100, tone: 'ok',      rate: '—',        eta: 'done',   color: '#3b82a6' },
  { id: 'encode',   name: 'Character encode',   sub: 'EBCDIC → UTF-8',           pct: 100, tone: 'ok',      rate: '—',        eta: 'done',   color: '#6b7fb0' },
  { id: 'unpack',   name: 'Unpack',             sub: 'COMP-3 → NUMERIC',         pct: 82,  tone: 'running', rate: '412 MB/s', eta: '04:12',  color: '#8b6fb0' },
  { id: 'transform',name: 'Transform',          sub: 'rules · lookups',          pct: 61,  tone: 'running', rate: '298 MB/s', eta: '07:45',  color: '#b06f9f' },
  { id: 'validate', name: 'Validate',           sub: 'PK · FK · constraints',    pct: 34,  tone: 'running', rate: '184 MB/s', eta: '12:03',  color: '#b08a6f' },
  { id: 'load',     name: 'Load',               sub: 'COPY → PostgreSQL',        pct: 12,  tone: 'running', rate: '142 MB/s', eta: '28:40',  color: '#6fa07a' },
  { id: 'verify',   name: 'Verify',             sub: 'row count · checksum',     pct: 0,   tone: 'idle',    rate: '—',        eta: 'queued', color: '#8892a0' },
];

/* Log lines per project */
const LOG_LINES_P1 = [
  ['09:41:08.221','INFO', 'loader.copy',  'LOAD  TXN_JOURNAL_2024  rows=50000  elapsed=312ms'],
  ['09:41:08.118','INFO', 'loader.copy',  'LOAD  TXN_JOURNAL_2023  rows=50000  elapsed=298ms'],
  ['09:41:07.994','OK',   'verify.chk',   'CHECKSUM ok  ACCT_MASTER  sha256=8a2c..e109  rows=18442331'],
  ['09:41:07.831','INFO', 'transform',    'rule.apply  status_flg_map  in=50000  out=50000  skipped=0'],
  ['09:41:07.712','WARN', 'transform',    'last_txn_ts  null-coerced rows=14  table=TXN_JOURNAL_2024'],
  ['09:41:07.441','INFO', 'encode',       'iconv  ebcdic-kana → utf-8  buffer=64MB  throughput=412MB/s'],
  ['09:41:07.312','INFO', 'extract',      'read  /vol/mf/TXN_JOURNAL_2024.dat  offset=0x2A81FF00  chunk=256MB'],
  ['09:41:06.998','ERROR','validate.fk',  'FK violation  GL_ENTRY.acct_no → ACCT_MASTER.account_no  rows=4  first=AC00881104'],
  ['09:41:06.741','INFO', 'loader.stage', 'stage.flush  ADDR_HIST  pending=0  committed=6102334'],
  ['09:41:06.512','OK',   'verify.chk',   'CHECKSUM ok  CUST_CONTACT  sha256=91ff..2b40  rows=4882091'],
  ['09:41:06.331','INFO', 'transform',    'rule.apply  to_date(yyyymmdd)  in=50000  out=49997  skipped=3'],
  ['09:41:06.114','WARN', 'unpack',       'COMP-3  sign nibble unexpected 0xF  col=BAL_AMT  row=2118441  coerced→positive'],
  ['09:41:05.881','INFO', 'loader.copy',  'LOAD  LOAN_REPAYMENT  rows=50000  elapsed=341ms'],
  ['09:41:05.710','INFO', 'extract',      'read  /vol/mf/TXN_JOURNAL_2023.dat  offset=0x1F04A100  chunk=256MB'],
  ['09:41:05.441','ERROR','encode',       'invalid EBCDIC byte 0x3F at offset 0x1A08B2C  table=KYC_DOCUMENT  aborting'],
  ['09:41:05.221','INFO', 'scheduler',    'worker pool: 12 active / 16 total · queue depth=3'],
  ['09:41:04.998','OK',   'verify.chk',   'CHECKSUM ok  FX_POSITION  sha256=2d18..07aa  rows=120554'],
  ['09:41:04.774','INFO', 'transform',    'rule.apply  currency_cd_norm  in=50000  out=50000'],
  ['09:41:04.551','INFO', 'loader.stage', 'stage.flush  LOAN_REPAYMENT  pending=0  committed=2118332'],
  ['09:41:04.331','WARN', 'transform',    'account_name  kanji codepoint outside JIS X 0208  fallback U+FFFD  rows=2'],
  ['09:41:04.118','INFO', 'extract',      'mount OK  /vol/mf  dataset=KSDS  rlen=512  blksz=27648'],
  ['09:41:03.881','INFO', 'loader.copy',  'LOAD  TXN_JOURNAL_2024  rows=50000  elapsed=307ms'],
  ['09:41:03.714','OK',   'verify.chk',   'CHECKSUM ok  GL_BALANCE  sha256=5b71..c902  rows=2881009'],
  ['09:41:03.551','INFO', 'transform',    'rule.apply  status_flg_map  in=50000  out=50000'],
  ['09:41:03.331','INFO', 'encode',       'iconv  ebcdic-kana → utf-8  buffer=64MB  throughput=398MB/s'],
  ['09:41:03.118','INFO', 'scheduler',    'backpressure: loader lag 212ms (threshold 500ms) → OK'],
  ['09:41:02.881','OK',   'verify.chk',   'CHECKSUM ok  ACCT_MASTER  sha256=8a2c..e109  rows=18442331'],
  ['09:41:02.714','INFO', 'loader.copy',  'LOAD  ADDR_HIST  rows=50000  elapsed=288ms'],
  ['09:41:02.551','ERROR','loader.copy',  'duplicate key (account_no)=(AC10023441)  table=ACCT_MASTER  row skipped'],
  ['09:41:02.331','INFO', 'unpack',       'COMP-3 decoder  throughput=524MB/s  rows=1.2M/s'],
  ['09:41:02.118','INFO', 'transform',    'rule.apply  to_date(yyyymmdd)  in=50000  out=49999  skipped=1'],
  ['09:41:01.881','WARN', 'validate.pk',  'PK duplicate soft-dedupe  table=CUST_CONTACT  rows=3'],
  ['09:41:01.714','INFO', 'loader.stage', 'stage.flush  TXN_JOURNAL_2023  pending=0  committed=201554440'],
  ['09:41:01.551','INFO', 'extract',      'read  /vol/mf/ADDR_HIST.dat  offset=0x0C112A00  chunk=128MB'],
  ['09:41:01.331','OK',   'verify.chk',   'CHECKSUM ok  FX_RATE_DAILY  sha256=fa02..9911  rows=44211'],
  ['09:41:01.118','INFO', 'scheduler',    'worker pool: 12 active / 16 total · queue depth=2'],
];

/* p2 - 수신원장 sign-off — last rehearsal log, all OK */
const LOG_LINES_P2 = [
  ['02:48:11.221','OK',   'verify.chk',   'CHECKSUM ok  DEPOSIT_TRANSACTION  rows=142881004'],
  ['02:48:10.118','INFO', 'loader.copy',  'LOAD  INTEREST_PAYMENT  rows=50000  elapsed=204ms'],
  ['02:48:09.994','OK',   'verify.chk',   'CHECKSUM ok  DEPOSIT_ACCOUNT  rows=8412330'],
  ['02:48:08.512','INFO', 'transform',    'rule.apply  branch_code_pad  in=50000  out=50000'],
  ['02:48:07.331','INFO', 'loader.copy',  'LOAD  DEPOSIT_TRANSACTION  rows=50000  elapsed=288ms'],
  ['02:48:06.118','INFO', 'extract',      'fetch  DEPOSIT.DEPOSIT_TXN  offset=140000000  chunk=50000'],
  ['02:48:04.994','INFO', 'transform',    'rule.apply  status_norm  in=50000  out=50000'],
  ['02:48:03.881','OK',   'verify.chk',   'CHECKSUM ok  INTEREST_PAYMENT  rows=18004551'],
  ['02:48:02.714','INFO', 'scheduler',    'worker pool: 8 active / 12 total · queue depth=0'],
  ['02:48:01.118','INFO', 'scheduler',    'rehearsal complete · awaiting cutover sign-off'],
];

/* p3 - 외환 analysis — no run yet */
const LOG_LINES_P3 = [];

/* p4 - 여신 analysis — no run yet */
const LOG_LINES_P4 = [];

/* p5 - 카드승인 hypercare — final cutover log */
const LOG_LINES_P5 = [
  ['02:11:44.221','OK',   'verify.chk',   'CHECKSUM ok  CARD_AUTH_LOG  rows=812004552'],
  ['02:11:42.118','OK',   'verify.chk',   'CHECKSUM ok  CARD_MASTER  rows=3002114'],
  ['02:11:40.994','OK',   'verify.chk',   'CHECKSUM ok  MERCHANT  rows=124882'],
  ['02:11:38.118','INFO', 'loader.copy',  'LOAD  CARD_AUTH_LOG  rows=50000  elapsed=412ms'],
  ['02:11:36.512','INFO', 'transform',    'rule.apply  ebcdic_kana_iconv  in=50000  out=50000'],
  ['02:11:34.331','INFO', 'unpack',       'COMP-3 decoder  throughput=488MB/s  rows=1.1M/s'],
  ['02:11:32.118','INFO', 'extract',      'read  /vol/mf/AUTH_LOG.dat  offset=0x4F12A000  chunk=256MB'],
  ['02:11:30.994','INFO', 'scheduler',    'cutover phase: load · 22/28 tables complete'],
];

/* p6 - 총계정원장 done */
const LOG_LINES_P6 = [
  ['18:42:11.221','OK',   'verify.chk',   'CHECKSUM ok  GL_JOURNAL  rows=98221412'],
  ['18:42:10.118','OK',   'verify.chk',   'CHECKSUM ok  GL_BALANCE  rows=2881009'],
  ['18:42:09.994','OK',   'verify.chk',   'CHECKSUM ok  GL_ACCOUNT  rows=18442'],
  ['18:42:08.512','INFO', 'loader.copy',  'LOAD  GL_JOURNAL  rows=50000  elapsed=288ms'],
  ['18:42:07.331','INFO', 'transform',    'rule.apply  acct_cd_norm  in=50000  out=50000'],
  ['18:42:06.118','INFO', 'scheduler',    'cutover complete · 113 tables · all OK'],
];

/* p7 - 무역금융 done */
const LOG_LINES_P7 = [
  ['16:32:11.221','OK',   'verify.chk',   'CHECKSUM ok  EXPORT_BILL  rows=142551'],
  ['16:32:10.118','OK',   'verify.chk',   'CHECKSUM ok  LC_MASTER  rows=88412'],
  ['16:32:09.994','INFO', 'loader.copy',  'LOAD  EXPORT_BILL  rows=50000  elapsed=204ms'],
  ['16:32:08.512','INFO', 'encode',       'iconv  ebcdic-kana → utf-8  buffer=64MB  throughput=412MB/s'],
  ['16:32:07.331','INFO', 'transform',    'rule.apply  ccy_cd_norm  in=50000  out=50000'],
  ['16:32:06.118','INFO', 'scheduler',    'cutover complete · 19 tables · all OK'],
];

/* p8 - 송금허브 planning — no logs yet */
const LOG_LINES_P8 = [];

/* p9 - 인터넷뱅킹 cutover in progress — live tail */
const LOG_LINES_P9 = [
  ['22:42:31.221','INFO', 'loader.copy',  'LOAD  IB_SESSION  rows=50000  elapsed=298ms'],
  ['22:42:30.998','INFO', 'transform',    'rule.apply  ipaddr_to_inet  in=50000  out=50000'],
  ['22:42:29.881','INFO', 'extract',      'fetch  IB.IB_SESSION  offset=24000000  chunk=50000'],
  ['22:42:28.512','INFO', 'loader.stage', 'stage.flush  IB_SESSION  pending=0  committed=24118204'],
  ['22:42:27.331','OK',   'verify.chk',   'CHECKSUM ok  IB_USER  rows=4212881'],
  ['22:42:26.118','INFO', 'transform',    'rule.apply  ts_to_tstz_seoul  in=50000  out=50000'],
  ['22:42:24.994','INFO', 'loader.copy',  'LOAD  IB_USER  rows=50000  elapsed=204ms'],
  ['22:42:22.881','INFO', 'scheduler',    'cutover phase: migrate · 1/4 tables complete · queue=2'],
  ['22:42:21.118','INFO', 'extract',      'fetch  IB.IB_USER  offset=4200000  chunk=12881'],
  ['22:18:04.221','INFO', 'scheduler',    'cutover started · 4 tables · estimated 4h 12m'],
];

/* p10 - 신용평가 rehearsal in progress — live tail */
const LOG_LINES_P10 = [
  ['10:29:14.881','INFO', 'loader.copy',  'LOAD  CREDIT_HISTORY  rows=50000  elapsed=312ms'],
  ['10:29:13.512','INFO', 'transform',    'rule.apply  score_band_normalize  in=50000  out=50000'],
  ['10:29:12.118','INFO', 'extract',      'fetch  CREDIT.CREDIT_HISTORY  offset=31400000  chunk=50000'],
  ['10:28:58.331','INFO', 'loader.stage', 'stage.flush  CREDIT_HISTORY  pending=0  committed=31482004'],
  ['10:25:42.114','OK',   'verify.chk',   'CHECKSUM ok  CREDIT_SCORE  rows=18004551'],
  ['10:25:18.998','INFO', 'transform',    'rule.apply  score_decimal_round  in=50000  out=50000'],
  ['10:24:18.881','OK',   'verify.chk',   'CHECKSUM ok  CREDIT_APPLICATION  rows=2412881'],
  ['10:23:44.118','INFO', 'transform',    'rule.apply  applicant_id_norm  in=50000  out=50000'],
  ['10:21:02.331','INFO', 'extract',      'fetch  CREDIT.CREDIT_APPLICATION  offset=2400000  chunk=12881'],
  ['10:15:00.118','INFO', 'scheduler',    'rehearsal started · 4 tables · estimated 18m · run-2026-0508-1015'],
];

const LOG_LINES_BY_PROJECT = {
  p1: LOG_LINES_P1, p2: LOG_LINES_P2, p3: LOG_LINES_P3, p4: LOG_LINES_P4,
  p5: LOG_LINES_P5, p6: LOG_LINES_P6, p7: LOG_LINES_P7, p8: LOG_LINES_P8,
  p9: LOG_LINES_P9, p10: LOG_LINES_P10,
};
const getLogLines = (projectId) => LOG_LINES_BY_PROJECT[projectId] || [];

/* Active LOG_LINES — re-bound by setActiveDataProject. */
let LOG_LINES = LOG_LINES_P1;

/* ─── Artifacts: schema diff between ASIS (source) and TOBE (target) ──────
   Each table lists ASIS columns + TOBE columns; diff is computed on the fly.
   TOBE columns may carry .default (initial value for newly added columns) and
   .renameFrom (detected rename candidate, possibly .renameConfidence < 1). */

/* p1 - 계정원장 (Core Ledger). ACCT_MASTER, CUST_PROFILE join, TXN journals,
   plus a few unrouted TO-BE stubs (LOAN/CARD/FX_POSITION) demonstrating
   "DDL imported, source not bound yet". 80% mapping coverage. */
const SCHEMA_DIFF_P1 = [
  {
    table: 'ACCT_MASTER',
    asis:  'CORE.ACCT_MASTER',
    tobe:  'public.account',
    sources: [],
    asisCols: [
      { name: 'ACCT_NO',      type: 'CHAR(16)',            nullable: false, pk: true  },
      { name: 'CUST_ID',      type: 'CHAR(10)',            nullable: false },
      { name: 'BR_CODE',      type: 'CHAR(4)',             nullable: false },
      { name: 'ACCT_TYPE',    type: 'CHAR(2)',             nullable: false },
      { name: 'CURRENCY_CD',  type: 'CHAR(3)',             nullable: false },
      { name: 'BAL_AMT',      type: 'COMP-3 S9(13)V99',    nullable: false },
      { name: 'OPEN_DT',      type: 'CHAR(8) YYYYMMDD',    nullable: false },
      { name: 'STATUS_FLG',   type: 'CHAR(1)',             nullable: false },
      { name: 'ACCT_NAME_KANJI', type: 'CHAR(40) EBCDIC-KANA', nullable: true },
      { name: 'FILLER_01',    type: 'CHAR(20)',            nullable: true },
      { name: 'RSRV_FLAG',    type: 'CHAR(1)',             nullable: true },
      { name: 'UPD_USER',     type: 'CHAR(8)',             nullable: true },
      { name: 'UPD_TS',       type: 'CHAR(14)',            nullable: true },
    ],
    tobeCols: [
      { name: 'account_no',       type: 'VARCHAR(16)',     nullable: false, pk: true, renameFrom: 'ACCT_NO',     renameConfidence: 1.00 },
      { name: 'customer_id',      type: 'VARCHAR(10)',     nullable: false,           renameFrom: 'CUST_ID',     renameConfidence: 1.00 },
      { name: 'branch_code',      type: 'CHAR(4)',         nullable: false,           renameFrom: 'BR_CODE',     renameConfidence: 0.95 },
      { name: 'account_type',     type: 'SMALLINT',        nullable: false,           renameFrom: 'ACCT_TYPE',   renameConfidence: 1.00 },
      { name: 'currency_code',    type: 'CHAR(3)',         nullable: false,           renameFrom: 'CURRENCY_CD', renameConfidence: 1.00 },
      { name: 'balance_amount',   type: 'NUMERIC(15,2)',   nullable: false,           renameFrom: 'BAL_AMT',     renameConfidence: 0.92 },
      { name: 'opened_at',        type: 'DATE',            nullable: false,           renameFrom: 'OPEN_DT',     renameConfidence: 0.88 },
      { name: 'status',           type: 'VARCHAR(12)',     nullable: false,           renameFrom: 'STATUS_FLG',  renameConfidence: 0.70 },
      { name: 'account_name',     type: 'VARCHAR(80)',     nullable: true,            renameFrom: 'ACCT_NAME_KANJI', renameConfidence: 0.85 },
      { name: 'account_name_kana',type: 'VARCHAR(80)',     nullable: true,            added: true, default: "''" },
      { name: 'risk_score',       type: 'SMALLINT',        nullable: true,            added: true, default: '0' },
      { name: 'kyc_level',        type: 'SMALLINT',        nullable: false,           added: true, default: '0' },
      { name: 'aml_flag',         type: 'BOOLEAN',         nullable: false,           added: true, default: 'false' },
      { name: 'segment_code',     type: 'VARCHAR(8)',      nullable: true,            added: true, default: 'NULL' },
      { name: 'tenant_id',        type: 'UUID',            nullable: false,           added: true, default: "'00000000-0000-0000-0000-000000000001'" },
      { name: 'updated_by',       type: 'VARCHAR(8)',      nullable: true,            renameFrom: 'UPD_USER',    renameConfidence: 0.90 },
      { name: 'updated_at',       type: 'TIMESTAMP',       nullable: true,            renameFrom: 'UPD_TS',      renameConfidence: 0.82 },
      { name: 'created_at',       type: 'TIMESTAMP',       nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    /* N:1 JOIN demo — two AS-IS tables merge into one TO-BE table */
    table: 'CUST_PROFILE',
    asis:  'CORE.CUST_PROFILE ⋈ CORE.CUST_CONTACT',
    tobe:  'public.customer',
    sources: [],
    asisCols: [
      { name: 'CUST_ID',      type: 'CHAR(10)',             nullable: false, pk: true, source: 'cp' },
      { name: 'NAME_KANJI',   type: 'CHAR(60) EBCDIC-KANA', nullable: false,           source: 'cp' },
      { name: 'NAME_KANA',    type: 'CHAR(60) EBCDIC-KANA', nullable: false,           source: 'cp' },
      { name: 'BIRTH_DT',     type: 'CHAR(8) YYYYMMDD',     nullable: true,            source: 'cp' },
      { name: 'GENDER_CD',    type: 'CHAR(1)',              nullable: true,            source: 'cp' },
      { name: 'NATIONALITY',  type: 'CHAR(3)',              nullable: true,            source: 'cp' },
      { name: 'OPEN_BR',      type: 'CHAR(4)',              nullable: false,           source: 'cp' },
      { name: 'LEGACY_GRADE', type: 'CHAR(1)',              nullable: true,            source: 'cp' },
      /* columns from CUST_CONTACT (joined) */
      { name: 'TEL_NO',       type: 'CHAR(15)',             nullable: true,            source: 'cc' },
      { name: 'EMAIL_ADDR',   type: 'CHAR(80)',             nullable: true,            source: 'cc' },
      { name: 'PREF_CHANNEL', type: 'CHAR(2)',              nullable: true,            source: 'cc' },
      { name: 'OPT_IN_FLG',   type: 'CHAR(1)',              nullable: true,            source: 'cc' },
    ],
    tobeCols: [
      { name: 'customer_id',  type: 'VARCHAR(10)', nullable: false, pk: true, renameFrom: 'CUST_ID',     renameConfidence: 1.00 },
      { name: 'name_kanji',   type: 'VARCHAR(120)',nullable: false,           renameFrom: 'NAME_KANJI',  renameConfidence: 0.90 },
      { name: 'name_kana',    type: 'VARCHAR(120)',nullable: false,           renameFrom: 'NAME_KANA',   renameConfidence: 0.90 },
      { name: 'birth_date',   type: 'DATE',        nullable: true,            renameFrom: 'BIRTH_DT',    renameConfidence: 0.82 },
      { name: 'gender',       type: 'VARCHAR(16)', nullable: true,            renameFrom: 'GENDER_CD',   renameConfidence: 0.72 },
      { name: 'nationality',  type: 'CHAR(3)',     nullable: true,            renameFrom: 'NATIONALITY', renameConfidence: 1.00 },
      { name: 'open_branch',  type: 'CHAR(4)',     nullable: false,           renameFrom: 'OPEN_BR',     renameConfidence: 0.95 },
      { name: 'phone_e164',   type: 'VARCHAR(20)', nullable: true,            renameFrom: 'TEL_NO',      renameConfidence: 0.55 },
      { name: 'email',        type: 'VARCHAR(255)',nullable: true,            renameFrom: 'EMAIL_ADDR',  renameConfidence: 0.95 },
      { name: 'preferred_channel', type: 'VARCHAR(16)', nullable: true,       renameFrom: 'PREF_CHANNEL',renameConfidence: 0.80 },
      { name: 'marketing_opt_in',  type: 'BOOLEAN',     nullable: false,      renameFrom: 'OPT_IN_FLG',  renameConfidence: 0.70 },
      { name: 'risk_tier',    type: 'SMALLINT',    nullable: false,           added: true, default: '3' },
      { name: 'created_at',   type: 'TIMESTAMP',   nullable: false,           added: true, default: 'NOW()' },
      { name: 'updated_at',   type: 'TIMESTAMP',   nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'TXN_JOURNAL_2024',
    asis:  'CORE.TXN_JOURNAL_2024',
    tobe:  'public.transaction_2024',
    sources: [],
    asisCols: [
      { name: 'TXN_ID',       type: 'CHAR(24)',         nullable: false, pk: true },
      { name: 'ACCT_NO',      type: 'CHAR(16)',         nullable: false },
      { name: 'TXN_DT',       type: 'CHAR(8) YYYYMMDD', nullable: false },
      { name: 'TXN_TM',       type: 'CHAR(6) HHMMSS',   nullable: false },
      { name: 'AMT',          type: 'COMP-3 S9(13)V99', nullable: false },
      { name: 'DR_CR',        type: 'CHAR(1)',          nullable: false },
      { name: 'BR_CODE',      type: 'CHAR(4)',          nullable: false },
      { name: 'CHANNEL_CD',   type: 'CHAR(2)',          nullable: false },
      { name: 'MEMO',         type: 'CHAR(40) EBCDIC-KANA', nullable: true },
    ],
    tobeCols: [
      { name: 'transaction_id',  type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'TXN_ID', renameConfidence: 1.00 },
      { name: 'account_no',      type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'ACCT_NO', renameConfidence: 1.00 },
      { name: 'occurred_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()', mergedFrom: ['TXN_DT','TXN_TM'] },
      { name: 'amount',          type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT', renameConfidence: 1.00 },
      { name: 'direction',       type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'DR_CR', renameConfidence: 0.65 },
      { name: 'branch_code',     type: 'CHAR(4)',       nullable: false,           renameFrom: 'BR_CODE', renameConfidence: 0.95 },
      { name: 'channel',         type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'CHANNEL_CD', renameConfidence: 0.80 },
      { name: 'memo',            type: 'VARCHAR(80)',   nullable: true,            renameFrom: 'MEMO', renameConfidence: 1.00 },
      { name: 'reference_id',    type: 'VARCHAR(40)',   nullable: true,            added: true, default: 'NULL' },
      { name: 'currency_code',   type: 'CHAR(3)',       nullable: false,           added: true, default: "'JPY'" },
      { name: 'reversal_of',     type: 'VARCHAR(24)',   nullable: true,            added: true, default: 'NULL' },
      { name: 'created_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    /* N:1 UNION demo — yearly partitions stacked into a single TO-BE table */
    table: 'TRANSACTION_UNIFIED',
    asis:  'CORE.TXN_JOURNAL_2023 ∪ CORE.TXN_JOURNAL_2024',
    tobe:  'public.transaction_all',
    sources: [],
    asisCols: [
      { name: 'TXN_ID',     type: 'CHAR(24)',            nullable: false, pk: true, source: 't23+t24' },
      { name: 'ACCT_NO',    type: 'CHAR(16)',            nullable: false,           source: 't23+t24' },
      { name: 'TXN_DT',     type: 'CHAR(8) YYYYMMDD',    nullable: false,           source: 't23+t24' },
      { name: 'TXN_TM',     type: 'CHAR(6) HHMMSS',      nullable: false,           source: 't23+t24' },
      { name: 'AMT',        type: 'COMP-3 S9(13)V99',    nullable: false,           source: 't23+t24' },
      { name: 'DR_CR',      type: 'CHAR(1)',             nullable: false,           source: 't23+t24' },
      { name: 'CHANNEL_CD', type: 'CHAR(2)',             nullable: false,           source: 't23+t24' },
      { name: 'BR_CODE',    type: 'CHAR(4)',             nullable: false,           source: 't23+t24' },
    ],
    tobeCols: [
      { name: 'transaction_id', type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'TXN_ID',     renameConfidence: 1.00 },
      { name: 'account_no',     type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'ACCT_NO',    renameConfidence: 1.00 },
      { name: 'occurred_at',    type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NULL', mergedFrom: ['TXN_DT', 'TXN_TM'] },
      { name: 'amount',         type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',        renameConfidence: 1.00 },
      { name: 'direction',      type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'DR_CR',      renameConfidence: 0.65 },
      { name: 'channel',        type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'CHANNEL_CD', renameConfidence: 0.80 },
      { name: 'branch_code',    type: 'CHAR(4)',       nullable: false,           renameFrom: 'BR_CODE',    renameConfidence: 0.95 },
      { name: 'source_year',    type: 'SMALLINT',      nullable: false,           added: true, default: 'extract(year from occurred_at)' },
      { name: 'created_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  /* ─── Unrouted TO-BE stubs ───────────────────────────────────────
     TO-BE target schemas that are known (from TO-BE DDL import) but have no
     AS-IS source assigned yet. Appear in the inventory as 'no source', and
     are bindable via Route to TO-BE… / Add source pickers — selecting an
     AS-IS populates sources[] and activates the normal mapping flow. */
  {
    table: 'LOAN',
    asis: null,
    tobe: 'public.loan',
    sources: [],
    asisCols: [],
    tobeCols: [
      { name: 'loan_id',          type: 'VARCHAR(20)',   nullable: false, pk: true, added: true, default: 'NULL' },
      { name: 'customer_id',      type: 'VARCHAR(10)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'product_code',     type: 'VARCHAR(8)',    nullable: false,           added: true, default: 'NULL' },
      { name: 'amount',           type: 'NUMERIC(15,2)', nullable: false,           added: true, default: '0' },
      { name: 'interest_rate',    type: 'NUMERIC(9,6)',  nullable: false,           added: true, default: '0' },
      { name: 'term_months',      type: 'SMALLINT',      nullable: false,           added: true, default: '0' },
      { name: 'disbursed_at',     type: 'TIMESTAMP',     nullable: true,            added: true, default: 'NULL' },
      { name: 'maturity_date',    type: 'DATE',          nullable: true,            added: true, default: 'NULL' },
      { name: 'status',           type: 'VARCHAR(16)',   nullable: false,           added: true, default: "'ACTIVE'" },
      { name: 'branch_code',      type: 'CHAR(4)',       nullable: false,           added: true, default: 'NULL' },
      { name: 'officer_id',       type: 'VARCHAR(8)',    nullable: true,            added: true, default: 'NULL' },
      { name: 'collateral_id',    type: 'VARCHAR(20)',   nullable: true,            added: true, default: 'NULL' },
      { name: 'outstanding',      type: 'NUMERIC(15,2)', nullable: false,           added: true, default: '0' },
      { name: 'last_payment_at',  type: 'TIMESTAMP',     nullable: true,            added: true, default: 'NULL' },
      { name: 'created_at',       type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'CARD',
    asis: null,
    tobe: 'public.card',
    sources: [],
    asisCols: [],
    tobeCols: [
      { name: 'card_id',       type: 'VARCHAR(20)',   nullable: false, pk: true, added: true, default: 'NULL' },
      { name: 'account_no',    type: 'VARCHAR(16)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'card_number',   type: 'VARCHAR(19)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'card_type',     type: 'VARCHAR(12)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'holder_name',   type: 'VARCHAR(80)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'issued_at',     type: 'DATE',          nullable: false,           added: true, default: 'NULL' },
      { name: 'expires_at',    type: 'DATE',          nullable: false,           added: true, default: 'NULL' },
      { name: 'status',        type: 'VARCHAR(12)',   nullable: false,           added: true, default: "'ACTIVE'" },
      { name: 'credit_limit',  type: 'NUMERIC(12,2)', nullable: true,            added: true, default: '0' },
      { name: 'last_used_at',  type: 'TIMESTAMP',     nullable: true,            added: true, default: 'NULL' },
      { name: 'created_at',    type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'FX_POSITION',
    asis: null,
    tobe: 'public.fx_position',
    sources: [],
    asisCols: [],
    tobeCols: [
      { name: 'position_id',    type: 'VARCHAR(20)',   nullable: false, pk: true, added: true, default: 'NULL' },
      { name: 'currency_pair',  type: 'CHAR(6)',       nullable: false,           added: true, default: 'NULL' },
      { name: 'position_date',  type: 'DATE',          nullable: false,           added: true, default: 'NULL' },
      { name: 'amount',         type: 'NUMERIC(18,4)', nullable: false,           added: true, default: '0' },
      { name: 'rate',           type: 'NUMERIC(12,6)', nullable: false,           added: true, default: '0' },
      { name: 'trader_id',      type: 'VARCHAR(8)',    nullable: true,            added: true, default: 'NULL' },
      { name: 'booked_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p2 - 수신원장 (Deposit Accounts). sign-off, 100% mapped. */
const SCHEMA_DIFF_P2 = [
  {
    table: 'DEPOSIT_ACCOUNT',
    asis:  'DEPOSIT.DEPOSIT_ACCOUNT',
    tobe:  'public.deposit_account',
    _autoMapped: true,
    sources: [{ alias: 'da', table: 'DEPOSIT.DEPOSIT_ACCOUNT', role: 'primary' }],
    asisCols: [
      { name: 'ACCT_NO',     type: 'VARCHAR(20)',  nullable: false, pk: true },
      { name: 'CUST_NO',     type: 'VARCHAR(10)',  nullable: false },
      { name: 'PROD_CD',     type: 'VARCHAR(8)',   nullable: false },
      { name: 'BR_CD',       type: 'VARCHAR(4)',   nullable: false },
      { name: 'CCY_CD',      type: 'CHAR(3)',      nullable: false },
      { name: 'BAL',         type: 'NUMBER(15,2)', nullable: false },
      { name: 'OPEN_DT',     type: 'DATE',         nullable: false },
      { name: 'MATURE_DT',   type: 'DATE',         nullable: true  },
      { name: 'INT_RATE',    type: 'NUMBER(9,6)',  nullable: false },
      { name: 'STATUS',      type: 'VARCHAR(2)',   nullable: false },
    ],
    tobeCols: [
      { name: 'account_no',     type: 'VARCHAR(20)',   nullable: false, pk: true, renameFrom: 'ACCT_NO',  renameConfidence: 1.00 },
      { name: 'customer_id',    type: 'VARCHAR(10)',   nullable: false,           renameFrom: 'CUST_NO',  renameConfidence: 1.00 },
      { name: 'product_code',   type: 'VARCHAR(8)',    nullable: false,           renameFrom: 'PROD_CD',  renameConfidence: 1.00 },
      { name: 'branch_code',    type: 'CHAR(6)',       nullable: false,           renameFrom: 'BR_CD',    renameConfidence: 0.90 },
      { name: 'currency_code',  type: 'CHAR(3)',       nullable: false,           renameFrom: 'CCY_CD',   renameConfidence: 1.00 },
      { name: 'balance_amount', type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'BAL',      renameConfidence: 0.95 },
      { name: 'opened_at',      type: 'DATE',          nullable: false,           renameFrom: 'OPEN_DT',  renameConfidence: 1.00 },
      { name: 'maturity_date',  type: 'DATE',          nullable: true,            renameFrom: 'MATURE_DT',renameConfidence: 1.00 },
      { name: 'interest_rate',  type: 'NUMERIC(9,6)',  nullable: false,           renameFrom: 'INT_RATE', renameConfidence: 1.00 },
      { name: 'status',         type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS',   renameConfidence: 0.85 },
      { name: 'created_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'DEPOSIT_TRANSACTION',
    asis:  'DEPOSIT.DEPOSIT_TXN',
    tobe:  'public.deposit_transaction',
    _autoMapped: true,
    sources: [{ alias: 'dt', table: 'DEPOSIT.DEPOSIT_TXN', role: 'primary' }],
    asisCols: [
      { name: 'TXN_ID',     type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'ACCT_NO',    type: 'VARCHAR(20)',  nullable: false },
      { name: 'TXN_DT',     type: 'DATE',         nullable: false },
      { name: 'AMT',        type: 'NUMBER(15,2)', nullable: false },
      { name: 'DR_CR',      type: 'CHAR(1)',      nullable: false },
      { name: 'CHANNEL',    type: 'VARCHAR(2)',   nullable: false },
    ],
    tobeCols: [
      { name: 'transaction_id', type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'TXN_ID',  renameConfidence: 1.00 },
      { name: 'account_no',     type: 'VARCHAR(20)',   nullable: false,           renameFrom: 'ACCT_NO', renameConfidence: 1.00 },
      { name: 'transaction_date', type: 'DATE',        nullable: false,           renameFrom: 'TXN_DT',  renameConfidence: 1.00 },
      { name: 'amount',         type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',     renameConfidence: 1.00 },
      { name: 'direction',      type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'DR_CR',   renameConfidence: 0.70 },
      { name: 'channel',        type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'CHANNEL', renameConfidence: 0.85 },
      { name: 'created_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'INTEREST_PAYMENT',
    asis:  'DEPOSIT.INTEREST_PAY',
    tobe:  'public.interest_payment',
    _autoMapped: true,
    sources: [{ alias: 'ip', table: 'DEPOSIT.INTEREST_PAY', role: 'primary' }],
    asisCols: [
      { name: 'PAY_ID',      type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'ACCT_NO',     type: 'VARCHAR(20)',  nullable: false },
      { name: 'PAY_DT',      type: 'DATE',         nullable: false },
      { name: 'AMT',         type: 'NUMBER(13,2)', nullable: false },
      { name: 'TAX_AMT',     type: 'NUMBER(13,2)', nullable: false },
    ],
    tobeCols: [
      { name: 'payment_id',  type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'PAY_ID', renameConfidence: 1.00 },
      { name: 'account_no',  type: 'VARCHAR(20)',   nullable: false,           renameFrom: 'ACCT_NO',renameConfidence: 1.00 },
      { name: 'paid_at',     type: 'DATE',          nullable: false,           renameFrom: 'PAY_DT', renameConfidence: 0.92 },
      { name: 'amount',      type: 'NUMERIC(13,2)', nullable: false,           renameFrom: 'AMT',    renameConfidence: 1.00 },
      { name: 'tax_amount',  type: 'NUMERIC(13,2)', nullable: false,           renameFrom: 'TAX_AMT',renameConfidence: 1.00 },
      { name: 'created_at',  type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p3 - 외환 (FX Treasury). analysis phase, AS-IS only DDL imported,
   no TO-BE side yet. Therefore all entries have asisCols populated and
   tobeCols intentionally empty. sources stays empty (no bindings yet). */
const SCHEMA_DIFF_P3 = [
  {
    table: 'FX_RATE_DAILY',
    asis:  'FX.FX_RATE_DAILY',
    tobe:  null,
    sources: [],
    asisCols: [
      { name: 'RATE_DT',    type: 'CHAR(8) YYYYMMDD',  nullable: false, pk: true },
      { name: 'CCY_PAIR',   type: 'CHAR(6)',           nullable: false, pk: true },
      { name: 'BID_RT',     type: 'COMP-3 S9(7)V9(6)', nullable: false },
      { name: 'ASK_RT',     type: 'COMP-3 S9(7)V9(6)', nullable: false },
      { name: 'MID_RT',     type: 'COMP-3 S9(7)V9(6)', nullable: false },
      { name: 'SOURCE_CD',  type: 'CHAR(4)',           nullable: false },
    ],
    tobeCols: [],
  },
  {
    table: 'FX_DEAL',
    asis:  'FX.FX_DEAL',
    tobe:  null,
    sources: [],
    asisCols: [
      { name: 'DEAL_NO',     type: 'CHAR(16)',          nullable: false, pk: true },
      { name: 'DEAL_DT',     type: 'CHAR(8) YYYYMMDD',  nullable: false },
      { name: 'CCY_PAIR',    type: 'CHAR(6)',           nullable: false },
      { name: 'BUY_AMT',     type: 'COMP-3 S9(13)V99',  nullable: false },
      { name: 'SELL_AMT',    type: 'COMP-3 S9(13)V99',  nullable: false },
      { name: 'TRADER_ID',   type: 'CHAR(8)',           nullable: false },
      { name: 'CPTY_CD',     type: 'CHAR(10)',          nullable: false },
      { name: 'STATUS_FLG',  type: 'CHAR(1)',           nullable: false },
    ],
    tobeCols: [],
  },
];

/* p4 - 여신 (Loan Origination). analysis phase, TO-BE only DDL imported,
   AS-IS not yet imported. sources empty, asisCols empty, tobeCols populated.
   Demonstrates "TO-BE shape ready, awaiting source binding". */
const SCHEMA_DIFF_P4 = [
  {
    table: 'LOAN_APPLICATION',
    asis:  null,
    tobe:  'public.loan_application',
    sources: [],
    asisCols: [],
    tobeCols: [
      { name: 'application_id',  type: 'VARCHAR(24)',   nullable: false, pk: true, added: true, default: 'NULL' },
      { name: 'customer_id',     type: 'VARCHAR(10)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'product_code',    type: 'VARCHAR(8)',    nullable: false,           added: true, default: 'NULL' },
      { name: 'requested_amount',type: 'NUMERIC(15,2)', nullable: false,           added: true, default: '0' },
      { name: 'term_months',     type: 'SMALLINT',      nullable: false,           added: true, default: '0' },
      { name: 'submitted_at',    type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
      { name: 'status',          type: 'VARCHAR(16)',   nullable: false,           added: true, default: "'PENDING'" },
      { name: 'officer_id',      type: 'VARCHAR(8)',    nullable: true,            added: true, default: 'NULL' },
      { name: 'created_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'LOAN_MASTER',
    asis:  null,
    tobe:  'public.loan_master',
    sources: [],
    asisCols: [],
    tobeCols: [
      { name: 'loan_id',         type: 'VARCHAR(20)',   nullable: false, pk: true, added: true, default: 'NULL' },
      { name: 'application_id',  type: 'VARCHAR(24)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'customer_id',     type: 'VARCHAR(10)',   nullable: false,           added: true, default: 'NULL' },
      { name: 'principal',       type: 'NUMERIC(15,2)', nullable: false,           added: true, default: '0' },
      { name: 'interest_rate',   type: 'NUMERIC(9,6)',  nullable: false,           added: true, default: '0' },
      { name: 'disbursed_at',    type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
      { name: 'maturity_date',   type: 'DATE',          nullable: false,           added: true, default: 'NULL' },
      { name: 'outstanding',     type: 'NUMERIC(15,2)', nullable: false,           added: true, default: '0' },
      { name: 'status',          type: 'VARCHAR(16)',   nullable: false,           added: true, default: "'ACTIVE'" },
      { name: 'created_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p5 - 카드승인 (Card Authorization). hypercare phase, 100% mapped. */
const SCHEMA_DIFF_P5 = [
  {
    table: 'CARD_MASTER',
    asis:  'CARD.CARD_MASTER',
    tobe:  'public.card_master',
    _autoMapped: true,
    sources: [{ alias: 'cm', table: 'CARD.CARD_MASTER', role: 'primary' }],
    asisCols: [
      { name: 'CARD_ID',     type: 'CHAR(20)',          nullable: false, pk: true },
      { name: 'ACCT_NO',     type: 'CHAR(16)',          nullable: false },
      { name: 'CARD_NO',     type: 'CHAR(19)',          nullable: false },
      { name: 'CARD_TYPE',   type: 'CHAR(2)',           nullable: false },
      { name: 'HOLDER_NM',   type: 'CHAR(40) EBCDIC-KANA', nullable: false },
      { name: 'ISSUE_DT',    type: 'CHAR(8) YYYYMMDD',  nullable: false },
      { name: 'EXPIRE_DT',   type: 'CHAR(8) YYYYMMDD',  nullable: false },
      { name: 'STATUS_FLG',  type: 'CHAR(1)',           nullable: false },
      { name: 'LIMIT_AMT',   type: 'COMP-3 S9(11)V99',  nullable: true  },
    ],
    tobeCols: [
      { name: 'card_id',        type: 'VARCHAR(20)',   nullable: false, pk: true, renameFrom: 'CARD_ID', renameConfidence: 1.00 },
      { name: 'account_no',     type: 'VARCHAR(16)',   nullable: false,           renameFrom: 'ACCT_NO', renameConfidence: 1.00 },
      { name: 'card_number',    type: 'VARCHAR(19)',   nullable: false,           renameFrom: 'CARD_NO', renameConfidence: 1.00 },
      { name: 'card_type',      type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'CARD_TYPE',renameConfidence: 0.85 },
      { name: 'holder_name',    type: 'VARCHAR(80)',   nullable: false,           renameFrom: 'HOLDER_NM',renameConfidence: 0.90 },
      { name: 'issued_at',      type: 'DATE',          nullable: false,           renameFrom: 'ISSUE_DT',renameConfidence: 1.00 },
      { name: 'expires_at',     type: 'DATE',          nullable: false,           renameFrom: 'EXPIRE_DT',renameConfidence: 1.00 },
      { name: 'status',         type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS_FLG',renameConfidence: 0.80 },
      { name: 'credit_limit',   type: 'NUMERIC(13,2)', nullable: true,            renameFrom: 'LIMIT_AMT',renameConfidence: 0.90 },
      { name: 'created_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'CARD_AUTH_LOG',
    asis:  'CARD.AUTH_LOG',
    tobe:  'public.card_auth_log',
    _autoMapped: true,
    sources: [{ alias: 'al', table: 'CARD.AUTH_LOG', role: 'primary' }],
    asisCols: [
      { name: 'AUTH_ID',     type: 'CHAR(24)',          nullable: false, pk: true },
      { name: 'CARD_ID',     type: 'CHAR(20)',          nullable: false },
      { name: 'AUTH_TS',     type: 'CHAR(14)',          nullable: false },
      { name: 'AMT',         type: 'COMP-3 S9(13)V99',  nullable: false },
      { name: 'MERCHANT_ID', type: 'CHAR(15)',          nullable: false },
      { name: 'AUTH_CODE',   type: 'CHAR(6)',           nullable: false },
      { name: 'RESP_CODE',   type: 'CHAR(2)',           nullable: false },
    ],
    tobeCols: [
      { name: 'auth_id',     type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'AUTH_ID',    renameConfidence: 1.00 },
      { name: 'card_id',     type: 'VARCHAR(20)',   nullable: false,           renameFrom: 'CARD_ID',    renameConfidence: 1.00 },
      { name: 'authorized_at', type: 'TIMESTAMP',   nullable: false,           renameFrom: 'AUTH_TS',    renameConfidence: 0.85 },
      { name: 'amount',      type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',        renameConfidence: 1.00 },
      { name: 'merchant_id', type: 'VARCHAR(15)',   nullable: false,           renameFrom: 'MERCHANT_ID',renameConfidence: 1.00 },
      { name: 'auth_code',   type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'AUTH_CODE',  renameConfidence: 1.00 },
      { name: 'response_code', type: 'VARCHAR(2)',  nullable: false,           renameFrom: 'RESP_CODE',  renameConfidence: 0.95 },
      { name: 'created_at',  type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'MERCHANT',
    asis:  'CARD.MERCHANT',
    tobe:  'public.merchant',
    _autoMapped: true,
    sources: [{ alias: 'm', table: 'CARD.MERCHANT', role: 'primary' }],
    asisCols: [
      { name: 'MERCHANT_ID', type: 'CHAR(15)',          nullable: false, pk: true },
      { name: 'MERCHANT_NM', type: 'CHAR(40) EBCDIC-KANA', nullable: false },
      { name: 'MCC',         type: 'CHAR(4)',           nullable: false },
      { name: 'COUNTRY_CD',  type: 'CHAR(2)',           nullable: false },
      { name: 'STATUS_FLG',  type: 'CHAR(1)',           nullable: false },
    ],
    tobeCols: [
      { name: 'merchant_id', type: 'VARCHAR(15)', nullable: false, pk: true, renameFrom: 'MERCHANT_ID', renameConfidence: 1.00 },
      { name: 'merchant_name', type: 'VARCHAR(80)', nullable: false,         renameFrom: 'MERCHANT_NM', renameConfidence: 0.90 },
      { name: 'mcc',         type: 'CHAR(4)',     nullable: false,           renameFrom: 'MCC',         renameConfidence: 1.00 },
      { name: 'country_code',type: 'CHAR(2)',     nullable: false,           renameFrom: 'COUNTRY_CD',  renameConfidence: 0.95 },
      { name: 'status',      type: 'VARCHAR(12)', nullable: false,           renameFrom: 'STATUS_FLG',  renameConfidence: 0.80 },
      { name: 'created_at',  type: 'TIMESTAMP',   nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p6 - 총계정원장 (GL Consolidation). done phase, 100% mapped. */
const SCHEMA_DIFF_P6 = [
  {
    table: 'GL_ACCOUNT',
    asis:  'GL.GL_ACCOUNT',
    tobe:  'public.gl_account',
    _autoMapped: true,
    sources: [{ alias: 'ga', table: 'GL.GL_ACCOUNT', role: 'primary' }],
    asisCols: [
      { name: 'ACCT_CD',     type: 'VARCHAR(10)', nullable: false, pk: true },
      { name: 'ACCT_NM',     type: 'VARCHAR(60)', nullable: false },
      { name: 'ACCT_TYPE',   type: 'VARCHAR(2)',  nullable: false },
      { name: 'PARENT_CD',   type: 'VARCHAR(10)', nullable: true  },
      { name: 'STATUS',      type: 'VARCHAR(2)',  nullable: false },
    ],
    tobeCols: [
      { name: 'account_code', type: 'VARCHAR(10)', nullable: false, pk: true, renameFrom: 'ACCT_CD', renameConfidence: 1.00 },
      { name: 'account_name', type: 'VARCHAR(80)', nullable: false,           renameFrom: 'ACCT_NM', renameConfidence: 0.95 },
      { name: 'account_type', type: 'VARCHAR(12)', nullable: false,           renameFrom: 'ACCT_TYPE',renameConfidence: 0.85 },
      { name: 'parent_code',  type: 'VARCHAR(10)', nullable: true,            renameFrom: 'PARENT_CD',renameConfidence: 1.00 },
      { name: 'status',       type: 'VARCHAR(12)', nullable: false,           renameFrom: 'STATUS',  renameConfidence: 1.00 },
      { name: 'created_at',   type: 'TIMESTAMP',   nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'GL_JOURNAL',
    asis:  'GL.GL_JOURNAL',
    tobe:  'public.gl_journal',
    _autoMapped: true,
    sources: [{ alias: 'gj', table: 'GL.GL_JOURNAL', role: 'primary' }],
    asisCols: [
      { name: 'JOURNAL_ID',  type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'POSTING_DT',  type: 'DATE',         nullable: false },
      { name: 'ACCT_CD',     type: 'VARCHAR(10)',  nullable: false },
      { name: 'AMT',         type: 'NUMBER(15,2)', nullable: false },
      { name: 'DR_CR',       type: 'CHAR(1)',      nullable: false },
      { name: 'DESCR',       type: 'VARCHAR(120)', nullable: true  },
    ],
    tobeCols: [
      { name: 'journal_id',  type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'JOURNAL_ID',renameConfidence: 1.00 },
      { name: 'posting_date',type: 'DATE',          nullable: false,           renameFrom: 'POSTING_DT',renameConfidence: 1.00 },
      { name: 'account_code',type: 'VARCHAR(10)',   nullable: false,           renameFrom: 'ACCT_CD',   renameConfidence: 1.00 },
      { name: 'amount',      type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',       renameConfidence: 1.00 },
      { name: 'direction',   type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'DR_CR',     renameConfidence: 0.70 },
      { name: 'description', type: 'VARCHAR(120)',  nullable: true,            renameFrom: 'DESCR',     renameConfidence: 0.95 },
      { name: 'created_at',  type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'GL_BALANCE',
    asis:  'GL.GL_BALANCE',
    tobe:  'public.gl_balance',
    _autoMapped: true,
    sources: [{ alias: 'gb', table: 'GL.GL_BALANCE', role: 'primary' }],
    asisCols: [
      { name: 'ACCT_CD',     type: 'VARCHAR(10)',  nullable: false, pk: true },
      { name: 'BAL_DT',      type: 'DATE',         nullable: false, pk: true },
      { name: 'BAL_AMT',     type: 'NUMBER(18,2)', nullable: false },
      { name: 'CCY_CD',      type: 'CHAR(3)',      nullable: false },
    ],
    tobeCols: [
      { name: 'account_code', type: 'VARCHAR(10)',   nullable: false, pk: true, renameFrom: 'ACCT_CD', renameConfidence: 1.00 },
      { name: 'balance_date', type: 'DATE',          nullable: false, pk: true, renameFrom: 'BAL_DT',  renameConfidence: 1.00 },
      { name: 'balance_amount', type: 'NUMERIC(18,2)', nullable: false,         renameFrom: 'BAL_AMT', renameConfidence: 1.00 },
      { name: 'currency_code',type: 'CHAR(3)',       nullable: false,           renameFrom: 'CCY_CD',  renameConfidence: 1.00 },
      { name: 'created_at',   type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p7 - 무역금융 (Trade Finance). done phase, 100% mapped. */
const SCHEMA_DIFF_P7 = [
  {
    table: 'LC_MASTER',
    asis:  'TRADE.LC_MASTER',
    tobe:  'public.lc_master',
    _autoMapped: true,
    sources: [{ alias: 'lc', table: 'TRADE.LC_MASTER', role: 'primary' }],
    asisCols: [
      { name: 'LC_NO',        type: 'CHAR(16)',         nullable: false, pk: true },
      { name: 'ISSUE_DT',     type: 'CHAR(8) YYYYMMDD', nullable: false },
      { name: 'EXPIRE_DT',    type: 'CHAR(8) YYYYMMDD', nullable: false },
      { name: 'APPLICANT',    type: 'CHAR(40) EBCDIC-KANA', nullable: false },
      { name: 'BENEFICIARY',  type: 'CHAR(40) EBCDIC-KANA', nullable: false },
      { name: 'AMT',          type: 'COMP-3 S9(13)V99', nullable: false },
      { name: 'CCY_CD',       type: 'CHAR(3)',          nullable: false },
      { name: 'STATUS_FLG',   type: 'CHAR(1)',          nullable: false },
    ],
    tobeCols: [
      { name: 'lc_number',   type: 'VARCHAR(16)',   nullable: false, pk: true, renameFrom: 'LC_NO',      renameConfidence: 1.00 },
      { name: 'issued_at',   type: 'DATE',          nullable: false,           renameFrom: 'ISSUE_DT',   renameConfidence: 1.00 },
      { name: 'expires_at',  type: 'DATE',          nullable: false,           renameFrom: 'EXPIRE_DT',  renameConfidence: 1.00 },
      { name: 'applicant',   type: 'VARCHAR(80)',   nullable: false,           renameFrom: 'APPLICANT',  renameConfidence: 0.90 },
      { name: 'beneficiary', type: 'VARCHAR(80)',   nullable: false,           renameFrom: 'BENEFICIARY',renameConfidence: 0.90 },
      { name: 'amount',      type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',        renameConfidence: 1.00 },
      { name: 'currency_code', type: 'CHAR(3)',     nullable: false,           renameFrom: 'CCY_CD',     renameConfidence: 1.00 },
      { name: 'status',      type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS_FLG', renameConfidence: 0.80 },
      { name: 'created_at',  type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'EXPORT_BILL',
    asis:  'TRADE.EXPORT_BILL',
    tobe:  'public.export_bill',
    _autoMapped: true,
    sources: [{ alias: 'eb', table: 'TRADE.EXPORT_BILL', role: 'primary' }],
    asisCols: [
      { name: 'BILL_NO',     type: 'CHAR(16)',         nullable: false, pk: true },
      { name: 'LC_NO',       type: 'CHAR(16)',         nullable: true  },
      { name: 'ISSUE_DT',    type: 'CHAR(8) YYYYMMDD', nullable: false },
      { name: 'AMT',         type: 'COMP-3 S9(13)V99', nullable: false },
      { name: 'CCY_CD',      type: 'CHAR(3)',          nullable: false },
      { name: 'STATUS_FLG',  type: 'CHAR(1)',          nullable: false },
    ],
    tobeCols: [
      { name: 'bill_number', type: 'VARCHAR(16)',   nullable: false, pk: true, renameFrom: 'BILL_NO',    renameConfidence: 1.00 },
      { name: 'lc_number',   type: 'VARCHAR(16)',   nullable: true,            renameFrom: 'LC_NO',      renameConfidence: 1.00 },
      { name: 'issued_at',   type: 'DATE',          nullable: false,           renameFrom: 'ISSUE_DT',   renameConfidence: 1.00 },
      { name: 'amount',      type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',        renameConfidence: 1.00 },
      { name: 'currency_code', type: 'CHAR(3)',     nullable: false,           renameFrom: 'CCY_CD',     renameConfidence: 1.00 },
      { name: 'status',      type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS_FLG', renameConfidence: 0.80 },
      { name: 'created_at',  type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p8 - 송금허브 (Remittance Hub). planning phase, no DDL imported yet. */
const SCHEMA_DIFF_P8 = [];

/* p9 - 인터넷뱅킹 (Internet Banking). cutover in progress, 100% mapped. */
const SCHEMA_DIFF_P9 = [
  {
    table: 'IB_USER',
    asis:  'IB.IB_USER',
    tobe:  'public.ib_user',
    _autoMapped: true,
    sources: [{ alias: 'u', table: 'IB.IB_USER', role: 'primary' }],
    asisCols: [
      { name: 'USER_ID',      type: 'VARCHAR(20)', nullable: false, pk: true },
      { name: 'CUST_NO',      type: 'VARCHAR(10)', nullable: false },
      { name: 'LOGIN_ID',     type: 'VARCHAR(30)', nullable: false },
      { name: 'EMAIL',        type: 'VARCHAR(80)', nullable: true  },
      { name: 'TEL_NO',       type: 'VARCHAR(15)', nullable: true  },
      { name: 'STATUS',       type: 'VARCHAR(2)',  nullable: false },
      { name: 'LAST_LOGIN_TS',type: 'TIMESTAMP',   nullable: true  },
    ],
    tobeCols: [
      { name: 'user_id',      type: 'VARCHAR(20)', nullable: false, pk: true, renameFrom: 'USER_ID',  renameConfidence: 1.00 },
      { name: 'customer_id',  type: 'VARCHAR(10)', nullable: false,           renameFrom: 'CUST_NO',  renameConfidence: 1.00 },
      { name: 'login_id',     type: 'VARCHAR(30)', nullable: false,           renameFrom: 'LOGIN_ID', renameConfidence: 1.00 },
      { name: 'email',        type: 'VARCHAR(120)',nullable: true,            renameFrom: 'EMAIL',    renameConfidence: 1.00 },
      { name: 'phone_e164',   type: 'VARCHAR(20)', nullable: true,            renameFrom: 'TEL_NO',   renameConfidence: 0.65 },
      { name: 'status',       type: 'VARCHAR(12)', nullable: false,           renameFrom: 'STATUS',   renameConfidence: 0.85 },
      { name: 'last_login_at',type: 'TIMESTAMPTZ', nullable: true,            renameFrom: 'LAST_LOGIN_TS', renameConfidence: 0.92 },
      { name: 'created_at',   type: 'TIMESTAMP',   nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'IB_SESSION',
    asis:  'IB.IB_SESSION',
    tobe:  'public.ib_session',
    _autoMapped: true,
    sources: [{ alias: 's', table: 'IB.IB_SESSION', role: 'primary' }],
    asisCols: [
      { name: 'SESSION_ID',   type: 'VARCHAR(40)', nullable: false, pk: true },
      { name: 'USER_ID',      type: 'VARCHAR(20)', nullable: false },
      { name: 'TOKEN_HASH',   type: 'VARCHAR(64)', nullable: false },
      { name: 'ISSUED_TS',    type: 'TIMESTAMP',   nullable: false },
      { name: 'EXPIRE_TS',    type: 'TIMESTAMP',   nullable: false },
      { name: 'IP_ADDR',      type: 'VARCHAR(45)', nullable: true  },
    ],
    tobeCols: [
      { name: 'session_id',   type: 'VARCHAR(40)',  nullable: false, pk: true, renameFrom: 'SESSION_ID',renameConfidence: 1.00 },
      { name: 'user_id',      type: 'VARCHAR(20)',  nullable: false,           renameFrom: 'USER_ID',   renameConfidence: 1.00 },
      { name: 'token_hash',   type: 'VARCHAR(128)', nullable: false,           renameFrom: 'TOKEN_HASH',renameConfidence: 0.92 },
      { name: 'issued_at',    type: 'TIMESTAMPTZ',  nullable: false,           renameFrom: 'ISSUED_TS', renameConfidence: 0.90 },
      { name: 'expires_at',   type: 'TIMESTAMPTZ',  nullable: false,           renameFrom: 'EXPIRE_TS', renameConfidence: 0.90 },
      { name: 'ip_address',   type: 'INET',         nullable: true,            renameFrom: 'IP_ADDR',   renameConfidence: 0.80 },
      { name: 'created_at',   type: 'TIMESTAMP',    nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'IB_TRANSFER',
    asis:  'IB.IB_TRANSFER',
    tobe:  'public.ib_transfer',
    _autoMapped: true,
    sources: [{ alias: 't', table: 'IB.IB_TRANSFER', role: 'primary' }],
    asisCols: [
      { name: 'TRANSFER_ID',  type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'FROM_ACCT',    type: 'VARCHAR(20)',  nullable: false },
      { name: 'TO_ACCT',      type: 'VARCHAR(20)',  nullable: false },
      { name: 'AMT',          type: 'NUMBER(13,2)', nullable: false },
      { name: 'CCY_CD',       type: 'CHAR(3)',      nullable: false },
      { name: 'TRANSFER_TS',  type: 'TIMESTAMP',    nullable: false },
      { name: 'STATUS',       type: 'VARCHAR(2)',   nullable: false },
    ],
    tobeCols: [
      { name: 'transfer_id',  type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'TRANSFER_ID', renameConfidence: 1.00 },
      { name: 'from_account', type: 'VARCHAR(20)',   nullable: false,           renameFrom: 'FROM_ACCT',   renameConfidence: 0.95 },
      { name: 'to_account',   type: 'VARCHAR(20)',   nullable: false,           renameFrom: 'TO_ACCT',     renameConfidence: 0.95 },
      { name: 'amount',       type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'AMT',         renameConfidence: 0.92 },
      { name: 'currency_code',type: 'CHAR(3)',       nullable: false,           renameFrom: 'CCY_CD',      renameConfidence: 1.00 },
      { name: 'transferred_at', type: 'TIMESTAMPTZ', nullable: false,           renameFrom: 'TRANSFER_TS', renameConfidence: 0.90 },
      { name: 'status',       type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS',      renameConfidence: 0.85 },
      { name: 'created_at',   type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'IB_AUDIT',
    asis:  'IB.IB_AUDIT',
    tobe:  'public.ib_audit',
    _autoMapped: true,
    sources: [{ alias: 'a', table: 'IB.IB_AUDIT', role: 'primary' }],
    asisCols: [
      { name: 'AUDIT_ID',     type: 'VARCHAR(24)', nullable: false, pk: true },
      { name: 'USER_ID',      type: 'VARCHAR(20)', nullable: true  },
      { name: 'EVENT_TYPE',   type: 'VARCHAR(20)', nullable: false },
      { name: 'EVENT_TS',     type: 'TIMESTAMP',   nullable: false },
      { name: 'IP_ADDR',      type: 'VARCHAR(45)', nullable: true  },
      { name: 'DETAIL',       type: 'VARCHAR(500)', nullable: true },
    ],
    tobeCols: [
      { name: 'audit_id',   type: 'VARCHAR(24)',  nullable: false, pk: true, renameFrom: 'AUDIT_ID',  renameConfidence: 1.00 },
      { name: 'user_id',    type: 'VARCHAR(20)',  nullable: true,            renameFrom: 'USER_ID',   renameConfidence: 1.00 },
      { name: 'event_type', type: 'VARCHAR(20)',  nullable: false,           renameFrom: 'EVENT_TYPE',renameConfidence: 1.00 },
      { name: 'event_at',   type: 'TIMESTAMPTZ',  nullable: false,           renameFrom: 'EVENT_TS',  renameConfidence: 0.90 },
      { name: 'ip_address', type: 'INET',         nullable: true,            renameFrom: 'IP_ADDR',   renameConfidence: 0.80 },
      { name: 'detail',     type: 'JSONB',        nullable: true,            renameFrom: 'DETAIL',    renameConfidence: 0.55 },
      { name: 'created_at', type: 'TIMESTAMP',    nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

/* p10 - 신용평가 (Credit Scoring). rehearsal phase, ~80% mapped — 3 of 4
   tables auto-mapped, CREDIT_DECISION still in user-review. */
const SCHEMA_DIFF_P10 = [
  {
    table: 'CREDIT_APPLICATION',
    asis:  'CREDIT.CREDIT_APPLICATION',
    tobe:  'public.credit_application',
    _autoMapped: true,
    sources: [{ alias: 'ca', table: 'CREDIT.CREDIT_APPLICATION', role: 'primary' }],
    asisCols: [
      { name: 'APP_ID',       type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'CUST_NO',      type: 'VARCHAR(10)',  nullable: false },
      { name: 'PROD_CD',      type: 'VARCHAR(8)',   nullable: false },
      { name: 'REQ_AMT',      type: 'NUMBER(15,2)', nullable: false },
      { name: 'REQ_DT',       type: 'DATE',         nullable: false },
      { name: 'PURPOSE_CD',   type: 'VARCHAR(4)',   nullable: false },
      { name: 'STATUS',       type: 'VARCHAR(2)',   nullable: false },
    ],
    tobeCols: [
      { name: 'application_id',   type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'APP_ID',     renameConfidence: 1.00 },
      { name: 'customer_id',      type: 'VARCHAR(10)',   nullable: false,           renameFrom: 'CUST_NO',    renameConfidence: 1.00 },
      { name: 'product_code',     type: 'VARCHAR(8)',    nullable: false,           renameFrom: 'PROD_CD',    renameConfidence: 1.00 },
      { name: 'requested_amount', type: 'NUMERIC(15,2)', nullable: false,           renameFrom: 'REQ_AMT',    renameConfidence: 1.00 },
      { name: 'requested_at',     type: 'DATE',          nullable: false,           renameFrom: 'REQ_DT',     renameConfidence: 0.92 },
      { name: 'purpose_code',     type: 'VARCHAR(4)',    nullable: false,           renameFrom: 'PURPOSE_CD', renameConfidence: 1.00 },
      { name: 'status',           type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'STATUS',     renameConfidence: 0.85 },
      { name: 'created_at',       type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'CREDIT_SCORE',
    asis:  'CREDIT.CREDIT_SCORE',
    tobe:  'public.credit_score',
    _autoMapped: true,
    sources: [{ alias: 'cs', table: 'CREDIT.CREDIT_SCORE', role: 'primary' }],
    asisCols: [
      { name: 'SCORE_ID',   type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'CUST_NO',    type: 'VARCHAR(10)',  nullable: false },
      { name: 'SCORE',      type: 'NUMBER(5,1)',  nullable: false },
      { name: 'GRADE',      type: 'CHAR(2)',      nullable: false },
      { name: 'MODEL_VER',  type: 'VARCHAR(8)',   nullable: false },
      { name: 'CALC_DT',    type: 'DATE',         nullable: false },
    ],
    tobeCols: [
      { name: 'score_id',       type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'SCORE_ID',  renameConfidence: 1.00 },
      { name: 'customer_id',    type: 'VARCHAR(10)',   nullable: false,           renameFrom: 'CUST_NO',   renameConfidence: 1.00 },
      { name: 'score',          type: 'NUMERIC(5,1)',  nullable: false,           renameFrom: 'SCORE',     renameConfidence: 1.00 },
      { name: 'grade',          type: 'CHAR(2)',       nullable: false,           renameFrom: 'GRADE',     renameConfidence: 1.00 },
      { name: 'model_version',  type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'MODEL_VER', renameConfidence: 0.95 },
      { name: 'calculated_at',  type: 'DATE',          nullable: false,           renameFrom: 'CALC_DT',   renameConfidence: 0.92 },
      { name: 'created_at',     type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  {
    table: 'CREDIT_HISTORY',
    asis:  'CREDIT.CREDIT_HISTORY',
    tobe:  'public.credit_history',
    _autoMapped: true,
    sources: [{ alias: 'ch', table: 'CREDIT.CREDIT_HISTORY', role: 'primary' }],
    asisCols: [
      { name: 'HIST_ID',    type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'CUST_NO',    type: 'VARCHAR(10)',  nullable: false },
      { name: 'EVENT_TYPE', type: 'VARCHAR(4)',   nullable: false },
      { name: 'EVENT_DT',   type: 'DATE',         nullable: false },
      { name: 'AMT',        type: 'NUMBER(15,2)', nullable: true  },
      { name: 'INST_CD',    type: 'VARCHAR(6)',   nullable: false },
      { name: 'NOTE',       type: 'VARCHAR(200)', nullable: true  },
    ],
    tobeCols: [
      { name: 'history_id',      type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'HIST_ID',   renameConfidence: 1.00 },
      { name: 'customer_id',     type: 'VARCHAR(10)',   nullable: false,           renameFrom: 'CUST_NO',   renameConfidence: 1.00 },
      { name: 'event_type',      type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'EVENT_TYPE',renameConfidence: 0.85 },
      { name: 'occurred_at',     type: 'DATE',          nullable: false,           renameFrom: 'EVENT_DT',  renameConfidence: 0.90 },
      { name: 'amount',          type: 'NUMERIC(15,2)', nullable: true,            renameFrom: 'AMT',       renameConfidence: 1.00 },
      { name: 'institution_code',type: 'VARCHAR(6)',    nullable: false,           renameFrom: 'INST_CD',   renameConfidence: 1.00 },
      { name: 'note',            type: 'VARCHAR(200)',  nullable: true,            renameFrom: 'NOTE',      renameConfidence: 1.00 },
      { name: 'created_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
  /* CREDIT_DECISION 은 아직 매핑 작업 진행 중 — _autoMapped 플래그 없음 */
  {
    table: 'CREDIT_DECISION',
    asis:  'CREDIT.CREDIT_DECISION',
    tobe:  'public.credit_decision',
    sources: [{ alias: 'cd', table: 'CREDIT.CREDIT_DECISION', role: 'primary' }],
    _autoMapped: true,
    asisCols: [
      { name: 'DEC_ID',      type: 'VARCHAR(24)',  nullable: false, pk: true },
      { name: 'APP_ID',      type: 'VARCHAR(24)',  nullable: false },
      { name: 'DECISION',    type: 'CHAR(1)',      nullable: false },
      { name: 'APPROVED_AMT',type: 'NUMBER(15,2)', nullable: true  },
      { name: 'REVIEWER',    type: 'VARCHAR(8)',   nullable: false },
      { name: 'DEC_DT',      type: 'DATE',         nullable: false },
      { name: 'REASON_CD',   type: 'VARCHAR(4)',   nullable: true  },
    ],
    tobeCols: [
      { name: 'decision_id',     type: 'VARCHAR(24)',   nullable: false, pk: true, renameFrom: 'DEC_ID',      renameConfidence: 1.00 },
      { name: 'application_id',  type: 'VARCHAR(24)',   nullable: false,           renameFrom: 'APP_ID',      renameConfidence: 1.00 },
      { name: 'decision',        type: 'VARCHAR(12)',   nullable: false,           renameFrom: 'DECISION',    renameConfidence: 0.70 },
      { name: 'approved_amount', type: 'NUMERIC(15,2)', nullable: true,            renameFrom: 'APPROVED_AMT',renameConfidence: 1.00 },
      { name: 'reviewer_id',     type: 'VARCHAR(8)',    nullable: false,           renameFrom: 'REVIEWER',    renameConfidence: 0.85 },
      { name: 'decided_at',      type: 'DATE',          nullable: false,           renameFrom: 'DEC_DT',      renameConfidence: 0.92 },
      { name: 'reason_code',     type: 'VARCHAR(4)',    nullable: true,            renameFrom: 'REASON_CD',   renameConfidence: 1.00 },
      { name: 'created_at',      type: 'TIMESTAMP',     nullable: false,           added: true, default: 'NOW()' },
    ],
  },
];

const SCHEMA_DIFF_BY_PROJECT = {
  p1: SCHEMA_DIFF_P1,
  p2: SCHEMA_DIFF_P2,
  p3: SCHEMA_DIFF_P3,
  p4: SCHEMA_DIFF_P4,
  p5: SCHEMA_DIFF_P5,
  p6: SCHEMA_DIFF_P6,
  p7: SCHEMA_DIFF_P7,
  p8: SCHEMA_DIFF_P8,
  p9: SCHEMA_DIFF_P9,
  p10: SCHEMA_DIFF_P10,
};

/* Active SCHEMA_DIFF — re-bound by setActiveDataProject(projectId) so that
   legacy code using the global symbol stays in sync with the active project.
   Kept as 'let' so we can mutate the binding when the active project changes.
   The first item RUNS_BY_PROJECT.p1 references this for default p1 view. */
let SCHEMA_DIFF = SCHEMA_DIFF_P1;
const getSchemaDiffByProject = (projectId) => SCHEMA_DIFF_BY_PROJECT[projectId] || [];

/* ─── Synthesis helpers ────────────────────────────────────────────
   Column-level mapping rows can be derived on-the-fly from a SCHEMA_DIFF
   entry. Hand-authored MAPPING (for ACCT_MASTER) is kept as-is and used
   preferentially; every other table is synthesized. */

/* Per-table, per-column manual overrides. Keyed by SCHEMA_DIFF .table name
   then by TO-BE column name. Populated via updateColumnOverride() when the
   user edits a mapping rule in the Inspector. Empty by default → all
   mappings come from auto-synthesis. */
const COLUMN_OVERRIDES = {};
const getColumnOverrides    = (internalName) => (COLUMN_OVERRIDES[internalName] || {});
const updateColumnOverride  = (internalName, colName, override) => {
  if (!COLUMN_OVERRIDES[internalName]) COLUMN_OVERRIDES[internalName] = {};
  if (override === null || override === undefined) {
    delete COLUMN_OVERRIDES[internalName][colName];
  } else {
    COLUMN_OVERRIDES[internalName][colName] = override;
  }
};

/* Build a column-mapping row from a user override. Three explicit strategies:
   - source column  → 'auto' (passthrough) or 'rule' (transform) based on type delta + SQL expr
   - 'null'         → fill NULL (only valid for nullable columns)
   - 'default'      → use DDL DEFAULT clause (only valid if one is defined) */
const rowFromOverride = (tc, ov, asisByName) => {
  const tgtNullable = tc.nullable !== false;
  const ddlDefault = tc.default && tc.default !== 'NULL' ? tc.default : null;
  const base = { tgt: tc.name, tgtType: tc.type, pk: !!tc.pk, tgtNullable, ddlDefault, overridden: true };

  if (ov.rule === 'null') {
    return { ...base, src: 'NULL', srcType: 'literal',
      rule: 'null', status: tgtNullable ? 'ok' : 'err',
      note: ov.note || (tgtNullable ? 'mapped to NULL' : 'NOT NULL column cannot be NULL — pick another strategy'),
      sourceAlias: null };
  }
  if (ov.rule === 'default') {
    return { ...base, src: 'DEFAULT', srcType: 'literal',
      rule: 'default', status: ddlDefault ? 'ok' : 'err',
      note: ov.note || (ddlDefault ? `DDL default ${ddlDefault}` : 'no DDL default defined — fix DDL or pick another strategy'),
      sourceAlias: null };
  }
  /* source-based mapping */
  const ac = asisByName[ov.sourceColumn];
  if (!ac) {
    return { ...base, src: ov.sourceColumn || '?', srcType: '?',
      rule: 'rule', status: 'err',
      note: `override source '${ov.sourceColumn}' not found in current bindings — re-bind or clear mapping`,
      sourceAlias: ov.sourceAlias || null };
  }
  const hasExpr   = !!(ov.transformExpr && ov.transformExpr.trim());
  const typeDelta = ac.type !== tc.type;
  const rule = hasExpr || typeDelta ? 'rule' : 'auto';
  return { ...base, src: ac.name, srcType: ac.type,
    rule, status: 'ok',
    note: ov.note || (hasExpr ? ov.transformExpr : ''),
    sourceAlias: ac.source || ov.sourceAlias || null,
    transformExpr: ov.transformExpr };
};

const mappingsFromSchemaDiff = (t) => {
  const rows = [];
  /* Target-centric: one row per TO-BE column. Every TO-BE column starts
     'unmapped' until the user picks a source. The status is derived from
     DDL nullable + default — no auto-rename or 'added' inference (those
     would be guesses; user picks).
       - nullable               → queued (run will fill NULL)
       - NOT NULL with default  → queued (run will use the DDL default)
       - NOT NULL no default    → err   (must assign source or fix DDL)
     Exception: if the SCHEMA_DIFF entry carries `_autoMapped: true`, the
     project is past the mapping phase (sign-off / cutover / hypercare /
     done) and we synthesize ok-status rows from each tobeCol.renameFrom
     so the Mapping screen reflects the approved spec. */
  const asisCols = effectiveAsisCols(t);
  const asisByName = Object.fromEntries(asisCols.map(c => [c.name, c]));
  const overrides = getColumnOverrides(t.table);
  const hasBinding = (t.sources || []).length > 0;
  const autoMapped = !!t._autoMapped;

  t.tobeCols.forEach(tc => {
    const ov = overrides[tc.name];
    if (ov) {
      rows.push(rowFromOverride(tc, ov, asisByName));
      return;
    }
    const tgtNullable = tc.nullable !== false;
    const ddlDefault = tc.default && tc.default !== 'NULL' ? tc.default : null;

    /* Auto-mapped projects: synthesize an 'added' row for new columns and a
       rename-based row for everything that has a renameFrom binding. This
       mirrors what the user would have produced manually after sign-off. */
    if (autoMapped) {
      if (tc.added) {
        rows.push({
          src: '—', srcType: '—',
          tgt: tc.name, tgtType: tc.type,
          rule: 'added', status: 'ok',
          pk: !!tc.pk, tgtNullable, ddlDefault,
          note: ddlDefault ? `no AS-IS source · default = ${ddlDefault}` : 'no AS-IS source · added column',
          sourceAlias: null,
        });
        return;
      }
      if (tc.renameFrom) {
        const ac = asisByName[tc.renameFrom];
        if (ac) {
          const typeDelta = ac.type !== tc.type;
          rows.push({
            src: ac.name, srcType: ac.type,
            tgt: tc.name, tgtType: tc.type,
            rule: typeDelta ? 'rule' : 'auto',
            status: 'ok',
            pk: !!tc.pk, tgtNullable, ddlDefault,
            note: typeDelta ? `auto: ${ac.type} → ${tc.type}` : '',
            sourceAlias: ac.source || (t.sources?.[0]?.alias) || null,
          });
          return;
        }
      }
    }

    rows.push({
      src: '—', srcType: '—',
      tgt: tc.name, tgtType: tc.type,
      rule: 'unmapped', status: 'queued',
      pk: !!tc.pk, tgtNullable,
      ddlDefault,
      mergeHint: tc.mergedFrom || null, /* informational only — user must still pick */
      note: hasBinding
        ? 'pick a strategy — open Inspector → AS-IS column / Use NULL / Use DDL default'
        : 'no source bound — expand Table binding above to add an AS-IS source',
      sourceAlias: null,
    });
  });

  return rows;
};

const getColumnMappings = (tableName) => {
  const sd = SCHEMA_DIFF.find(s => s.table === tableName);
  return sd ? mappingsFromSchemaDiff(sd) : null;
};

const getSchemaDiff = (tableName) => SCHEMA_DIFF.find(s => s.table === tableName);

/* Fake sample rows for the Mapping inspector preview. Keyed by source column
   name; the UI applies the active rule visually (mock — real data requires
   a live source connection). */
const SAMPLE_SOURCE_ROWS = {
  'ACCT-NO':          ['AC00881104','AC00881105','AC00881106','AC00881107','AC00881108','AC00881109','AC00881110','AC00881111','AC00881112','AC00881113'],
  'CUST-ID':          ['C000124551','C000124552','C000124553','C000124554','C000124555','C000124556','C000124557','C000124558','C000124559','C000124560'],
  'OPEN-DT':          ['20210412','20210515','20210701','20210812','20210903','20211020','20211125','20220108','20220216','20220330'],
  'BAL-AMT':          ['+000000001250{','+000000005820C','+000000000000{','+000000124880F','+000000002500D','+000000098214G','+000000011030A','+000000000005{','+000000552200M','+000000078820B'],
  'STATUS-FLG':       ['A','A','C','A','D','A','A','A','C','A'],
  'ACCT-NAME-KANJI':  ['ﾀﾞｲｲﾁﾌｼﾞﾉ','ｽｽﾞｷｻﾄｼ','ﾔﾏﾀﾞﾊﾅｺ','ｶﾄｳｹﾝｼﾞ','ﾖｼﾀﾞｱｲｺ','ｲﾄｳﾊﾙｷ','ﾏﾂﾓﾄﾕｳ','ｺﾊﾞﾔｼﾃﾂﾔ','ﾀｶﾊｼﾅｵ','ﾀﾅｶﾐｷ'],
  'UPD-TS':           ['20260420091230','20260420091405','20260420091640','00000000000000','20260420092105','20260420092340','20260420092615','20260420092850','20260420093125','20260420093400'],
  'TEL_NO':           ['0312345678','0801112222','0903334444','0455556666','0667778888','0789990000','0312346789','0801113333','0903335555','0455557777'],
  'EMAIL_ADDR':       ['tanaka@example.co.jp','suzuki@example.jp','yamada@corp.jp','kato@mail.co.jp','yoshida@ex.jp','ito@example.jp','matsumoto@corp.jp','kobayashi@mail.jp','takahashi@ex.jp','tanaka.m@example.jp'],
  'TXN_DT':           ['20240312','20240312','20240313','20240313','20240313','20240314','20240314','20240315','20240315','20240316'],
  'AMT':              ['+000000050000{','+000000120000C','+000000008200D','+000000450000{','+000000020000F','+000000007500A','+000000330000{','+000000000500D','+000000180000{','+000000065000C'],
  '_default':         ['row 001','row 002','row 003','row 004','row 005','row 006','row 007','row 008','row 009','row 010'],
};

const applyMockTransform = (srcVal, row) => {
  /* Light heuristic: show how the transform would change the value visually */
  const r = row || {};
  if (!srcVal) return srcVal;
  if (r.rule === 'skip' || r.rule === 'added') return '—';
  const srcT = r.srcType || '';
  const tgtT = r.tgtType || '';
  if (srcT.includes('YYYYMMDD') && tgtT === 'DATE' && /^\d{8}$/.test(srcVal)) {
    return `${srcVal.slice(0,4)}-${srcVal.slice(4,6)}-${srcVal.slice(6,8)}`;
  }
  if (srcT.includes('CHAR(14)') && tgtT.includes('TIMESTAMP')) {
    if (srcVal === '00000000000000') return 'NULL';
    return `${srcVal.slice(0,4)}-${srcVal.slice(4,6)}-${srcVal.slice(6,8)} ${srcVal.slice(8,10)}:${srcVal.slice(10,12)}:${srcVal.slice(12,14)}`;
  }
  if (srcT.includes('COMP-3')) {
    /* fake COMP-3 unpack — take numeric chars and pretend decimal scale */
    const digits = (srcVal.match(/\d+/g) || []).join('');
    if (!digits) return srcVal;
    const scaled = (parseInt(digits, 10) / 100).toFixed(2);
    return (srcVal.startsWith('-') ? '-' : '') + scaled;
  }
  if (srcT.includes('EBCDIC-KANA') || srcT.includes('EBCDIC-KANJI') || srcT.includes('EBCDIC')) {
    /* fake iconv — just tag the value */
    return `${srcVal}  (utf-8)`;
  }
  if (r.note && r.note.includes("A→'ACTIVE'")) {
    const m = { A: 'ACTIVE', C: 'CLOSED', D: 'DORMANT' };
    return m[srcVal] || srcVal;
  }
  return srcVal;
};

/* ─── AS-IS / TO-BE inventory — DDL-derived ground truth ──────────
   Both sides' table lists are stable once DDL is imported and do NOT
   depend on current bindings. This matches reality: DDL parsing yields
   a fixed schema; bindings are a separate overlay that may reference
   any subset of those tables.

   Build helpers overlay routing/composition info from SCHEMA_DIFF
   but never let that information remove a table from the inventory. */

const ASIS_SCHEMA_TABLES_P1 = [
  { name: 'CORE.ACCT_MASTER',       columnCount: 13, rows: 18_442_331 },
  { name: 'CORE.CUST_PROFILE',      columnCount: 8,  rows: 2_118_774 },
  { name: 'CORE.CUST_CONTACT',      columnCount: 4,  rows: 4_882_091 },
  { name: 'CORE.TXN_JOURNAL_2023',  columnCount: 9,  rows: 284_003_117 },
  { name: 'CORE.TXN_JOURNAL_2024',  columnCount: 9,  rows: 312_889_001 },
  { name: 'CORE.LEGACY_GRADE_DICT', columnCount: 2,  rows: 45,          note: 'reference table · never migrated' },
  { name: 'CORE.MAINT_WORK_TEMP',   columnCount: 6,  rows: 120,         note: 'scratch work area · drop after cutover' },
  { name: 'CORE.ORG_HIST',          columnCount: 8,  rows: 3120,        note: 'pending steward decision' },
];

const TOBE_SCHEMA_TABLES_P1 = [
  { name: 'public.account',          columnCount: 18 },
  { name: 'public.customer',         columnCount: 14 },
  { name: 'public.transaction_2024', columnCount: 12 },
  { name: 'public.transaction_all',  columnCount: 9 },
  { name: 'public.loan',             columnCount: 15, note: 'Loan Origination scope · no source assigned yet' },
  { name: 'public.card',             columnCount: 11, note: 'Card Authorization scope · no source assigned yet' },
  { name: 'public.fx_position',      columnCount: 7,  note: 'FX Treasury scope · no source assigned yet' },
];

/* p2 - 수신원장 */
const ASIS_SCHEMA_TABLES_P2 = [
  { name: 'DEPOSIT.DEPOSIT_ACCOUNT', columnCount: 10, rows: 8_412_330 },
  { name: 'DEPOSIT.DEPOSIT_TXN',     columnCount: 6,  rows: 142_881_004 },
  { name: 'DEPOSIT.INTEREST_PAY',    columnCount: 5,  rows: 18_004_551 },
];
const TOBE_SCHEMA_TABLES_P2 = [
  { name: 'public.deposit_account',     columnCount: 11 },
  { name: 'public.deposit_transaction', columnCount: 7 },
  { name: 'public.interest_payment',    columnCount: 6 },
];

/* p3 - 외환 (AS-IS only, no TO-BE) */
const ASIS_SCHEMA_TABLES_P3 = [
  { name: 'FX.FX_RATE_DAILY', columnCount: 6, rows: 44_211 },
  { name: 'FX.FX_DEAL',       columnCount: 8, rows: 2_881_004 },
];
const TOBE_SCHEMA_TABLES_P3 = [];

/* p4 - 여신 (TO-BE only, no AS-IS yet) */
const ASIS_SCHEMA_TABLES_P4 = [];
const TOBE_SCHEMA_TABLES_P4 = [
  { name: 'public.loan_application', columnCount: 9 },
  { name: 'public.loan_master',      columnCount: 10 },
];

/* p5 - 카드승인 */
const ASIS_SCHEMA_TABLES_P5 = [
  { name: 'CARD.CARD_MASTER', columnCount: 9, rows: 3_002_114 },
  { name: 'CARD.AUTH_LOG',    columnCount: 7, rows: 812_004_552 },
  { name: 'CARD.MERCHANT',    columnCount: 5, rows: 124_882 },
];
const TOBE_SCHEMA_TABLES_P5 = [
  { name: 'public.card_master',   columnCount: 10 },
  { name: 'public.card_auth_log', columnCount: 8 },
  { name: 'public.merchant',      columnCount: 6 },
];

/* p6 - 총계정원장 */
const ASIS_SCHEMA_TABLES_P6 = [
  { name: 'GL.GL_ACCOUNT', columnCount: 5, rows: 18_442 },
  { name: 'GL.GL_JOURNAL', columnCount: 6, rows: 98_221_412 },
  { name: 'GL.GL_BALANCE', columnCount: 4, rows: 2_881_009 },
];
const TOBE_SCHEMA_TABLES_P6 = [
  { name: 'public.gl_account', columnCount: 6 },
  { name: 'public.gl_journal', columnCount: 7 },
  { name: 'public.gl_balance', columnCount: 5 },
];

/* p7 - 무역금융 */
const ASIS_SCHEMA_TABLES_P7 = [
  { name: 'TRADE.LC_MASTER',   columnCount: 8, rows: 88_412 },
  { name: 'TRADE.EXPORT_BILL', columnCount: 6, rows: 142_551 },
];
const TOBE_SCHEMA_TABLES_P7 = [
  { name: 'public.lc_master',   columnCount: 9 },
  { name: 'public.export_bill', columnCount: 7 },
];

/* p8 - 송금허브 (no DDL imported yet) */
const ASIS_SCHEMA_TABLES_P8 = [];
const TOBE_SCHEMA_TABLES_P8 = [];

/* p9 - 인터넷뱅킹 */
const ASIS_SCHEMA_TABLES_P9 = [
  { name: 'IB.IB_USER',     columnCount: 7, rows: 4_212_881 },
  { name: 'IB.IB_SESSION',  columnCount: 6, rows: 88_412_551 },
  { name: 'IB.IB_TRANSFER', columnCount: 7, rows: 412_882_104 },
  { name: 'IB.IB_AUDIT',    columnCount: 6, rows: 1_204_882_551 },
];
const TOBE_SCHEMA_TABLES_P9 = [
  { name: 'public.ib_user',     columnCount: 8 },
  { name: 'public.ib_session',  columnCount: 7 },
  { name: 'public.ib_transfer', columnCount: 8 },
  { name: 'public.ib_audit',    columnCount: 7 },
];

/* p10 - 신용평가 */
const ASIS_SCHEMA_TABLES_P10 = [
  { name: 'CREDIT.CREDIT_APPLICATION', columnCount: 7, rows: 2_412_881 },
  { name: 'CREDIT.CREDIT_SCORE',       columnCount: 6, rows: 18_004_551 },
  { name: 'CREDIT.CREDIT_HISTORY',     columnCount: 7, rows: 88_412_551 },
  { name: 'CREDIT.CREDIT_DECISION',    columnCount: 7, rows: 1_842_004 },
];
const TOBE_SCHEMA_TABLES_P10 = [
  { name: 'public.credit_application', columnCount: 8 },
  { name: 'public.credit_score',       columnCount: 7 },
  { name: 'public.credit_history',     columnCount: 8 },
  { name: 'public.credit_decision',    columnCount: 8 },
];

const ASIS_SCHEMA_TABLES_BY_PROJECT = {
  p1: ASIS_SCHEMA_TABLES_P1, p2: ASIS_SCHEMA_TABLES_P2, p3: ASIS_SCHEMA_TABLES_P3,
  p4: ASIS_SCHEMA_TABLES_P4, p5: ASIS_SCHEMA_TABLES_P5, p6: ASIS_SCHEMA_TABLES_P6,
  p7: ASIS_SCHEMA_TABLES_P7, p8: ASIS_SCHEMA_TABLES_P8, p9: ASIS_SCHEMA_TABLES_P9,
  p10: ASIS_SCHEMA_TABLES_P10,
};
const TOBE_SCHEMA_TABLES_BY_PROJECT = {
  p1: TOBE_SCHEMA_TABLES_P1, p2: TOBE_SCHEMA_TABLES_P2, p3: TOBE_SCHEMA_TABLES_P3,
  p4: TOBE_SCHEMA_TABLES_P4, p5: TOBE_SCHEMA_TABLES_P5, p6: TOBE_SCHEMA_TABLES_P6,
  p7: TOBE_SCHEMA_TABLES_P7, p8: TOBE_SCHEMA_TABLES_P8, p9: TOBE_SCHEMA_TABLES_P9,
  p10: TOBE_SCHEMA_TABLES_P10,
};

let ASIS_SCHEMA_TABLES = ASIS_SCHEMA_TABLES_P1;
let TOBE_SCHEMA_TABLES = TOBE_SCHEMA_TABLES_P1;

/* Per-AS-IS-table column schema — the canonical "DDL parse output" for every
   known AS-IS table. effectiveAsisCols(sd) reads this keyed by the current
   sources of a binding and assembles a dynamic asisCols list that reacts to
   JOIN/UNION edits. The hand-tuned sd.asisCols on SCHEMA_DIFF entries is
   kept for the artifacts/schema-diff view but no longer drives the Mapping
   column grid directly. */
const TXN_JOURNAL_COLS = [
  { name: 'TXN_ID',     type: 'CHAR(24)',            nullable: false, pk: true },
  { name: 'ACCT_NO',    type: 'CHAR(16)',            nullable: false },
  { name: 'TXN_DT',     type: 'CHAR(8) YYYYMMDD',    nullable: false },
  { name: 'TXN_TM',     type: 'CHAR(6) HHMMSS',      nullable: false },
  { name: 'AMT',        type: 'COMP-3 S9(13)V99',    nullable: false },
  { name: 'DR_CR',      type: 'CHAR(1)',             nullable: false },
  { name: 'BR_CODE',    type: 'CHAR(4)',             nullable: false },
  { name: 'CHANNEL_CD', type: 'CHAR(2)',             nullable: false },
  { name: 'MEMO',       type: 'CHAR(40) EBCDIC-KANA', nullable: true },
];

const ASIS_COLUMN_SCHEMA = {
  'CORE.ACCT_MASTER': [
    { name: 'ACCT_NO',         type: 'CHAR(16)',            nullable: false, pk: true },
    { name: 'CUST_ID',         type: 'CHAR(10)',            nullable: false },
    { name: 'BR_CODE',         type: 'CHAR(4)',             nullable: false },
    { name: 'ACCT_TYPE',       type: 'CHAR(2)',             nullable: false },
    { name: 'CURRENCY_CD',     type: 'CHAR(3)',             nullable: false },
    { name: 'BAL_AMT',         type: 'COMP-3 S9(13)V99',    nullable: false },
    { name: 'OPEN_DT',         type: 'CHAR(8) YYYYMMDD',    nullable: false },
    { name: 'STATUS_FLG',      type: 'CHAR(1)',             nullable: false },
    { name: 'ACCT_NAME_KANJI', type: 'CHAR(40) EBCDIC-KANA', nullable: true },
    { name: 'FILLER_01',       type: 'CHAR(20)',            nullable: true },
    { name: 'RSRV_FLAG',       type: 'CHAR(1)',             nullable: true },
    { name: 'UPD_USER',        type: 'CHAR(8)',             nullable: true },
    { name: 'UPD_TS',          type: 'CHAR(14)',            nullable: true },
  ],
  'CORE.CUST_PROFILE': [
    { name: 'CUST_ID',      type: 'CHAR(10)',             nullable: false, pk: true },
    { name: 'NAME_KANJI',   type: 'CHAR(60) EBCDIC-KANA', nullable: false },
    { name: 'NAME_KANA',    type: 'CHAR(60) EBCDIC-KANA', nullable: false },
    { name: 'BIRTH_DT',     type: 'CHAR(8) YYYYMMDD',     nullable: true },
    { name: 'GENDER_CD',    type: 'CHAR(1)',              nullable: true },
    { name: 'NATIONALITY',  type: 'CHAR(3)',              nullable: true },
    { name: 'OPEN_BR',      type: 'CHAR(4)',              nullable: false },
    { name: 'LEGACY_GRADE', type: 'CHAR(1)',              nullable: true },
  ],
  'CORE.CUST_CONTACT': [
    { name: 'TEL_NO',       type: 'CHAR(15)', nullable: true },
    { name: 'EMAIL_ADDR',   type: 'CHAR(80)', nullable: true },
    { name: 'PREF_CHANNEL', type: 'CHAR(2)',  nullable: true },
    { name: 'OPT_IN_FLG',   type: 'CHAR(1)',  nullable: true },
  ],
  'CORE.TXN_JOURNAL_2023': TXN_JOURNAL_COLS,
  'CORE.TXN_JOURNAL_2024': TXN_JOURNAL_COLS,
  'CORE.LEGACY_GRADE_DICT': [
    { name: 'GRADE_CD',   type: 'CHAR(1)',  nullable: false, pk: true },
    { name: 'GRADE_NAME', type: 'CHAR(20)', nullable: false },
  ],
  'CORE.MAINT_WORK_TEMP': [
    { name: 'WORK_ID',   type: 'CHAR(8)',          nullable: false, pk: true },
    { name: 'WORK_TYPE', type: 'CHAR(4)',          nullable: false },
    { name: 'WORK_DT',   type: 'CHAR(8) YYYYMMDD', nullable: true },
    { name: 'AMOUNT',    type: 'COMP-3 S9(11)V99', nullable: true },
    { name: 'STATUS',    type: 'CHAR(1)',          nullable: true },
    { name: 'NOTE',      type: 'CHAR(100)',        nullable: true },
  ],
  'CORE.ORG_HIST': [
    { name: 'ORG_ID',     type: 'CHAR(6)',              nullable: false, pk: true },
    { name: 'ORG_NAME',   type: 'CHAR(60) EBCDIC-KANA', nullable: false },
    { name: 'PARENT_ORG', type: 'CHAR(6)',              nullable: true },
    { name: 'OPEN_DT',    type: 'CHAR(8) YYYYMMDD',     nullable: false },
    { name: 'CLOSE_DT',   type: 'CHAR(8) YYYYMMDD',     nullable: true },
    { name: 'MANAGER',    type: 'CHAR(8)',              nullable: true },
    { name: 'REGION_CD',  type: 'CHAR(2)',              nullable: true },
    { name: 'STATUS',     type: 'CHAR(1)',              nullable: false },
  ],

  /* p2 - 수신원장 */
  'DEPOSIT.DEPOSIT_ACCOUNT': [
    { name: 'ACCT_NO',   type: 'VARCHAR(20)',  nullable: false, pk: true },
    { name: 'CUST_NO',   type: 'VARCHAR(10)',  nullable: false },
    { name: 'PROD_CD',   type: 'VARCHAR(8)',   nullable: false },
    { name: 'BR_CD',     type: 'VARCHAR(4)',   nullable: false },
    { name: 'CCY_CD',    type: 'CHAR(3)',      nullable: false },
    { name: 'BAL',       type: 'NUMBER(15,2)', nullable: false },
    { name: 'OPEN_DT',   type: 'DATE',         nullable: false },
    { name: 'MATURE_DT', type: 'DATE',         nullable: true  },
    { name: 'INT_RATE',  type: 'NUMBER(9,6)',  nullable: false },
    { name: 'STATUS',    type: 'VARCHAR(2)',   nullable: false },
  ],
  'DEPOSIT.DEPOSIT_TXN': [
    { name: 'TXN_ID',  type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'ACCT_NO', type: 'VARCHAR(20)',  nullable: false },
    { name: 'TXN_DT',  type: 'DATE',         nullable: false },
    { name: 'AMT',     type: 'NUMBER(15,2)', nullable: false },
    { name: 'DR_CR',   type: 'CHAR(1)',      nullable: false },
    { name: 'CHANNEL', type: 'VARCHAR(2)',   nullable: false },
  ],
  'DEPOSIT.INTEREST_PAY': [
    { name: 'PAY_ID',  type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'ACCT_NO', type: 'VARCHAR(20)',  nullable: false },
    { name: 'PAY_DT',  type: 'DATE',         nullable: false },
    { name: 'AMT',     type: 'NUMBER(13,2)', nullable: false },
    { name: 'TAX_AMT', type: 'NUMBER(13,2)', nullable: false },
  ],

  /* p3 - 외환 */
  'FX.FX_RATE_DAILY': [
    { name: 'RATE_DT',   type: 'CHAR(8) YYYYMMDD',  nullable: false, pk: true },
    { name: 'CCY_PAIR',  type: 'CHAR(6)',           nullable: false, pk: true },
    { name: 'BID_RT',    type: 'COMP-3 S9(7)V9(6)', nullable: false },
    { name: 'ASK_RT',    type: 'COMP-3 S9(7)V9(6)', nullable: false },
    { name: 'MID_RT',    type: 'COMP-3 S9(7)V9(6)', nullable: false },
    { name: 'SOURCE_CD', type: 'CHAR(4)',           nullable: false },
  ],
  'FX.FX_DEAL': [
    { name: 'DEAL_NO',    type: 'CHAR(16)',          nullable: false, pk: true },
    { name: 'DEAL_DT',    type: 'CHAR(8) YYYYMMDD',  nullable: false },
    { name: 'CCY_PAIR',   type: 'CHAR(6)',           nullable: false },
    { name: 'BUY_AMT',    type: 'COMP-3 S9(13)V99',  nullable: false },
    { name: 'SELL_AMT',   type: 'COMP-3 S9(13)V99',  nullable: false },
    { name: 'TRADER_ID',  type: 'CHAR(8)',           nullable: false },
    { name: 'CPTY_CD',    type: 'CHAR(10)',          nullable: false },
    { name: 'STATUS_FLG', type: 'CHAR(1)',           nullable: false },
  ],

  /* p5 - 카드승인 */
  'CARD.CARD_MASTER': [
    { name: 'CARD_ID',    type: 'CHAR(20)',             nullable: false, pk: true },
    { name: 'ACCT_NO',    type: 'CHAR(16)',             nullable: false },
    { name: 'CARD_NO',    type: 'CHAR(19)',             nullable: false },
    { name: 'CARD_TYPE',  type: 'CHAR(2)',              nullable: false },
    { name: 'HOLDER_NM',  type: 'CHAR(40) EBCDIC-KANA', nullable: false },
    { name: 'ISSUE_DT',   type: 'CHAR(8) YYYYMMDD',     nullable: false },
    { name: 'EXPIRE_DT',  type: 'CHAR(8) YYYYMMDD',     nullable: false },
    { name: 'STATUS_FLG', type: 'CHAR(1)',              nullable: false },
    { name: 'LIMIT_AMT',  type: 'COMP-3 S9(11)V99',     nullable: true  },
  ],
  'CARD.AUTH_LOG': [
    { name: 'AUTH_ID',     type: 'CHAR(24)',         nullable: false, pk: true },
    { name: 'CARD_ID',     type: 'CHAR(20)',         nullable: false },
    { name: 'AUTH_TS',     type: 'CHAR(14)',         nullable: false },
    { name: 'AMT',         type: 'COMP-3 S9(13)V99', nullable: false },
    { name: 'MERCHANT_ID', type: 'CHAR(15)',         nullable: false },
    { name: 'AUTH_CODE',   type: 'CHAR(6)',          nullable: false },
    { name: 'RESP_CODE',   type: 'CHAR(2)',          nullable: false },
  ],
  'CARD.MERCHANT': [
    { name: 'MERCHANT_ID', type: 'CHAR(15)',             nullable: false, pk: true },
    { name: 'MERCHANT_NM', type: 'CHAR(40) EBCDIC-KANA', nullable: false },
    { name: 'MCC',         type: 'CHAR(4)',              nullable: false },
    { name: 'COUNTRY_CD',  type: 'CHAR(2)',              nullable: false },
    { name: 'STATUS_FLG',  type: 'CHAR(1)',              nullable: false },
  ],

  /* p6 - 총계정원장 */
  'GL.GL_ACCOUNT': [
    { name: 'ACCT_CD',   type: 'VARCHAR(10)', nullable: false, pk: true },
    { name: 'ACCT_NM',   type: 'VARCHAR(60)', nullable: false },
    { name: 'ACCT_TYPE', type: 'VARCHAR(2)',  nullable: false },
    { name: 'PARENT_CD', type: 'VARCHAR(10)', nullable: true  },
    { name: 'STATUS',    type: 'VARCHAR(2)',  nullable: false },
  ],
  'GL.GL_JOURNAL': [
    { name: 'JOURNAL_ID', type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'POSTING_DT', type: 'DATE',         nullable: false },
    { name: 'ACCT_CD',    type: 'VARCHAR(10)',  nullable: false },
    { name: 'AMT',        type: 'NUMBER(15,2)', nullable: false },
    { name: 'DR_CR',      type: 'CHAR(1)',      nullable: false },
    { name: 'DESCR',      type: 'VARCHAR(120)', nullable: true  },
  ],
  'GL.GL_BALANCE': [
    { name: 'ACCT_CD', type: 'VARCHAR(10)',  nullable: false, pk: true },
    { name: 'BAL_DT',  type: 'DATE',         nullable: false, pk: true },
    { name: 'BAL_AMT', type: 'NUMBER(18,2)', nullable: false },
    { name: 'CCY_CD',  type: 'CHAR(3)',      nullable: false },
  ],

  /* p7 - 무역금융 */
  'TRADE.LC_MASTER': [
    { name: 'LC_NO',       type: 'CHAR(16)',             nullable: false, pk: true },
    { name: 'ISSUE_DT',    type: 'CHAR(8) YYYYMMDD',     nullable: false },
    { name: 'EXPIRE_DT',   type: 'CHAR(8) YYYYMMDD',     nullable: false },
    { name: 'APPLICANT',   type: 'CHAR(40) EBCDIC-KANA', nullable: false },
    { name: 'BENEFICIARY', type: 'CHAR(40) EBCDIC-KANA', nullable: false },
    { name: 'AMT',         type: 'COMP-3 S9(13)V99',     nullable: false },
    { name: 'CCY_CD',      type: 'CHAR(3)',              nullable: false },
    { name: 'STATUS_FLG',  type: 'CHAR(1)',              nullable: false },
  ],
  'TRADE.EXPORT_BILL': [
    { name: 'BILL_NO',    type: 'CHAR(16)',         nullable: false, pk: true },
    { name: 'LC_NO',      type: 'CHAR(16)',         nullable: true  },
    { name: 'ISSUE_DT',   type: 'CHAR(8) YYYYMMDD', nullable: false },
    { name: 'AMT',        type: 'COMP-3 S9(13)V99', nullable: false },
    { name: 'CCY_CD',     type: 'CHAR(3)',          nullable: false },
    { name: 'STATUS_FLG', type: 'CHAR(1)',          nullable: false },
  ],

  /* p9 - 인터넷뱅킹 */
  'IB.IB_USER': [
    { name: 'USER_ID',       type: 'VARCHAR(20)', nullable: false, pk: true },
    { name: 'CUST_NO',       type: 'VARCHAR(10)', nullable: false },
    { name: 'LOGIN_ID',      type: 'VARCHAR(30)', nullable: false },
    { name: 'EMAIL',         type: 'VARCHAR(80)', nullable: true  },
    { name: 'TEL_NO',        type: 'VARCHAR(15)', nullable: true  },
    { name: 'STATUS',        type: 'VARCHAR(2)',  nullable: false },
    { name: 'LAST_LOGIN_TS', type: 'TIMESTAMP',   nullable: true  },
  ],
  'IB.IB_SESSION': [
    { name: 'SESSION_ID', type: 'VARCHAR(40)', nullable: false, pk: true },
    { name: 'USER_ID',    type: 'VARCHAR(20)', nullable: false },
    { name: 'TOKEN_HASH', type: 'VARCHAR(64)', nullable: false },
    { name: 'ISSUED_TS',  type: 'TIMESTAMP',   nullable: false },
    { name: 'EXPIRE_TS',  type: 'TIMESTAMP',   nullable: false },
    { name: 'IP_ADDR',    type: 'VARCHAR(45)', nullable: true  },
  ],
  'IB.IB_TRANSFER': [
    { name: 'TRANSFER_ID', type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'FROM_ACCT',   type: 'VARCHAR(20)',  nullable: false },
    { name: 'TO_ACCT',     type: 'VARCHAR(20)',  nullable: false },
    { name: 'AMT',         type: 'NUMBER(13,2)', nullable: false },
    { name: 'CCY_CD',      type: 'CHAR(3)',      nullable: false },
    { name: 'TRANSFER_TS', type: 'TIMESTAMP',    nullable: false },
    { name: 'STATUS',      type: 'VARCHAR(2)',   nullable: false },
  ],
  'IB.IB_AUDIT': [
    { name: 'AUDIT_ID',   type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'USER_ID',    type: 'VARCHAR(20)',  nullable: true  },
    { name: 'EVENT_TYPE', type: 'VARCHAR(20)',  nullable: false },
    { name: 'EVENT_TS',   type: 'TIMESTAMP',    nullable: false },
    { name: 'IP_ADDR',    type: 'VARCHAR(45)',  nullable: true  },
    { name: 'DETAIL',     type: 'VARCHAR(500)', nullable: true  },
  ],

  /* p10 - 신용평가 */
  'CREDIT.CREDIT_APPLICATION': [
    { name: 'APP_ID',      type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'CUST_NO',     type: 'VARCHAR(10)',  nullable: false },
    { name: 'PROD_CD',     type: 'VARCHAR(8)',   nullable: false },
    { name: 'REQ_AMT',     type: 'NUMBER(15,2)', nullable: false },
    { name: 'REQ_DT',      type: 'DATE',         nullable: false },
    { name: 'PURPOSE_CD',  type: 'VARCHAR(4)',   nullable: false },
    { name: 'STATUS',      type: 'VARCHAR(2)',   nullable: false },
  ],
  'CREDIT.CREDIT_SCORE': [
    { name: 'SCORE_ID',  type: 'VARCHAR(24)', nullable: false, pk: true },
    { name: 'CUST_NO',   type: 'VARCHAR(10)', nullable: false },
    { name: 'SCORE',     type: 'NUMBER(5,1)', nullable: false },
    { name: 'GRADE',     type: 'CHAR(2)',     nullable: false },
    { name: 'MODEL_VER', type: 'VARCHAR(8)',  nullable: false },
    { name: 'CALC_DT',   type: 'DATE',        nullable: false },
  ],
  'CREDIT.CREDIT_HISTORY': [
    { name: 'HIST_ID',    type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'CUST_NO',    type: 'VARCHAR(10)',  nullable: false },
    { name: 'EVENT_TYPE', type: 'VARCHAR(4)',   nullable: false },
    { name: 'EVENT_DT',   type: 'DATE',         nullable: false },
    { name: 'AMT',        type: 'NUMBER(15,2)', nullable: true  },
    { name: 'INST_CD',    type: 'VARCHAR(6)',   nullable: false },
    { name: 'NOTE',       type: 'VARCHAR(200)', nullable: true  },
  ],
  'CREDIT.CREDIT_DECISION': [
    { name: 'DEC_ID',       type: 'VARCHAR(24)',  nullable: false, pk: true },
    { name: 'APP_ID',       type: 'VARCHAR(24)',  nullable: false },
    { name: 'DECISION',     type: 'CHAR(1)',      nullable: false },
    { name: 'APPROVED_AMT', type: 'NUMBER(15,2)', nullable: true  },
    { name: 'REVIEWER',     type: 'VARCHAR(8)',   nullable: false },
    { name: 'DEC_DT',       type: 'DATE',         nullable: false },
    { name: 'REASON_CD',    type: 'VARCHAR(4)',   nullable: true  },
  ],
};

/* Derive the AS-IS column list for a given SCHEMA_DIFF entry, reacting to the
   current sources (which the Table binding editor can mutate). */
const effectiveAsisCols = (sd) => {
  if (!sd) return [];
  const sources = sd.sources || [];
  const cols = [];
  const seen = new Map(); // column name → idx in cols (for UNION merge)
  const isUnion = sources[0]?.role === 'union';

  sources.forEach(s => {
    const tableCols = ASIS_COLUMN_SCHEMA[s.table] || [];
    tableCols.forEach(c => {
      if (isUnion) {
        if (seen.has(c.name)) {
          const existing = cols[seen.get(c.name)];
          existing.source = [existing.source, s.alias].filter(Boolean).join('+');
        } else {
          seen.set(c.name, cols.length);
          cols.push({ ...c, source: s.alias });
        }
      } else {
        cols.push({ ...c, source: s.alias });
      }
    });
  });
  return cols;
};

const buildAsisInventory = () => {
  /* Routing info overlaid from bindings — never removes tables from the list. */
  const routingMap = new Map();
  SCHEMA_DIFF.forEach(sd => {
    (sd.sources || []).forEach(s => {
      const list = routingMap.get(s.table) || [];
      list.push({ tobe: sd.tobe, via: sd.table, role: s.role });
      routingMap.set(s.table, list);
    });
  });
  return ASIS_SCHEMA_TABLES.map(t => {
    const routing = routingMap.get(t.name) || [];
    return {
      ...t,
      tableShort: t.name.split('.').pop(),
      routing,
      unrouted: routing.length === 0,
    };
  });
};

const buildTobeInventory = () => {
  return TOBE_SCHEMA_TABLES.map(t => {
    const sd = SCHEMA_DIFF.find(s => s.tobe === t.name);
    const sources = sd?.sources || [];
    const kind = sources.length > 1
      ? (sources[0].role === 'union' ? 'union' : 'join')
      : sources.length === 1 ? 'single' : 'none';
    return {
      ...t,
      tableShort: t.name.split('.').pop(),
      sources,
      compositionKind: kind,
      internalName: sd?.table,
      unrouted: sources.length === 0,
    };
  });
};

const getAsisInventory = () => buildAsisInventory();
const getTobeInventory = () => buildTobeInventory();

/* ─── Source Discovery / Profiling (mock) ──────────────────────────
   Real tool would derive these from an AS-IS DB connection (SELECT ...
   LIMIT 10 for samples, ANALYZE / information_schema queries for stats).
   Here we generate deterministic pseudo-values keyed off column name+type
   so the demo is stable across reloads. */

/* Seeded PRNG — consistent values for the same input. */
const seedRng = (key) => {
  let s = 0;
  for (const c of key) s = ((s * 31) + c.charCodeAt(0)) | 0;
  return (k = 0) => {
    s = (s * 9301 + (k + 1) * 49297 + 7919) | 0;
    return ((s >>> 0) % 1000000) / 1000000;
  };
};

/* Plausible mock column profile — null %, distinct cardinality, sample
   min/max, top values for low-cardinality fields. */
const mockColumnProfile = (col, tableName, totalRows) => {
  const rng = seedRng(tableName + '::' + col.name);
  const nullPct = col.nullable === false ? 0 : Math.round(rng(1) * 200) / 10;
  const low = col.type.includes('CHAR(1)') || col.type === 'CHAR(2)' || col.type.includes('CHAR(3)') || col.type === 'BOOLEAN';
  const distinct = col.pk
    ? totalRows
    : low
      ? 2 + Math.floor(rng(2) * 8)
      : Math.max(1, Math.floor(totalRows * (0.05 + rng(2) * 0.9)));
  const isNumeric = /COMP-3|NUMERIC|INTEGER|SMALLINT|BIGINT|DECIMAL/.test(col.type);
  const isDate = /DATE|YYYYMMDD/.test(col.type);
  const isTimestamp = /TIMESTAMP|CHAR\(14\)|HHMMSS/.test(col.type);
  let min = null, max = null;
  if (isNumeric) {
    min = Math.floor(rng(3) * 100).toString();
    max = (10_000 + Math.floor(rng(4) * 999_999)).toLocaleString();
  } else if (isDate) {
    const y1 = 2015 + Math.floor(rng(3) * 6);
    const y2 = y1 + Math.floor(rng(4) * 6) + 1;
    min = `${y1}-01-08`;
    max = `${y2}-12-22`;
  } else if (isTimestamp) {
    min = '2019-04-10 07:12:04';
    max = '2026-04-21 09:40:55';
  } else {
    /* VARCHAR / CHAR — show example length range */
    const m = col.type.match(/\((\d+)/);
    const maxLen = m ? +m[1] : 20;
    min = `${Math.max(1, Math.floor(rng(3) * maxLen / 2))}`;
    max = `${maxLen}`;
  }
  /* Low-cardinality → top-values distribution */
  let topValues = null;
  if (low && distinct <= 10) {
    const labels = col.name.includes('STATUS') ? ['A','C','D','P','X'].slice(0, distinct)
      : col.name.includes('DR_CR') ? ['D','C'].slice(0, distinct)
      : col.name.includes('FLG') || col.name.includes('FLAG') ? ['Y','N'].slice(0, distinct)
      : col.name.includes('GENDER') ? ['M','F','U'].slice(0, distinct)
      : Array.from({length: distinct}, (_, i) => String.fromCharCode(65 + i));
    let remaining = 100;
    topValues = labels.map((l, i) => {
      const share = i === labels.length - 1 ? remaining : Math.max(1, Math.round((remaining * (0.5 + rng(10 + i) * 0.3))));
      remaining -= share;
      return { value: l, pct: share };
    }).sort((a, b) => b.pct - a.pct);
  }
  return {
    nullPct,
    distinct,
    min, max,
    topValues,
    rangeKind: isNumeric ? 'numeric' : isDate ? 'date' : isTimestamp ? 'timestamp' : 'string',
  };
};

/* Plausible 10-row sample for an AS-IS table — uses actual column schemas
   from ASIS_COLUMN_SCHEMA to generate type-appropriate mock values. Values
   mimic EBCDIC/COMP-3/YYYYMMDD originals where the type indicates so. */
const mockTableSamples = (tableName, count = 10) => {
  const cols = ASIS_COLUMN_SCHEMA[tableName] || [];
  if (cols.length === 0) return [];
  const rng = seedRng('sample::' + tableName);
  const rows = [];
  for (let r = 0; r < count; r++) {
    const row = {};
    cols.forEach((c, ci) => {
      const k = r * 100 + ci;
      const bankKey = c.name;
      const bank = (SAMPLE_SOURCE_ROWS || {})[bankKey];
      if (bank && bank[r]) { row[c.name] = bank[r]; return; }
      /* Synthesize by type */
      if (c.type.includes('YYYYMMDD')) {
        const y = 2021 + Math.floor(rng(k) * 5);
        const m = String(1 + Math.floor(rng(k + 1) * 12)).padStart(2, '0');
        const d = String(1 + Math.floor(rng(k + 2) * 28)).padStart(2, '0');
        row[c.name] = `${y}${m}${d}`;
      } else if (c.type.includes('HHMMSS')) {
        row[c.name] = `${String(Math.floor(rng(k) * 24)).padStart(2, '0')}${String(Math.floor(rng(k+1) * 60)).padStart(2, '0')}${String(Math.floor(rng(k+2) * 60)).padStart(2, '0')}`;
      } else if (c.type.includes('CHAR(14)')) {
        row[c.name] = r === 3 ? '00000000000000' : `2026${String(Math.floor(rng(k) * 12) + 1).padStart(2, '0')}${String(Math.floor(rng(k+1) * 28) + 1).padStart(2, '0')}${String(Math.floor(rng(k+2) * 24)).padStart(2, '0')}${String(Math.floor(rng(k+3) * 60)).padStart(2, '0')}${String(Math.floor(rng(k+4) * 60)).padStart(2, '0')}`;
      } else if (c.type.includes('COMP-3')) {
        row[c.name] = `+${String(Math.floor(rng(k) * 999999999)).padStart(11, '0')}{`;
      } else if (c.type.includes('EBCDIC-KANA') || c.type.includes('EBCDIC-KANJI')) {
        row[c.name] = ['ﾀﾞｲｲﾁ', 'ｽｽﾞｷ', 'ﾔﾏﾀﾞ', 'ｶﾄｳ', 'ﾖｼﾀﾞ', 'ｲﾄｳ', 'ﾏﾂﾓﾄ', 'ｺﾊﾞﾔｼ', 'ﾀｶﾊｼ', 'ﾀﾅｶ'][r % 10];
      } else if (c.name.includes('STATUS')) {
        row[c.name] = ['A','A','C','A','D','A','A','A','C','A'][r % 10];
      } else if (c.pk && c.type.startsWith('CHAR')) {
        const m = c.type.match(/\((\d+)/);
        const len = m ? +m[1] : 10;
        row[c.name] = (tableName.split('.').pop().slice(0, 2) + String(r + 1).padStart(Math.max(1, len - 2), '0')).slice(0, len);
      } else if (c.type.startsWith('CHAR(')) {
        const m = c.type.match(/\((\d+)/);
        const len = m ? +m[1] : 4;
        row[c.name] = (['TYP','CAT','GRP','BRX','REF'][r % 5]).slice(0, len);
      } else {
        row[c.name] = '—';
      }
    });
    rows.push(row);
  }
  return rows;
};

/* ─── Pre-flight checks ───────────────────────────────────────────
   Evaluate every gating condition that must be satisfied before a run can
   be launched. Real tool would run each rule against a connected DB; here
   we derive them from in-memory project state, SCHEMA_DIFF and the
   inventories. Three severities: pass / warn / fail — any fail blocks Run. */

const getPreflightChecks = (project) => {
  const checks = [];
  const conn = project?.connections || {};
  const ddl = project?.ddl || {};

  /* ── CSV → staging 검증 (AS-IS 측) ──
     이전의 JDBC AS-IS 접속 점검을 대체. 운영팀 야간 추출 → CSV 도착 → DuckDB
     staging 적재 → ASIS DDL 과 컬럼 일치 검증의 4단계. */
  const csv = project?.csvSource;
  const staging = project?.staging;

  /* csv-arrived: 추출 파일 도착 여부. parseStatus === 'untested' 면 fail (미도착). */
  checks.push({
    id: 'csv-arrived', title: 'AS-IS 추출 데이터 도착',
    status: !csv ? 'fail' : csv.parseStatus === 'untested' ? 'fail' : 'pass',
    detail: !csv ? '추출 파일 미설정 — 운영팀 야간 추출 파일 등록 필요'
      : csv.parseStatus === 'untested' ? `파일 미도착 — ${csv.filename || '예정 파일'} 미수신`
      : `${csv.filename} · 도착 ${csv.arrivedAt || '—'}`,
    fix: { tab: 'settings', section: 'source' },
  });

  /* csv-parsed: parseStatus === 'ok' 면 pass, 그 외 fail. */
  checks.push({
    id: 'csv-parsed', title: 'AS-IS 추출 데이터 파싱',
    status: csv?.parseStatus === 'ok' ? 'pass' : 'fail',
    detail: !csv ? '추출 파일 미설정'
      : csv.parseStatus === 'ok' ? `${(csv.recordCount || 0).toLocaleString()}행 · ${csv.encoding} · ${csv.delimiter === 'FB' ? `고정폭 ${csv.recordLength}b` : `구분자 ${csv.delimiter}`}`
      : csv.parseStatus === 'failed' ? `파싱 실패 — ${csv.parseError || '원인 미상'}`
      : csv.parseStatus === 'pending' ? '파일 도착 — 파싱 미실행'
      : '파일 미도착 — 파싱 불가',
    fix: { tab: 'settings', section: 'source' },
  });

  /* staging-loaded: staging.loaded === true 면 pass. */
  checks.push({
    id: 'staging-loaded', title: 'AS-IS DB 적재',
    status: staging?.loaded === true ? 'pass' : 'fail',
    detail: !staging ? 'AS-IS DB 미설정'
      : staging.loaded ? `${staging.tables}개 테이블 · ${staging.store} · 적재 완료 ${staging.loadedAt}`
      : '추출 데이터 → AS-IS DB 적재 미실행',
    fix: { tab: 'settings', section: 'source' },
  });

  /* asis-db-ready: AS-IS DB 파일을 *현재* 읽을 수 있는 상태인지.
     도구 내장이라도 파일 손상·디스크 풀·잠금·권한 등으로 실패 가능. */
  checks.push({
    id: 'asis-db-ready', title: 'AS-IS DB 접근 가능',
    status: !staging ? 'fail'
      : staging.dbReady === 'ok' ? 'pass'
      : staging.dbReady === 'failed' ? 'fail'
      : 'fail',  // pending = 아직 적재 안 됨
    detail: !staging ? 'AS-IS DB 미설정 — 접근 불가'
      : staging.dbReady === 'ok' ? `DB 파일 열기 OK · ${staging.tables}개 테이블 카탈로그 조회 OK`
      : staging.dbReady === 'failed' ? (staging.dbReadyDetail || 'DB 파일 접근 실패 — 손상·잠금·권한 확인 필요')
      : '적재 미완료 — 접근 가능 검증 보류',
    fix: { tab: 'settings', section: 'source' },
  });

  /* schema-match: AS-IS DDL 과 AS-IS DB 적재 결과의 컬럼·길이 일치 검증. */
  checks.push({
    id: 'schema-match', title: 'AS-IS DDL 과 AS-IS DB 스키마 일치',
    status: !staging ? 'fail'
      : staging.schemaMatch === 'ok' ? 'pass'
      : staging.schemaMatch === 'mismatch' ? 'fail'
      : 'warn',
    detail: !staging ? 'AS-IS DB 미설정 — 비교 불가'
      : staging.schemaMatch === 'ok' ? 'AS-IS DDL 과 적재된 AS-IS DB 의 컬럼·길이가 일치'
      : staging.schemaMatch === 'mismatch' ? (staging.schemaMismatchDetail || '컬럼 또는 길이 불일치')
      : '적재 미완료 또는 비교 미수행',
    fix: { tab: 'settings', section: 'source' },
  });

  const mkConnCheck = (side, label) => {
    const c = conn[side];
    const s = c?.status;
    const status = s === 'ok' ? 'pass' : s === 'stale' ? 'warn' : 'fail';
    const detail = s === 'ok' ? `latency ${c.latencyMs}ms · detected ${c.detectedTables ?? '—'} tables`
      : s === 'stale' ? `last tested ${c.lastTestedAt} — re-test recommended`
      : s === 'failed' ? (c.error || 'Connection failed')
      : s === 'testing' ? 'currently testing…'
      : 'Not tested yet';
    return { id: `conn-${side}`, title: `${label} 접속 확인`, status, detail, fix: { tab: 'settings', section: side === 'asis' ? 'source' : 'target' } };
  };

  const mkDdlCheck = (side, label) => ({
    id: `ddl-${side}`, title: `${label} DDL import`,
    status: ddl[side] ? 'pass' : 'fail',
    detail: ddl[side] ? `${ddl[side].tables} tables · ${ddl[side].columns} columns (${ddl[side].filename})` : 'DDL not imported',
    fix: { tab: 'settings', section: side === 'asis' ? 'source' : 'target' },
  });
  checks.push(mkDdlCheck('asis', 'AS-IS'));
  checks.push(mkDdlCheck('tobe', 'TO-BE'));
  checks.push(mkConnCheck('tobe', 'TO-BE'));

  /* Mapping coverage — only evaluable when both DDLs are present */
  const bothDdl = ddl.asis && ddl.tobe;
  const tobeInv = bothDdl ? (getTobeInventory() || []) : [];
  const asisInv = bothDdl ? (getAsisInventory() || []) : [];

  const unroutedTobe = tobeInv.filter(t => t.unrouted);
  checks.push({
    id: 'tobe-bindings', title: '모든 TO-BE 테이블 소스 바인딩',
    status: !bothDdl ? 'skip' : unroutedTobe.length === 0 ? 'pass' : unroutedTobe.length <= 2 ? 'warn' : 'fail',
    detail: !bothDdl ? 'DDL 두 쪽 모두 import 후 검증됩니다'
      : unroutedTobe.length === 0 ? `${tobeInv.length} tables all routed`
      : `${unroutedTobe.length} unrouted: ${unroutedTobe.slice(0, 4).map(t => t.tableShort).join(', ')}${unroutedTobe.length > 4 ? ' …' : ''}`,
    fix: { tab: 'mapping',
      target: unroutedTobe[0] ? { side: 'tobe', tobeName: unroutedTobe[0].name, internalName: unroutedTobe[0].internalName } : null },
  });

  const unroutedAsis = asisInv.filter(t => t.unrouted);
  checks.push({
    id: 'asis-orphans', title: '미사용 AS-IS 테이블 확인',
    status: !bothDdl ? 'skip' : unroutedAsis.length === 0 ? 'pass' : 'warn',
    detail: !bothDdl ? 'DDL 두 쪽 모두 import 후 검증됩니다'
      : unroutedAsis.length === 0 ? '모든 AS-IS 테이블이 라우팅됨'
      : `${unroutedAsis.length}개 테이블이 어디에도 라우팅 안 됨 (의도적 제외라면 무시): ${unroutedAsis.map(t => t.tableShort).join(', ')}`,
    fix: { tab: 'mapping' },
  });

  /* NOT-NULL added columns with NULL defaults — DDL flaw, must fix in target DDL */
  const violations = [];
  (SCHEMA_DIFF || []).forEach(sd => {
    sd.tobeCols.forEach(tc => {
      if (tc.added && tc.nullable === false && (!tc.default || tc.default === 'NULL')) {
        violations.push({ internalName: sd.table, tobe: sd.tobe, colName: tc.name });
      }
    });
  });
  checks.push({
    id: 'added-not-null', title: 'NOT NULL 신규 컬럼 default 지정',
    status: violations.length === 0 ? 'pass' : 'fail',
    detail: violations.length === 0
      ? 'all new NOT NULL columns have non-NULL defaults'
      : `${violations.length} 컬럼이 NOT NULL 인데 default 없음 — TO-BE DDL 의 DEFAULT 절 추가 필요: ${violations.slice(0, 3).map(v => `${v.tobe}.${v.colName}`).join(', ')}${violations.length > 3 ? ' …' : ''}`,
    fix: { tab: 'settings', section: 'target' },
  });

  /* Unmapped TO-BE columns — must be assigned a source (or explicitly added) before run */
  const unmapped = [];
  let firstUnmapped = null;
  if (bothDdl) {
    (SCHEMA_DIFF || []).forEach(sd => {
      const rows = mappingsFromSchemaDiff(sd) || [];
      rows.forEach(r => {
        if (r.rule === 'unmapped') {
          unmapped.push(`${sd.tobe}.${r.tgt}`);
          if (!firstUnmapped) firstUnmapped = { side: 'tobe', tobeName: sd.tobe, internalName: sd.table, colName: r.tgt };
        }
      });
    });
  }
  checks.push({
    id: 'unmapped-cols', title: '모든 TO-BE 컬럼 매핑 지정',
    status: !bothDdl ? 'skip' : unmapped.length === 0 ? 'pass' : 'fail',
    detail: !bothDdl ? 'DDL 두 쪽 모두 import 후 검증됩니다'
      : unmapped.length === 0 ? 'all TO-BE columns have a source assigned'
      : `${unmapped.length} unmapped: ${unmapped.slice(0, 3).join(', ')}${unmapped.length > 3 ? ' …' : ''}`,
    fix: { tab: 'mapping', target: firstUnmapped },
  });

  /* PK presence는 DDL 정의이지 사용자 매핑 작업 영역이 아니므로 preflight 에서 제외.
     DDL import 시점에 별도로 검증되어야 함. */

  /* Approved snapshot — runs must be executed off an approved version. */
  const snaps = (MAPPING_SNAPSHOTS_BY_PROJECT || {})[project?.id] || [];
  const approved = [...snaps].reverse().find(s => s.status === 'approved');
  const pending  = snaps.filter(s => s.status === 'pending').length;
  checks.push({
    id: 'approved-snapshot', title: '승인된 매핑 스냅샷',
    status: approved ? 'pass' : snaps.length > 0 ? 'warn' : 'fail',
    detail: approved ? `v${approved.version} approved by ${approved.approvedBy}${pending ? ` · ${pending} pending review` : ''}`
      : snaps.length > 0 ? `${snaps.length} snapshot(s) but none approved yet — ${pending} pending`
      : 'No snapshot created — create and get approval before running',
    fix: { tab: 'versions' },
  });

  return checks;
};

/* ─── Quarantine mock entries ─────────────────────────────────────
   Rows that the pipeline rejected, grouped by reason. Real tool would read
   from a quarantine table/queue populated during run. */

const QUARANTINE_ENTRIES_P1 = [
  {
    id: 'q-001', stage: 'validate.fk', severity: 'error',
    reason: 'FK violation — child key not found in parent',
    detail: 'GL_ENTRY.acct_no → ACCT_MASTER.account_no',
    table: 'GL_ENTRY', count: 4, firstSeenAt: '09:41:06.998',
    sampleRows: [
      { TXN_ID: 'T20240315001', ACCT_NO: 'AC00881104', AMT: 1250.00 },
      { TXN_ID: 'T20240315002', ACCT_NO: 'AC00881105', AMT: 88200.00 },
      { TXN_ID: 'T20240315003', ACCT_NO: 'AC00881106', AMT: 450.00 },
      { TXN_ID: 'T20240315004', ACCT_NO: 'AC00881107', AMT: 12540.50 },
    ],
  },
  {
    id: 'q-002', stage: 'encode', severity: 'error',
    reason: 'invalid EBCDIC byte — codepoint not in IBM-939',
    detail: 'KYC_DOCUMENT · offset 0x1A08B2C · byte 0x3F',
    table: 'KYC_DOCUMENT', count: 1, firstSeenAt: '09:41:05.441',
    sampleRows: [
      { DOC_ID: 'KYC2025034481', CUST_ID: 'C00211334', NAME_KANJI: '<invalid>' },
    ],
  },
  {
    id: 'q-003', stage: 'loader.copy', severity: 'error',
    reason: 'Duplicate primary key — ACCT_MASTER.account_no',
    detail: 'Uniqueness violation on target insert',
    table: 'ACCT_MASTER', count: 3, firstSeenAt: '09:41:02.551',
    sampleRows: [
      { ACCT_NO: 'AC10023441', CUST_ID: 'C000124551', BAL_AMT: 1820000 },
      { ACCT_NO: 'AC10023442', CUST_ID: 'C000124551', BAL_AMT: 0 },
      { ACCT_NO: 'AC10023443', CUST_ID: 'C000124562', BAL_AMT: 88200 },
    ],
  },
  {
    id: 'q-004', stage: 'transform', severity: 'warning',
    reason: 'COMP-3 sign nibble unexpected (0xF) — coerced to positive',
    detail: 'col=BAL_AMT · 23 rows auto-corrected · no data loss',
    table: 'TXN_JOURNAL_2024', count: 23, firstSeenAt: '09:41:06.114',
    sampleRows: [
      { TXN_ID: 'T20240318991', BAL_AMT: 218800 },
      { TXN_ID: 'T20240318992', BAL_AMT: 54200 },
    ],
  },
  {
    id: 'q-005', stage: 'transform', severity: 'warning',
    reason: 'Kanji codepoint outside JIS X 0208 → replaced with U+FFFD',
    detail: 'account_name · rare-use kanji in legacy records',
    table: 'ACCT_MASTER', count: 2, firstSeenAt: '09:41:04.331',
    sampleRows: [
      { ACCT_NO: 'AC00455112', ACCT_NAME_KANJI: '�田花子' },
      { ACCT_NO: 'AC00622045', ACCT_NAME_KANJI: '吉�太郎' },
    ],
  },
  {
    id: 'q-006', stage: 'validate.pk', severity: 'warning',
    reason: 'PK duplicate soft-dedupe applied',
    detail: 'CUST_CONTACT · 3 rows merged by latest UPD_TS',
    table: 'CUST_CONTACT', count: 3, firstSeenAt: '09:41:01.881',
    sampleRows: [
      { CUST_ID: 'C000100234', TEL_NO: '0312345678', UPD_TS: '20260412103021' },
    ],
  },
];

const QUARANTINE_ENTRIES_P2 = [
  {
    id: 'q-p2-001', stage: 'transform', severity: 'warning',
    reason: 'branch_code 길이 불일치 — left-pad 적용',
    detail: 'BR_CD CHAR(4) → CHAR(6) · 2,118 rows auto-padded',
    table: 'DEPOSIT_ACCOUNT', count: 2118, firstSeenAt: '02:48:07.331',
    sampleRows: [
      { ACCT_NO: 'D0008811041', BR_CD: '0204', _padded: '000204' },
      { ACCT_NO: 'D0008811042', BR_CD: '0455', _padded: '000455' },
    ],
  },
];

const QUARANTINE_ENTRIES_P3 = [];
const QUARANTINE_ENTRIES_P4 = [];

const QUARANTINE_ENTRIES_P5 = [
  {
    id: 'q-p5-001', stage: 'validate.fk', severity: 'warning',
    reason: 'MERCHANT_ID 미등록 — 빈 머천트로 fallback',
    detail: 'CARD_AUTH_LOG · 12 rows referenced unknown MERCHANT_ID',
    table: 'CARD_AUTH_LOG', count: 12, firstSeenAt: '02:11:34.331',
    sampleRows: [
      { AUTH_ID: 'A000001045', MERCHANT_ID: 'M9999999000123' },
      { AUTH_ID: 'A000001046', MERCHANT_ID: 'M9999999000124' },
    ],
  },
];

const QUARANTINE_ENTRIES_P6 = [
  {
    id: 'q-p6-001', stage: 'validate.constraint', severity: 'warning',
    reason: 'GL_BALANCE 합계 불일치 — 수동 조정 필요',
    detail: '특정 부서 잔액이 GL_JOURNAL 합계와 ±0.01 차이',
    table: 'GL_BALANCE', count: 4, firstSeenAt: '18:42:08.512',
    sampleRows: [
      { ACCT_CD: '1101010001', BAL_DT: '2026-02-28', BAL_AMT: 4_881_204_551.23 },
    ],
  },
];

const QUARANTINE_ENTRIES_P7 = [];

const QUARANTINE_ENTRIES_P8 = [];

const QUARANTINE_ENTRIES_P9 = [
  {
    id: 'q-p9-001', stage: 'transform', severity: 'info',
    reason: 'TIMESTAMP → TIMESTAMPTZ 변환 — Asia/Seoul 가정',
    detail: 'IB_USER.LAST_LOGIN_TS · 4,212,881 rows · 시간대 명시 없음 → KST 추론',
    table: 'IB_USER', count: 4212881, firstSeenAt: '22:42:24.994',
    sampleRows: [
      { USER_ID: 'U00088110', LAST_LOGIN_TS: '2026-05-08 14:22:18' },
    ],
  },
  {
    id: 'q-p9-002', stage: 'validate.fk', severity: 'warning',
    reason: '세션 USER_ID 미존재 — 만료된 사용자 제외',
    detail: 'IB_SESSION.USER_ID → IB_USER.user_id · 442 rows orphaned',
    table: 'IB_SESSION', count: 442, firstSeenAt: '22:42:31.221',
    sampleRows: [
      { SESSION_ID: 'sess-2026-0508-aabbcc', USER_ID: 'U_DELETED_001' },
    ],
  },
];

const QUARANTINE_ENTRIES_P10 = [
  {
    id: 'q-p10-001', stage: 'transform', severity: 'info',
    reason: 'event_type 매핑 — 1글자 코드 → 라벨 변환',
    detail: 'CREDIT_HISTORY.EVENT_TYPE · 4-char → 12-char 라벨, lookup 적용',
    table: 'CREDIT_HISTORY', count: 18, firstSeenAt: '10:29:12.118',
    sampleRows: [
      { HIST_ID: 'H000001045', EVENT_TYPE: 'DLNQ', _mapped: 'DELINQUENT' },
    ],
  },
];

const QUARANTINE_BY_PROJECT = {
  p1: QUARANTINE_ENTRIES_P1, p2: QUARANTINE_ENTRIES_P2, p3: QUARANTINE_ENTRIES_P3,
  p4: QUARANTINE_ENTRIES_P4, p5: QUARANTINE_ENTRIES_P5, p6: QUARANTINE_ENTRIES_P6,
  p7: QUARANTINE_ENTRIES_P7, p8: QUARANTINE_ENTRIES_P8, p9: QUARANTINE_ENTRIES_P9,
  p10: QUARANTINE_ENTRIES_P10,
};
const getQuarantine = (projectId) => QUARANTINE_BY_PROJECT[projectId] || [];

/* Active QUARANTINE_ENTRIES — re-bound by setActiveDataProject. */
let QUARANTINE_ENTRIES = QUARANTINE_ENTRIES_P1;

/* ─── Mapping snapshots / versions ───────────────────────────────
   Real tool stores each snapshot's full mapping state. Mock per project. */

const MAPPING_SNAPSHOTS_BY_PROJECT = {
  p1: [
    { id: 'p1-v1.0', version: '1.0', createdAt: '2026-04-02 10:30', author: 'Admin',
      notes: 'Initial mapping spec from DDL parse', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-03 14:20',
      changes: [], /* initial — no prior version */ },
    { id: 'p1-v1.1', version: '1.1', createdAt: '2026-04-10 16:45', author: 'Admin',
      notes: 'Added tenant_id default, fixed kanji encoding rules', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-11 09:15',
      changes: [
        { kind: 'added',    target: 'public.account.tenant_id', detail: 'default = gen_random_uuid()' },
        { kind: 'modified', target: 'public.account.account_name', detail: 'iconv rule: ebcdic-kana → utf-8 + NFKC normalize' },
        { kind: 'modified', target: 'public.customer.name_kanji', detail: 'Added ensure_cp(JIS X 0208) guard' },
        { kind: 'modified', target: 'public.customer.name_kana', detail: 'Added ensure_cp(JIS X 0208) guard' },
        { kind: 'added',    target: 'public.account.data_classification', detail: 'default = pending_review' },
        { kind: 'modified', target: 'public.transaction_2024.occurred_at', detail: 'Merged TXN_DT + TXN_TM into TIMESTAMP' },
        { kind: 'removed',  target: 'public.account.legacy_officer_code', detail: 'dropped — unused' },
      ] },
    { id: 'p1-v1.2', version: '1.2', createdAt: '2026-04-21 11:20', author: 'Admin',
      notes: 'Split customer into customer + customer_contact, unified transaction tables', status: 'pending',
      reviewer: 'Reviewer',
      changes: [
        { kind: 'added',    target: 'public.transaction_all', detail: 'New UNION target (t23 ∪ t24)' },
        { kind: 'modified', target: 'public.customer bindings', detail: 'cp CUST_PROFILE ⋈ cc CUST_CONTACT (was single-source)' },
        { kind: 'modified', target: 'public.customer.phone_e164', detail: 'source: cp.TEL_NO → cc.TEL_NO' },
        { kind: 'added',    target: 'public.customer.email', detail: 'source: cc.EMAIL_ADDR, confidence 95%' },
        { kind: 'added',    target: 'public.customer.preferred_channel', detail: 'source: cc.PREF_CHANNEL, confidence 80%' },
        { kind: 'added',    target: 'public.customer.marketing_opt_in', detail: 'source: cc.OPT_IN_FLG' },
        { kind: 'modified', target: 'public.transaction_2024.direction', detail: 'source confidence lowered 0.75 → 0.65' },
      ] },
  ],
  p2: [
    { id: 'p2-v1.0', version: '1.0', createdAt: '2026-04-09 13:10', author: 'Admin',
      notes: 'Initial spec for deposit accounts', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-09 17:40',
      changes: [] },
    { id: 'p2-v1.1', version: '1.1', createdAt: '2026-04-15 10:00', author: 'Admin',
      notes: 'Resolved warnings on branch_code length mismatch', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-15 15:25',
      changes: [
        { kind: 'modified', target: 'public.deposit_account.branch_code', detail: 'CHAR(4) → CHAR(6) with left-pad' },
      ] },
  ],
  p3: [
    /* FX Treasury — only draft, never snapshotted */
  ],
  p4: [
    { id: 'p4-v0.9', version: '0.9', createdAt: '2026-04-22 09:00', author: 'Admin',
      notes: 'Draft for review — AS-IS DDL pending', status: 'pending',
      reviewer: 'Admin',
      changes: [] },
  ],
  p5: [
    { id: 'p5-v1.0', version: '1.0', createdAt: '2026-02-25 14:00', author: 'Admin',
      notes: 'Card auth initial', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-02-26 10:15', changes: [] },
    { id: 'p5-v1.1', version: '1.1', createdAt: '2026-03-01 11:30', author: 'Admin',
      notes: 'Pre-cutover final', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-03-01 14:00',
      changes: [{ kind: 'modified', target: 'public.card_auth', detail: 'channel_code lookup updated' }] },
  ],
  p6: [
    { id: 'p6-v1.0', version: '1.0', createdAt: '2026-02-03 09:00', author: 'Admin',
      notes: 'GL consolidation initial', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-02-04 11:20', changes: [] },
  ],
  p7: [
    { id: 'p7-v1.0', version: '1.0', createdAt: '2026-01-20 10:00', author: 'Admin',
      notes: 'Trade finance mapping', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-01-22 13:45', changes: [] },
  ],
  p8: [],
  p9: [
    { id: 'p9-v1.0', version: '1.0', createdAt: '2026-04-13 10:00', author: 'Admin',
      notes: '초기 매핑 스펙 — IB 채널 핵심 5개 도메인', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-15 14:30',
      changes: [] },
    { id: 'p9-v1.1', version: '1.1', createdAt: '2026-04-22 09:30', author: 'Admin',
      notes: '인증·세션 도메인 재매핑, 성능 인덱스 보강', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-23 11:00',
      changes: [
        { kind: 'modified', target: 'public.ib_session.token_hash', detail: 'SHA-256 해시 길이 확장' },
        { kind: 'added',    target: 'public.ib_audit',              detail: '신규 감사 로그 테이블' },
      ] },
    { id: 'p9-v1.2', version: '1.2', createdAt: '2026-05-06 16:00', author: 'Admin',
      notes: '최종 컷오버 직전 — 잔여 경고 0건', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-05-07 09:30',
      changes: [
        { kind: 'modified', target: 'public.ib_user.last_login_at', detail: 'TIMESTAMP → TIMESTAMPTZ' },
        { kind: 'modified', target: 'public.ib_transfer.amount',    detail: 'NUMERIC(13,2) → NUMERIC(15,2) 한도 확장' },
      ] },
  ],
  p10: [
    { id: 'p10-v0.9', version: '0.9', createdAt: '2026-04-27 11:00', author: 'Admin',
      notes: '초안 — 신용평가 핵심 도메인 4개 매핑', status: 'approved',
      approvedBy: 'Reviewer', approvedAt: '2026-04-28 10:30',
      changes: [] },
    { id: 'p10-v1.0', version: '1.0', createdAt: '2026-05-06 14:30', author: 'Admin',
      notes: '리허설 안정화 — CREDIT_DECISION 매핑 검토 중', status: 'pending',
      reviewer: 'Reviewer',
      changes: [
        { kind: 'modified', target: 'public.credit_history.event_type', detail: '4-char 코드 → 12-char 라벨 lookup 추가' },
        { kind: 'added',    target: 'public.credit_score.created_at',   detail: 'audit 컬럼 신규 · default = now()' },
      ] },
  ],
};

/* Audit log — every mutating event, most recent first. */

const AUDIT_LOG_BY_PROJECT = {
  p1: [
    { at: '2026-04-23 15:42', actor: 'Admin', action: 'updated', target: 'public.customer · Table binding', detail: 'Added joinOn: cp.CUST_ID = cc.CUST_ID' },
    { at: '2026-04-23 14:20', actor: 'Admin', action: 'updated', target: 'public.customer · Table binding', detail: 'Changed JOIN type INNER → LEFT' },
    { at: '2026-04-23 11:05', actor: 'Admin', action: 'added',   target: 'public.transaction_all', detail: 'New target table (UNION composition)' },
    { at: '2026-04-22 17:30', actor: 'Admin', action: 'snapshot',target: 'v1.2',   detail: '7 changes since v1.1 · sent to Reviewer' },
    { at: '2026-04-21 11:20', actor: 'Admin', action: 'updated', target: 'public.customer', detail: 'Split from single source to CUST_PROFILE ⋈ CUST_CONTACT' },
    { at: '2026-04-19 09:05', actor: 'Admin', action: 'imported',target: 'TO-BE DDL', detail: 'core-target.sql · 138 tables' },
    { at: '2026-04-18 14:22', actor: 'Admin', action: 'imported',target: 'AS-IS DDL', detail: 'core-legacy.ddl · 142 tables' },
    { at: '2026-04-11 09:15', actor: 'Reviewer', action: 'approved', target: 'v1.1',  detail: 'All good — ready to run' },
    { at: '2026-04-10 16:45', actor: 'Admin', action: 'snapshot',target: 'v1.1',   detail: '7 changes since v1.0 · sent to Reviewer' },
    { at: '2026-04-10 14:10', actor: 'Admin', action: 'added',   target: 'public.account.tenant_id', detail: 'default = gen_random_uuid()' },
    { at: '2026-04-03 14:20', actor: 'Reviewer', action: 'approved', target: 'v1.0',  detail: 'Initial sign-off' },
    { at: '2026-04-02 10:30', actor: 'Admin', action: 'snapshot',target: 'v1.0',   detail: 'Initial mapping spec' },
    { at: '2026-04-02 09:15', actor: 'Admin', action: 'created', target: 'Project', detail: 'Project "Core Ledger" created' },
  ],
  p2: [
    { at: '2026-04-15 15:25', actor: 'Reviewer', action: 'approved', target: 'v1.1', detail: 'branch_code fix verified' },
    { at: '2026-04-15 10:00', actor: 'Admin', action: 'snapshot', target: 'v1.1', detail: '1 change since v1.0' },
    { at: '2026-04-14 16:40', actor: 'Admin', action: 'updated', target: 'public.deposit_account.branch_code', detail: 'CHAR(4) → CHAR(6) with left-pad' },
    { at: '2026-04-10 17:18', actor: 'Admin', action: 'imported', target: 'TO-BE DDL', detail: 'deposit-pg15.sql · 85 tables' },
    { at: '2026-04-10 11:30', actor: 'Admin', action: 'imported', target: 'AS-IS DDL', detail: 'deposit-ora11.sql · 87 tables' },
    { at: '2026-04-09 17:40', actor: 'Reviewer', action: 'approved', target: 'v1.0', detail: 'Sign-off' },
    { at: '2026-04-09 13:10', actor: 'Admin', action: 'snapshot', target: 'v1.0', detail: 'Initial' },
  ],
  p3: [
    { at: '2026-04-23 10:30', actor: 'Admin', action: 'updated', target: 'Project Settings · Source', detail: 'Simulated connection failure' },
    { at: '2026-04-20 10:11', actor: 'Admin', action: 'imported', target: 'AS-IS DDL', detail: 'fx-mainframe.ddl · 34 tables' },
    { at: '2026-04-19 16:00', actor: 'Admin', action: 'created', target: 'Project', detail: 'Project "FX Treasury" created' },
  ],
  p4: [
    { at: '2026-04-22 09:00', actor: 'Admin', action: 'snapshot', target: 'v0.9', detail: 'Draft for early review' },
    { at: '2026-04-21 16:02', actor: 'Admin', action: 'imported', target: 'TO-BE DDL', detail: 'loan-pg-target.sql · 58 tables' },
    { at: '2026-04-20 11:30', actor: 'Admin', action: 'created', target: 'Project', detail: 'Project "Loan Origination" created' },
  ],
  p5: [
    { at: '2026-03-14 20:00', actor: 'ops-bot', action: 'run-complete', target: 'migrate', detail: 'Cutover finished · 28 tables · 812M rows' },
    { at: '2026-03-01 14:00', actor: 'Reviewer', action: 'approved', target: 'v1.1', detail: 'Pre-cutover sign-off' },
    { at: '2026-03-01 11:30', actor: 'Admin', action: 'snapshot', target: 'v1.1', detail: 'Final before cutover' },
    { at: '2026-02-26 10:15', actor: 'Reviewer', action: 'approved', target: 'v1.0', detail: 'Initial' },
  ],
  p6: [
    { at: '2026-02-28 18:00', actor: 'ops-bot', action: 'run-complete', target: 'migrate', detail: '113 tables · cutover done' },
    { at: '2026-02-04 11:20', actor: 'Reviewer', action: 'approved', target: 'v1.0', detail: 'Sign-off' },
  ],
  p7: [
    { at: '2026-02-02 16:30', actor: 'ops-bot', action: 'run-complete', target: 'migrate', detail: '19 tables · cutover done' },
    { at: '2026-01-22 13:45', actor: 'Reviewer', action: 'approved', target: 'v1.0', detail: 'Sign-off' },
  ],
  p8: [
    { at: 'just now', actor: 'Admin', action: 'created', target: 'Project', detail: 'Project "송금허브" created' },
  ],
  p9: [
    { at: '2026-05-08 22:00', actor: 'Reviewer', action: 'run-start', target: 'cut-2026-0508-2200', detail: 'Cutover initiated · v1.2 snapshot' },
    { at: '2026-05-07 09:30', actor: 'Reviewer', action: 'approved',  target: 'v1.2', detail: 'Pre-cutover sign-off · 잔여 경고 0건' },
    { at: '2026-05-06 16:00', actor: 'Admin',    action: 'snapshot',  target: 'v1.2', detail: 'Final pre-cutover snapshot · 2 changes' },
    { at: '2026-04-23 11:00', actor: 'Reviewer', action: 'approved',  target: 'v1.1', detail: 'Sign-off · 인증·세션 보강 확인' },
    { at: '2026-04-22 09:30', actor: 'Admin',    action: 'snapshot',  target: 'v1.1', detail: '2 changes since v1.0' },
    { at: '2026-04-15 14:30', actor: 'Reviewer', action: 'approved',  target: 'v1.0', detail: 'Initial sign-off' },
    { at: '2026-04-13 10:00', actor: 'Admin',    action: 'snapshot',  target: 'v1.0', detail: '초기 매핑 스펙' },
    { at: '2026-04-12 14:15', actor: 'Admin',    action: 'imported',  target: 'TO-BE DDL', detail: 'ib-pg15.sql · 52 tables' },
    { at: '2026-04-12 09:30', actor: 'Admin',    action: 'imported',  target: 'AS-IS DDL', detail: 'ib-db2.sql · 52 tables' },
    { at: '2026-04-10 11:00', actor: 'Admin',    action: 'created',   target: 'Project',   detail: 'Project "인터넷뱅킹" created' },
  ],
  p10: [
    { at: '2026-05-08 10:15', actor: 'Admin',    action: 'run-start', target: 'run-2026-0508-1015', detail: '리허설 수동 실행 · v1.0 pending 스냅샷' },
    { at: '2026-05-06 14:30', actor: 'Admin',    action: 'snapshot',  target: 'v1.0', detail: 'CREDIT_DECISION 매핑 검토 중 · 2 changes since v0.9' },
    { at: '2026-04-28 10:30', actor: 'Reviewer', action: 'approved',  target: 'v0.9', detail: '초안 승인 · 4 도메인 핵심 매핑 OK' },
    { at: '2026-04-27 11:00', actor: 'Admin',    action: 'snapshot',  target: 'v0.9', detail: '초기 매핑 스펙 · Reviewer 송부' },
    { at: '2026-04-26 14:20', actor: 'Admin',    action: 'imported',  target: 'TO-BE DDL', detail: 'credit-pg15.sql · 38 tables' },
    { at: '2026-04-25 10:00', actor: 'Admin',    action: 'imported',  target: 'AS-IS DDL', detail: 'credit-ora12.sql · 38 tables' },
    { at: '2026-04-24 09:00', actor: 'Admin',    action: 'created',   target: 'Project',   detail: 'Project "신용평가" created' },
  ],
};

const getSnapshots     = (projectId) => MAPPING_SNAPSHOTS_BY_PROJECT[projectId] || [];
const getAuditLog      = (projectId) => AUDIT_LOG_BY_PROJECT[projectId] || [];

/* Create a new snapshot of the current mapping state — pushed as 'pending'
   so the reviewer can approve. Version number bumps the minor of the latest. */
const createSnapshot = (projectId, notes) => {
  if (!projectId) return null;
  if (!MAPPING_SNAPSHOTS_BY_PROJECT[projectId]) MAPPING_SNAPSHOTS_BY_PROJECT[projectId] = [];
  if (!AUDIT_LOG_BY_PROJECT[projectId])         AUDIT_LOG_BY_PROJECT[projectId] = [];
  const list = MAPPING_SNAPSHOTS_BY_PROJECT[projectId];
  const latest = list[list.length - 1];
  /* version bump: 1.2 → 1.3, 0.9 → 1.0 if approved exists, else 0.10 etc. Keep simple. */
  let nextVersion;
  if (!latest) {
    nextVersion = '1.0';
  } else {
    const parts = String(latest.version).split('.');
    const major = parseInt(parts[0], 10) || 1;
    const minor = parseInt(parts[1], 10) || 0;
    nextVersion = `${major}.${minor + 1}`;
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const snap = {
    id: `${projectId}-v${nextVersion}`,
    version: nextVersion,
    createdAt: now, author: 'Admin',
    notes: notes || 'Manual snapshot',
    status: 'pending', reviewer: 'Reviewer',
    changes: [], /* real tool diffs against previous snapshot — mock */
  };
  list.push(snap);
  AUDIT_LOG_BY_PROJECT[projectId].unshift({
    at: now, actor: 'Admin', action: 'snapshot',
    target: `v${nextVersion}`,
    detail: notes || 'Manual snapshot — sent to Reviewer',
  });
  return snap;
};

const getLatestApproved = (projectId) => {
  const snaps = getSnapshots(projectId);
  for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i].status === 'approved') return snaps[i];
  return null;
};

/* ─── Notifications (in-app inbox) ───────────────────────────────
   Closed/air-gapped environments can't rely on Slack/email/webhooks, so
   the primary channel is an in-app notification center. Real tool writes
   to a notifications table; here we seed cross-project events. */

const NOTIFICATION_EVENTS = [
  { k: 'run-start',    l: 'Run 시작',              desc: '매핑 실행이 시작될 때' },
  { k: 'run-complete', l: 'Run 완료 (성공)',       desc: '모든 단계 통과하고 마무리' },
  { k: 'run-warn',     l: 'Run 완료 (경고/에러)',  desc: 'Quarantine 비어있지 않은 완료' },
  { k: 'run-abort',    l: 'Run 중단/실패',         desc: '사용자 abort 또는 stage 실패' },
  { k: 'approval-req', l: '승인 요청 도착',        desc: '내가 리뷰어로 지정되었을 때' },
  { k: 'approval-res', l: '승인 결과',             desc: '내 요청이 승인/반려되었을 때' },
  { k: 'quarantine',   l: 'Quarantine 임계치',     desc: '에러 행이 기준 수 이상 쌓였을 때' },
  { k: 'conn-failed',  l: '연결 실패 감지',        desc: 'AS-IS/TO-BE 접속이 끊기거나 타임아웃' },
  { k: 'ddl-change',   l: 'DDL 변경 감지',         desc: '소스 스키마가 import 시점과 달라졌을 때' },
];

const NOTIFICATIONS_SEED = [
  { id: 'n-001', at: '2026-04-23 15:42', projectId: 'p1', severity: 'info',  category: 'approval-req',
    title: '승인 요청 · v1.2', body: 'Reviewer 가 Core Ledger v1.2 스냅샷 리뷰를 기다리고 있습니다',
    link: { tab: 'versions' }, read: false },
  { id: 'n-002', at: '2026-04-23 14:05', projectId: 'p1', severity: 'warn',  category: 'quarantine',
    title: 'Quarantine 누적', body: 'GL_ENTRY FK violation 4 rows · 확인 필요',
    link: { tab: 'execution' }, read: false },
  { id: 'n-003', at: '2026-04-23 11:02', projectId: 'p3', severity: 'error', category: 'conn-failed',
    title: 'AS-IS 접속 stale', body: 'FX Treasury · fx-mainframe 3일간 재테스트 없음',
    link: { tab: 'settings', section: 'source' }, read: false },
  { id: 'n-004', at: '2026-04-23 10:20', projectId: 'p4', severity: 'info',  category: 'approval-req',
    title: '승인 요청 · v0.9', body: 'Admin 의 Loan Origination 초기 리뷰 요청',
    link: { tab: 'versions' }, read: true },
  { id: 'n-005', at: '2026-04-22 17:30', projectId: 'p1', severity: 'info',  category: 'approval-req',
    title: '새 스냅샷', body: 'Admin 이 Core Ledger v1.2 스냅샷을 생성했습니다',
    link: { tab: 'versions' }, read: true },
  { id: 'n-006', at: '2026-04-21 09:14', projectId: 'p1', severity: 'info',  category: 'run-start',
    title: 'Run 시작', body: 'Core Ledger · run-2026-0421-0914 실행 시작',
    link: { tab: 'execution' }, read: true },
  { id: 'n-007', at: '2026-04-15 15:25', projectId: 'p2', severity: 'ok',    category: 'approval-res',
    title: '승인됨 · v1.1', body: 'Reviewer 가 Deposit Accounts v1.1 을 승인했습니다',
    link: { tab: 'versions' }, read: true },
  { id: 'n-008', at: '2026-03-14 20:00', projectId: 'p5', severity: 'ok',    category: 'run-complete',
    title: 'Cutover 완료', body: 'Card Authorization · 28 tables · 812M rows · 4h 12m',
    link: { tab: 'execution' }, read: true },
  { id: 'n-009', at: '2026-02-28 18:00', projectId: 'p6', severity: 'ok',    category: 'run-complete',
    title: 'Cutover 완료', body: 'GL Consolidation · 113 tables · 완료',
    link: { tab: 'execution' }, read: true },
  { id: 'n-010', at: '2026-02-02 16:30', projectId: 'p7', severity: 'ok',    category: 'run-complete',
    title: 'Cutover 완료', body: 'Trade Finance · 19 tables · 완료',
    link: { tab: 'execution' }, read: true },
  { id: 'n-011', at: '2026-04-23 16:15', projectId: null,  severity: 'info', category: 'ddl-change',
    title: 'DDL drift 감지', body: 'Core Ledger AS-IS DDL 해시가 import 시점과 달라졌습니다 · 재import 권장',
    link: { tab: 'settings', section: 'source' }, read: false },
];

const getNotifications    = () => NOTIFICATIONS_SEED;
const getUnreadCount      = (list) => list.filter(n => !n.read).length;

/* ─── Run history per project ─────────────────────────────────────
   Real tool logs every run (rehearsal + cutover). Rehearsals typically
   fired nightly by Control-M; cutover runs are rare and manually gated.
   Seeded newest-first. The first entry of a 'running' result is the
   currently-active run rendered in Execution tab's header. */

const RUNS_BY_PROJECT = {
  /* p1 계정원장 — analysis 단계라 아직 run 이력 없음 */
  p1: [],
  p2: [
    { id: 'run-2026-0423-2200', mode: 'rehearsal', startedAt: '2026-04-23 22:00', elapsed: '2h 50m',  result: 'ok',    quarantineCount: 3, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0422-2200', mode: 'rehearsal', startedAt: '2026-04-22 22:00', elapsed: '2h 58m',  result: 'ok',    quarantineCount: 5, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0421-2200', mode: 'rehearsal', startedAt: '2026-04-21 22:00', elapsed: '3h 05m',  result: 'warn',  quarantineCount: 12, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
  ],
  p5: [
    { id: 'cut-2026-0314-2200', mode: 'cutover',   startedAt: '2026-03-14 22:00', elapsed: '4h 12m',  result: 'ok',    quarantineCount: 0, triggeredBy: { actor: 'Reviewer',  source: 'manual · cutover' } },
    { id: 'run-2026-0312-2200', mode: 'rehearsal', startedAt: '2026-03-12 22:00', elapsed: '4h 18m',  result: 'ok',    quarantineCount: 0, triggeredBy: { actor: 'control-m',   source: 'nightly schedule' } },
    { id: 'run-2026-0311-2200', mode: 'rehearsal', startedAt: '2026-03-11 22:00', elapsed: '4h 22m',  result: 'ok',    quarantineCount: 2, triggeredBy: { actor: 'control-m',   source: 'nightly schedule' } },
  ],
  p6: [
    { id: 'cut-2026-0228-2000', mode: 'cutover',   startedAt: '2026-02-28 20:00', elapsed: '8h 45m',  result: 'ok',    quarantineCount: 4, triggeredBy: { actor: 'Reviewer',  source: 'manual · cutover' } },
  ],
  p7: [
    { id: 'cut-2026-0202-2200', mode: 'cutover',   startedAt: '2026-02-02 22:00', elapsed: '1h 32m',  result: 'ok',    quarantineCount: 0, triggeredBy: { actor: 'Reviewer',  source: 'manual · cutover' } },
  ],
  p9: [
    { id: 'cut-2026-0508-2200', mode: 'cutover',   startedAt: '2026-05-08 22:00', elapsed: '00:42:18', eta: '03:30',  result: 'running', quarantineCount: 0, triggeredBy: { actor: 'Reviewer', source: 'manual · cutover' } },
    { id: 'run-2026-0507-2200', mode: 'rehearsal', startedAt: '2026-05-07 22:00', elapsed: '3h 22m',   result: 'ok',      quarantineCount: 0, triggeredBy: { actor: 'control-m', source: 'final rehearsal' } },
    { id: 'run-2026-0506-2200', mode: 'rehearsal', startedAt: '2026-05-06 22:00', elapsed: '3h 18m',   result: 'ok',      quarantineCount: 1, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0505-2200', mode: 'rehearsal', startedAt: '2026-05-05 22:00', elapsed: '3h 24m',   result: 'warn',    quarantineCount: 6, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
  ],
  p10: [
    { id: 'run-2026-0508-1015', mode: 'rehearsal', startedAt: '2026-05-08 10:15', elapsed: '00:14:32', eta: '00:18:00', result: 'running', quarantineCount: 0, triggeredBy: { actor: 'Admin', source: 'manual' } },
    { id: 'run-2026-0507-2200', mode: 'rehearsal', startedAt: '2026-05-07 22:00', elapsed: '2h 18m',   result: 'ok',   quarantineCount: 1, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0506-2200', mode: 'rehearsal', startedAt: '2026-05-06 22:00', elapsed: '2h 22m',   result: 'warn', quarantineCount: 4, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
  ],
  /* p3/p4/p8 are in analysis/planning — no runs yet */
};

const getRuns       = (projectId) => RUNS_BY_PROJECT[projectId] || [];
const getActiveRun  = (projectId) => {
  const runs = getRuns(projectId);
  return runs.find(r => r.result === 'running') || null;
};
const getPhaseLabel = (k) => PHASES.find(p => p.k === k)?.l || k;
const getPhaseDesc  = (k) => PHASES.find(p => p.k === k)?.desc || '';
const getPhaseColor = (k) => PHASES.find(p => p.k === k)?.color || 'var(--text-3)';
const getPhaseBg    = (k) => PHASES.find(p => p.k === k)?.bg    || 'var(--panel-2)';

/* ─── Active project switcher ─────────────────────────────────────
   Many legacy consumers (mapping.jsx, app.jsx, ExportTab, Artifacts) read
   from globals like window.SCHEMA_DIFF / window.TABLES / window.LOG_LINES.
   To preserve that contract while still supporting per-project demo data,
   we re-bind those globals whenever the active project changes. The module
   variables are 'let' bindings so reassignment also updates closure reads
   inside helpers that don't go through window. */
let ACTIVE_DATA_PROJECT_ID = 'p1';
const setActiveDataProject = (projectId) => {
  if (!projectId || !SCHEMA_DIFF_BY_PROJECT[projectId]) return;
  ACTIVE_DATA_PROJECT_ID = projectId;
  SCHEMA_DIFF        = SCHEMA_DIFF_BY_PROJECT[projectId];
  ASIS_SCHEMA_TABLES = ASIS_SCHEMA_TABLES_BY_PROJECT[projectId] || [];
  TOBE_SCHEMA_TABLES = TOBE_SCHEMA_TABLES_BY_PROJECT[projectId] || [];
  TABLES             = TABLES_BY_PROJECT[projectId] || [];
  LOG_LINES          = LOG_LINES_BY_PROJECT[projectId] || [];
  QUARANTINE_ENTRIES = QUARANTINE_BY_PROJECT[projectId] || [];
  /* Re-publish on window so consumers reading via window.* see fresh data. */
  window.SCHEMA_DIFF        = SCHEMA_DIFF;
  window.TABLES             = TABLES;
  window.LOG_LINES           = LOG_LINES;
  window.QUARANTINE_ENTRIES  = QUARANTINE_ENTRIES;
};
const getActiveDataProject = () => ACTIVE_DATA_PROJECT_ID;

/* ─── Partial-run helpers ─────────────────────────────────────────
   "Failed" 정의: TABLES[i].status ∈ {'warn','blocked'} (status 기반).
   Quarantine viewer · Start Run dialog · Mapping inspector 세 진입점이
   동일 helper 를 통해 RUNS_BY_PROJECT 에 run record 를 push.
   Legacy seed runs 는 scope 필드가 없으므로 렌더 측에서 (run.scope || 'all') 로 처리. */

const getFailedTables = (projectId) => {
  const tbls = TABLES_BY_PROJECT[projectId] || [];
  return tbls.filter(t => t.status === 'warn' || t.status === 'blocked').map(t => t.name);
};

const getLastRunByMode = (projectId, mode) => {
  const runs = getRuns(projectId);
  return runs.find(r => r.mode === mode && r.result !== 'running') || null;
};

const getTablesFromLastFailedCutover = (projectId) => {
  const cut = getLastRunByMode(projectId, 'cutover');
  if (!cut || cut.result === 'ok') return [];
  return getFailedTables(projectId);
};

const getQuarantineTables = (projectId) => {
  const entries = QUARANTINE_BY_PROJECT[projectId] || [];
  return [...new Set(entries.map(e => e.table).filter(Boolean))];
};

const PARTIAL_PHASES = ['rehearsal', 'sign-off', 'cutover', 'hypercare'];

const canStartPartial = (project, mode, scope) => {
  if (!project) return false;
  if (!PARTIAL_PHASES.includes(project.phase)) return false;
  if (mode === 'cutover') {
    if (scope !== 'failed-only') return false; /* 임의 subset cutover 차단 */
    if (!['cutover', 'hypercare'].includes(project.phase)) return false;
    return getTablesFromLastFailedCutover(project.id).length > 0;
  }
  return true; /* rehearsal partial: phase rehearsal+ 에서 자유 */
};

const buildScopeLabel = (scope, tables) => {
  if (!scope || scope === 'all') return '전체';
  const n = Array.isArray(tables) ? tables.length : 0;
  if (scope === 'single')      return `단일 · ${tables?.[0] || ''}`;
  if (scope === 'failed-only') return `실패만 · ${n} tables`;
  return `${scope} · ${n} tables`;
};

const startPartialRun = (projectId, opts = {}) => {
  const { mode = 'rehearsal', tables, scope = 'all', parentRunId, triggeredBy } = opts;
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ');
  const idStamp = now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + now.toTimeString().slice(0, 5).replace(':', '');
  const prefix = mode === 'cutover' ? 'cut' : 'run';
  const eta = mode === 'cutover' ? '03:30' : '02:00';
  const tableList = scope === 'all' ? 'all' : (Array.isArray(tables) ? tables.slice() : []);
  const newRun = {
    id: `${prefix}-${idStamp}`,
    mode,
    startedAt: stamp,
    elapsed: '00:00:00',
    eta,
    result: 'running',
    quarantineCount: 0,
    tables: tableList,
    scope,
    scopeLabel: buildScopeLabel(scope, Array.isArray(tableList) ? tableList : null),
    parentRunId: parentRunId || null,
    triggeredBy: triggeredBy || { actor: 'Admin', source: `manual · ${mode}${scope !== 'all' ? ` · ${scope}` : ''}` },
  };
  const map = window.RUNS_BY_PROJECT || RUNS_BY_PROJECT;
  if (!map[projectId]) map[projectId] = [];
  map[projectId].unshift(newRun);
  window.RUNS_VERSION = (window.RUNS_VERSION || 0) + 1;
  return newRun;
};

Object.assign(window, {
  PROJECTS, TABLES, MAPPING, STAGES, LOG_LINES, SCHEMA_DIFF, TENANT,
  mappingsFromSchemaDiff, getColumnMappings, getSchemaDiff,
  SAMPLE_SOURCE_ROWS, applyMockTransform,
  getAsisInventory, getTobeInventory,
  ASIS_COLUMN_SCHEMA, effectiveAsisCols,
  mockColumnProfile, mockTableSamples,
  getPreflightChecks, QUARANTINE_ENTRIES,
  MAPPING_SNAPSHOTS_BY_PROJECT, AUDIT_LOG_BY_PROJECT,
  getSnapshots, getAuditLog, getLatestApproved, createSnapshot,
  NOTIFICATION_EVENTS, NOTIFICATIONS_SEED, getNotifications, getUnreadCount,
  PHASES, RUNS_BY_PROJECT, getRuns, getActiveRun,
  getPhaseLabel, getPhaseDesc, getPhaseColor, getPhaseBg,
  /* Partial-run helpers */
  getFailedTables, getLastRunByMode, getTablesFromLastFailedCutover,
  getQuarantineTables, canStartPartial, buildScopeLabel, startPartialRun,
  COLUMN_OVERRIDES, getColumnOverrides, updateColumnOverride,
  /* Per-project data + helpers */
  SCHEMA_DIFF_BY_PROJECT, TABLES_BY_PROJECT, LOG_LINES_BY_PROJECT, QUARANTINE_BY_PROJECT,
  ASIS_SCHEMA_TABLES_BY_PROJECT, TOBE_SCHEMA_TABLES_BY_PROJECT,
  getSchemaDiffByProject, getTablesByProject, getLogLines, getQuarantine,
  setActiveDataProject, getActiveDataProject,
});
