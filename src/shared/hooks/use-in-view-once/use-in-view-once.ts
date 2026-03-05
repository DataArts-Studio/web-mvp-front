import { useCallback, useEffect, useRef, useState } from 'react';

export function useInViewOnce(rootMargin = '200px') {
  const [visible, setVisible] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const obsRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setEl(node);
  }, []);

  useEffect(() => {
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obsRef.current = obs;
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, rootMargin, visible]);

  return { targetRef: ref, visible };
}
