import { useEffect, useMemo, useState } from 'react';
import { useWorkspaceStore, type ProjectPhase } from '../store/workspace';
import { useSnapshotsStore, type SnapshotStatus, type SnapshotType } from '../store/snapshots';
import { useAuthStore } from '../store/auth';
import { useT, type TranslationKey } from '../i18n';

/**
 * Versions tab — 매핑 스냅샷 관리.
 *  - 스냅샷 생성 = commit (draft 상태, 로컬 rollback 지점)
 *  - Request = coordinator 에게 승인 요청 (draft → pending)
 *  - Approve / Reject 는 All Projects → Approvals 에서만 처리
 */
export function VersionsPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);

  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const project = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const allSnapshots = useSnapshotsStore((s) => s.snapshots);
  const fetchByProject = useSnapshotsStore((s) => s.fetchByProject);
  const snapshots = useMemo(
    () => allSnapshots.filter((s) => s.projectId === activeProjectId).slice().reverse(),
    [allSnapshots, activeProjectId],
  );
  const createSnapshot = useSnapshotsStore((s) => s.createSnapshot);
  const requestSnapshot = useSnapshotsStore((s) => s.requestSnapshot);
  const deleteSnapshot = useSnapshotsStore((s) => s.deleteSnapshot);

  // 마운트 시 + 프로젝트 변경 시 서버에서 fetch
  useEffect(() => {
    if (activeProjectId) void fetchByProject(activeProjectId);
  }, [activeProjectId, fetchByProject]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<SnapshotType>('mapping');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // cutover snapshot 확인 다이얼로그
  const [cutoverConfirmOpen, setCutoverConfirmOpen] = useState(false);

  // request 확인
  const [requestId, setRequestId] = useState<string | null>(null);

  // rehearsal 이후 phase 에서만 cutover snapshot 생성 가능
  const POST_REHEARSAL: ProjectPhase[] = ['rehearsal', 'ready', 'cutover', 'hypercare', 'done'];
  const canCreateCutover = project ? POST_REHEARSAL.includes(project.phase) : false;

  if (!project) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.h1}>{t('versions.title')}</h1>
          <p style={styles.subtitle}>{t('versions.subtitle')}</p>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyTitle}>{t('versions.empty.noProject')}</div>
        </div>
      </div>
    );
  }

  const resetCreate = () => {
    setCreateOpen(false);
    setCreateType('mapping');
    setNewName('');
    setNewDesc('');
  };

  const openCreate = (type: SnapshotType) => {
    if (type === 'cutover') {
      setCutoverConfirmOpen(true);
      return;
    }
    setCreateType(type);
    setCreateOpen(true);
  };

  const handleCutoverConfirm = () => {
    setCutoverConfirmOpen(false);
    setCreateType('cutover');
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createSnapshot(project.id, {
      name,
      type: createType,
      description: newDesc.trim() || undefined,
      tableCount: project.tableCount,
      ruleCount: 0,
    });
    resetCreate();
  };

  const handleRequest = async (id: string) => {
    await requestSnapshot(id);
    // Phase 전환은 approve 시점에 처리 (ApprovalsPage)
    setRequestId(null);
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>{t('versions.title')}</h1>
        <p style={styles.subtitle}>{project.name} · {t('versions.subtitle')}</p>
      </div>

      <div style={styles.toolbar}>
        {snapshots.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm('Delete all snapshots in this project?')) return;
              for (const s of snapshots) await deleteSnapshot(s.id);
            }}
            style={{ ...styles.btnGhost, color: 'var(--red)', borderColor: 'var(--red)' }}
          >
            Delete all ({snapshots.length})
          </button>
        )}
        <div style={{ flex: 1 }} />
        {!createOpen ? (
          <>
            <button onClick={() => openCreate('mapping')} style={styles.btnPrimary}>
              {t('versions.create')}
            </button>
            <button
              onClick={() => openCreate('cutover')}
              style={styles.btnCutover}
            >
              {t('versions.createCutover')}
            </button>
          </>
        ) : (
          <button onClick={resetCreate} style={styles.btnGhost}>
            {t('versions.cancelCreate')}
          </button>
        )}
      </div>

      {/* Cutover snapshot 확인 다이얼로그 */}
      {cutoverConfirmOpen && (
        <div style={styles.cutoverConfirm}>
          <div style={styles.cutoverConfirmTitle}>{t('versions.cutoverConfirm.title')}</div>
          <div style={styles.cutoverConfirmDesc}>{t('versions.cutoverConfirm.desc')}</div>
          <div style={styles.cutoverConfirmActions}>
            <button onClick={() => setCutoverConfirmOpen(false)} style={styles.btnGhost}>{t('common.cancel')}</button>
            <button onClick={handleCutoverConfirm} style={styles.btnCutover}>{t('versions.cutoverConfirm.proceed')}</button>
          </div>
        </div>
      )}

      {createOpen && (
        <form onSubmit={handleCreate} style={styles.createForm}>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: createType === 'cutover' ? 'var(--red)' : 'var(--navy)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {createType === 'cutover' ? t('versions.type.cutover') : t('versions.type.mapping')} snapshot
          </div>
          <div style={styles.createRow}>
            <Field label={t('versions.create.name')}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('versions.create.namePh')}
                style={styles.input}
                autoFocus
                required
              />
            </Field>
            <Field label={t('versions.create.desc')}>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t('versions.create.descPh')}
                style={styles.input}
              />
            </Field>
          </div>
          <div style={styles.createActions}>
            <button type="submit" style={{ ...styles.btnPrimary, ...(newName.trim() ? {} : styles.btnDisabled) }} disabled={!newName.trim()}>
              {t('versions.create.submit')}
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <Th>{t('versions.col.name')}</Th>
              <Th>{t('versions.col.type')}</Th>
              <Th>{t('versions.col.status')}</Th>
              <Th>{t('versions.col.creator')}</Th>
              <Th>{t('versions.col.size')}</Th>
              <Th>{t('versions.col.approval')}</Th>
              <Th>{t('versions.col.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {snapshots.length === 0 ? (
              <tr><td colSpan={7} style={styles.emptyRow}>{t('versions.empty')}</td></tr>
            ) : (
              snapshots.map((s, i) => {
                const rowBg = i % 2 ? 'var(--zebra)' : 'transparent';

                /* ── request 확인 바 ── */
                if (requestId === s.id) {
                  return (
                    <tr key={s.id} style={{ background: 'var(--navy-50)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={7} style={styles.confirmCell}>
                        <div style={styles.confirmBar}>
                          <span style={styles.confirmText}>
                            {t('versions.confirmRequestPre')}<b>{s.name}</b>{t('versions.confirmRequestPost')}
                          </span>
                          <div style={{ flex: 1 }} />
                          <button onClick={() => setRequestId(null)} style={styles.miniBtn}>{t('common.cancel')}</button>
                          <button onClick={() => handleRequest(s.id)} style={styles.miniBtnRequest}>{t('versions.confirmRequest')}</button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={s.id} style={{ background: rowBg, borderBottom: '1px solid var(--border)' }}>
                    <td style={styles.td}>
                      <div style={styles.nameMain}>{s.name}</div>
                      {s.description && <div style={styles.nameDesc}>{s.description}</div>}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.typeBadge, ...((s.type ?? 'mapping') === 'cutover' ? styles.typeCutover : styles.typeMapping) }}>
                        {(s.type ?? 'mapping') === 'cutover' ? t('versions.type.cutover') : t('versions.type.mapping')}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...statusTone(s.status) }}>{t(STATUS_KEY[s.status])}</span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                      <div>{s.createdBy}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 10.5 }}>{new Date(s.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                      {s.tableCount} · {s.ruleCount}
                    </td>
                    <td style={{ ...styles.td, fontSize: 11, color: 'var(--text-2)' }}>
                      {s.status === 'approved' && s.approvedBy && s.approvedAt ? (
                        <span style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                          {s.approvedBy} · {new Date(s.approvedAt).toLocaleDateString()}
                        </span>
                      ) : s.status === 'rejected' && s.rejectedBy && s.rejectedAt ? (
                        <div>
                          <div style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                            {s.rejectedBy} · {new Date(s.rejectedAt).toLocaleDateString()}
                          </div>
                          {s.rejectionReason && (
                            <div style={styles.reasonNote}>{t('versions.reasonPrefix')}{s.rejectionReason}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button style={{ ...styles.miniBtn, opacity: 0.55, cursor: 'not-allowed' }} disabled title={t('versions.view')}>
                          {t('versions.view')}
                        </button>
                        {s.status === 'draft' && (
                          <button onClick={() => setRequestId(s.id)} style={styles.miniBtnRequest}>
                            {t('versions.request')}
                          </button>
                        )}
                        {s.status === 'pending' && (
                          <span style={styles.pendingTag}>{t('versions.requested')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_KEY: Record<SnapshotStatus, TranslationKey> = {
  draft:    'versions.status.draft',
  pending:  'versions.status.pending',
  approved: 'versions.status.approved',
  rejected: 'versions.status.rejected',
};

function statusTone(s: SnapshotStatus): React.CSSProperties {
  switch (s) {
    case 'draft':    return { background: 'var(--panel-2)', color: 'var(--text-3)', borderColor: 'var(--border-strong)' };
    case 'pending':  return { background: 'var(--amber-50)', color: 'var(--amber)', borderColor: 'var(--amber)' };
    case 'approved': return { background: 'var(--green-50)', color: 'var(--green)', borderColor: 'var(--green)' };
    case 'rejected': return { background: 'var(--red-50)',   color: 'var(--red)',   borderColor: 'var(--red)' };
  }
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: 14 },
  h1: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.2 },
  subtitle: { margin: '4px 0 0', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },

  toolbar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },

  cutoverConfirm: {
    background: 'var(--red-50)',
    border: '1px solid var(--red)',
    borderRadius: 5,
    padding: 14,
    marginBottom: 12,
  },
  cutoverConfirmTitle: { fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 6 },
  cutoverConfirmDesc: { fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 },
  cutoverConfirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 6 },

  createForm: {
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
  },
  createRow: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, alignItems: 'end' },
  createActions: { display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 11.5, fontWeight: 600, color: 'var(--text)' },
  input: {
    padding: '7px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 12.5,
    outline: 'none',
    width: '100%',
  },

  tableWrap: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--mono)',
    background: 'var(--panel-2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
  td: { padding: '8px 12px', verticalAlign: 'top' },
  nameMain: { fontWeight: 600, color: 'var(--text)', fontSize: 12.5 },
  nameDesc: { fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 },

  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    border: '1px solid',
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reasonNote: {
    fontSize: 10.5,
    color: 'var(--text-3)',
    marginTop: 3,
    fontFamily: 'var(--mono)',
    fontStyle: 'italic',
  },

  emptyRow: { padding: '32px 12px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 },
  empty: { background: 'var(--panel)', border: '1px dashed var(--border-strong)', borderRadius: 6, padding: '50px 24px', textAlign: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-3)' },

  typeBadge: {
    display: 'inline-block', padding: '2px 7px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
    border: '1px solid', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  typeMapping: { background: 'var(--navy-50)', color: 'var(--navy)', borderColor: 'var(--navy)' },
  typeCutover: { background: 'var(--red-50)', color: 'var(--red)', borderColor: 'var(--red)' },

  btnPrimary: {
    padding: '6px 12px', background: 'var(--navy)', color: '#fff', border: '1px solid var(--navy)',
    borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnCutover: {
    padding: '6px 12px', background: 'var(--panel)', color: 'var(--red)', border: '1px solid var(--red)',
    borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnGhost: {
    padding: '6px 12px', background: 'var(--panel)', border: '1px solid var(--border-strong)',
    color: 'var(--text-2)', borderRadius: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },

  miniBtn: {
    padding: '3px 9px', fontSize: 11, border: '1px solid var(--border-strong)',
    background: 'var(--panel)', color: 'var(--text-2)', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  miniBtnRequest: {
    padding: '3px 9px', fontSize: 11, border: '1px solid var(--navy)',
    background: 'var(--panel)', color: 'var(--navy)', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
  },
  pendingTag: {
    padding: '3px 8px', fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
    background: 'var(--amber-50)', color: 'var(--amber)', border: '1px solid var(--amber)',
    borderRadius: 3, whiteSpace: 'nowrap',
  },

  /* inline confirm bar */
  confirmCell: { padding: '10px 12px' },
  confirmBar: { display: 'flex', alignItems: 'center', gap: 8, width: '100%' },
  confirmText: { fontSize: 12, color: 'var(--text)', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' },
};
