import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  visible: boolean;
  message: string;
  onHide?: () => void;
  durationMs?: number;
  tone?: 'success' | 'info' | 'warn';
}

/**
 * 화면 하단 가운데에 잠깐 떴다 사라지는 토스트.
 * `visible` 이 true 가 되면 자동으로 durationMs 뒤에 onHide 호출.
 */
export function Toast({ visible, message, onHide, durationMs = 1800, tone = 'success' }: Props) {
  useEffect(() => {
    if (!visible || !onHide) return;
    const id = setTimeout(onHide, durationMs);
    return () => clearTimeout(id);
  }, [visible, onHide, durationMs]);

  const bg = tone === 'warn' ? 'var(--amber)'
    : tone === 'info' ? 'var(--text-2)'
    : 'var(--navy)';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 36,
        left: '50%',
        transform: `translate(-50%, ${visible ? '0' : '20px'})`,
        padding: '10px 22px',
        background: bg,
        color: '#fff',
        borderRadius: 4,
        boxShadow: '0 8px 28px rgba(10,30,28,.28)',
        fontSize: 12.5,
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity .2s, transform .2s',
        zIndex: 3000,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l3 3 5-6" />
      </svg>
      {message}
    </div>,
    document.body,
  );
}
