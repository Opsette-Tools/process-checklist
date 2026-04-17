import type { Checklist } from '@/types';

export function buildSummary(checklist: Checklist): string {
  const lines = [checklist.name];
  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const step of sorted) {
    const mark = step.completed ? '✅' : '☐';
    lines.push(`${mark} ${step.label}`);
  }
  return lines.join('\n');
}
