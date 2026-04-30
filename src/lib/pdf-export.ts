import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Category, Checklist } from '@/types';

// Page geometry
const PAGE_W  = 612;
const PAGE_H  = 792;
const MARGIN  = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Typography
const TITLE_SIZE  = 20;
const LABEL_SIZE  = 11;
const META_SIZE   = 8.5;
const DESC_SIZE   = 9;

// Row layout
const ROW_PAD_TOP = 10;
const ROW_PAD_BOT = 10;
const LABEL_LEADING = 15;
const META_LEADING  = 12;
const DESC_LEADING  = 12;

// Checkbox
const CB_SIZE = 11;   // square side length
const CB_GAP  = 10;   // gap between checkbox right edge and label

const TEXT_X  = MARGIN + CB_SIZE + CB_GAP;
const TEXT_W  = CONTENT_W - CB_SIZE - CB_GAP;

// Colors
const C_DARK  = rgb(0.141, 0.220, 0.345);
const C_BROWN = rgb(0.663, 0.443, 0.259);
const C_BLACK = rgb(0.10,  0.10,  0.10);
const C_GRAY  = rgb(0.45,  0.45,  0.45);
const C_MID   = rgb(0.60,  0.60,  0.60);
const C_WHITE = rgb(1,     1,     1);
const C_LINK  = rgb(0.18,  0.45,  0.80);
const C_ROW   = rgb(0.96,  0.97,  0.98);

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const try_ = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(try_, size) <= maxW) {
      cur = try_;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// State shared across helpers
let _doc: PDFDocument;
let _page: PDFPage;
let _fontR: PDFFont;
let _fontB: PDFFont;
/** Current y cursor — always the bottom of the NEXT thing we'll draw. */
let _y: number;

function ensureSpace(needed: number) {
  if (_y - needed < MARGIN + 32 /* footer room */) {
    _page = _doc.addPage([PAGE_W, PAGE_H]);
    _y = PAGE_H - MARGIN;
  }
}

async function addCheckbox(x: number, yBottom: number, size: number, checked: boolean, name: string) {
  const form = _doc.getForm();
  const cb = form.createCheckBox(name);
  cb.addToPage(_page, {
    x,
    y: yBottom,          // pdf-lib x,y = bottom-left of the widget
    width: size,
    height: size,
    borderWidth: 1,
    borderColor: C_DARK,
    backgroundColor: C_WHITE,
  });
  if (checked) cb.check();
}

export async function exportChecklistToPdf(checklist: Checklist, categories: Category[]): Promise<void> {
  const catById = new Map(categories.map((c) => [c.data_id, c.label]));

  _doc   = await PDFDocument.create();
  _fontR = await _doc.embedFont(StandardFonts.Helvetica);
  _fontB = await _doc.embedFont(StandardFonts.HelveticaBold);
  _page  = _doc.addPage([PAGE_W, PAGE_H]);
  _y     = PAGE_H;

  const sorted = [...checklist.steps].sort((a, b) => a.sortOrder - b.sortOrder);

  // ── Header bar ──────────────────────────────────────────────────────────────
  const HEADER_H = 68;
  _page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: C_DARK });

  const titleLines = wrap(checklist.name, _fontB, TITLE_SIZE, CONTENT_W - 16);
  // Center the block of title lines vertically in the header
  const titleBlockH = titleLines.length * (TITLE_SIZE + 4);
  let titleY = PAGE_H - (HEADER_H - titleBlockH) / 2 - TITLE_SIZE;
  for (const line of titleLines) {
    _page.drawText(line, { x: MARGIN, y: titleY, font: _fontB, size: TITLE_SIZE, color: C_WHITE });
    titleY -= TITLE_SIZE + 4;
  }

  _y = PAGE_H - HEADER_H - 20;

  // ── Description ─────────────────────────────────────────────────────────────
  if (checklist.description) {
    const lines = checklist.description
      .split('\n')
      .flatMap(l => wrap(l.trim(), _fontR, 10, CONTENT_W))
      .filter(Boolean);
    ensureSpace(lines.length * 14 + 8);
    for (const line of lines) {
      _page.drawText(line, { x: MARGIN, y: _y, font: _fontR, size: 10, color: C_GRAY });
      _y -= 14;
    }
    _y -= 8;
  }

  // ── Divider ───────────────────────────────────────────────────────────────────
  _page.drawLine({ start: { x: MARGIN, y: _y }, end: { x: PAGE_W - MARGIN, y: _y }, thickness: 0.5, color: rgb(0.82, 0.82, 0.82) });
  _y -= 2;

  // ── Steps ─────────────────────────────────────────────────────────────────────
  for (let i = 0; i < sorted.length; i++) {
    const step     = sorted[i];
    const catLabel = step.categoryId ? (catById.get(step.categoryId) ?? null) : null;
    const dueText  = step.dueDate ? `Due: ${formatDate(step.dueDate)}` : null;
    const metaLine = [catLabel, dueText].filter(Boolean).join('   ');
    const descLines = step.description
      ? step.description.split('\n').flatMap(l => wrap(l.trim(), _fontR, DESC_SIZE, TEXT_W - 8)).filter(Boolean)
      : [];
    const urlText = step.url
      ? (step.url.length > 80 ? step.url.slice(0, 77) + '…' : step.url)
      : '';
    const labelLines = wrap(step.label, _fontB, LABEL_SIZE, TEXT_W);

    // Calculate total block height so we can draw the background rect first
    const blockH =
      ROW_PAD_TOP +
      labelLines.length * LABEL_LEADING +
      (metaLine    ? 2 + META_LEADING              : 0) +
      (descLines.length ? 4 + descLines.length * DESC_LEADING : 0) +
      (urlText     ? 2 + DESC_LEADING              : 0) +
      ROW_PAD_BOT;

    ensureSpace(blockH);

    const rowTop = _y;
    const rowBot = rowTop - blockH;

    // Alternating row background — drawn before text so text appears on top
    if (i % 2 === 0) {
      _page.drawRectangle({ x: MARGIN - 6, y: rowBot, width: CONTENT_W + 12, height: blockH, color: C_ROW });
    }

    // Move cursor to content start (below top padding)
    _y = rowTop - ROW_PAD_TOP;

    // Label baseline = _y - ascender gap
    // font.heightAtSize gives total glyph height; we want the baseline offset from the top of the em-square.
    // For Helvetica at size S: ascender ≈ 0.718 * S (standard value).
    const ascender = LABEL_SIZE * 0.718;
    const labelBaseline = _y - ascender;

    // Checkbox: vertically centered on the label's cap-height.
    // Place checkbox so its center aligns with labelBaseline + half capHeight.
    // capHeight for Helvetica ≈ 0.718 * size (same as ascender for this font).
    // Checkbox bottom = labelBaseline - CB_SIZE/2 + ascender/2
    const cbBottom = labelBaseline - (CB_SIZE - ascender) / 2;
    await addCheckbox(MARGIN, cbBottom, CB_SIZE, step.completed, `step_${step.data_id}`);

    // Draw label lines — each line's baseline descends by LABEL_LEADING
    for (let li = 0; li < labelLines.length; li++) {
      _page.drawText(labelLines[li], {
        x: TEXT_X,
        y: labelBaseline - li * LABEL_LEADING,
        font: _fontB,
        size: LABEL_SIZE,
        color: step.completed ? C_MID : C_BLACK,
      });
    }
    _y = labelBaseline - labelLines.length * LABEL_LEADING;

    // Meta line (category + due date)
    if (metaLine) {
      _y -= 2;
      _page.drawText(metaLine, { x: TEXT_X, y: _y, font: _fontR, size: META_SIZE, color: C_BROWN });
      _y -= META_LEADING;
    }

    // Description
    if (descLines.length) {
      _y -= 4;
      for (const line of descLines) {
        _page.drawText(line, { x: TEXT_X + 4, y: _y, font: _fontR, size: DESC_SIZE, color: C_GRAY });
        _y -= DESC_LEADING;
      }
    }

    // URL
    if (urlText) {
      _y -= 2;
      _page.drawText(urlText, { x: TEXT_X + 4, y: _y, font: _fontR, size: DESC_SIZE - 1, color: C_LINK });
      _y -= DESC_LEADING;
    }

    // Move cursor to row bottom (skip bottom padding)
    _y = rowBot;
  }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pageCount = _doc.getPageCount();
  for (let p = 0; p < pageCount; p++) {
    const pg = _doc.getPage(p);
    pg.drawLine({ start: { x: MARGIN, y: 36 }, end: { x: PAGE_W - MARGIN, y: 36 }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) });
    pg.drawText(`${checklist.name} · Exported ${new Date().toLocaleDateString()}`, { x: MARGIN, y: 24, font: _fontR, size: 7, color: C_MID });
    pg.drawText(`Page ${p + 1} of ${pageCount}`, { x: PAGE_W - MARGIN - 56, y: 24, font: _fontR, size: 7, color: C_MID });
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  const bytes = await _doc.save();
  const blob  = new Blob([bytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${checklist.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}
