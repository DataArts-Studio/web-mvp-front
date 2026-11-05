/**
 * LIKE/ILIKE 패턴에서 특별한 의미를 갖는 문자(%, _, \)를 이스케이프한다.
 *
 * Postgres 의 LIKE 는 기본 이스케이프 문자로 역슬래시를 쓰므로, 사용자가 입력한 검색어를
 * 그대로 패턴에 넣으면 % 와 _ 가 와일드카드로 동작한다 (#411).
 */
export const escapeLikePattern = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** 검색어를 글자 그대로 포함하는 값을 찾는 ILIKE 패턴(%검색어%)을 만든다. */
export const toContainsPattern = (value: string): string => `%${escapeLikePattern(value)}%`;
