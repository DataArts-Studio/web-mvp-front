'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertAdminAction } from '@/features/auth-gate/lib/admin-gate';
import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementActive,
  updateAnnouncement,
} from '@testea/db';

import { type NoticeFieldErrors, parseNoticeForm } from '../model/validation';

export type NoticeFormState = { errors?: NoticeFieldErrors };

const LIST_PATH = '/notices';

/** 공지 생성. 성공 시 목록으로 리다이렉트. useActionState 시그니처. */
export async function createNoticeAction(
  _prev: NoticeFormState,
  formData: FormData
): Promise<NoticeFormState> {
  await assertAdminAction();

  const parsed = parseNoticeForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    await createAnnouncement(parsed.value);
  } catch (error) {
    console.error('[notices] create failed', error);
    return { errors: { form: '저장 중 오류가 발생했습니다.' } };
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

/** 공지 수정. 성공 시 목록으로 리다이렉트. */
export async function updateNoticeAction(
  id: string,
  _prev: NoticeFormState,
  formData: FormData
): Promise<NoticeFormState> {
  await assertAdminAction();

  const parsed = parseNoticeForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    const updated = await updateAnnouncement(id, parsed.value);
    if (!updated) return { errors: { form: '대상 공지를 찾을 수 없습니다.' } };
  } catch (error) {
    console.error('[notices] update failed', error);
    return { errors: { form: '저장 중 오류가 발생했습니다.' } };
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

/** 활성/비활성 토글. 리스트의 인라인 액션에서 호출. */
export async function toggleNoticeAction(id: string, active: boolean): Promise<void> {
  await assertAdminAction();
  await setAnnouncementActive(id, active);
  revalidatePath(LIST_PATH);
}

/** 공지 삭제. */
export async function deleteNoticeAction(id: string): Promise<void> {
  await assertAdminAction();
  await deleteAnnouncement(id);
  revalidatePath(LIST_PATH);
}
