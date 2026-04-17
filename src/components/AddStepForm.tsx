import { useState } from 'react';
import { Input, Button, Select, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { StepCategory } from '@/types';
import { CATEGORY_COLORS, CATEGORY_OPTIONS } from './StepRow';

interface AddStepFormProps {
  onAdd: (label: string, url?: string, category?: StepCategory) => void;
}

export default function AddStepForm({ onAdd }: AddStepFormProps) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<StepCategory | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed, url.trim() || undefined, category);
    setLabel('');
    setUrl('');
    setCategory(undefined);
    setExpanded(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Add a step..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onPressEnter={handleAdd}
          onFocus={() => setExpanded(true)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!label.trim()}>
          Add
        </Button>
      </Space.Compact>
      {expanded && (
        <Space style={{ marginTop: 8, width: '100%' }} wrap>
          <Input
            placeholder="Optional URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPressEnter={handleAdd}
            style={{ width: 240 }}
            prefix={<span style={{ color: '#999', fontSize: 12 }}>🔗</span>}
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
          <Button type="text" size="small" onClick={() => setExpanded(false)}>
            Hide
          </Button>
        </Space>
      )}
    </div>
  );
}
