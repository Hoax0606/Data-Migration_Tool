import { useMemo } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import { useSnapshotsStore } from '../store/snapshots';
import { useT } from '../i18n';

/**
 * Execution tab (project level) — 현재 프로젝트의 cutover 상태 read-only.
 * cutover 시작·중단·완료 액션은 All Projects → Cutover 탭 (Coordinator) 에서 관리.
 */
export function ExecutionPage() {
  const t = useT();
  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const project = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const allSnapshots = useSnapshotsStore((s) => s.snapshots);

  if (!project) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.h1}>{t('execution.title')}</h1>
          <p style={styles.subtitle}>{t('execution.subtitle')}</p>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyTitle}>{t('execution.empty.noProject')}</div>
        </div>
      </div>
    );
  }

  const cutover = project.cutover;
  const snapshot = cutover?.snapshotId ? allSnapshots.find((s) => s.id === cutover.snapshotId) : undefined;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>{t('execution.title')}</h1>
        <p style={styles.subtitle}>{project.name} · {t('execution.subtitle')}</p>
      </div>

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>{t('execution.cutover.title')}</div>
            <div style={styles.cardDesc}>{t('execution.cutover.desc')}</div>
          </div>
          <span style={styles.phaseTag}>{project.phase}</span>
        </div>

        <div style={styles.cardBody}>
          {/* phase-별 read-only 안내 */}
          {project.phase === 'rehearsal' && (
            <div style={styles.bodyDesc}>{t('execution.cutover.ready.title')}</div>
          )}
          {project.phase === 'cutover' && (
            <div style={styles.bodyDesc}>{t('execution.cutover.running.title')}</div>
          )}
          {project.phase === 'hypercare' && (
            <>
              <div style={styles.bodyDesc}>{t('execution.cutover.hypercare.title')}</div>
              <div style={styles.bodyDescSub}>{t('execution.cutover.hypercare.desc')}</div>
            </>
          )}
          {project.phase === 'done' && (
            <div style={styles.bodyDesc}>{t('execution.cutover.done.title')}</div>
          )}
          {(project.phase === 'planning' || project.phase === 'analysis' || project.phase === 'sign-off') && (
            <div style={styles.bodyDescMuted}>
              {t('execution.cutover.notReady')} · {t('execution.cutover.currentPhase', { phase: project.phase })}
            </div>
          )}

          {/* 메타 정보 */}
          {snapshot && (
            <div style={styles.metaLine}>
              {t('execution.cutover.snapshot')}: <b>{snapshot.name}</b>
            </div>
          )}
          {cutover?.startedAt && (
            <div style={styles.metaLine}>
              {t('execution.cutover.startedBy', { who: cutover.startedBy ?? '—', when: new Date(cutover.startedAt).toLocaleString() })}
            </div>
          )}
          {cutover?.finishedAt && (
            <div style={styles.metaLine}>
              {t('execution.cutover.finishedBy', { who: cutover.finishedBy ?? '—', when: new Date(cutover.finishedAt).toLocaleString() })}
            </div>
          )}
          {cutover?.abortedAt && (!cutover.startedAt || new Date(cutover.abortedAt) > new Date(cutover.startedAt)) && (
            <div style={styles.abortBox}>
              <div>
                {t('execution.cutover.lastAbort', { who: cutover.abortedBy ?? '—', when: new Date(cutover.abortedAt).toLocaleString() })}
              </div>
              {cutover.abortReason && (
                <div style={styles.abortReasonNote}>
                  {t('execution.cutover.lastAbortReason', { reason: cutover.abortReason })}
                </div>
              )}
            </div>
          )}

          <div style={styles.movedHint}>{t('execution.cutover.movedToSite')}</div>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: 14 },
  h1: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.2 },
  subtitle: { margin: '4px 0 0', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  empty: { background: 'var(--panel)', border: '1px dashed var(--border-strong)', borderRadius: 6, padding: '50px 24px', textAlign: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-3)' },

  card: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  cardHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  cardDesc: { fontSize: 11.5, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.5 },
  cardBody: { padding: '14px 16px' },

  phaseTag: {
    padding: '2px 10px', fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
    background: 'var(--panel-2)', color: 'var(--text-2)', border: '1px solid var(--border-strong)',
    borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap',
  },

  bodyDesc:       { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 },
  bodyDescSub:    { fontSize: 12, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 },
  bodyDescMuted:  { fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 8 },
  metaLine:       { fontSize: 11.5, color: 'var(--text-2)', fontFamily: 'var(--mono)', marginBottom: 4 },
  abortBox: {
    marginTop: 8,
    padding: '8px 11px',
    background: 'var(--red-50)',
    border: '1px solid var(--red)',
    borderRadius: 4,
    fontSize: 11.5,
    color: 'var(--red)',
    fontFamily: 'var(--mono)',
  },
  abortReasonNote: { fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontFamily: 'var(--mono)', fontStyle: 'italic' },

  movedHint: {
    marginTop: 14,
    padding: '8px 11px',
    fontSize: 11.5,
    color: 'var(--navy)',
    fontFamily: 'var(--mono)',
    background: 'var(--navy-50)',
    border: '1px solid var(--navy)',
    borderRadius: 4,
  },
};
