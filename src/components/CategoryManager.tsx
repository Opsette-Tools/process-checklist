import { useMemo, useState } from 'react';
import { Modal, Input, Button, Space, Tag, Select, Typography, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import type { Category, Checklist } from '@/types';
import { CATEGORY_COLOR_CHOICES } from '@/types';
import { findCategoryUsages } from '@/lib/storage';

const { Text } = Typography;

interface CategoryManagerProps {
  open: boolean;
  categories: Category[];
  /** All checklists — used to detect whether a category is in use before allowing delete. */
  checklists: Checklist[];
  onClose: () => void;
  onChange: (next: Category[]) => void;
}

const MAX_CATEGORIES = 20;

export default function CategoryManager({ open, categories, checklists, onClose, onChange }: CategoryManagerProps) {
  const [draftLabel, setDraftLabel] = useState('');
  const [draftColor, setDraftColor] = useState<string>('blue');

  // Precompute usage per category so the delete button can show counts + names on hover.
  const usageById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findCategoryUsages>>();
    for (const c of categories) {
      map.set(c.data_id, findCategoryUsages(checklists, c.data_id));
    }
    return map;
  }, [categories, checklists]);

  /** Group usages into "Name (Template) · 3 steps" strings, one per distinct host. */
  const formatUsageList = (usages: ReturnType<typeof findCategoryUsages>): string[] => {
    const byHost = new Map<string, { count: number; isTemplate: boolean }>();
    for (const u of usages) {
      const key = `${u.checklistName}::${u.isTemplate ? 't' : 'c'}`;
      const existing = byHost.get(key);
      if (existing) existing.count += 1;
      else byHost.set(key, { count: 1, isTemplate: u.isTemplate });
    }
    return Array.from(byHost.entries()).map(([key, { count, isTemplate }]) => {
      const name = key.split('::')[0];
      const suffix = isTemplate ? ' (template)' : '';
      return `${name}${suffix} — ${count} step${count === 1 ? '' : 's'}`;
    });
  };

  const update = (id: string, patch: Partial<Category>) => {
    onChange(categories.map((c) => (c.data_id === id ? { ...c, ...patch } : c)));
  };

  const confirmDelete = (cat: Category) => {
    // Delete is only reachable when the button is enabled, which requires zero usages.
    // The tooltip already tells users *why* a category can't be deleted, so no
    // "Can't delete" modal is needed here.
    Modal.confirm({
      title: `Delete "${cat.label}"?`,
      content: 'This category isn\'t used on any steps, so it can be removed cleanly.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => onChange(categories.filter((c) => c.data_id !== cat.data_id)),
    });
  };

  const add = () => {
    const label = draftLabel.trim();
    if (!label) return;
    if (categories.length >= MAX_CATEGORIES) return;
    onChange([...categories, { data_id: uuidv4(), label, color: draftColor }]);
    setDraftLabel('');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button type="primary" onClick={onClose}>Done</Button>}
      title="Manage categories"
      width={560}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        Categories are shared across every checklist. Renaming updates every step that uses the category.
        A category can't be deleted while it's still in use.
      </Text>

      <div style={{ marginBottom: 16 }}>
        {categories.length === 0 && (
          <Text type="secondary" style={{ fontSize: 13 }}>No categories yet. Add one below.</Text>
        )}
        {categories.map((cat) => {
          const usages = usageById.get(cat.data_id) ?? [];
          const usageCount = usages.length;
          const deleteDisabled = usageCount > 0;
          const tooltip = deleteDisabled
            ? (
              <div style={{ maxWidth: 260 }}>
                <div style={{ marginBottom: 4 }}>
                  In use — can't delete. Used by:
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {formatUsageList(usages).map((line) => (
                    <li key={line} style={{ fontSize: 12 }}>{line}</li>
                  ))}
                </ul>
              </div>
            )
            : 'Delete category';
          return (
            <div
              key={cat.data_id}
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
                onChange={(e) => update(cat.data_id, { label: e.target.value })}
                style={{ flex: 1 }}
                placeholder="Category name"
              />
              <Select
                size="small"
                value={cat.color}
                onChange={(v) => update(cat.data_id, { color: v })}
                style={{ width: 120 }}
                options={CATEGORY_COLOR_CHOICES.map((c) => ({
                  value: c,
                  label: <Tag color={c} style={{ margin: 0 }}>{c}</Tag>,
                }))}
              />
              <Tooltip title={tooltip} placement="left">
                {/* Wrapper div needed so Tooltip still shows when Button is disabled. */}
                <span>
                  <Button
                    size="small"
                    type="text"
                    danger
                    disabled={deleteDisabled}
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDelete(cat)}
                    style={deleteDisabled ? { pointerEvents: 'none' } : undefined}
                  />
                </span>
              </Tooltip>
            </div>
          );
        })}
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
