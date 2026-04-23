/* New Project modal — multi-step form */

const SRC_KINDS = [
  { id: 'mainframe', label: 'Mainframe (EBCDIC)', sub: 'IBM z/OS · VSAM/QSAM · fixed-length' },
  { id: 'oracle',    label: 'Oracle',             sub: '11g / 12c / 19c · OCI or DataPump' },
  { id: 'mysql',     label: 'MySQL / MariaDB',    sub: '5.7+ · logical replication' },
  { id: 'mssql',     label: 'SQL Server',         sub: '2016+ · BCP or linked server' },
  { id: 'file',      label: 'Flat file',          sub: 'CSV · TSV · fixed-width · Parquet' },
];

const TGT_KINDS = [
  { id: 'postgres', label: 'PostgreSQL',    sub: '14 / 15 / 16 · native COPY' },
  { id: 'mysql',    label: 'MySQL 8',       sub: 'InnoDB · LOAD DATA INFILE' },
  { id: 'tibero',   label: 'Tibero 7',      sub: 'Oracle-compat · tbLoader' },
  { id: 'linux',    label: 'Linux / UTF-8', sub: 'open-system flat files' },
];

const ENCODINGS_BY_SRC = {
  mainframe: [
    { id: 'ebcdic-jp', label: 'IBM-939', sub: 'Japanese EBCDIC · Katakana' },
    { id: 'ebcdic-jp2', label: 'IBM-1390', sub: 'Japanese EBCDIC · Kanji extended' },
    { id: 'ebcdic-kr', label: 'IBM-933', sub: 'Korean EBCDIC' },
    { id: 'ebcdic-us', label: 'IBM-037', sub: 'US EBCDIC (Latin-1)' },
  ],
  oracle: [
    { id: 'ja16sjis', label: 'JA16SJIS', sub: 'Shift-JIS' },
    { id: 'ko16ksc', label: 'KO16KSC5601', sub: 'Korean · KSC' },
    { id: 'al32utf8', label: 'AL32UTF8', sub: 'UTF-8 (recommended)' },
  ],
  mysql:  [{ id: 'utf8mb4', label: 'utf8mb4', sub: 'UTF-8 (4-byte)' }, { id: 'sjis', label: 'sjis', sub: 'Shift-JIS' }],
  mssql:  [{ id: 'utf8', label: 'UTF-8' }, { id: 'cp932', label: 'CP932 / Shift-JIS' }, { id: 'cp949', label: 'CP949 / Korean' }],
  file:   [{ id: 'utf8', label: 'UTF-8' }, { id: 'sjis', label: 'Shift-JIS' }, { id: 'euc-kr', label: 'EUC-KR' }],
};
const TARGET_ENCODINGS = [
  { id: 'utf8', label: 'UTF-8', sub: 'recommended' },
  { id: 'utf8mb4', label: 'utf8mb4' },
  { id: 'sjis', label: 'Shift-JIS' },
  { id: 'euc-kr', label: 'EUC-KR' },
];

