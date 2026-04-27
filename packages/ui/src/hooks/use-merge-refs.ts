import React from 'react';
import { mergeRefs } from '../utils/merge-refs';

export const useMergeRefs = <T,>(...refs: (React.Ref<T> | undefined | null)[]) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rest params cannot be an array literal
  return React.useMemo(() => mergeRefs(...refs), refs);
};
