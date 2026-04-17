import { useState } from 'react';
import { Modal, Input, Button, Space, Tag, Select, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '@/types';
import { CATEGORY_COLOR_CHOICES } from '@/types';

const { Text } = Typography;

interface CategoryManagerProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onChange: (next: Category[]) => void;
}

const MAX_CATEGORIES = 20;

export default function CategoryManager({ open, categories, onClose, onChange }: CategoryManagerProps) {
  const [draftLabel, setDraftLabel] = useState('');
  const [draftColor, setDraftColor] = useState<string>('blue');

  const update = (id: string, patch: Partial<Category>) => {
    onChange(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = (id: string) => {
    onChange(categories.filter((c) => c.id !== id));
  };

  const add = () => {
    const label = draftLabel.trim();
    if (!label) return;
    if (categories.length >= MAX_CATEGORIES) return;
    onChange([...categories, { id: uuidv4(), label, color: draftColor }]);
    setDraftLabel('');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button type="primary" onClick={onClose}>Done</Button>}
      title="Manage categories"
      width={520}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        Categories are scoped to this checklist. Deleting a category clears it from any steps using it.
      </Text>

      <div style={{ marginBottom: 16 }}>
        {categories.length === 0 && (
          <Text type="secondary" style={{ fontSize: 13 }}>No categories yet. Add one below.</Text>
        )}
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Tag color={cat.color} style={{ margin: 0, minWidth: 0 }}>
              {cat.label || '—'}
            </Tag>
            <Input
              size="small"
              value={cat.label}
              onChange={(e) => update(cat.id, { label: e.target.value })}
              style={{ flex: 1 }}
              placeholder="Category name"
            />
            <Select
              size="small"
              value={cat.color}
              onChange={(v) => update(cat.id, { color: v })}
              style={{ width: 120 }}
              options={CATEGORY_COLOR_CHOICES.map((c) => ({
                value: c,
                label: <Tag color={c} style={{ margin: 0 }}>{c}</Tag>,
              }))}
            />
            <Popconfirm title="Delete this category?" onConfirm={() => remove(cat.id)} okButtonProps={{ danger: true }}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ))}
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onPressEnter={add}
          placeholder="New category name"
        />
        <Select
          value={draftColor}
          onChange={setDraftColor}
          style={{ width: 120 }}
          options={CATEGORY_COLOR_CHOICES.map((c) => ({
            value: c,
            label: <Tag color={c} style={{ margin: 0 }}>{c}</Tag>,
          }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={add}
          disabled={!draftLabel.trim() || categories.length >= MAX_CATEGORIES}
        >
          Add
        </Button>
      </Space.Compact>
    </Modal>
  );
}
