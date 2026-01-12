export type ArchiveTargetType = 'project' | 'milestone' | 'case' | 'suite';

export interface ArchiveCommand {
  targetType: ArchiveTargetType;
  targetId: string;
}