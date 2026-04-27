import { SERVER_ENV } from '@/shared/constants/infra/env.server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';



import { checkDatabaseHealth, closeDatabase, getDatabase } from './drizzle';































// postgres 모듈 모킹 (실제 DB 연결 방지)
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  const mockClient = Object.assign(mockSql, {
    end: vi.fn(),
  });
  return {
    default: vi.fn(() => mockClient),
  };
});

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn((client) => ({
    execute: vi.fn().mockResolvedValue([{ health: 1 }]),
    _: { client },
  })),
}));

describe('데이터베이스 연결 관리 (Database Connection)', () => {
  const originalEnv = process.env;
  beforeEach(async () => {
    vi.clearAllMocks();
    await closeDatabase();
    process.env = { ...originalEnv };
    vi.spyOn(SERVER_ENV, 'SUPABASE_DB_URL', 'get').mockReturnValue(
      'postgres://user:pass@localhost:5432/db'
    );
    vi.spyOn(SERVER_ENV, 'NODE_ENV', 'get').mockReturnValue('development');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('데이터베이스 연결 인스턴스는 싱글톤으로 유지되어야 한다', () => {
    const db1 = getDatabase();
    const db2 = getDatabase();
    expect(db1).toBeDefined();
    expect(db1).toBe(db2);
  });

  it('개발 환경에서 올바른 설정값(Connection Pool 등)으로 클라이언트가 초기화되어야 한다', async () => {
    const postgres = (await import('postgres')).default;
    getDatabase();
    expect(postgres).toHaveBeenCalledWith(
      'postgres://user:pass@localhost:5432/db',
      expect.objectContaining({
        max: 1,
        idle_timeout: 20,
      })
    );
  });

  it('운영(Production) 환경 설정을 올바르게 반영해야 한다', async () => {
    vi.spyOn(SERVER_ENV, 'NODE_ENV', 'get').mockReturnValue('production');
    const postgres = (await import('postgres')).default;
    getDatabase();
    expect(postgres).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        max: 5,
        idle_timeout: 60,
      })
    );
  });

  it('데이터베이스 헬스 체크(Health Check)가 정상 동작해야 한다', async () => {
    const result = await checkDatabaseHealth();
    expect(result).toEqual([{ health: 1 }]);
  });

  it('데이터베이스 연결 종료 시 클라이언트의 end 메서드가 호출되어야 한다', async () => {
    const db = getDatabase();
    const client = (db as any)._.client;
    await closeDatabase();
    expect(client.end).toHaveBeenCalled();
  });
});