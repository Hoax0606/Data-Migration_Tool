import { Modal } from './Modal';
import { BrandName } from './BrandName';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={<>About <BrandName /></>} width={420}>
      <div style={styles.row}>
        <img src="/mpd.png" alt="" width={48} height={48} style={{ display: 'block' }} />
        <div>
          <div style={styles.brandText}><BrandName /></div>
          <div style={styles.versionText}>v0.1.0-dev</div>
        </div>
      </div>

      <p style={styles.desc}>
        대형 금융권의 데이터베이스 이행을 지원하는 폐쇄망 친화 도구.
        AS-IS 운영 시스템의 데이터를 TO-BE 신 시스템으로 정확하고 빠르게 옮기는 것이 목적.
      </p>

      <table style={styles.kv}>
        <tbody>
          <Row k="Build" v="0.1.0-dev" mono />
          <Row k="Backend" v="Spring Boot 3.5 · Java 21" mono />
          <Row k="Frontend" v="React 19 · Vite 8 · TypeScript 6" mono />
          <Row k="Engine" v="DuckDB v1.1.3 (변환·검증, embedded)" mono />
          <Row k="Meta DB" v="H2 v2.x (사용자·매핑·audit log, file mode)" mono />
          <Row k="Scheduler" v="Quartz 2.x (embedded)" mono />
          <Row k="Vendor" v="KS Info System Co., Ltd." />
        </tbody>
      </table>

      <div style={styles.footer}>
        © 2026 KS Info System Co., Ltd. All rights reserved.
      </div>
    </Modal>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr>
      <td style={styles.kvKey}>{k}</td>
      <td style={{ ...styles.kvVal, ...(mono ? { fontFamily: 'var(--mono)' } : {}) }}>{v}</td>
    </tr>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  brandText: { fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.2 },
  versionText: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    marginTop: 2,
  },
  desc: {
    fontSize: 12,
    color: 'var(--text-2)',
    lineHeight: 1.6,
    margin: '0 0 14px',
  },
  kv: {
    fontSize: 11.5,
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: 14,
  },
  kvKey: {
    padding: '5px 10px',
    color: 'var(--text-3)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 500,
    width: 90,
    borderBottom: '1px dashed var(--border)',
  },
  kvVal: {
    padding: '5px 10px',
    color: 'var(--text)',
    borderBottom: '1px dashed var(--border)',
  },
  footer: {
    fontSize: 10.5,
    color: 'var(--text-4)',
    fontFamily: 'var(--mono)',
    textAlign: 'center',
    paddingTop: 6,
  },
};
