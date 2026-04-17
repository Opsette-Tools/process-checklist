import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Input,
  Typography,
  Button,
  Space,
  Tag,
  Progress,
  Popconfirm,
  message,
  Modal,
  Result,
  Tooltip,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  SaveOutlined,
  CopyFilled,
  StarFilled,
  CheckCircleFilled,
} from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import confetti from 'canvas-confetti';
import type { Checklist, ChecklistStep, StepCategory } from '@/types';
import { createStep, duplicateAsActive, duplicateAsTemplate } from '@/lib/storage';
import { copyChecklistToClipboard } from '@/lib/summary';
import StepRow from './StepRow';
import AddStepForm from './AddStepForm';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ChecklistEditorProps {
  checklist: Checklist;
  onUpdate: (next: Checklist) => void;
  onDelete: () => void;
  onCreate: (c: Checklist) => void;
  onSwitchTo: (id: string) => void;
  isDark: boolean;
}

export default function ChecklistEditor({
  checklist,
  onUpdate,
  onDelete,
  onCreate,
  onSwitchTo,
  isDark,
}: ChecklistEditorProps) {
  const [nameDraft, setNameDraft] = useState(checklist.name);
  const [descDraft, setDescDraft] = useState(checklist.description ?? '');
  const lastCompleteIdRef = useRef<string | null>(null);

  useEffect(() => {
    setNameDraft(checklist.name);
    setDescDraft(checklist.description ?? '');
  }, [checklist.id]);

  const sortedSteps = useMemo(
    () => [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder),
    [checklist.steps]
  );

  const total = sortedSteps.length;
  const done = sortedSteps.filter((s) => s.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done === total;

  // Confetti when transitioning to all-done
  useEffect(() => {
    if (checklist.isTemplate) return;
    if (allDone && lastCompleteIdRef.current !== checklist.id) {
      lastCompleteIdRef.current = checklist.id;
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#52c41a', '#73d13d', '#b7eb8f', '#ffffff'],
        });
      } catch {}
      if (!checklist.completedAt) {
        onUpdate({ ...checklist, completedAt: Date.now(), updatedAt: Date.now() });
      }
    } else if (!allDone) {
      if (lastCompleteIdRef.current === checklist.id) lastCompleteIdRef.current = null;
      if (checklist.completedAt) {
        onUpdate({ ...checklist, completedAt: undefined, updatedAt: Date.now() });
      }
    }
  }, [allDone, checklist.id]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const patch = (partial: Partial<Checklist>) => {
    onUpdate({ ...checklist, ...partial, updatedAt: Date.now() });
  };

  const updateStep = (id: string, change: Partial<ChecklistStep>) => {
    patch({
      steps: checklist.steps.map((s) => (s.id === id ? { ...s, ...change } : s)),
    });
  };

  const deleteStep = (id: string) => {
    patch({
      steps: checklist.steps
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, sortOrder: i })),
    });
  };

  const addStep = (label: string, description?: string, url?: string, category?: StepCategory) => {
    const next = createStep({ label, description, url, category, sortOrder: checklist.steps.length });
    patch({ steps: [...checklist.steps, next] });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sortedSteps.map((s) => s.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(sortedSteps, from, to).map((s, i) => ({ ...s, sortOrder: i }));
    patch({ steps: reordered });
  };

  const handleUseTemplate = () => {
    let name = '';
    Modal.confirm({
      title: 'Use this template',
      content: (
        <div>
          <Text type="secondary">Name your new active checklist:</Text>
          <Input
            placeholder="e.g. Acme Corp Onboarding"
            defaultValue={`${checklist.name} — ${new Date().toLocaleDateString()}`}
            onChange={(e) => (name = e.target.value)}
            autoFocus
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      okText: 'Create',
      onOk: () => {
        const finalName = (name || `${checklist.name} — ${new Date().toLocaleDateString()}`).trim();
        const created = duplicateAsActive(checklist, finalName);
        onCreate(created);
        onSwitchTo(created.id);
        message.success('Active checklist created');
      },
    });
  };

  const handleSaveAsTemplate = () => {
    let name = `${checklist.name} (Template)`;
    Modal.confirm({
      title: 'Save as template',
      content: (
        <div>
          <Text type="secondary">Name your template:</Text>
          <Input
            defaultValue={name}
            onChange={(e) => (name = e.target.value)}
            autoFocus
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      okText: 'Save',
      onOk: () => {
        const created = duplicateAsTemplate(checklist, name.trim() || `${checklist.name} (Template)`);
        onCreate(created);
        message.success('Template saved');
      },
    });
  };

  const handleCopySummary = async () => {
    try {
      await copyChecklistToClipboard(checklist);
      message.success('Checklist copied — paste into Docs, Notion, email, etc.');
    } catch {
      message.error('Could not copy to clipboard');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      {/* Title + badge */}
      <Space align="center" style={{ marginBottom: 4 }} wrap>
        {checklist.isTemplate && (
          <Tag icon={<StarFilled />} color="gold">TEMPLATE</Tag>
        )}
        {checklist.completedAt && !checklist.isTemplate && (
          <Tag icon={<CheckCircleFilled />} color="success">COMPLETED</Tag>
        )}
      </Space>

      <Input
        variant="borderless"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={() => patch({ name: nameDraft.trim() || 'Untitled Checklist' })}
        onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
        style={{ fontSize: 24, fontWeight: 600, padding: '4px 0' }}
        placeholder="Checklist name"
      />

      <TextArea
        variant="borderless"
        value={descDraft}
        onChange={(e) => setDescDraft(e.target.value)}
        onBlur={() => patch({ description: descDraft.trim() })}
        placeholder="Add a description (optional)"
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{ padding: '4px 0', marginBottom: 12, color: isDark ? '#aaa' : '#666' }}
      />

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {total === 0 ? 'No steps yet' : `${done}/${total} steps · ${pct}%`}
          </Text>
        </div>
        <Progress percent={pct} showInfo={false} strokeColor="#52c41a" size="small" />
      </div>

      {/* Action bar */}
      <Space wrap className="no-print" style={{ marginBottom: 16 }}>
        {checklist.isTemplate ? (
          <Button type="primary" icon={<CopyFilled />} onClick={handleUseTemplate}>
            Use Template
          </Button>
        ) : (
          <Button icon={<SaveOutlined />} onClick={handleSaveAsTemplate}>
            Save as Template
          </Button>
        )}
        <Tooltip title="Copies as rich text (heading + bullets with sub-bullets for URLs). Pastes formatted into Docs, Notion, email; falls back to plain text elsewhere.">
          <Button icon={<CopyOutlined />} onClick={handleCopySummary} disabled={total === 0}>
            Copy
          </Button>
        </Tooltip>
        <Popconfirm title="Delete this checklist?" onConfirm={onDelete} okText="Delete" okButtonProps={{ danger: true }}>
          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </Space>

      {allDone && !checklist.isTemplate && (
        <Result
          status="success"
          title="All done!"
          subTitle="Every step is checked off. Great work."
          style={{ padding: '16px 0' }}
        />
      )}

      {/* Steps */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sortedSteps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              isDark={isDark}
              onChange={(p) => updateStep(step.id, p)}
              onDelete={() => deleteStep(step.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {sortedSteps.length === 0 && (
        <div
          style={{
            padding: 24,
            border: `1px dashed ${isDark ? '#303030' : '#d9d9d9'}`,
            borderRadius: 8,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          <Text type="secondary">No steps yet. Add your first step below.</Text>
        </div>
      )}

      <AddStepForm onAdd={addStep} />
    </div>
  );
}
