/* Seed data for the migration tool */

const TENANT = 'KDB Bank';

/* DDL state on each project: { asis, tobe } where each side is either null
   (not yet imported) or metadata describing the imported DDL file.
   Demonstrates all four import states across the seeded project list. */
const ddlMeta = (filename, date, tables, columns) => ({ filename, uploadedAt: date, tables, columns });

/* Connection state per side. Mocked — real tool would test TCP/DB protocol. */
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

/* Project lifecycle phase — reflects the 6-phase real-world migration flow.
   planning → analysis → rehearsal → sign-off → cutover → hypercare → done
   The legacy `status` field (running/waiting/done) is kept for backwards
   compat (dashboard stats etc.) but phase is the new source of truth. */
const PHASES = [
  { k: 'planning',  l: 'Planning',   desc: '킥오프 · 담당자 배정 · 계정 확보' },
  { k: 'analysis',  l: 'Analysis',   desc: 'DDL import · 매핑 설계' },
  { k: 'rehearsal', l: 'Rehearsal',  desc: '시험이행 반복 · 이슈 수렴' },
  { k: 'sign-off',  l: 'Sign-off',   desc: '최종 매핑 승인 · 컷오버 준비' },
  { k: 'cutover',   l: 'Cutover',    desc: 'D-day 실제 이행' },
  { k: 'hypercare', l: 'Hypercare',  desc: '컷오버 후 안정화 · rollback 감시' },
  { k: 'done',      l: 'Done',       desc: '프로젝트 종료' },
];

const cutoverMeta = (dday, freezeHours, rollbackSla) => ({ dday, freezeHours, rollbackSla });

const PROJECTS = [
  { id: 'p1', name: 'Core Ledger',          client: TENANT, tables: 142, status: 'running', phase: 'rehearsal', src: 'Mainframe (EBCDIC)', tgt: 'PostgreSQL 15',  updated: '2 min ago',
    ddl: { asis: ddlMeta('core-legacy.ddl',      '2026-04-18 14:22', 142, 1820), tobe: ddlMeta('core-target.sql',     '2026-04-19 09:05', 138, 1740) },
    connections: { asis: connMeta('ok', { latencyMs: 42, detectedTables: 142 }), tobe: connMeta('ok', { latencyMs: 18, detectedTables: 138 }) },
    cutover: cutoverMeta('2026-05-03 22:00 KST', 24, 15) },
  { id: 'p2', name: 'Deposit Accounts',     client: TENANT, tables: 87,  status: 'running', phase: 'rehearsal', src: 'Oracle 11g',         tgt: 'PostgreSQL 15',  updated: '8 min ago',
    ddl: { asis: ddlMeta('deposit-ora11.sql',    '2026-04-10 11:30',  87,  942), tobe: ddlMeta('deposit-pg15.sql',    '2026-04-10 17:18',  85,  880) },
    connections: { asis: connMeta('ok', { latencyMs: 31, detectedTables: 87 }), tobe: connMeta('ok', { latencyMs: 22, detectedTables: 85 }) },
    cutover: cutoverMeta('2026-05-17 22:00 KST', 24, 20) },
  { id: 'p3', name: 'FX Treasury',          client: TENANT, tables: 34,  status: 'waiting', phase: 'analysis',  src: 'Mainframe (EBCDIC)', tgt: 'Linux / UTF-8',  updated: '1 hr ago',
    ddl: { asis: ddlMeta('fx-mainframe.ddl',     '2026-04-20 10:11',  34,  412), tobe: null },
    connections: { asis: connMeta('stale', { latencyMs: 78, detectedTables: 34 }), tobe: connMeta('untested') },
    cutover: cutoverMeta('2026-06-14 20:00 KST', 12, 30) },
  { id: 'p4', name: 'Loan Origination',     client: TENANT, tables: 61,  status: 'waiting', phase: 'analysis',  src: 'Oracle 12c',         tgt: 'PostgreSQL 15',  updated: '3 hr ago',
    ddl: { asis: null,                                                           tobe: ddlMeta('loan-pg-target.sql',  '2026-04-21 16:02',  58,  726) },
    connections: { asis: connMeta('untested'), tobe: connMeta('ok', { latencyMs: 15, detectedTables: 58 }) },
    cutover: cutoverMeta('2026-06-28 22:00 KST', 24, 30) },
  { id: 'p5', name: 'Card Authorization',   client: TENANT, tables: 28,  status: 'done',    phase: 'hypercare', src: 'Mainframe (EBCDIC)', tgt: 'PostgreSQL 14',  updated: 'Mar 14',
    ddl: { asis: ddlMeta('card-mf.ddl',          '2026-02-28 09:00',  28,  312), tobe: ddlMeta('card-pg14.sql',       '2026-03-01 14:40',  28,  310) },
    connections: { asis: connMeta('ok', { latencyMs: 38, detectedTables: 28 }), tobe: connMeta('ok', { latencyMs: 19, detectedTables: 28 }) },
    cutover: cutoverMeta('2026-03-14 22:00 KST', 24, 15) },
  { id: 'p6', name: 'GL Consolidation',     client: TENANT, tables: 113, status: 'done',    phase: 'done',      src: 'Oracle 11g',         tgt: 'PostgreSQL 15',  updated: 'Feb 28',
    ddl: { asis: ddlMeta('gl-ora.sql',           '2026-02-08 10:20', 113, 1240), tobe: ddlMeta('gl-pg.sql',           '2026-02-08 15:55', 110, 1180) },
    connections: { asis: connMeta('ok', { latencyMs: 27, detectedTables: 113 }), tobe: connMeta('ok', { latencyMs: 20, detectedTables: 110 }) },
    cutover: cutoverMeta('2026-02-28 20:00 KST', 18, 20) },
  { id: 'p7', name: 'Trade Finance',        client: TENANT, tables: 19,  status: 'done',    phase: 'done',      src: 'Mainframe (EBCDIC)', tgt: 'Linux / UTF-8',  updated: 'Feb 02',
    ddl: { asis: ddlMeta('trade-mf.ddl',         '2026-01-24 13:15',  19,  208), tobe: ddlMeta('trade-flat.yaml',     '2026-01-24 18:40',  19,  208) },
    connections: { asis: connMeta('ok', { latencyMs: 55, detectedTables: 19 }), tobe: connMeta('ok', { latencyMs: 24, detectedTables: 19 }) },
    cutover: cutoverMeta('2026-02-02 22:00 KST', 12, 20) },
  { id: 'p8', name: 'Remittance Hub',        client: TENANT, tables: 0,   status: 'waiting', phase: 'planning',  src: 'Oracle 19c',         tgt: 'PostgreSQL 16',  updated: 'just now',  isNew: true,
    ddl: { asis: null, tobe: null },
    connections: { asis: connMeta('untested'), tobe: connMeta('untested') },
    cutover: cutoverMeta('TBD', 24, 30) },
];

