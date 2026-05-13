import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['Ctrl', 'B'], label: 'Toggle sidebar' },
  { keys: ['Ctrl', 'K'], label: 'Search projects (placeholder)' },
  { keys: ['Ctrl', 'N'], label: 'New project (placeholder)' },
  { keys: ['Esc'], label: 'Close modal / dropdown' },
];

const TIPS: string[] = [
  'Dashboard → 한 프로젝트의 TO-BE 테이블 매핑 상태를 한눈에.',
  'Mapping → AS-IS · TO-BE 컬럼 매핑 정의. 변경 시 자동 lock.',
  'Versions → 매핑 스냅샷 (master 만 approve 가능).',
  'Execution → Run 실행·예약·진행상황·격리 처리.',
  'Artifacts → 검증 리포트·매핑 스냅샷·audit log export.',
  'Log viewer → 작업·시스템 audit log 조회.',
];

export function HelpModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Help & shortcuts" width={460}>
      <Section title="Keyboard shortcuts">
        <table style={styles.kbTable}>
          <tbody>
            {SHORTCUTS.map((s, i) => (
              <tr key={i}>
                <td style={styles.kbKeys}>
                  {s.keys.map((k, j) => (
                    <span key={j}>
                      <kbd style={styles.kbd}>{k}</kbd>
                      {j < s.keys.length - 1 && <span style={styles.kbSep}>+</span>}
                    </span>
                  ))}
                </td>
                <td style={styles.kbLabel}>{s.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="What each tab does">
        <ul style={styles.tipsList}>
          {TIPS.map((t, i) => <li key={i} style={styles.tipsItem}>{t}</li>)}
        </ul>
      </Section>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 10.5,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 600,
    marginBottom: 8,
  },
  kbTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  kbKeys: {
    padding: '4px 0',
    width: 140,
    whiteSpace: 'nowrap',
  },
  kbSep: { padding: '0 4px', color: 'var(--text-4)', fontSize: 10 },
  kbd: {
    display: 'inline-block',
    padding: '1px 6px',
    fontFamily: 'var(--mono)',
    fontSize: 10.5,
    background: 'var(--panel-2)',
    border: '1px solid var(--border-strong)',
    borderRadius: 3,
    color: 'var(--text-2)',
  },
  kbLabel: {
    padding: '4px 0',
    color: 'var(--text-2)',
  },
  tipsList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12,
    color: 'var(--text-2)',
  },
  tipsItem: { lineHeight: 1.7 },
};
