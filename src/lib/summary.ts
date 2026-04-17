import type { Checklist } from '@/types';

export function buildSummary(checklist: Checklist): string {
  const lines = [checklist.name];
  if (checklist.description) lines.push(checklist.description, '');
  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const step of sorted) {
    const mark = step.completed ? '✅' : '☐';
    lines.push(`${mark} ${step.label}`);
    if (step.description) {
      for (const dl of step.description.split('\n')) {
        lines.push(`    ${dl}`);
      }
    }
    if (step.url) lines.push(`    🔗 ${step.url}`);
  }
  return lines.join('\n');
}
