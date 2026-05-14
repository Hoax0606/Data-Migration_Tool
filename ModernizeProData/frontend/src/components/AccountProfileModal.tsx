import { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore, roleLabel } from '../store/auth';
import { useT } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Account profile 모달 — 현재 로그인한 사용자의 로컬 계정 정보.
 */
export function AccountProfileModal({ open, onClose }: Props) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [pwOpen, setPwOpen] = useState(false);

  // Placeholder values — 추후 실제 백엔드 데이터로 교체
  const lastSignIn = '2026-05-13 09:42:18 JST';
  const sessionStart = 'since 2026-05-13 09:42';
  const lastPwChange = '2026-04-01';

  const role = roleLabel(user?.role);

  return (
    <Modal open={open} onClose={onClose} width={520} title={t('account.title')}>
      {/* 사용자 행 */}
      <div style={styles.userRow}>
        <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase() ?? '?'}</div>
        <div>
          <div style={styles.name}>{user?.username}</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* 필드 */}
      <Field label={t('account.username')} value={user?.username ?? '—'} mono />
      <Field label={t('account.role')} value={role} mono />
      <Field label={t('account.lastSignIn')} value={lastSignIn} mono />
      <Field label={t('account.activeSession')} value={sessionStart} mono />

      {/* Password 섹션 — 명확한 라벨 + 버튼 */}
      <div style={styles.pwSection}>
        <div style={styles.pwHeader}>
          <div>
            <div style={styles.pwTitle}>{t('account.passwordLabel')}</div>
            <div style={styles.pwMeta}>{t('account.lastChanged')} · {lastPwChange}</div>
          </div>
          {!pwOpen ? (
            <button onClick={() => setPwOpen(true)} style={styles.pwBtn}>
              {t('account.changePassword')}
            </button>
          ) : (
            <button onClick={() => setPwOpen(false)} style={styles.pwBtnGhost}>
              {t('common.cancel')}
            </button>
          )}
        </div>

        {pwOpen && (
          <div style={styles.pwForm}>
            <div style={styles.pwNotImpl}>
              {t('account.notImpl')}
            </div>
            <FormField label={t('account.currentPw')} type="password" />
            <FormField label={t('account.newPw')} type="password" />
            <FormField label={t('account.confirmPw')} type="password" />
            <div style={styles.pwActions}>
              <button style={styles.btnPrimary} disabled title={t('account.notImplTitle')}>{t('common.save')}</button>
            </div>
          </div>
        )}
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

  field: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px dashed var(--border)',
  },
  fieldLabel: { width: 140, fontSize: 12, color: 'var(--text-3)', fontWeight: 500 },
  fieldValue: { flex: 1, fontSize: 12.5, color: 'var(--text)' },

  /* Password 섹션 */
  pwSection: {
    marginTop: 18,
    padding: '12px 14px',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 5,
  },
  pwHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pwTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--text)',
  },
  pwMeta: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    marginTop: 3,
  },
  pwBtn: {
    padding: '6px 14px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  pwBtnGhost: {
    padding: '6px 14px',
    background: 'var(--panel)',
    color: 'var(--text-2)',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  pwForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
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
  formLabel: { fontSize: 11, color: 'var(--text-3)', fontWeight: 500 },
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
  btnPrimary: {
    padding: '5px 14px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