/* Dashboard tables */
const TABLES = [
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

/* Log lines */
const LOG_LINES = [
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

/* ─── Artifacts: schema diff between ASIS (source) and TOBE (target) ──────
   Each table lists ASIS columns + TOBE columns; diff is computed on the fly.
   TOBE columns may carry .default (initial value for newly added columns) and
   .renameFrom (detected rename candidate, possibly .renameConfidence < 1). */

const SCHEMA_DIFF = [
  {
    table: 'ACCT_MASTER',
    asis:  'CORE.ACCT_MASTER',
    tobe:  'public.account',
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
    sources: [
      { alias: 'cp', table: 'CORE.CUST_PROFILE', role: 'primary', rows: 2_118_774 },
      { alias: 'cc', table: 'CORE.CUST_CONTACT', role: 'join', joinType: 'LEFT JOIN', joinOn: 'cp.CUST_ID = cc.CUST_ID', rows: 4_882_091 },
    ],
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
    sources: [
      { alias: 't23', table: 'CORE.TXN_JOURNAL_2023', role: 'union', rows: 284_003_117 },
      { alias: 't24', table: 'CORE.TXN_JOURNAL_2024', role: 'union', rows: 312_889_001 },
    ],
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

/* ─── Synthesis helpers ────────────────────────────────────────────
   Column-level mapping rows can be derived on-the-fly from a SCHEMA_DIFF
   entry. Hand-authored MAPPING (for ACCT_MASTER) is kept as-is and used
   preferentially; every other table is synthesized. */

const mappingsFromSchemaDiff = (t) => {
  const rows = [];
  /* Use dynamic asisCols derived from the current sources binding, so the
     column grid reacts to JOIN/UNION edits in Table binding. */
  const asisCols = effectiveAsisCols(t);
  const asisByName = Object.fromEntries(asisCols.map(c => [c.name, c]));
  const referenced = new Set();

  t.tobeCols.forEach(tc => {
    if (tc.added) {
      const mergedSrc = tc.mergedFrom ? tc.mergedFrom.join(' + ') : '—';
      /* Check merged-from columns exist in current sources. If not, fall
         back to a 'missing source' warning so the user notices that removing
         a binding broke a merge target. */
      const mergedPresent = tc.mergedFrom ? tc.mergedFrom.every(n => asisByName[n]) : true;
      rows.push({
        src: mergedSrc, srcType: tc.mergedFrom ? 'multi' : '—',
        tgt: tc.name, tgtType: tc.type,
        rule: tc.mergedFrom ? 'rule' : 'added',
        status: !mergedPresent ? 'err'
          : (tc.default && tc.default !== 'NULL') ? 'ok'
          : (tc.mergedFrom ? 'ok' : 'warn'),
        pk: !!tc.pk,
        note: !mergedPresent
          ? `merge source missing: ${tc.mergedFrom.filter(n => !asisByName[n]).join(', ')}`
          : tc.mergedFrom
            ? `merge(${tc.mergedFrom.join(' + ')}) → ${tc.type}`
            : `default = ${tc.default ?? 'NULL'}`,
        sourceAlias: null,
      });
      if (tc.mergedFrom) tc.mergedFrom.forEach(n => referenced.add(n));
      return;
    }
    const srcName = tc.renameFrom || tc.name;
    const ac = asisByName[srcName];
    if (!ac) {
      rows.push({
        src: srcName, srcType: '?',
        tgt: tc.name, tgtType: tc.type,
        rule: 'rule', status: 'err',
        pk: !!tc.pk, note: 'source column not found (binding removed?)',
      });
      return;
    }
    referenced.add(srcName);
    const typeChanged = ac.type !== tc.type;
    const needsTransform = typeChanged || /EBCDIC|COMP-3|YYYYMMDD|HHMMSS/.test(ac.type);
    const rule = needsTransform ? 'rule' : 'auto';
    const lowConf = (tc.renameConfidence ?? 1) < 0.85;
    rows.push({
      src: ac.name, srcType: ac.type,
      tgt: tc.name, tgtType: tc.type,
      rule,
      status: lowConf ? 'warn' : 'ok',
      pk: !!tc.pk,
      note: lowConf ? `low rename confidence ${Math.round((tc.renameConfidence ?? 1) * 100)}%` : '',
      sourceAlias: ac.source,
    });
  });

  /* AS-IS columns that the current bindings include but no TO-BE references → dropped */
  asisCols.forEach(ac => {
    if (!referenced.has(ac.name)) {
      rows.push({
        src: ac.name, srcType: ac.type,
        tgt: '—', tgtType: '—',
        rule: 'skip', status: 'skip',
        pk: !!ac.pk, note: 'dropped from TO-BE',
        sourceAlias: ac.source,
      });
    }
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

const ASIS_SCHEMA_TABLES = [
  { name: 'CORE.ACCT_MASTER',       columnCount: 13, rows: 18_442_331 },
  { name: 'CORE.CUST_PROFILE',      columnCount: 8,  rows: 2_118_774 },
  { name: 'CORE.CUST_CONTACT',      columnCount: 4,  rows: 4_882_091 },
  { name: 'CORE.TXN_JOURNAL_2023',  columnCount: 9,  rows: 284_003_117 },
  { name: 'CORE.TXN_JOURNAL_2024',  columnCount: 9,  rows: 312_889_001 },
  { name: 'CORE.LEGACY_GRADE_DICT', columnCount: 2,  rows: 45,          note: 'reference table · never migrated' },
  { name: 'CORE.MAINT_WORK_TEMP',   columnCount: 6,  rows: 120,         note: 'scratch work area · drop after cutover' },
  { name: 'CORE.ORG_HIST',          columnCount: 8,  rows: 3120,        note: 'pending steward decision' },
];

const TOBE_SCHEMA_TABLES = [
  { name: 'public.account',          columnCount: 18 },
  { name: 'public.customer',         columnCount: 14 },
  { name: 'public.transaction_2024', columnCount: 12 },
  { name: 'public.transaction_all',  columnCount: 9 },
  { name: 'public.loan',             columnCount: 15, note: 'Loan Origination scope · no source assigned yet' },
  { name: 'public.card',             columnCount: 11, note: 'Card Authorization scope · no source assigned yet' },
  { name: 'public.fx_position',      columnCount: 7,  note: 'FX Treasury scope · no source assigned yet' },
];

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
};

/* Derive the AS-IS column list for a given SCHEMA_DIFF entry, reacting to the
   current sources (which the Table binding editor can mutate). */
const effectiveAsisCols = (sd) => {
  if (!sd) return [];
  const sources = (sd.sources && sd.sources.length > 0)
    ? sd.sources
    : (sd.asis ? [{ alias: null, table: sd.asis, role: 'primary' }] : []);
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
    const sources = sd.sources || (sd.asis ? [{ table: sd.asis, alias: null, role: 'primary' }] : []);
    sources.forEach(s => {
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
    const sources = sd?.sources || (sd?.asis ? [{ table: sd.asis, alias: null, role: 'primary' }] : []);
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
  checks.push(mkConnCheck('asis', 'AS-IS'));
  checks.push(mkConnCheck('tobe', 'TO-BE'));

  const mkDdlCheck = (side, label) => ({
    id: `ddl-${side}`, title: `${label} DDL import`,
    status: ddl[side] ? 'pass' : 'fail',
    detail: ddl[side] ? `${ddl[side].tables} tables · ${ddl[side].columns} columns (${ddl[side].filename})` : 'DDL not imported',
    fix: { tab: 'settings', section: side === 'asis' ? 'source' : 'target' },
  });
  checks.push(mkDdlCheck('asis', 'AS-IS'));
  checks.push(mkDdlCheck('tobe', 'TO-BE'));

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
    fix: { tab: 'mapping' },
  });

  const unroutedAsis = asisInv.filter(t => t.unrouted);
  checks.push({
    id: 'asis-orphans', title: 'AS-IS 고아 테이블 점검',
    status: !bothDdl ? 'skip' : unroutedAsis.length === 0 ? 'pass' : 'warn',
    detail: !bothDdl ? 'DDL 두 쪽 모두 import 후 검증됩니다'
      : unroutedAsis.length === 0 ? 'all AS-IS tables routed'
      : `${unroutedAsis.length} unrouted (의도적 제외 확인 필요): ${unroutedAsis.map(t => t.tableShort).join(', ')}`,
    fix: { tab: 'mapping' },
  });

  /* NOT-NULL added columns with NULL defaults — blocks insert */
  const violations = [];
  (SCHEMA_DIFF || []).forEach(sd => {
    sd.tobeCols.forEach(tc => {
      if (tc.added && tc.nullable === false && (!tc.default || tc.default === 'NULL')) {
        violations.push(`${sd.tobe}.${tc.name}`);
      }
    });
  });
  checks.push({
    id: 'added-not-null', title: 'NOT NULL 신규 컬럼 default 지정',
    status: violations.length === 0 ? 'pass' : 'fail',
    detail: violations.length === 0
      ? 'all new NOT NULL columns have non-NULL defaults'
      : `${violations.length} violation: ${violations.slice(0, 3).join(', ')}${violations.length > 3 ? ' …' : ''}`,
    fix: { tab: 'mapping' },
  });

  /* Low-confidence renames — warning */
  const lowConf = [];
  (SCHEMA_DIFF || []).forEach(sd => {
    sd.tobeCols.forEach(tc => {
      if (tc.renameFrom && (tc.renameConfidence ?? 1) < 0.70) {
        lowConf.push(`${sd.tobe}.${tc.name} ← ${tc.renameFrom} (${Math.round((tc.renameConfidence ?? 1) * 100)}%)`);
      }
    });
  });
  checks.push({
    id: 'low-confidence', title: '낮은 신뢰도 rename 검토',
    status: lowConf.length === 0 ? 'pass' : 'warn',
    detail: lowConf.length === 0 ? 'all renames above 70% confidence'
      : `${lowConf.length} field(s) need review: ${lowConf.slice(0, 2).join(' · ')}${lowConf.length > 2 ? ' …' : ''}`,
    fix: { tab: 'mapping' },
  });

  /* Primary key coverage */
  const pkMissing = [];
  (SCHEMA_DIFF || []).forEach(sd => {
    const hasPk = sd.tobeCols.some(c => c.pk);
    if (!hasPk) pkMissing.push(sd.tobe);
  });
  checks.push({
    id: 'pk-presence', title: 'Primary key 존재',
    status: pkMissing.length === 0 ? 'pass' : 'warn',
    detail: pkMissing.length === 0 ? 'all tables have PK'
      : `no PK: ${pkMissing.slice(0, 3).join(', ')}${pkMissing.length > 3 ? ' …' : ''}`,
    fix: { tab: 'mapping' },
  });

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

const QUARANTINE_ENTRIES = [
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
    { at: 'just now', actor: 'Admin', action: 'created', target: 'Project', detail: 'Project "Remittance Hub" created' },
  ],
};

const getSnapshots     = (projectId) => MAPPING_SNAPSHOTS_BY_PROJECT[projectId] || [];
const getAuditLog      = (projectId) => AUDIT_LOG_BY_PROJECT[projectId] || [];
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
  p1: [
    { id: 'run-2026-0421-0914', mode: 'rehearsal', startedAt: '2026-04-21 09:14', elapsed: '00:27:06', eta: '00:28:40', result: 'running',  quarantineCount: 6,  triggeredBy: { actor: 'Admin',  source: 'manual' } },
    { id: 'run-2026-0420-2200', mode: 'rehearsal', startedAt: '2026-04-20 22:00', elapsed: '3h 42m',  result: 'ok',      quarantineCount: 8,  triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0419-2200', mode: 'rehearsal', startedAt: '2026-04-19 22:00', elapsed: '3h 55m',  result: 'warn',    quarantineCount: 14, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0418-2200', mode: 'rehearsal', startedAt: '2026-04-18 22:00', elapsed: '4h 12m',  result: 'warn',    quarantineCount: 22, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
    { id: 'run-2026-0417-2200', mode: 'rehearsal', startedAt: '2026-04-17 22:00', elapsed: '4h 30m',  result: 'aborted', quarantineCount: 0,  triggeredBy: { actor: 'control-m', source: 'nightly schedule' }, error: 'encode · invalid EBCDIC byte halted run' },
    { id: 'run-2026-0416-1420', mode: 'rehearsal', startedAt: '2026-04-16 14:20', elapsed: '2h 18m',  result: 'ok',      quarantineCount: 28, triggeredBy: { actor: 'Admin',  source: 'manual' } },
    { id: 'run-2026-0414-2200', mode: 'rehearsal', startedAt: '2026-04-14 22:00', elapsed: '5h 04m',  result: 'warn',    quarantineCount: 48, triggeredBy: { actor: 'control-m', source: 'nightly schedule' } },
  ],
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
  /* p3/p4/p8 are in analysis/planning — no runs yet */
};

const getRuns       = (projectId) => RUNS_BY_PROJECT[projectId] || [];
const getActiveRun  = (projectId) => {
  const runs = getRuns(projectId);
  return runs.find(r => r.result === 'running') || null;
};
const getPhaseLabel = (k) => PHASES.find(p => p.k === k)?.l || k;
const getPhaseDesc  = (k) => PHASES.find(p => p.k === k)?.desc || '';

Object.assign(window, {
  PROJECTS, TABLES, MAPPING, STAGES, LOG_LINES, SCHEMA_DIFF, TENANT,
  mappingsFromSchemaDiff, getColumnMappings, getSchemaDiff,
  SAMPLE_SOURCE_ROWS, applyMockTransform,
  getAsisInventory, getTobeInventory,
  ASIS_COLUMN_SCHEMA, effectiveAsisCols,
  mockColumnProfile, mockTableSamples,
  getPreflightChecks, QUARANTINE_ENTRIES,
  MAPPING_SNAPSHOTS_BY_PROJECT, AUDIT_LOG_BY_PROJECT,
  getSnapshots, getAuditLog, getLatestApproved,
  NOTIFICATION_EVENTS, NOTIFICATIONS_SEED, getNotifications, getUnreadCount,
  PHASES, RUNS_BY_PROJECT, getRuns, getActiveRun, getPhaseLabel, getPhaseDesc,
});
