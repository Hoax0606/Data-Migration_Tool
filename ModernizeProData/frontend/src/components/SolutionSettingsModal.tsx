import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { BrandName } from './BrandName';
import { Toggle } from './Toggle';
import { useSettingsStore, type Theme, type Language, type ExternalConfig } from '../store/settings';
import { LANGUAGE_LABELS } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Solution settings 모달 — 사이트 전역 도구 설정.
 * Save 클릭 시 store 에 반영되어 localStorage 영속 + theme/language 즉시 적용.
 */
export function SolutionSettingsModal({ open, onClose }: Props) {
  const store = useSettingsStore();

  // 로컬 드래프트 — Save 전에는 store 에 반영 안 됨
  const [theme, setTheme] = useState<Theme>(store.theme);
  const [language, setLanguage] = useState<Language>(store.language);
  const [notifications, setNotifications] = useState(store.notifications);
  const [externalOn, setExternalOn] = useState(store.externalIntegrations);
  const [extCfg, setExtCfg] = useState<ExternalConfig>(store.externalConfig);
  const [saved, setSaved] = useState(false);

  // 모달 열릴 때마다 store 의 현재 값으로 리셋
  useEffect(() => {
    if (!open) return;
    setTheme(store.theme);
    setLanguage(store.language);
    setNotifications(store.notifications);
    setExternalOn(store.externalIntegrations);
    setExtCfg(store.externalConfig);
    setSaved(false);
  }, [open, store.theme, store.language, store.notifications, store.externalIntegrations, store.externalConfig]);

  const handleSave = () => {
    store.setTheme(theme);
    store.setLanguage(language);
    store.setNotifications(notifications);
    store.setExternalIntegrations(externalOn);
    store.setExternalConfig(extCfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={780}
      title={
        <div>
          <div>Solution settings</div>
          <div style={styles.subtitle}>
            preferences for <BrandName /> · applies across all sites
          </div>
        </div>
      }
    >
      {/* Save 행 */}
      <div style={styles.saveRow}>
        {saved && <span style={styles.savedTag}>저장됨</span>}
        <button style={styles.btnPrimary} onClick={handleSave}>Save</button>
      </div>

      {/* Appearance */}
      <Card title="Appearance">
        <Row label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={styles.select}
          >
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((k) => (
              <option key={k} value={k}>{LANGUAGE_LABELS[k]}</option>
            ))}
          </select>
        </Row>
        <Row label="Theme">
          <div style={styles.toggleGroup}>
            <button
              onClick={() => setTheme('light')}
              style={{ ...styles.toggleBtn, ...(theme === 'light' ? styles.toggleBtnActive : {}) }}
            >Light</button>
            <button
              onClick={() => setTheme('dark')}
              style={{ ...styles.toggleBtn, ...(theme === 'dark' ? styles.toggleBtnActive : {}) }}
            >Dark</button>
          </div>
        </Row>
      </Card>

      {/* Notifications */}
      <Card
        title="Notifications"
        desc="인앱 알림(🔔) 사용 여부. 어떤 이벤트를 받을지는 Project Settings › Notifications 에서 관리합니다."
      >
        <div style={styles.toggleRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.rowLabelTitle}>Enable notifications</div>
            <div style={styles.rowSub}>끄면 모든 프로젝트의 인앱 알림이 일괄 비활성화됩니다.</div>
          </div>
          <Toggle on={notifications} onChange={() => setNotifications((v) => !v)} ariaLabel="Enable notifications" />
        </div>
      </Card>

      {/* External integrations */}
      <Card
        title="External integrations"
        desc="기본은 내장 스케줄러로 run 을 trigger 합니다. 운영팀이 기존 외부 스케줄러(Control-M / Airflow / Jenkins / cron)를 이미 쓰고 있어 그쪽으로 통합하고 싶을 때만 켜세요. 끄면 외부 CLI / API 진입점이 모두 비활성화됩니다."
        right={<Toggle on={externalOn} onChange={() => setExternalOn((v) => !v)} ariaLabel="External integrations" />}
      >
        <div style={{ opacity: externalOn ? 1 : 0.5, pointerEvents: externalOn ? 'auto' : 'none' }}>
          <Row label={<RowLabel title="Scheduler" sub="어느 외부 스케줄러가 이 툴의 run 을 트리거하는지" />}>
            <select
              value={extCfg.scheduler}
              onChange={(e) => setExtCfg({ ...extCfg, scheduler: e.target.value })}
              style={styles.select}
            >
              <option>Control-M</option>
              <option>Airflow</option>
              <option>Jenkins</option>
              <option>cron</option>
            </select>
          </Row>
          <Row label={<RowLabel title="CLI path" sub="스케줄러가 호출할 CLI 바이너리 위치" />}>
            <input value={extCfg.cliPath} onChange={(e) => setExtCfg({ ...extCfg, cliPath: e.target.value })} style={styles.input} />
          </Row>
          <Row label={<RowLabel title="API endpoint" sub="대안 — HTTP 로 run 트리거" />}>
            <input value={extCfg.apiEndpoint} onChange={(e) => setExtCfg({ ...extCfg, apiEndpoint: e.target.value })} style={styles.input} />
          </Row>
          <Row label={<RowLabel title="API token" sub="스케줄러가 제시할 인증 토큰 (rotate 권장)" />}>
            <input value={extCfg.apiToken} onChange={(e) => setExtCfg({ ...extCfg, apiToken: e.target.value })} style={styles.input} />
          </Row>
          <Row label={<RowLabel title="Syslog forwarding" sub="run 이벤트를 사내 SIEM 으로 보낼지" />}>
            <input value={extCfg.syslog} onChange={(e) => setExtCfg({ ...extCfg, syslog: e.target.value })} style={styles.input} />
          </Row>
        </div>
      </Card>

      <div style={styles.footer}>
        © 2024–2026 KS Info System · All rights reserved
      </div>
    </Modal>
  );
}

