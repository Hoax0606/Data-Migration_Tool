import { useMemo, useRef, useState } from 'react';
import { useWorkspaceStore, type DdlFile } from '../store/workspace';
import { useAuthStore } from '../store/auth';
import { useT } from '../i18n';

/**
 * 탭바의 Settings 는 **Project Settings** — 선택된 프로젝트의 설정.
 * Account profile / Solution settings 는 사용자 메뉴의 모달과 별개.
 *
 * 섹션:
 *   1) DDL 파일 — 모두 편집
 *   2) Danger zone (프로젝트 삭제) — Coordinator 만
 */
export function SettingsPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master';
  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const addDdlFiles = useWorkspaceStore((s) => s.addDdlFiles);
  const removeDdlFile = useWorkspaceStore((s) => s.removeDdlFile);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const project = useMemo(() => projects.find((p) => p.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!project) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.h1}>{t('tab.settings')}</h1>
          <p style={styles.subtitle}>{t('projectSettings.subtitle')}</p>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyTitle}>{t('projectSettings.empty.title')}</div>
          <div style={styles.emptyHint}>{t('projectSettings.empty.hint')}</div>
          <div style={styles.emptyNote}>{t('projectSettings.empty.note')}</div>
        </div>
      </div>
    );
  }

  const handleFilesPicked = (filesList: FileList | null) => {
    if (!filesList) return;
    const now = new Date().toISOString();
    const incoming: DdlFile[] = Array.from(filesList).map((f) => ({
      name: f.name,
      size: f.size,
      uploadedAt: now,
    }));
    addDdlFiles(project.id, incoming);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = () => {
    if (!isMaster || confirmText !== project.name) return;
    deleteProject(project.id);
    setConfirmOpen(false);
    setConfirmText('');
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>{t('tab.settings')}</h1>
        <p style={styles.subtitle}>{project.name} · {t('projectSettings.subtitle')}</p>
      </div>

      {/* DDL section */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>{t('projectSettings.ddl.title')}</div>
            <div style={styles.cardDesc}>{t('projectSettings.ddl.desc')}</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql,.ddl,.txt"
            multiple
            onChange={(e) => handleFilesPicked(e.target.files)}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} style={styles.btnPrimary}>
            {t('projectSettings.ddl.add')}
          </button>
        </div>

        {project.ddlFiles.length === 0 ? (
          <div style={styles.ddlEmpty}>{t('projectSettings.ddl.empty')}</div>
        ) : (
          <ul style={styles.ddlList}>
            {project.ddlFiles.map((f) => (
              <li key={f.name} style={styles.ddlItem}>
                <span style={styles.ddlIcon}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 1.5h5.5L11 4v8.5H3z" />
                    <path d="M8.5 1.5V4H11" />
                  </svg>
                </span>
                <span style={styles.ddlName}>{f.name}</span>
                <span style={styles.ddlSize}>{formatSize(f.size)}</span>
                <span style={styles.ddlDate}>{new Date(f.uploadedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => removeDdlFile(project.id, f.name)}
                  style={styles.ddlRemoveBtn}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone — Coordinator 만 삭제 가능 */}
      <div style={styles.dangerZone}>
        <div style={styles.dangerHeader}>{t('projectSettings.dangerZone')}</div>
        {!confirmOpen ? (
          <div style={styles.dangerRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.dangerTitle}>{t('projectSettings.delete.title')}</div>
              <div style={styles.dangerDesc}>
                {t('projectSettings.delete.desc')}
                <b> {t('projectSettings.delete.irreversible')}</b>
              </div>
            </div>
            {isMaster ? (
              <button onClick={() => setConfirmOpen(true)} style={styles.btnDanger}>
                {t('projectSettings.delete.cta')}
              </button>
            ) : (
              <span style={styles.coordOnlyTag} title={t('projectSettings.delete.coordOnly')}>
                {t('projectSettings.delete.coordOnly')}
              </span>
            )}
          </div>
        ) : (
          <div style={styles.confirmBox}>
            <div style={styles.confirmTitle}>{t('projectSettings.delete.confirmTitle', { name: project.name })}</div>
            <div style={styles.confirmInput}>
              {t('projectSettings.delete.confirmInputBefore')}
              <code style={styles.confirmCode}>{project.name}</code>
              {t('projectSettings.delete.confirmInputAfter')}
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={styles.confirmTextInput}
              placeholder={project.name}
              autoFocus
            />
            <div style={styles.confirmActions}>
              <button onClick={() => { setConfirmOpen(false); setConfirmText(''); }} style={styles.btnGhost}>
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== project.name}
                style={{
                  ...styles.btnDanger,
                  ...(confirmText !== project.name ? styles.btnDisabled : {}),
                }}
              >
                {t('projectSettings.delete.btn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: 18 },
  h1: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: -0.2,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  empty: {
    background: 'var(--panel)',
    border: '1px dashed var(--border-strong)',
    borderRadius: 6,
    padding: '50px 24px',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 },
  emptyHint: { fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 10 },
  emptyNote: { marginTop: 16, fontSize: 11, color: 'var(--text-4)' },

  /* Card */
  card: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  cardDesc: { fontSize: 11.5, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.5 },

  btnPrimary: {
    padding: '6px 12px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  /* DDL list */
  ddlEmpty: {
    padding: '24px 16px',
    fontSize: 12,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    textAlign: 'center',
  },
  ddlList: { margin: 0, padding: 0, listStyle: 'none' },
  ddlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
    fontSize: 12,
  },
  ddlIcon: { color: 'var(--navy)', display: 'inline-flex' },
  ddlName: { flex: 1, color: 'var(--text)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  ddlSize: { width: 70, textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  ddlDate: { width: 95, textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  ddlRemoveBtn: {
    width: 22,
    height: 22,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-3)',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
  },

  /* Danger zone */
  dangerZone: {
    padding: 14,
    border: '1px solid var(--red)',
    borderRadius: 5,
    background: 'var(--red-50)',
    marginTop: 14,
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
  btnGhost: {
    padding: '6px 14px',
    background: 'var(--panel)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-2)',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
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
  confirmInput: { fontSize: 11.5, color: 'var(--text-2)', marginTop: 12, marginBottom: 6 },
  confirmCode: {
    fontFamily: 'var(--mono)',
    background: 'var(--panel-2)',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 11,
  },
  confirmTextInput: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
  },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 },
};
