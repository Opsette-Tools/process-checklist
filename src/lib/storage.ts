import { v4 as uuidv4 } from 'uuid';
import type { Checklist, ChecklistStep, StepCategory } from '@/types';

const STORAGE_KEY = 'opsette.checklist.v1';

export function loadAll(): Checklist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveAll(lists: Checklist[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

export function createChecklist(opts: { name?: string; isTemplate?: boolean } = {}): Checklist {
  const now = Date.now();
  return {
    id: uuidv4(),
    name: opts.name ?? 'Untitled Checklist',
    description: '',
    isTemplate: !!opts.isTemplate,
    steps: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createStep(opts: { label: string; description?: string; url?: string; category?: StepCategory; sortOrder: number }): ChecklistStep {
  return {
    id: uuidv4(),
    label: opts.label,
    description: opts.description,
    url: opts.url,
    category: opts.category,
    completed: false,
    sortOrder: opts.sortOrder,
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
    steps: template.steps.map((s, i) => ({
      ...s,
      id: uuidv4(),
      completed: false,
      sortOrder: i,
    })),
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
    })),
    createdAt: now,
    updatedAt: now,
  };
}
