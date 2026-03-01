import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { versionCompareQueryOptions } from '@/entities/test-case-version/api/query';

export const useVersionCompare = (testCaseId: string) => {
  const [oldVersion, setOldVersion] = useState<number>(0);
  const [newVersion, setNewVersion] = useState<number>(0);

  const query = useQuery(versionCompareQueryOptions(testCaseId, oldVersion, newVersion));

  return {
    ...query,
    oldVersion,
    newVersion,
    setOldVersion,
    setNewVersion,
  };
};
