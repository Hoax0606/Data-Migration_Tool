import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import {
  useWorkspaceStore,
  emptyDbConnection,
  PROJECT_ENVIRONMENTS,
  type Site,
  type SiteEnv,
  type SourceEncoding,
  type SiteDbConnection,
  type ProjectEnvironment,
  type TobeDbByEnv,
  type TobeDbLocks,
} from '../store/workspace';
import { useAuthStore } from '../store/auth';
import { useT, type TranslationKey } from '../i18n';
import { CsvPathField } from './CsvPathField';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ENV_OPTIONS: Array<{ value: SiteEnv; key: TranslationKey }> = [
  { value: 'mainframe', key: 'siteEnv.mainframe' },
  { value: 'midrange',  key: 'siteEnv.midrange'  },
  { value: 'cloud',     key: 'siteEnv.cloud'     },
  { value: 'on-prem',   key: 'siteEnv.onprem'    },
  { value: 'other',     key: 'siteEnv.other'     },
];

const ENCODING_OPTIONS: Array<{ value: SourceEncoding; key: TranslationKey }> = [
  { value: 'shift_jis', key: 'encoding.shiftjis' },
  { value: 'euc-jp',    key: 'encoding.eucjp'    },
  { value: 'utf-8',     key: 'encoding.utf8'     },
  { value: 'ebcdic',    key: 'encoding.ebcdic'   },
];

const PROJECT_ENV_LABEL: Record<ProjectEnvironment, TranslationKey> = {
  test:       'projectEnv.test',
  dev:        'projectEnv.dev',
  staging:    'projectEnv.staging',
  production: 'projectEnv.production',
};

const DB_TYPES = ['PostgreSQL', 'Oracle', 'MySQL', 'SQL Server', 'Db2'];

/**
 * Site settings — name·envs·encoding·notes·운영 단계·TO-BE DB 편집 + 삭제.
 */
