'use server';

import { CreateMilestone, Milestone, MilestoneDTO, UpdateMilestone, toCreateMilestoneDTO, toMilestone } from '@/entities/milestone';
import { getDatabase, milestones } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';











type GetMilestonesParams = {
  projectId: string;
};

/**
 * 프로젝트의 모든 마일스톤을 가져옵니다.
 */
export const getMilestones = async ({
  projectId,
}: GetMilestonesParams): Promise<ActionResult<Milestone[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.project_id, projectId));

    const result: Milestone[] = rows.map((row) => toMilestone(row as MilestoneDTO));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return {
      success: false,
      errors: { _milestone: ['마일스톤 목록을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * ID로 특정 마일스톤을 조회합니다.
 */
export const getMilestoneById = async (id: string): Promise<ActionResult<Milestone>> => {
  try {
    const db = getDatabase();
    const [row] = await db.select().from(milestones).where(eq(milestones.id, id));

    if (!row) {
      return {
        success: false,
        errors: { _milestone: ['해당 마일스톤이 존재하지 않습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(row as MilestoneDTO),
    };
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 새로운 마일스톤을 생성합니다.
 */
export const createMilestone = async (input: CreateMilestone): Promise<ActionResult<Milestone>> => {
  try {
    const db = getDatabase();
    const dto = toCreateMilestoneDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(milestones)
      .values({
        id,
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤을 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(inserted as MilestoneDTO),
      message: '마일스톤을 생성하였습니다.',
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤 정보를 수정합니다.
 */
export const updateMilestone = async (
  id: string,
  input: Partial<UpdateMilestone>
): Promise<ActionResult<Milestone>> => {
  try {
    const db = getDatabase();
    // input 데이터를 DTO 형태로 변환하거나 직접 set 절에 구성
    const [updated] = await db
      .update(milestones)
      .set({
        ...(input.title && { title: input.title }),
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        updated_at: new Date(),
      })
      .where(eq(milestones.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤 수정에 실패했습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(updated as MilestoneDTO),
      message: '마일스톤이 수정되었습니다.',
    };
  } catch (error) {
    console.error('Error updating milestone:', error);
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤을 삭제합니다. (Soft Delete)
 */
export const deleteMilestone = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();
    const [deleted] = await db
      .update(milestones)
      .set({ deleted_at: new Date() })
      .where(eq(milestones.id, id))
      .returning();

    if (!deleted) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤 삭제에 실패했습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: deleted.id },
      message: '마일스톤이 삭제되었습니다.',
    };
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};