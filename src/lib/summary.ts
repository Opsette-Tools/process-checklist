import type { Checklist } from '@/types';

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

/** Plain-text fallback for clipboards that don't accept HTML. */
export function buildSummary(checklist: Checklist): string {
  const lines = [checklist.name];
  if (checklist.description) lines.push(checklist.description, '');
  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const step of sorted) {
    const mark = step.completed ? '✅' : '☐';
    const tag = step.category ? ` [${step.category}]` : '';
    lines.push(`${mark} ${step.label}${tag}`);
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
export function buildSummaryHtml(checklist: Checklist): string {
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
      const tag = step.category
        ? ` <em>[${escapeHtml(step.category)}]</em>`
        : '';

      const subParts: string[] = [];
      if (step.description) {
        subParts.push(`<li>${nl2brHtml(step.description)}</li>`);
      }
      if (step.url) {
        const safeUrl = escapeHtml(step.url);
        subParts.push(
          `<li><a href="${safeUrl}">${safeUrl}</a></li>`
        );
      }

      const sub = subParts.length ? `<ul>${subParts.join('')}</ul>` : '';
      parts.push(`<li>${mark} ${label}${tag}${sub}</li>`);
    }
    parts.push('</ul>');
  }
  return parts.join('');
}

/** Copy both HTML + plain text so paste targets pick the best format. */
export async function copyChecklistToClipboard(checklist: Checklist): Promise<void> {
  const html = buildSummaryHtml(checklist);
  const text = buildSummary(checklist);

  // Preferred: write both HTML and plain-text representations.
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
      // Fall through to plain-text fallback below.
    }
  }

  await navigator.clipboard.writeText(text);
}