export function SiteSettingsModal({ open, onClose }: Props) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master';
  const sites = useWorkspaceStore((s) => s.sites);
  const activeSiteId = useWorkspaceStore((s) => s.activeSiteId);
  const updateSite = useWorkspaceStore((s) => s.updateSite);
  const deleteSite = useWorkspaceStore((s) => s.deleteSite);
  const projects = useWorkspaceStore((s) => s.projects);

  const site: Site | undefined = sites.find((s) => s.id === activeSiteId);
  const projectCount = projects.filter((p) => p.siteId === activeSiteId).length;

  const [name, setName] = useState('');
  const [asisEnv, setAsisEnv] = useState<SiteEnv>('mainframe');
  const [tobeEnv, setTobeEnv] = useState<SiteEnv>('on-prem');
  const [asisEncoding, setAsisEncoding] = useState<SourceEncoding>('shift_jis');
  const [tobeEncoding, setTobeEncoding] = useState<SourceEncoding>('utf-8');
  const [csvPath, setCsvPath] = useState('');
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<ProjectEnvironment>('dev');
  const [tobeDbByEnv, setTobeDbByEnv] = useState<TobeDbByEnv>({});
  const [tobeDbLocks, setTobeDbLocks] = useState<TobeDbLocks>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open || !site) return;
    setName(site.name);
    setAsisEnv(site.asisEnv);
    setTobeEnv(site.tobeEnv);
    setAsisEncoding(site.asisEncoding);
    setTobeEncoding(site.tobeEncoding);
    setCsvPath(site.csvPath ?? '');
    setNotes(site.notes ?? '');
    setStage(site.environment);
    setTobeDbByEnv({ ...site.tobeDbByEnv });
    setTobeDbLocks({ ...site.tobeDbLocks });
    setConfirmOpen(false);
    setConfirmText('');
  }, [open, site]);

  if (!site) return null;

  // 현재 stage 의 DB — 저장된 것이 없으면 emptyDbConnection (사용자에게 빈 폼).
  const tobeDb: SiteDbConnection = tobeDbByEnv[stage] ?? emptyDbConnection();
  const stageLocked = !!tobeDbLocks[stage];
  const dbFieldsDisabled = stageLocked;

  const patchTobeDb = (patch: Partial<SiteDbConnection>) => {
    if (stageLocked) return;
    setTobeDbByEnv((cur) => ({ ...cur, [stage]: { ...(cur[stage] ?? emptyDbConnection()), ...patch } }));
  };

  const handleUnlock = () => {
    if (!isMaster) return;
    setTobeDbLocks((cur) => ({ ...cur, [stage]: false }));
  };

  const isDirty =
    name !== site.name ||
    asisEnv !== site.asisEnv ||
    tobeEnv !== site.tobeEnv ||
    asisEncoding !== site.asisEncoding ||
    tobeEncoding !== site.tobeEncoding ||
    csvPath !== (site.csvPath ?? '') ||
    (notes || '') !== (site.notes ?? '') ||
    stage !== site.environment ||
    JSON.stringify(tobeDbByEnv) !== JSON.stringify(site.tobeDbByEnv) ||
    JSON.stringify(tobeDbLocks) !== JSON.stringify(site.tobeDbLocks);

  // production 으로 전환은 master 만
  const blockedByProd = stage === 'production' && stage !== site.environment && !isMaster;
  const canSave = isDirty && !!name.trim() && !blockedByProd;
  const canTestConnection = !!tobeDb.host.trim() && !!tobeDb.username.trim() && !dbFieldsDisabled;

  const handleSave = async () => {
    if (!canSave) return;
    // type 이 비어있는 단계는 저장하지 않음.
    const finalByEnv: TobeDbByEnv = {};
    for (const env of PROJECT_ENVIRONMENTS) {
      const c = tobeDbByEnv[env];
      if (c && c.type.trim()) finalByEnv[env] = c;
    }
    // 저장 시 현재 단계의 DB 가 채워져 있으면 자동 lock. 빈 단계는 lock 도 제거.
    const finalLocks: TobeDbLocks = {};
    for (const env of PROJECT_ENVIRONMENTS) {
      if (finalByEnv[env]) finalLocks[env] = tobeDbLocks[env] ?? true;
    }
    if (finalByEnv[stage]) finalLocks[stage] = true;

    await updateSite(site.id, {
      name: name.trim(),
      asisEnv,
      tobeEnv,
      asisEncoding,
      tobeEncoding,
      csvPath: csvPath.trim(),
      notes: notes.trim() || undefined,
      environment: stage,
      tobeDbByEnv: finalByEnv,
      tobeDbLocks: finalLocks,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirmText !== site.name) return;
    await deleteSite(site.id);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width={560} title={t('siteSettings.title')}>
      <Field label={t('siteSettings.name')}>
        <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
      </Field>

      <Field label={t('siteSettings.asisEnv')}>
        <EnvPills value={asisEnv} onChange={setAsisEnv} t={t} />
      </Field>

      <Field label={t('siteSettings.tobeEnv')}>
        <EnvPills value={tobeEnv} onChange={setTobeEnv} t={t} />
      </Field>

      <Field label={t('siteSettings.asisEncoding')} hint={t('siteSettings.encodingHint')}>
        <select value={asisEncoding} onChange={(e) => setAsisEncoding(e.target.value as SourceEncoding)} style={styles.input}>
          {ENCODING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.key)}</option>
          ))}
        </select>
      </Field>

      <Field label={t('siteSettings.tobeEncoding')}>
        <select value={tobeEncoding} onChange={(e) => setTobeEncoding(e.target.value as SourceEncoding)} style={styles.input}>
          {ENCODING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.key)}</option>
          ))}
        </select>
      </Field>

      <Field label={t('siteSettings.csvPath')} hint={t('siteSettings.csvPathHint')}>
        <CsvPathField value={csvPath} onChange={setCsvPath} />
      </Field>

      <Field label={t('siteSettings.notes')} hint={t('siteSettings.notesHint')}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...styles.input, resize: 'vertical', minHeight: 56, fontFamily: 'var(--mono)' }}
          rows={2}
        />
      </Field>

      {/* 운영 단계 — TO-BE DB 바로 위 */}
      <Field label={t('siteSettings.stage')} hint={t('siteSettings.stageHint')}>
        <StagePills value={stage} onChange={setStage} byEnv={tobeDbByEnv} locks={tobeDbLocks} t={t} />
      </Field>

      {/* TO-BE DB */}
      <div style={styles.dbCard}>
        <div style={styles.dbHeader}>
          <span>{t('siteSettings.tobeDb')}</span>
          <span style={styles.dbStageTag}>{t(PROJECT_ENV_LABEL[stage])}</span>
          {stageLocked && <span style={styles.dbLockTag}>🔒 {t('siteSettings.locked')}</span>}
          <div style={{ flex: 1 }} />
          {stageLocked && (
            isMaster ? (
              <button type="button" onClick={handleUnlock} style={styles.dbUnlockBtn}>
                {t('siteSettings.unlock')}
              </button>
            ) : (
              <span style={styles.dbCoordOnly} title={t('siteSettings.unlockCoordOnly')}>
                {t('siteSettings.unlockCoordOnly')}
              </span>
            )
          )}
        </div>
        <div style={styles.dbDesc}>
          {stageLocked ? t('siteSettings.lockedHint') : t('siteSettings.tobeDb.desc')}
        </div>

        <div style={styles.dbGrid2}>
          <select value={tobeDb.type} onChange={(e) => patchTobeDb({ type: e.target.value })} style={styles.input} disabled={dbFieldsDisabled}>
            <option value="" disabled>— {t('siteSettings.dbTypePlaceholder')} —</option>
            {DB_TYPES.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input value={tobeDb.version} onChange={(e) => patchTobeDb({ version: e.target.value })} placeholder={t('siteSettings.dbVersion')} style={styles.input} disabled={dbFieldsDisabled} />
        </div>
        <div style={styles.dbGridHostPort}>
          <input value={tobeDb.host} onChange={(e) => patchTobeDb({ host: e.target.value })} placeholder={`${t('siteSettings.dbHost')} (10.20.30.40)`} style={styles.input} disabled={dbFieldsDisabled} />
          <input value={tobeDb.port} onChange={(e) => patchTobeDb({ port: e.target.value })} placeholder={t('siteSettings.dbPort')} style={styles.input} disabled={dbFieldsDisabled} />
        </div>
        <div style={styles.dbGrid2}>
          <input value={tobeDb.username} onChange={(e) => patchTobeDb({ username: e.target.value })} placeholder={t('siteSettings.dbUsername')} style={styles.input} autoComplete="off" disabled={dbFieldsDisabled} />
          <input type="password" value={tobeDb.password} onChange={(e) => patchTobeDb({ password: e.target.value })} placeholder={t('siteSettings.dbPassword')} style={styles.input} autoComplete="new-password" disabled={dbFieldsDisabled} />
        </div>
        <div style={styles.dbTestRow}>
          <span style={styles.dbTestHint}>{t('siteSettings.testConnectionHint')}</span>
          <button
            type="button"
            disabled={!canTestConnection}
            title={canTestConnection ? t('siteSettings.testConnection') : t('siteSettings.testConnectionHint')}
            style={{ ...styles.btnGhost, ...(canTestConnection ? {} : styles.btnDisabled) }}
          >
            {t('siteSettings.testConnection')}
          </button>
        </div>
      </div>

      <Field label={t('siteSettings.projectCount')} hint={t('siteSettings.projectCountHint')}>
        <div style={styles.readonly}>{projectCount}</div>
      </Field>

      <Field label={t('siteSettings.createdAt')}>
        <div style={styles.readonly}>{new Date(site.createdAt).toLocaleString()}</div>
      </Field>

      <div style={styles.saveRow}>
        {blockedByProd && <span style={styles.saveBlockMsg}>{t('siteSettings.prodCoordOnly')}</span>}
        <button onClick={onClose} style={styles.btnGhost}>{t('common.close')}</button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          title={blockedByProd ? t('siteSettings.prodCoordOnly') : t('common.save')}
          style={{ ...styles.btnPrimary, ...(canSave ? {} : styles.btnDisabled) }}
        >
          {t('common.save')}
        </button>
      </div>

      {/* Danger zone — Coordinator 만 삭제 가능 */}
      <div style={styles.dangerZone}>
        <div style={styles.dangerHeader}>{t('siteSettings.dangerZone')}</div>
        {!confirmOpen ? (
          <div style={styles.dangerRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.dangerTitle}>{t('siteSettings.deleteTitle')}</div>
              <div style={styles.dangerDesc}>
                {t('siteSettings.deleteDesc')}
                <b> {t('siteSettings.deleteIrreversible')}</b>
              </div>
            </div>
            {isMaster ? (
              <button onClick={() => setConfirmOpen(true)} style={styles.btnDanger}>
                {t('siteSettings.deleteCta')}
              </button>
            ) : (
              <span style={styles.coordOnlyTag} title={t('siteSettings.deleteCoordOnly')}>
                {t('siteSettings.deleteCoordOnly')}
              </span>
            )}
          </div>
        ) : (
          <div style={styles.confirmBox}>
            <div style={styles.confirmTitle}>{t('siteSettings.confirmTitle', { name: site.name })}</div>
            <div style={styles.confirmDesc}>
              {t('siteSettings.confirmDescBefore')}<b>{projectCount}</b>{t('siteSettings.confirmDescAfter')}
            </div>
            <div style={styles.confirmInput}>
              {t('siteSettings.confirmInputBefore')}<code style={styles.confirmCode}>{site.name}</code>{t('siteSettings.confirmInputAfter')}
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={styles.input}
              placeholder={site.name}
              autoFocus
            />
            <div style={styles.confirmActions}>
              <button onClick={() => { setConfirmOpen(false); setConfirmText(''); }} style={styles.btnGhost}>
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== site.name}
                style={{
                  ...styles.btnDanger,
                  ...(confirmText !== site.name ? styles.btnDisabled : {}),
                }}
              >
                {t('siteSettings.deleteBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function EnvPills({ value, onChange, t }: { value: SiteEnv; onChange: (v: SiteEnv) => void; t: ReturnType<typeof useT> }) {
  return (
    <div style={styles.pillRow}>
      {ENV_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{ ...styles.pill, ...(value === o.value ? styles.pillActive : {}) }}
        >
          {t(o.key)}
        </button>
      ))}
    </div>
  );
}

