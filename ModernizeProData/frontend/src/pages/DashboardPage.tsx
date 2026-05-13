import { useEffect, useState } from 'react';
import { healthApi, type HealthInfo } from '../api/auth';

/**
 * Migration readiness dashboard.
 * Prototype 의 상단 stat row + 필터 + 테이블 패턴을 그대로 구현.
 * 데이터는 아직 없어서 0 / empty 로 표시.
 */
export function DashboardPage() {
  const [info, setInfo] = useState<HealthInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ready' | 'review' | 'unbound'>('all');

  useEffect(() => {
    healthApi.info().then(setInfo).catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div>
      {/* Stat row */}
      <div style={styles.statRow}>
        <Stat label="TO-BE TABLES" value="0" />
        <Stat label="READY" value="0" sub="all checks pass" subColor="var(--green)" />
        <Stat label="REVIEW" value="0" sub="errs / pending approval" subColor="var(--red)" />
        <Stat label="UNBOUND" value="0" sub="no source assigned" subColor="var(--amber)" />
        <Stat label="SNAPSHOT" value="—" sub="no snapshot" mono />
        <Stat label="LAST RUN" value="—" sub="no run yet" mono />
      </div>

      {/* Filter + actions */}
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All <Cnt>0</Cnt></FilterPill>
          <FilterPill active={filter === 'ready'} onClick={() => setFilter('ready')}>Ready <Cnt>0</Cnt></FilterPill>
          <FilterPill active={filter === 'review'} onClick={() => setFilter('review')}>Review <Cnt>0</Cnt></FilterPill>
          <FilterPill active={filter === 'unbound'} onClick={() => setFilter('unbound')}>Unbound <Cnt>0</Cnt></FilterPill>
        </div>
        <div style={{ flex: 1 }} />
        <button style={styles.btnSecondary} disabled>Open Versions</button>
        <button style={styles.btnPrimary} disabled>Go to Execution</button>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <Th>TO-BE TABLE</Th>
              <Th>AS-IS SOURCE(S)</Th>
              <Th>COLUMN COVERAGE</Th>
              <Th align="right">ISSUES</Th>
              <Th>APPROVAL</Th>
              <Th>READINESS</Th>
              <Th width={20} />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} style={styles.emptyRow}>
                <div style={styles.emptyTitle}>아직 매핑 대상이 없습니다</div>
                <div style={styles.emptyHint}>
                  TO-BE DDL 을 임포트하면 여기에 테이블 목록과 매핑 상태가 표시됩니다.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.statusbar}>
        <div>0 of 0 tables · sort: name asc</div>
        <div style={{ flex: 1 }} />
        <div style={styles.dim}>
          click a row → Mapping tab · click approval chip → Versions tab
        </div>
      </div>

      {/* 도구 정보 (개발 단계 sanity check 용) */}
      <div style={{ marginTop: 18 }}>
        <div style={styles.devCard}>
          <div style={styles.devCardHeader}>도구 정보 (개발 검증용)</div>
          <div style={styles.devCardBody}>
            {error && <div style={styles.error}>오류: {error}</div>}
            {info && (
              <div style={styles.devGrid}>
                <Kv k="Name" v={info.name} />
                <Kv k="Mode" v={info.mode} badge />
                <Kv k="Java" v={info.javaVersion} mono />
                <Kv k="OS" v={info.osName} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

function Stat({ label, value, sub, subColor, mono }: { label: string; value: string; sub?: string; subColor?: string; mono?: boolean }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, ...(mono ? { fontFamily: 'var(--mono)' } : {}) }}>{value}</div>
      {sub && <div style={{ ...styles.statSub, ...(subColor ? { color: subColor } : {}) }}>{sub}</div>}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? 'var(--navy-50)' : 'var(--panel)',
        border: '1px solid ' + (active ? 'var(--navy)' : 'var(--border)'),
        color: active ? 'var(--navy)' : 'var(--text-2)',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

function Cnt({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{children}</span>
  );
}

function Th({ children, align, width }: { children?: React.ReactNode; align?: 'left' | 'right'; width?: number }) {
  return (
    <th style={{
      padding: '6px 12px',
      textAlign: align ?? 'left',
      width,
      fontWeight: 500,
      color: 'var(--text-3)',
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      background: 'var(--panel-2)',
      borderBottom: '1px solid var(--border)',
    }}>{children}</th>
  );
}

function Kv({ k, v, mono, badge }: { k: string; v: string; mono?: boolean; badge?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)', width: 70, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</span>
      <span style={{ fontSize: 12, color: 'var(--text)', ...(mono ? { fontFamily: 'var(--mono)' } : {}) }}>
        {badge ? <span style={styles.modeBadge}>{v}</span> : v}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  /* Stat row */
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 1,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  stat: {
    background: 'var(--panel)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 600,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: -0.5,
    lineHeight: 1,
  },
  statSub: {
    fontSize: 10.5,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  filterGroup: {
    display: 'flex',
    gap: 4,
  },
  btnPrimary: {
    padding: '6px 12px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '6px 12px',
    background: 'var(--panel)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },

  /* Table */
  tableWrap: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  emptyRow: {
    padding: '60px 20px',
    textAlign: 'center',
    background: 'var(--zebra)',
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

  /* Status bar */
  statusbar: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
    padding: '0 4px',
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  dim: { color: 'var(--text-4)' },

  /* Dev card */
  devCard: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  devCardHeader: {
    padding: '8px 14px',
    background: 'var(--panel-2)',
    borderBottom: '1px solid var(--border)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devCardBody: { padding: 14 },
  devGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 4,
  },
  modeBadge: {
    display: 'inline-block',
    padding: '1px 7px',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    background: 'var(--navy-50)',
    color: 'var(--navy)',
    border: '1px solid var(--navy)',
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  error: {
    padding: '8px 10px',
    background: 'var(--red-50)',
    color: 'var(--red)',
    border: '1px solid var(--red)',
    borderRadius: 4,
    fontSize: 12,
  },
};
