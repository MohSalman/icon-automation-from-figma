import type { IconProps } from '../Icon';
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR } from '../Icon';
export function IconMale({
  size = DEFAULT_ICON_SIZE,
  color = DEFAULT_ICON_COLOR,
  ...props
}: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} {...props}><path fill={color} fillRule="evenodd" d="M20.75 9c0 .41.34.75.75.75s.75-.34.75-.75V2.5a.7.7 0 0 0-.071-.317.73.73 0 0 0-.367-.364.7.7 0 0 0-.312-.07H15c-.41 0-.75.34-.75.75s.34.75.75.75h4.69l-3.984 3.985A8.46 8.46 0 0 0 10.25 5.25c-4.69 0-8.5 3.81-8.5 8.5s3.81 8.5 8.5 8.5 8.5-3.81 8.5-8.5a8.46 8.46 0 0 0-1.984-5.456L20.75 4.31zm-10.5-2.25c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7" clipRule="evenodd" /></svg>;
}