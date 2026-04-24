/* Notification center — in-app inbox. Primary channel for closed/air-gapped
   environments where Slack/email/webhook aren't reliably reachable. */

const NotificationBell = ({ notifications, onMarkRead, onMarkAllRead, onClear, onItemClick }) => {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('all'); // all | unread
  const ref = React.useRef();

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  const unread = notifications.filter(n => !n.read).length;
  const visible = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title={`${unread} unread notification${unread === 1 ? '' : 's'}`}
        style={{
          position: 'relative',
          width: 26, height: 26,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid transparent', borderRadius: 4,
          background: open ? 'var(--panel-2)' : 'transparent',
          color: unread > 0 ? 'var(--navy)' : 'var(--text-2)',
          cursor: 'pointer', flexShrink: 0,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--panel-2)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <Ic.bell/>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 13, height: 13, padding: '0 3px',
            borderRadius: 7, background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--panel)',
          }}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 6,
          width: 380, maxHeight: 520,
          background: 'var(--panel)',
          border: '1px solid var(--border-strong)', borderRadius: 6,
          boxShadow: '0 12px 32px rgba(20,30,50,.18)',
          zIndex: 200,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Notifications</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {notifications.length} total · {unread} unread
              </div>
            </div>
            <div style={{ display: 'flex', height: 22, border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              {[['all','All'],['unread','Unread']].map(([k,l], i) => (
                <button key={k} onClick={() => setFilter(k)} style={{
                  padding: '0 8px', border: 'none',
                  borderLeft: i ? '1px solid var(--border)' : 'none',
                  background: filter === k ? 'var(--navy-50)' : 'transparent',
                  color: filter === k ? 'var(--navy)' : 'var(--text-2)',
                  fontWeight: filter === k ? 600 : 500, fontSize: 10.5,
                  cursor: 'pointer', fontFamily: 'var(--mono)',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {visible.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 11.5 }}>
                {filter === 'unread' ? '읽지 않은 알림 없음' : '알림 없음'}
              </div>
            ) : visible.map(n => (
              <NotificationRow
                key={n.id} notification={n}
                onClick={() => { onItemClick?.(n); onMarkRead?.(n.id); setOpen(false); }}
                onMarkRead={() => onMarkRead?.(n.id)}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 12px', borderTop: '1px solid var(--border)',
            background: 'var(--panel-2)',
            display: 'flex', gap: 6,
          }}>
            <Btn kind="ghost" size="sm"
              onClick={() => { onMarkAllRead?.(); }}
              disabled={unread === 0}>Mark all read</Btn>
            <div style={{ flex: 1 }}/>
            <Btn kind="ghost" size="sm"
              onClick={() => { if (confirm('모든 알림을 지웁니다. 계속할까요?')) onClear?.(); }}
              disabled={notifications.length === 0}>Clear all</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationRow = ({ notification, onClick, onMarkRead }) => {
  const n = notification;
  const sev = n.severity;
  const color = sev === 'error' ? 'var(--red)'
    : sev === 'warn' ? 'var(--amber)'
    : sev === 'ok' ? 'var(--green)'
    : 'var(--navy)';
  const projectName = (window.PROJECTS || []).find(p => p.id === n.projectId)?.name;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: n.read ? 'transparent' : 'var(--navy-50)',
        display: 'flex', gap: 10,
      }}
      onMouseEnter={e => e.currentTarget.style.background = n.read ? 'var(--panel-2)' : 'var(--navy-50)'}
      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--navy-50)'}
    >
      <div style={{
        width: 4, minHeight: 28, borderRadius: 2,
        background: color, flexShrink: 0, alignSelf: 'stretch',
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: n.read ? 500 : 600, color: 'var(--text)' }}>{n.title}</span>
          {!n.read && <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--navy)', flexShrink: 0,
          }}/>}
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{n.at}</span>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{n.body}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)',
        }}>
          {projectName && <span style={{
            padding: '0 5px', background: 'var(--panel-2)',
            border: '1px solid var(--border)', borderRadius: 2,
          }}>{projectName}</span>}
          <span style={{ color: color }}>{n.category}</span>
        </div>
      </div>
    </div>
  );
};

window.NotificationBell = NotificationBell;
