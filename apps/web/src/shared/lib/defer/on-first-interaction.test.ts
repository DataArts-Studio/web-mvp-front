// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onFirstInteraction } from './on-first-interaction';

describe('onFirstInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('첫 상호작용이 오면 시간 제한 전에 한 번만 실행한다.', () => {
    const callback = vi.fn();
    onFirstInteraction(callback, 4000);

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(5000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('상호작용이 없으면 시간 제한이 지난 뒤 실행한다.', () => {
    const callback = vi.fn();
    onFirstInteraction(callback, 4000);

    vi.advanceTimersByTime(3999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('keydown'));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('취소하면 상호작용이나 시간 제한이 와도 실행하지 않는다.', () => {
    const callback = vi.fn();
    const cancel = onFirstInteraction(callback, 4000);

    cancel();
    window.dispatchEvent(new Event('touchstart'));
    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
  });
});
