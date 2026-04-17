export interface Category {
  id: string;
  label: string;
  /** Ant Design color keyword or hex. */
  color: string;
}

export interface ChecklistStep {
  id: string;
  label: string;
  description?: string;
  url?: string;
  categoryId?: string;
  /** Absolute due date (ms epoch). For active checklists. */
  dueDate?: number;
  /** Template-only: days from checklist start to auto-compute dueDate on instantiation. */
  dueOffsetDays?: number;
  completed: boolean;
  sortOrder: number;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  sourceTemplateId?: string;
  steps: ChecklistStep[];
  /** Per-checklist category vocabulary. */
  categories: Category[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/** Ant Design color names recognised by `<Tag color=...>`. */
export const CATEGORY_COLOR_CHOICES = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'default',
] as const;

export type CategoryColor = typeof CATEGORY_COLOR_CHOICES[number];
