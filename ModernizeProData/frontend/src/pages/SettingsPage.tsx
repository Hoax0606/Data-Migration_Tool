/**
 * 탭바의 Settings 는 **Project Settings** — 선택된 프로젝트의 설정.
 *  - AS-IS / TO-BE 연결
 *  - 매핑 정책
 *  - 알림 구독
 *  - 등등
 *
 * Account profile / Solution settings 는 사용자 메뉴의 모달과 별개.
 *
 * 프로젝트가 아직 없어 현재는 안내 메시지만.
 */
export function SettingsPage() {
  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>Project Settings</h1>
        <p style={styles.subtitle}>
          현재 프로젝트의 AS-IS / TO-BE · 매핑 정책 · 알림 구독 설정
        </p>
      </div>

      <div style={styles.empty}>
        <div style={styles.emptyTitle}>프로젝트가 선택되지 않았습니다</div>
        <div style={styles.emptyHint}>
          좌측 사이드바에서 프로젝트를 만들거나 선택한 뒤 설정에 진입하세요.
        </div>
        <div style={styles.emptyNote}>
          (도구 전역 설정은 좌측 하단 사용자 메뉴 → <b>Solution settings</b> 에서)
        </div>
      </div>
    </div>
  );
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
  emptyTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-3)',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 12,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    marginBottom: 10,
  },
  emptyNote: {
    marginTop: 16,
    fontSize: 11,
    color: 'var(--text-4)',
  },
};
