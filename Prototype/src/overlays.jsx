/* Overlay screens: Sign-out, Help & shortcuts, About migrate.console */

const OverlayShell = ({ title, desc, onClose, children, wide }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(10,18,16,0.55)',
    display: 'grid', placeItems: 'center', zIndex: 2000,
  }}
  onClick={onClose}>
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: wide ? 640 : 440,
        maxHeight: '86vh', overflow: 'auto',
        background: 'var(--panel)',
        border: '1px solid var(--border-strong)',
        borderRadius: 5,
        boxShadow: '0 30px 80px rgba(10,20,18,0.35)',
        display: 'flex', flexDirection: 'column',
      }}>
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>{title}</div>
          {desc && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>{desc}</div>}
        </div>
        <button onClick={onClose} style={{
          width: 22, height: 22, border: '1px solid var(--border)',
          background: 'var(--panel)', borderRadius: 3, cursor: 'pointer',
          fontSize: 11, color: 'var(--text-3)',
        }}>✕</button>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        {children}
      </div>
    </div>
  </div>
);

// ── Sign out screen ────────────────────────────────────────────
const SignOutScreen = ({ onCancel, onConfirm }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'grid', placeItems: 'center', zIndex: 3000,
    }}>
      <div style={{
        width: 400, background: 'var(--panel)',
        border: '1px solid var(--border-strong)', borderRadius: 5,
        padding: '24px 24px 18px',
        boxShadow: '0 20px 60px rgba(10,20,18,0.15)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 6, margin: '0 auto 12px',
          background: 'var(--navy-50)', color: 'var(--navy)',
          display: 'grid', placeItems: 'center', fontSize: 20,
        }}>⎋</div>
        <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Sign out of migrate.console?</div>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.55, fontFamily: 'var(--mono)' }}>
          Running migrations will continue on the server.<br/>
          You'll need to sign in again to view their progress.
        </div>

        <div style={{
          marginTop: 14, padding: '8px 11px',
          background: 'var(--panel-2)', border: '1px solid var(--border)',
          borderRadius: 3, fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Signed in as</span>
          <span style={{ color: 'var(--text)' }}>Admin · Owner</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 28, border: '1px solid var(--border-strong)',
            background: '#fff', color: 'var(--text)', borderRadius: 3,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, height: 28, border: '1px solid var(--navy)',
            background: 'var(--navy)', color: '#fff', borderRadius: 3,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </div>
    </div>
  );
};

