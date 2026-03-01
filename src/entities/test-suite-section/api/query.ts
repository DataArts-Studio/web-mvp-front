import { queryOptions } from '@tanstack/react-query';
import { getSections } from './server-actions';

export const suiteSectionsQueryOptions = (suiteId: string) =>
  queryOptions({
    queryKey: ['suiteSections', suiteId],
    queryFn: () => getSections(suiteId),
  });
