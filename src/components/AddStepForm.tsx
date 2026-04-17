import { useState } from 'react';
import { Input, Button, Select, Space, Tag } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import type { StepCategory } from '@/types';
import { CATEGORY_COLORS, CATEGORY_OPTIONS } from './StepRow';

const { TextArea } = Input;

interface AddStepFormProps {
  onAdd: (label: string, description?: string, url?: string, category?: StepCategory) => void;
}

export default function AddStepForm({ onAdd }: AddStepFormProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<StepCategory | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed, description.trim() || undefined, url.trim() || undefined, category);
    setLabel('');
    setDescription('');
    setUrl('');
    setCategory(undefined);
    setExpanded(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
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
              style={{ width: 260 }}
              prefix={<LinkOutlined style={{ color: '#999' }} />}
            />
            <Select
              placeholder="Category"
              value={category}
              onChange={setCategory}
              allowClear
              options={CATEGORY_OPTIONS}
              style={{ width: 140 }}
              tagRender={({ label, value }) => <Tag color={CATEGORY_COLORS[value as StepCategory]}>{label}</Tag>}
            />
            <Button type="text" size="small" onClick={() => { setExpanded(false); }}>
              Hide
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}
