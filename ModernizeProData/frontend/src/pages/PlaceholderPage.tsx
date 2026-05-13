interface Props {
  title: string;
  description?: string;
}

/**
 * 미구현 페이지의 placeholder.
 * Prototype 의 EmptyState 패턴을 따름.
 */
export function PlaceholderPage({ title, description }: Props) {
  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>{title}</h1>
        <p style={styles.subtitle}>
          {description ?? '이 화면은 추후 구현 예정.'}
        </p>
      </div>

      <div style={styles.empty}>
        <div style={styles.emptyTitle}>아직 구현되지 않았습니다</div>
        <div style={styles.emptyHint}>
          개발 진행 중. 팀원에게 분배되어 작업 예정.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: 16 },
  h1: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: -0.2,
  },
  subtitle: {
    margin: '3px 0 0',
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  empty: {
    background: 'var(--panel)',
    border: '1px dashed var(--border-strong)',
    borderRadius: 6,
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-3)',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 11,
    color: 'var(--text-4)',
    fontFamily: 'var(--mono)',
  },
};
