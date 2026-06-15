export * from './schema';
export * from './client/supabase';
export { getDatabase, checkDatabaseHealth, closeDatabase, type Database } from './client/drizzle';
// drizzle 의 sql 태그를 재노출해 소비 앱이 drizzle-orm 을 직접 의존하지 않고도
// db.execute(sql`...`) 를 같은 인스턴스로 쓸 수 있게 한다.
export { sql } from 'drizzle-orm';
export { getProjectStorageBytes } from './queries/get-project-storage';
export {
  getActiveAnnouncements,
  getCriticalAnnouncement,
  getActiveAnnouncementsWithReadState,
  countUnreadAnnouncements,
  markAnnouncementRead,
  type PublicAnnouncement,
  type AnnouncementWithReadState,
} from './queries/announcements';
