import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Input,
  Typography,
  Button,
  Space,
  Tag,
  Progress,
  message,
  Modal,
  Result,
  Tooltip,
  Grid,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  SaveOutlined,
  CopyFilled,
  StarFilled,
  CheckCircleFilled,
  AppstoreOutlined,
  FilePdfOutlined,
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
import type { Category, Checklist, ChecklistStep, Presets } from '@/types';
import { createStep, duplicateStep, duplicateAsActive, duplicateAsTemplate } from '@/lib/storage';
import { copyChecklistToClipboard } from '@/lib/summary';
import { exportChecklistToPdf } from '@/lib/pdf-export';
import StepRow from './StepRow';
import AddStepForm, { type AddStepFormHandle } from './AddStepForm';
import CategoryManager from './CategoryManager';
import IconPicker from './IconPicker';

const { Text } = Typography;
const { TextArea } = Input;

export interface ChecklistEditorHandle {
  focusAddStep: () => void;
}

interface ChecklistEditorProps {
  checklist: Checklist;
  /** All checklists — needed so CategoryManager can show usage counts for delete-protection. */
  checklists: Checklist[];
  presets: Presets;
  onUpdatePresets: (next: Presets) => void;
  onUpdate: (next: Checklist) => void;
  onDelete: () => void;
  onCreate: (c: Checklist) => void;
  /** Persist a newly-duplicated template and discard the source if it was never saved. */
  onCreateAndPersistTemplate: (template: Checklist, sourceId: string) => Promise<void>;
  onSwitchTo: (id: string) => void;
  onSave: () => void;
  dirty: boolean;
  isDark: boolean;
}

