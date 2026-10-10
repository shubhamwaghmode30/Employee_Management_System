import { useWindowDimensions } from 'react-native';

import { breakpoints } from '../theme';
import type { Breakpoint } from '../types/breakpoint';

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.desktop) {
    return 'desktop';
  }
  if (width >= breakpoints.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

/** Returns the layout breakpoint for the current window and updates on resize. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return getBreakpoint(width);
}
