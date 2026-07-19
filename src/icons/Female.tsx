import type { IconProps } from '../Icon';
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR } from '../Icon';
export function IconFemale({
  size = DEFAULT_ICON_SIZE,
  color = DEFAULT_ICON_COLOR,
  ...props
}: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} {...props}><g fill={color}><path d="M12.002 16.75c-4.27 0-7.75-3.48-7.75-7.75s3.48-7.75 7.75-7.75 7.75 3.48 7.75 7.75-3.48 7.75-7.75 7.75m0-14c-3.45 0-6.25 2.8-6.25 6.25s2.8 6.25 6.25 6.25 6.25-2.8 6.25-6.25-2.8-6.25-6.25-6.25" /><path d="M12 22.15a.15.15 0 0 1-.104-.045.15.15 0 0 1-.046-.104v-6q0-.057.046-.105a.15.15 0 0 1 .104-.045c.036 0 .074.014.104.045q.046.048.046.105v6a.15.15 0 0 1-.046.104.15.15 0 0 1-.104.046" /><path d="M15 19.75H9c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h6c.41 0 .75.34.75.75s-.34.75-.75.75" /></g></svg>;
}