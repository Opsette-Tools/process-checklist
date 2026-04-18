import type { Category, Checklist } from '@/types';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const nl2brHtml = (s: string) =>
  escapeHtml(s)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('<br />');

function formatDueDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Plain-text fallback for clipboards that don't accept HTML. */
export function buildSummary(checklist: Checklist, categories: Category[]): string {
  const catById = new Map(categories.map((c) => [c.data_id, c.label]));
  const lines = [checklist.name];
  if (checklist.description) lines.push(checklist.description, '');
  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const step of sorted) {
    const mark = step.completed ? '✅' : '☐';
    const catLabel = step.categoryId ? catById.get(step.categoryId) : null;
    const tag = catLabel ? ` [${catLabel}]` : '';
    const due = step.dueDate ? ` (due ${formatDueDate(step.dueDate)})` : '';
    lines.push(`${mark} ${step.label}${tag}${due}`);
    if (step.description) {
      for (const dl of step.description.split('\n')) {
        if (dl.trim()) lines.push(`    ${dl}`);
      }
    }
    if (step.url) lines.push(`    🔗 ${step.url}`);
  }
  return lines.join('\n');
}

/** Rich HTML version — pastes as a formatted heading + bulleted list with sub-bullets. */
export function buildSummaryHtml(checklist: Checklist, categories: Category[]): string {
  const catById = new Map(categories.map((c) => [c.data_id, c.label]));
  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const parts: string[] = [];
  parts.push(`<h2>${escapeHtml(checklist.name)}</h2>`);
  if (checklist.description) {
    parts.push(`<p>${nl2brHtml(checklist.description)}</p>`);
  }
  if (sorted.length > 0) {
    parts.push('<ul>');
    for (const step of sorted) {
      const mark = step.completed ? '☑' : '☐';
      const labelText = escapeHtml(step.label);
      const label = step.completed
        ? `<s>${labelText}</s>`
        : `<strong>${labelText}</strong>`;
      const catLabel = step.categoryId ? catById.get(step.categoryId) : null;
      const tag = catLabel ? ` <em>[${escapeHtml(catLabel)}]</em>` : '';
      const due = step.dueDate
        ? ` <em>(due ${escapeHtml(formatDueDate(step.dueDate))})</em>`
        : '';

      const subParts: string[] = [];
      if (step.description) {
        subParts.push(`<li>${nl2brHtml(step.description)}</li>`);
      }
      if (step.url) {
        const safeUrl = escapeHtml(step.url);
        subParts.push(`<li><a href="${safeUrl}">${safeUrl}</a></li>`);
      }

      const sub = subParts.length ? `<ul>${subParts.join('')}</ul>` : '';
      parts.push(`<li>${mark} ${label}${tag}${due}${sub}</li>`);
    }
    parts.push('</ul>');
  }
  return parts.join('');
}

export async function copyChecklistToClipboard(checklist: Checklist, categories: Category[]): Promise<void> {
  const html = buildSummaryHtml(checklist, categories);
  const text = buildSummary(checklist, categories);

  if (
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard &&
    'write' in navigator.clipboard
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // Fall through.
    }
  }

  await navigator.clipboard.writeText(text);
}
