import type { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  /** Width and height in pixels (or any CSS size unit). Defaults to 24. */
  size?: number | string;
  /** Stroke/fill color. Defaults to `currentColor` so icons inherit text color. */
  color?: string;
}

export const DEFAULT_ICON_SIZE = 24;
export const DEFAULT_ICON_COLOR = 'currentColor';
