/* Solution Settings — application-level preferences. Rendered as an overlay
   modal (same pattern as Help/About) for navigation consistency — Settings
   is a single screen, not a tabbed view. */

const SolutionSettings = ({ onClose, theme, setTheme }) => {
  const [lang, setLang] = React.useState('en');
  const [notif, setNotif] = React.useState({ run: true, error: true });
  /* External integrations are off by default — most deployments use the
     internal scheduler. Toggle on only when the customer's ops team wants
     their existing Control-M / Airflow / Jenkins to trigger runs. */
  const [extEnabled, setExtEnabled] = React.useState(false);

  const langs  = [['en','English'],['ko','한국어'],['ja','日本語'],['zh','简体中文']];
  const themes = [['light','Light'],['dark','Dark']];

  return (
    <OverlayShell
      title="Solution settings"
      desc="preferences for ModernizeProData · applies across all sites"
      onClose={onClose}
      width={720}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Btn kind="primary" size="sm">Save</Btn>
      </div>

        <SSCard title="Appearance">
          <SSRow label="Language">
            <select value={lang} onChange={e => setLang(e.target.value)}
              style={{ height: 24, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 3, background:  'var(--panel)', fontSize: 11.5, color: 'var(--text)' }}>
              {langs.map(([k,l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </SSRow>
          <SSRow label="Theme">
            <div style={{ display: 'flex', gap: 5 }}>
              {themes.map(([k,l]) => (
                <button key={k} onClick={() => setTheme(k)}
                  style={{
                    padding: '3px 14px', fontSize: 11,
                    border: `1px solid ${theme === k ? 'var(--navy)' : 'var(--border)'}`,
                    background: theme === k ? 'var(--navy)' : 'var(--panel)',
                    color: theme === k ? '#fff' : 'var(--text-2)',
                    borderRadius: 3, cursor: 'pointer',
                  }}>{l}</button>
              ))}
            </div>
          </SSRow>
        </SSCard>

        <SSCard title="Notifications" desc="When to show in-app toasts and browser push.">
          <SSRow label="Run completion"><SSToggle on={notif.run} onChange={v => setNotif(n => ({ ...n, run: v }))} label="Notify when a run finishes"/></SSRow>
          <SSRow label="Errors"><SSToggle on={notif.error} onChange={v => setNotif(n => ({ ...n, error: v }))} label="Notify on migration errors (severity ≥ error)"/></SSRow>
        </SSCard>

        {/* External integrations — gated by enable toggle */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel)', marginBottom: 14 }}>
          <div style={{
            padding: '10px 14px 9px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>External integrations</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 }}>
                기본은 내장 스케줄러로 run 을 trigger 합니다. 운영팀이 기존 외부 스케줄러(Control-M / Airflow / Jenkins / cron)를 이미 쓰고 있어 그쪽으로 통합하고 싶을 때만 켜세요. 끄면 외부 CLI / API 진입점이 모두 비활성화됩니다.
              </div>
            </div>
            <SSToggle on={extEnabled} onChange={setExtEnabled} label={extEnabled ? 'Enabled' : 'Disabled'}/>
          </div>
          <div style={{
            padding: '12px 14px',
            opacity: extEnabled ? 1 : 0.45,
            pointerEvents: extEnabled ? 'auto' : 'none',
            transition: 'opacity .15s',
          }}>
            <SSRow label="Scheduler" hint="어느 외부 스케줄러가 이 툴의 run 을 트리거하는지">
              <select defaultValue="control-m" disabled={!extEnabled} style={{
                height: 24, padding: '0 8px',
                border: '1px solid var(--border)', borderRadius: 3,
                background: 'var(--panel)', fontSize: 11.5, color: 'var(--text)', fontFamily: 'var(--mono)',
              }}>
                <option value="control-m">Control-M</option>
                <option value="airflow">Apache Airflow</option>
                <option value="jenkins">Jenkins</option>
                <option value="cron">Linux cron</option>
              </select>
            </SSRow>
            <SSRow label="CLI path" hint="스케줄러가 호출할 CLI 바이너리 위치">
              <SSInput value="/opt/migrate/bin/migrate" mono readOnly/>
            </SSRow>
            <SSRow label="API endpoint" hint="대안 — HTTP 로 run 트리거">
              <SSInput value="https://migrate.kdb.internal/api/v1/runs" mono readOnly/>
            </SSRow>
            <SSRow label="API token" hint="스케줄러가 제시할 인증 토큰 (rotate 권장)">
              <SSInput value="mig_••••••••••••••••_a9f3" mono readOnly/>
            </SSRow>
            <SSRow label="Syslog forwarding" hint="run 이벤트를 사내 SIEM 으로 보낼지">
              <SSInput value="syslog.kdb.internal:514 · facility local4" mono readOnly/>
            </SSRow>
          </div>
        </div>

      <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 6 }}>
        © 2024–2026 KS Info System · All rights reserved
      </div>
    </OverlayShell>
  );
};

window.SolutionSettings = SolutionSettings;
