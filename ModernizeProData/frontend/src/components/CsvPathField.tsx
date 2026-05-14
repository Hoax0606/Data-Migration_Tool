import { useT } from '../i18n';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

// File System Access API (Chromium). 미지원 브라우저에서는 prompt 로 fallback.
type DirectoryPickerOptions = { id?: string; mode?: 'read' | 'readwrite' };
interface FileSystemDirectoryHandleLike { name: string }
interface WindowWithDirPicker extends Window {
  showDirectoryPicker?: (opts?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandleLike>;
}

/**
 * CSV 디렉터리 입력 + 폴더 선택 버튼.
 * 브라우저는 보안상 절대 경로를 받을 수 없어 폴더명만 채워짐 — desktop 앱에서는 네이티브 dialog 로 교체.
 */
export function CsvPathField({ value, onChange }: Props) {
  const t = useT();

  const handleBrowse = async () => {
    const w = window as WindowWithDirPicker;
    if (typeof w.showDirectoryPicker === 'function') {
      try {
        const handle = await w.showDirectoryPicker({ mode: 'read' });
        // 절대 경로는 받을 수 없음 → 기존 값 그대로 두고 폴더명만 추가
        onChange(handle.name);
      } catch {
        /* 사용자 취소 — 무시 */
      }
      return;
    }
    // 미지원 브라우저: prompt 로 직접 입력
    const v = window.prompt(t('siteSettings.csvPathPlaceholder'), value);
    if (v !== null) onChange(v);
  };

  return (
    <div style={styles.row}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('siteSettings.csvPathPlaceholder')}
        style={styles.input}
        spellCheck={false}
      />
      <button type="button" onClick={handleBrowse} style={styles.btnGhost}>
        {t('siteSettings.csvPathBrowse')}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', gap: 6 },
  input: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'var(--mono)',
    outline: 'none',
  },
  btnGhost: {
    padding: '7px 12px',
    background: 'var(--panel)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-2)',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
