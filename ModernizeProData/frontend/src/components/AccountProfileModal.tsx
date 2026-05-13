import { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '../store/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Account profile 모달 — 현재 로그인한 사용자의 로컬 계정 정보.
 * Site settings 와 별개 (사용자 단위).
 */
export function AccountProfileModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const [pwOpen, setPwOpen] = useState(false);

  // Placeholder values — 추후 실제 백엔드 데이터로 교체
  const lastSignIn = '2026-05-13 09:42:18 JST';
  const sessionStart = 'since 2026-05-13 09:42';
  const lastPwChange = '2026-04-01';

  const roleLabel = user?.role === 'master' ? 'Master (full access)'
    : user?.role === 'admin'  ? 'Admin (project access)'
    : 'Viewer (read-only)';

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title={
        <div>
          <div>Account profile</div>
          <div style={styles.subtitle}>Local account details. No external directory.</div>
        </div>
      }
    >
      {/* 사용자 행 */}
      <div style={styles.userRow}>
        <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase() ?? '?'}</div>
        <div>
          <div style={styles.name}>{user?.username}</div>
          <div style={styles.userSub}>{user?.role}</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* 필드 */}
      <Field label="Username" value={user?.username ?? '—'} mono />
      <Field label="Role" value={roleLabel} mono />
      <Field label="Last sign-in" value={lastSignIn} mono />
      <Field label="Active session" value={sessionStart} mono />

      {/* Change password */}
      <button
        onClick={() => setPwOpen((o) => !o)}
        style={styles.collapseBtn}
      >
        <div>
          <div style={styles.collapseTitle}>Change password</div>
          <div style={styles.collapseSub}>Last changed {lastPwChange}</div>
        </div>
        <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{pwOpen ? '▴' : '▾'}</span>
      </button>

      {pwOpen && (
        <div style={styles.pwForm}>
          <div style={styles.pwNotImpl}>
            ⚠ 미구현 (UI placeholder) — 백엔드 사용자 모듈 완성 후 연결됩니다.
          </div>
          <FormField label="Current password" type="password" />
          <FormField label="New password" type="password" />
          <FormField label="Confirm new password" type="password" />
          <div style={styles.pwActions}>
            <button style={styles.btnGhost} onClick={() => setPwOpen(false)}>Cancel</button>
            <button style={styles.btnPrimary} disabled title="미구현">Save</button>
          </div>
        </div>
      )}

      <div style={styles.note}>
        To add more local users, go to <b>Site settings → Access</b>.
      </div>
    </Modal>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={{ ...styles.fieldValue, ...(mono ? { fontFamily: 'var(--mono)' } : {}) }}>
        {value}
      </div>
    </div>
  );
}

function FormField({ label, type = 'text' }: { label: string; type?: string }) {
  return (
    <label style={styles.formField}>
      <span style={styles.formLabel}>{label}</span>
      <input type={type} style={styles.formInput} />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtitle: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    marginTop: 2,
    fontWeight: 400,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '4px 0 12px',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--navy)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  name: { fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  userSub: { fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 },

  divider: { height: 1, background: 'var(--border)', margin: '4px 0 6px' },

  field: { display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed var(--border)' },
  fieldLabel: { width: 140, fontSize: 12, color: 'var(--text-3)', fontWeight: 500 },
  fieldValue: { flex: 1, fontSize: 12.5, color: 'var(--text)' },

  collapseBtn: {
    width: '100%',
    marginTop: 14,
    padding: '10px 12px',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
  },
  collapseTitle: { fontSize: 12.5, fontWeight: 600, color: 'var(--text)' },
  collapseSub: { fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 },

  pwForm: {
    marginTop: 8,
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: 4,
    background: 'var(--panel)',
  },
  pwNotImpl: {
    padding: '8px 10px',
    background: 'var(--amber-50)',
    border: '1px solid var(--amber)',
    color: 'var(--amber)',
    borderRadius: 4,
    fontSize: 11.5,
    marginBottom: 10,
    fontFamily: 'var(--mono)',
  },
  formField: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
  formLabel: { fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500 },
  formInput: {
    padding: '7px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    fontSize: 12.5,
    fontFamily: 'var(--mono)',
    outline: 'none',
  },
  pwActions: { display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 },
  btnGhost: {
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-2)',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '5px 12px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },

  note: {
    marginTop: 14,
    padding: '8px 12px',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontSize: 11.5,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
};
