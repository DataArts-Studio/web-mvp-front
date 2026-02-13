'use server';
import { ArchiveTargetType } from './types';
import { archiveMilestone } from '@/entities';
import { archiveTestSuite } from '@/entities/test-suite/api/server-actions';
import { archiveProject } from '@/entities/project/api/server-actions';
import { archiveTestCase } from '@/entities/test-case/api/server-actions';


export const archiveAction = async (targetType: ArchiveTargetType, targetId: string) => {
  switch (targetType) {
    case 'project':
      return archiveProject(targetId);
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