const NewProjectModal = ({ onClose, onCreate }) => {
  const [step, setStep] = React.useState(0);
  const [f, setF] = React.useState({
    name: '',
    client: '',
    env: 'prod',
    srcKind: 'mainframe',
    srcHost: 'mf-prod-01.internal',
    srcPath: '/vol/mf',
    srcEnc: 'ebcdic-jp',
    srcDdl: null,   // { filename, uploadedAt, tables, columns } | null
    tgtKind: 'postgres',
    tgtHost: 'pg-prod.rds.internal',
    tgtDb: 'core_migrated',
    tgtEnc: 'utf8',
    tgtDdl: null,   // same shape
    validate: true,
    dryRun: true,
    parallel: 8,
    steward: 'kenji.sato',
  });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const steps = ['General', 'Source', 'Target', 'Options'];

  const canNext = {
    0: f.name.trim().length >= 3 && f.client.trim().length > 0,
    1: !!f.srcHost && !!f.srcEnc,
    2: !!f.tgtHost && !!f.tgtDb && !!f.tgtEnc,
    3: true,
  }[step];

  const srcEncs = ENCODINGS_BY_SRC[f.srcKind] || [];

  const create = () => {
    const p = {
      id: 'p' + Date.now().toString(36),
      name: `${f.client} / ${f.name}`,
      client: f.client,
      tables: 0,
      status: 'waiting',
      src: SRC_KINDS.find(s => s.id === f.srcKind)?.label || f.srcKind,
      tgt: TGT_KINDS.find(s => s.id === f.tgtKind)?.label || f.tgtKind,
      updated: 'just now',
      isNew: true,
      config: {
        env: f.env,
        srcHost: f.srcHost, srcPath: f.srcPath,
        srcEnc: (ENCODINGS_BY_SRC[f.srcKind] || []).find(e => e.id === f.srcEnc)?.label || f.srcEnc,
        tgtHost: f.tgtHost, tgtDb: f.tgtDb,
        tgtEnc: TARGET_ENCODINGS.find(e => e.id === f.tgtEnc)?.label || f.tgtEnc,
        parallel: f.parallel, validate: f.validate, dryRun: f.dryRun,
        steward: f.steward,
      },
      ddl: { asis: f.srcDdl, tobe: f.tgtDdl },
    };
    onCreate(p);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(15, 25, 45, 0.35)',
      display: 'grid', placeItems: 'center',
      backdropFilter: 'blur(1px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 620, maxWidth: '92vw', maxHeight: '88vh',
          background: 'var(--panel)',
          border: '1px solid var(--border-strong)', borderRadius: 6,
          boxShadow: '0 20px 60px rgba(15, 25, 45, 0.25)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontSize: 12,
        }}>
        {/* Header */}
        <div style={{
          height: 36, padding: '0 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 2,
              background: 'var(--navy)', color: '#fff',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
            }}>N</div>
            <span style={{ fontWeight: 600, fontSize: 12 }}>New migration project</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>· step {step + 1} of {steps.length}</span>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-3)', padding: 2,
          }}><Ic.x/></button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
          {steps.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button key={s}
                onClick={() => i < step && setStep(i)}
                style={{
                  flex: 1,
                  height: 30,
                  border: 'none',
                  borderRight: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                  background: active ? 'var(--navy-50)' : 'transparent',
                  color: active ? 'var(--navy)' : done ? 'var(--text-2)' : 'var(--text-3)',
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: i <= step ? 'pointer' : 'default',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  position: 'relative',
                }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: active ? 'var(--navy)' : done ? 'var(--green)' : 'var(--gray-50)',
                  color: active || done ? '#fff' : 'var(--text-3)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                }}>{done ? '✓' : i + 1}</span>
                {s}
                {active && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--navy)' }}/>}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: 'var(--panel)' }}>
          {step === 0 && (
            <Form>
              <Field k="Project name" hint="shown in sidebar and top bar">
                <Input value={f.name} onChange={v => set('name', v)} placeholder="Core Ledger 2026Q2"/>
                <Slug>slug: {slugify(f.client + '-' + f.name) || '—'}</Slug>
              </Field>
              <Field k="Client / tenant">
                <Input value={f.client} onChange={v => set('client', v)} placeholder="KDB Bank" mono/>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field k="Environment">
                  <Pills value={f.env} onChange={v => set('env', v)} options={[
                    { id: 'dev', l: 'dev' }, { id: 'stg', l: 'stg' }, { id: 'prod', l: 'prod' },
                  ]}/>
                </Field>
                <Field k="Data steward">
                  <Input value={f.steward} onChange={v => set('steward', v)} mono/>
                </Field>
              </div>
            </Form>
          )}

          {step === 1 && (
            <Form>
              <Field k="Source system">
                <RadioCards value={f.srcKind} onChange={v => {
                  set('srcKind', v);
                  const list = ENCODINGS_BY_SRC[v] || [];
                  if (list.length) set('srcEnc', list[0].id);
                }} options={SRC_KINDS}/>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field k="Host / dataset">
                  <Input value={f.srcHost} onChange={v => set('srcHost', v)} mono/>
                </Field>
                <Field k={f.srcKind === 'mainframe' || f.srcKind === 'file' ? 'Path' : 'Schema'}>
                  <Input value={f.srcPath} onChange={v => set('srcPath', v)} mono/>
                </Field>
              </div>
              <Field k="Source encoding" hint="used by character-encoding stage">
                <EncList value={f.srcEnc} onChange={v => set('srcEnc', v)} options={srcEncs}/>
              </Field>
              <Field k="AS-IS schema (DDL)" hint="optional · can be uploaded later in Settings">
                <DdlPicker value={f.srcDdl} onChange={v => set('srcDdl', v)} side="asis"/>
              </Field>
            </Form>
          )}

          {step === 2 && (
            <Form>
              <Field k="Target system">
                <RadioCards value={f.tgtKind} onChange={v => set('tgtKind', v)} options={TGT_KINDS}/>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field k="Host">
                  <Input value={f.tgtHost} onChange={v => set('tgtHost', v)} mono/>
                </Field>
                <Field k="Database / schema">
                  <Input value={f.tgtDb} onChange={v => set('tgtDb', v)} mono/>
                </Field>
              </div>
              <Field k="Target encoding">
                <EncList value={f.tgtEnc} onChange={v => set('tgtEnc', v)} options={TARGET_ENCODINGS}/>
              </Field>
              <Field k="TO-BE schema (DDL)" hint="optional · can be uploaded later in Settings">
                <DdlPicker value={f.tgtDdl} onChange={v => set('tgtDdl', v)} side="tobe"/>
              </Field>
              <div style={{
                padding: 10, background: 'var(--panel-2)', border: '1px solid var(--border)',
                borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ color: 'var(--text-3)' }}>encoding pipeline</span>
                <span>{(srcEncs.find(e => e.id === f.srcEnc)?.label) || '—'}</span>
                <span style={{ color: 'var(--text-3)' }}><Ic.arrow/></span>
                <span>{TARGET_ENCODINGS.find(e => e.id === f.tgtEnc)?.label || '—'}</span>
                <span style={{ flex: 1 }}/>
                <StatusBadge tone="info">iconv + nfkc</StatusBadge>
              </div>
            </Form>
          )}

          {step === 3 && (
            <Form>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field k="Parallel workers">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min="1" max="32" value={f.parallel}
                      onChange={e => set('parallel', parseInt(e.target.value))}
                      style={{ flex: 1 }}/>
                    <span style={{ fontFamily: 'var(--mono)', width: 30, textAlign: 'right' }}>{f.parallel}</span>
                  </div>
                </Field>
                <Field k="Pre-flight">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Check checked={f.validate} onChange={v => set('validate', v)} label="Validate schemas before run"/>
                    <Check checked={f.dryRun} onChange={v => set('dryRun', v)} label="Dry run (no commit)"/>
                  </div>
                </Field>
              </div>

              <Field k="Summary">
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 3,
                  fontFamily: 'var(--mono)', fontSize: 11,
                  background: '#0e1a2b', color: '#cad7e8',
                  padding: 10, lineHeight: 1.6,
                }}>
                  <div><span style={{ color: '#7a8aa6' }}># project</span></div>
                  <div><span style={{ color: '#8aa0bf' }}>name</span>    = {f.client} / {f.name || <span style={{ color: '#ffb4b4' }}>(required)</span>}</div>
                  <div><span style={{ color: '#8aa0bf' }}>env</span>     = {f.env}</div>
                  <div><span style={{ color: '#8aa0bf' }}>steward</span> = {f.steward}</div>
                  <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># source</span></div>
                  <div><span style={{ color: '#8aa0bf' }}>kind</span>    = {SRC_KINDS.find(s => s.id === f.srcKind)?.label}</div>
                  <div><span style={{ color: '#8aa0bf' }}>host</span>    = {f.srcHost}{f.srcPath ? ':' + f.srcPath : ''}</div>
                  <div><span style={{ color: '#8aa0bf' }}>enc</span>     = {srcEncs.find(e => e.id === f.srcEnc)?.label}</div>
                  <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># target</span></div>
                  <div><span style={{ color: '#8aa0bf' }}>kind</span>    = {TGT_KINDS.find(s => s.id === f.tgtKind)?.label}</div>
                  <div><span style={{ color: '#8aa0bf' }}>host</span>    = {f.tgtHost}/{f.tgtDb}</div>
                  <div><span style={{ color: '#8aa0bf' }}>enc</span>     = {TARGET_ENCODINGS.find(e => e.id === f.tgtEnc)?.label}</div>
                  <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># options</span></div>
                  <div><span style={{ color: '#8aa0bf' }}>workers</span> = {f.parallel}{f.dryRun ? '  · dry-run' : ''}{f.validate ? '  · validate' : ''}</div>
                </div>
              </Field>
            </Form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--panel-2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            All values can be edited later in Settings.
          </span>
          <div style={{ flex: 1 }}/>
          <Btn kind="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          {step > 0 && <Btn kind="secondary" size="sm" onClick={() => setStep(step - 1)}>Back</Btn>}
          {step < steps.length - 1 && (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              style={{
                height: 24, padding: '0 12px', borderRadius: 3,
                border: '1px solid var(--navy)',
                background: canNext ? 'var(--navy)' : 'var(--border)',
                color: canNext ? '#fff' : 'var(--text-3)',
                cursor: canNext ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
              Continue <Ic.chevR/>
            </button>
          )}
          {step === steps.length - 1 && (
            <Btn kind="primary" size="sm" icon={<Ic.check/>} onClick={create}>Create project</Btn>
          )}
        </div>
      </div>
    </div>
  );
};

const Form = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
);

const Field = ({ k, hint, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 4,
    }}>
      <label style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>{k}</label>
      {hint && <span style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, mono }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      height: 26, padding: '0 8px',
      border: '1px solid var(--border-strong)', borderRadius: 3,
      background: '#fff', color: 'var(--text)',
      fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: mono ? 12 : 12.5,
      outline: 'none',
    }}
    onFocus={e => e.target.style.borderColor = 'var(--border-strong)'}
    onBlur={e  => e.target.style.borderColor = 'var(--border)'}
  />
);

