/* Shared primitives: badges, buttons, pills, icons */

const StatusDot = ({ tone, size = 8, ring = false }) => {
  const colors = {
    running: 'var(--amber)',
    ok: 'var(--green)',
    done: 'var(--gray)',
    waiting: 'var(--amber)',
    warn: 'var(--amber)',
    err: 'var(--red)',
    error: 'var(--red)',
    blocked: 'var(--red)',
    queued: 'var(--text-4)',
    idle: 'var(--text-4)',
    skip: 'var(--text-4)',
  };
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size, borderRadius: '50%',
      background: colors[tone] || 'var(--text-4)',
      boxShadow: ring ? `0 0 0 3px ${colors[tone]}22` : 'none',
      flexShrink: 0,
    }}/>
  );
};

const StatusBadge = ({ tone, children, mono = false }) => {
  const tones = {
    ok:      { bg: 'var(--green-50)', fg: '#1e7a2f', bd: '#b7dcc0' },
    running: { bg: 'var(--amber-50)', fg: '#8a5a06', bd: '#ebcf8e' },
    warn:    { bg: 'var(--amber-50)', fg: '#8a5a06', bd: '#ebcf8e' },
    err:     { bg: 'var(--red-50)',   fg: '#a12929', bd: '#e5b2b2' },
    error:   { bg: 'var(--red-50)',   fg: '#a12929', bd: '#e5b2b2' },
    blocked: { bg: 'var(--red-50)',   fg: '#a12929', bd: '#e5b2b2' },
    queued:  { bg: 'var(--gray-50)',  fg: 'var(--text-2)', bd: 'var(--border)' },
    skip:    { bg: 'var(--gray-50)',  fg: 'var(--text-3)', bd: 'var(--border)' },
    idle:    { bg: 'var(--gray-50)',  fg: 'var(--text-3)', bd: 'var(--border)' },
    info:    { bg: 'var(--navy-50)',  fg: 'var(--navy)',   bd: '#c5d3e4' },
  };
  const t = tones[tone] || tones.queued;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '1px 7px', height: 18, lineHeight: '16px',
      borderRadius: 9,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.1,
      fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
};

const TypeBadge = ({ children }) => (
  <span style={{
    display: 'inline-block',
    padding: '1px 6px',
    background: 'var(--panel-2)', color: 'var(--text-2)',
    border: '1px solid var(--border)',
    borderRadius: 3,
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  }}>{children}</span>
);

const RuleTag = ({ rule }) => {
  const cfg = {
    auto:  { label: 'passthrough', bg: 'var(--panel-2)', fg: 'var(--text-2)', bd: 'var(--border)' },
    rule:  { label: 'transform',   bg: 'var(--navy-50)', fg: 'var(--navy)',   bd: '#c5d3e4' },
    skip:  { label: 'drop',        bg: 'var(--panel-2)', fg: 'var(--text-3)', bd: 'var(--border)' },
    added: { label: 'added',       bg: 'var(--green-50)', fg: 'var(--green)', bd: '#b7dcc6' },
  }[rule] || { label: rule, bg: '#eee', fg: '#555', bd: '#ddd' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      background: cfg.bg, color: cfg.fg,
      border: `1px solid ${cfg.bd}`,
      borderRadius: 3,
      fontFamily: 'var(--mono)',
      fontSize: 11,
      fontWeight: 500,
    }}>{cfg.label}</span>
  );
};

const Btn = ({ kind = 'ghost', size = 'md', icon, children, onClick, active, style }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: size === 'sm' ? 24 : 28,
    padding: size === 'sm' ? '0 8px' : '0 12px',
    borderRadius: 4,
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background .08s, border-color .08s',
    whiteSpace: 'nowrap',
  };
  const variants = {
    primary: { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' },
    secondary: { background: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--border-strong)' },
    ghost: { background: active ? 'var(--navy-50)' : 'transparent', color: active ? 'var(--navy)' : 'var(--text-2)', borderColor: 'transparent' },
    danger: { background: 'var(--panel)', color: 'var(--red)', borderColor: '#e5b2b2' },
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => {
        if (kind === 'primary') e.currentTarget.style.background = 'var(--navy-700)';
        if (kind === 'secondary') e.currentTarget.style.background = 'var(--panel-2)';
        if (kind === 'ghost' && !active) e.currentTarget.style.background = 'var(--panel-2)';
        if (kind === 'danger') e.currentTarget.style.background = 'var(--red-50)';
      }}
      onMouseLeave={e => {
        Object.assign(e.currentTarget.style, variants[kind]);
      }}
      style={{ ...base, ...variants[kind], ...(style || {}) }}>
      {icon}
      {children}
    </button>
  );
};