const ChecklistEditor = forwardRef<ChecklistEditorHandle, ChecklistEditorProps>(function ChecklistEditor(
  { checklist, checklists, presets, onUpdatePresets, onUpdate, onDelete, onCreate, onCreateAndPersistTemplate, onSwitchTo, onSave, dirty, isDark },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [nameDraft, setNameDraft] = useState(checklist.name);
  const [descDraft, setDescDraft] = useState(checklist.description ?? '');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const lastCompleteIdRef = useRef<string | null>(null);
  const addStepRef = useRef<AddStepFormHandle>(null);
  const [messageApi, messageContext] = message.useMessage();

  useImperativeHandle(ref, () => ({
    focusAddStep: () => addStepRef.current?.focus(),
  }));

  useEffect(() => {
    setNameDraft(checklist.name);
    setDescDraft(checklist.description ?? '');
  }, [checklist.data_id]);

  const sortedSteps = useMemo(
    () => [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder),
    [checklist.steps],
  );

  const total = sortedSteps.length;
  const done = sortedSteps.filter((s) => s.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done === total;

  useEffect(() => {
    if (checklist.isTemplate) return;
    if (allDone && lastCompleteIdRef.current !== checklist.data_id) {
      lastCompleteIdRef.current = checklist.data_id;
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A97142', '#C9986A', '#E4C49A', '#ffffff'],
        });
      } catch {}
      if (!checklist.completedAt) {
        onUpdate({ ...checklist, completedAt: Date.now(), updatedAt: Date.now() });
      }
    } else if (!allDone) {
      if (lastCompleteIdRef.current === checklist.data_id) lastCompleteIdRef.current = null;
      if (checklist.completedAt) {
        onUpdate({ ...checklist, completedAt: undefined, updatedAt: Date.now() });
      }
    }
  }, [allDone, checklist.data_id]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const patch = (partial: Partial<Checklist>) => {
    onUpdate({ ...checklist, ...partial, updatedAt: Date.now() });
  };

  const updateStep = (id: string, change: Partial<ChecklistStep>) => {
    patch({
      steps: checklist.steps.map((s) => (s.data_id === id ? { ...s, ...change } : s)),
    });
  };

  const deleteStep = (id: string) => {
    const removed = checklist.steps.find((s) => s.data_id === id);
    if (!removed) return;
    const next = checklist.steps
      .filter((s) => s.data_id !== id)
      .map((s, i) => ({ ...s, sortOrder: i }));
    patch({ steps: next });

    messageApi.open({
      key: `undo-step-${removed.data_id}`,
      type: 'info',
      duration: 5,
      content: (
        <span>
          Step deleted.{' '}
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => {
              const restored = [...next];
              const insertAt = Math.min(removed.sortOrder, restored.length);
              restored.splice(insertAt, 0, removed);
              patch({ steps: restored.map((s, i) => ({ ...s, sortOrder: i })) });
              messageApi.destroy(`undo-step-${removed.data_id}`);
            }}
          >
            Undo
          </Button>
        </span>
      ),
    });
  };

  const duplicateStepById = (id: string) => {
    const src = checklist.steps.find((s) => s.data_id === id);
    if (!src) return;
    const srcIndex = sortedSteps.findIndex((s) => s.data_id === id);
    const copy = duplicateStep(src, srcIndex + 1);
    const next = [
      ...sortedSteps.slice(0, srcIndex + 1),
      copy,
      ...sortedSteps.slice(srcIndex + 1),
    ].map((s, i) => ({ ...s, sortOrder: i }));
    patch({ steps: next });
  };

  const addStep = (args: {
    label: string;
    description?: string;
    url?: string;
    categoryId?: string;
    dueDate?: number;
    dueOffsetDays?: number;
  }) => {
    const next = createStep({ ...args, sortOrder: checklist.steps.length });
    patch({ steps: [...checklist.steps, next] });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sortedSteps.map((s) => s.data_id);
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
        onSwitchTo(created.data_id);
        messageApi.success('Active checklist created');
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
      onOk: async () => {
        const created = duplicateAsTemplate(checklist, name.trim() || `${checklist.name} (Template)`);
        // App.tsx decides whether to discard the source (if unsaved), persists the
        // template via the bridge or localStorage, and switches the selection.
        // The Ant "Template saved" toast now fires only when persistence succeeds.
        await onCreateAndPersistTemplate(created, checklist.data_id);
      },
    });
  };

  const handleCopySummary = async () => {
    try {
      await copyChecklistToClipboard(checklist, presets.categories);
      messageApi.success('Checklist copied — paste into Docs, Notion, email, etc.');
    } catch {
      messageApi.error('Could not copy to clipboard');
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportChecklistToPdf(checklist, presets.categories);
    } catch {
      messageApi.error('Could not generate PDF');
    }
  };

  const handleDeleteChecklist = () => {
    Modal.confirm({
      title: 'Delete this checklist?',
      content: 'You can undo this from the toast that appears.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: onDelete,
    });
  };

  const handleCategoriesChange = (nextCategories: Category[]) => {
    onUpdatePresets({ ...presets, categories: nextCategories });
  };

  const cardStyle: React.CSSProperties = {
    background: isDark ? '#1f1f1f' : '#ffffff',
    border: `1px solid ${isDark ? '#303030' : '#E5E7EB'}`,
    borderRadius: 12,
    boxShadow: isDark
      ? '0 1px 2px rgba(0,0,0,0.4)'
      : '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      {messageContext}

      {/* Identity card: tags + name + description + progress */}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        {(checklist.isTemplate || (checklist.completedAt && !checklist.isTemplate)) && (
          <Space align="center" style={{ marginBottom: 8 }} wrap>
            {checklist.isTemplate && (
              <Tag icon={<StarFilled />} color="gold">TEMPLATE</Tag>
            )}
            {checklist.completedAt && !checklist.isTemplate && (
              <Tag icon={<CheckCircleFilled />} color="success">COMPLETED</Tag>
            )}
          </Space>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div style={{ paddingTop: 2 }}>
            <IconPicker
              value={checklist.icon}
              isTemplate={checklist.isTemplate}
              onChange={(next) => patch({ icon: next })}
              isDark={isDark}
              accentColor={checklist.isTemplate ? '#cfae60' : '#A97142'}
            />
          </div>
          <TextArea
            variant="borderless"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => patch({ name: nameDraft.trim() || 'Untitled Checklist' })}
            onPressEnter={(e) => {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              fontSize: 24,
              fontWeight: 600,
              padding: 0,
              flex: 1,
              minWidth: 0,
              lineHeight: 1.25,
              resize: 'none',
            }}
            placeholder="Checklist name"
          />
        </div>

        <TextArea
          variant="borderless"
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
          onBlur={() => patch({ description: descDraft.trim() })}
          placeholder="Add a description (optional)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ padding: 0, marginBottom: 14, color: isDark ? '#aaa' : '#666' }}
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {total === 0 ? 'No steps yet' : `${done}/${total} steps · ${pct}%`}
            </Text>
          </div>
          <Progress percent={pct} showInfo={false} strokeColor="#A97142" size="small" />
        </div>
      </div>

      {/* Action bar */}
      <Space wrap className="no-print" style={{ marginBottom: 16 }}>
        <Tooltip title={dirty ? 'Save changes' : 'No changes to save'}>
          <Button
            type={dirty ? 'primary' : 'default'}
            icon={<SaveOutlined />}
            onClick={onSave}
            disabled={!dirty}
          >
            {isMobile ? null : 'Save'}
          </Button>
        </Tooltip>
        {checklist.isTemplate ? (
          <Tooltip title="Use this template">
            <Button type="primary" icon={<CopyFilled />} onClick={handleUseTemplate}>
              {isMobile ? null : 'Use Template'}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Save as template">
            <Button icon={<SaveOutlined />} onClick={handleSaveAsTemplate}>
              {isMobile ? null : 'Save as Template'}
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Copy as rich text — pastes formatted into Docs, Notion, email.">
          <Button icon={<CopyOutlined />} onClick={handleCopySummary} disabled={total === 0}>
            {isMobile ? null : 'Copy'}
          </Button>
        </Tooltip>
        <Tooltip title="Export as fillable PDF — checkboxes stay interactive in PDF readers.">
          <Button icon={<FilePdfOutlined />} onClick={handleExportPdf} disabled={total === 0}>
            {isMobile ? null : 'Export PDF'}
          </Button>
        </Tooltip>
        <Tooltip title="Manage categories">
          <Button icon={<AppstoreOutlined />} onClick={() => setCategoryManagerOpen(true)}>
            {isMobile ? null : 'Categories'}
          </Button>
        </Tooltip>
        <Tooltip title="Delete checklist">
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteChecklist}>
            {isMobile ? null : 'Delete'}
          </Button>
        </Tooltip>
      </Space>

      {allDone && !checklist.isTemplate && (
        <div style={{ ...cardStyle, padding: '8px 20px', marginBottom: 16 }}>
          <Result
            status="success"
            title="All done!"
            subTitle="Every step is checked off. Great work."
            style={{ padding: 0 }}
          />
        </div>
      )}

      {/* Steps card */}
      <div style={{ ...cardStyle, padding: 16 }}>
        {sortedSteps.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedSteps.map((s) => s.data_id)} strategy={verticalListSortingStrategy}>
                {sortedSteps.map((step) => (
                  <StepRow
                    key={step.data_id}
                    step={step}
                    categories={presets.categories}
                    isTemplate={checklist.isTemplate}
                    isDark={isDark}
                    onChange={(p) => updateStep(step.data_id, p)}
                    onDelete={() => deleteStep(step.data_id)}
                    onDuplicate={() => duplicateStepById(step.data_id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              border: `1px dashed ${isDark ? '#303030' : '#d9d9d9'}`,
              borderRadius: 8,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            <Text type="secondary">No steps yet. Add your first step below.</Text>
          </div>
        )}

        <AddStepForm
          ref={addStepRef}
          categories={presets.categories}
          isTemplate={checklist.isTemplate}
          onAdd={addStep}
        />
      </div>

      <CategoryManager
        open={categoryManagerOpen}
        categories={presets.categories}
        checklists={checklists}
        onClose={() => setCategoryManagerOpen(false)}
        onChange={handleCategoriesChange}
      />
    </div>
  );
});

export default ChecklistEditor;
