import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../src/hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('only returns the latest value after it stops changing for the delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'pri' } },
    );

    await rerender({ value: 'priy' });
    await act(() => {
      jest.advanceTimersByTime(200);
    });
    await rerender({ value: 'priya' });
    await act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('pri');

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('priya');
  });
});
