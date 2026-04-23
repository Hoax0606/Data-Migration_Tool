/* Execution & monitoring tab */

const Execution = ({ stages }) => {
  const [tick, setTick] = React.useState(0);
  const [running, setRunning] = React.useState(true);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, [running]);

  // Slightly animated progress for the 'running' stages
  const s = stages.map(st => ({
    ...st,
    pct: st.tone === 'running'
      ? Math.min(st.pct + ((tick * 0.4) % 3.5), 99)
      : st.pct,
  }));

  const overall = s.reduce((a, x) => a + x.pct, 0) / s.length;
  const throughputSeries = Array.from({ length: 60 }, (_, i) => {
    // pseudo-random stable
    const v = 160 + Math.sin((i + tick) * 0.35) * 40 + Math.cos((i + tick) * 0.8) * 22;
    return Math.max(60, v);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Run header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Active run</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600 }}>run-2026-0421-0914</span>
            <StatusBadge tone={running ? 'running' : 'warn'}>{running ? 'running' : 'paused'}</StatusBadge>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>started 09:14:02 · elapsed 00:27:06 · eta 00:28:40</span>
          </div>
        </div>
        <Btn kind="secondary" size="md" icon={running ? <Ic.pause/> : <Ic.play/>} onClick={() => setRunning(r => !r)}>{running ? 'Pause' : 'Resume'}</Btn>
        <Btn kind="danger" size="md" icon={<Ic.stop/>}>Abort</Btn>
      </div>

      {/* Overall progress */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        <div style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Overall progress</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{overall.toFixed(1)}% · 2 of 7 stages complete</div>
          </div>
          <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 2, overflow: 'hidden' }}>
            {s.map(st => (
              <div key={st.id} title={`${st.name} · ${st.pct.toFixed(0)}%`}
              style={{ flex: 1, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  width: `${st.pct}%`, height: '100%',
                  background: st.tone === 'ok' ? 'var(--green)' : st.tone === 'idle' ? 'var(--text-4)' : st.color,
                  transition: 'width .4s ease',
                }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {s.map(st => (
              <div key={st.id} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                {st.name.toLowerCase().split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div style={{ padding: '14px 18px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pipeline stages</div>
        <div style={{
          border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)',
        }}>
          {s.map((st, i) => (
            <div key={st.id} style={{
              display: 'grid',
              gridTemplateColumns: '24px 170px 1fr 80px 90px 80px 24px',
              gap: 14,
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: i < s.length - 1 ? '1px solid var(--border)' : 'none',
              background: st.tone === 'running' ? 'var(--amber-50)' : 'var(--panel)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{st.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{st.sub}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar pct={st.pct} tone={st.tone} color={st.tone !== 'idle' && st.tone !== 'ok' ? st.color : undefined}/>
                </div>
                <div style={{ width: 44, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{st.pct.toFixed(0)}%</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{st.rate}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)' }}>eta {st.eta}</div>
              <div>
                {st.tone === 'ok' && <StatusBadge tone="ok">done</StatusBadge>}
                {st.tone === 'running' && <StatusBadge tone="running">live</StatusBadge>}
                {st.tone === 'idle' && <StatusBadge tone="queued">queued</StatusBadge>}
              </div>
              <div style={{ color: 'var(--text-4)', cursor: 'pointer' }}><Ic.chevR/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Error block + workers */}
      <div style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--bg)', flex: 1, minHeight: 260 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Error callout */}
          <div style={{
            border: '1px solid var(--red)',
            background: 'var(--red-50)',
            borderRadius: 4,
            padding: 14,
            display: 'flex', gap: 12,
          }}>
            <div style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }}><Ic.warn/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--red)' }}>FK violation · validate.fk</span>
                <StatusBadge tone="err">4 rows</StatusBadge>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--red)' }}>table = GL_ENTRY</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', lineHeight: 1.6 }}>
                GL_ENTRY.acct_no → ACCT_MASTER.account_no<br/>
                first offending row: <span style={{ background: 'var(--panel)', padding: '0 4px', borderRadius: 2, border: '1px solid var(--red)' }}>AC00881104</span>
                <span style={{ color: 'var(--red)' }}> · offset 0x1F08B2C0</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <Btn kind="primary" size="sm">Quarantine rows & continue</Btn>
                <Btn kind="secondary" size="sm">Open row inspector</Btn>
                <Btn kind="secondary" size="sm">Retry stage</Btn>
                <Btn kind="ghost" size="sm">Dismiss</Btn>
              </div>
            </div>
          </div>

          {/* Warning callout */}
          <div style={{
            border: '1px solid var(--amber)',
            background: 'var(--amber-50)',
            borderRadius: 4,
            padding: 12,
            display: 'flex', gap: 12,
          }}>
            <div style={{ color: 'var(--amber)', marginTop: 2 }}><Ic.warn/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--amber)' }}>invalid EBCDIC byte 0x3F</span>
                <StatusBadge tone="warn">aborted</StatusBadge>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--amber)' }}>KYC_DOCUMENT · offset 0x1A08B2C</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--amber)', lineHeight: 1.55 }}>
                source dataset contains a codepoint not defined in codepage IBM-939. Scheduler backed off to single-threaded retry.
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Btn kind="secondary" size="sm">Switch codepage → IBM-1390</Btn>
                <Btn kind="secondary" size="sm">Replace with U+FFFD</Btn>
                <Btn kind="ghost" size="sm">Dismiss</Btn>
              </div>
            </div>
          </div>
        </div>

        {/* Workers */}
        <div style={{
          width: 320,
          background: 'var(--panel)',
          border: '1px solid var(--border)', borderRadius: 4,
          padding: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Worker pool</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>12 / 16 active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginBottom: 12 }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const state = i < 2 ? 'idle' : i < 12 ? 'running' : i < 14 ? 'ok' : 'idle';
              const c = state === 'running' ? 'var(--amber)' : state === 'ok' ? 'var(--green)' : 'var(--border-strong)';
              return (
                <div key={i} style={{
                  height: 22, borderRadius: 2, background: c,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, color: state === 'idle' ? 'var(--text-3)' : '#fff',
                  fontWeight: 500,
                }}>{String(i + 1).padStart(2, '0')}</div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--text-2)', lineHeight: 1.7 }}>
            <Kv k="queue depth" v="3"/>
            <Kv k="buffer" v="64 MB"/>
            <Kv k="lag" v="212 ms" tone="ok"/>
            <Kv k="retries" v="7"/>
            <Kv k="mem" v="4.2 / 8.0 GB"/>
            <Kv k="cpu" v="68%"/>
          </div>
        </div>
      </div>
    </div>
  );
};

const Kv = ({ k, v, tone }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px dashed var(--border)' }}>
    <span style={{ color: 'var(--text-3)' }}>{k}</span>
    <span style={{ color: tone === 'ok' ? 'var(--green)' : 'var(--text)' }}>{v}</span>
  </div>
);

const Sparkline = ({ data, width = 280, height = 40, color = 'var(--navy)' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity="0.1"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
};

window.Execution = Execution;