// Actual "signed out" post-state
const SignedOutScreen = ({ onSignIn }) => {
  const [user, setUser] = React.useState('admin');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [showHint, setShowHint] = React.useState(false);
  const [showRecover, setShowRecover] = React.useState(false);
  const submit = () => {
    if (user === 'admin' && pw === '1234') { setErr(''); onSignIn(); }
    else setErr('Invalid username or password');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #eef2f0 0%, #e3e9e6 100%)',
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--sans)', zIndex: 3000,
      padding: '20px',
    }}>
        <div style={{ width: 340 }}>

          {/* Brand above the card — gives it room to breathe */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 8, margin: '0 auto 10px',
              background: 'var(--navy)', color: '#fff',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700,
              boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 6px rgba(20,60,50,0.18)',
            }}>M</div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>
              migrate.console
              <span style={{ fontSize: 10.5, fontWeight: 400, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginLeft: 6 }}>v4.12.0</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 3 }}>
              Sign in to continue
            </div>
          </div>

          {/* Card — softer, lifted */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border-strong)',
            borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 24px -14px rgba(20,40,35,0.22)',
            padding: '16px 16px 14px',
          }}>
            <form onSubmit={e => { e.preventDefault(); submit(); }}>

              <div style={{ marginBottom: 9 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-2)', marginBottom: 4, fontWeight: 500 }}>Username</label>
                <input value={user} onChange={e => { setUser(e.target.value); setErr(''); }} autoFocus style={{
                  width: '100%', height: 28, padding: '0 10px', fontSize: 12,
                  fontFamily: 'var(--mono)', border: '1px solid var(--border-strong)',
                  borderRadius: 3, outline: 'none', background: '#fff', color: 'var(--text)',
                }}/>
              </div>

              <div style={{ marginBottom: 9 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-2)', marginBottom: 4, fontWeight: 500 }}>Password</label>
                <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} style={{
                  width: '100%', height: 28, padding: '0 10px', fontSize: 12,
                  fontFamily: 'var(--mono)', border: `1px solid ${err ? 'var(--red)' : 'var(--border-strong)'}`,
                  borderRadius: 3, outline: 'none', background: '#fff', color: 'var(--text)',
                }}/>
              </div>

              {err && (
                <div style={{
                  fontSize: 10.5, color: 'var(--red)', fontFamily: 'var(--mono)',
                  background: 'var(--red-50)', border: '1px solid var(--red)',
                  borderRadius: 3, padding: '5px 8px', marginBottom: 9,
                }}>{err}</div>
              )}

              <button type="submit" style={{
                width: '100%', height: 30,
                border: '1px solid var(--navy)',
                background: 'var(--navy)', color: '#fff',
                borderRadius: 4, fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset',
              }}>Sign in</button>

              <div style={{
                marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 10.5, fontFamily: 'var(--mono)',
              }}>
                <button type="button" onClick={() => setShowHint(v => !v)} style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--text-3)', cursor: 'pointer',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                }}>{showHint ? 'Hide defaults' : 'Defaults'}</button>
                <button type="button" onClick={() => setShowRecover(true)} style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--navy)', cursor: 'pointer',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                }}>Forgot password?</button>
              </div>

              {showHint && (
                <div style={{
                  marginTop: 8, padding: '6px 9px',
                  background: 'var(--panel-2)',
                  border: '1px dashed var(--border-strong)', borderRadius: 3,
                  fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-2)',
                  lineHeight: 1.55,
                }}>
                  Default: <b>admin</b> / <b>1234</b> — change after first sign-in.
                </div>
              )}
            </form>
          </div>

          <div style={{
            textAlign: 'center', marginTop: 14,
            fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)',
          }}>
            © KS Info System Co., Ltd.
          </div>
        </div>

      {showRecover && <ForgotPassword onClose={() => setShowRecover(false)}/>}
    </div>
  );
};

