import type { IconProps } from '../Icon';
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR } from '../Icon';

/** Generated from Figma component `icon/dashboard/menu`. Do not edit by hand. */
export function IconMenu({
  size = DEFAULT_ICON_SIZE,
  color = DEFAULT_ICON_COLOR,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
