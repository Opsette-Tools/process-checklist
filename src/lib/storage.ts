import { v4 as uuidv4 } from 'uuid';
import type { Category, Checklist, ChecklistStep, Presets } from '@/types';

const CHECKLISTS_KEY = 'opsette.checklist.v1';
const PRESETS_KEY = 'opsette.checklist.presets.v1';

/** Data-bearing localStorage keys (NOT UI prefs like dark mode / selection).
 *  When the bridge becomes authoritative, these get wiped to kill zombie data. */
export const DATA_STORAGE_KEYS = [CHECKLISTS_KEY, PRESETS_KEY] as const;

export function clearLocalData(): void {
  for (const k of DATA_STORAGE_KEYS) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}

export function defaultCategories(): Category[] {
  return [
    { data_id: uuidv4(), label: 'Doc', color: 'blue' },
    { data_id: uuidv4(), label: 'Invoice', color: 'green' },
    { data_id: uuidv4(), label: 'Workspace', color: 'purple' },
    { data_id: uuidv4(), label: 'Task', color: 'orange' },
  ];
}

export function defaultPresets(): Presets {
  return { categories: defaultCategories() };
}

interface MigratedShape {
  checklists: Checklist[];
  presets: Presets;
}

/**
 * Bring forward pre-category and pre-v1.1 data. Two shapes we need to handle:
 *   1. Ancient: `step.category: 'doc' | 'invoice' | ...` (string), no categories on checklist
 *   2. v1.0:    `Checklist.categories: Category[]` nested per-checklist, step.categoryId matching
 *   3. v1.1:    categories lifted to global `presets.categories`, each checklist has no categories
 *
 * This function normalizes a raw localStorage array of checklists into v1.1 by:
 *   - walking every checklist's nested `categories` array
 *   - deduping by `label.toLowerCase()` into a single global set
 *   - remapping each step's `categoryId` to the deduped category's id
 *   - dropping the nested `categories` field from each checklist
 *   - ensuring every checklist and step has a `data_id` (renaming from legacy `id` if needed)
 */
function migrateFromLegacy(rawChecklists: unknown[]): MigratedShape {
  const globalCategoriesByLabel = new Map<string, Category>();
  const migratedChecklists: Checklist[] = [];

  for (const raw of rawChecklists) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const id = typeof c.data_id === 'string'
      ? c.data_id
      : typeof c.id === 'string' ? c.id : null;
    if (!id || typeof c.name !== 'string') continue;

    // Collect this checklist's categories into the global map, remember the id remap.
    const localCategories = Array.isArray(c.categories) ? (c.categories as Record<string, unknown>[]) : [];
    const idRemap = new Map<string, string>();

    for (const lc of localCategories) {
      if (!lc || typeof lc !== 'object') continue;
      const label = typeof lc.label === 'string' ? lc.label.trim() : '';
      if (!label) continue;
      const color = typeof lc.color === 'string' ? lc.color : 'default';
      const oldId = typeof lc.data_id === 'string'
        ? lc.data_id
        : typeof lc.id === 'string' ? lc.id : null;

      const key = label.toLowerCase();
      let canonical = globalCategoriesByLabel.get(key);
      if (!canonical) {
        canonical = { data_id: uuidv4(), label, color };
        globalCategoriesByLabel.set(key, canonical);
      }
      if (oldId) idRemap.set(oldId, canonical.data_id);
    }

    // Seed defaults if this checklist had no categories and the global map is still empty.
    // (Prevents a legacy single-checklist user from ending up with zero categories.)
    if (globalCategoriesByLabel.size === 0) {
      for (const cat of defaultCategories()) {
        globalCategoriesByLabel.set(cat.label.toLowerCase(), cat);
      }
    }

    const rawSteps = Array.isArray(c.steps) ? (c.steps as Record<string, unknown>[]) : [];
    const steps: ChecklistStep[] = rawSteps
      .filter((s) => s && typeof s === 'object')
      .map((s) => {
        const stepId = typeof s.data_id === 'string'
          ? s.data_id
          : typeof s.id === 'string' ? s.id : uuidv4();

        // Resolve categoryId through the remap; also handle legacy string `category` field.
        let categoryId: string | undefined;
        if (typeof s.categoryId === 'string') {
          categoryId = idRemap.get(s.categoryId) ?? s.categoryId;
        } else if (typeof s.category === 'string' && s.category !== 'custom') {
          const match = globalCategoriesByLabel.get(s.category.toLowerCase());
          if (match) categoryId = match.data_id;
        }

        return {
          data_id: stepId,
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

    migratedChecklists.push({
      data_id: id,
      name: c.name,
      description: typeof c.description === 'string' ? c.description : '',
      isTemplate: !!c.isTemplate,
      sourceTemplateId: typeof c.sourceTemplateId === 'string' ? c.sourceTemplateId : undefined,
      steps,
      icon: typeof c.icon === 'string' ? c.icon : undefined,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
      completedAt: typeof c.completedAt === 'number' ? c.completedAt : undefined,
    });
  }

  const presets: Presets = {
    categories: globalCategoriesByLabel.size > 0
      ? Array.from(globalCategoriesByLabel.values())
      : defaultCategories(),
  };

  return { checklists: migratedChecklists, presets };
}

/** Load checklists + presets. Handles migration from legacy per-checklist-categories shape. */
export async function loadAll(): Promise<MigratedShape> {
  let rawChecklists: unknown[] = [];
  try {
    const raw = localStorage.getItem(CHECKLISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) rawChecklists = parsed;
    }
  } catch {
    // ignore
  }

  // Try to read stored presets. If present AND all checklists are already in v1.1 shape
  // (no nested `categories` arrays), we can skip migration and use as-is.
  let storedPresets: Presets | null = null;
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Presets).categories)) {
        storedPresets = {
          categories: ((parsed as Presets).categories).filter(
            (c): c is Category =>
              !!c && typeof c.data_id === 'string' && typeof c.label === 'string' && typeof c.color === 'string',
          ),
        };
      }
    }
  } catch {
    // ignore
  }

  const hasLegacyShape = rawChecklists.some(
    (c) => c && typeof c === 'object' && Array.isArray((c as Record<string, unknown>).categories),
  );
  const missingDataId = rawChecklists.some(
    (c) => c && typeof c === 'object' && typeof (c as Record<string, unknown>).data_id !== 'string',
  );

  if (hasLegacyShape || missingDataId || !storedPresets) {
    const migrated = migrateFromLegacy(rawChecklists);
    // If we had stored presets, keep them but union with any new categories discovered in migration.
    if (storedPresets) {
      const byLabel = new Map<string, Category>();
      for (const cat of storedPresets.categories) byLabel.set(cat.label.toLowerCase(), cat);
      for (const cat of migrated.presets.categories) {
        const key = cat.label.toLowerCase();
        if (!byLabel.has(key)) byLabel.set(key, cat);
      }
      migrated.presets = { categories: Array.from(byLabel.values()) };
    }
    return migrated;
  }

  // Everything is v1.1-clean. Just coerce.
  const checklists: Checklist[] = rawChecklists
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      data_id: c.data_id as string,
      name: typeof c.name === 'string' ? c.name : 'Untitled Checklist',
      description: typeof c.description === 'string' ? c.description : '',
      isTemplate: !!c.isTemplate,
      sourceTemplateId: typeof c.sourceTemplateId === 'string' ? c.sourceTemplateId : undefined,
      steps: (Array.isArray(c.steps) ? c.steps : []).map((s: Record<string, unknown>) => ({
        data_id: typeof s.data_id === 'string' ? s.data_id : uuidv4(),
        label: typeof s.label === 'string' ? s.label : 'Untitled step',
        description: typeof s.description === 'string' ? s.description : undefined,
        url: typeof s.url === 'string' ? s.url : undefined,
        categoryId: typeof s.categoryId === 'string' ? s.categoryId : undefined,
        dueDate: typeof s.dueDate === 'number' ? s.dueDate : undefined,
        dueOffsetDays: typeof s.dueOffsetDays === 'number' ? s.dueOffsetDays : undefined,
        completed: !!s.completed,
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : 0,
      })),
      icon: typeof c.icon === 'string' ? c.icon : undefined,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
      completedAt: typeof c.completedAt === 'number' ? c.completedAt : undefined,
    }));

  return { checklists, presets: storedPresets };
}