const Slug = ({ children }) => (
  <div style={{ marginTop: 3, fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{children}</div>
);

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    width: '100%', height: 26, padding: '0 8px',
    border: '1px solid var(--border-strong)', borderRadius: 3,
    background: '#fff', color: 'var(--text)',
    fontSize: 12, outline: 'none',
  }}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

const Pills = ({ value, onChange, options }) => (
  <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 3, overflow: 'hidden', height: 26 }}>
    {options.map((o, i) => (
      <button key={o.id} onClick={() => onChange(o.id)} style={{
        flex: 1, border: 'none',
        borderLeft: i ? '1px solid var(--border)' : 'none',
        background: value === o.id ? 'var(--navy-50)' : '#fff',
        color: value === o.id ? 'var(--navy)' : 'var(--text-2)',
        fontWeight: value === o.id ? 600 : 500,
        fontFamily: 'var(--mono)', fontSize: 11,
        cursor: 'pointer',
      }}>{o.l}</button>
    ))}
  </div>
);

const RadioCards = ({ value, onChange, options }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 6 }}>
    {options.map(o => {
      const active = value === o.id;
      return (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          textAlign: 'left',
          padding: '7px 10px',
          border: active ? '1px solid var(--navy)' : '1px solid var(--border)',
          background: active ? 'var(--navy-50)' : '#fff',
          borderRadius: 3,
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 2,
          position: 'relative',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--navy)' : 'var(--text)' }}>{o.label}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{o.sub}</span>
          {active && <span style={{ position: 'absolute', top: 6, right: 6, color: 'var(--navy)' }}><Ic.check/></span>}
        </button>
      );
    })}
  </div>
);

