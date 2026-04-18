import { v4 as uuidv4 } from 'uuid';
import type { Category, Checklist, ChecklistStep } from '@/types';

const STORAGE_KEY = 'opsette.checklist.v1';

export function defaultCategories(): Category[] {
  return [
    { id: uuidv4(), label: 'Doc', color: 'blue' },
    { id: uuidv4(), label: 'Invoice', color: 'green' },
    { id: uuidv4(), label: 'Workspace', color: 'purple' },
    { id: uuidv4(), label: 'Task', color: 'orange' },
  ];
}

/**
 * Bring forward pre-category data. Old shape had `step.category: 'doc' | 'invoice' | ...`
 * and no `Checklist.categories` field. We seed defaults per checklist and remap.
 */
function migrateChecklist(raw: unknown): Checklist | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== 'string' || typeof c.name !== 'string') return null;

  const existingCategories = Array.isArray(c.categories) ? (c.categories as Category[]) : null;
  const categories = existingCategories && existingCategories.length > 0
    ? existingCategories
    : defaultCategories();

  const legacyLabelToId = new Map<string, string>();
  for (const cat of categories) legacyLabelToId.set(cat.label.toLowerCase(), cat.id);

  const rawSteps = Array.isArray(c.steps) ? (c.steps as Record<string, unknown>[]) : [];
  const steps: ChecklistStep[] = rawSteps
    .filter((s) => s && typeof s === 'object' && typeof s.id === 'string')
    .map((s) => {
      let categoryId = typeof s.categoryId === 'string' ? s.categoryId : undefined;
      if (!categoryId && typeof s.category === 'string' && s.category !== 'custom') {
        categoryId = legacyLabelToId.get(s.category.toLowerCase());
      }
      return {
        id: s.id as string,
        label: typeof s.label === 'string' ? s.label : 'Untitled step',
        description: typeof s.description === 'string' ? s.description : undefined,
        url: typeof s.url === 'string' ? s.url : undefined,
        categoryId,
        dueDate: typeof s.dueDate === 'number' ? s.dueDate : undefined,
        dueOffsetDays: typeof s.dueOffsetDays === 'number' ? s.dueOffsetDays : undefined,
        completed: !!s.completed,
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : 0,
      };
    });

  return {
    id: c.id as string,
    name: c.name as string,
    description: typeof c.description === 'string' ? c.description : '',
    isTemplate: !!c.isTemplate,
    sourceTemplateId: typeof c.sourceTemplateId === 'string' ? c.sourceTemplateId : undefined,
    steps,
    categories,
    createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
    updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
    completedAt: typeof c.completedAt === 'number' ? c.completedAt : undefined,
  };
}

export async function loadAll(): Promise<Checklist[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateChecklist).filter((c): c is Checklist => c !== null);
  } catch {
    return [];
  }
}

export async function saveAll(lists: Checklist[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // Quota / private-mode — silently ignore
  }
}

export function createChecklist(opts: { name?: string; isTemplate?: boolean } = {}): Checklist {
  const now = Date.now();
  return {
    id: uuidv4(),
    name: opts.name ?? 'Untitled Checklist',
    description: '',
    isTemplate: !!opts.isTemplate,
    steps: [],
    categories: defaultCategories(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createStep(opts: {
  label: string;
  description?: string;
  url?: string;
  categoryId?: string;
  dueDate?: number;
  dueOffsetDays?: number;
  sortOrder: number;
}): ChecklistStep {
  return {
    id: uuidv4(),
    label: opts.label,
    description: opts.description,
    url: opts.url,
    categoryId: opts.categoryId,
    dueDate: opts.dueDate,
    dueOffsetDays: opts.dueOffsetDays,
    completed: false,
    sortOrder: opts.sortOrder,
  };
}

export function duplicateStep(step: ChecklistStep, sortOrder: number): ChecklistStep {
  return {
    ...step,
    id: uuidv4(),
    completed: false,
    sortOrder,
  };
}

export function duplicateAsActive(template: Checklist, name: string): Checklist {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    description: template.description,
    isTemplate: false,
    sourceTemplateId: template.id,
    steps: template.steps.map((s, i) => {
      const dueDate = typeof s.dueOffsetDays === 'number'
        ? now + s.dueOffsetDays * 24 * 60 * 60 * 1000
        : undefined;
      return {
        ...s,
        id: uuidv4(),
        completed: false,
        sortOrder: i,
        dueDate,
        // Strip offsets — offsets only live on templates.
        dueOffsetDays: undefined,
      };
    }),
    categories: template.categories.map((c) => ({ ...c })),
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateAsTemplate(active: Checklist, name: string): Checklist {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    description: active.description,
    isTemplate: true,
    steps: active.steps.map((s, i) => ({
      ...s,
      id: uuidv4(),
      completed: false,
      sortOrder: i,
      // Templates have offsets, not absolute dates.
      dueDate: undefined,
    })),
    categories: active.categories.map((c) => ({ ...c })),
    createdAt: now,
    updatedAt: now,
  };
}
