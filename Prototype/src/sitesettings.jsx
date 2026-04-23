/* Site Settings — simplified: name, environment, DB, password, delete */

const SiteSettings = ({ site, onSave, onDelete, onBack }) => {
  const [name, setName]         = React.useState(site?.name || '');
  const [env, setEnv]           = React.useState(site?.env || 'Mainframe');
  const [envDetail, setEnvDetail] = React.useState(site?.envDetail || 'z/OS 2.5 · EBCDIC');
  const [dbKind, setDbKind]     = React.useState(site?.dbKind || 'PostgreSQL');
  const [dbVer, setDbVer]       = React.useState(site?.dbVer || '15.4');
  const [pwEnabled, setPwEnabled] = React.useState(site?.pwEnabled ?? true);
  const [pw, setPw]             = React.useState('');
  const [pw2, setPw2]           = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');

  const envOptions = ['Mainframe','AS/400 · IBM i','Unix · Oracle','Unix · MSSQL','Linux · MySQL','Windows · flat files'];
  const dbKinds = ['PostgreSQL','MySQL','MariaDB','Tibero','Oracle','MSSQL'];

  const pwError = pwEnabled && pw.length > 0 && pw !== pw2 ? 'Passwords do not match' : null;
  const canSave = name.trim().length > 0 && !pwError;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '18px 26px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>Site settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              Configuration for this site. All projects under this site share these values.
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={onBack}>Cancel</Btn>
          <Btn kind="primary" size="sm" disabled={!canSave} onClick={() => canSave && onSave?.({ name, env, envDetail, dbKind, dbVer, pwEnabled })}>Save</Btn>
        </div>

        <SSCard title="Site">
          <SSRow label="Site name" hint="Displayed in sidebar and reports.">
            <SSInput value={name} onChange={setName} placeholder="e.g. KDB Bank"/>
          </SSRow>
        </SSCard>

        <SSCard title="Source environment" desc="What kind of legacy system this site migrates from.">
          <SSRow label="Platform">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {envOptions.map(e => (
                <button key={e} onClick={() => setEnv(e)}
                  style={{
                    padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)',
                    border: `1px solid ${env === e ? 'var(--navy)' : 'var(--border)'}`,
                    background: env === e ? 'var(--navy)' : 'var(--panel)',
                    color: env === e ? '#fff' : 'var(--text-2)',
                    borderRadius: 3, cursor: 'pointer',
                  }}>{e}</button>
              ))}
            </div>
          </SSRow>
          <SSRow label="OS / encoding detail" hint="Free-form. Shown on audit reports.">
            <SSInput value={envDetail} onChange={setEnvDetail} mono/>
          </SSRow>
        </SSCard>

        <SSCard title="Target database">
          <SSRow label="DBMS">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {dbKinds.map(d => (
                <button key={d} onClick={() => setDbKind(d)}
                  style={{
                    padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)',
                    border: `1px solid ${dbKind === d ? 'var(--navy)' : 'var(--border)'}`,
                    background: dbKind === d ? 'var(--navy)' : 'var(--panel)',
                    color: dbKind === d ? '#fff' : 'var(--text-2)',
                    borderRadius: 3, cursor: 'pointer',
                  }}>{d}</button>
              ))}
            </div>
          </SSRow>
          <SSRow label="Version">
            <SSInput value={dbVer} onChange={setDbVer} mono width={160} placeholder="e.g. 15.4"/>
          </SSRow>
        </SSCard>

        <SSCard title="Login password" desc="Require a password when opening this site.">
          <SSRow label="Use password"><SSToggle on={pwEnabled} onChange={setPwEnabled} label={pwEnabled ? 'Enabled' : 'Disabled (anyone with access can open)'}/></SSRow>
          {pwEnabled && (
            <>
              <SSRow label="Password">
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: 240, height: 24, padding: '0 8px',
                    border: '1px solid var(--border)', borderRadius: 3,
                    fontFamily: 'var(--mono)', fontSize: 11.5, background:  'var(--panel)',
                  }}/>
              </SSRow>
              <SSRow label="Confirm password">
                <div>
                  <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: 240, height: 24, padding: '0 8px',
                      border: `1px solid ${pwError ? 'var(--red)' : 'var(--border)'}`, borderRadius: 3,
                      fontFamily: 'var(--mono)', fontSize: 11.5, background:  'var(--panel)',
                    }}/>
                  {pwError && <div style={{ fontSize: 10.5, color: 'var(--red)', marginTop: 4 }}>{pwError}</div>}
                </div>
              </SSRow>
            </>
          )}
        </SSCard>

        {/* Danger zone */}
        {site && (
          <div style={{ border: '1px solid #e6c6c6', borderRadius: 4, background:  'var(--panel)', marginTop: 20 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--red)', background: 'var(--red-50)', fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>
              Danger zone
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>Delete site</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                  Permanently removes this site and all its projects, artifacts, and logs. <b>This cannot be undone.</b>
                </div>
              </div>
              <Btn kind="secondary" size="sm" onClick={() => setShowConfirm(true)}
                style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>Delete site…</Btn>
            </div>
          </div>
        )}

        {showConfirm && (
          <div onClick={() => setShowConfirm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,50,.35)', display: 'grid', placeItems: 'center', zIndex: 2000 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: 460, background:  'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 20px 60px rgba(20,30,50,.25)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', background: 'var(--red-50)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Delete site “{site.name}”</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>This will permanently delete all projects under this site.</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 11.5, marginBottom: 6 }}>
                  Type <code style={{ background: 'var(--panel-2)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 11 }}>{site.name}</code> to confirm.
                </div>
                <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={site.name}
                  style={{ width: '100%', height: 28, padding: '0 10px', border: `1px solid ${confirmText === site.name ? 'var(--red)' : 'var(--border)'}`, borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 12 }}/>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--panel-2)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Btn kind="secondary" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Btn>
                <button disabled={confirmText !== site.name}
                  onClick={() => { onDelete?.(); setShowConfirm(false); }}
                  style={{ padding: '4px 14px', fontSize: 11.5, fontWeight: 500, border: 'none', borderRadius: 3, background: confirmText === site.name ? 'var(--red)' : 'var(--border-strong)', color: '#fff', cursor: confirmText === site.name ? 'pointer' : 'not-allowed' }}>
                  Delete forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* form primitives */
const SSHead = ({ title, desc, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>{title}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{desc}</div>}
    </div>
    {actions}
  </div>
);

const SSCard = ({ title, desc, children }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 4, background:  'var(--panel)', marginBottom: 14 }}>
    {(title || desc) && (
      <div style={{ padding: '10px 14px 9px', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        {title && <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>}
        {desc && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>}
      </div>
    )}
    <div style={{ padding: '12px 14px' }}>{children}</div>
  </div>
);

const SSRow = ({ label, hint, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const SSInput = ({ value, onChange, placeholder, mono, width, readOnly }) => (
  <input
    value={value ?? ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
    readOnly={readOnly}
    style={{
      width: width || '100%', height: 24, padding: '0 8px',
      border: '1px solid var(--border)', borderRadius: 3,
      background: readOnly ? 'var(--panel-2)' : 'var(--panel)',
      fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
      fontSize: 11.5, color: 'var(--text)',
    }}/>
);

const SSToggle = ({ on, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '3px 0' }}>
    <span
      onClick={() => onChange?.(!on)}
      style={{
        width: 28, height: 16, borderRadius: 8,
        background: on ? 'var(--navy)' : 'var(--border-strong)',
        position: 'relative', transition: 'background .15s',
        flexShrink: 0,
      }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 14 : 2,
        width: 12, height: 12, borderRadius: '50%',
        background:  'var(--panel)', transition: 'left .15s',
        boxShadow: '0 1px 2px rgba(0,0,0,.2)',
      }}/>
    </span>
    <span style={{ fontSize: 11.5 }}>{label}</span>
  </label>
);

Object.assign(window, { SiteSettings, SSHead, SSCard, SSRow, SSInput, SSToggle });
