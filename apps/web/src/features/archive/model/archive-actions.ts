'use server';
import { archiveMilestone } from '@/entities';
import { archiveProject } from '@/entities/project/api/server-actions';
import { archiveTestCase } from '@/entities/test-case/api/server-actions';
import { archiveTestSuite } from '@/entities/test-suite/api/server-actions';

import { ArchiveTargetType } from './types';

/** 프로젝트는 이름 재확인(confirmName)이 맞아야 보관된다. */
export const archiveAction = async (
  targetType: ArchiveTargetType,
  targetId: string,
  confirmName = ''
) => {
  switch (targetType) {
    case 'project':
      return archiveProject(targetId, confirmName);
    case 'milestone':
      return archiveMilestone(targetId);
    case 'case':
      return archiveTestCase(targetId);
    case 'suite':
      return archiveTestSuite(targetId);
    default:
      throw new Error('지원하지 않는 삭제 대상입니다.');
  }
};
