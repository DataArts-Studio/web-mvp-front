import React from 'react';

const mergeRefs =
  <T,>(...refs: (React.Ref<T> | undefined)[]) =>
  (node: T | null) =>
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else (ref as { current: T | null }).current = node;
    });

export { mergeRefs }