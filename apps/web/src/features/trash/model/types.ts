export type TrashItemType = 'case' | 'suite' | 'milestone';

export interface TrashItem {
  id: string;
  type: TrashItemType;
  title: string;
  deletedAt: Date;
  daysRemaining: number;
  parentName?: string;
}

export interface TrashCommand {
  targetType: TrashItemType;
  targetId: string;
}
