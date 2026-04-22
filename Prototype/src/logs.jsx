/* Log viewer */

const Logs = ({ lines }) => {
  const [levels, setLevels] = React.useState({ INFO: true, WARN: true, ERROR: true, OK: true });
  const [q, setQ] = React.useState('');
  const [follow, setFollow] = React.useState(true);
  const [wrap, setWrap] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(7); // FK violation line

  const filtered = lines.filter(l => levels[l[1]] && (!q || l.join(' ').toLowerCase().includes(q.toLowerCase())));

  const counts = {
    INFO: lines.filter(l => l[1] === 'INFO').length,
    WARN: lines.filter(l => l[1] === 'WARN').length,
    ERROR: lines.filter(l => l[1] === 'ERROR').length,
    OK: lines.filter(l => l[1] === 'OK').length,
  };

  const levelColor = (lv) => ({
    INFO:  '#4a5463',
    OK:    '#1e7a2f',
    WARN:  '#8a5a06',
    ERROR: '#a12929',
  }[lv]);

  const levelBg = (lv) => ({
    INFO:  'transparent',
    OK:    'transparent',
    WARN:  'var(--amber-50)',
    ERROR: 'var(--red-50)',
  }[lv]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 26, padding: '0 8px', minWidth: 280,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)',
          color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search log messages…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}/>
          {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}><Ic.x/></button>}
        </div>

        <div style={{ display: 'flex', height: 26, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)' }}>
          {['INFO', 'OK', 'WARN', 'ERROR'].map((lv, i) => {
            const on = levels[lv];
            const tones = { INFO: 'var(--text-2)', OK: 'var(--green)', WARN: 'var(--amber)', ERROR: 'var(--red)' };
            return (
              <button key={lv} onClick={() => setLevels({ ...levels, [lv]: !on })}
                style={{
                  padding: '0 10px',
                  border: 'none',
                  borderLeft: i ? '1px solid var(--border)' : 'none',
                  background: on ? 'var(--panel-2)' : 'transparent',
                  color: on ? tones[lv] : 'var(--text-4)',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? tones[lv] : 'var(--border-strong)'}}/>
                {lv}
                <span style={{ color: 'var(--text-4)' }}>{counts[lv]}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)} style={{ margin: 0 }}/>
            Follow tail
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={wrap} onChange={e => setWrap(e.target.checked)} style={{ margin: 0 }}/>
            Wrap
          </label>
          <Btn kind="secondary" size="sm" icon={<Ic.download/>}>Export</Btn>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#0e1a2b',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          lineHeight: '20px',
          color: '#cad7e8',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 48 }}/>
              <col style={{ width: 96 }}/>
              <col style={{ width: 58 }}/>
              <col style={{ width: 130 }}/>
              <col/>
            </colgroup>
            <tbody>
              {filtered.map((l, i) => {
                const [ts, lv, src, msg] = l;
                const isActive = i === activeIdx;
                return (
                  <tr key={i}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      background: isActive ? '#1b2d47' : (lv === 'ERROR' ? '#2a1616' : lv === 'WARN' ? '#2a2316' : (i % 2 === 1 ? '#121f33' : 'transparent')),
                      borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '0 10px', color: '#52627a', textAlign: 'right', userSelect: 'none' }}>{i + 1}</td>
                    <td style={{ padding: '0 10px', color: '#8aa0bf' }}>{ts}</td>
                    <td style={{ padding: '0 6px' }}>
                      <span style={{
                        display: 'inline-block', width: 46, textAlign: 'center',
                        background: lv === 'ERROR' ? '#5c1a1a' : lv === 'WARN' ? '#5c4a1a' : lv === 'OK' ? '#1a4a2a' : '#2a3a54',
                        color: lv === 'ERROR' ? '#ffb4b4' : lv === 'WARN' ? '#ffd98a' : lv === 'OK' ? '#a5e3b5' : '#a8b9d4',
                        borderRadius: 2,
                        fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                      }}>{lv}</span>
                    </td>
                    <td style={{ padding: '0 10px', color: '#a8b9d4' }}>{src}</td>
                    <td style={{
                      padding: '0 10px',
                      color: lv === 'ERROR' ? '#ffb4b4' : lv === 'WARN' ? '#ffd98a' : lv === 'OK' ? '#a5e3b5' : '#cad7e8',
                      whiteSpace: wrap ? 'normal' : 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{msg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Log detail */}
        <aside style={{
          width: 340, minWidth: 340,
          borderLeft: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex', flexDirection: 'column',
          overflow: 'auto',
        }}>
          {(() => {
            const l = filtered[activeIdx] || filtered[0];
            if (!l) return null;
            const [ts, lv, src, msg] = l;
            return (
              <>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Log entry #{activeIdx + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <StatusBadge tone={lv === 'ERROR' ? 'err' : lv === 'WARN' ? 'warn' : lv === 'OK' ? 'ok' : 'info'}>{lv}</StatusBadge>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{ts}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55, wordBreak: 'break-word' }}>
                    {msg}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <Row k="Source">{src}</Row>
                  <Row k="Run">run-2026-0421-0914</Row>
                  <Row k="Stage">validate · fk</Row>
                </div>
                {lv === 'ERROR' && (
                  <div style={{ margin: '0 14px 14px', padding: 10, background: 'var(--red-50)', border: '1px solid #e5b2b2', borderRadius: 4 }}>
                    <div style={{ fontSize: 10.5, color: '#8a2424', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Suggested action</div>
                    <div style={{ fontSize: 12, color: '#6e2020', lineHeight: 1.5, marginBottom: 8 }}>
                      Parent record not yet loaded. Either wait for ACCT_MASTER to complete, or quarantine and retry.
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Btn kind="primary" size="sm">Quarantine & continue</Btn>
                      <Btn kind="secondary" size="sm">Jump to row</Btn>
                    </div>
                  </div>
                )}
                <div style={{ padding: '10px 14px 6px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Context (±2)</div>
                  <div style={{
                    background: '#0e1a2b', color: '#cad7e8',
                    padding: 8, borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 11,
                    lineHeight: 1.6, maxHeight: 140, overflow: 'auto',
                  }}>
                    {filtered.slice(Math.max(0, activeIdx - 2), activeIdx + 3).map((ll, i) => (
                      <div key={i} style={{ color: i === 2 ? '#ffd98a' : '#8aa0bf', opacity: i === 2 ? 1 : 0.8 }}>
                        {ll[0].slice(3)} {ll[1].padEnd(5)} {ll[3].slice(0, 48)}…
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </aside>
      </div>

      <div style={{
        height: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderTop: '1px solid var(--border)',
        background: 'var(--panel-2)', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)',
      }}>
        <span>{filtered.length} lines shown · {lines.length} total · tail {follow ? 'on' : 'off'}</span>
      </div>
    </div>
  );
};

window.Logs = Logs;
