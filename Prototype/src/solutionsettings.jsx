/* Solution Settings — application-level preferences (separate from site settings) */

const SolutionSettings = ({ onBack, theme, setTheme }) => {
  const [lang, setLang] = React.useState('en');
  const [notif, setNotif] = React.useState({ run: true, error: true });

  const langs  = [['en','English'],['ko','한국어'],['ja','日本語'],['zh','简体中文']];
  const themes = [['light','Light'],['dark','Dark']];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '18px 26px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>Solution settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              Preferences for migrate.console itself. Applies across all sites.
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={onBack}>Close</Btn>
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

        <SSCard title="About">
          <SSRow label="Product"><SSInput value="KS migrate.console" readOnly/></SSRow>
          <SSRow label="Version"><SSInput value="v4.12.0 (build 2026.04.18-a9f3c1)" readOnly mono/></SSRow>
          <SSRow label="Vendor"><SSInput value="KS Info System Co., Ltd." readOnly/></SSRow>
          <SSRow label="Support"><SSInput value="support@ksinfo.co.kr · +82 2 123 4567" readOnly mono/></SSRow>
        </SSCard>

        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 6 }}>
          © 2024–2026 KS Info System · All rights reserved
        </div>
      </div>
    </div>
  );
};

window.SolutionSettings = SolutionSettings;