const Kbd = ({ children }) => (
  <span style={{
    display: 'inline-block',
    padding: '0 5px',
    background: 'var(--panel)',
    border: '1px solid var(--border-strong)',
    borderBottomWidth: 2,
    borderRadius: 3,
    fontFamily: 'var(--mono)',
    fontSize: 10.5,
    color: 'var(--text-2)',
    minWidth: 16, textAlign: 'center',
  }}>{children}</span>
);

const Divider = ({ vertical, style }) => (
  <div style={{
    background: 'var(--border)',
    ...(vertical ? { width: 1, alignSelf: 'stretch', margin: '0 2px' } : { height: 1, width: '100%' }),
    ...(style || {}),
  }}/>
);

const ProgressBar = ({ pct, tone = 'running', height = 6, color }) => {
  const bg = tone === 'ok' ? 'var(--green)'
    : tone === 'err' ? 'var(--red)'
    : tone === 'warn' ? 'var(--amber)'
    : tone === 'idle' ? 'var(--text-4)'
    : 'var(--amber)';
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height,
      background: 'var(--border)',
      borderRadius: height/2,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, pct))}%`,
        height: '100%',
        background: color || bg,
        transition: 'width .4s ease',
      }}/>
    </div>
  );
};

/* Tiny inline icons (stroke only, 14px) */
const Ic = {
  play:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2l7 4-7 4V2z" fill="currentColor"/></svg>,
  pause: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="3" y="2" width="2" height="8" fill="currentColor"/><rect x="7" y="2" width="2" height="8" fill="currentColor"/></svg>,
  stop:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="2.5" width="7" height="7" fill="currentColor"/></svg>,
  refresh: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 4.5A6 6 0 1 0 14 8"/><path d="M13 2v3h-3"/></svg>,
  chev:  () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4l2 2 2-2"/></svg>,
  chevR: () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l2 2-2 2"/></svg>,
  search:() => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M9 9l3 3"/></svg>,
  filter:() => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1.5 2.5h11l-4 5v4l-3 1v-5l-4-5z"/></svg>,
  download: () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 1v8M4 6l3 3 3-3M2 12h10"/></svg>,
  gear:  () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7" cy="7" r="2"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1 1M10.2 10.2l1 1M2.8 11.2l1-1M10.2 3.8l1-1"/></svg>,
  plus:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v8M2 6h8"/></svg>,
  x:     () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l6 6M8 2l-6 6"/></svg>,
  ext:   () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2H2v6h6V6M6 2h2v2M8 2L4 6"/></svg>,
  arrow: () => <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 5h11M9 2l3 3-3 3"/></svg>,
  warn:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l5 9H1z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.2"/><path d="M6 5v2.5M6 8.5v.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  check: () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 5l2 2 4-4"/></svg>,
  key:   () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="3" cy="6" r="2"/><path d="M5 6h4M7 6v2M9 6v1.5"/></svg>,
  dot:   () => <svg width="4" height="4" viewBox="0 0 4 4"><circle cx="2" cy="2" r="2" fill="currentColor"/></svg>,
};

/* Formatting helpers */
const fmtN = (n) => n.toLocaleString('en-US');
const fmtPct = (n) => `${n.toFixed(n < 10 ? 1 : 1)}%`;

Object.assign(window, { StatusDot, StatusBadge, TypeBadge, RuleTag, Btn, Kbd, Divider, ProgressBar, Ic, fmtN, fmtPct });
