import React from "react";
import { mergeRefs } from '@/shared/utils';

export const useMergeRefs = <T,> (...refs: (React.Ref<T> | undefined | null)[]) => {
  return React.useMemo(() => mergeRefs(...refs), refs);
}