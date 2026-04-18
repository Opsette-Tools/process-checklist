import { useState } from 'react';
import { Checkbox, Input, Button, Tag, Select, Space, Tooltip, DatePicker, InputNumber } from 'antd';
import {
  HolderOutlined,
  DeleteOutlined,
  LinkOutlined,
  DownOutlined,
  RightOutlined,
  CopyOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs, { type Dayjs } from 'dayjs';
import type { Category, ChecklistStep } from '@/types';

const { TextArea } = Input;

interface StepRowProps {
  step: ChecklistStep;
  categories: Category[];
  isTemplate: boolean;
  onChange: (patch: Partial<ChecklistStep>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDark: boolean;
}

function dueStatus(dueDate: number | undefined, completed: boolean) {
  if (!dueDate || completed) return null;
  const now = Date.now();
  const diffDays = Math.floor((dueDate - now) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return { tone: 'overdue' as const, text: `${Math.abs(diffDays)}d overdue` };
  if (diffDays === 0) return { tone: 'today' as const, text: 'Due today' };
  if (diffDays <= 3) return { tone: 'soon' as const, text: `Due in ${diffDays}d` };
  return { tone: 'later' as const, text: dayjs(dueDate).format('MMM D') };
}

export default function StepRow({
  step,
  categories,
  isTemplate,
  onChange,
  onDelete,
  onDuplicate,
  isDark,
}: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.data_id });
  const [labelDraft, setLabelDraft] = useState(step.label);
  const [descDraft, setDescDraft] = useState(step.description ?? '');
  const [urlDraft, setUrlDraft] = useState(step.url ?? '');
  const [expanded, setExpanded] = useState(false);

  const category = categories.find((c) => c.data_id === step.categoryId);
  const hasDetails = !!(step.description || step.url || step.categoryId || step.dueDate || step.dueOffsetDays != null);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const due = dueStatus(step.dueDate, step.completed);
  const dueColor: Record<string, string> = {
    overdue: 'red',
    today: 'volcano',
    soon: 'gold',
    later: 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px 8px',
        borderRadius: 8,
        background: isDark ? '#262626' : '#fafafa',
        border: `1px solid ${isDark ? '#303030' : '#EEEEEE'}`,
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
          {due && (
            <Tag color={dueColor[due.tone]} style={{ margin: 0 }} icon={<CalendarOutlined />}>
              {due.text}
            </Tag>
          )}
          {!due && isTemplate && typeof step.dueOffsetDays === 'number' && (
            <Tag color="default" style={{ margin: 0 }} icon={<CalendarOutlined />}>
              +{step.dueOffsetDays}d
            </Tag>
          )}
          {category && (
            <Tag color={category.color} style={{ margin: 0 }}>
              {category.label}
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
          <Tooltip title="Duplicate step">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={onDuplicate} />
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
              style={{ width: 260 }}
            />
            <Select
              size="middle"
              value={step.categoryId}
              onChange={(v) => onChange({ categoryId: v })}
              allowClear
              onClear={() => onChange({ categoryId: undefined })}
              placeholder="Category"
              style={{ width: 160 }}
              options={categories.map((c) => ({
                value: c.data_id,
                label: <Tag color={c.color} style={{ margin: 0 }}>{c.label}</Tag>,
              }))}
            />
            {isTemplate ? (
              <InputNumber
                min={0}
                max={3650}
                value={step.dueOffsetDays ?? null}
                onChange={(v) => onChange({ dueOffsetDays: typeof v === 'number' ? v : undefined })}
                placeholder="Days after start"
                addonAfter="days"
                style={{ width: 160 }}
              />
            ) : (
              <DatePicker
                value={step.dueDate ? dayjs(step.dueDate) : null}
                onChange={(d: Dayjs | null) => onChange({ dueDate: d ? d.valueOf() : undefined })}
                placeholder="Due date"
              />
            )}
          </Space>
        </div>
      )}
    </div>
  );
}
