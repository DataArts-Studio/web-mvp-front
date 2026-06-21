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

// drizzle 인스턴스 생성 시 전달된 옵션(logger 등)을 캡처해 검증한다.
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn((client, options) => ({
    execute: vi.fn().mockResolvedValue([{ health: 1 }]),
    _: { client },
    __options: options,
  })),
}));

describe('데이터베이스 연결 관리 (Database Connection)', () => {
  const originalEnv = process.env;
  beforeEach(async () => {
    vi.clearAllMocks();
    await closeDatabase();
    process.env = {
      ...originalEnv,
      SUPABASE_DB_URL: 'postgres://user:pass@localhost:5432/db',
      NODE_ENV: 'development',
    };
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

  it('서버리스 단일 커넥션 풀 설정(max/idle/ssl/prepare)으로 클라이언트가 초기화되어야 한다', async () => {
    const postgres = (await import('postgres')).default;
    getDatabase();
    expect(postgres).toHaveBeenCalledWith(
      'postgres://user:pass@localhost:5432/db',
      expect.objectContaining({
        max: 1,
        idle_timeout: 20,
        connect_timeout: 30,
        ssl: 'require',
        prepare: false,
      })
    );
  });

  it('개발 환경에서는 쿼리 로거를 활성화한다', async () => {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    getDatabase();
    expect(drizzle).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ logger: true })
    );
  });

  it('운영(Production) 환경에서는 쿼리 로거를 비활성화한다', async () => {
    process.env.NODE_ENV = 'production';
    const { drizzle } = await import('drizzle-orm/postgres-js');
    getDatabase();
    expect(drizzle).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ logger: false })
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
