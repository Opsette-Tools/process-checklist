import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Input, Button, Select, Space, Tag, DatePicker, InputNumber } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { Category } from '@/types';

const { TextArea } = Input;

export interface AddStepFormHandle {
  focus: () => void;
}

interface AddStepFormProps {
  categories: Category[];
  isTemplate: boolean;
  onAdd: (args: {
    label: string;
    description?: string;
    url?: string;
    categoryId?: string;
    dueDate?: number;
    dueOffsetDays?: number;
  }) => void;
}

const AddStepForm = forwardRef<AddStepFormHandle, AddStepFormProps>(function AddStepForm(
  { categories, isTemplate, onAdd },
  ref,
) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [dueOffsetDays, setDueOffsetDays] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<InputRef>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const reset = () => {
    setLabel('');
    setDescription('');
    setUrl('');
    setCategoryId(undefined);
    setDueDate(null);
    setDueOffsetDays(null);
    setExpanded(false);
  };

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd({
      label: trimmed,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      categoryId,
      dueDate: dueDate ? dueDate.valueOf() : undefined,
      dueOffsetDays: typeof dueOffsetDays === 'number' ? dueOffsetDays : undefined,
    });
    reset();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          ref={inputRef}
          placeholder="Add a step name..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onPressEnter={(e) => {
            if (!expanded) handleAdd();
            else (e.target as HTMLInputElement).blur();
          }}
          onFocus={() => setExpanded(true)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!label.trim()}>
          Add
        </Button>
      </Space.Compact>
      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          <TextArea
            placeholder="Description — add details, sub-tasks, or notes (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ marginBottom: 8 }}
          />
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="Optional URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPressEnter={handleAdd}
              style={{ width: 240 }}
              prefix={<LinkOutlined style={{ color: '#999' }} />}
            />
            <Select
              placeholder="Category"
              value={categoryId}
              onChange={setCategoryId}
              allowClear
              options={categories.map((c) => ({
                value: c.data_id,
                label: <Tag color={c.color} style={{ margin: 0 }}>{c.label}</Tag>,
              }))}
              style={{ width: 160 }}
            />
            {isTemplate ? (
              <InputNumber
                min={0}
                max={3650}
                value={dueOffsetDays}
                onChange={(v) => setDueOffsetDays(typeof v === 'number' ? v : null)}
                placeholder="Days after start"
                addonAfter="days"
                style={{ width: 160 }}
              />
            ) : (
              <DatePicker
                value={dueDate}
                onChange={(d) => setDueDate(d ? dayjs(d) : null)}
                placeholder="Due date"
              />
            )}
            <Button type="text" size="small" onClick={() => setExpanded(false)}>
              Hide
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
});

export default AddStepForm;
