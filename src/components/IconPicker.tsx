import { useMemo, useState } from 'react';
import { Popover, Input, Button, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CHECKLIST_ICONS, ICON_BY_NAME, getDefaultIconName } from '@/lib/icons';
import ChecklistIcon from './ChecklistIcon';

interface IconPickerProps {
  /** Currently picked icon name; undefined means "default". */
  value?: string;
  /** True if the parent checklist is a template. Drives the default icon shown when value is undefined. */
  isTemplate: boolean;
  /** Called with the new icon name, or undefined to clear back to default. */
  onChange: (next: string | undefined) => void;
  isDark?: boolean;
  /** Accent color for the trigger ring (selected/border). */
  accentColor?: string;
}

/**
 * Trigger button shows the current icon (or the default for the checklist type).
 * Click opens a popover: search field + scrollable grid of curated icons + "Reset" link.
 */
export default function IconPicker({ value, isTemplate, onChange, isDark = false, accentColor = '#A97142' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHECKLIST_ICONS;
    return CHECKLIST_ICONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.label.toLowerCase().includes(q),
    );
  }, [query]);

  const defaultName = getDefaultIconName(isTemplate);
  const isUsingDefault = !value || !ICON_BY_NAME[value];

  const handlePick = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  const handleReset = () => {
    onChange(undefined);
    setOpen(false);
    setQuery('');
  };

  const content = (
    <div style={{ width: 280 }}>
      <Input
        autoFocus
        size="small"
        prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
        placeholder="Search icons"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        allowClear
        style={{ marginBottom: 10 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          maxHeight: 240,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 16, color: isDark ? '#94A3B8' : '#94A3B8', fontSize: 12 }}>
            No matches for "{query}"
          </div>
        ) : (
          filtered.map((icon) => {
            const isPicked = (value === icon.name) || (isUsingDefault && icon.name === defaultName);
            return (
              <Tooltip key={icon.name} title={icon.label} mouseEnterDelay={0.4}>
                <button
                  onClick={() => handlePick(icon.name)}
                  aria-label={icon.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    border: `1px solid ${isPicked ? accentColor : 'transparent'}`,
                    borderRadius: 6,
                    background: isPicked
                      ? (isDark ? 'rgba(169,113,66,0.18)' : 'rgba(169,113,66,0.08)')
                      : 'transparent',
                    cursor: 'pointer',
                    color: isPicked ? accentColor : (isDark ? '#E5E7EB' : '#374151'),
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPicked) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isPicked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <ChecklistIcon name={icon.name} size={18} />
                </button>
              </Tooltip>
            );
          })
        )}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#94A3B8' }}>
          {filtered.length} icon{filtered.length === 1 ? '' : 's'}
        </span>
        <Button type="link" size="small" onClick={handleReset} disabled={isUsingDefault} style={{ padding: 0 }}>
          Use default
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={content}
      title={null}
      destroyOnHidden
    >
      <Tooltip title="Change icon" mouseEnterDelay={0.6}>
        <button
          aria-label="Change checklist icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            border: `1px solid ${isDark ? '#303030' : '#E5E7EB'}`,
            borderRadius: 8,
            background: isDark ? '#1f1f1f' : '#ffffff',
            color: accentColor,
            cursor: 'pointer',
            transition: 'border-color 0.12s, background 0.12s',
            flex: '0 0 auto',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? '#303030' : '#E5E7EB'; }}
        >
          <ChecklistIcon name={value} isTemplate={isTemplate} size={22} />
        </button>
      </Tooltip>
    </Popover>
  );
}
