/* Mapping definition tab */

const Mapping = ({ mapping }) => {
  const [q, setQ] = React.useState('');
  const [ruleFilter, setRuleFilter] = React.useState('all');
  const [activeIdx, setActiveIdx] = React.useState(13); // the kanji one — interesting detail

  const rows = mapping.filter(r =>
    (!q || r.src.toLowerCase().includes(q.toLowerCase()) || r.tgt.toLowerCase().includes(q.toLowerCase())) &&
    (ruleFilter === 'all' || r.rule === ruleFilter)
  );

  const active = mapping[activeIdx];

  const counts = {
    all: mapping.length,
    auto:  mapping.filter(r => r.rule === 'auto').length,
    rule:  mapping.filter(r => r.rule === 'rule').length,
    skip:  mapping.filter(r => r.rule === 'skip').length,
    added: mapping.filter(r => r.rule === 'added').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Context bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Table</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--panel-2)',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500,
          }}>
            ACCT_MASTER <Ic.chev/>
          </div>
        </div>

        <Divider vertical/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--mono)', fontSize: 12 }}>
          <span style={{ color: 'var(--text-3)' }}>source</span>
          <span style={{ color: 'var(--text)' }}>/vol/mf/ACCT_MASTER.dat</span>
          <TypeBadge>EBCDIC · rlen 512</TypeBadge>
          <span style={{ color: 'var(--text-3)' }}><Ic.arrow/></span>
          <span style={{ color: 'var(--text-3)' }}>target</span>
          <span style={{ color: 'var(--text)' }}>prod_core.account_master</span>
          <TypeBadge>PostgreSQL 15 · UTF-8</TypeBadge>
        </div>

        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          <StatusBadge tone="ok">{counts.auto} passthrough</StatusBadge>
          <StatusBadge tone="info">{counts.rule} transform</StatusBadge>
          <StatusBadge tone="skip">{counts.skip} drop</StatusBadge>
          {counts.added > 0 && <StatusBadge tone="ok">{counts.added} added</StatusBadge>}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 26, padding: '0 8px', minWidth: 240,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)',
          color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by field name…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}/>
        </div>
        <div style={{
          display: 'flex', height: 26,
          border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)',
        }}>
          {[
            ['all','All','Show every mapping row. Total in this table.'],
            ['auto','Passthrough','Source → target copied with no transform. Type and name match 1:1; safe to migrate as-is.'],
            ['rule','Transform','A transform is applied. E.g. EBCDIC→UTF-8 iconv, COMP-3 unpack, date parse, value lookup.'],
            ['skip','Drop','Field is excluded from migration. Usually deprecated, filler, or replaced by a computed column.'],
            ['added','Added','New TO-BE column with no AS-IS source. Must be filled via default value, generator, or computed expression.'],
          ].map(([k,l,tip],i) => (
            <button key={k} onClick={() => setRuleFilter(k)} title={tip} style={{
              padding: '0 10px', border: 'none',
              borderLeft: i ? '1px solid var(--border)' : 'none',
              background: ruleFilter === k ? 'var(--navy-50)' : 'transparent',
              color: ruleFilter === k ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: ruleFilter === k ? 600 : 500,
              fontSize: 12, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Btn kind="secondary" size="sm" icon={<Ic.download/>}>Import YAML</Btn>
        <Btn kind="secondary" size="sm">Auto-map unmapped</Btn>
        <Btn kind="primary" size="sm" icon={<Ic.check/>}>Validate</Btn>
      </div>

      {/* Grid + inspector */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {[
                  { l: '', w: 24 },
                  { l: 'Source field', w: '30%' },
                  { l: 'Source type', w: 180 },
                  { l: '', w: 28 },
                  { l: 'Target field', w: '24%' },
                  { l: 'Target type', w: 140 },
                  { l: 'Rule', w: 60 },
                  { l: 'Status', w: 80 },
                ].map((h, i) => (
                  <th key={i} style={{
                    width: h.w,
                    padding: '6px 10px',
                    textAlign: 'left',
                    fontWeight: 500, fontSize: 11,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
                    background: 'var(--panel-2)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky', top: 0,
                  }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const realIdx = mapping.indexOf(r);
                const isActive = realIdx === activeIdx;
                return (
                  <tr key={r.src + i}
                    onClick={() => setActiveIdx(realIdx)}
                    style={{
                      background: isActive ? 'var(--navy-50)' : (i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)'),
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid var(--navy)' : '2px solid transparent',
                    }}
                  >
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {r.pk && <span title="primary key" style={{ color: 'var(--navy)', display: 'inline-flex' }}><Ic.key/></span>}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500, color: r.rule === 'skip' ? 'var(--text-3)' : (r.rule === 'added' ? 'var(--text-4)' : 'var(--text)') }}>
                      {r.rule === 'added' ? <span style={{ fontStyle: 'italic' }}>(new in TO-BE)</span> : r.src}
                    </td>
                    <td style={{ padding: '5px 10px' }}>{r.srcType === '—' ? <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>—</span> : <TypeBadge>{r.srcType}</TypeBadge>}</td>
                    <td style={{ padding: '5px 0', textAlign: 'center', color: r.rule === 'skip' ? 'var(--text-4)' : (r.rule === 'added' ? 'var(--green)' : 'var(--text-3)') }}>
                      {r.rule === 'added' ? '+' : <Ic.arrow/>}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500, color: r.rule === 'skip' ? 'var(--text-4)' : 'var(--text)' }}>
                      {r.tgt}
                    </td>
                    <td style={{ padding: '5px 10px' }}>{r.tgtType === '—' ? <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>—</span> : <TypeBadge>{r.tgtType}</TypeBadge>}</td>
                    <td style={{ padding: '5px 10px' }}><RuleTag rule={r.rule}/></td>
                    <td style={{ padding: '5px 10px' }}>
                      {r.status === 'ok'   && <StatusBadge tone="ok">ok</StatusBadge>}
                      {r.status === 'warn' && <StatusBadge tone="warn">warn</StatusBadge>}
                      {r.status === 'err'  && <StatusBadge tone="err">error</StatusBadge>}
                      {r.status === 'skip' && <StatusBadge tone="skip">skip</StatusBadge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inspector */}
        <aside style={{
          width: 340, minWidth: 340,
          borderLeft: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex', flexDirection: 'column',
          overflow: 'auto',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Mapping detail</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{active.src}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>→ {active.tgt}</div>
          </div>

          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
            <Row k="Source type"><TypeBadge>{active.srcType}</TypeBadge></Row>
            <Row k="Target type">{active.tgtType === '—' ? <span style={{ color: 'var(--text-4)' }}>—</span> : <TypeBadge>{active.tgtType}</TypeBadge>}</Row>
            <Row k="Rule"><RuleTag rule={active.rule}/></Row>
            <Row k="Primary key">{active.pk ? <StatusBadge tone="info">yes</StatusBadge> : <span style={{ color: 'var(--text-4)' }}>—</span>}</Row>
            <Row k="Nullable"><span style={{ color: 'var(--text-2)' }}>no</span></Row>
            <Row k="Samples scanned"><span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>18,442,331</span></Row>
          </div>

          <div style={{ padding: '10px 14px 6px', borderTop: '1px solid var(--border)' }}>
            <div title="The actual transform pipeline applied to this field. Each line is piped into the next; the final value is written to the target column."
              style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>Transform</span>
              <span style={{ fontSize: 9, color: 'var(--text-4)', border: '1px solid var(--text-4)', borderRadius: '50%', width: 10, height: 10, display: 'inline-grid', placeItems: 'center', fontFamily: 'var(--sans)' }}>?</span>
            </div>
            <div style={{
              padding: 10,
              background: '#0e1a2b',
              color: '#cad7e8',
              fontFamily: 'var(--mono)', fontSize: 11.5,
              borderRadius: 4,
              lineHeight: 1.5,
            }}>
              <div><span style={{ color: '#7a8aa6' }}>-- </span><span style={{ color: '#7a8aa6' }}>rule: iconv + codepoint guard</span></div>
              <div><span style={{ color: '#e8b86f' }}>iconv</span>(<span style={{ color: '#9fd9b3' }}>'ebcdic-kanji'</span>, <span style={{ color: '#9fd9b3' }}>'utf-8'</span>, source)</div>
              <div>&nbsp;&nbsp;| <span style={{ color: '#e8b86f' }}>nfkc_normalize</span></div>
              <div>&nbsp;&nbsp;| <span style={{ color: '#e8b86f' }}>trim</span>('　 ')</div>
              <div>&nbsp;&nbsp;| <span style={{ color: '#e8b86f' }}>ensure_cp</span>(<span style={{ color: '#9fd9b3' }}>'JIS X 0208'</span>, <span style={{ color: '#e89f6f' }}>on_violation</span>=<span style={{ color: '#9fd9b3' }}>'warn'</span>)</div>
            </div>
          </div>

          {active.note && (
            <div style={{
              margin: '10px 14px 0',
              padding: 10,
              background: active.status === 'err' ? 'var(--red-50)' : active.status === 'warn' ? 'var(--amber-50)' : 'var(--gray-50)',
              border: `1px solid ${active.status === 'err' ? '#e5b2b2' : active.status === 'warn' ? '#ebcf8e' : 'var(--border)'}`,
              borderRadius: 4,
              fontSize: 11.5,
              color: active.status === 'err' ? '#8a2424' : active.status === 'warn' ? '#7a4d05' : 'var(--text-2)',
              fontFamily: 'var(--mono)', lineHeight: 1.5,
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.7, marginBottom: 4 }}>Note</div>
              {active.note}
            </div>
          )}

          <div style={{ padding: '14px', marginTop: 'auto', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <Btn kind="secondary" size="sm">Edit rule</Btn>
            <Btn kind="secondary" size="sm">Preview 10</Btn>
            <div style={{ flex: 1 }}/>
            <Btn kind="ghost" size="sm" icon={<Ic.ext/>}>Docs</Btn>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Row = ({ k, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 20 }}>
    <div style={{ width: 110, color: 'var(--text-3)', fontSize: 11.5 }}>{k}</div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

window.Mapping = Mapping;
