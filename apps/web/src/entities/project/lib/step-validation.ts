import { isBlank } from '@/shared';
import { DESCRIPTION_ERRORS, IDENTIFIER_ERRORS, OWNER_ERRORS, PROJECT_NAME_ERRORS } from '@/entities';

export type ValidationResult = { isValid: true } | { isValid: false; error: string };

export const validateProjectName = (pName: string): ValidationResult => {
  if (isBlank(pName)) return { isValid: false, error: PROJECT_NAME_ERRORS.REQUIRED };
  if (pName.trim().length > 50)
    return { isValid: false, error: PROJECT_NAME_ERRORS.MAX_LENGTH };
  return { isValid: true };
};

export const identifierValidation = (identifier: string): ValidationResult => {
  if (isBlank(identifier)) return { isValid: false, error: IDENTIFIER_ERRORS.REQUIRED };
  if (identifier.trim().length > 16)
    return { isValid: false, error: IDENTIFIER_ERRORS.MAX_LENGTH };
  return { isValid: true };
};

export const identifierConfirmedValidation = (
  identifier: string,
  identifierConfirm: string
): ValidationResult => {
  if (isBlank(identifierConfirm))
    return { isValid: false, error: IDENTIFIER_ERRORS.CONFIRM_REQUIRED };
  if (identifier.trim() !== identifierConfirm.trim())
    return {
      isValid: false,
      error: IDENTIFIER_ERRORS.MISMATCH,
    };
  return { isValid: true };
};

export const validateOwnerName = (ownerName?: string): ValidationResult => {
  if (ownerName == null || isBlank(ownerName)) return { isValid: true };
  if (ownerName.trim().length > 20)
    return { isValid: false, error: OWNER_ERRORS.MAX_LENGTH };
  return { isValid: true };
};

export const validateDescription = (description?: string): ValidationResult => {
  if (description == null || isBlank(description)) return { isValid: true };
  if (description.trim().length > 300)
    return { isValid: false, error: DESCRIPTION_ERRORS.MAX_LENGTH };
  return { isValid: true };
};
