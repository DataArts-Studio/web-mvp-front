import { desc, eq, sql } from 'drizzle-orm';

import { getDatabase } from '../client/drizzle';
import {
  type AnnouncementCategory,
  type AnnouncementSeverity,
  announcements,
} from '../schema/announcements';

/**
 * 백오피스 운영 공지 관리(BO03) 전용 쿼리.
 *
 * web 사용자측 조회(`queries/announcements.ts`)와 달리 비활성·예약·만료 공지까지 모두 다룬다.
 * 모든 호출은 service_role(BYPASSRLS) 연결을 전제로 한다 (RLS deny-anon).
 */

/** 공지의 노출 상태. published_at / expires_at 으로 계산한다. */
export type AnnouncementStatus = 'scheduled' | 'active' | 'expired';

/** 백오피스 리스트/상세에서 쓰는 공지 한 건. 모든 컬럼 + 계산된 status 노출. */
export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  severity: AnnouncementSeverity;
  pinned: boolean;
  showAsPopup: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: AnnouncementStatus;
};

/** 공지 생성·수정 입력. createdBy 는 인증 도입 전까지 null. */
export type AnnouncementInput = {
  title: string;
  body: string;
  category: AnnouncementCategory;
  severity: AnnouncementSeverity;
  pinned: boolean;
  showAsPopup: boolean;
  /** ISO 문자열. 미지정 시 now() */
  publishedAt?: string | null;
  /** ISO 문자열. null/미지정 시 무기한 */
  expiresAt?: string | null;
};

type AnnouncementRow = typeof announcements.$inferSelect;

function computeStatus(
  row: Pick<AnnouncementRow, 'published_at' | 'expires_at'>
): AnnouncementStatus {
  const now = Date.now();
  if (row.published_at.getTime() > now) return 'scheduled';
  if (row.expires_at && row.expires_at.getTime() <= now) return 'expired';
  return 'active';
}

function toAdmin(row: AnnouncementRow): AdminAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    severity: row.severity,
    pinned: row.pinned,
    showAsPopup: row.show_as_popup,
    publishedAt: row.published_at.toISOString(),
    expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: computeStatus(row),
  };
}

/** 운영 공지 전체를 최신순(published_at desc)으로 반환한다. */
export async function listAnnouncements(): Promise<AdminAnnouncement[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.published_at), desc(announcements.created_at));
  return rows.map(toAdmin);
}

/** 단건 조회. 없으면 null. */
export async function getAnnouncementById(id: string): Promise<AdminAnnouncement | null> {
  const db = getDatabase();
  const [row] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return row ? toAdmin(row) : null;
}

/** 공지 생성. 생성된 행을 반환한다. */
export async function createAnnouncement(input: AnnouncementInput): Promise<AdminAnnouncement> {
  const db = getDatabase();
  const [row] = await db
    .insert(announcements)
    .values({
      title: input.title,
      body: input.body,
      category: input.category,
      severity: input.severity,
      pinned: input.pinned,
      show_as_popup: input.showAsPopup,
      published_at: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();
  return toAdmin(row);
}

/** 공지 수정. 본문/메타 전체를 덮어쓴다. 없으면 null. */
export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput
): Promise<AdminAnnouncement | null> {
  const db = getDatabase();
  const [row] = await db
    .update(announcements)
    .set({
      title: input.title,
      body: input.body,
      category: input.category,
      severity: input.severity,
      pinned: input.pinned,
      show_as_popup: input.showAsPopup,
      published_at: input.publishedAt ? new Date(input.publishedAt) : undefined,
      expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
      updated_at: new Date(),
    })
    .where(eq(announcements.id, id))
    .returning();
  return row ? toAdmin(row) : null;
}

/**
 * 활성/비활성 토글.
 *
 * - 활성화: expires_at 을 NULL 로, published_at 이 미래면 now 로 당겨 즉시 노출.
 * - 비활성화: expires_at 을 now 로 설정해 노출 종료 (published_at 은 보존).
 */
export async function setAnnouncementActive(
  id: string,
  active: boolean
): Promise<AdminAnnouncement | null> {
  const db = getDatabase();
  const now = sql`now()`;
  const [row] = await db
    .update(announcements)
    .set(
      active
        ? {
            expires_at: null,
            published_at: sql`LEAST(${announcements.published_at}, now())`,
            updated_at: now,
          }
        : { expires_at: now, updated_at: now }
    )
    .where(eq(announcements.id, id))
    .returning();
  return row ? toAdmin(row) : null;
}

/** 공지 삭제(hard delete). notification_reads 는 FK cascade 로 함께 정리된다. */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  const db = getDatabase();
  const rows = await db.delete(announcements).where(eq(announcements.id, id)).returning({
    id: announcements.id,
  });
  return rows.length > 0;
}
