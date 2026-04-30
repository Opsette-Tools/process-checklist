import { CHECKLIST_ICONS, ICON_BY_NAME, getDefaultIconName } from '@/lib/icons';

interface ChecklistIconProps {
  /** Phosphor icon name. If omitted/unknown, falls back to template/checklist default. */
  name?: string;
  /** Used to pick a default icon when `name` is missing. */
  isTemplate?: boolean;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders one of the curated CHECKLIST_ICONS as a 256-viewBox SVG.
 * Inherits `currentColor` unless `color` is passed.
 */
export default function ChecklistIcon({
  name,
  isTemplate = false,
  size = 20,
  color,
  className,
  style,
}: ChecklistIconProps) {
  const def = (name && ICON_BY_NAME[name]) || ICON_BY_NAME[getDefaultIconName(isTemplate)] || CHECKLIST_ICONS[0];
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      style={{ flex: '0 0 auto', color, ...style }}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: def.paths }}
    />
  );
}
