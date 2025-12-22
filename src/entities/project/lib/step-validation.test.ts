import {
  DESCRIPTION_ERRORS,
  IDENTIFIER_ERRORS,
  OWNER_ERRORS,
  PROJECT_NAME_ERRORS,
} from '@/entities';
import { describe, expect, it } from 'vitest';

import {
  identifierConfirmedValidation,
  identifierValidation,
  validateDescription,
  validateOwnerName,
  validateProjectName,
} from './step-validation';

describe('프로젝트 생성: 단계별 유효성검증 단위 테스트', () => {
  it('프로젝트 이름이 공백일경우 REQUIRED 에러를 반환합니다.', () => {
    expect(validateProjectName('')).toEqual({
      isValid: false,
      error: PROJECT_NAME_ERRORS.REQUIRED,
    });
  });

  it('프로젝트 이름이 50글자 초과일경우 MAX_LENGTH 에러를 반환합니다.', () => {
    expect(validateProjectName('a'.repeat(51))).toEqual({
      isValid: false,
      error: PROJECT_NAME_ERRORS.MAX_LENGTH,
    });
  });

  it('프로젝트 이름이 50글자 이하면 검사를 통과합니다.', () => {
    expect(validateProjectName('a'.repeat(50))).toEqual({
      isValid: true,
    });
  });

  it('식별번호를 입력하지 않은 경우 REQUIRED 에러를 반환합니다.', () => {
    expect(identifierValidation('')).toEqual({
      isValid: false,
      error: IDENTIFIER_ERRORS.REQUIRED,
    });
  });

  it('식별번호가 16글자 초과면 MAX_LENGTH 에러를 반환합니다.', () => {
    expect(identifierValidation('a'.repeat(17))).toEqual({
      isValid: false,
      error: IDENTIFIER_ERRORS.MAX_LENGTH,
    });
  });

  it('식별번호확인란을 입력하지 않을 경우 CONFIRM_REQUIRED 에러를 반환합니다.', () => {
    expect(identifierConfirmedValidation('test1234', '')).toEqual({
      isValid: false,
      error: IDENTIFIER_ERRORS.CONFIRM_REQUIRED,
    });
  });

  it('식별번호가 일치하지 않을 경우 MISMATCH 에러를 반환합니다.', () => {
    expect(identifierConfirmedValidation('test1234', 'test123')).toEqual({
      isValid: false,
      error: IDENTIFIER_ERRORS.MISMATCH,
    });
  });

  it('식별번호가 일치할 경우 검사를 통과합니다.', () => {
    expect(identifierConfirmedValidation('test1234', 'test1234')).toEqual({
      isValid: true,
    });
  });

  it('사용자 이름이 최대 길이를 초과하지 않을 경우 검사를 통과합니다.', () => {
    expect(validateOwnerName('a'.repeat(20))).toEqual({
      isValid: true,
    });
  });

  it('사용자 이름이 최대 길이를 초과할 경우 MAX_LENGTH 에러를 반환합니다.', () => {
    expect(validateOwnerName('a'.repeat(21))).toEqual({
      isValid: false,
      error: OWNER_ERRORS.MAX_LENGTH,
    });
  });

  it('설명이 최대 길이를 초과하지 않을 경우 검사를 통과합니다.', () => {
    expect(validateDescription('a'.repeat(300))).toEqual({
      isValid: true,
    });
  });

  it('설명이 최대 길이를 초과하면 에러를 반환합니다.', () => {
    expect(validateDescription('a'.repeat(301))).toEqual({
      isValid: false,
      error: DESCRIPTION_ERRORS.MAX_LENGTH,
    });
  });
});
