import { useState } from 'react';
import { Checkbox, Input, Button, Tag, Select, Space, Tooltip } from 'antd';
import { HolderOutlined, DeleteOutlined, LinkOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistStep, StepCategory } from '@/types';

const { TextArea } = Input;

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
  const [descDraft, setDescDraft] = useState(step.description ?? '');
  const [urlDraft, setUrlDraft] = useState(step.url ?? '');
  const [expanded, setExpanded] = useState(false);

  const hasDetails = !!(step.description || step.url || step.category);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px 8px',
        borderRadius: 8,
        background: isDark ? '#1f1f1f' : '#fafafa',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            fontWeight: 500,
          }}
          placeholder="Step name"
        />
        <Space size={2}>
          {step.url && (
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
          )}
          {step.category && (
            <Tag color={CATEGORY_COLORS[step.category]} style={{ margin: 0 }}>
              {step.category}
            </Tag>
          )}
          <Tooltip title={expanded ? 'Hide details' : hasDetails ? 'Show details' : 'Add details'}>
            <Button
              type="text"
              size="small"
              icon={expanded ? <DownOutlined /> : <RightOutlined />}
              onClick={() => setExpanded((v) => !v)}
            />
          </Tooltip>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} />
        </Space>
      </div>

      {expanded && (
        <div style={{ paddingLeft: 48, paddingTop: 8, paddingRight: 8, paddingBottom: 4 }}>
          <TextArea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={() => onChange({ description: descDraft.trim() || undefined })}
            placeholder="Description — add details, sub-tasks, or notes for this step"
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{ marginBottom: 8 }}
          />
          <Space wrap style={{ width: '100%' }}>
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={() => onChange({ url: urlDraft.trim() || undefined })}
              placeholder="Optional URL (https://...)"
              prefix={<LinkOutlined style={{ color: '#999' }} />}
              style={{ width: 280 }}
            />
            <Select
              size="middle"
              value={step.category}
              onChange={(v) => onChange({ category: v })}
              allowClear
              onClear={() => onChange({ category: undefined })}
              placeholder="Category"
              style={{ width: 140 }}
              options={CATEGORY_OPTIONS}
            />
          </Space>
        </div>
      )}
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_OPTIONS };
