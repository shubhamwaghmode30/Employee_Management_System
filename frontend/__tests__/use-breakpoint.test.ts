import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { getBreakpoint, useBreakpoint } from '../src/hooks/use-breakpoint';

function setWindowWidth(width: number): void {
  const window = Dimensions.get('window');
  Dimensions.set({ window: { ...window, width } });
}

describe('getBreakpoint', () => {
  it.each([
    [375, 'mobile'],
    [767, 'mobile'],
    [768, 'tablet'],
    [834, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1440, 'desktop'],
  ])('maps a width of %i to %s', (width, expected) => {
    expect(getBreakpoint(width)).toBe(expected);
  });
});

describe('useBreakpoint', () => {
  const originalWidth = Dimensions.get('window').width;

  afterEach(async () => {
    await act(() => {
      setWindowWidth(originalWidth);
    });
  });

  it('returns the breakpoint for the current window width', async () => {
    setWindowWidth(1280);

    const { result } = await renderHook(() => useBreakpoint());

    expect(result.current).toBe('desktop');
  });

  it('updates when the window is resized', async () => {
    setWindowWidth(1280);
    const { result } = await renderHook(() => useBreakpoint());

    await act(() => {
      setWindowWidth(390);
    });

    expect(result.current).toBe('mobile');
  });
});