function StagePills({
  value,
  onChange,
  byEnv,
  locks,
  t,
}: {
  value: ProjectEnvironment;
  onChange: (v: ProjectEnvironment) => void;
  byEnv: TobeDbByEnv;
  locks: TobeDbLocks;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div style={styles.pillRow}>
      {PROJECT_ENVIRONMENTS.map((env) => {
        const isActive = value === env;
        const hasData = !!byEnv[env];
        const isLocked = !!locks[env];
        return (
          <button
            key={env}
            type="button"
            onClick={() => onChange(env)}
            style={{ ...styles.pill, ...(isActive ? styles.pillActive : {}) }}
          >
            {hasData && <span style={styles.stageDot} />}
            {t(PROJECT_ENV_LABEL[env])}
            {isLocked && <span style={styles.stageLockIcon}>🔒</span>}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      {hint && <div style={styles.fieldHint}>{hint}</div>}
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  fieldHint: { fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  input: {
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  },
  readonly: {
    padding: '8px 10px',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontSize: 12.5,
    color: 'var(--text-2)',
    fontFamily: 'var(--mono)',
  },

  /* env pills */
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 4, padding: 2, background: 'var(--panel)' },
  pill: {
    flex: 1,
    minWidth: 0,
    padding: '6px 8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-2)',
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 3,
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  pillActive: {
    background: 'var(--navy-50)',
    color: 'var(--navy)',
    fontWeight: 600,
  },
  stageDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--navy)',
    display: 'inline-block',
  },
  stageLockIcon: { fontSize: 10, marginLeft: 2 },

  /* TO-BE DB card */
  dbCard: {
    border: '1px solid var(--navy)',
    background: 'var(--navy-50)',
    borderRadius: 5,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  dbHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--navy)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dbStageTag: {
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    padding: '1px 7px',
    background: 'var(--panel)',
    color: 'var(--navy)',
    border: '1px solid var(--navy)',
    borderRadius: 3,
    textTransform: 'none',
    letterSpacing: 0,
  },
  dbLockTag: {
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    padding: '1px 7px',
    background: 'var(--amber-50)',
    color: 'var(--amber)',
    border: '1px solid var(--amber)',
    borderRadius: 3,
    textTransform: 'none',
    letterSpacing: 0,
  },
  dbUnlockBtn: {
    padding: '4px 10px',
    fontSize: 11.5,
    fontWeight: 600,
    background: 'var(--panel)',
    color: 'var(--navy)',
    border: '1px solid var(--navy)',
    borderRadius: 3,
    cursor: 'pointer',
    textTransform: 'none',
    letterSpacing: 0,
  },
  dbCoordOnly: {
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    padding: '1px 7px',
    background: 'var(--amber-50)',
    color: 'var(--amber)',
    border: '1px solid var(--amber)',
    borderRadius: 3,
    textTransform: 'none',
    letterSpacing: 0,
  },
  saveBlockMsg: {
    flex: 1,
    fontSize: 11,
    color: 'var(--amber)',
    fontFamily: 'var(--mono)',
  },
  dbDesc: { fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', marginBottom: 2 },
  dbGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  dbGridHostPort: { display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 },
  dbTestRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  dbTestHint: { fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },

  saveRow: { display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8, marginBottom: 14 },
  btnPrimary: {
    padding: '7px 16px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '7px 14px',
    background: 'var(--panel)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-2)',
    borderRadius: 4,
    fontSize: 12.5,
    cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },

  /* Danger */
  dangerZone: {
    marginTop: 8,
    padding: 14,
    border: '1px solid var(--red)',
    borderRadius: 5,
    background: 'var(--red-50)',
  },
  dangerHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--red)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  dangerRow: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  dangerTitle: { fontSize: 12.5, fontWeight: 600, color: 'var(--red)' },
  dangerDesc: { fontSize: 11, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.5 },
  btnDanger: {
    padding: '6px 14px',
    background: 'var(--panel)',
    border: '1px solid var(--red)',
    color: 'var(--red)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  coordOnlyTag: {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    background: 'var(--amber-50)',
    color: 'var(--amber)',
    border: '1px solid var(--amber)',
    borderRadius: 3,
    whiteSpace: 'nowrap',
  },

  confirmBox: { background: 'var(--panel)', padding: 12, borderRadius: 4, border: '1px solid var(--red)' },
  confirmTitle: { fontSize: 13, fontWeight: 600, color: 'var(--red)' },
  confirmDesc: { fontSize: 11.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 },
  confirmInput: { fontSize: 11.5, color: 'var(--text-2)', marginTop: 12, marginBottom: 6 },
  confirmCode: {
    fontFamily: 'var(--mono)',
    background: 'var(--panel-2)',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 11,
  },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 },
};
