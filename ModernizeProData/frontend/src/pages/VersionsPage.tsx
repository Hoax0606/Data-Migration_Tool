import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import { useSnapshotsStore, type SnapshotStatus } from '../store/snapshots';
import { useAuthStore } from '../store/auth';
import { useT, type TranslationKey } from '../i18n';

/**
 * Versions tab — 매핑 스냅샷 관리.
 *  - Worker: 스냅샷 생성 (status=pending)
 *  - Coordinator: pending 스냅샷 approve / reject
 */
export function VersionsPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master';

  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const project = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const allSnapshots = useSnapshotsStore((s) => s.snapshots);
  const snapshots = useMemo(
    () => allSnapshots.filter((s) => s.projectId === activeProjectId).slice().reverse(),
    [allSnapshots, activeProjectId],
  );
  const createSnapshot = useSnapshotsStore((s) => s.createSnapshot);
  const approveSnapshot = useSnapshotsStore((s) => s.approveSnapshot);
  const rejectSnapshot = useSnapshotsStore((s) => s.rejectSnapshot);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // 행 별 인라인 상태
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
    setNewName('');
    setNewDesc('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createSnapshot({
      projectId: project.id,
      name,
      description: newDesc.trim() || undefined,
      createdBy: user?.username ?? '—',
      tableCount: project.tableCount,
      ruleCount: 0, // placeholder
    });
    resetCreate();
  };

  const handleApprove = (id: string) => {
    approveSnapshot(id, user?.username ?? 'coordinator');
    setApproveId(null);
  };

  const handleReject = (id: string) => {
    const reason = rejectReason.trim();
    if (!reason) return;
    rejectSnapshot(id, user?.username ?? 'coordinator', reason);
    setRejectId(null);
    setRejectReason('');
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>{t('versions.title')}</h1>
        <p style={styles.subtitle}>{project.name} · {t('versions.subtitle')}</p>
      </div>

      <div style={styles.toolbar}>
        <div style={{ flex: 1 }} />
        {!createOpen ? (
          <button onClick={() => setCreateOpen(true)} style={styles.btnPrimary}>
            {t('versions.create')}
          </button>
        ) : (
          <button onClick={resetCreate} style={styles.btnGhost}>
            {t('versions.cancelCreate')}
          </button>
        )}
      </div>

      {createOpen && (
        <form onSubmit={handleCreate} style={styles.createForm}>
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
              <Th>{t('versions.col.status')}</Th>
              <Th>{t('versions.col.creator')}</Th>
              <Th>{t('versions.col.size')}</Th>
              <Th>{t('versions.col.approval')}</Th>
              <Th>{t('versions.col.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {snapshots.length === 0 ? (
              <tr><td colSpan={6} style={styles.emptyRow}>{t('versions.empty')}</td></tr>
            ) : (
              snapshots.map((s, i) => {
                const rowBg = i % 2 ? 'var(--zebra)' : 'transparent';

                /* ── inline approve confirm bar ── */
                if (approveId === s.id) {
                  return (
                    <tr key={s.id} style={{ background: 'var(--green-50)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={6} style={styles.confirmCell}>
                        <div style={styles.confirmBar}>
                          <span style={styles.confirmText}>
                            {t('versions.confirmApprovePre')}<b>{s.name}</b>{t('versions.confirmApprovePost')}
                          </span>
                          <div style={{ flex: 1 }} />
                          <button onClick={() => setApproveId(null)} style={styles.miniBtn}>{t('common.cancel')}</button>
                          <button onClick={() => handleApprove(s.id)} style={styles.miniBtnApprove}>{t('versions.confirmApprove')}</button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                /* ── inline reject form ── */
                if (rejectId === s.id) {
                  return (
                    <tr key={s.id} style={{ background: 'var(--red-50)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={6} style={styles.confirmCell}>
                        <div style={styles.rejectBar}>
                          <div style={styles.rejectLabel}>{t('versions.rejectReasonLabel')} · <b>{s.name}</b></div>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t('versions.rejectReasonPh')}
                            style={styles.rejectInput}
                            rows={2}
                            autoFocus
                          />
                          <div style={styles.rejectActions}>
                            <button onClick={() => { setRejectId(null); setRejectReason(''); }} style={styles.miniBtn}>
                              {t('common.cancel')}
                            </button>
                            <button
                              onClick={() => handleReject(s.id)}
                              disabled={!rejectReason.trim()}
                              style={{ ...styles.miniBtnDanger, ...(rejectReason.trim() ? {} : styles.btnDisabled) }}
                            >
                              {t('versions.rejectSubmit')}
                            </button>
                          </div>
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
                        {s.status === 'pending' && (
                          isMaster ? (
                            <>
                              <button onClick={() => setApproveId(s.id)} style={styles.miniBtnApprove}>
                                {t('versions.approve')}
                              </button>
                              <button onClick={() => { setRejectId(s.id); setRejectReason(''); }} style={styles.miniBtnDanger}>
                                {t('versions.reject')}
                              </button>
                            </>
                          ) : (
                            <span style={styles.coordOnlyTag} title={t('versions.approveCoord')}>
                              {t('versions.approveCoord')}
                            </span>
                          )
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
  pending:  'versions.status.pending',
  approved: 'versions.status.approved',
  rejected: 'versions.status.rejected',
};

function statusTone(s: SnapshotStatus): React.CSSProperties {
  switch (s) {
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
    <label style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: 14 },
  h1: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.2 },
  subtitle: { margin: '4px 0 0', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },

  toolbar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },

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

  btnPrimary: {
    padding: '6px 12px', background: 'var(--navy)', color: '#fff', border: '1px solid var(--navy)',
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
  miniBtnApprove: {
    padding: '3px 9px', fontSize: 11, border: '1px solid var(--green)',
    background: 'var(--panel)', color: 'var(--green)', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
  },
  miniBtnDanger: {
    padding: '3px 9px', fontSize: 11, border: '1px solid var(--red)',
    background: 'var(--panel)', color: 'var(--red)', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
  },
  coordOnlyTag: {
    padding: '3px 8px',
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    background: 'var(--amber-50)',
    color: 'var(--amber)',
    border: '1px solid var(--amber)',
    borderRadius: 3,
    whiteSpace: 'nowrap',
  },

  /* inline confirm / reject bars */
  confirmCell: { padding: '10px 12px' },
  confirmBar: { display: 'flex', alignItems: 'center', gap: 8, width: '100%' },
  confirmText: { fontSize: 12, color: 'var(--text)', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' },

  rejectBar: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' },
  rejectLabel: { fontSize: 11.5, fontWeight: 600, color: 'var(--red)' },
  rejectInput: {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--red)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 12.5,
    outline: 'none',
    resize: 'vertical',
    minHeight: 48,
    fontFamily: 'var(--mono)',
  },
  rejectActions: { display: 'flex', justifyContent: 'flex-end', gap: 6 },
};