// Password recovery guidance — on-prem style (no email reset)
const ForgotPassword = ({ onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(10,18,16,0.5)',
    display: 'grid', placeItems: 'center', zIndex: 3500,
  }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{
      width: 440, background: 'var(--panel)',
      border: '1px solid var(--border-strong)', borderRadius: 2,
      boxShadow: '0 20px 60px rgba(10,20,18,0.25)',
    }}>
      <div style={{
        padding: '9px 14px',
        background: 'var(--panel-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
      }}>
        <span>Password recovery</span>
        <button onClick={onClose} style={{
          width: 20, height: 20, border: '1px solid var(--border)',
          background: '#fff', borderRadius: 2, cursor: 'pointer',
          fontSize: 10, color: 'var(--text-3)',
        }}>✕</button>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>
          Because this console runs inside your network with no email service,
          password recovery is done by the system administrator on the server.
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
          If you have server access
        </div>
        <pre style={{
          margin: 0, padding: '8px 10px',
          background: '#0d1a18', color: '#e3f0ec',
          border: '1px solid var(--border-strong)',
          borderRadius: 2, fontFamily: 'var(--mono)', fontSize: 10.5,
          overflowX: 'auto',
        }}>{`$ sudo systemctl stop migrate.console
$ migrate-console reset-password \\
    --user admin --password <new-password>
$ sudo systemctl start migrate.console`}</pre>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '12px 0 5px' }}>
          Otherwise
        </div>
        <div style={{
          fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.55,
          padding: '7px 9px', background: 'var(--panel-2)',
          border: '1px solid var(--border)', borderRadius: 2,
        }}>
          Contact your system administrator.
          <div style={{ marginTop: 4, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>
            Support · +82 2 123 4567 · support@ksinfo.co.kr
          </div>
        </div>
      </div>

      <div style={{
        padding: '9px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button onClick={onClose} style={{
          height: 24, padding: '0 14px',
          border: '1px solid var(--border-strong)', background: '#fff',
          borderRadius: 2, fontSize: 11, fontWeight: 500, cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>
  </div>
);

// ── Help & shortcuts ────────────────────────────────────────────
const Help = ({ onClose }) => {
  const shortcutGroups = [
    {
      title: 'Navigation',
      items: [
        ['G then D', 'Go to Dashboard'],
        ['G then M', 'Go to Mapping'],
        ['G then E', 'Go to Execution'],
        ['G then L', 'Go to Logs'],
        ['G then A', 'Go to Artifacts'],
        ['⌘ / Ctrl + K', 'Quick switcher (projects & tables)'],
      ],
    },
    {
      title: 'Actions',
      items: [
        ['R', 'Run all'],
        ['⌘ / Ctrl + .', 'Abort run'],
        ['N', 'New project'],
        ['/', 'Focus filter input'],
        ['?', 'Open this dialog'],
      ],
    },
    {
      title: 'Tables & rows',
      items: [
        ['↑ / ↓', 'Move selection'],
        ['Space', 'Toggle selection'],
        ['⏎', 'Open selected table'],
        ['⌘ / Ctrl + A', 'Select all filtered'],
      ],
    },
  ];
  return (
    <OverlayShell onClose={onClose} wide
      title="Help & shortcuts"
      desc="Keyboard bindings and where to find things.">

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {shortcutGroups.map(g => (
          <div key={g.title} style={{ gridColumn: g.title === 'Tables & rows' ? 'span 2' : 'span 1' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{g.title}</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 3, background: '#fff', overflow: 'hidden' }}>
              {g.items.map(([k, d], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderTop: i ? '1px solid var(--border)' : 'none',
                  background: i % 2 ? 'var(--zebra)' : '#fff',
                }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text)' }}>{d}</span>
                  <kbd style={{
                    fontFamily: 'var(--mono)', fontSize: 10.5,
                    padding: '1px 7px', background: 'var(--panel-2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 3, color: 'var(--text-2)',
                  }}>{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: 'var(--navy-50)',
        border: '1px solid var(--navy)',
        borderRadius: 3, fontSize: 11, color: 'var(--navy-700, var(--navy))',
        lineHeight: 1.55,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Resources</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-2)' }}>
          User guide (PDF) · Administrator guide · Release notes · Support: +82 2 123 4567
        </div>
      </div>
    </OverlayShell>
  );
};

// ── About migrate.console ────────────────────────────────────────
const About = ({ onClose }) => {
  const Row = ({ l, v, mono = true }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: '6px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : 'var(--sans)' }}>{v}</div>
    </div>
  );
  return (
    <OverlayShell onClose={onClose}
      title="About migrate.console"
      desc="Build info, licensing, and credits.">

      <div style={{ textAlign: 'center', padding: '8px 0 14px' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 6, margin: '0 auto 8px',
          background: 'var(--navy)', color: '#fff',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700,
        }}>M</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>migrate.console</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
          v4.12.0 · build 2026.04.18-a9f3c1
        </div>
      </div>

      <div>
        <Row l="Product"  v="KS migrate.console" mono={false}/>
        <Row l="Edition"  v="Enterprise · on-premise"/>
        <Row l="License"  v="KDB-2025-A1 · valid until 2027-06-30"/>
        <Row l="Vendor"   v="KS Info System Co., Ltd." mono={false}/>
        <Row l="Support"  v="support@ksinfo.co.kr"/>
        <Row l="Phone"    v="+82 2 123 4567"/>
        <Row l="Node"     v="mig-prod-01 · 127.0.0.1"/>
        <Row l="Runtime"  v="Java 17.0.9 · PostgreSQL 15.4"/>
      </div>

      <div style={{
        marginTop: 14, padding: '9px 11px',
        background: 'var(--panel-2)', border: '1px solid var(--border)',
        borderRadius: 3, fontSize: 10.5, color: 'var(--text-3)',
        fontFamily: 'var(--mono)', lineHeight: 1.6,
      }}>
        Third-party notices · EULA · Privacy · Changelog
      </div>

      <div style={{
        marginTop: 10, fontSize: 10.5, color: 'var(--text-3)',
        fontFamily: 'var(--mono)', textAlign: 'center',
      }}>
        © 2024–2026 KS Info System Co., Ltd. All rights reserved.
      </div>
    </OverlayShell>
  );
};

// ── Account profile (minimal, on-prem single-user friendly) ───────
const AccountProfile = ({ onClose }) => {
  const [pwOpen, setPwOpen] = React.useState(false);
  const [oldPw, setOldPw] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const Row = ({ l, v, mono = true }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : 'var(--sans)' }}>{v}</div>
    </div>
  );

  const pwOk = newPw.length >= 8 && newPw === confirmPw;

  return (
    <OverlayShell onClose={onClose}
      title="Account profile"
      desc="Local account details. No external directory.">

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 12px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--navy)', color: '#fff',
          display: 'grid', placeItems: 'center',
          fontSize: 15, fontWeight: 700,
        }}>A</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
            Owner · local account · no email required
          </div>
        </div>
      </div>

      <div>
        <Row l="Username" v="admin"/>
        <Row l="Role" v="Owner (full access)"/>
        <Row l="Last sign-in" v="2026-04-22 08:52:14 JST"/>
        <Row l="Sign-in from" v="127.0.0.1 · on-premise console"/>
        <Row l="Active session" v="since 2026-04-22 08:52"/>
      </div>

      {/* Password change */}
      <div style={{ marginTop: 14, border: '1px solid var(--border)', borderRadius: 3, background: 'var(--panel-2)' }}>
        <div style={{
          padding: '8px 11px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => { setPwOpen(v => !v); setSaved(false); }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>Change password</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>Last changed 2025-11-14</div>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{pwOpen ? '▴' : '▾'}</span>
        </div>
        {pwOpen && (
          <div style={{ padding: '10px 11px 11px', borderTop: '1px solid var(--border)', background: '#fff' }}>
            {['Current password', 'New password', 'Confirm new password'].map((label, i) => {
              const val  = [oldPw, newPw, confirmPw][i];
              const setv = [setOldPw, setNewPw, setConfirmPw][i];
              return (
                <div key={label} style={{ marginBottom: i < 2 ? 8 : 0 }}>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>{label}</label>
                  <input type="password" value={val} onChange={e => setv(e.target.value)} style={{
                    width: '100%', height: 24, padding: '0 8px', fontSize: 11.5,
                    fontFamily: 'var(--mono)', border: '1px solid var(--border-strong)',
                    borderRadius: 3, outline: 'none', background: '#fff',
                  }}/>
                </div>
              );
            })}
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, color: newPw && !pwOk ? 'var(--red)' : 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                {newPw
                  ? (pwOk ? '✓ ok' : (newPw.length < 8 ? 'min 8 chars' : 'mismatch'))
                  : 'min 8 chars, differs from current'}
              </span>
              <button
                disabled={!pwOk || !oldPw}
                onClick={() => { setSaved(true); setOldPw(''); setNewPw(''); setConfirmPw(''); }}
                style={{
                  height: 24, padding: '0 12px',
                  border: `1px solid ${(pwOk && oldPw) ? 'var(--navy)' : 'var(--border-strong)'}`,
                  background: (pwOk && oldPw) ? 'var(--navy)' : 'var(--panel-2)',
                  color: (pwOk && oldPw) ? '#fff' : 'var(--text-3)',
                  borderRadius: 3, fontSize: 11, fontWeight: 500,
                  cursor: (pwOk && oldPw) ? 'pointer' : 'not-allowed',
                }}>Update password</button>
            </div>
            {saved && <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--green)', fontFamily: 'var(--mono)' }}>✓ Password updated · audit entry recorded</div>}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 12, padding: '8px 11px',
        background: 'var(--panel-2)', border: '1px solid var(--border)',
        borderRadius: 3, fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', lineHeight: 1.55,
      }}>
        To add more local users, go to Site settings → Access.
      </div>
    </OverlayShell>
  );
};

// ── New Site modal ────────────────────────────────────────────
const NewSiteModal = ({ onClose, onCreate }) => {
  const [name, setName] = React.useState('');
  const [envKind, setEnvKind] = React.useState('Mainframe');
  const [envOther, setEnvOther] = React.useState('');
  const [envDetail, setEnvDetail] = React.useState('');

  // TO-BE (target)
  const [toDb, setToDb] = React.useState('PostgreSQL');
  const [toVer, setToVer] = React.useState('15.4');
  const [toHost, setToHost] = React.useState('');
  const [toPort, setToPort] = React.useState('5432');
  const [toUser, setToUser] = React.useState('');
  const [toPw, setToPw] = React.useState('');

  // AS-IS (source) — optional, project-level override possible
  const [fromDb, setFromDb] = React.useState('Oracle');
  const [fromVer, setFromVer] = React.useState('19c');
  const [fromHost, setFromHost] = React.useState('');
  const [fromPort, setFromPort] = React.useState('1521');
  const [fromUser, setFromUser] = React.useState('');
  const [fromPw, setFromPw] = React.useState('');

  const envs = ['Mainframe', 'Midrange', 'Cloud', 'Other'];
  const dbs  = ['PostgreSQL', 'Oracle', 'MariaDB', 'Tibero', 'SQL Server', 'MySQL', 'DB2', 'Sybase', 'Informix'];

  const canCreate = name.trim().length >= 2 && (envKind !== 'Other' || envOther.trim().length >= 2);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,18,16,0.55)',
      display: 'grid', placeItems: 'center', zIndex: 2000,
    }}
    onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 600, maxHeight: '88vh', overflow: 'auto',
          background: 'var(--panel)',
          border: '1px solid var(--border-strong)',
          borderRadius: 5,
          boxShadow: '0 30px 80px rgba(10,20,18,0.35)',
        }}>

        <div style={{
          padding: '12px 16px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>New site</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              A site groups projects under one target environment.
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 22, height: 22, border: '1px solid var(--border)',
            background: '#fff', borderRadius: 3, cursor: 'pointer',
            fontSize: 11, color: 'var(--text-3)',
          }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <NSField label="Site name" hint="e.g. KDB Bank, LG Electronics">
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Acme Bank"
              style={nsInput}/>
          </NSField>

          <NSField label="Environment">
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-strong)', borderRadius: 3, overflow: 'hidden' }}>
              {envs.map((e, i) => (
                <button key={e} onClick={() => setEnvKind(e)} style={{
                  flex: 1, height: 26,
                  borderLeft: i ? '1px solid var(--border)' : 'none',
                  background: envKind === e ? 'var(--navy-50)' : '#fff',
                  color: envKind === e ? 'var(--navy)' : 'var(--text-2)',
                  fontWeight: envKind === e ? 600 : 500,
                  fontFamily: 'var(--mono)', fontSize: 11,
                  cursor: 'pointer', border: 'none',
                }}>{e}</button>
              ))}
            </div>
            {envKind === 'Other' && (
              <input value={envOther} onChange={e => setEnvOther(e.target.value)}
                autoFocus placeholder="Specify environment (e.g. Hybrid on-prem/cloud, Edge cluster)"
                style={{ ...nsInput, marginTop: 6 }}/>
            )}
          </NSField>

          <NSField label="Env detail" hint="Optional · e.g. IBM z/OS 2.5, AWS eu-central-1">
            <input value={envDetail} onChange={e => setEnvDetail(e.target.value)} placeholder="optional"
              style={nsInput}/>
          </NSField>

          {/* TO-BE (target) */}
          <DBSection
            tone="navy"
            title="TO-BE · target database"
            hint="This site's target. Required before running migrations."
            db={toDb} setDb={setToDb}
            ver={toVer} setVer={setToVer}
            host={toHost} setHost={setToHost}
            port={toPort} setPort={setToPort}
            user={toUser} setUser={setToUser}
            pw={toPw} setPw={setToPw}
            dbs={dbs}
          />

          {/* AS-IS (source) */}
          <DBSection
            tone="gray"
            title="AS-IS · default source database"
            hint="Optional · projects can override with their own source."
            db={fromDb} setDb={setFromDb}
            ver={fromVer} setVer={setFromVer}
            host={fromHost} setHost={setFromHost}
            port={fromPort} setPort={setFromPort}
            user={fromUser} setUser={setFromUser}
            pw={fromPw} setPw={setFromPw}
            dbs={dbs}
          />
        </div>

        <div style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            You can edit all of this later in Site settings.
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} style={{
              height: 26, padding: '0 12px',
              border: '1px solid var(--border-strong)', background: '#fff',
              borderRadius: 3, fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
            }}>Cancel</button>
            <button
              disabled={!canCreate}
              onClick={() => onCreate({
                id: 's' + Date.now(),
                name: name.trim(),
                env: envKind === 'Other' ? envOther.trim() : envKind,
                envDetail,
                dbKind: toDb, dbVer: toVer,
                toBe:  { db: toDb,   ver: toVer,   host: toHost,   port: toPort,   user: toUser   },
                asIs:  { db: fromDb, ver: fromVer, host: fromHost, port: fromPort, user: fromUser },
              })}
              style={{
                height: 26, padding: '0 14px',
                border: `1px solid ${canCreate ? 'var(--navy)' : 'var(--border-strong)'}`,
                background: canCreate ? 'var(--navy)' : 'var(--panel-2)',
                color: canCreate ? '#fff' : 'var(--text-3)',
                borderRadius: 3, fontSize: 11.5, fontWeight: 600,
                cursor: canCreate ? 'pointer' : 'not-allowed',
              }}>Create site</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DBSection = ({
  tone, title, hint, dbs,
  db, setDb, ver, setVer,
  host, setHost, port, setPort,
  user, setUser, pw, setPw,
}) => {
  const borderColor = tone === 'navy' ? 'var(--navy)' : 'var(--border)';
  const bgColor     = tone === 'navy' ? 'var(--navy-50)' : 'var(--panel-2)';
  const titleColor  = tone === 'navy' ? 'var(--navy)' : 'var(--text-3)';
  return (
    <div style={{
      marginBottom: 11,
      padding: '9px 11px',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 3,
    }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: titleColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        {hint && <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>{hint}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 7, marginBottom: 7 }}>
        <select value={db} onChange={e => setDb(e.target.value)} style={{
          ...nsInput, height: 24, appearance: 'auto', cursor: 'pointer',
        }}>
          {dbs.map(d => <option key={d}>{d}</option>)}
        </select>
        <input value={ver} onChange={e => setVer(e.target.value)} placeholder="version" style={{ ...nsInput, height: 24 }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 7, marginBottom: 7 }}>
        <input value={host} onChange={e => setHost(e.target.value)} placeholder="host (10.20.30.40)" style={{ ...nsInput, height: 24 }}/>
        <input value={port} onChange={e => setPort(e.target.value)} placeholder="port" style={{ ...nsInput, height: 24 }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        <input value={user} onChange={e => setUser(e.target.value)} placeholder="username" style={{ ...nsInput, height: 24 }}/>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="password" style={{ ...nsInput, height: 24 }}/>
      </div>

      <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          {host && user ? 'ready to test' : 'add host & username to test'}
        </span>
        <button disabled={!host || !user} style={{
          height: 22, padding: '0 10px', fontSize: 10.5,
          border: '1px solid var(--border-strong)', background: '#fff',
          color: (host && user) ? 'var(--text)' : 'var(--text-4)',
          borderRadius: 3, cursor: (host && user) ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--mono)',
        }}>Test connection</button>
      </div>
    </div>
  );
};

const NSField = ({ label, hint, children }) => (
  <div style={{ marginBottom: 11 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
      {hint && <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const nsInput = {
  width: '100%', height: 26, padding: '0 9px', fontSize: 12,
  fontFamily: 'var(--mono)', border: '1px solid var(--border-strong)',
  borderRadius: 3, outline: 'none', background: '#fff',
};

Object.assign(window, { SignOutScreen, SignedOutScreen, Help, About, AccountProfile, NewSiteModal });