/* ─── Building blocks ───────────────────────────────────── */

function Card({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeaderRow}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          {desc && <div style={styles.cardDesc}>{desc}</div>}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLabel}>{label}</div>
      <div style={styles.rowValue}>{children}</div>
    </div>
  );
}

function RowLabel({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <div style={styles.rowLabelTitle}>{title}</div>
      {sub && <div style={styles.rowSub}>{sub}</div>}
    </div>
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

  saveRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 10 },
  savedTag: {
    fontSize: 11,
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
  },
  btnPrimary: {
    padding: '7px 18px',
    background: 'var(--navy)',
    color: '#fff',
    border: '1px solid var(--navy)',
    borderRadius: 4,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  },

  card: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  cardDesc: {
    fontSize: 11.5,
    color: 'var(--text-3)',
    marginTop: 4,
    lineHeight: 1.55,
    maxWidth: 600,
  },
  cardBody: { padding: '0 16px' },

  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed var(--border)',
    gap: 12,
    minHeight: 48,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px dashed var(--border)',
    gap: 12,
  },
  rowLabel: { width: 220, fontSize: 12.5, color: 'var(--text)', flexShrink: 0 },
  rowLabelTitle: { fontSize: 12.5, fontWeight: 600 },
  rowValue: { flex: 1, display: 'flex', alignItems: 'center' },
  rowSub: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontWeight: 400,
    marginTop: 3,
    lineHeight: 1.4,
  },

  select: {
    padding: '6px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 12.5,
    outline: 'none',
    minWidth: 140,
  },
  input: {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 12.5,
    fontFamily: 'var(--mono)',
    outline: 'none',
  },

  toggleGroup: { display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 4, overflow: 'hidden' },
  toggleBtn: {
    padding: '5px 16px',
    background: 'var(--panel)',
    color: 'var(--text-2)',
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  toggleBtnActive: {
    background: 'var(--navy)',
    color: '#fff',
    fontWeight: 600,
  },

  footer: {
    marginTop: 14,
    fontSize: 11,
    color: 'var(--text-4)',
    fontFamily: 'var(--mono)',
    textAlign: 'center',
  },
};
