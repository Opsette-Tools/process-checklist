export interface Category {
  data_id: string;
  label: string;
  /** Ant Design color keyword or hex. */
  color: string;
}

export interface ChecklistStep {
  data_id: string;
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
  data_id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  sourceTemplateId?: string;
  steps: ChecklistStep[];
  /** Phosphor icon name (see lib/icons.ts CHECKLIST_ICONS). Optional — falls back to a name-derived monogram. */
  icon?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/** Org-wide presets stored in iframe_apps.presets (JSONB) in the parent.
 *  For Process Checklist, this currently holds only categories, but the
 *  shape is open so future keys can land here without a schema change. */
export interface Presets {
  categories: Category[];
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
