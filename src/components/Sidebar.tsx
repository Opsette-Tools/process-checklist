import { useMemo, useState } from 'react';
import { Button, Typography, Empty, Input, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { Checklist } from '@/types';
import ChecklistIcon from './ChecklistIcon';

const { Text } = Typography;

const TEMPLATES_OPEN_KEY = 'opsette.checklist.sidebar.templatesOpen';
const CHECKLISTS_OPEN_KEY = 'opsette.checklist.sidebar.checklistsOpen';

const COLOR_TEMPLATE = '#cfae60'; // gold
const COLOR_CHECKLIST = '#A97142'; // brown

interface SidebarProps {
  checklists: Checklist[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  /** Visual mode. "rail" = ~56px icon-only nav. "full" = 260px expanded. */
  mode: 'rail' | 'full';
  /** Click handler for the bottom toggle button. */
  onToggleMode?: () => void;
  isDark?: boolean;
}

export default function Sidebar({
  checklists,
  selectedId,
  onSelect,
  onNew,
  mode,
  onToggleMode,
  isDark = false,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TEMPLATES_OPEN_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [checklistsOpen, setChecklistsOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CHECKLISTS_OPEN_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const setTemplatesOpenP = (v: boolean) => {
    setTemplatesOpen(v);
    try { localStorage.setItem(TEMPLATES_OPEN_KEY, v ? '1' : '0'); } catch {}
  };
  const setChecklistsOpenP = (v: boolean) => {
    setChecklistsOpen(v);
    try { localStorage.setItem(CHECKLISTS_OPEN_KEY, v ? '1' : '0'); } catch {}
  };

  const { templates, regular, anyTemplates, anyChecklists } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? checklists.filter((c) => c.name.toLowerCase().includes(q))
      : checklists;
    return {
      templates: filtered.filter((c) => c.isTemplate),
      regular: filtered.filter((c) => !c.isTemplate),
      anyTemplates: checklists.some((c) => c.isTemplate),
      anyChecklists: checklists.some((c) => !c.isTemplate),
    };
  }, [checklists, query]);

  // ── Rail (collapsed) ─────────────────────────────────────────────────────────
  if (mode === 'rail') {
    const renderRailItem = (item: Checklist) => {
      const isSelected = item.data_id === selectedId;
      const accent = item.isTemplate ? COLOR_TEMPLATE : COLOR_CHECKLIST;
      const done = item.steps.filter((s) => s.completed).length;
      const total = item.steps.length;
      const stepText = total === 0 ? 'No steps' : `${done}/${total} complete`;

      return (
        <Tooltip
          key={item.data_id}
          placement="right"
          mouseEnterDelay={0.2}
          title={
            <div style={{ minWidth: 120 }}>
              <div style={{ fontWeight: 600 }}>{item.name || 'Untitled'}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>
                {item.isTemplate ? 'Template · ' : ''}
                {stepText}
              </div>
            </div>
          }
        >
          <button
            onClick={() => onSelect(item.data_id)}
            aria-label={item.name || 'Untitled'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              border: `1.5px solid ${isSelected ? accent : 'transparent'}`,
              borderRadius: 8,
              background: isSelected
                ? (isDark ? 'rgba(169,113,66,0.20)' : 'rgba(169,113,66,0.10)')
                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'),
              color: isSelected ? accent : (isDark ? '#E5E7EB' : '#374151'),
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = accent;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
                e.currentTarget.style.color = isDark ? '#E5E7EB' : '#374151';
              }
            }}
          >
            <ChecklistIcon name={item.icon} isTemplate={item.isTemplate} size={20} />
          </button>
        </Tooltip>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
        <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <Tooltip title="New checklist" placement="right">
            <Button type="primary" shape="default" icon={<PlusOutlined />} onClick={onNew} aria-label="New checklist" />
          </Tooltip>
        </div>

        <div
          style={{
            width: 28,
            height: 1,
            background: isDark ? '#262626' : '#f0f0f0',
            margin: '4px 0',
          }}
        />

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', gap: 4 }}>
          {anyTemplates && templates.map(renderRailItem)}
          {anyTemplates && anyChecklists && (
            <div
              style={{
                width: 28,
                height: 1,
                background: isDark ? '#262626' : '#f0f0f0',
                margin: '6px 0',
              }}
            />
          )}
          {anyChecklists && regular.map(renderRailItem)}
        </div>

        <div
          style={{
            borderTop: `1px solid ${isDark ? '#262626' : '#f0f0f0'}`,
            padding: 6,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Tooltip title="Expand sidebar" placement="right">
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={onToggleMode}
              aria-label="Expand sidebar"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            />
          </Tooltip>
        </div>
      </div>
    );
  }

  // ── Full (expanded) ──────────────────────────────────────────────────────────
  const hasResults = templates.length + regular.length > 0;
  const isFiltering = query.trim().length > 0;

  const renderItem = (item: Checklist) => {
    const done = item.steps.filter((s) => s.completed).length;
    const total = item.steps.length;
    const isSelected = item.data_id === selectedId;
    const accentColor = item.isTemplate ? COLOR_TEMPLATE : COLOR_CHECKLIST;

    return (
      <div
        key={item.data_id}
        onClick={() => onSelect(item.data_id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item.data_id);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          padding: '7px 12px 7px 9px',
          margin: '1px 8px',
          borderRadius: 6,
          borderLeft: `3px solid ${isSelected ? accentColor : 'transparent'}`,
          background: isSelected
            ? (isDark ? 'rgba(169, 113, 66, 0.18)' : 'rgba(169, 113, 66, 0.08)')
            : 'transparent',
          transition: 'background 0.12s, border-color 0.12s',
          color: isSelected ? (isDark ? '#fafafa' : '#1f1f1f') : 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        <ChecklistIcon
          name={item.icon}
          isTemplate={item.isTemplate}
          size={16}
          style={{ color: accentColor, opacity: isSelected ? 1 : 0.85 }}
        />
        <Text
          ellipsis
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: isSelected ? 600 : 400,
            color: 'inherit',
          }}
        >
          {item.name || 'Untitled'}
        </Text>
        <Text
          type="secondary"
          style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}
        >
          {total === 0 ? '—' : `${done} / ${total}`}
        </Text>
      </div>
    );
  };

  const renderGroup = (
    title: string,
    items: Checklist[],
    open: boolean,
    setOpen: (v: boolean) => void,
    emptyText: string,
  ) => {
    const Caret = open ? CaretDownOutlined : CaretRightOutlined;
    return (
      <div style={{ marginBottom: 4 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            textAlign: 'left',
          }}
          aria-expanded={open}
        >
          <Caret style={{ fontSize: 9 }} />
          <span style={{ flex: 1 }}>{title}</span>
          <span style={{ opacity: 0.7, fontSize: 11, fontWeight: 500 }}>{items.length}</span>
        </button>
        {open && (
          items.length === 0 ? (
            <div style={{ padding: '4px 12px 8px 27px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{emptyText}</Text>
            </div>
          ) : (
            <div style={{ paddingBottom: 4 }}>
              {items.map(renderItem)}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} block onClick={onNew}>
          New Checklist
        </Button>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {checklists.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No checklists yet" style={{ marginTop: 32 }} />
        ) : isFiltering && !hasResults ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No matches for "${query}"`} style={{ marginTop: 32 }} />
        ) : (
          <>
            {renderGroup('Templates', templates, templatesOpen, setTemplatesOpenP, 'No templates yet')}
            {renderGroup('Checklists', regular, checklistsOpen, setChecklistsOpenP, 'No checklists yet')}
          </>
        )}
      </div>

      {onToggleMode && (
        <div
          style={{
            borderTop: `1px solid ${isDark ? '#262626' : '#f0f0f0'}`,
            padding: 8,
          }}
        >
          <Tooltip title="Collapse to icon rail" mouseEnterDelay={0.6}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={onToggleMode}
              block
              style={{ color: isDark ? '#94A3B8' : '#64748B', justifyContent: 'flex-start' }}
            >
              Collapse
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
