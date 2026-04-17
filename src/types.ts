export type StepCategory = 'doc' | 'invoice' | 'workspace' | 'task' | 'custom';

export interface ChecklistStep {
  id: string;
  label: string;
  url?: string;
  category?: StepCategory;
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
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
