import { useState } from 'react';
import { Checkbox, Input, Button, Tag, Popover, Select, Space, Tooltip } from 'antd';
import { HolderOutlined, DeleteOutlined, LinkOutlined, EditOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistStep, StepCategory } from '@/types';

const CATEGORY_COLORS: Record<StepCategory, string> = {
  doc: 'blue',
  invoice: 'green',
  workspace: 'purple',
  task: 'orange',
  custom: 'default',
};

const CATEGORY_OPTIONS: { value: StepCategory; label: string }[] = [
  { value: 'doc', label: 'Doc' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'task', label: 'Task' },
  { value: 'custom', label: 'Custom' },
];

interface StepRowProps {
  step: ChecklistStep;
  onChange: (patch: Partial<ChecklistStep>) => void;
  onDelete: () => void;
  isDark: boolean;
}

export default function StepRow({ step, onChange, onDelete, isDark }: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const [labelDraft, setLabelDraft] = useState(step.label);
  const [urlDraft, setUrlDraft] = useState(step.url ?? '');

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const urlPopover = (
    <div style={{ width: 260 }}>
      <Input
        placeholder="https://..."
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onBlur={() => onChange({ url: urlDraft.trim() || undefined })}
        onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
        autoFocus
      />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 8px',
        borderRadius: 8,
        background: isDark ? '#1f1f1f' : '#fafafa',
        marginBottom: 6,
      }}
    >
      <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#999', display: 'flex', alignItems: 'center' }}>
        <HolderOutlined />
      </span>
      <Checkbox checked={step.completed} onChange={(e) => onChange({ completed: e.target.checked })} />
      <Input
        variant="borderless"
        value={labelDraft}
        onChange={(e) => setLabelDraft(e.target.value)}
        onBlur={() => onChange({ label: labelDraft.trim() || 'Untitled step' })}
        onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
        style={{
          flex: 1,
          textDecoration: step.completed ? 'line-through' : 'none',
          opacity: step.completed ? 0.6 : 1,
          padding: '2px 4px',
        }}
      />
      <Space size={4}>
        {step.url ? (
          <Tooltip title={step.url}>
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              href={step.url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </Tooltip>
        ) : null}
        <Popover content={urlPopover} trigger="click" title="Step URL" placement="bottomRight">
          <Button type="text" size="small" icon={step.url ? <EditOutlined /> : <LinkOutlined />} />
        </Popover>
        <Select
          size="small"
          value={step.category}
          onChange={(v) => onChange({ category: v })}
          allowClear
          onClear={() => onChange({ category: undefined })}
          placeholder="Tag"
          style={{ width: 110 }}
          options={CATEGORY_OPTIONS}
          variant="borderless"
          tagRender={({ label, value }) => <Tag color={CATEGORY_COLORS[value as StepCategory]}>{label}</Tag>}
        />
        {step.category && (
          <Tag color={CATEGORY_COLORS[step.category]} style={{ margin: 0 }}>
            {step.category}
          </Tag>
        )}
        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} />
      </Space>
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_OPTIONS };
