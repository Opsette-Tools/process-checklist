/**
 * Curated Phosphor icon set for checklist personalization.
 *
 * Each entry is the inner SVG markup (paths, lines, rects, etc.) of a
 * Phosphor icon at viewBox "0 0 256 256", weight: regular. Inline so we
 * don't pull a 1400-icon dependency.
 *
 * To add a new icon: copy its raw SVG from
 * https://github.com/phosphor-icons/core/blob/main/raw/regular/<name>.svg,
 * grab everything inside the <svg> tag, paste here. Keep stroke-width,
 * stroke-linecap, stroke-linejoin attributes on each shape.
 */

export interface IconDef {
  /** Phosphor icon name. Stable identifier — what's stored on Checklist.icon. */
  name: string;
  /** Human-readable label for the picker grid tooltip / aria-label. */
  label: string;
  /** Inner SVG markup at viewBox 0 0 256 256. */
  paths: string;
}

const stroke = (d: string) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>`;

export const CHECKLIST_ICONS: IconDef[] = [
  // ── Defaults (referenced explicitly by sidebar / monogram fallback) ─────────
  {
    name: 'ListChecks',
    label: 'Checklist',
    paths: `
      <line x1="128" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="64" x2="216" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="192" x2="216" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="40 64 56 80 88 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="40 128 56 144 88 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="40 192 56 208 88 176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Star',
    label: 'Star',
    paths: stroke('M135.18,32.7l25.81,52.29,57.71,8.39a8,8,0,0,1,4.43,13.65l-41.76,40.7,9.86,57.48a8,8,0,0,1-11.6,8.43L128,186.85,76.38,213.64a8,8,0,0,1-11.6-8.43l9.86-57.48L32.88,107a8,8,0,0,1,4.43-13.65L95,85,120.83,32.7A8,8,0,0,1,135.18,32.7Z'),
  },

  // ── Work / Business ────────────────────────────────────────────────────────
  {
    name: 'Briefcase',
    label: 'Briefcase',
    paths: `
      <rect x="32" y="72" width="192" height="144" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M168,72V56a16,16,0,0,0-16-16H104A16,16,0,0,0,88,56V72')}
      ${stroke('M224,128a191.94,191.94,0,0,1-96,25.65A191.94,191.94,0,0,1,32,128')}
      <line x1="120" y1="120" x2="136" y2="120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Handshake',
    label: 'Handshake',
    paths: stroke('M152,80h88v88M104,176H16V88M239.92,166.86,166.86,239.92a8,8,0,0,1-11.32,0l-115.46-115.46a8,8,0,0,1,0-11.32L113.14,40a8,8,0,0,1,11.32,0Z'),
  },
  {
    name: 'Phone',
    label: 'Phone',
    paths: stroke('M159.36,40A24,24,0,0,1,184,64M159.36,8a56,56,0,0,1,56.43,55.58q0,.21,0,.42M156.39,86l28.5,15.92a8,8,0,0,1,3.93,9.49,48.59,48.59,0,0,1-46,33.42c-43.6,0-79-35.4-79-79A48.59,48.59,0,0,1,97.17,19.18a8,8,0,0,1,9.49,3.93L122.57,51.6a8,8,0,0,1-.6,8.62L107.59,77.84a7.93,7.93,0,0,0-.71,8.27,79.32,79.32,0,0,0,33.66,33.71,8,8,0,0,0,8.28-.72L165.78,105A8,8,0,0,1,156.39,86Z'),
  },
  {
    name: 'ChatCircle',
    label: 'Chat',
    paths: `
      ${stroke('M79.93,211.11a96,96,0,1,0-35-35h0L29.4,213.74a8,8,0,0,0,10.55,10.39l39.94-13.06Z')}
    `,
  },
  {
    name: 'EnvelopeSimple',
    label: 'Email',
    paths: `
      <rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M224,56,128,144,32,56')}
    `,
  },
  {
    name: 'Megaphone',
    label: 'Megaphone',
    paths: `
      ${stroke('M240,120a16,16,0,0,0-16-16V72a8,8,0,0,0-12.65-6.51c-.21.16-21.59,15.41-46.62,23.62-23.43,7.69-54.13,8.9-77.42,8.9H56a32,32,0,0,0-8,63v37a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V168.05c19.45.62,42.93,2.45,61.73,8.62,25,8.21,46.41,23.46,46.62,23.61A8,8,0,0,0,224,194V136A16,16,0,0,0,240,120Z')}
      <line x1="88" y1="98.71" x2="88" y2="167.29" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Users',
    label: 'Team',
    paths: stroke('M64,168A88,88,0,0,1,200.71,94.29M120,160A48,48,0,1,1,72,112M88,16a48,48,0,0,1,67.94,67.94'),
  },
  {
    name: 'AddressBook',
    label: 'Contacts',
    paths: `
      <rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="176" y1="88" x2="176" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="176" y1="144" x2="176" y2="120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="176" y1="200" x2="176" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="108" cy="116" r="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M76,160a36,36,0,0,1,64,0')}
    `,
  },

  // ── Money / Sales ──────────────────────────────────────────────────────────
  {
    name: 'Receipt',
    label: 'Receipt',
    paths: `
      ${stroke('M40,224V40L72,56l32-16,32,16,32-16,32,16,16-16V224l-16-16-32,16-32-16-32,16L72,208Z')}
      <line x1="80" y1="120" x2="176" y2="120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="88" x2="176" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="152" x2="176" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'CurrencyDollar',
    label: 'Money',
    paths: `
      <line x1="128" y1="24" x2="128" y2="232" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M176,72H100a28,28,0,0,0,0,56h56a28,28,0,0,1,0,56H72')}
    `,
  },
  {
    name: 'Invoice',
    label: 'Invoice',
    paths: `
      ${stroke('M168,224V184a16,16,0,0,1,16-16h32V56a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8Z')}
      ${stroke('M216,168l-43.31,43.31A16,16,0,0,1,168,222.63')}
      <line x1="80" y1="100" x2="176" y2="100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="140" x2="124" y2="140" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'ShoppingCart',
    label: 'Cart',
    paths: `
      <circle cx="80" cy="216" r="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="184" cy="216" r="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M42.3,72H221.7l-26.4,92.4A15.9,15.9,0,0,1,179.9,176H84.1a15.9,15.9,0,0,1-15.4-11.6L32.5,37.8A8,8,0,0,0,24.8,32H8')}
    `,
  },
  {
    name: 'CreditCard',
    label: 'Credit card',
    paths: `
      <rect x="24" y="56" width="208" height="144" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="24" y1="96" x2="232" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="56" y1="160" x2="80" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="112" y1="160" x2="160" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },

  // ── Time / Plans ───────────────────────────────────────────────────────────
  {
    name: 'Calendar',
    label: 'Calendar',
    paths: `
      <rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Clock',
    label: 'Clock',
    paths: `
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="128 72 128 128 184 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Hourglass',
    label: 'Hourglass',
    paths: stroke('M200,224H56V178.34a16,16,0,0,1,4.69-11.32L100.69,127a16,16,0,0,0,0-22.62l-40-40A16,16,0,0,1,56,53V32H200V53a16,16,0,0,1-4.69,11.31l-40,40a16,16,0,0,0,0,22.62l40,40A16,16,0,0,1,200,178.34Z'),
  },
  {
    name: 'Flag',
    label: 'Flag',
    paths: `
      <line x1="40" y1="224" x2="40" y2="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M40,152s8-8,32-8,40,16,64,16,32-8,32-8V48s-8,8-32,8S96,40,72,40,40,48,40,48')}
    `,
  },
  {
    name: 'Target',
    label: 'Target',
    paths: `
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="128" cy="128" r="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="128" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Trophy',
    label: 'Trophy',
    paths: `
      <line x1="96" y1="224" x2="160" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="184" x2="128" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M58.46,112A80.18,80.18,0,0,1,56,96V40H200V96a80,80,0,0,1-160,0,40,40,0,0,1,0,80,40,40,0,0,1,0-80')}
      ${stroke('M198.62,112A80,80,0,0,0,216,96a40,40,0,0,0,0-80')}
      ${stroke('M40,56A40,40,0,0,0,40,136')}
    `,
  },

  // ── Communication / Decisions ──────────────────────────────────────────────
  {
    name: 'ChatCenteredDots',
    label: 'Conversation',
    paths: `
      ${stroke('M91.81,211.81,40,256V72a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H99.92')}
      <circle cx="128" cy="136" r="12"/>
      <circle cx="80" cy="136" r="12"/>
      <circle cx="176" cy="136" r="12"/>
    `,
  },
  {
    name: 'Lightbulb',
    label: 'Idea',
    paths: `
      ${stroke('M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Z')}
    `,
  },
  {
    name: 'Question',
    label: 'Question',
    paths: `
      <circle cx="128" cy="180" r="12"/>
      ${stroke('M128,144v-8c17.67,0,32-12.54,32-28s-14.33-28-32-28S96,92.54,96,108v4')}
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Warning',
    label: 'Warning',
    paths: `
      ${stroke('M142.41,40.22l87.46,151.87C236,202.79,228.08,216,215.46,216H40.54C27.92,216,20,202.79,26.13,192.09L113.59,40.22C119.89,29.26,136.11,29.26,142.41,40.22Z')}
      <line x1="128" y1="144" x2="128" y2="104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="128" cy="180" r="12"/>
    `,
  },
  {
    name: 'CheckCircle',
    label: 'Done',
    paths: `
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="172 100 116 156 84 124" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },

  // ── Documents / Content ────────────────────────────────────────────────────
  {
    name: 'FileText',
    label: 'Document',
    paths: `
      ${stroke('M200,224H56a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96l56,56V216A8,8,0,0,1,200,224Z')}
      <polyline points="152 32 152 88 208 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="96" y1="136" x2="160" y2="136" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="96" y1="168" x2="160" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'ClipboardText',
    label: 'Clipboard',
    paths: `
      ${stroke('M168,152H88M168,120H88M88,72H72A16,16,0,0,0,56,88V216a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V88a16,16,0,0,0-16-16H168')}
      <rect x="88" y="48" width="80" height="40" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Note',
    label: 'Note',
    paths: `
      ${stroke('M40,128a88,88,0,1,1,88,88H48a8,8,0,0,1-8-8Z')}
      <line x1="80" y1="128" x2="176" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="160" x2="176" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="80" y1="96" x2="176" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'BookOpen',
    label: 'Book',
    paths: stroke('M128,88c0-22.09-21.49-40-48-40H32a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H80c26.51,0,48,17.91,48,40,0-22.09,21.49-40,48-40h48a8,8,0,0,0,8-8V56a8,8,0,0,0-8-8H176C149.49,48,128,65.91,128,88ZM128,88V224'),
  },
  {
    name: 'Folder',
    label: 'Folder',
    paths: stroke('M32,200V64a8,8,0,0,1,8-8H92.69a8,8,0,0,1,5.65,2.34L128,88h88a8,8,0,0,1,8,8v32M32,200l40-72H256l-40,72ZM32,200H216'),
  },
  {
    name: 'Tag',
    label: 'Tag',
    paths: `
      ${stroke('M122.34,32H40a8,8,0,0,0-8,8v82.34a8,8,0,0,0,2.34,5.66L141.66,232a8,8,0,0,0,11.31,0L232,153a8,8,0,0,0,0-11.32L128,37.65A8,8,0,0,0,122.34,32Z')}
      <circle cx="84" cy="84" r="12"/>
    `,
  },

  // ── Tools / Actions ────────────────────────────────────────────────────────
  {
    name: 'Wrench',
    label: 'Wrench',
    paths: stroke('M223.66,90.93,179.07,135.5a8,8,0,0,1-11.31,0L120.5,88.24a8,8,0,0,1,0-11.31L165.07,32.34A56,56,0,0,0,90.93,106.5L34.34,163.07a16,16,0,0,0,0,22.63l35.95,35.95a16,16,0,0,0,22.63,0L149.5,165.06A56,56,0,0,0,223.66,90.93Z'),
  },
  {
    name: 'Gear',
    label: 'Settings',
    paths: `
      <circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M196.41,93.86c1.54,4,2.91,8,4.06,12.18l24.32,15.21a103.94,103.94,0,0,1,0,13.5l-24.32,15.21c-1.16,4.13-2.52,8.16-4.06,12.18l5.34,28.27a104,104,0,0,1-9.55,9.54l-28.27-5.33c-4,1.54-8,2.9-12.18,4.05l-15.21,24.34a103.94,103.94,0,0,1-13.5,0l-15.21-24.32c-4.13-1.16-8.16-2.52-12.18-4.06l-28.27,5.34a104.59,104.59,0,0,1-9.54-9.55l5.33-28.27c-1.54-4-2.9-8-4.05-12.18L31.21,134.74a103.94,103.94,0,0,1,0-13.5l24.32-15.21c1.16-4.13,2.52-8.16,4.06-12.18L54.25,65.58a104,104,0,0,1,9.55-9.54l28.27,5.33c4-1.54,8-2.9,12.18-4.05l15.21-24.32a103.94,103.94,0,0,1,13.5,0l15.21,24.32c4.13,1.16,8.16,2.52,12.18,4.06l28.27-5.34a104.59,104.59,0,0,1,9.54,9.55Z')}
    `,
  },
  {
    name: 'Hammer',
    label: 'Hammer',
    paths: stroke('M229.66,98.34l-40-40a8,8,0,0,0-11.32,0l-24,24L52.69,9.65a16,16,0,0,0-22.63,0L9.65,30.06a16,16,0,0,0,0,22.63L111.34,154.34l-58.55,58.54a16,16,0,0,0,0,22.62l9.71,9.72a16,16,0,0,0,22.62,0l58.55-58.55,9.7,9.7a8,8,0,0,0,11.32,0l65-65a16,16,0,0,0,0-22.62Z'),
  },
  {
    name: 'PaintBrush',
    label: 'Paint',
    paths: stroke('M232,55.92c0,15.15-9.79,29.65-29.06,43.11C188.84,108.94,170.7,117.59,151.39,123c-4.65,1.35-9.43,2.51-14.23,3.49-12.4,2.54-24.44,3.92-33.84,3.92-25.6,0-46.32,11.06-58.32,31.18a4,4,0,0,1-7.6-1.4c-3-50.65,38.41-88.34,103.39-88.34S232,33.59,232,55.92ZM152,184c0,16.85-15.31,30.67-37.13,38.31a8,8,0,0,1-9.83-3.91L96.77,202.91A8,8,0,0,0,86.41,200.79l-22.91,9.16a8,8,0,0,1-10.93-9.45c5.37-19.9,21.43-32.5,40.43-32.5C113.77,168,152,166.31,152,184Z'),
  },
  {
    name: 'Scissors',
    label: 'Scissors',
    paths: `
      <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="60" cy="196" r="28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="79.69" y1="79.69" x2="216" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="153" y1="153" x2="216" y2="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="103" y1="103" x2="128" y2="61" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Lock',
    label: 'Lock',
    paths: `
      <rect x="40" y="88" width="176" height="128" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M88,88V56a40,40,0,0,1,80,0V88')}
    `,
  },
  {
    name: 'Key',
    label: 'Key',
    paths: `
      <circle cx="80" cy="160" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M108.28,131.72,232,8V40L208,64l-24-24L131.72,108.28')}
    `,
  },
  {
    name: 'MagnifyingGlass',
    label: 'Search',
    paths: `
      <circle cx="116" cy="116" r="84" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="175.39" y1="175.39" x2="224" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },

  // ── Travel / Logistics ─────────────────────────────────────────────────────
  {
    name: 'Truck',
    label: 'Truck',
    paths: `
      <line x1="8" y1="80" x2="152" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="60" cy="200" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="188" cy="200" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M164,200H84M212,200h28a8,8,0,0,0,8-8V137.61a7.91,7.91,0,0,0-2.34-5.65L208,96H32a8,8,0,0,0-8,8v88a8,8,0,0,0,8,8H36')}
      <line x1="152" y1="96" x2="152" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="200" y1="136" x2="248" y2="136" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'MapPin',
    label: 'Location',
    paths: `
      <circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z')}
    `,
  },
  {
    name: 'Airplane',
    label: 'Airplane',
    paths: stroke('M104,224l24-32H88a8,8,0,0,1-7.69-5.81L62.85,124.5,32.39,89.69A8,8,0,0,1,38.4,76.49L72,80l24-24a23.84,23.84,0,0,1,17-7l-9.81,98.13a8,8,0,0,0,9,8.74L160,148l16,32-32,8L120,224Z'),
  },
  {
    name: 'House',
    label: 'House',
    paths: `
      ${stroke('M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l88-79.99a8,8,0,0,1,10.77,0l88,79.99a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z')}
    `,
  },

  // ── Health / People ────────────────────────────────────────────────────────
  {
    name: 'Heart',
    label: 'Heart',
    paths: stroke('M128,224S24,168,24,102A54,54,0,0,1,128,82h0A54,54,0,0,1,232,102C232,168,128,224,128,224Z'),
  },
  {
    name: 'User',
    label: 'Person',
    paths: `
      <circle cx="128" cy="96" r="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M30.99,216a112,112,0,0,1,194.02,0')}
    `,
  },
  {
    name: 'Cake',
    label: 'Celebrate',
    paths: `
      ${stroke('M32,224V152a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8v72M32,184s24-16,48,0,48,0,48,0,24-16,48,0,48,0,48,0M64,144V112a64,64,0,0,1,128,0v32M88,96V64M128,80V32M168,96V64')}
    `,
  },
  {
    name: 'Coffee',
    label: 'Coffee',
    paths: stroke('M88,16V40M128,16V40M168,16V40M184,80h16a32,32,0,0,1,32,32v16a32,32,0,0,1-32,32H184M32,80H184v96a48,48,0,0,1-48,48H80a48,48,0,0,1-48-48Z'),
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
  {
    name: 'Fire',
    label: 'Fire',
    paths: stroke('M112,184a32,32,0,0,1-32-32c0-13,5-23.71,16-32,11.79-8.88,16-19,16-32,11,5,32,21,40,40,8.61-13,8-32,8-32s40,29.45,40,72a72,72,0,0,1-144,0c0-23.79,9.32-43.78,24-58'),
  },
  {
    name: 'Lightning',
    label: 'Lightning',
    paths: stroke('M96,240a8,8,0,0,1-7.79-9.77L102.86,168H56a8,8,0,0,1-6.34-12.88l88-112a8,8,0,0,1,14.13,6.65L137.14,104H184a8,8,0,0,1,6.34,12.88l-88,112A8,8,0,0,1,96,240Z'),
  },
  {
    name: 'Globe',
    label: 'Globe',
    paths: `
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="32" y1="128" x2="224" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M128,32a128,128,0,0,1,0,192M128,32a128,128,0,0,0,0,192')}
    `,
  },
  {
    name: 'Rocket',
    label: 'Rocket',
    paths: stroke('M223.85,55a8,8,0,0,0-6.85-6.85c-30.93-4.41-86.81,8.07-122.66,43.92a142.39,142.39,0,0,0-21.51,28.39L48.49,123.4a16.18,16.18,0,0,0-12,7.74A15.78,15.78,0,0,0,35.51,147l25.41,53.93a16,16,0,0,0,21.21,7.79l43.6-19.59a142.34,142.34,0,0,0,28.4-21.51C190,131.79,202.46,75.91,223.85,55ZM156.69,99.31a16,16,0,1,1,22.62,0A16,16,0,0,1,156.69,99.31ZM48,232a40,40,0,0,1,40-40'),
  },
  {
    name: 'PawPrint',
    label: 'Pet',
    paths: stroke('M240,112a32,32,0,1,1-44.86-29.27A48,48,0,0,1,200,72,32,32,0,0,1,240,112ZM48,144a32,32,0,1,1,32-32A32,32,0,0,1,48,144Zm56-64A32,32,0,1,1,136,48,32,32,0,0,1,104,80Zm104,64a32,32,0,1,1-32-32A32,32,0,0,1,208,144Zm-30.92,53.05c-13.85-9.93-15.92-31.6-49.08-31.6S92.84,187.21,79,197A28,28,0,0,0,96,248c12.25,0,21.18-8,32-8s19.75,8,32,8a28,28,0,0,0,17.08-50.95Z'),
  },
  {
    name: 'Camera',
    label: 'Camera',
    paths: `
      ${stroke('M208,208H48a16,16,0,0,1-16-16V80A16,16,0,0,1,48,64H80L96,40h64l16,24h32a16,16,0,0,1,16,16V192A16,16,0,0,1,208,208Z')}
      <circle cx="128" cy="132" r="36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Camping',
    label: 'Outdoor',
    paths: `
      <line x1="200" y1="216" x2="56" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      ${stroke('M128,40,40,216M128,40l88,176M104,168l24,48,24-48')}
    `,
  },
  {
    name: 'Cube',
    label: 'Cube',
    paths: `
      <polygon points="32 88 128 32 224 88 224 168 128 224 32 168 32 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <polyline points="32 88 128 144 224 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="144" x2="128" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    `,
  },
  {
    name: 'Confetti',
    label: 'Party',
    paths: stroke('M48,32V64M64,48H32M192,168v32M208,184H176M144,32l-8,16M208,80,192,72l8-16,16,8ZM48,144l8,16-16,8-8-16ZM98.34,93.66,32,224l130.34-66.34Z'),
  },
];

/** Lookup helper. */
export const ICON_BY_NAME: Record<string, IconDef> = Object.fromEntries(
  CHECKLIST_ICONS.map((i) => [i.name, i]),
);

/** Default icons used when Checklist.icon is not set. */
export const DEFAULT_ICON_TEMPLATE = 'Star';
export const DEFAULT_ICON_CHECKLIST = 'ListChecks';

export function getDefaultIconName(isTemplate: boolean): string {
  return isTemplate ? DEFAULT_ICON_TEMPLATE : DEFAULT_ICON_CHECKLIST;
}

/** Resolve a checklist's display icon (explicit pick → template/checklist default). */
export function resolveIcon(checklist: { icon?: string; isTemplate: boolean }): IconDef {
  if (checklist.icon && ICON_BY_NAME[checklist.icon]) return ICON_BY_NAME[checklist.icon];
  return ICON_BY_NAME[getDefaultIconName(checklist.isTemplate)];
}