export async function saveAll(lists: Checklist[], presets: Presets): Promise<void> {
  try {
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(lists));
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Quota / private-mode — silently ignore
  }
}

export function createChecklist(opts: { name?: string; isTemplate?: boolean } = {}): Checklist {
  const now = Date.now();
  return {
    data_id: uuidv4(),
    name: opts.name ?? 'Untitled Checklist',
    description: '',
    isTemplate: !!opts.isTemplate,
    steps: [],
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
    data_id: uuidv4(),
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
    data_id: uuidv4(),
    completed: false,
    sortOrder,
  };
}

export function duplicateAsActive(template: Checklist, name: string): Checklist {
  const now = Date.now();
  return {
    data_id: uuidv4(),
    name,
    description: template.description,
    isTemplate: false,
    sourceTemplateId: template.data_id,
    icon: template.icon,
    steps: template.steps.map((s, i) => {
      const dueDate = typeof s.dueOffsetDays === 'number'
        ? now + s.dueOffsetDays * 24 * 60 * 60 * 1000
        : undefined;
      return {
        ...s,
        data_id: uuidv4(),
        completed: false,
        sortOrder: i,
        dueDate,
        // Strip offsets — offsets only live on templates.
        dueOffsetDays: undefined,
      };
    }),
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateAsTemplate(active: Checklist, name: string): Checklist {
  const now = Date.now();
  return {
    data_id: uuidv4(),
    name,
    description: active.description,
    isTemplate: true,
    icon: active.icon,
    steps: active.steps.map((s, i) => ({
      ...s,
      data_id: uuidv4(),
      completed: false,
      sortOrder: i,
      // Templates have offsets, not absolute dates.
      dueDate: undefined,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

/** Find every step in every checklist that uses the given categoryId.
 *  Returns [{ checklistName, isTemplate, stepLabel }, ...] — used by CategoryManager's delete-protection. */
export function findCategoryUsages(
  checklists: Checklist[],
  categoryId: string,
): Array<{ checklistName: string; isTemplate: boolean; stepLabel: string }> {
  const out: Array<{ checklistName: string; isTemplate: boolean; stepLabel: string }> = [];
  for (const c of checklists) {
    for (const s of c.steps) {
      if (s.categoryId === categoryId) {
        out.push({ checklistName: c.name, isTemplate: c.isTemplate, stepLabel: s.label });
      }
    }
  }
  return out;
}