const EncList = ({ value, onChange, options }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 3, background: '#fff', maxHeight: 132, overflow: 'auto' }}>
    {options.map((o, i) => {
      const active = value === o.id;
      return (
        <div key={o.id} onClick={() => onChange(o.id)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 9px',
          borderTop: i ? '1px solid var(--border)' : 'none',
          background: active ? 'var(--navy-50)' : i % 2 ? 'var(--zebra)' : '#fff',
          cursor: 'pointer',
        }}>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            border: active ? '4px solid var(--navy)' : '1px solid var(--border-strong)',
            background: '#fff',
          }}/>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: active ? 'var(--navy)' : 'var(--text)', minWidth: 110 }}>{o.label}</span>
          {o.sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.sub}</span>}
        </div>
      );
    })}
  </div>
);

const Check = ({ checked, onChange, label }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ margin: 0 }}/>
    {label}
  </label>
);

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Inline DDL file picker used by the New Project wizard.
   Real parsing is out of scope; size-based heuristic fakes the counts. */
const DdlPicker = ({ value, onChange, side }) => {
  const ref = React.useRef();
  const pick = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const fakeTables = Math.max(1, Math.floor(file.size / 1800));
    const fakeCols   = Math.max(1, Math.floor(file.size / 180));
    const now = new Date();
    onChange({
      filename: file.name,
      uploadedAt: now.toISOString().slice(0, 16).replace('T', ' '),
      tables: fakeTables,
      columns: fakeCols,
    });
    ev.target.value = '';
  };

  if (value) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 3,
        border: '1px solid var(--green)', background: 'var(--green-50)',
        fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)',
      }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.filename}</span>
        <span style={{ color: 'var(--text-3)', fontSize: 10.5 }}>{value.tables} tables · {value.columns} cols</span>
        <input type="file" ref={ref} onChange={pick} style={{ display: 'none' }} accept=".sql,.ddl,.yaml,.yml,.txt"/>
        <button onClick={() => ref.current?.click()} style={{
          border: 'none', background: 'transparent', color: 'var(--navy)',
          cursor: 'pointer', fontSize: 11, textDecoration: 'underline',
        }}>replace</button>
        <button onClick={() => onChange(null)} style={{
          border: 'none', background: 'transparent', color: 'var(--red)',
          cursor: 'pointer', padding: 0, display: 'inline-flex',
        }} title="remove"><Ic.x/></button>
      </div>
    );
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 3,
      border: '1px dashed var(--border-strong)', background: 'var(--panel-2)',
      fontSize: 11.5, color: 'var(--text-3)',
    }}>
      <span>DDL 파일 선택 ({side === 'asis' ? 'AS-IS' : 'TO-BE'})</span>
      <span style={{ flex: 1 }}/>
      <input type="file" ref={ref} onChange={pick} style={{ display: 'none' }} accept=".sql,.ddl,.yaml,.yml,.txt"/>
      <button onClick={() => ref.current?.click()} style={{
        padding: '2px 10px', fontSize: 11, fontFamily: 'var(--mono)',
        border: '1px solid var(--border-strong)', background: 'var(--panel)',
        color: 'var(--text)', borderRadius: 3, cursor: 'pointer',
      }}>Choose file…</button>
    </div>
  );
};

window.NewProjectModal = NewProjectModal;
